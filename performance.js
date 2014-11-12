/*=========================================================*\
 * Runs a performance test on the trie by reading in an
 * entire dictionary and checking memory and speed to load.
\*=========================================================*/

var TrieSearch = require('./src/TrieSearch');
var dict = require('./dictionary.json');
var util = require('util');


count = 0;
for (var key in dict)
count++;
console.log('Dictionary loaded from JSON. Entries: ', count);
var memStart = process.memoryUsage().heapTotal / 1048576;
console.log('Memory: ' + memStart + ' MB');
var ts = new TrieSearch();
ts.addFromObject(dict);

console.log('Dictionary loaded into TrieSearch.');
console.log('Sample of \'android\'', ts.get('android'));

console.log('Trie Node Count: ', ts.size);

var memEnd = process.memoryUsage().heapTotal / 1048576;
console.log('Trie Memory Used: ' + (memEnd - memStart) + ' MB');