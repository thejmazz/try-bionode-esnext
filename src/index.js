import fs from 'fs';
import Promise from 'bluebird';
import rp from 'request-promise';
import _ from 'lodash';
import tool from 'tool-stream';
import es from 'event-stream';
import bio from 'bionode';

// ==== introduction to patterns ====
// Can use bionode modules in 3 different ways:

// 1. The Callback pattern
/*
    bio.ncbi.urls('assembly', 'Acromyrmex', function(urls) {
        console.log(urls[0].genomic.fna)
    })
 */
// reimplemented (quickly) with Promises+Generators=async/await:
async function bioP(modules, args) {
    let func = bio;
    for (let mod of modules) {
        func = func[mod];
    }

    const ø = Object.create(null);
    return new Promise( (resolve, reject) => {
        try {
            func.apply(ø, _(args).concat(resolve).value());
        } catch(e) {
            console.error(e);
        }
    });
}

(async function() {
    let urls = await bioP(['ncbi', 'urls'], ['assembly', 'Acromyrmex']);
    console.log(`callback: ${urls[0].genomic.fna}`);
})();

// 2. The event pattern
// Too much data at once will crash callbacks, instead get chunks of data
bio.ncbi.urls('assembly', 'Acromyrmex').on('data', (url) => {
    console.log(`chunk: ${url.genomic.fna}`);
});

// 3. The pipe pattern
bio.ncbi.urls('assembly', 'Acromyrmex')
    .pipe(tool.extractProperty('genomic.fna'))
    .pipe(es.through(function write(data) {
        this.emit('data', `pipe: ${data}\n`);
    }))
    .pipe(process.stdout);

// ==== bionode-fasta =====
// First, lets download and write to the filesystem a fasta file from ncbi
// (not using bionode-ncbi since that returns an already parsed JSON fasta object)
async function fastaDownload(pId) {
    let fastaFile = await rp(`http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.cgi?db=protein&id=${pId}&rettype=fasta&retmode=text`)
    fs.writeFileSync(`${__dirname}/${pId}.fasta`, fastaFile);
    console.log(`wrote ${pId}.fasta`);
}
(async function() {
    const pId = '50659069'
    await fastaDownload(pId);
    // Then, lets use bionode.fasta to parsa fasta into a JSON buffer
    // PS, notice how we aren't inside a callback right now ;)
    // (though you can only `await` inside an `async` function)
    fs.createReadStream(`${__dirname}/${pId}.fasta`)
        .pipe(bio.fasta())
        .pipe(es.through(function write(data) {
            this.emit('data', `fasta parse: \n${data}`);
        }))
        .pipe(process.stdout);
})();
