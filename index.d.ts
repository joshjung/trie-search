// Type definitions for trie-search 2.0+
// Project: trie-search
// Definitions by: Joshua Jung

type KeyFields = string | KeyFields[]

type TrieSearchOptions<T> = {
  indexField? : string
  ignoreCase? : boolean
  cache? : boolean
  maxCacheSize? : number
  splitOnRegEx? : RegExp | false
  splitOnGetRegEx? : RegExp | false
  min? : number
  keepAll? : boolean
  keepAllKey? : boolean
  idFieldOrFunction? : string | ((item : T) => string)
  expandRegexes? : { regex: RegExp, alternate : string }[]
  insertFullUnsplitKey? : boolean
  defaultReducer? : TrieSearch.ReducerFn<T>
}

export default class TrieSearch<T> {
  keyFields : KeyFields;

  constructor(keyfields? : KeyFields | null, options? : TrieSearchOptions<T>);

  add(item : T, customKeys? : KeyFields) : void
  remove(phrase : string, keyFields? : KeyFields) : void
  addAll(items : T[], customKeys? : KeyFields) : void
  reset() : void
  addFromObject(obj : any, valueField? : string) : void
  map(key : string, value : T) : void
  get(phraseOrPhrases : string | string[], reducer? : TrieSearch.ReducerFn<T> | null, limit? : number) : T[]
  search(phrases : string | string[], reducer? : TrieSearch.ReducerFn<T>, limit? : number) : T[]

  // Expected to be used internally only, but could be useful to someone someday
  keyToArr(key : string) : string[]
  clearCache() : void

  root : any;

  static UNION_REDUCER :  TrieSearch.ReducerFn<any>
}

declare namespace TrieSearch {
  export type ReducerFn<T> = (accumulator : T[], phrase : string, matches : T[], trieSearch : TrieSearch<T>) => T[]
}
