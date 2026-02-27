import { ItemView, TFile, setIcon, type WorkspaceLeaf } from "obsidian";
import type MindSparkPlugin from "./main";
import { recordNoteShown } from "./storage";
import { VIEW_TYPE_MINDSPARK } from "./types";
import { getNoteTitle, getPreview } from "./utils";
import { filterFiles, selectNotes } from "./weightEngine";

export class MindSparkView extends ItemView {
  private plugin: MindSparkPlugin;
  private noteContainerEl: HTMLElement | null = null;
  private currentNotes: TFile[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: MindSparkPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_MINDSPARK;
  }

  getDisplayText(): string {
    return "MindSpark";
  }

  getIcon(): string {
    return "dice";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();

    const header = container.createDiv({ cls: "mindspark-header" });
    header.createEl("h3", { text: "MindSpark" });

    const refreshButton = header.createEl("button", {
      cls: "clickable-icon",
      attr: { "aria-label": "刷新", type: "button" }
    });
    setIcon(refreshButton, "refresh-cw");
    refreshButton.addEventListener("click", () => {
      void this.refreshNotes();
    });

    if (!this.plugin.settings.onboardingDismissed) {
      this.renderOnboardingCard(container);
    }

    this.noteContainerEl = container.createDiv({ cls: "mindspark-notes" });

    if (this.plugin.settings.refreshOnOpen) {
      await this.refreshNotes();
    } else {
      await this.restoreOrRefreshNotes();
    }
  }

  async refreshNotes(): Promise<void> {
    if (!this.noteContainerEl) {
      return;
    }

    const allFiles = this.plugin.app.vault.getMarkdownFiles();
    const eligible = filterFiles(allFiles, this.plugin.settings.excludedFolders);

    this.noteContainerEl.empty();

    if (allFiles.length === 0) {
      this.currentNotes = [];
      this.renderEmptyState("笔记库中还没有笔记");
      return;
    }

    if (eligible.length === 0) {
      this.currentNotes = [];
      this.renderEmptyState("所有笔记都被排除了，请检查设置");
      return;
    }

    const selected = selectNotes(
      allFiles,
      this.plugin.data.viewHistory,
      this.plugin.settings.excludedFolders,
      this.plugin.settings.noteCount
    );

    this.currentNotes = selected;
    this.plugin.data.lastShownPaths = selected.map((file) => file.path);

    for (const file of selected) {
      try {
        await this.renderNoteCard(file, this.noteContainerEl);
        this.plugin.data = recordNoteShown(this.plugin.data, file.path);
      } catch (e) {
        console.warn(`MindSpark: 渲染笔记失败 "${file.path}"`, e);
      }
    }

    await this.plugin.persistPluginData();
  }

  async renderNoteCard(file: TFile, container: HTMLElement): Promise<void> {
    const card = container.createDiv({ cls: "mindspark-card" });
    card.setAttribute("tabindex", "0");

    const content = await this.plugin.app.vault.cachedRead(file);
    const title = getNoteTitle(file, content);
    const preview = getPreview(content, 180);

    card.createDiv({ cls: "mindspark-card-title", text: title });
    card.createDiv({ cls: "mindspark-card-preview", text: preview || "(空笔记)" });

    const openFile = async (): Promise<void> => {
      await this.plugin.app.workspace.getLeaf(false).openFile(file);
    };

    card.addEventListener("click", () => {
      void openFile();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void openFile();
      }
    });
  }

  renderOnboardingCard(container: HTMLElement): void {
    const card = container.createDiv({ cls: "mindspark-onboarding" });
    card.createDiv({ text: "MindSpark 会随机浮现你过去的笔记，帮助你重新连接旧想法。" });

    const button = card.createEl("button", { text: "已了解", attr: { type: "button" } });
    button.addEventListener("click", () => {
      this.plugin.settings.onboardingDismissed = true;
      this.plugin.data.settings.onboardingDismissed = true;
      void this.plugin.persistPluginData();
      card.remove();
    });
  }

  renderEmptyState(message: string): void {
    if (!this.noteContainerEl) {
      return;
    }

    this.noteContainerEl.createDiv({ cls: "mindspark-empty", text: message });
  }

  async onClose(): Promise<void> {
    this.noteContainerEl = null;
  }

  private async restoreOrRefreshNotes(): Promise<void> {
    const restored = this.plugin.data.lastShownPaths
      .map((path) => this.plugin.app.vault.getAbstractFileByPath(path))
      .filter((file): file is TFile => file instanceof TFile);

    if (restored.length === 0) {
      await this.refreshNotes();
      return;
    }

    this.currentNotes = restored;
    await this.renderCurrentNotes();
  }

  private async renderCurrentNotes(): Promise<void> {
    if (!this.noteContainerEl) {
      return;
    }

    this.noteContainerEl.empty();

    const visibleNotes = filterFiles(this.currentNotes, this.plugin.settings.excludedFolders);

    for (const file of visibleNotes) {
      const existingFile = this.plugin.app.vault.getAbstractFileByPath(file.path);
      if (existingFile instanceof TFile) {
        await this.renderNoteCard(existingFile, this.noteContainerEl);
      }
    }

    if (this.noteContainerEl.childElementCount === 0) {
      await this.refreshNotes();
    }
  }
}
