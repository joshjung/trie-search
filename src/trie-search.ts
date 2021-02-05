import get from 'lodash.get';
// @ts-ignore
import HashArray from 'hasharray';

var MAX_CACHE_SIZE = 64;

var IS_WHITESPACE = /^[\s]*$/;

var DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES = [
  {
    regex: /[åäàáâãæ]/gi,
    alternate: 'a',
  },
  {
    regex: /[èéêë]/gi,
    alternate: 'e',
  },
  {
    regex: /[ìíîï]/gi,
    alternate: 'i',
  },
  {
    regex: /[òóôõö]/gi,
    alternate: 'o',
  },
  {
    regex: /[ùúûü]/gi,
    alternate: 'u',
  },
  {
    regex: /[æ]/gi,
    alternate: 'ae',
  },
];

const replaceCharAt = function (
  index: number,
  original: string,
  replacement: string
) {
  return (
    original.substr(0, index) +
    replacement +
    original.substr(index + replacement.length)
  );
};

export type TrieOptions = {
  cache: boolean;
  expandRegexes: typeof DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES;
  idFieldOrFunction?: string | ((obj: unknown) => string);
  ignoreCase: boolean;
  indexField?: string;
  insertFullUnsplitKey: boolean;
  keepAll: boolean;
  keepAllKey: string;
  maxCacheSize: number;
  min?: number;
  /**
   * How to split words when using get(). If undefined uses options.splitOnRegEx. If false, does not attempt the split.
   */
  splitOnGetRegEx?: RegExp | false;
  /**
   * How to split words when they are added to the trie. If undefined, does not attempt the split.
   */
  splitOnRegEx?: RegExp;
};

export type ObjectKey = string;

export type TrieNode<O> = Record<string, (TrieNode<O> | O)[]>;

export type KeyFields = (ObjectKey | ObjectKey[])[];

type Reducer<O = {}> = (
  accumulator: O[] | undefined,
  phrase: string,
  matches: O[],
  trie: TrieSearch
) => O[];

export class TrieSearch<O = {}> {
  static readonly DEFAULT_OPTIONS: TrieOptions = {
    cache: true,
    expandRegexes: DEFAULT_INTERNATIONALIZE_EXPAND_REGEXES,
    idFieldOrFunction: undefined,
    ignoreCase: true,
    insertFullUnsplitKey: false,
    keepAll: false,
    keepAllKey: 'id',
    maxCacheSize: MAX_CACHE_SIZE,
    splitOnRegEx: /\s/g,
  };

