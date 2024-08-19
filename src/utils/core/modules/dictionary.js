import app from "@/utils/core/app.js";
import {SYN_DB} from "./synonyms.js";

export function Dictionary() {
  this.vocabulary = []
  this.synonyms = SYN_DB
  
  this.build_synonyms()
  this.update()

  this.add_word = function (s) {
    const word = s.toLowerCase().trim()
    const regex = /[^a-z]/gi

    if (regex.test(word) || word.length < 4) return;
    this.vocabulary[this.vocabulary.length] = word
  }

  this.build_synonyms = () => {
    for (const targetWord in SYN_DB) {
      const synonyms = SYN_DB[targetWord]
      this.add_word(targetWord)
      
      for (const wordID in synonyms) {
        const targetParent = synonyms[wordID]
        if (this.synonyms[targetParent] && this.synonyms[targetParent].constructor === Array)
          this.synonyms[targetParent][this.synonyms[targetParent].length] = targetWord;
        else this.synonyms[targetParent] = [targetWord];
      }
    }
  }

  this.find_suggestion = function (str) {
    const target = str.toLowerCase()

    for (const id in this.vocabulary) {
      if (this.vocabulary[id].substring(0, target.length) !== target) continue
      return this.vocabulary[id]
    }
    return null
  }

  this.find_synonym = function (str) {
    if (str.trim().length < 4) return;

    const target = str.toLowerCase()
    if (this.synonyms[target]) return uniq(this.synonyms[target]);

    if (target[target.length - 1] === 's') {
      const singular = this.synonyms[target.substring(0, target.length - 1)]
      if (this.synonyms[singular]) return uniq(this.synonyms[singular])
    }

    return null
  }

  this.update = () => {
    const words = app.editor.el.value.toLowerCase().split(/[^\w-]+/);
    for (const wordID in words) this.add_word(words[wordID]);
  }

  function uniq(a1) {
    const a2 = [];
    for (const id in a1) if (a2.indexOf(a1[id]) === -1) a2[a2.length] = a1[id]
    return a2
  }
}