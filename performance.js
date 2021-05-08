/*=========================================================*\
 * Runs a performance test on the trie by reading in an
 * entire dictionary and checking memory and speed to load.
\*=========================================================*/

var TrieSearch = require('./src/TrieSearch');
var dict = require('./dictionary.json');


count = 0;

// Count the keys in the dictionary
for (var key in dict) count++;

console.log('English Dictionary loaded from JSON. Word count: ', count);
var memStart = process.memoryUsage().heapTotal / 1048576;
console.log('Memory before index: ' + memStart + ' MB');
var startTime = new Date();
var ts = new TrieSearch();
ts.addFromObject(dict);

var endTime = new Date();
console.log('Dictionary inserted and indexed into TrieSearch in ', endTime.getTime() - startTime.getTime(), ' ms.');

console.log('Trie Node Count: ', ts.size);

var memEnd = process.memoryUsage().heapTotal / 1048576;
console.log('Trie Memory Used: ' + (memEnd - memStart) + ' MB');

var startTime = new Date();
var results = ts.get('a');
var endTime = new Date();
console.log('Retrieved "a" items (', results.length, ') in ', endTime.getTime() - startTime.getTime(), ' ms.');

var startTime = new Date();
var results = ts.get('andr');
var endTime = new Date();
console.log('Retrieved "andr" items (', results.length, ') in ', endTime.getTime() - startTime.getTime(), ' ms.');

var startTime = new Date();
var results = ts.get('android');
var endTime = new Date();
console.log('Retrieved "android" items (', results.length, ') in ', endTime.getTime() - startTime.getTime(), ' ms.');