  static readonly UNION_REDUCER: Reducer = function <O = {}>(
    accumulator: O[] | undefined,
    _phrase: string,
    matches: O[],
    trie: TrieSearch
  ) {
    if (accumulator === undefined) {
      return matches;
    }

    const map: Record<string, number> = {};

    let id: string;
    var maxLength = Math.max(accumulator.length, matches.length);
    var results = [];
    var l = 0;

    // One loop, O(N) for max length of accumulator or matches.
    for (let i = 0; i < maxLength; i++) {
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

  static deepLookup(obj: {}, keys: ObjectKey | ObjectKey[]) {
    return get(obj, keys);
  }

  public readonly options: TrieOptions;
  public readonly keyFields: KeyFields;
  public size: number;
  public root: TrieNode<O>;
  public getCache: HashArray;
  public indexed: HashArray | undefined;

  constructor(
    keyFields?: KeyFields | string,
    options: Partial<TrieOptions> = {}
  ) {
    this.options = { ...TrieSearch.DEFAULT_OPTIONS, ...options };
    this.keyFields = keyFields
      ? keyFields instanceof Array
        ? keyFields
        : [keyFields]
      : [];
    this.root = {};
    this.size = 0;

    if (this.options.cache) {
      this.getCache = new HashArray('key');
    }
    if (this.options.splitOnGetRegEx === undefined) {
      this.options.splitOnGetRegEx = this.options.splitOnRegEx;
    }
  }

  public add(obj: O, customKeys?: KeyFields) {
    if (this.options.cache) {
      this.clearCache();
    }

    let keyFields: KeyFields;
    // Someone might have called add via an array forEach where the second param is a number
    if (customKeys == null || typeof customKeys === 'number') {
      keyFields = this.keyFields;
    } else {
      keyFields = customKeys;
    }
    for (var key of keyFields) {
      let val: any;
      if (key instanceof Array) {
        val = TrieSearch.deepLookup(obj, key);
      } else {
        // @ts-ignore
        val = obj[key];
      }

      if (!val) continue;

      val = val.toString();

      var expandedValues = this.expandString(val);

      for (var v = 0; v < expandedValues.length; v++) {
        var expandedValue = expandedValues[v];

        this.map(expandedValue, obj);
      }
    }
  }

  public expandString(value: string) {
    var values = [value];

    if (this.options.expandRegexes && this.options.expandRegexes.length) {
      for (var i = 0; i < this.options.expandRegexes.length; i++) {
        var er = this.options.expandRegexes[i];
        var match;

        while ((match = er.regex.exec(value)) !== null) {
          var alternateValue = replaceCharAt(match.index, value, er.alternate);
          values.push(alternateValue);
        }
      }
    }

    return values;
  }

  public addAll(arr: O[], customKeys?: KeyFields) {
    for (var i = 0; i < arr.length; i++) this.add(arr[i], customKeys);
  }

  public reset() {
    this.root = {};
    this.size = 0;
  }

  public clearCache() {
    // if (this.getCache && !this.getCache._list.length) {
    //   return;
    // }
    this.getCache = new HashArray('key');
  }

  public cleanCache() {
    while (this.getCache.all.length > this.options.maxCacheSize)
      this.getCache.remove(this.getCache.all[0]);
  }

  public map(key: string, value: O) {
    if (this.options.splitOnRegEx && this.options.splitOnRegEx.test(key)) {
      var phrases = key.split(this.options.splitOnRegEx);
      var emptySplitMatch = phrases.filter(function (p) {
        return IS_WHITESPACE.test(p);
      });
      var selfMatch = phrases.filter(function (p) {
        return p === key;
      });
      var selfIsOnlyMatch =
        selfMatch.length + emptySplitMatch.length === phrases.length;

      // There is an edge case that a RegEx with a positive lookeahed like:
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

    if (this.options.cache) this.clearCache();

    if (this.options.keepAll) {
      this.indexed = this.indexed || new HashArray([this.options.keepAllKey]);
      this.indexed.add(value);
    }

    if (this.options.ignoreCase) {
      key = key.toLowerCase();
    }

    var keyArr = this.keyToArr(key),
      self = this;

    insert(keyArr, value, this.root);

    function insert(keyArr: string[], value: O, node: TrieNode<O>) {
      if (keyArr.length == 0) {
        node['value'] = node['value'] || [];
        node['value'].push(value);
        return;
      }

      var k = keyArr.shift() as string;

      if (!node[k]) self.size++;

      node[k] = node[k] || {};

      // @ts-ignore
      insert(keyArr, value, node[k]);
    }
  }

  public keyToArr(key: String) {
    let keyArr;

    if (this.options.min && this.options.min > 1) {
      if (key.length < this.options.min) return [];

      keyArr = [key.substr(0, this.options.min)];
      keyArr = keyArr.concat(key.substr(this.options.min).split(''));
    } else {
      keyArr = key.split('');
    }

    return keyArr;
  }

  public findNode(key: string): TrieNode<O> | undefined {
    if (
      this.options.min &&
      this.options.min > 0 &&
      key.length < this.options.min
    )
      return undefined;

    return f(this.keyToArr(key), this.root);

    function f(keyArr: string[], node: TrieNode<O>): TrieNode<O> | undefined {
      if (!node) return undefined;
      if (keyArr.length == 0) return (node as unknown) as TrieNode<O>;

      var k = keyArr.shift() as string;
      // @ts-ignore
      return f(keyArr, node[k]);
    }
  }

  public _getCacheKey(phrase: string, limit?: number) {
    var cacheKey = phrase;
    if (limit) {
      cacheKey = phrase + '_' + limit;
    }
    return cacheKey;
  }

  public _get(phrase: string, limit?: number) {
    phrase = this.options.ignoreCase ? phrase.toLowerCase() : phrase;

    var c, node;
    if (
      this.options.cache &&
      (c = this.getCache.get(this._getCacheKey(phrase, limit)))
    )
      return c.value;

    var ret = undefined,
      haKeyFields = this.options.indexField
        ? [this.options.indexField]
        : this.keyFields,
      words = this.options.splitOnGetRegEx
        ? phrase.split(this.options.splitOnGetRegEx)
        : [phrase];

    for (var w = 0, l = words.length; w < l; w++) {
      if (this.options.min && words[w].length < this.options.min) continue;

      var temp = new HashArray(haKeyFields);

      if ((node = this.findNode(words[w]))) aggregate(node, temp);

      ret = ret ? ret.intersection(temp) : temp;
    }

    var v = ret ? ret.all : [];

    if (this.options.cache) {
      var cacheKey = this._getCacheKey(phrase, limit);
      this.getCache.add({ key: cacheKey, value: v });
      this.cleanCache();
    }

    return v;

    function aggregate(node: TrieNode<O>, ha: HashArray) {
      if (limit && ha.all.length === limit) {
        return;
      }

      if (node.value && node.value.length) {
        if (!limit || ha.all.length + node.value.length < limit) {
          ha.addAll(node.value);
        } else {
          // Limit is less than the number of entries in the node.value + ha combined
          ha.addAll(node.value.slice(0, limit - ha.all.length));
          return;
        }
      }

      for (var k in node) {
        if (limit && ha.all.length === limit) {
          return;
        }
        if (k != 'value') {
          // @ts-ignore
          aggregate(node[k], ha);
        }
      }
    }
  }

  public get(
    phrases: string | string[],
    reducer?: Reducer<O>,
    limit?: number
  ): O[] {
    const haKeyFields = this.options.indexField
      ? [this.options.indexField]
      : this.keyFields;
    let ret = undefined;
    let accumulator = undefined;

    if (reducer && !this.options.idFieldOrFunction) {
      throw new Error(
        'To use the accumulator, you must specify and idFieldOrFunction'
      );
    }

    phrases = phrases instanceof Array ? phrases : [phrases];

    for (var i = 0, l = phrases.length; i < l; i++) {
      var matches = this._get(phrases[i], limit);

      if (reducer) {
        accumulator = reducer(accumulator, phrases[i], matches, this);
      } else {
        ret = ret
          ? ret.addAll(matches)
          : new HashArray(haKeyFields).addAll(matches);
      }
    }

    if (!reducer) {
      return ret.all;
    }

    return accumulator ?? [];
  }

  public getId(item: O) {
    const { idFieldOrFunction } = this.options;
    if (idFieldOrFunction == null) {
      throw new Error(
        'To use the accumulator, you must specify and idFieldOrFunction'
      );
    }

    return typeof idFieldOrFunction === 'function'
      ? idFieldOrFunction(item)
      : // @ts-ignore
        item[idFieldOrFunction];
  }
}
