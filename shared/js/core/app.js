import {Editor} from "@feathr/shared/js/editor/editor.js";
import {Settings} from "@feathr/shared/js/core/settings.js";
import {Dictionary} from "@feathr/shared/js/core/modules/dictionary.js";
import {CmdBar} from "@feathr/shared/js/core/modules/cmdBar.js";
import {Go} from "@feathr/shared/js/core/modules/go.js";
import {Stats} from "@feathr/shared/js/core/modules/stats.js";
import {Sidebar} from "@feathr/shared/js/core/modules/sidebar.js";
import {File} from "@feathr/shared/js/editor/file.js";
import {checkForUpdates} from "@feathr/shared/js/core/modules/updater.js";
import {discardPrompt} from "@feathr/shared/js/ui/prompts.js";
import {initEvents} from "@feathr/shared/js/events/events.js";
import {getCurrentWindow} from '@tauri-apps/api/window';
import {inApp} from "@feathr/shared/js/core/utils.js";
import {sep} from "@tauri-apps/api/path";

class App {
  editor = new Editor();
  file = new File();
  dictionary = new Dictionary();
  cmdBar = new CmdBar();
  sidebar = new Sidebar();
  stats = new Stats();
  go = new Go();
  settings = new Settings();
  
  init = async (isMobile = false) => {
    this.isMobile = isMobile;
    this.titleRef = document.getElementById('title');

    //init modules
    await this.file.init();
    this.dictionary.init();
    this.editor.init();
    this.settings.init();
    
    await this.update();
    initEvents();
    
    //started app by opening a file with it
    // log(window.openedFiles);
    if (window.openedFiles && window.openedFiles.length) {
      this.file.open(window.openedFiles[0].replaceAll("\\\\", "\\").replaceAll("\\", sep));
    }

    if (!this.isMobile) await checkForUpdates();
  }
  
  update = async () => {
    await this.editor.update();
    await this.file.update();
    await this.sidebar.update();
    await this.stats.update();
  };

  setFocusMode = async (enable) => {
    if (inApp) await getCurrentWindow().setFullscreen(enable);
    document.documentElement.classList.toggle('focus-mode', enable);
  }

  quit = () => inApp && discardPrompt(() => {
    if (!this.isMobile && this.settings.closeToTray.storeVal())
    {
      this.file.close();
      getCurrentWindow().hide();
    }
    else getCurrentWindow().quit();
  });
}

const app = new App();
export default app;