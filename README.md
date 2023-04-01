![](https://nodei.co/npm/trie-search.png?downloads=True&stars=True)

# Trie-Search

A Trie is a data structure designed for quick reTRIEval of objects by string search. This was designed for use with a
type-ahead search (e.g. like a dropdown) but could be used in a variety of situations.

This data structure indexes sentences/words to objects for searching by full or partial matches. So you can map 'hello' to an Object,
and then search by 'hel', 'hell', or 'hello' and get the Object or an Array of all objects that match.

By default, sentences/words are split along whitespace boundaries. For example, if your inserted mapping is
'the quick brown fox', this object will be searchable by 'the', 'quick', 'brown', or 'fox' or any of their partials like
'qui' or 'qu' or 'fo'. Boundaries can be customized using the `splitOnRegEx` option explained in Setup below.

By default, the trie-search is now internationalized for a common set of vowels. So if you insert 'ö', then searching on 'o' will
return that result. You can customize this by providing your own `expandRegexes` object.

# Install

```
npm i --save trie-search
yarn add trie-search
```

# Basic Usage (TypeScript)

```
  import TrieSearch from 'trie-search';

  type MyType = {
    someKey : string
    someOtherKeyNotToBeSearched : number
  };

  const trie : TrieSearch<MyType> = new TrieSearch<MyType>('someKey');

  const item1 : MyType = { someKey : 'hello world', someOtherKeyNotToBeSearched : 1 };
  const item2 : MyType = { someKey : 'hello, I like trains', someOtherKeyNotToBeSearched : 1 };

  trie.add(item1);
  trie.add(item2);

  trie.search('he');           // [item1, item2]
  trie.search('her');          // []
  trie.search('hel');          // [item1, item2]
  trie.search('hello trains'); // [item2]
```

# Basic Usage (ES6)

```
  import TrieSearch from 'trie-search';

  const trie = new TrieSearch();

  trie.map('hello', 'world'); // Map 'hello' to the String 'world'
  trie.map('here', 'is a trie search'); // Map 'here' to the String 'is a trie search'

  trie.search('he');    // ['world', 'is a trie search]
  trie.search('her');   // ['is a trie search]
  trie.search('hel');   // ['world']
  trie.search('hello'); // ['world']
```

# Basic Usage (ES5)

```
  var TrieSearch = require('trie-search');
  var trie = new TrieSearch();

  trie.map('hello', 'world'); // Map 'hello' to the String 'world'
  trie.map('here', 'is a trie search'); // Map 'here' to the String 'is a trie search'

  trie.search('he');    // ['world', 'is a trie search]
  trie.search('her');   // ['is a trie search]
  trie.search('hel');   // ['world']
  trie.search('hello'); // ['world']
```

# Backwards Compatibility

Note: I have added the `search(str)` function that functions identically to the old `get(str)` function. The `get(str)` function
remains and can still be used.

# Setup

**`new TrieSearch(keyFields, options)`**

`keyFields`: a single string or an array of strings/arrays representing what fields on added objects are to be used as keys for the
trie search.

`options`: settings to provide to the TrieSearch:

```
    {
      min: 1,                       // Minimum length of a key to store and search. By default this is 1,
                                    // but you might improve performance by using 2 or 3
      ignoreCase: true,             // Self-explanatory
      indexField: undefined,        // Defaults to undefined. If specified, determines which
                                    // rows are unique when using search().
      idFieldOrFunction: undefined, // Honestly, this conflicts a bit with indexField. I need to fix that. This is only used
                                    // when using the UNION_REDUCER, explained in the Examples
      splitOnRegEx: /\s/g           // Regular expression to split all keys into tokens.
                                    // By default this is any whitespace. Set to 'false' if you have
                                    // whitespace in your keys! Set it something else to split along other boundaries.
      expandRegexes: [...]          // By default is an array of international vowels expansions, allowing
                                    // searches for vowels like 'a' to return matches on 'å' or 'ä' etc.
                                    // Set this to an empty array (`[]`) if you want to disable it. Dee top of src/TrieSearch.js 
                                    // file for examples.
    }
```

# Performance

You can test performance yourself using the `node performance.js` process included in the package. Testing on my 2015 Mac Pro with 2.5 GHZ
I get these results:

```
English Dictionary loaded from JSON. Word count:  86036
Memory before index: 55.73046875 MB
Dictionary inserted and indexed into TrieSearch in  484  ms.
Trie Node Count:  280206
Trie Memory Used: 34.78515625 MB
Retrieved "a" items ( 6125 ) in  25  ms.
Retrieved "andr" items ( 17 ) in  5  ms.
Retrieved "android" items ( 1 ) in  0  ms.
```

Note that retrieving longer words takes less time because it has to return fewer results.

# Data Structure

Essentially, the Trie is like a single hashmap of *keys* to one or more *value objects*. You can add any number of keys mapping to any number of objects. A key can map to many objects (for example the word 'Josh' might map to many user objects) and many keys can map to the same object (for example 'Josh' and 'Jung' might map to the same user object). When retrieving (`get('hello')`) by an input string, the Trie returns an Array of all objects that have keys that begin with the entered key (e.g. `'hello'`).

Internally the Trie creates a tree of hashmaps for efficiency. Each hashmap is either a map between a single character in the added keys and an array of matching objects (for a leaf node) or another hashmap that is the next character in all available keys or the hash does not contain the character (no keys exist that match the requested string). This complexity is managed for you.

When you request all items in the Trie that contain a string via the `get(str)` method the Trie concatenates all the leaf node arrays for the entire tree starting at the deepest node for the entered string, eliminates duplicates, and returns that Array. Or it returns nothing if the string does not exist in any entered keys.

For more information on how a Trie works, see [Wikipedia Trie](https://en.wikipedia.org/wiki/Trie)

# Supported Key Types

All key values are converted to a Javascript String object via the `.toString()` method before inserted as keys into the Trie structure.

So the words/sentences `'1234'` and `1234` are functionally equivalent. This is useful if you want to implement your own
`toString()` method on a complex type and `map()` from that to another object.

Inserted value objects are left untouched and can be anything.

For example: `ts.map(123, new Date())` will map `(123).toString()` to a new Date object so effectively this will map the String `'123'` to the Date.

# Examples

## Map Object Keys

```
    import TrieSearch from 'trie-search';

    const peopleByName = {
      'andrew': { age: 21 },
      'andy': { age: 37 },
      'andrea': { age: 25 },
      'annette': { age: 67 },
    };

    const trie = new TrieSearch();

    trie.addFromObject(peopleByName);

    trie.search('a');       // Returns all 4 items above.
    trie.search('an');      // Returns all 4 items above.
    trie.search('and');     // Returns all 3 items above that begin with 'and'
    trie.search('andr');    // Returns all 2 items above that begin with 'andr'
    trie.search('andre');   // Returns all 2 items above that begin with 'andr'
    trie.search('andrew');  // Returns only andrew.
```

## Add Array

```
    import TrieSearch from 'trie-search';

    const people = [
      { name: 'andrew', age: 21 },
      { name: 'andy', age: 37 },
      { name: 'andrea', age: 25 },
      { name: 'annette', age: 67 }
    ];

    const trie = new TrieSearch('name');

    trie.addAll(people);

    trie.search('a');       // Returns all 4 items above.
    trie.search('an');      // Returns all 4 items above.
    trie.search('and');     // Returns all 3 items above that begin with 'and'
    trie.search('andr');    // Returns the 2 items above that begin with 'andr'
    trie.search('andre');   // Returns the 2 items above that begin with 'andr'
    trie.search('andrew');  // Returns only andrew.
```

## Custom Word Boundaries

```
    import TrieSearch from 'trie-search';

    const tasks = [
      { name: 'Start project', description: 'Need to get this thing off the ground!' },
      { name: 'Setup Drag/Drop', description: 'Need to be able to drag / drop things around' },
      { name: 'Talk to Andreas (need advice)', description: '' }
    ];

    const trie = new TrieSearch('name', {
      splitOnRegEx: /[\s\/\(\)]/ // Split on '/' and '(' and ')' and whitespace
    });

    trie.addAll(tasks);

    trie.search('Drag');    // Returns 'Setup Drag/Drop'
    trie.search('Drop');    // Returns 'Setup Drag/Drop'
    trie.search('need');    // Returns 'Talk to Andreas (need advice)'
```

## Deep Key Mapping

Sometimes you might have a nested Object structure. In that case, you might want to map the parent object
based on the contents of one of its child objects.

Note: this does not work if the item at the key is an array. You will need to manually add those items using
the `map()` function. See `Deep Array Mapping` below for how to do that.

```
    import TrieSearch from 'trie-search';

    const people = [
      { name: 'andrew', details: { age: 21 } },
      { name: 'andy', details: { age: 37 } },
      { name: 'andrea', details: { age: 25 } },
      { name: 'annette', details: { age: 67 } }
    ];

    const trie = new TrieSearch([
      'name',               // Searches `object.name`
      ['details', 'age']    // Searches `object.details.age`
    ]);

    trie.addAll(people);

    trie.search('21'); // Returns 'andrew' which has details.age of 21
```

## Deep Array Mapping

If you have an object that has a child that is an array, you might want to add that object's children. In that case, right now
you have to manually do that.

```
    const TrieSearch = require('trie-search');

    const people = [
      { name: 'andrew', tags: ['fishing'] },
      { name: 'andy', tags: ['hunting', 'poetry', 'cattle herding'] },
      { name: 'andrea', tags: [] },
      { name: 'annette', tags: ['poetry', 'laser tag'] }
    ];

    const trie = new TrieSearch(['name']);

    trie.addAll(people); // This will NOT add the tags, just the name

    // Manually add the tags, one by one, using map
    people.forEach(person => {
      person.tags.forEach(tag => {
        trie.map(tag, person);
      });
    });

    ts.search('fish'); // Returns 'andrew' which has 'fishing' as a tag
```

## `options.min`

Specify a minimum search length before results are returned. Keeps the Trie a little faster. Although honestly,
the thing is so fast you probably won't need this until you get above 50,000 items or so.

```
    import TrieSearch from 'trie-search';

    const people = [
      { name: 'andrew', age: 21 },
      { name: 'andy', age: 37 },
      { name: 'andrea', age: 25 },
      { name: 'annette', age: 67 }
    ];

    const trie = new TrieSearch('name', {min: 3});

    trie.addAll(people);

    trie.search('a');       // Returns empty array, too short a search (< 3 minimum chars)
    trie.search('an');      // Returns empty array, too short a search
    trie.search('and');     // Returns all 3 items above that begin with 'and'
    trie.search('andr');    // Returns the 2 items above that begin with 'andr'
    trie.search('andre');   // Returns the 2 items above that begin with 'andr'
    trie.search('andrew');  // Returns only andrew.
```

## `options.indexField = 'ix'`

By default, the `HashArray` object (which `TrieSearch` uses) does not verify object uniqueness by the object itself, but instead by an index
field (like an id field) on that object.

As a result, in order for `search()` to be used with multiple words, it is important that a field is used to identify each record in the 
TrieSearch, similar to a index in a database. If we do not specify this, a search on multiple words could return the object more than once.

You can specify this using the `indexField` option:

```
    import TrieSearch from 'trie-search';

    const people = [
      { ix: 1, name: 'andrew', location: 'sweden', age: 21 },
      { ix: 2, name: 'andrew', location: 'brussels', age: 37 },
      { ix: 3, name: 'andrew', location: 'johnsonville', age: 25 }
    ];

    const trie = new TrieSearch('name', { min: 3, indexField: 'ix' });

    trie.addAll(people);

    trie.search('andrew');        // Returns all items
    trie.search('andrew sweden'); // Returns only the andrew who is in sweden, and only once, even though it matches both 'andrew' and 'sweden'.
```

## `search()` OR of multiple phrases

```
    import TrieSearch from 'trie-search';

    const people = [
      { name: 'andrew', age: 21, zip: 60600 },
      { name: 'andy', age: 37, zip: 60601 },
      { name: 'andrea', age: 25, zip: 60602 },
      { name: 'joseph', age: 67, zip: 60603 }
    ];

    const trie = new TrieSearch(['name', 'age', 'zip']);

    trie.addAll(people);

    trie.search('andre'); // Returns andrew AND andrea.
    trie.search(['andre', '25']); // Returns andrew AND andrea
    trie.search(['andre', 'jos']); // Returns andrew AND joseph
    trie.search(['21', '67']); // Returns andrew AND joseph
    trie.search(['21', '60603']); // Returns andrew AND joseph
```

## `search()` AND multiple phrases custom reducer / accumulator

```
    import TrieSearch from 'trie-search';
    
    const people = [
      { name: 'andrew', age: 21, zip: 60600, id: 1 }, // person1
      { name: 'andrew', age: 37, zip: 60601, id: 2 }, // person2
      { name: 'andrew', age: 25, zip: 60602, id: 3 }, // person3
      { name: 'andrew', age: 37, zip: 60603, id: 4 }  // person4
    ];

    const trie = new TrieSearch(['name', 'age', 'zip'], {
      idFieldOrFunction: 'id' // Required to uniquely identify during union (AND)
    });

    trie.addAll(people);

    trie.search(['andrew', '25'], TrieSearch.UNION_REDUCER); // [person3]
    trie.search(['andrew', '50'], TrieSearch.UNION_REDUCER); // []
    trie.search(['andrew', '37'], TrieSearch.UNION_REDUCER); // [person2, person4]
```

# Testing

```
    $ npm i -g jest
    $ npm test

    Test Suites: 1 passed, 1 total
    Tests:       81 passed, 81 total
    Snapshots:   0 total
    Time:        1.754 s
```

# Contributing

Feel free to fork and make changes or submit a Pull Request :) I'm pretty busy but will eventually get around to getting your
changes published.

# License

The MIT License (MIT)

Copyright (c) 2021 Joshua Jung

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
