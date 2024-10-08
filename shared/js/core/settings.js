import app from "@feathr/shared/js/core/app.js";
import {clamp, isMobile} from "@feathr/shared/js/core/utils.js";
import {setRecentFilesMenu, settingsMenu} from "@feathr/shared/js/ui/menu.js";
import {get, writable} from "svelte/store";

export class Settings {
  caseSensitive = new Setting('case-sensitive', false);
  matchWords = new Setting('match-words', false);
  autoIndent = new Setting('auto-indent', true);
  wordWrap = new Setting('word-wrap', true);
  fontType = new Setting('font-type', 'sans');
  fontSize = new FontSize();
  recentPaths = new RecentPaths();
  unsavedChanges = new Setting('unsaved-changes', "", (val, init) => {
    if (!init) app.file.updateTitle()
  });
  closeToTray = new Setting('close-to-tray', false);
  showSidebar = new Setting('show-sidebar', true, val => {
    document.documentElement.classList.toggle('show-sidebar', val)
  });
  
  showMenubar = new Setting('show-menubar', true, val => {
    document.documentElement.classList.toggle('show-menubar', val)
  });
  
  focusMode = new Setting('focus-mode', false, async (val, init) => {
    if (!init) await app.setFocusMode(val);
  });
  
  language = new Setting('language', 'en-US', async (val, init) => {
    if (!init) {
      await app.i18n.setLanguage(val);
      app.file.updateTitle();
    }
  });

  theme = new Setting('theme', "system", (val, init) => {
    if (!init) {
      //make sure the retrieved theme from localStorage actually exists (in case it got renamed or removed) and revert to 'system' if not
      let allThemes = get(settingsMenu).filter(item => item.id && item.id === "theme")[0].submenu.map(subitem => subitem.compareTo);
      if (!allThemes.includes(val)) val = "system";
    }
    
    if (val === "system") {
      let prefersDarkTheme = typeof window !== 'undefined' ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches === true : true;
      val = prefersDarkTheme ? "dark" : "bright";
    }
    
    let themes = document.documentElement.className.match(/theme-[a-z]+/);
    if (themes) document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add('theme', `theme-${val}`);
  });
  
  init() {
    this.focusMode.set(false);
    if (isMobile) this.showSidebar.set(false);
  }
  
  resetAll() {
    let props = Object.getOwnPropertyNames(this);
    props.forEach(prop => {
      if (this[prop] instanceof Setting) this[prop].reset();
      app.update();
    });
  }
}

class Setting {
  constructor(key, def, onChange = null) {
    this.key = key;
    this.def = def;
    this.store = writable(def);
    this.onChange = onChange;
    this.set(this.#get(), true);
  }

  set = (val, isInit = false) => {
    this.store.set(val);
    localStorage.setItem(this.key, JSON.stringify(val));
    this.onChange && this.onChange(val, isInit);
  };
  #get = () => {
    let storedVal = localStorage.getItem(this.key);
    return storedVal ? JSON.parse(storedVal) : this.def;
  }

  storeVal = () => get(this.store);
  toggle = () => this.set(!this.storeVal());
  reset = () => this.set(this.def);
}

class FontSize extends Setting {
  constructor() {
    super('font-size', 1.35, (val, isInit) => {
      if (isInit) return;
      app.editor.highlighter.update();
      app.editor.caret.update();
    });
  }

  #increaseBy = 0.25;
  increase = () => this.#set(this.storeVal() + this.#increaseBy);
  decrease = () => this.#set(this.storeVal() - this.#increaseBy);
  #set = (value) => this.set(clamp(value, 0.5, 4));
}

class RecentPaths extends Setting {
  constructor() {
    super('recent-paths', [], async (val, init) => {
      if (!init) await setRecentFilesMenu()
    });
  }
  
  maxRecentPaths = 5;
  
  //Add given path to the list if valid and remove oldest entry
  add = async (path) => {
    if (path.trim() === "") return;
    // if (!(await this.#validatePath(path))) return;

    let paths = this.storeVal();
    if (paths.includes(path)) return;
    
    paths.push(path);
    if (paths.length > this.maxRecentPaths) paths = paths.slice(1, paths.length);
    
    this.set(paths);
  }
  
  get = async () => {
    let paths = this.storeVal();
    let validPaths = [];

    //Check if all recent paths are actually valid file system paths
    for (const path of paths)
      if (!validPaths.includes(path)) validPaths.push(path);

    return validPaths;
  }
  
  // #validatePath = async (path) => inApp ? await exists(path) : true;
}