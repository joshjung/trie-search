![](https://nodei.co/npm/trie-search.png?downloads=True&stars=True)

Trie-Search
==========

A Trie is a data structure designed for rapid reTRIEval of objects.

Most Trie implementations in NPM right now only let you add and then determine if a word or phrase exists in the Trie.

This data structure allows you to map keys to objects, allowing rapid search of whatever dictionary you like.

Note: as of now, keys are split along word boundaries! For example, if your key is 'the quick brown fox', the TrieSearch will be searchable by 'the', 'quick', 'brown', or 'fox'.

Setup
=====

**`new TrieSearch(keyFields, options)`**

`keyFields`: a single string or an array of strings representing what fields on added objects are to be used as keys for the trie search.

`options`:

    {
      min: # // Minimum length of a key to store and search. By default this is 1, but you might improve performance by using 2 or 3
      ignoreCase: true OR false // Defaults to true
    }

Example 1 (from Object)
======================

    var TrieSearch = require('trie-search');

    var object = {
      'andrew': {age: 21},
      'andy': {age: 37},
      'andrea': {age: 25},
      'annette': {age: 67},
    };

    var ts = new TrieSearch();

    ts.addFromObject(object);

    ts.get('a'); // Returns all 4 items above.
    ts.get('an'); // Returns all 4 items above.
    ts.get('and'); // Returns all 3 items above that begin with 'and'
    ts.get('andr'); // Returns all 2 items above that begin with 'andr'
    ts.get('andre'); // Returns only andrew.

Example 2 (add items)
======================

    var TrieSearch = require('trie-search');

    var objects = [
      {name: 'andrew', age: 21},
      {name: 'andy', age: 37},
      {name: 'andrea', age: 25},
      {name: 'annette', age: 67}
    ];

    var ts = new TrieSearch('name');

    objects.forEach(function (item) {
      ts.add(item);
    });

    ts.get('a'); // Returns all 4 items above.
    ts.get('an'); // Returns all 4 items above.
    ts.get('and'); // Returns all 3 items above that begin with 'and'
    ts.get('andr'); // Returns all 2 items above that begin with 'andr'
    ts.get('andre'); // Returns only andrew.

Example 3 (options.min == 3)
======================

    var TrieSearch = require('trie-search', {min: 3});

    var objects = [
      {name: 'andrew', age: 21},
      {name: 'andy', age: 37},
      {name: 'andrea', age: 25},
      {name: 'annette', age: 67}
    ];

    var ts = new TrieSearch('name');

    objects.forEach(function (item) {
      ts.add(item);
    });

    ts.get('a'); // Returns empty array, too short of search
    ts.get('an'); // Returns empty array, too short of search
    ts.get('and'); // Returns all 3 items above that begin with 'and'
    ts.get('andr'); // Returns all 2 items above that begin with 'andr'
    ts.get('andre'); // Returns only andrew.
    
Testing
=======

    >mocha

    START

      ․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․

      61 passing (25ms)

License
=======

The MIT License (MIT)

Copyright (c) 2014 Joshua Jung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
