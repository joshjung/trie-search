var HashArray = require('hasharray');
var md5 = require('md5');

var MAX_CACHE_SIZE = 1024;

var IS_WHITESPACE = /^[\s]*$/;

/**
 * When inserting, everything that is matched by the regex is treated as equivalent to the alternate and two insertions
 * are made.
 */
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

String.prototype.replaceCharAt = function(index, replacement) {
  return this.substring(0, index) + replacement + this.substr(index + replacement.length);
};

var TrieSearch = function (keyFields, options) {
  this.options = options || {};

  // Default ignoreCase to true
  this.options.ignoreCase = (this.options.ignoreCase === undefined) ? true : this.options.ignoreCase;
  this.options.maxCacheSize = this.options.maxCacheSize || MAX_CACHE_SIZE;
  // Cache is used for retrieval. If true, each get/search stores caches the results of that particular search
  // to speed up a duplicate get/search later.
  this.options.cache = this.options.hasOwnProperty('cache') ? this.options.cache : true;
  // By default we split on whitespace. So if you insert an entire sentence with spaces between the words,
  // each word will be inserted separately.
  this.options.splitOnRegEx = this.options.hasOwnProperty('splitOnRegEx') ? this.options.splitOnRegEx : /[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g;
  // By default the get split is the same as the insertion split, on whitespace!
  this.options.splitOnGetRegEx = this.options.hasOwnProperty('splitOnGetRegEx') ? this.options.splitOnGetRegEx : this.options.splitOnRegEx;
  this.options.min = this.options.min || 1;
  this.options.keepAll = this.options.hasOwnProperty('keepAll') ? this.options.keepAll : false;
  this.options.keepAllKey = this.options.hasOwnProperty('keepAllKey') ? this.options.keepAllKey : 'id';
  this.options.idFieldOrFunction = this.options.hasOwnProperty('idFieldOrFunction') ? this.options.idFieldOrFunction : undefined;
  this.options.expandRegexes = this.options.expandRegexes || DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES;
  // If for some reason you want to skip using splitOnRegEx, you can set this to true, but then you will need to
  // manually figure out how to split long search phrases for insertion.
  this.options.insertFullUnsplitKey = this.options.hasOwnProperty('insertFullUnsplitKey') ? this.options.insertFullUnsplitKey : false;
  this.options.defaultReducer = this.options.hasOwnProperty('defaultReducer') ? this.options.defaultReducer : TrieSearch.UNION_REDUCER;

  this.keyFields = keyFields ? (keyFields instanceof Array ? keyFields : [keyFields]) : [];
  this.root = {};
  this.size = 0;

  if (this.options.cache) {
    this.getCache = new HashArray('key');
  }
};

/**
 * Given an array of strings (keys), recurse through obj to find its nested element
 *
 * @param obj Some object that has multiple layers of depth (e.g. a tree)
 * @param keys Example ['field1', 'field2', 'field3']
 */
function deepLookup(obj, keys) {
  return keys.length === 1 ? obj[keys[0]] : deepLookup(obj[keys[0]], keys.slice(1, keys.length));
}

/**
 * This was originally written in like 2015 before TypeScript and all that jazz.
 */
TrieSearch.prototype = {
  add: function (item, customKeys) {
    // Cache is clearly invalidated whenever we add a new item.
    if (this.options.cache) this.clearCache();

    // Someone might have called add via an array forEach where the second param is a number
    if (typeof customKeys === "number") {
      customKeys = undefined;
    }

    var keyFields = customKeys || this.keyFields;

    for (var k in keyFields) {
      var key = keyFields[k],
        isKeyArr = key instanceof Array, // Keys can be nested arrays for deep lookup ['a', ['b', 'c'], 'd']
        val = isKeyArr ? deepLookup(item, key) : item[key];

      if (!val) continue;

      val = val.toString();
      if (this.options.ignoreCase) {
        val = val.toLowerCase();
      }

      // Given a string like "Björne" this will return ["Björne", "Bjorne"] when using the default
      // expand regex so that the vowel 'o' still returns the result when searching.
      var expandedValues = this.expandString(val);

      for (var v = 0; v < expandedValues.length; v++) {
        var expandedValue = expandedValues[v];

        this.map(expandedValue, item, customKeys);
      }
    }
  },
  /**
   * Note that this removes a full phrase (not an item) from the Trie. This could be useful for
   * example if you wanted to remove swear words from a search.
   *
   * @param phrase The phrase to remove
   * @param keyFields The keyfields in which to search for this phrase to remove
   */
  remove: function (phrase, keyFields) {
    if (!phrase) return;
    phrase = phrase.toString();
    phrase = this.options.ignoreCase ? phrase.toLowerCase() : phrase;

    keyFields = keyFields || this.keyFields;
    keyFields = keyFields instanceof Array ? keyFields : [keyFields];

    if (this.options.cache) this.clearCache();

    // We have to make sure to remove all the alternate insertions for expandRegexes!
    var diacriticalVariants = this.expandString(phrase);

    for (var variant of diacriticalVariants) {
      var words = this.options.splitOnRegEx ? variant.split(this.options.splitOnRegEx) : [variant];

      for (var word of words) {
        this.removeNode(this.root, keyFields, phrase, word);
      }
    }
  },
  removeNode: function (node, keyFields, phrase, word) {
    if (!node) {
      return null;
    }

    // if there is no word length, we are at the leaf node
    if (!word.length) {
      if (node.value) {
        node.value = node.value.filter(
          item => !keyFields.some((field) => {
            var valueAtField = item[field] || '';
            valueAtField = this.options.ignoreCase ? valueAtField.toLowerCase() : valueAtField;
            return valueAtField.indexOf(phrase) > -1;
          }),
        );

        if (!node.value.length) {
          delete node.value;
        }
      }

      return;
    }

    // Recurse down through all the nodes, popping off the next character to find the next part
    // of the tree, deleting nodes as we go since the item we are deleting is going to exist at
    // multiple levels.
    var char = word[0];
    if (node[char]) {
      this.removeNode(node[char], keyFields, phrase, word.slice(1));
      this.deleteNodeIfEmpty(node, char);
    }
  },
  deleteNodeIfEmpty: function (parentNode, key) {
    if (Object.keys(parentNode[key]).length === 0) {
      delete parentNode[key];
      this.size--;
    }
  },
  /**
   * By default using the options.expandRegexes, given a string like 'ö är bra', this will expand it to:
   *
   * ['ö är bra', 'o är bra', 'ö ar bra', 'o ar bra']
   *
   * By default this was built to allow for internationalization.
   *
   * This is used for insertion! This should not be used for lookup since if a person explicitly types
   * 'ä' they probably do not want to see all results for 'a'.
   *
   * @param value The string to find alternates for.
   * @returns {Array} Always returns an array even if no matches.
   */
  expandString: function (value) {
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
  map: function (key, item, customKeys) {
    // When we splitOnRegEx, which by default is whitespace,we do a recursive insertions *after* splitting
    if (this.options.splitOnRegEx && this.options.splitOnRegEx.test(key))
    {
      var phrases = key.split(this.options.splitOnRegEx);
      var emptySplitMatch = phrases.filter(function(p) { return IS_WHITESPACE.test(p); });
      var selfMatch = phrases.filter(function(p) { return p === key; });
      var selfIsOnlyMatch = selfMatch.length + emptySplitMatch.length === phrases.length;

      // There is an edge case that a RegEx with a positive look-ahead like:
      //  /?=[A-Z]/ // Split on capital letters for a camelcase sentence
      // Will then match again when we call map, creating an infinite stack loop.
      if (!selfIsOnlyMatch) {
        for (var i = 0, l = phrases.length; i < l; i++) {
          if (!IS_WHITESPACE.test(phrases[i])) {
            this.map(phrases[i], item, customKeys);
          }
        }

        // If this is true, we continue forward and *also* insert the entire unsplit key
        if (!this.options.insertFullUnsplitKey) {
          return;
        }
      }
    }

    if (this.options.cache)
      this.clearCache();

    if (this.options.keepAll) {
      this.indexed = this.indexed || new HashArray([this.options.keepAllKey]);
      this.indexed.add(item);
    }

    if (this.options.ignoreCase) {
      key = key.toLowerCase();
    }

    var keyArr = this.keyToArr(key),
      self = this;

    insert(keyArr, item, this.root);

    try {
      item.$tsid = this.getId(item, customKeys);
    } catch (error) {
      console.warn('TrieSearch: since version 2.2 you cannot insert primitives as items, you must wrap them in an Object. This was done for performance.');
      throw error
    }

    function insert(keyArr, value, node) {
      if (keyArr.length == 0)
      {
        node['value'] = node['value'] || [];
        node['value'].push(value);
        return;
      }

      var k = keyArr.shift();

      if (!node[k])
        self.size++;

      node[k] = node[k] || {};

      insert(keyArr, value, node[k])
    }
  },
  keyToArr: function (key) {
    var keyArr;

    if (this.options.min && this.options.min > 1)
    {
      if (key.length < this.options.min)
        return [];

      keyArr = [key.substring(0, this.options.min)];
      keyArr = keyArr.concat(key.substring(this.options.min).split(''));
    }
    else keyArr = key.split('');

    return keyArr;
  },
  findNode: function (key) {
    return f(this.keyToArr(key), this.root);

    function f(keyArr, node) {
      if (!node) return undefined;
      if (keyArr.length === 0) return node;

      var k = keyArr.shift();
      return f(keyArr, node[k]);
    }
  },
  _getCacheKey: function(phrase, limit){
    var cacheKey = phrase
    if(limit) {
      cacheKey = phrase + "_" + limit
    }
    return cacheKey
  },
  _get: function (searchPhrase, limit) {
    var self = this;

    searchPhrase = this.options.ignoreCase ? searchPhrase.toLowerCase() : searchPhrase;

    var c, node, all = [], dedupDict = {};

    if (this.options.cache && (c = this.getCache.get(this._getCacheKey(searchPhrase, limit))))
      return c.value;

    // Search for the node that matches our search phrase, which might contain a tree of child nodes
    node = this.findNode(searchPhrase);

    if (node) {
      collectAndRecurseOnChildren(node);
    }

    if (this.options.cache) {
      var cacheKey = this._getCacheKey(searchPhrase, limit)
      this.getCache.add({ key: cacheKey, value: all });
      this.cleanCache();
    }

    return all;

    function collectAndRecurseOnChildren(node) {
      // limit is the maximum number of items to return for a search, if we have gone over that, just bail
      if (all.length === limit) {
        return
      }

      if (node.value && node.value.length) {
        for (let i = 0; i < node.value.length; i++) {
          var item = node.value[i];
          if (!limit || all.length < limit) {
            const id = self.getId(item);
            if (dedupDict[id]) continue;

            all.push(item);
            dedupDict[id] = item;
          }
        }
      }

      if (all.length === limit) {
        return
      }

      // Recurse through all our children, which will be fields that are not the 'value' field
      for (var field in node) {
        if (field !== 'value') {
          collectAndRecurseOnChildren(node[field]);
        }
      }
    }
  },
  get: function (phrases, reducer, limit) {
    var accumulator = undefined;

    reducer = reducer || this.options.defaultReducer;

    // If our phrases is one string, we are going to apply our splitOnGetRegEx and treat it like multiple phrases
    // so it can be reduced with a union reducer or whatever the dev wants.
    if (typeof phrases === 'string') {
      phrases = this.options.splitOnGetRegEx ? phrases.split(this.options.splitOnGetRegEx) : [phrases];
    }

    // Filter out any phrases that are shorter than our min length threshold
    phrases = phrases.filter(phrase => !this.options.min || phrase.length >= this.options.min);

    // Loop over all the split up phrases and get the results for each individually. Then apply the reducer
    // to the results so that the reducer can figure out what to do with duplicates or whatnot.
    for (var i = 0, l = phrases.length; i < l; i++) {
      var phrase = phrases[i];
      var matchedItems = this._get(phrase, limit);

      accumulator = reducer(accumulator, phrase, matchedItems, this);
    }

    return accumulator || [];
  },
  search: function(phrases, reducer, limit) {
    return this.get(phrases, reducer, limit);
  },
  getId: function (item, customKeys) {
    if (item.$tsid) return item.$tsid;
    if (!this.options.idFieldOrFunction) {
      // Let's try to generate an id by concatenating the fields we know about and doing an md5
      var s = '';
      var kf = customKeys || this.keyFields;

      for (let i = 0; i < kf.length; i++) {
        var f = kf[i];
        var v = typeof f === 'string' ? item[f] : deepLookup(item, f);
        if (v === undefined || v === null) {
          throw new Error(`Since 2.2.0 of TrieSearch, if you have undefined/null keyFields (or customKeys) on your items you must specify an idFieldOrFunction. item.${f} === ${v}`);
        }
        s += v.toString();
      }

      return md5(s);
    }
    return typeof this.options.idFieldOrFunction === 'function' ? this.options.idFieldOrFunction(item) : item[this.options.idFieldOrFunction];
  }
};

/**
 * Reduce the incoming matches array onto the accumulator object
 *
 * @param accumulatedItems An object of the accumulated results of multiple calls to this reducer.
 * @param phrase The current phrase that is being processed
 * @param phraseMatchingItems The matches for the current phrase (an array)
 * @param trieSearch The parent TrieSearch instance
 * @returns {*|*[]} Should return the final accumulator
 */
TrieSearch.UNION_REDUCER = function(accumulatedItems, phrase, phraseMatchingItems, trieSearch) {
  if (accumulatedItems === undefined) {
    return phraseMatchingItems; // Our first set of matches becomes our next accumulator array
  }

  var alreadyExistsById = {}, all = [];

  accumulatedItems.forEach(function(item) {
    alreadyExistsById[trieSearch.getId(item)] = true;
  });

  phraseMatchingItems.forEach(function(item) {
    var id = trieSearch.getId(item);
    if (alreadyExistsById[id]) {
      all.push(item);
    }
  });

  return all;
};

module.exports = TrieSearch;
module.exports.default = TrieSearch;
