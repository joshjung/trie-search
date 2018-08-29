var HashArray = require('hasharray');

var MAX_CACHE_SIZE = 64;

var IS_WHITESPACE = /^[\s]*$/;

var DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES = [
  {
    regex: /[åäàáâãæ]/ig,
    alternate: 'a'
  },
  {
    regex: /[èéêë]/ig,
    alternate: 'e'
  },
  {
    regex: /[ìíîï]/ig,
    alternate: 'i'
  },
  {
    regex: /[òóôõö]/ig,
    alternate: 'o'
  },
  {
    regex: /[ùúûü]/ig,
    alternate: 'u'
  },
  {
    regex: /[æ]/ig,
    alternate: 'ae'
  }
];

String.prototype.replaceCharAt=function(index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
};

var TrieSearch = function (keyFields, options) {
  if (typeof keyFields === 'object') {
    options = keyFields;
    keyFields = undefined;
  }

  this.options = options || {};

  // Default ignoreCase to true
  this.options.ignoreCase = (this.options.ignoreCase === undefined) ? true : this.options.ignoreCase;
  this.options.maxCacheSize = this.options.maxCacheSize || MAX_CACHE_SIZE;
  this.options.cache = this.options.hasOwnProperty('cache') ? this.options.cache : true;
  this.options.splitOnRegEx = this.options.hasOwnProperty('splitOnRegEx') ? this.options.splitOnRegEx : /\s/g;
  this.options.splitOnGetRegEx = this.options.hasOwnProperty('splitOnGetRegEx') ? this.options.splitOnGetRegEx : this.options.splitOnRegEx;
  this.options.min = this.options.min || 1;
  this.options.keepAll = this.options.hasOwnProperty('keepAll') ? this.options.keepAll : false;
  this.options.keepAllKey = this.options.hasOwnProperty('keepAllKey') ? this.options.keepAllKey : 'id';
  this.options.idFieldOrFunction = this.options.hasOwnProperty('idFieldOrFunction') ? this.options.idFieldOrFunction : undefined;
  this.options.expandRegexes = this.options.expandRegexes || DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES;
  this.options.insertFullUnsplitKey = this.options.hasOwnProperty('insertFullUnsplitKey') ? this.options.insertFullUnsplitKey : false;
  this.options.enableMisspellings = this.options.hasOwnProperty('enableMisspellings') ? this.options.enableMisspellings : false;

  this.keyFields = keyFields ? (keyFields instanceof Array ? keyFields : [keyFields]) : [];
  this.root = {};
  this.size = 0;

  if (this.options.cache) {
    this.getCache = new HashArray('key');
  }
};

function deepLookup(obj, keys) {
  return keys.length === 1 ? obj[keys[0]] : deepLookup(obj[keys[0]], keys.slice(1, keys.length));
}

