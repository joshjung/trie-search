![](https://nodei.co/npm/trie-search.png?downloads=True&stars=True)

Trie-Search
===========

A Trie is a data structure designed for rapid reTRIEval of objects. This was designed for use with a type-ahead search (e.g.
like a web dropdown).

This data structure allows you to map sentences/words to objects, allowing rapid indexing and searching of massive dictionaries
by partial matches. By default, sentences/words are split along word boundaries. For example, if your inserted mapping is
'the quick brown fox', this object will be searchable by 'the', 'quick', 'brown', or 'fox' or any of their partials like
'qui' or 'qu' or 'fo'. Word boundaries can be customized using the `splitOnRegEx` option explained in Setup below.

By default, the trie-search is now internationalized for a common set of vowels. So if you insert 'ö', then searching on 'o' will
return that result. You can customize this by providing your own `expandRegexes` object. See the source for details.

Setup
=====

**`new TrieSearch(keyFields, options)`**

`keyFields`: a single string or an array of strings representing what fields on added objects are to be used as keys for the
trie search.

`options`: settings to provide to the TrieSearch. To be expanded as functionality grows, but current structure is:

    {
      min: 1,                 // Minimum length of a key to store and search. By default this is 1,
                              // but you might improve performance by using 2 or 3
      ignoreCase: true,
      indexField: undefined,  // Defaults to undefined. If specified, determines which
                              // rows are unique when using get().
      splitOnRegEx: /\s/g     // Default regular expression to split all keys into tokens.
                              // By default this is any whitespace. Set to 'false' if you have
                              // whitespace in your keys!,
      expandRegexes: [...]    // By default is an array of international vowels expansions, allowing
                              // searches for vowels like 'a' to return matches on 'å' or 'ä' etc.
                              // Set this to an empty array (`[]`) if you want to disable it. For
                              // details on customization, see top of src/TrieSearch.js file for
                              // examples.
    }

Data Structure
==============

Essentially, the Trie is like a single hashmap of *keys* to one or more *value objects*. You can add any number of
keys mapping to any number of objects. A key can map to many objects (for example the word 'Josh' might map to many user objects) and many keys can map to the same object (for example 'Josh' and 'Jung' might map to the same user object). When retrieving (`get('hello')`) by an input string, the Trie returns an Array of all objects that have keys that begin with the entered key (e.g. `'hello'`).

Internally the Trie creates a tree of hashmaps for efficiency. Each hashmap is either a map between a single character in the added keys and an array of matching objects (for a leaf node) or another hashmap that is the next character in all available keys or the hash does not contain the character (no keys exist that match the requested string). This complexity is managed for you.

When you request all items in the Trie that contain a string via the `get(str)` method the Trie concatenates all the leaf node arrays for the entire tree starting at the deepest node for the entered string, eliminates duplicates, and returns that Array. Or it returns nothing if the string does not exist in any entered keys.

For more information on how a Trie works, see: https://en.wikipedia.org/wiki/Trie

Supported Key Types
===================

All key values are converted to a Javascript String object via the `.toString()` method before inserted as keys into the Trie structure.

So the words/sentences `'1234'` and `1234` are functionally equivalent. This is useful if you want to implement your own
`toString()` method on a complex type.

Inserted value objects are left untouched and can be anything.

For example: `ts.map(123, new Date())` will map `(123).toString()` to a new Date object so effectively this will map the String `'123'` to the Date.

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
    ts.get('andre'); // Returns all 2 items above that begin with 'andr'
    ts.get('andrew'); // Returns only andrew.

Example 2 (add Array of items)
======================

    var TrieSearch = require('trie-search');

    var arr = [
      {name: 'andrew', age: 21},
      {name: 'andy', age: 37},
      {name: 'andrea', age: 25},
      {name: 'annette', age: 67}
    ];

    var ts = new TrieSearch('name');

    ts.addAll(arr);

    ts.get('a'); // Returns all 4 items above.
    ts.get('an'); // Returns all 4 items above.
    ts.get('and'); // Returns all 3 items above that begin with 'and'
    ts.get('andr'); // Returns all 2 items above that begin with 'andr'
    ts.get('andre'); // Returns all 2 items above that begin with 'andr'
    ts.get('andrew'); // Returns only andrew.

Example 3 (custom mappings)
===========================

In some cases, you may want to directly add a mapping from an arbitrary string to an object.

Note: the `map()` method is used internally for `add()` and `addAll()` so this is the "raw"
way of adding things to the Trie.

    var TrieSearch = require('trie-search');
    var ts = new TrieSearch('irrelevantForMapMethod');

    ts.map('word', 123);

    ts.get('wo'); // Returns [123]
    ts.get('wor'); // Returns [123]
    ts.get('word'); // Returns [123]

Example 4 (deep key lookup)
======================

    var TrieSearch = require('trie-search');

    var arr = [
      {name: 'andrew', details: {age: 21}},
      {name: 'andy', details: {age: 37}},
      {name: 'andrea', details: {age: 25}},
      {name: 'annette', details: {age: 67}}
    ];

    var ts = new TrieSearch([
      'name', // Searches `object.name`
      ['details', 'age'] // `Search object.details.age`
    ]);

    ts.addAll(arr);

    ts.get('21'); // Returns 'andrew' which has age of 21

Example 5 (options.min == 3)
======================

    var TrieSearch = require('trie-search');

    var arr = [
      {name: 'andrew', age: 21},
      {name: 'andy', age: 37},
      {name: 'andrea', age: 25},
      {name: 'annette', age: 67}
    ];

    var ts = new TrieSearch('name', {min: 3});

    ts.addAll(arr);

    ts.get('a'); // Returns empty array, too short of search
    ts.get('an'); // Returns empty array, too short of search
    ts.get('and'); // Returns all 3 items above that begin with 'and'
    ts.get('andr'); // Returns all 2 items above that begin with 'andr'
    ts.get('andre'); // Returns all 2 items above that begin with 'andr'
    ts.get('andrew'); // Returns only andrew.
    
Example 6 (options.indexField = 'ix')
======================

By default, the HashArray object (which TrieSearch uses) does not - for the sake of speed - verify object uniqueness by the object itself, but instead by a field on that object.

As a result, in order for `get()` to be used with multiple words, it is important that a field is used to identify each record in the TrieSearch, similar to a index in a database.

    var TrieSearch = require('trie-search');

    var arr = [
      {ix: 1, name: 'andrew', location: 'sweden', age: 21},
      {ix: 2, name: 'andrew', location: 'brussels', age: 37},
      {ix: 3, name: 'andrew', location: 'johnsonville', age: 25}
    ];

    var ts = new TrieSearch('name', {min: 3, indexField: 'ix'});

    ts.addAll(arr);

    ts.get('andrew');        // Returns all items
    ts.get('andrew sweden'); // Returns all items without indexField. Returns only andrew in sweden with indexField.

Example 7 (get() OR of multiple phrases)
======================

    var TrieSearch = require('trie-search');

    var arr = [
      {name: 'andrew', age: 21, zip: 60600},
      {name: 'andy', age: 37, zip: 60601},
      {name: 'andrea', age: 25, zip: 60602},
      {name: 'joseph', age: 67, zip: 60603}
    ];

    var ts = new TrieSearch(['name', 'age', 'zip']);

    ts.addAll(arr);

    ts.get('andre'); // Returns andrew AND andrea.
    ts.get(['andre', '25']); // Returns andrew AND andrea
    ts.get(['andre', 'jos']); // Returns andrew AND joseph
    ts.get(['21', '67']); // Returns andrew AND joseph
    ts.get(['21', '60603']); // Returns andrew AND joseph

Example 8 (get() AND multiple phrases custom reducer / accumulator)
======================

    var TrieSearch = require('trie-search');
    
    var arr = [
      {name: 'andrew', age: 21, zip: 60600, id: 1}, // person1
      {name: 'andrew', age: 37, zip: 60601, id: 2}, // person2
      {name: 'andrew', age: 25, zip: 60602, id: 3}, // person3
      {name: 'andrew', age: 37, zip: 60603, id: 4}  // person4
    ];

    var ts = new TrieSearch(['name', 'age', 'zip'], {
      idFieldOrFunction: 'id' // Required to uniquely identify during union (AND)
    });

    ts.addAll(arr);

    ts.get(['andrew', '25'], TrieSearch.UNION_REDUCER); // [person3]
    ts.get(['andrew', '50'], TrieSearch.UNION_REDUCER); // []
    ts.get(['andrew', '37'], TrieSearch.UNION_REDUCER); // [person2, person4]

Testing
=======

    $ npm i -g mocha

    $ mocha

    START

      ․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․․

      73 passing (25ms)

License
=======

The MIT License (MIT)

Copyright (c) 2018 Joshua Jung

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
