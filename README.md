![](https://nodei.co/npm/trie-search.png?downloads=True&stars=True)

> Important! 2.2.0 introduces breaking changes. See Release Notes below.

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

There is also a `remove(str: string)` method that will remove every node that has the exact `str` string passed as an argument, as 
well as the corresponding diacritic variants. This method also works for strings that have multiple words separated by spaces.

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

  // Add and index items one at a time
  trie.add(item1);
  trie.add(item2);

  // Search!
  trie.search('he');           // [item1, item2]
  trie.search('her');          // []
  trie.search('hel wor');      // [item1]
  trie.search('hel');          // [item1, item2]

  // Remove things for specific words
  trie.remove('hello world');  // item1 is now removed ONLY for the search for 'hello' or 'world'
  trie.search('hello');        // [item2]
  trie.search('world');        // []
  trie.remove('trains');       // item2 is now gone ONLY for the search for 'trains'
  trie.search('trains');       // []
  
```

# Usage (ES6 `import`)

```
  import TrieSearch from 'trie-search';

  const trie = new TrieSearch();

  // You can explicitly map strings to objects
  trie.map('hello', { value: 'world' }); // Map 'hello' to an Object
  trie.map('here', { value: 'is a trie search' }); // Map 'here' to a different Object

  trie.search('he');    // [{ value: 'world' }, { value: 'is a trie search' }]
  trie.search('her');   // [{ value: 'is a trie search' }]
  trie.search('hel');   // [{ value: 'world' }]
  trie.search('hello'); // [{ value: 'world' }]
```

# Construction

`new TrieSearch(keyFields, options)`

## Options

`keyFields`: a single string or an array of strings/arrays representing what fields on added objects are to be used as keys for the
trie search.

`options`: settings to provide to the TrieSearch:

`options.min`: Minimum length of a key to store and search. By default this is 1

`options.ingoreCase`: Ignore case of characters when searching

`idFieldOrFunction`: Used to determine a unique string id for each inserted item, especially used by the reducer. By
default this is a function that uses the provided keyFields to build up an md5 unique id that is stored on each item
in the `$tsid` field. Obviously if you don't want this functionality just provide a string key field or a function.

`splitOnRegEx`: Regular Expression to split all keys into tokens. By default this is any whitespace or punctuation. 
Set to 'false' if you want to never split string values! Set it to a regular expression to split along other boundaries.
Default regular expression is now `/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g`.

`splitOnGetRegEx`: When performing a `search(...)` (formerly called a `get(...)`) this Regular Expression is run on the
search phrase to split it into sub-phrases that are individually searched and then their resulting match arrays are
reduced via the `defaultReducer` to return the final array result of matched items. By default this is set to be
identical to whatever value is in `splitOnRegEx`.

`expandRegexes`: By default is an array of international vowels expansions, allowing searches for vowels like 'a' to 
return matches on 'å' or 'ä' etc. Set this to an empty array (`[]`) if you want to disable it. See top of `src/TrieSearch.js`
file for examples.

`defaultReducer`: When doing a `search`, if you provide more than one word or phrase the internal engine performs more
than one lookup, once for each word. This produces multiple arrays that then need to be reduced to a single array. The
default is `TrieSearch.UNION_REDUCER` which only returns the union of all of the search matched arrays, effectively
performing an "AND" on every word. This can be used if you want to do a custom sort on the returned search results, for
example if you wanted to do some post-processing to figure out which items most closely matched and have those at the
top. By default no sorting of search results is provided, but this is where you could do it.

`maxCacheSize`: By default, when you do a `search(...)` an internal cache remembers each search phrase and maps it to its
results, for faster lookup next time the same phrase is searched. This is the maximum number of phrases to cache. Defaults
to `1024`.

`cache`: Set to `false` to turn off the internal caching mechanism for `search(...)` calls. Default is `true`.

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

The default is to split words on whitespace and the usual punctuation (`/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g`):

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

## `options.idFieldOrFunction = ...`

By default, TrieSearch does not verify object uniqueness by the object itself, but instead by an index field on that 
object which is assumed to be unique. 

When `search(...)` is passed multiple words, it splits them up and does multiple internal searches and then has to
reduce the multiple arrays back into one final resulting array. But in this process, it needs to know which items
are duplicates, and so it needs to be able eto know what each items unique id is.

By default, `TrieSearch` tries to generate a unique id for each item and cache it via the `$tsid` field.

You might not want this!

You can customize this behavior via the `idFieldOrFunction`, like so:

```
    import TrieSearch from 'trie-search';

    const people = [
      { id: 1, name: 'andrew', location: 'sweden', age: 21 },
      { id: 2, name: 'andrew', location: 'brussels', age: 37 },
      { id: 3, name: 'andrew', location: 'johnsonville', age: 25 }
    ];

    const trie = new TrieSearch('name', { min: 3, idFieldOrFunction: 'id' });

    trie.addAll(people);

    trie.search('andrew');        // Returns all items
    trie.search('andrew sweden'); // Returns only the andrew who is in sweden, and only once, even though it matches both 'andrew' and 'sweden'.
```

Or with a function like this:

```
    new TrieSearch('name', { min: 3, idFieldOrFunction: item => item.id });
```

# Performance

You can test performance yourself using the `node performance.js` process included in the package. Testing on my 2024 Mac
Studio M4 Pro I get these results:

```
English Dictionary loaded from JSON. Word count:  86036
Memory before index: 52.72265625 MB
Dictionary inserted and indexed into TrieSearch in  477  ms.
Trie Node Count:  264508
Trie Memory Used: 42.65234375 MB
Retrieved "a" items ( 6251 ) in  8  ms.
Retrieved "andr" items ( 18 ) in  0  ms.
Retrieved "android" items ( 1 ) in  0  ms.
```

> Note! Retrieving longer words takes less time because it has to return fewer results.

# Testing

Testing is performed through Jest.

```
    $ npm i -g jest
    $ npm test

    Test Suites: 1 passed, 1 total
    Tests:       103 passed, 103 total
    Snapshots:   0 total
    Time:        0.99 s, estimated 1 s
```

# Contributing

Feel free to fork and make changes or submit a Pull Request :) I'm pretty busy but will eventually get around to getting your
changes published.

# Release Notes / Changelog

## 2.2.0 Breaking Changes

Items that are added are now automatically internally assigned a `$tsid` if no `idFieldOrFunction` is provided. This
greatly reduced the internal complexity of trying to deduplicate results when searching by multiple phrases or words.

If you want to skip this feature, you will need to implement the `idFieldOrFunction` yourself.

**This means that without a custom `idFieldOrFunction`, all items inserted into the Trie must be an Object capable of 
having a field `$tsid` assigned to them.**

Additionally, as a part of this change, the entire `search` deduplication and aggregation process has been rewritten,
which is what is introducing breaking changes.

Now, if you `search('hello world')` the result will only be those items that both are indexed by `'hello'` AND `'world'`. 
The same applies to `search(['hello', 'world'])`.

However, now if you split phrases yourself you need to be more careful. Search phrases that are explicitly contained in
an array, like `search(['hello world'])` will only return a result for an exact match on 'hello world'. By default this
will never happen because `splitOnRegEx` by default splits on whitespace every time you add an item to the Trie. Since
it splits on whitespace, nothing will every be indexed by `'hello world'`.

Quite a bit of this is customizable through the `splitOnRegEx`, `splitOnGetRegEx`, and `defaultReducer` options. Please
log a bug if you want this changed or tweaked.

Another breaking update is that by default the `splitOnRegEx` and `splitOnGetRegEx` now split on both whitespace and 
punctuation.

In the meantime, if this update breaks your code, use `2.1.0`.

# License

The MIT License (MIT)

Copyright (c) 2024 Joshua Jung

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