TrieSearch.prototype = {
  add: function (obj, customKeys) {
    if (this.options.cache)
      this.clearCache();

    // Someone might have called add via an array forEach where the second param is a number
    if (typeof customKeys === 'number') {
      customKeys = undefined;
    }

    var keyFields = customKeys || this.keyFields;

    for (var k in keyFields)
    {
      var key = keyFields[k],
        isKeyArr = key instanceof Array,
        val = isKeyArr ? deepLookup(obj, key) : obj[key];

      if (!val) continue;

      val = val.toString();
      val = this.options.ignoreCase ? val.toLowerCase() : val;

      var expandedValues = this.expandString(val);

      for (var v = 0; v < expandedValues.length; v++) {
        var expandedValue = expandedValues[v];

        this.map(expandedValue, obj);
      }
    }
  },
  /**
   * By default using the options.expandRegexes, given a string like 'ö är bra', this will expand it to:
   *
   * ['ö är bra', 'o är bra', 'ö ar bra', 'o ar bra']
   *
   * By default this was built to allow for internationalization, but it could be also be expanded to
   * allow for word alternates, etc. like spelling alternates ('teh' and 'the').
   *
   * This is used for insertion! This should not be used for lookup since if a person explicitly types
   * 'ä' they probably do not want to see all results for 'a'.
   *
   * @param value The string to find alternates for.
   * @returns {Array} Always returns an array even if no matches.
   */
  expandString: function(value) {
    var values = [value];

    if (this.options.expandRegexes && this.options.expandRegexes.length) {
      for (var i = 0; i < this.options.expandRegexes.length; i++) {
        var er = this.options.expandRegexes[i];
        var match;

        while((match = er.regex.exec(value)) !== null) {
          var alternateValue = value.replaceCharAt(match.index, er.alternate);
          values.push(alternateValue);
        }
      }
    }

    return values;
  },
  addAll: function (arr, customKeys) {
    for (var i = 0; i < arr.length; i++)
      this.add(arr[i], customKeys);
  },
  reset: function () {
    this.root = {};
    this.size = 0;
  },
  clearCache: function () {
    // if (this.getCache && !this.getCache._list.length) {
    //   return;
    // }
    this.getCache = new HashArray('key');
  },
  cleanCache: function () {
    while (this.getCache.all.length > this.options.maxCacheSize)
      this.getCache.remove(this.getCache.all[0]);
  },
  addFromObject: function (obj, valueField) {
    if (this.options.cache)
      this.clearCache();

    valueField = valueField || 'value';

    if (this.keyFields.indexOf('_key_') == -1)
      this.keyFields.push('_key_');

    for (var key in obj)
    {
      var o = {_key_: key};
      o[valueField] = obj[key];
      this.add(o);
    }
  },
  map: function (key, value) {
    if (this.options.splitOnRegEx && this.options.splitOnRegEx.test(key))
    {
      var phrases = key.split(this.options.splitOnRegEx);
      var emptySplitMatch = phrases.filter(function(p) { return IS_WHITESPACE.test(p); });
      var selfMatch = phrases.filter(function(p) { return p === key; });
      var selfIsOnlyMatch = selfMatch.length + emptySplitMatch.length === phrases.length;

      // There is an edge case that a RegEx with a positive lookahead like:
      //  /?=[A-Z]/ // Split on capital letters for a camelcase sentence
      // Will then match again when we call map, creating an infinite stack loop.
      if (!selfIsOnlyMatch) {
        for (var i = 0, l = phrases.length; i < l; i++) {
          if (!IS_WHITESPACE.test(phrases[i])) {
            this.map(phrases[i], value);
          }
        }

        if (!this.options.insertFullUnsplitKey) {
          return;
        }
      }
    }

    if (this.options.cache)
      this.clearCache();

    if (this.options.keepAll) {
      this.indexed = this.indexed || new HashArray([this.options.keepAllKey]);
      this.indexed.add(value);
    }

    if (this.options.ignoreCase) {
      key = key.toLowerCase();
    }

    var self = this;

    if (this.options.enableMisspellings) {
      var keys = [key];
      var existsMap = {};
      existsMap[keys[0]] = true;

      this.expandMisspellings(keys, existsMap);

      for (var k = 0; k < keys.length; k++) insertKey(keys[k]);
    } else {
      insertKey(key);
    }

    function insertKey(key) {
      // We reverse so we can do pop() which is faster than shift()
      var keyArr = self.keyToArr(key).reverse();

      insert(keyArr, value, self.root);

      function insert(keyArr, value, node) {
        if (keyArr.length == 0) {
          node['value'] = node['value'] || [];
          node['value'].push(value);
          return;
        }

        var k = keyArr.pop();

        if (!node[k])
          self.size++;

        node[k] = node[k] || {};

        insert(keyArr, value, node[k])
      }
    }
  },
  keyToArr: function (key) {
    var keyArr;

    if (this.options.min && this.options.min > 1)
    {
      if (key.length < this.options.min)
        return [];

      keyArr = [key.substr(0, this.options.min)];
      keyArr = keyArr.concat(key.substr(this.options.min).split(''));
    }
    else keyArr = key.split('');

    return keyArr;
  },
  findNode: function (key) {
    if (this.options.min > 0 && key.length < this.options.min)
      return [];

    // We reverse so we can do pop() which is faster than shift()
    return f(this.keyToArr(key).reverse(), this.root);

    function f(keyArr, node) {
      if (!node) return undefined;
      if (keyArr.length == 0) return node;

      var k = keyArr.pop();
      return f(keyArr, node[k]);
    }
  },
  expandMisspellings: function(words, existsMap) {
    var l = words.length; // THIS LINE IS IMPORTANT since we are inserting into an array we
                          // are looping over.

    for (var w = 0; w < l; w++) {
      concatDeletions(words[w]);
      concatSwaps(words[w]);
    }

    /**
     * A deletion would be like "androd" for "android"
     */
    function concatDeletions(word) {
      var l = word.length;
      for (var c = 1; c < l - 1; c++) {
        var wordWithCharDeletion = word.substring(0, c) + word.substring(c + 1);

        if (!existsMap[wordWithCharDeletion]) {
          words.push(wordWithCharDeletion);
          existsMap[wordWithCharDeletion] = true;
        }
      }
    }

    /**
     * A swap would be like "teh" for "the" or "andriod" for "android"
     */
    function concatSwaps(word) {
      var l = word.length;
      for (var c = 1; c < l - 1; c++) {
        var wordWithCharSwapWithNext = word.substring(0, c) + word.substring(c + 2, 1) + word.substring(c + 1, 1) + word.substring(c + 3);

        if (!existsMap[wordWithCharSwapWithNext]) {
          words.push(wordWithCharSwapWithNext);
          existsMap[wordWithCharSwapWithNext] = true;
        }
      }
    }
  },
  _get: function (phrase) {
    // Ignore case?
    phrase = this.options.ignoreCase ? phrase.toLowerCase() : phrase;

    // Is it cached?
    var c, node;
    if (this.options.cache && (c = this.getCache.get(phrase)))
      return c.value;

    var ret = undefined,
      haKeyFields = this.options.indexField ? [this.options.indexField] : this.keyFields,
      // Split our phrase into words
      words = this.options.splitOnGetRegEx ? phrase.split(this.options.splitOnGetRegEx) : [phrase];

    // For each word, we do a separate lookup and aggregate the results for only items that
    // have *every* word.

    for (var w = 0, l = words.length; w < l; w++)
    {
      if (this.options.min && words[w].length < this.options.min)
        continue;

      var temp = new HashArray(haKeyFields);

      if (node = this.findNode(words[w])) {
        aggregate(node, temp);
      }

      ret = ret ? ret.intersection(temp) : temp;
    }

    var v = ret ? ret.all : [];

    if (this.options.cache)
    {
      this.getCache.add({key: phrase, value: v});
      this.cleanCache();
    }

    return v;

    function aggregate(node, ha) {
      if (node.value && node.value.length) {
        try {
          ha.addAll(node.value);
        } catch (error) {
          console.error(error, ha, node.value);
        }
      }

      for (var k in node)
        if (k != 'value')
          aggregate(node[k], ha);
    }
  },
  get: function (phrases, reducer) {
    var self = this,
      haKeyFields = this.options.indexField ? [this.options.indexField] : this.keyFields,
      ret = undefined,
      accumulator = undefined;

    if (reducer && !this.options.idFieldOrFunction) {
      throw new Error('To use the accumulator, you must specify and idFieldOrFunction');
    }

    phrases = (phrases instanceof Array) ? phrases : [phrases];

    for (var i = 0, l = phrases.length; i < l; i++)
    {
      /**
       * Each passed in phrase will return a separate array of results.
       *
       * We then aggregate these together either with a reducer function OR by simply
       * eliminating duplicates using the HashArray.
       */
      var matches = this._get(phrases[i]);

      if (reducer) {
        // Aggregate into single array of results using a reducer function
        accumulator = reducer(accumulator, phrases[i], matches, this);
      } else {
        // Aggregate into single array of results by eliminating duplicates
        ret = ret ? ret.addAll(matches) : new HashArray(haKeyFields).addAll(matches);
      }
    }

    if (!reducer) {
      return ret.all;
    }

    return accumulator;
  },
  getId: function (item) {
    return typeof this.options.idFieldOrFunction === 'function' ? this.options.idFieldOrFunction(item) : item[this.options.idFieldOrFunction];
  }
};

TrieSearch.UNION_REDUCER = function(accumulator, phrase, matches, trie) {
  if (accumulator === undefined) {
    return matches;
  }

  var map = {}, i, id;
  var maxLength = Math.max(accumulator.length, matches.length);
  var results = [];
  var l = 0;

  // One loop, O(N) for max length of accumulator or matches.
  for (i = 0; i < maxLength; i++) {
    if (i < accumulator.length) {
      id = trie.getId(accumulator[i]);
      map[id] = map[id] ? map[id] : 0;
      map[id]++;

      if (map[id] === 2) {
        results[l++] = accumulator[i];
      }
    }

    if (i < matches.length) {
      id = trie.getId(matches[i]);
      map[id] = map[id] ? map[id] : 0;
      map[id]++;

      if (map[id] === 2) {
        results[l++] = matches[i];
      }
    }
  }

  return results;
};

module.exports = TrieSearch;
