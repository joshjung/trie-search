var HashArray = require('hasharray');

var MAX_CACHE_SIZE = 64;

var TrieSearch = function (keyFields, options) {
  this.options = options || {};
  // Default ignoreCase to true
  this.options.ignoreCase = (this.options.ignoreCase === undefined) ? true : this.options.ignoreCase;
  this.options.maxCacheSize = this.options.maxCacheSize || MAX_CACHE_SIZE;
  this.options.cache = this.options.hasOwnProperty('cache') ? this.options.cache : true;
  this.keyFields = keyFields ? (keyFields instanceof Array ? keyFields : [keyFields]) : [];
  this.root = {};
  this.size = 0;
  this.getCache = new HashArray('key');
};

TrieSearch.prototype = {
  add: function (obj) {
    if (this.options.cache)
      this.clearCache();
    
    for (var k in this.keyFields)
    {
      var key = this.keyFields[k],
        val = obj[key];
        
      if (!val) continue;
      
      val = val.toString();

      val = this.options.ignoreCase ? val.toLowerCase() : val;

      phrases = val.split(/\s/g);

      for (var i = 0, l = phrases.length; i < l; i++)
        this.map(phrases[i], obj)
    }
  },
  reset: function () {
    this.root = {};
    this.size = 0;
  },
  clearCache: function () {
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
    if (this.options.cache)
      this.clearCache();

    var keyArr = this.keyToArr(key),
      self = this;

    insert(keyArr, value, this.root);

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

      keyArr = [key.substr(0, this.options.min)];
      keyArr = keyArr.concat(key.substr(this.options.min).split(''));
    }
    else keyArr = key.split('');

    return keyArr;
  },
  findNode: function (key) {
    if (this.options.min > 0 && key.length < this.options.min)
      return [];

    return f(this.keyToArr(key), this.root);

    function f(keyArr, node) {
      if (!node) return undefined;
      if (keyArr.length == 0) return node;

      var k = keyArr.shift();
      return f(keyArr, node[k]);
    }
  },
  _get: function (phrase) {
    phrase = this.options.ignoreCase ? phrase.toLowerCase() : phrase;
    
    var c;
    if (this.options.cache && (c = this.getCache.get(phrase)))
      return c.value;

    var ret = undefined,
      haKeyFields = this.options.indexField ? [this.options.indexField] : this.keyFields;
      words = phrase.split(/\s/g);

    for (var w = 0, l = words.length; w < l; w++)
    {
      if (this.options.min && words[w].length < this.options.min)
        continue;

      var temp = new HashArray(haKeyFields);

      if (node = this.findNode(words[w]))
        aggregate(node, temp);

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
      if (node.value && node.value.length)
        ha.addAll(node.value);

      for (var k in node)
        if (k != 'value')
          aggregate(node[k], ha);
    }
  },
  get: function (phrases) {
    var self = this,
      haKeyFields = this.options.indexField ? [this.options.indexField] : this.keyFields,
      ret = undefined;

    phrases = (phrases instanceof Array) ? phrases : [phrases];

    for (var i = 0, l = phrases.length; i < l; i++)
    {
      var temp = this._get(phrases[i]);
      ret = ret ? ret.addAll(temp) : new HashArray(haKeyFields).addAll(temp);
    }
    
    return ret.all;
  }
};

module.exports = TrieSearch;