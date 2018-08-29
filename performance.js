/*=========================================================*\
 * Runs a performance test on the trie by reading in an
 * entire dictionary and checking memory and speed to load.
\*=========================================================*/

var TrieSearch = require('./src/TrieSearch');
var dict = require('./dictionary.json');
var util = require('util');

var lookups = ['a','e', 's', 't', 'ab', 'de', 'th', 'sh', 'ch', 'up', 'and', 'pre', 'post'];

function run(options) {
  count = 0;
  for (var key in dict)
    count++;

  var timeStart = new Date().getTime();
  var memStart = process.memoryUsage().heapTotal / 1048576;
  var ts = new TrieSearch(options);
  ts.addFromObject(dict);

  console.log('\tSearch Items Added: ', count);
  console.log('\tTrie Node Count: ', ts.size);

  var time = new Date().getTime() - timeStart;
  var memEnd = process.memoryUsage().heapTotal / 1048576;
  console.log('\tTrie Memory Used: ' + (memEnd - memStart) + ' MB');
  console.log('\tTime spent Inserting (ms)', time);

  timeStart = new Date().getTime();

  for (var i = 0; i < lookups.length; i++) {
    ts.get(lookups[i]);
  }

  time = new Date().getTime() - timeStart;
  console.log('\tTime spent retrieving (ms)', time);
}

console.log('-------------- Running enableMisspellings=false --------------');
run();

console.log('-------------- Running enableMisspellings=true --------------');
run({
  enableMisspellings: true
});
