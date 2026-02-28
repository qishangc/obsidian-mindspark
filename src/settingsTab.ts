import { PluginSettingTab, Setting, TFolder } from "obsidian";
import type MindSparkPlugin from "./main";

export class MindSparkSettingsTab extends PluginSettingTab {
  private plugin: MindSparkPlugin;

  constructor(app: MindSparkPlugin["app"], plugin: MindSparkPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** 检查某个文件夹路径是否被显式排除 */
  private isExplicitlyExcluded(folderPath: string): boolean {
    return this.plugin.settings.excludedFolders.includes(folderPath);
  }

  /** 检查某个文件夹是否因为父文件夹被排除而隐式排除 */
  private isParentExcluded(folderPath: string): boolean {
    return this.plugin.settings.excludedFolders.some(
      (excluded) => folderPath !== excluded && folderPath.startsWith(excluded + "/")
    );
  }

  /** 切换某个文件夹的排除状态，并清理冗余的子文件夹排除 */
  private async toggleFolder(folderPath: string, include: boolean): Promise<void> {
    let folders = this.plugin.settings.excludedFolders.filter(
      (f) => f !== folderPath
    );
    if (!include) {
      folders.push(folderPath);
      // 排除父文件夹时，移除已显式排除的子文件夹（冗余）
      folders = folders.filter(
        (f) => f === folderPath || !f.startsWith(folderPath + "/")
      );
    }
    this.plugin.settings.excludedFolders = folders;
    this.plugin.data.settings.excludedFolders = folders;
    await this.plugin.persistPluginData();
    await this.plugin.refreshOpenView();
    // 重绘设置页以更新子文件夹的禁用状态
    this.display();
  }

  /** 递归渲染文件夹树 */
  private renderFolderTree(folder: TFolder, container: HTMLElement, depth: number): void {
    const subfolders = folder.children
      .filter((child): child is TFolder => child instanceof TFolder)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const subfolder of subfolders) {
      const isExplicit = this.isExplicitlyExcluded(subfolder.path);
      const isParentOff = this.isParentExcluded(subfolder.path);
      const isEffectivelyExcluded = isExplicit || isParentOff;

      const setting = new Setting(container)
        .setName(subfolder.name)
        .addToggle((toggle) => {
          toggle.setValue(!isEffectivelyExcluded);
          toggle.setDisabled(isParentOff);
          toggle.onChange(async (value) => {
            await this.toggleFolder(subfolder.path, value);
          });
        });

      const settingEl = setting.settingEl;
      settingEl.addClass("mindspark-folder-item");
      settingEl.addClass(`mindspark-folder-depth-${depth}`);

      if (isParentOff) {
        settingEl.addClass("mindspark-folder-disabled");
      }

      // 递归渲染子文件夹
      this.renderFolderTree(subfolder, container, depth + 1);
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("每次展示笔记数量")
      .setDesc("侧边栏中同时展示的笔记数量（3-10）")
      .addSlider((slider) => {
        slider
          .setLimits(3, 10, 1)
          .setValue(this.plugin.settings.noteCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.noteCount = value;
            this.plugin.data.settings.noteCount = value;
            await this.plugin.persistPluginData();
            await this.plugin.refreshOpenView();
          });
      });

    // --- 排除文件夹（树形结构）---
    new Setting(containerEl).setName("排除文件夹").setHeading();
    new Setting(containerEl)
      .setDesc("关闭开关以排除该文件夹中的笔记。排除父文件夹会同时排除所有子文件夹。");

    const root = this.app.vault.getRoot();
    const hasSubfolders = root.children.some((c) => c instanceof TFolder);

    if (!hasSubfolders) {
      containerEl.createEl("p", {
        text: "笔记库中暂无文件夹。",
        cls: "setting-item-description"
      });
    } else {
      this.renderFolderTree(root, containerEl, 1);
    }

    // --- 自动刷新 ---
    new Setting(containerEl)
      .setName("打开时自动刷新")
      .setDesc("开启后每次打开侧边栏会自动换一批新笔记；关闭则保留上次的笔记")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.refreshOnOpen).onChange(async (value) => {
          this.plugin.settings.refreshOnOpen = value;
          this.plugin.data.settings.refreshOnOpen = value;
          await this.plugin.persistPluginData();
        });
      });
  }
}
