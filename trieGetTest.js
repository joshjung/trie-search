var TrieSearch = require('./src/TrieSearch');
var dict = require('./dictionary.json');
const NUM_ITERATIONS = 100

/**
 * Function to time a block of code. Returns avg time to execute the given function.
 * @param {*} f - Function to time
 * @param {*} count - Number of iterations to continously run the block of code
 */
function timeFunction(f, count) {
    let results = []
    for (let i = 0; i < count; i++) {
        let startTime = new Date().getTime()
        f()
        let endTime = new Date().getTime()
        results.push(endTime - startTime)
    }

    let timeSum = 0
    results.map((r) => {
        timeSum += r
    })
    return timeSum / count
}

// Turn off caching
var ts = new TrieSearch(
    null,
    {
        cache: false,
    }
);
ts.addFromObject(dict);
console.log('Dictionary loaded into TrieSearch.');

// NOTE: Choosing s since that seems to have the largest number of results - 9950
let avgTimeWithoutLimit = timeFunction(function () {
    ts.get('s')
}, NUM_ITERATIONS)

// Get the average time
console.log("Avg time - ", avgTimeWithoutLimit)