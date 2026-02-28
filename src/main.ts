import { Plugin } from "obsidian";
import { MindSparkSettingsTab } from "./settingsTab";
import { loadPluginData } from "./storage";
import { MindSparkView } from "./sidebarView";
import type { MindSparkData, MindSparkSettings } from "./types";
import { VIEW_TYPE_MINDSPARK } from "./types";

export default class MindSparkPlugin extends Plugin {
  data!: MindSparkData;
  settings!: MindSparkSettings;

  async onload() {
    this.data = await loadPluginData(this);
    this.settings = this.data.settings;

    this.registerView(VIEW_TYPE_MINDSPARK, (leaf) => new MindSparkView(leaf, this));

    this.addRibbonIcon("dice", "MindSpark", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-sidebar",
      name: "打开侧边栏",
      callback: () => {
        void this.activateView();
      }
    });

    this.addCommand({
      id: "refresh-notes",
      name: "刷新笔记",
      callback: () => {
        void this.refreshOpenView();
      }
    });

    this.addSettingTab(new MindSparkSettingsTab(this.app, this));
  }

  onunload() {
    // View cleanup is handled by Obsidian automatically
  }

  async activateView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDSPARK)[0];

    if (existingLeaf) {
      this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const rightLeaf = this.app.workspace.getRightLeaf(true);
    if (!rightLeaf) {
      return;
    }

    await rightLeaf.setViewState({ type: VIEW_TYPE_MINDSPARK, active: true });
    this.app.workspace.revealLeaf(rightLeaf);
  }

  async persistPluginData(): Promise<void> {
    this.data.settings = this.settings;
    await this.saveData(this.data);
  }

  async refreshOpenView(): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDSPARK)[0];
    if (!leaf) {
      return;
    }

    const view = leaf.view;
    if (view instanceof MindSparkView) {
      await view.refreshNotes();
    }
  }
}
