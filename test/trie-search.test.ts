import {describe, it, expect} from '@jest/globals';
import TrieSearch from '../index.js';

describe('TrieSearch', function() {
  describe('new TrieSearch(keyFields) should work', function() {
    it('should set keyfields (1)', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>(['key']);
      expect(ts.keyFields.length).toEqual(1)
    });

    it('should set keyfields (2)', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>('key');
      expect(ts.keyFields.length).toEqual(1);
    });
  });

  describe('map(key, value) and search(str) should work', function() {
    it('should be able to call map() and search()', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>();

      const item = { value: 'world' };

      ts.map('hello', item);

      expect(ts.search('hel').length).toEqual(1);
      expect(ts.search('hell').length).toEqual(1);
      expect(ts.search('hello').length).toEqual(1);
      expect(ts.search('hel')[0]).toStrictEqual(item);
    });
  });

  describe('new TrieSearch(keyFields).keyToArr should work', function() {
    it('\'key\' -> [\'k\', \'e\', \'y\']', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>();
      expect(ts.keyToArr('key')[0]).toEqual('k')
      expect(ts.keyToArr('key')[1]).toEqual('e')
      expect(ts.keyToArr('key')[2]).toEqual('y')
    });

    it('for options.min == 2, \'key\' -> [\'ke\', \'y\']', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>('blah', {min: 2});
      expect(ts.keyToArr('key')[0]).toEqual('ke')
      expect(ts.keyToArr('key')[1]).toEqual('y')
    });

    it('for options.min == 2, \'keyset\' -> [\'ke\', \'y\', \'s\', \'e\', \'t\']', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>('blah', {min: 2});
      expect(ts.keyToArr('keyset')[0]).toEqual('ke');
      expect(ts.keyToArr('keyset')[1]).toEqual('y');
      expect(ts.keyToArr('keyset')[2]).toEqual('s');
      expect(ts.keyToArr('keyset')[3]).toEqual('e');
      expect(ts.keyToArr('keyset')[4]).toEqual('t');
    });

    it('for options.min == 3, \'key\' -> [\'key\']', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>('blah', {min: 3});
      expect(ts.keyToArr('key')[0]).toEqual('key')
    });

    it('for options.min == 4, \'key\' -> []', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>('blah', {min: 4});
      expect(ts.keyToArr('key').length).toEqual(0)
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key'),
      item : Item = { key: 'blah' };

    ts.add(item);

    it('add(\'blah\') should build map of nodes', function() {
      expect(ts.root['b']).toBeDefined()
      expect(ts.root['b']['l']).toBeDefined()
      expect(ts.root['b']['l']['a']).toBeDefined();
      expect(ts.root['b']['l']['a']['h']).toBeDefined();
    });

    it('get(\'blah\') for each subkey should work', function() {
      expect(ts.get('b')[0]).toBe(item);
      expect(ts.get('bl')[0]).toBe(item);
      expect(ts.get('bla')[0]).toBe(item);
      expect(ts.get('blah')[0]).toBe(item);
      expect(ts.get('blab')[0]).toBeUndefined();
      expect(ts.get('nope')[0]).toBeUndefined();
    });
  });

  describe('TrieSearch::addAll(...)should work for an array', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key'),
      items : Item[] = [{key: 'addendum'}, {key: 'banana'}, {key: 'cat'}];

    ts.addAll(items);

    it('get(\'blah\') for each subkey should work', function() {
      expect(ts.get('b')[0]).toBe(items[1]);
      expect(ts.get('ba')[0]).toBe(items[1]);
      expect(ts.get('ban')[0]).toBe(items[1]);
      expect(ts.get('bana')[0]).toBe(items[1]);
      expect(ts.get('banan')[0]).toBe(items[1]);
      expect(ts.get('banana')[0]).toBe(items[1]);

      expect(ts.get('a')[0]).toBe(items[0]);
      expect(ts.get('ad')[0]).toBe(items[0]);
      expect(ts.get('add')[0]).toBe(items[0]);
      expect(ts.get('adde')[0]).toBe(items[0]);
      expect(ts.get('adden')[0]).toBe(items[0]);
      expect(ts.get('addend')[0]).toBe(items[0]);
      expect(ts.get('addendu')[0]).toBe(items[0]);
      expect(ts.get('addendum')[0]).toBe(items[0]);

      expect(ts.get('c')[0]).toBe(items[2]);
      expect(ts.get('ca')[0]).toBe(items[2]);
      expect(ts.get('cat')[0]).toBe(items[2]);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item with a numeric key', function() {
    type Item = {
      key : number
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key'),
      item = { key: 1234567890 };

    ts.add(item);

    it('add(\'1234567890\') should build map of nodes', function() {
      expect(ts.root['1']).toBeDefined();
      expect(ts.root['1']['2']).toBeDefined();
      expect(ts.root['1']['2']['3']).toBeDefined();
      expect(ts.root['1']['2']['3']['4']).toBeDefined();
    });

    it('get(\'1234567890\') for each subkey should work', function() {
      expect(ts.get('1')[0]).toBe(item)
      expect(ts.get('12')[0]).toBe(item)
      expect(ts.get('123')[0]).toBe(item)
      expect(ts.get('1234')[0]).toBe(item)
      expect(ts.get('12345')[0]).toBe(item)
      expect(ts.get('123456')[0]).toBe(item)
      expect(ts.get('1234567')[0]).toBe(item)
      expect(ts.get('12345678')[0]).toBe(item)
      expect(ts.get('123456789')[0]).toBe(item)
      expect(ts.get('1234567890')[0]).toBe(item)
      expect(ts.get('nope').length).toEqual(0)
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item with no split and whitespace', function() {
    type Item = {
      key : string
    }

    // When we specify FALSE for splitOnRegEx, we are saying we do not want to split any of the values before mapping
    // not even on any whitespace
    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {
        splitOnRegEx: false
      }),
      item : Item = {key: 'hello world'};

    ts.add(item);

    it('add(\'hello world\') should build map of nodes', function() {
      expect(ts.root.h.e.l.l.o).toBeDefined();
      expect(ts.root.h.e.l.l.o[' ']).toBeDefined();
      expect(ts.root.h.e.l.l.o[' '].w.o.r.l.d).toBeDefined();
    });

    it('get(\'hello world\') for each subkey should work', function() {
      expect(ts.get('h')[0]).toBe(item);
      expect(ts.get('he')[0]).toBe(item);
      expect(ts.get('hel')[0]).toBe(item);
      expect(ts.get('hell')[0]).toBe(item);
      expect(ts.get('hello')[0]).toBe(item);
      expect(ts.get('hello ')[0]).toBe(item);
      expect(ts.get('hello w')[0]).toBe(item);
      expect(ts.get('hello wo')[0]).toBe(item);
      expect(ts.get('hello wor')[0]).toBe(item);
      expect(ts.get('hello worl')[0]).toBe(item);
      expect(ts.get('hello world')[0]).toBe(item);
      expect(ts.get('nope').length).toEqual(0);
    });
  });

  describe('TrieSearch::get(...) should work for multiple keys and OR the result when the search field contains multiple words', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {min: 2}),
      item1 : Item = {key: 'the quick brown fox'},
      item2 : Item = {key: 'the quick brown'},
      item3 : Item = {key: 'the quick fox'},
      item4 : Item = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'the quick\') should return the first three entries only', function() {
      expect(ts.get('the quick').length).toEqual(3);
    });

    it('get(\'the brown\') should return 2 items only', function() {
      expect(ts.get('the brown').length).toEqual(2);
    });

    it('get(\'the fox\') should return 3 entries', function() {
      expect(ts.get('the fox').length).toEqual(3);
    });

    it('get(\'fox brown\') should return 1 entry', function() {
      expect(ts.get('fox brown').length).toEqual(1);
    });

    it('get(\'brown fox\') should return 1 entry', function() {
      expect(ts.get('brown fox').length).toEqual(1);
    });

    it('get(\'brown f\') should return 2 entry, ignoring the shortness of the second word', function() {
      expect(ts.get('brown f').length).toEqual(2);
    });

    it('get(\'br f\') should return 1 entry, ignoring the shortness of the second word', function() {
      expect(ts.get('br f').length).toEqual(2);
    });

    it('get(\'qui b c d e f g h\') should return 3 entries, ignoring the shortness of all subsequent words, ' +
      'because the minimum length has not been met for them', function() {
      expect(ts.get('qui b c d e f g h').length).toEqual(3);
    });
  });

  describe('TrieSearch::get(...) should by default AND the results across a single key', function() {
    const ts : TrieSearch<any> = new TrieSearch<any>(['key']),
      item1 : any = {key: 'guadalupe mountains national park'},
      item2 : any = {key: 'guadalupe island'},
      item3 : any = {key: 'city of guadalupe'},
      item4 : any = {key: 'big bend national park'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'guadalupe park\') should the first entry only', function() {
      expect(ts.get('guadalupe park').length).toEqual(1);
      expect(ts.get('guadalupe park').indexOf(item1)).toBeGreaterThan(-1);
    });

    it('get(\'national park\') should return the national park ones', function() {
      expect(ts.get('national park').length).toEqual(2);
      expect(ts.get('national park').indexOf(item1)).toBeGreaterThan(-1);
      expect(ts.get('national park').indexOf(item4)).toBeGreaterThan(-1);
    });
  });

  describe('TrieSearch::get(...) should by default AND the results across multiple keys', function() {
    const ts : TrieSearch<any> = new TrieSearch<any>(['name', 'type']),
      item1 : any = {
        name: 'guadalupe mountains',
        type: 'national park'
      },
      item2 : any = {
        name: 'guadalupe',
        type: 'island'
      },
      item3 : any = {
        name: 'city of guadalupe',
        type: 'city'
      },
      item4 : any = {
        name: 'big bend',
        type: 'national park'
      };

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'guadalupe park\') should the first entry only', function() {
      expect(ts.get('guadalupe park').length).toEqual(1);
      expect(ts.get('guadalupe park').indexOf(item1)).toBeGreaterThan(-1);
    });

    it('get(\'national park\') should return the national park ones', function() {
      expect(ts.get('national park').length).toEqual(2);
      expect(ts.get('national park').indexOf(item1)).toBeGreaterThan(-1);
      expect(ts.get('national park').indexOf(item4)).toBeGreaterThan(-1);
    });
  });

  describe('TrieSearch::get(...) should work for array of phrases', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key'),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get([\'the\', \'brown\', \'quick\']) should return 0 entries', function() {
      expect(ts.get(['the', 'brown', 'quick']).length).toEqual(2);
    });

    it('get([\'the brown\', \'quick\']) should return 0 entries', function() {
      expect(ts.get(['the brown', 'quick']).length).toEqual(0);
    });
  });

  describe('TrieSearch::get(...) should work with cache==true', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {
        min: 2,
        cache : true
      }),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('_get() should return identical array for the same request', function() {
      const f1 = (ts as any)._get('the brown'),
        f2 = (ts as any)._get('the brown');

      expect(f1).toBe(f2);
    });

    it('_get() should clear cache when clearCache() is called', function() {
      const f1 = (ts as any)._get('the brown');
      ts.clearCache();
      const f2 = (ts as any)._get('the brown');

      expect(f1).not.toBe(f2);
    });
  });

  describe('TrieSearch::get(...) should work with cache==true and maxCacheSize == X', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {
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
      const f1 = (ts as any)._get('the brown');
      expect((ts as any).getCache.all.length).toEqual(1);
      expect((ts as any).getCache.all.length).toEqual(1);
      (ts as any)._get('the quick');
      expect((ts as any).getCache.all.length).toEqual(2);
      (ts as any)._get('the fox');
      expect((ts as any).getCache.all.length).toEqual(2);
      const f2 = (ts as any)._get('the brown'); // This should return different array.

      expect(f1).not.toBe(f2);
    });
  });

  describe('TrieSearch::get(...) should work with cache==false', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', { min: 2, cache: false }),
      item1 = {key: 'the quick brown fox'},
      item2 = {key: 'the quick brown'},
      item3 = {key: 'the quick fox'},
      item4 = {key: 'the fox'};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('_get() should return DIFFERENT array for the same request', function() {
      const f1 = (ts as any)._get('the brown'),
        f2 = (ts as any)._get('the brown');

      expect(f1).not.toBe(f2);
    });
  });

  describe('TrieSearch::get(...) should work for multiple keys and union the result with an indexField', function() {
    type Item = {
      key : string
      key2 : string
      ix : number
    }

    const ts : TrieSearch<Item> = new TrieSearch(['key', 'key2'], {
        min: 2,
        indexField: 'ix'
      }),
      item1 = {key: 'the quick brown fox', key2: 'jumped', ix: 1},
      item2 = {key: 'the quick brown', key2: 'jumped',ix: 2},
      item3 = {key: 'the quick fox', key2: 'brown', ix: 3},
      item4 = {key: 'the fox', key2: 'quick brown', ix: 4};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'the quick\') should return all entries', function() {
      expect(ts.get('the quick').length).toBe(4);
    });

    it('get(\'the brown\') should return all entries', function() {
      expect(ts.get('the brown').length).toBe(4);
    });

    it('get(\'the fox\') should return 3 entries', function() {
      expect(ts.get('the fox').length).toBe(3);
    });

    it('get(\'fox brown\') should return 3 entries', function() {
      expect(ts.get('fox brown').length).toBe(3);
    });

    it('get(\'brown fox\') should return 3 entries', function() {
      expect(ts.get('brown fox').length).toBe(3);
    });

    it('get(\'brown z\') should return all entries', function() {
      expect(ts.get('brown z').length).toBe(4);
    });

    it('get(\'br f\') should return all entries', function() {
      expect(ts.get('br f').length).toBe(4);
    });

    it('get(\'jum b c d e f g h\') should return 2 entries, ignoring the shortness of all subsequent words', function() {
      expect(ts.get('jum b c d e f g h').length).toBe(2);
    });
  });

  describe('TrieSearch::get(...) should work for a deep key combined with a non-deep key', function() {
    type Item = {
      key : string
      key2 : {
        key3: string
      }
      ix : number
    }

    const ts : TrieSearch<Item> = new TrieSearch(['key', ['key2', 'key3']], {min: 2, indexField: 'ix'}),
      item1 = {key: 'the quick brown fox', key2: {key3: 'jumped'}, ix: 1},
      item2 = {key: 'the quick brown', key2: {key3: 'jumped'},ix: 2},
      item3 = {key: 'the quick fox', key2: {key3: 'brown'}, ix: 3},
      item4 = {key: 'the fox', key2: {key3: 'quick brown'}, ix: 4};

    ts.add(item1);
    ts.add(item2);
    ts.add(item3);
    ts.add(item4);

    it('get(\'the quick\') should return all 4 entries', function() {
      expect(ts.get('the quick').length).toEqual(4);
    });

    it('get(\'the brown\') should return all 4 entries', function() {
      expect(ts.get('the brown').length).toEqual(4);
    });

    it('get(\'the fox\') should return 3 entries', function() {
      expect(ts.get('the fox').length).toEqual(3);
    });

    it('get(\'fox brown\') should return 3 entries', function() {
      expect(ts.get('fox brown').length).toEqual(3);
    });

    it('get(\'brown fox\') should return 3 entries', function() {
      expect(ts.get('brown fox').length).toEqual(3);
    });

    it('get(\'brown z\') should return 4 entries', function() {
      expect(ts.get('brown z').length).toEqual(4);
    });

    it('get(\'br f\') should return all entries', function() {
      expect(ts.get('br f').length).toEqual(4);
    });

    it('get(\'jum b c d e f g h\') should return 2 entries, ignoring the shortness of all subsequent words', function() {
      expect(ts.get('jum b c d e f g h').length).toEqual(2);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for a single item with multiple subphrases', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key'),
      item = {key: 'blah whatever yeah man'};

    ts.add(item);

    it('add(\'blah\') should build map of nodes', function() {
      expect(ts.root['b']).toBeDefined()
      expect(ts.root['b']['l']).toBeDefined()
      expect(ts.root['b']['l']['a']).toBeDefined()
      expect(ts.root['b']['l']['a']['h']).toBeDefined()
    });

    it('get(\'blah\') and get(\'whatever\') for each subkey should work', function() {
      expect(ts.get('b')[0]).toBe(item);
      expect(ts.get('bl')[0]).toBe(item);
      expect(ts.get('bla')[0]).toBe(item);
      expect(ts.get('blah')[0]).toBe(item);
    });

    it('get(\'whatever\') for each subkey should work', function() {
      expect(ts.get('w')[0]).toBe(item);
      expect(ts.get('wh')[0]).toBe(item);
      expect(ts.get('whatever')[0]).toBe(item);
    });

    it('get(\'yeah\') for each subkey should work', function() {
      expect(ts.get('y')[0]).toBe(item);
      expect(ts.get('ye')[0]).toBe(item);
      expect(ts.get('yea')[0]).toBe(item);
      expect(ts.get('yeah')[0]).toBe(item);
    });

    it('get(\'man\') for each subkey should work', function() {
      expect(ts.get('m')[0]).toBe(item);
      expect(ts.get('ma')[0]).toBe(item);
      expect(ts.get('man')[0]).toBe(item);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work for multiple items', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key'),
      item1 = {key: 'I am item1!'},
      item2 = {key: 'I am item2!'};

    ts.add(item1);
    ts.add(item2);

    it('add(item1) and add(item2) should build map of nodes', function() {
      expect(ts.root['i']).toBeDefined();
      expect(ts.root['a']['m']).toBeDefined();
      expect(ts.root['i']['t']['e']['m']['1']).toBeDefined();
      expect(ts.root['i']['t']['e']['m']['2']).toBeDefined();
    });

    it('get(\'i\') should return 2 items', function() {
      expect(ts.get('i').length).toEqual(2);
      expect(ts.get('item').length).toEqual(2);
    });

    it('get(\'item1\') and get(\'item2\') should return 1 item', function() {
      expect(ts.get('item1').length).toEqual(1);
      expect(ts.get('item2').length).toEqual(1);
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work with options.min', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {min: 2}),
      item1 = {key: 'I am item1!'},
      item2 = {key: 'I am item2!'};

    ts.add(item1);
    ts.add(item2);

    it('add(item1) and add(item2) should build map of nodes', function() {
      expect(ts.root['i']).toBeUndefined();
      expect(ts.root['am']).toBeDefined();
      expect(ts.root['it']['e']['m']['1']).toBeDefined();
      expect(ts.root['it']['e']['m']['2']).toBeDefined();
    });

    it('get(\'i\') should return 0 items', function() {
      expect(ts.get('i').length).toEqual(0);
      expect(ts.get('item').length).toEqual(2);
    });

    it('get(\'item\') should return 2 items', function() {
      expect(ts.get('item').length).toEqual(2);
    });

    it('get(\'item1\') and get(\'item2\') should return 1 item', function() {
      expect(ts.get('item1').length).toEqual(1)
      expect(ts.get('item2').length).toEqual(1)
    });
  });

  describe('TrieSearch::add(...) and TrieSearch::get(...) should work with customKeys', function() {
    type Item = {
      customKey1 : string
      customKey2 : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('this_key_does_not_matter', { min: 2 }),
      item1 = {customKey1: 'I am item1!', customKey2: '123'},
      item2 = {customKey1: 'I am item2!', customKey2: '456'};

    ts.add(item1, ['customKey1']);
    ts.add(item2, ['customKey1', 'customKey2']);

    it('add(item1) and add(item2) should build map of nodes', function() {
      expect(ts.root['i']).toBeUndefined();
      expect(ts.root['am']).toBeDefined();

      expect(ts.root['it']['e']['m']['1']).toBeDefined();
      expect(ts.root['it']['e']['m']['2']).toBeDefined();

      expect(ts.root['12']).toBeUndefined();
      expect(ts.root['45']['6']).toBeDefined();
    });

    it('get(\'i\') should return 0 items', function() {
      expect(ts.get('i').length).toEqual(0);
    });

    it('get(\'item\') should return both items', function() {
      console.log(JSON.stringify(ts.root, null, 2));
      expect(ts.get('item').length).toEqual(2);
    });

    it('get(\'123\') should return 0 items', function() {
      expect(ts.get('123').length).toEqual(0);
    });

    it('get(\'45\') should return 1 items', function() {
      expect(ts.get('456').length).toEqual(1);
    });
  });

  describe('TrieSearch::get(...) should work with a custom reducer and accumulator', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {
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
      let result = ts.get('robin', function(_accumulator : Item[], phrase: string, phraseMatches : Item[], trie : TrieSearch<Item>) {
        expect(_accumulator).toBeUndefined();
        expect(phrase).toEqual('robin');
        expect(phraseMatches.length).toEqual(2);
        expect(phraseMatches[0]).toBe(item1)
        expect(phraseMatches[1]).toBe(item5)
        expect(trie).toBe(ts);

        _accumulator = _accumulator || [];
        _accumulator.push(phraseMatches[1]);
        _accumulator.push(phraseMatches[0]);

        return _accumulator;
      });

      expect(result.length).toEqual(2);
      expect(result[0]).toBe(item5);
      expect(result[1]).toBe(item1);
    });

    it('get([\'red\', \'robin\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['red', 'robin'], TrieSearch.UNION_REDUCER);

      expect(result.length).not.toEqual(0);
      expect(result[0]).toBe(item1);
    });

    it('get([\'green\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['green'], TrieSearch.UNION_REDUCER);

      expect(result.length).toEqual(2);
      expect(result[0]).toBe(item3);
      expect(result[1]).toBe(item4);
    });

    it('get(\'green\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('green', TrieSearch.UNION_REDUCER);

      expect(result.length).toEqual(2);
      expect(result[0]).toBe(item3);
      expect(result[1]).toBe(item4);
    });

    it('get(\'blue\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('blue', TrieSearch.UNION_REDUCER);

      expect(result.length).toEqual(0)
    });

    it('get(\'am\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('am', TrieSearch.UNION_REDUCER);

      expect(result.length).toEqual(4);
    });

    it('get([\'owl\', \'card\', \'cock\', \'rob\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['owl', 'card', 'cock', 'rob'], TrieSearch.UNION_REDUCER);

      expect(result.length).toEqual(1);
    });

    it('get([\'owl\', \'card\', \'cock\', \'rob\', \'fubar\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['owl', 'card', 'cock', 'rob', 'fubar'], TrieSearch.UNION_REDUCER);

      expect(result.length).toEqual(0);
    });
  });

  describe('TrieSearch::get(...) should work with a default reducer', function() {
    type Item = {
      key : string
    }

    const ts : TrieSearch<Item> = new TrieSearch<Item>('key', {
        min: 2,
        defaultReducer: TrieSearch.UNION_REDUCER,
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

    it('get([\'red\', \'robin\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['red', 'robin']);

      expect(result.length).not.toEqual(0);
      expect(result[0]).toBe(item1);
    });

    it('get([\'green\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['green']);

      expect(result.length).toEqual(2);
      expect(result[0]).toBe(item3);
      expect(result[1]).toBe(item4);
    });

    it('get(\'green\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('green');

      expect(result.length).toEqual(2);
      expect(result[0]).toBe(item3);
      expect(result[1]).toBe(item4);
    });

    it('get(\'blue\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('blue');

      expect(result.length).toEqual(0)
    });

    it('get(\'am\', TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get('am');

      expect(result.length).toEqual(4);
    });

    it('get([\'owl\', \'card\', \'cock\', \'rob\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['owl', 'card', 'cock', 'rob']);

      expect(result.length).toEqual(1);
    });

    it('get([\'owl\', \'card\', \'cock\', \'rob\', \'fubar\'], TrieSearch.UNION_REDUCER)', function() {
      let result = ts.get(['owl', 'card', 'cock', 'rob', 'fubar']);

      expect(result.length).toEqual(0);
    });
  });

  describe('TrieSearch::get(...) with internationalization turned on (default) should work', function() {
    let as = 'åäàáâã'.split('');
    let es = 'èéêë'.split('');
    let is = 'ìíîï'.split('');
    let os = 'òóôõö'.split('');
    let us = 'ùúûü'.split('');
    let aes = 'æ'.split('');

    let ts : TrieSearch<any> = new TrieSearch<any>('key'),
      As_items =  as.map(letter => ({ key: letter, arr: as })),
      Es_items =  es.map(letter => ({ key: letter, arr: es })),
      Is_items =  is.map(letter => ({ key: letter, arr: is })),
      Os_items =  os.map(letter => ({ key: letter, arr: os })),
      Us_items =  us.map(letter => ({ key: letter, arr: us })),
      AEs_items = aes.map(letter => ({ key: letter, arr: aes }));

    ts.addAll(As_items);
    ts.addAll(Es_items);
    ts.addAll(Is_items);
    ts.addAll(Os_items);
    ts.addAll(Us_items);
    ts.addAll(AEs_items);

    it(`Should return international items for "a" -> any of "${as}"`, function() {
      let items = ts.get('a');

      // Note this will include overlap with the ae!
      expect(items.length).toEqual(7);

      items.forEach(i => {
        expect(i.arr === as || i.arr === aes).toBeTruthy()
      });
    });

    it(`Should return international items for "e" -> any of "${es}"`, function() {
      let items = ts.get('e');

      expect(items.length).toEqual(4);

      items.forEach(i => {
        expect(i.arr).toBe(es);
      });
    });

    it(`Should return international items for "i" -> any of "${is}"`, function() {
      let items = ts.get('i');

      expect(items.length).toEqual(4);

      items.forEach(i => {
        expect(i.arr).toBe(is);
      });
    });

    it(`Should return international items for "o" -> any of "${os}"`, function() {
      let items = ts.get('o');

      expect(items.length).toEqual(5);

      items.forEach(i => {
        expect(i.arr).toBe(os);
      });
    });

    it(`Should return international items for "u" -> any of "${us}"`, function() {
      let items = ts.get('u');

      expect(items.length).toEqual(4);

      items.forEach(i => {
        expect(i.arr).toBe(us);
      });
    });

    it(`Should return international items for Swedish as an example with ''godis på sötdag är bra''`, function() {
      let swedishSentence = { key: 'godis på sötdag är bra' };

      ts.add(swedishSentence);

      expect(ts.get('pa').length).toEqual(1);
      expect(ts.get('sot').length).toEqual(1);
      expect(ts.get('ar').length).toEqual(1);
    });
  });

  describe('TrieSearch::map(...) works with RegEx with positive lookahead (e.g. split on capital letters)', function() {
    it('should not error', function() {
      expect(() => {
        const ts : TrieSearch<any> = new TrieSearch<any>('key', {
            splitOnRegEx: /([.\-\s']|(?=[A-Z]))/,
            splitOnGetRegEx: false,
          }),
          item = {key: 12345};

        ts.map('This IsSome.Phrase-Whatever', item);
      }).not.toThrowError();
    });

    it('should match capital letter breaks', function() {
      const ts : TrieSearch<any> = new TrieSearch('key', {
          splitOnRegEx: /([.\-\s'_]|(?=[A-Z]))/,
          splitOnGetRegEx: false,
          insertFullUnsplitKey: true
        }),
        item = {key: 12345},
        item2 = {key: 67890};

      ts.map('It\'sOnlyA_Flesh Wound', item);
      ts.map('WhatIsYourFavoriteColor', item2);

      expect(ts.get('It')[0]).toBe(item);
      expect(ts.get('s')[0]).toBe(item);
      expect(ts.get('Only')[0]).toBe(item);
      expect(ts.get('A')[0]).toBe(item);
      expect(ts.get('Flesh')[0]).toBe(item);
      expect(ts.get('Wound')[0]).toBe(item);
      expect(ts.get('It\'sOnlyA_Flesh Wound')[0]).toBe(item);

      expect(ts.get('What')[0]).toBe(item2);
      expect(ts.get('Is')[0]).toBe(item2);
      expect(ts.get('Your')[0]).toBe(item2);
      expect(ts.get('Fav')[0]).toBe(item2);
      expect(ts.get('Favorite')[0]).toBe(item2);
      expect(ts.get('Color')[0]).toBe(item2);
      expect(ts.get('WhatIsYourFavoriteColor')[0]).toBe(item2);
    });

    it('should match capital letter breaks', function() {
      const ts : TrieSearch<any> = new TrieSearch('key', {
          splitOnRegEx: /([.\-\s'_]|(?=[A-Z]))/,
          splitOnGetRegEx: /[\s]/
        }),
        item = {key: 12345},
        item2 = {key: 67890};

      ts.map('WhatIsYourFavoriteColor', item2);

      expect(ts.get('What Is')[0]).toBe(item2);
      expect(ts.get('Color Favorite')[0]).toBe(item2);
    });

    it('should split on various other word breaks', function() {
      const ts : TrieSearch<any> = new TrieSearch<any>('key', {
          splitOnRegEx: /[\s\/\(\)]/
        }),
        item = {key: 12345},
        item2 = {key: 67890};

      ts.map('Hello/World', item);
      ts.map("What's(Up)", item2);

      expect(ts.search('Hello')[0]).toBe(item);
      expect(ts.search('Up')[0]).toBe(item2);
    });
  });

  describe('TrieSearch:TrieSearch::get(...) should work with limits', function() {
    // NOTE: Cache is set to true since caching also needs to be tested
    const ts : TrieSearch<any> = new TrieSearch(null, {cache: true});
    const obj = {
      "a": ["data"],
      "ab": ["data"],
      "abc": ["data"],
      "abcd": ["data"],
      "abcde": ["data"],
      "abcdef": ["data"],
    }

    ts.addFromObject(obj);

    it('Get with limits and get without limits should work properly', function() {
      let getWithoutLimit = ts.get("a")
      expect(getWithoutLimit.length).toEqual(6);

      let getWithLimitResp = ts.get("a", null, 4)
      expect(getWithLimitResp.length).toEqual(4);
    });

    it('Failure case with limits should work properly', function() {
      let getWithLimit = ts.get("b", null, 4)
      expect(getWithLimit.length).toEqual(0)
    });

    it('A bigger limit value than the actual amount of data must work properly', function() {
      let getWithLimit = ts.get("a", null, 100)
      expect(getWithLimit.length).toEqual(6)
    });
  });

  describe('TrieSearch::remove(...) should work with limits', function() {
    it('should remove an item that has no spaces', function() {
      const ts : TrieSearch<any> = new TrieSearch('keyfield');
      const keyValue = 'value';
      const item = {keyfield: keyValue};

      ts.add(item);
      expect(ts.search(keyValue).length).toEqual(1);
      ts.remove(keyValue);
      expect(ts.search(keyValue).length).toEqual(0);
    });

    it('should remove an item that has spaces', function() {
      const ts : TrieSearch<any> = new TrieSearch('keyfield');
      const keyValue = 'value with space';
      const item = {keyfield: keyValue};

      ts.add(item);
      expect(ts.search(keyValue).length).toEqual(1);
      ts.remove(keyValue);
      expect(ts.search(keyValue).length).toEqual(0);
    });

    it('should remove an item that has diacritic chars', function() {
      const ts : TrieSearch<any> = new TrieSearch('keyfield');
      const keyValue = 'valué';
      const item = {keyfield: keyValue};

      ts.add(item);
      expect(ts.search(keyValue).length).toEqual(1);
      ts.remove(keyValue);
      expect(ts.search(keyValue).length).toEqual(0);
    });

    it('should remove an item that has diacritic chars and spaces', function() {
      const ts : TrieSearch<any> = new TrieSearch('keyfield');
      const keyValue = 'valué with space';
      const item = {keyfield: keyValue};

      ts.add(item);
      expect(ts.search(keyValue).length).toEqual(1);
      ts.remove(keyValue);
      expect(ts.search(keyValue).length).toEqual(0);
    });

    it('should remove an item that has diacritic chars and spaces from only the specified keyfield', function() {
      const ts : TrieSearch<any> = new TrieSearch(['keyfield1', 'keyfield2']);
      const keyValue1 = 'valué with space';
      const item1 = {keyfield1: keyValue1, keyfield2: 'nothing'};
      const item2 = {keyfield2: keyValue1, keyfield1: 'nothing'};

      ts.add(item1);
      ts.add(item2);
      expect(ts.search(keyValue1).length).toEqual(2);
      ts.remove(keyValue1, 'keyfield1');
      expect(ts.search(keyValue1).length).toEqual(1);
    });

    it('should remove an item without affecting the other closely related items', function() {
      const ts : TrieSearch<any> = new TrieSearch('keyfield1');
      const keyValue1 = 'valué with space';
      const keyValue2 = 'valués with space';
      const item1 = {keyfield1: keyValue1};
      const item2 = {keyfield1: keyValue2};

      ts.add(item1);
      ts.add(item2);
      expect(ts.search(keyValue1).length).toEqual(2);
      ts.remove(keyValue1);
      expect(ts.search(keyValue1).length).toEqual(1);
    });

    it('should remove item if ignoreCase is true and capitalized letters are present', function () {
      type Item = {
        key: string
      }
      const ts: TrieSearch<any> = new TrieSearch<any>(['key'], {
          ignoreCase: true,
        }),
        item: Item = {key: 'John'};

      ts.add(item)
      expect(ts.get(item.key)[0]).toBe(item);
      ts.remove(item.key);
      expect(ts.get(item.key).length).toBe(0);
    });

    it('should remove a similar item if only uppercase/lowercase are changed', function () {
      type Item = {
        key: string
      }
      const ts: TrieSearch<any> = new TrieSearch<any>(['key'], {
          ignoreCase: true,
        }),
        item: Item = {key: 'John'};

      ts.add(item)
      expect(ts.get(item.key)[0]).toBe(item);
      ts.remove(item.key.toLowerCase());
      expect(ts.get(item.key).length).toBe(0);
    });
  });

  describe('Documentation examples should work', function() {
    it('TypeScript example should output what we say it does', function() {
      type MyType = {
        someKey : string
        someOtherKeyNotToBeSearched : number
      };

      const trie : TrieSearch<MyType> = new TrieSearch<MyType>('someKey');

      const item1 : MyType = { someKey : 'hello world', someOtherKeyNotToBeSearched : 1 };
      const item2 : MyType = { someKey : 'hello, I like trains', someOtherKeyNotToBeSearched : 1 };

      trie.add(item1);
      trie.add(item2);

      expect(trie.search('he').length).toEqual(2);           // [item1, item2]
      expect(trie.search('her').length).toEqual(0);          // []
      expect(trie.search('hel wor').length).toEqual(1);      // [item1]
      expect(trie.search('hel wor')[0]).toStrictEqual(item1);// [item1]
      expect(trie.search('hel').length).toEqual(2);          // [item1, item2]

      // Remove things!
      trie.remove('hello world');  // item1 is now gone
      expect(trie.search('hello')[0]).toStrictEqual(item2);  // [item2]
      expect(trie.search('world').length).toEqual(0);  // []
      trie.remove('trains'); // item2 is now gone
      expect(trie.search('trains').length).toEqual(0);        // []
    });
  });
});
