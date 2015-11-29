import Promise from 'bluebird';
import _ from 'lodash';
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
    console.log(urls[0].genomic.fna);
}

runner();
