export interface MindSparkSettings {
  noteCount: number;
  excludedFolders: string[];
  refreshOnOpen: boolean;
  onboardingDismissed: boolean;
}

export interface NoteViewRecord {
  lastShown: number;
  showCount: number;
}

export interface MindSparkData {
  settings: MindSparkSettings;
  viewHistory: Record<string, NoteViewRecord>;
  lastShownPaths: string[];
}

export const DEFAULT_SETTINGS: MindSparkSettings = {
  noteCount: 5,
  excludedFolders: [],
  refreshOnOpen: true,
  onboardingDismissed: false
};

export const VIEW_TYPE_MINDSPARK = "mindspark-sidebar";
