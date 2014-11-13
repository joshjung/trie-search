var HashArray = require('hasharray');

var TrieSearch = function (keyFields, options) {
  this.options = options || {};
  // Default ignoreCase to true
  this.options.ignoreCase = (this.options.ignoreCase === undefined) ? true : this.options.ignoreCase;
  this.keyFields = keyFields ? (keyFields instanceof Array ? keyFields : [keyFields]) : [];
  this.root = {};
  this.size = 0;
};

TrieSearch.prototype = {
  add: function (obj) {
    for (var k in this.keyFields)
    {
      var key = this.keyFields[k],
        val = obj[key];
        
      if (!val) continue;

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
  addFromObject: function (obj, valueField) {
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
  get: function (key) {
    key = this.options.ignoreCase ? key.toLowerCase() : key;

    var ha = new HashArray(this.keyFields),
      node = this.findNode(key);

    if (!node)
      return [];

    aggregate(node);
    
    return ha.all;
    
    function aggregate(node) {
      if (node.value && node.value.length)
        ha.addAll(node.value);

      for (var k in node)
        if (k != 'value')
          aggregate(node[k]);
    }
  }
};

module.exports = TrieSearch;