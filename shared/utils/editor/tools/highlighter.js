import {app} from "@leaf/shared/utils/core/app.js";

export class Highlighter {
  constructor() {
    this.highlights = document.getElementById('highlights');
    this.searchArg = '';
    this.sensitive = false;
    this.sel = -1;
    this.clear();
    
    let ua = window.navigator.userAgent.toLowerCase();
    this.isIE = !!ua.match(/msie|trident\/7|edge/);
    
    this.update();

    //bring backdrop to front for clicking on link markers
    document.addEventListener('keydown', e => {
      if (e.ctrlKey) this.#setZPos(3);
    });
    
    document.addEventListener('keyup', () => this.#setZPos());
  }

  update = () => {
    this.highlights.innerHTML = this.#markText();
    this.onScroll();
    if (this.sel > -1) this.#setSelection();
  }

  onScroll() {
    this.highlights.scrollTop = app.editor.el.scrollTop || 0;
    this.highlights.scrollLeft = app.editor.el.scrollLeft || 0;

    // let sclLeft = app.editor.el.scrollLeft;
    // this.highlights.style.transform = (sclLeft > 0) ? `translateX(${-sclLeft}px)` : '';
  }

  search(arg, sensitive, word) {
    this.searchArg = arg;
    this.sensitive = !!sensitive;
    this.word = !!word;
    this.update();
    this.sel = -1;
    this.next();
  }

  next() {
    this.sel += 1;
    this.#setSelection(true);
  }

  prev() {
    this.sel -= 1;
    this.#setSelection(true);
  }

  count = () => this.highlights.querySelectorAll('mark').length;

  clear() {
    this.highlights.innerHTML = this.highlights.textContent;
    this.searchArg = '';
    this.sel = -1;
  }
  
  #markText() {
    let text = app.editor.text().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text = text.replace(/\n$/g, '\n\n');

    if (this.searchArg) {
      let searchArg = this.searchArg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      let boundary = this.word ? '\\b' : '';

      let regExSearch = new RegExp(`${boundary}(${this.#escapeString(searchArg)})${boundary}`, `g${this.sensitive ? '' : 'i'}`);
      text = text.replace(regExSearch, '<mark>$&</mark>');

      // IE wraps whitespace differently in a div vs textarea, this fixes it
      if (this.isIE) text = text.replace(/ /g, ' <wbr>');
    }

    text = text.replace(/(https:|http:|ftp:|www\.)\S*/gm, '<a href="$&" class="link">$&</a>')
    text = text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/gm, '<a href="mailto:$&" class="email">$&</a>');
    text = text.replace(/(\/\/[^\n\r]*)/gm, '<p class="comment">$&</p>');

    return text;
  }

  #escapeString(txt) {
    let specials = ['-', '[', ']', '/', '{', '}', '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|'];
    return txt.replace(RegExp(`[${specials.join('\\')}]`, 'g'), '\\$&');
  }

  #setSelection(scroll = false) {
    let nodes = this.highlights.querySelectorAll('mark');
    let len = nodes.length;

    if (this.sel >= len) this.sel = 0;
    if (this.sel < 0) this.sel = len - 1;

    for (let i = 0; i < len; ++i) {
      if (i === this.sel) {
        nodes[i].classList.add('sel');
        if (scroll) app.editor.el.scrollTop = nodes[i].offsetTop > 10 ? nodes[i].offsetTop - 10 : nodes[i].offsetTop;
      } else nodes[i].classList.remove('sel');
    }
  }

  #setZPos = (id = 1) => this.highlights.style.zIndex = id;
}