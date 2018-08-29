var assert = require('assert'),
  TrieSearch = require('../src/TrieSearch');

describe('TrieSearch', function() {
  describe('new TrieSearch(keyFields) should work', function() {
    it('should set keyfields (1)', function() {
      var ts = new TrieSearch(['key']);
      assert.equal(ts.keyFields.length, 1);
    });

    it('should set keyfields (2)', function() {
      var ts = new TrieSearch('key');
      assert.equal(ts.keyFields.length, 1);
    });
  });

  describe('new TrieSearch(keyFields).keyToArr should work', function() {
    it('\'key\' -> [\'k\', \'e\', \'y\']', function() {
      var ts = new TrieSearch();
      assert.equal(ts.keyToArr('key')[0], 'k');
      assert.equal(ts.keyToArr('key')[1], 'e');
      assert.equal(ts.keyToArr('key')[2], 'y');
    });

    it('for options.min == 2, \'key\' -> [\'ke\', \'y\']', function() {
      var ts = new TrieSearch('blah', {min: 2});
      assert.equal(ts.keyToArr('key')[0], 'ke');
      assert.equal(ts.keyToArr('key')[1], 'y');
    });

    it('for options.min == 2, \'keyset\' -> [\'ke\', \'y\', \'s\', \'e\', \'t\']', function() {
      var ts = new TrieSearch('blah', {min: 2});
      assert.equal(ts.keyToArr('keyset')[0], 'ke');
      assert.equal(ts.keyToArr('keyset')[1], 'y');
      assert.equal(ts.keyToArr('keyset')[2], 's');
      assert.equal(ts.keyToArr('keyset')[3], 'e');
      assert.equal(ts.keyToArr('keyset')[4], 't');
    });

    it('for options.min == 3, \'key\' -> [\'key\']', function() {
      var ts = new TrieSearch('blah', {min: 3});
      assert.equal(ts.keyToArr('key')[0], 'key');
    });

    it('for options.min == 4, \'key\' -> []', function() {
      var ts = new TrieSearch('blah', {min: 4});
      assert.equal(ts.keyToArr('key').length, 0);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item', function() {
    var ts = new TrieSearch('key'),
      item = {key: 'blah'};

    ts.add(item);

    it('add(\'blah\') should build map of nodes', function() {
      assert(ts.root['b'] !== undefined, 'b does not exist');
      assert(ts.root['b']['l'] !== undefined, 'bl does not exist');
      assert(ts.root['b']['l']['a'] !== undefined, 'bla does not exist');
      assert(ts.root['b']['l']['a']['h'] !== undefined, 'blah does not exist');
    });

    it('get(\'blah\') for each subkey should work', function() {
      assert.equal(ts.get('b')[0], item);
      assert.equal(ts.get('bl')[0], item);
      assert.equal(ts.get('bla')[0], item);
      assert.equal(ts.get('blah')[0], item);
      assert.equal(ts.get('blab').length, 0);
      assert.equal(ts.get('nope').length, 0);
    });
  });

  describe('TrieSearch::addAll(...)should work for an array', function() {
    var ts = new TrieSearch('key'),
      items = [{key: 'addendum'}, {key: 'banana'}, {key: 'cat'}];

    ts.addAll(items);

    it('get(\'blah\') for each subkey should work', function() {
      assert.equal(ts.get('b')[0], items[1]);
      assert.equal(ts.get('ba')[0], items[1]);
      assert.equal(ts.get('ban')[0], items[1]);
      assert.equal(ts.get('bana')[0], items[1]);
      assert.equal(ts.get('banana')[0], items[1]);

      assert.equal(ts.get('a')[0], items[0]);
      assert.equal(ts.get('ad')[0], items[0]);
      assert.equal(ts.get('add')[0], items[0]);
      assert.equal(ts.get('adde')[0], items[0]);
      assert.equal(ts.get('addendum')[0], items[0]);

      assert.equal(ts.get('c')[0], items[2]);
      assert.equal(ts.get('ca')[0], items[2]);
      assert.equal(ts.get('cat')[0], items[2]);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item with a numeric key', function() {
    var ts = new TrieSearch('key'),
      item = {key: 1234567890};

    ts.add(item);

    it('add(\'1234567890\') should build map of nodes', function() {
      assert(ts.root['1'] !== undefined, '1 does not exist');
      assert(ts.root['1']['2'] !== undefined, '12 does not exist');
      assert(ts.root['1']['2']['3'] !== undefined, '123 does not exist');
      assert(ts.root['1']['2']['3']['4'] !== undefined, '1234 does not exist');
    });

    it('get(\'1234567890\') for each subkey should work', function() {
      assert.equal(ts.get('1')[0], item);
      assert.equal(ts.get('12')[0], item);
      assert.equal(ts.get('123')[0], item);
      assert.equal(ts.get('1234')[0], item);
      assert.equal(ts.get('1234')[0], item);
      assert.equal(ts.get('12345')[0], item);
      assert.equal(ts.get('123456')[0], item);
      assert.equal(ts.get('1234567')[0], item);
      assert.equal(ts.get('nope').length, 0);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item with no split and whitespace', function() {
    var ts = new TrieSearch('key', {
        splitOnRegEx: false
      }),
      item = {key: 'hello world'};

    ts.add(item);

    it('add(\'hello world\') should build map of nodes', function() {
      assert(ts.root.h.e.l.l.o !== undefined, '\'hello\' does not exist');
      assert(ts.root.h.e.l.l.o[' '] !== undefined, '\'hello \' does not exist');
      assert(ts.root.h.e.l.l.o[' '].w.o.r.l.d !== undefined, '\'hello world\' does not exist');
    });

    it('get(\'hello world\') for each subkey should work', function() {
      assert.equal(ts.get('h')[0], item);
      assert.equal(ts.get('he')[0], item);
      assert.equal(ts.get('hel')[0], item);
      assert.equal(ts.get('hell')[0], item);
      assert.equal(ts.get('hello')[0], item);
      assert.equal(ts.get('hello ')[0], item);
      assert.equal(ts.get('hello w')[0], item);
      assert.equal(ts.get('hello wo')[0], item);
      assert.equal(ts.get('hello wor')[0], item);
      assert.equal(ts.get('hello worl')[0], item);
      assert.equal(ts.get('hello world')[0], item);
      assert.equal(ts.get('nope').length, 0);
    });
  });

  describe('TrieSearch::get(...) should work for multiple keys and union the result', function() {
    var ts = new TrieSearch('key', {min: 2}),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'the quick\') should return all entries', function() {
      assert(ts.get('the quick').length == 3);
    });

    it('get(\'the brown\') should return 2 entries', function() {
      assert(ts.get('the brown').length == 2);
    });

    it('get(\'the fox\') should return 3 entries', function() {
      assert(ts.get('the fox').length == 3);
    });

    it('get(\'fox brown\') should return 1 entry', function() {
      assert(ts.get('fox brown').length == 1);
    });

    it('get(\'brown fox\') should return 1 entry', function() {
      assert(ts.get('brown fox').length == 1);
    });

    it('get(\'brown f\') should return 2 entry, ignoring the shortness of the second word', function() {
      assert(ts.get('brown f').length == 2);
    });

    it('get(\'br f\') should return 1 entry, ignoring the shortness of the second word', function() {
      assert(ts.get('br f').length == 2);
    });

    it('get(\'qui b c d e f g h\') should return 3 entries, ignoring the shortness of all subsequent words', function() {
      assert(ts.get('qui b c d e f g h').length == 3);
    });
  });

  describe('TrieSearch::get(...) should work for array of phrases', function() {
    var ts = new TrieSearch('key', {min: 2}),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get([\'the brown\', \'quick\']) should return 3 entries', function() {
      assert(ts.get(['the brown', 'quick']).length == 3);
    });
  });

  describe('TrieSearch::get(...) should work with cache==true', function() {
    var ts = new TrieSearch('key', {min: 2}),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('_get() should return identical array for the same request', function() {
      var f1 = ts._get('the brown'),
        f2 = ts._get('the brown');

      assert(f1 === f2, 'was not the same array.');
    });

    it('_get() should clear cache when clearCache() is called', function() {
      var f1 = ts._get('the brown');
      ts.clearCache();
      var f2 = ts._get('the brown');

      assert(f1 !== f2, 'cache was not cleared.');
    });
  });

  describe('TrieSearch::get(...) should work with cache==true and maxCacheSize == X', function() {
    var ts = new TrieSearch('key', {
        min: 2,
        maxCacheSize: 2
      }),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('cache size should increment appropriately and cap at maxCacheSize.', function() {
      var f1 = ts._get('the brown');
      assert(ts.getCache.all.length == 1, 'Cache size was not size 1.');
      ts._get('the quick');
      assert(ts.getCache.all.length == 2, 'Cache size was not size 2 (this quick).'); // Should cap at 2.
      ts._get('the fox');
      assert(ts.getCache.all.length == 2, 'Cache size was not size 2 (the fox).'); // Should remain at 2.
      var f2 = ts._get('the brown'); // This should return different array.

      assert(f1 !== f2, 'cache did not clear out old value!');
    });
  });

  describe('TrieSearch::get(...) should work with cache==false', function() {
    var ts = new TrieSearch('key', {min: 2, cache: false}),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('_get() should return DIFFERENT array for the same request', function() {
      var f1 = ts._get('the brown'),
        f2 = ts._get('the brown');

      assert(f1 !== f2, 'was not the same array.');
    });
  });

  describe('TrieSearch::get(...) should work for multiple keys and union the result with an indexField', function() {
    var ts = new TrieSearch(['key', 'key2'], {min: 2, indexField: 'ix'}),
      item1 = {key: 'the quick brown fox', key2: 'jumped', ix: 1},
      item2 = {key: 'the quick brown', key2: 'jumped',ix: 2},
      item3 = {key: 'the quick fox', key2: 'brown', ix: 3},
      item4 = {key: 'the fox', key2: 'quick brown', ix: 4};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'the quick\') should return all 4 entries', function() {
      assert(ts.get('the quick').length == 4);
    });

    it('get(\'the brown\') should return all 4 entries', function() {
      assert(ts.get('the brown').length == 4);
    });

    it('get(\'the fox\') should return 3 entries', function() {
      assert(ts.get('the fox').length == 3);
    });

    it('get(\'fox brown\') should return 3 entries', function() {
      assert(ts.get('fox brown').length == 3);
    });

    it('get(\'brown fox\') should return 3 entries', function() {
      assert(ts.get('brown fox').length == 3);
    });

    it('get(\'brown z\') should return 4 entries', function() {
      assert(ts.get('brown z').length == 4);
    });

    it('get(\'br f\') should return all entries', function() {
      assert(ts.get('br f').length == 4);
    });

    it('get(\'jum b c d e f g h\') should return 2 entries, ignoring the shortness of all subsequent words', function() {
      assert(ts.get('jum b c d e f g h').length == 2);
    });
  });

  describe('TrieSearch::get(...) should work for a deep key combined with a non-deep key', function() {
    var ts = new TrieSearch(['key', ['key2', 'key3']], {min: 2, indexField: 'ix'}),
      item1 = {key: 'the quick brown fox', key2: {key3: 'jumped'}, ix: 1},
      item2 = {key: 'the quick brown', key2: {key3: 'jumped'},ix: 2},
      item3 = {key: 'the quick fox', key2: {key3: 'brown'}, ix: 3},
      item4 = {key: 'the fox', key2: {key3: 'quick brown'}, ix: 4};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'the quick\') should return all 4 entries', function() {
      assert(ts.get('the quick').length == 4);
    });

    it('get(\'the brown\') should return all 4 entries', function() {
      assert(ts.get('the brown').length == 4);
    });

    it('get(\'the fox\') should return 3 entries', function() {
      assert(ts.get('the fox').length == 3);
    });

    it('get(\'fox brown\') should return 3 entries', function() {
      assert(ts.get('fox brown').length == 3);
    });

    it('get(\'brown fox\') should return 3 entries', function() {
      assert(ts.get('brown fox').length == 3);
    });

    it('get(\'brown z\') should return 4 entries', function() {
      assert(ts.get('brown z').length == 4);
    });

    it('get(\'br f\') should return all entries', function() {
      assert(ts.get('br f').length == 4);
    });

    it('get(\'jum b c d e f g h\') should return 2 entries, ignoring the shortness of all subsequent words', function() {
      assert(ts.get('jum b c d e f g h').length == 2);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item with multiple subphrases', function() {
    var ts = new TrieSearch('key'),
      item = {key: 'blah whatever yeah man'};

    ts.add(item);

    it('add(\'blah\') should build map of nodes', function() {
      assert(ts.root['b'] !== undefined, 'b does not exist');
      assert(ts.root['b']['l'] !== undefined, 'bl does not exist');
      assert(ts.root['b']['l']['a'] !== undefined, 'bla does not exist');
      assert(ts.root['b']['l']['a']['h'] !== undefined, 'blah does not exist');
    });

    it('get(\'blah\') and get(\'whatever\') for each subkey should work', function() {
      assert.equal(ts.get('b')[0], item);
      assert.equal(ts.get('bl')[0], item);
      assert.equal(ts.get('bla')[0], item);
      assert.equal(ts.get('blah')[0], item);

      assert.equal(ts.get('w')[0], item);
      assert.equal(ts.get('wh')[0], item);
      assert.equal(ts.get('whatever')[0], item);
    });

    it('get(\'whatever\') for each subkey should work', function() {
      assert.equal(ts.get('w')[0], item);
      assert.equal(ts.get('what')[0], item);
      assert.equal(ts.get('whatever')[0], item);
    });

    it('get(\'yeah\') for each subkey should work', function() {
      assert.equal(ts.get('y')[0], item);
      assert.equal(ts.get('ye')[0], item);
      assert.equal(ts.get('yea')[0], item);
      assert.equal(ts.get('yeah')[0], item);
    });

    it('get(\'man\') for each subkey should work', function() {
      assert.equal(ts.get('m')[0], item);
      assert.equal(ts.get('ma')[0], item);
      assert.equal(ts.get('man')[0], item);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for multiple items', function() {
    var ts = new TrieSearch('key'),
      item1 = {key: 'I am item1!'},
      item2 = {key: 'I am item2!'};

    ts.add(item1);
    ts.add(item2);

    it('add(item1) and add(item2) should build map of nodes', function() {
      assert(ts.root['i'] !== undefined, 'I does not exist');
      assert(ts.root['a']['m'] !== undefined, 'am does not exist');
      assert(ts.root['i']['t']['e']['m']['1'] !== undefined, 'item1 does not exist');
      assert(ts.root['i']['t']['e']['m']['2'] !== undefined, 'item2 does not exist');
    });

    it('get(\'i\') should return 2 items', function() {
      assert(ts.get('i').length == 2, 'did not return 2 items!');
      assert(ts.get('item').length == 2, 'did not return 2 items!');
    });

    it('get(\'item1\') and get(\'item2\') should return 1 item', function() {
      assert(ts.get('item1').length == 1, 'did not return 1 item!');
      assert(ts.get('item2').length == 1, 'did not return 1 item!');
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work with options.min', function() {
    var ts = new TrieSearch('key', {min: 2}),
      item1 = {key: 'I am item1!'},
      item2 = {key: 'I am item2!'};

    ts.add(item1);
    ts.add(item2);

    it('add(item1) and add(item2) should build map of nodes', function() {
      assert(ts.root['i'] === undefined, 'I should not exist!');
      assert(ts.root['am'] !== undefined, 'am does not exist');
      assert(ts.root['it']['e']['m']['1'] !== undefined, 'item1 does not exist');
      assert(ts.root['it']['e']['m']['2'] !== undefined, 'item2 does not exist');
    });

    it('get(\'i\') should return 0 items', function() {
      assert(ts.get('i').length == 0, 'did not return 0 items!');
      assert(ts.get('item').length == 2, 'did not return 2 items!');
    });

    it('get(\'item\') should return 2 items', function() {
      assert(ts.get('item').length == 2, 'did not return 2 items!');
    });

    it('get(\'item1\') and get(\'item2\') should return 1 item', function() {
      assert(ts.get('item1').length == 1, 'did not return 1 item!');
      assert(ts.get('item2').length == 1, 'did not return 1 item!');
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work with customKeys', function() {
    var ts = new TrieSearch('key', {min: 2}),
      item1 = {customKey1: 'I am item1!', customKey2: '123'},
      item2 = {customKey1: 'I am item2!', customKey2: '456'};

    ts.add(item1, ['customKey1']);
    ts.add(item2, ['customKey1', 'customKey2']);

    it('add(item1) and add(item2) should build map of nodes', function() {
      assert(ts.root['i'] === undefined, 'I should not exist!');
      assert(ts.root['am'] !== undefined, 'am does not exist');
      assert(ts.root['it']['e']['m']['1'] !== undefined, 'item1 does not exist');
      assert(ts.root['it']['e']['m']['2'] !== undefined, 'item2 does not exist');
      assert(ts.root['12'] === undefined, 'item1 should not exist on search for 123');
      assert(ts.root['45']['6'] !== undefined, 'item2 does not exist on search for 456');
    });

    it('get(\'i\') should return 0 items', function() {
      assert(ts.get('i').length == 0, 'did not return 0 items!');
      assert(ts.get('item').length == 2, 'did not return 2 items!');
    });

    it('get(\'123\') should return 0 items', function() {
      assert(ts.get('123').length == 0, 'did not return 0 items!');
    });

    it('get(\'45\') should return 1 items', function() {
      assert(ts.get('456').length == 1, 'did not return 0 items!');
    });
  });

  describe('TrieSearch::get(...) should work with a custom reducer and accumulator', function() {
    var ts = new TrieSearch('key', {
        min: 2,
        idFieldOrFunction: 'key'
    }),
      item1 = {key: 'I am red robin!'},
      item2 = {key: 'I am red cockatiel!'},
      item3 = {key: 'I am green cardinal!'},
      item4 = {key: 'I am green owl!'},
      item5 = {key: 'robin cockatiel cardinal owl!'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);
    ts.add(item5);

    it('get(\'robin\', [reducer])', function() {
      let result = ts.get('robin', function(_accumulator, phrase, phraseMatches, trie) {
        assert(_accumulator === undefined, 'accumulator should be undefined on first pass for first phrase');
        assert(phrase === 'robin', 'phrase was incorrect');
        assert(phraseMatches.length === 2, 'phraseMatches length is incorrect');
        assert(phraseMatches[0] === item5, 'wrong phraseMatches returned');
        assert(phraseMatches[1] === item1, 'wrong phraseMatches returned');
        assert(trie === ts, 'Trie did not equal ts');

        _accumulator = _accumulator || [];
        _accumulator.push(phraseMatches[1]);
        _accumulator.push(phraseMatches[0]);

        return _accumulator;
      });

      assert(result.length === 2, 'result has incorrect length: ' + result.length);
      assert(result[0] === item1, 'result has incorrect items');
      assert(result[1] === item5, 'result has incorrect items');
    });

    it('get([\'red\', \'robin\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['red', 'robin'], TrieSearch.UNION_REDUCER);

      assert(result.length, 'result has incorrect length: ' + result.length);
      assert(result[0] === item1, 'result has incorrect items');
    });

    it('get([\'green\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['green'], TrieSearch.UNION_REDUCER);

      assert(result.length === 2, 'result has incorrect length');
      assert(result[0] === item3, 'result has incorrect items');
      assert(result[1] === item4, 'result has incorrect items');
    });

    it('get(\'green\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('green', TrieSearch.UNION_REDUCER);

      assert(result.length === 2, 'result has incorrect length');
      assert(result[0] === item3, 'result has incorrect items');
      assert(result[1] === item4, 'result has incorrect items');
    });

    it('get(\'blue\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('blue', TrieSearch.UNION_REDUCER);

      assert(result.length === 0, 'result has incorrect length');
    });

    it('get(\'am\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('am', TrieSearch.UNION_REDUCER);

      assert(result.length === 4, 'result has incorrect length');
    });

    it('get([\'owl\', \'card\', \'cock\', \'rob\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['owl', 'card', 'cock', 'rob'], TrieSearch.UNION_REDUCER);

      assert(result.length === 1, 'result has incorrect length: ' + result.length);
    });

    it('get([\'owl\', \'card\', \'cock\', \'rob\', \'fubar\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['owl', 'card', 'cock', 'rob', 'fubar'], TrieSearch.UNION_REDUCER);

      assert(result.length === 0, 'result has incorrect length: ' + result.length);
    });
  });

  describe('TrieSearch::get(...) with internationalization turned on (default) should work', function() {
    let as = 'åäàáâã'.split('');
    let es = 'èéêë'.split('');
    let is = 'ìíîï'.split('');
    let os = 'òóôõö'.split('');
    let us = 'ùúûü'.split('');
    let aes = 'æ'.split('');

    let ts = new TrieSearch('key'),
        As_items =  as.map(letter => ({key: letter, arr: as})),
        Es_items =  es.map(letter => ({key: letter, arr: es})),
        Is_items =  is.map(letter => ({key: letter, arr: is})),
        Os_items =  os.map(letter => ({key: letter, arr: os})),
        Us_items =  us.map(letter => ({key: letter, arr: us})),
        AEs_items = aes.map(letter => ({key: letter, arr: aes}));

    ts.addAll(As_items);
    ts.addAll(Es_items);
    ts.addAll(Is_items);
    ts.addAll(Os_items);
    ts.addAll(Us_items);
    ts.addAll(AEs_items);

    it(`Should return international items for "a" -> any of "${as}"`, function() {
      let items = ts.get('a');

      // Note this will include overlap with the ae!
      assert(items.length === 7);

      items.forEach(i => {
        assert(i.arr === as || i.arr === aes);
      });
    });

    it(`Should return international items for "e" -> any of "${es}"`, function() {
      let items = ts.get('e');
      assert(items.length === 4);

      items.forEach(i => {
        assert(i.arr === es);
      });
    });

    it(`Should return international items for "i" -> any of "${is}"`, function() {
      let items = ts.get('i');
      assert(items.length === 4);

      items.forEach(i => {
        assert(i.arr === is);
      });
    });

    it(`Should return international items for "o" -> any of "${os}"`, function() {
      let items = ts.get('o');
      assert(items.length === 5);

      items.forEach(i => {
        assert(i.arr === os);
      });
    });

    it(`Should return international items for "u" -> any of "${us}"`, function() {
      let items = ts.get('u');
      assert(items.length === 4);

      items.forEach(i => {
        assert(i.arr === us);
      });
    });

    it(`Should return international items for Swedish as an example with ''godis på sötdag är bra''`, function() {
      let swedishSentence = {key: 'godis på sötdag är bra'};

      ts.add(swedishSentence);

      assert(ts.get('pa').length === 1);
      assert(ts.get('sot').length === 1);
      assert(ts.get('ar').length === 1);
    });
  });

  describe('TrieSearch::map(...) works with RegEx with positive lookahead (e.g. split on capital letters)', function() {
    it('should not error', function() {
      try {
        var ts = new TrieSearch('key', {
            splitOnRegEx: /([.\-\s']|(?=[A-Z]))/,
            splitOnGetRegEx: false,
          }),
          item = {someValue: 12345},
          item2 = {someValue: 67890};

        ts.map('This IsSome.Phrase-Whatever', item);
      } catch (error) {
        assert(false, error ? error.toString() : '');
      }
    });

    it('should match capital letter breaks', function() {
      var ts = new TrieSearch('key', {
          splitOnRegEx: /([.\-\s'_]|(?=[A-Z]))/,
          splitOnGetRegEx: false,
          insertFullUnsplitKey: true
        }),
        item = {someValue: 12345},
        item2 = {someValue: 67890};

      ts.map('It\'sOnlyA_Flesh Wound', item);
      ts.map('WhatIsYourFavoriteColor', item2);

      assert(ts.get('It')[0] === item, 'Did not properly match It');
      assert(ts.get('s')[0] === item, 'Did not properly match s');
      assert(ts.get('Only')[0] === item, 'Did not properly match Only');
      assert(ts.get('A')[0] === item, 'Did not properly match A');
      assert(ts.get('Flesh')[0] === item, 'Did not properly match Flesh');
      assert(ts.get('Wound')[0] === item, 'Did not properly match Wound');
      assert(ts.get('It\'sOnlyA_Flesh Wound')[0] === item, 'Did not properly match full phrase It\'sOnlyAFlesh Wound');

      assert(ts.get('What')[0] === item2, 'Did not properly match What');
      assert(ts.get('Is')[0] === item2, 'Did not properly match Is');
      assert(ts.get('Your')[0] === item2, 'Did not properly match Your');
      assert(ts.get('Fav')[0] === item2, 'Did not properly match Fav');
      assert(ts.get('Favorite')[0] === item2, 'Did not properly match Favorite');
      assert(ts.get('Color')[0] === item2, 'Did not properly match Color');
      assert(ts.get('WhatIsYourFavoriteColor')[0] === item2, 'Did not properly match full phrase WhatIsYourFavoriteColor');
    });

    it('should match capital letter breaks', function() {
      var ts = new TrieSearch('someValue', {
          splitOnRegEx: /([.\-\s'_]|(?=[A-Z]))/,
          splitOnGetRegEx: /[\s]/
        }),
        item = {someValue: 12345},
        item2 = {someValue: 67890};

      ts.map('WhatIsYourFavoriteColor', item2);

      assert(ts.get('What Is')[0] === item2, 'Did not properly match What');
      assert(ts.get('Color Favorite')[0] === item2, 'Did not properly match Is');
    });
  });

  describe('TrieSearch::get(...) works with expandMisspellings=true', function() {
    it('should work with deletions', function() {
      var ts = new TrieSearch('someValue', {
          enableMisspellings: true
        }),
        item = {someValue: 'hello'},
        item2 = {someValue: 'what. up arthur!'};

      ts.add(item);
      ts.add(item2);

      assert(ts.get('.').length === 0, 'Did not properly match .');

      assert(ts.get('h')[0] === item, 'Did not properly match h');
      assert(ts.get('hello')[0] === item, 'Did not properly match hello');
      assert(ts.get('helo')[0] === item, 'Did not properly match hlelo');
      assert(ts.get('hell')[0] === item, 'Did not properly match hell');
      assert(ts.get('hllo')[0] === item, 'Did not properly match hell');

      assert(ts.get('wht')[0] === item2, 'Did not properly match wht');
      assert(ts.get('wat')[0] === item2, 'Did not properly match wat');

      assert(ts.get('up')[0] === item2, 'Did not properly match up');

      assert(ts.get('artur')[0] === item2, 'Did not properly match artur');
      assert(ts.get('artu')[0] === item2, 'Did not properly match artu');
      assert(ts.get('athur')[0] === item2, 'Did not properly match athur');
      assert(ts.get('arhur')[0] === item2, 'Did not properly match arhur');
      assert(ts.get('arthr')[0] === item2, 'Did not properly match arthr');
    });
  });
});
