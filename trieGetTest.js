/**
 * A performance test file to compare the difference in performance of getting 
 * from the Trie when using limits. This can be run by 
 * `node trieGetTest.js`
 */

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

// Testing without limit
// NOTE: Choosing s since that seems to have the largest number of results - 9950
let avgTimeWithoutLimit = timeFunction(function () {
    ts.get('s')
}, NUM_ITERATIONS)
console.log("Avg time without-limit \t\t - ", avgTimeWithoutLimit, " ms")

// Testing with limit
var avgTimeWithLimit = timeFunction(function () {
    ts.get('s', null, 10)
}, NUM_ITERATIONS)
console.log("Avg time with-limit 10 \t\t - ", avgTimeWithLimit, " ms")

// Testing with limit 100
var avgTimeWithLimit = timeFunction(function () {
    ts.get('s', null, 100)
}, NUM_ITERATIONS)
console.log("Avg time with-limit 100 \t - ", avgTimeWithLimit, " ms")

// Testing with limit 1000
var avgTimeWithLimit = timeFunction(function () {
    ts.get('s', null, 1000)
}, NUM_ITERATIONS)
console.log("Avg time with-limit 1000 \t - ", avgTimeWithLimit, " ms")

// Testing with limit 10000
var avgTimeWithLimit = timeFunction(function () {
    ts.get('s', null, 10000)
}, NUM_ITERATIONS)
console.log("Avg time with-limit 10k \t - ", avgTimeWithLimit, " ms")