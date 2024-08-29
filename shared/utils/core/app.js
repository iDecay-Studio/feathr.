import {Editor} from "@leaf/shared/utils/core/editor.js";
import {Settings} from "@leaf/shared/utils/core/settings.js";
import {Dictionary} from "@leaf/shared/utils/core/modules/dictionary.js";
import {CmdBar} from "@leaf/shared/utils/core/modules/cmdBar.js";
import {Go} from "@leaf/shared/utils/core/modules/go.js";
import {Stats} from "@leaf/shared/utils/core/modules/stats.js";
import {Sidebar} from "@leaf/shared/utils/core/modules/sidebar.js";
import {Project} from "@leaf/shared/utils/editor/project.js";
import {discardPrompt} from "@leaf/shared/utils/ui/prompts.js";
import {initEvents} from "@leaf/shared/utils/events/events.js";
import {getCurrentWindow} from '@tauri-apps/api/window';
import {inApp} from "@leaf/shared/utils/core/utils.js";
// import {check} from "@tauri-apps/plugin-updater";
// import {relaunch} from "@tauri-apps/plugin-process";

class App {
  dictionary = new Dictionary();
  editor = new Editor();
  cmdBar = new CmdBar();
  project = new Project();
  settings = new Settings();
  sidebar = new Sidebar();
  stats = new Stats();
  go = new Go();
  isMobile;
  
  init = async (isMobile = false) => {
    this.isMobile = isMobile;
    this.titleRef = document.getElementById('title');

    //init modules
    await this.settings.init();
    await this.editor.init();
    await this.project.init();
    await this.dictionary.init();
    await this.cmdBar.init();
    await this.go.init();
    if (!app.isMobile) {
      await this.sidebar.init();
      await this.stats.init();
    }
    
    await this.update();
    initEvents();

    // const update = await check();
    // if (update?.available) {
    //   await update.downloadAndInstall();
    //   await relaunch();
    // }
  }
  
  update = async () => {
    await this.editor.update();
    await this.project.update();
    if (!app.isMobile) {
      await this.sidebar.update();
      await this.stats.update();
    }
  };

  load = (text) => {
    this.editor.el.value = text || '';
    this.update();
  };

  reload = async (force = false) => {
    this.project.page().reload(force);
    this.load(this.project.page().text);
  };

  // inFocusMode = async () => await getCurrentWindow().isFullscreen();
  setFocusMode = async (enable) => {
    if (inApp) await getCurrentWindow().setFullscreen(enable);
    //ToDo: hide header
  }

  quit = () => inApp && discardPrompt(getCurrentWindow().close);
}

export const app = await new App();