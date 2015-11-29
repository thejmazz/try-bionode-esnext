import Promise from 'bluebird';
import _ from 'lodash';
import tool from 'tool-stream';
import es from 'event-stream';
import bio from 'bionode';

const ø = Object.create(null);

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

    return new Promise( (resolve, reject) => {
        try {
            func.apply(ø, _(args).concat(resolve).value());
        } catch(e) {
            console.error(e);
        }
    });
}

async function runner() {
    let urls = await bioP(['ncbi', 'urls'], ['assembly', 'Acromyrmex']);
    console.log(`callback: ${urls[0].genomic.fna}`);
}

runner();

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
