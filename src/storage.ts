import type { MindSparkData, MindSparkSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

type PersistedData = Partial<MindSparkData> | null | undefined;

type PluginStorage = {
  loadData: () => Promise<PersistedData>;
  saveData: (data: MindSparkData) => Promise<void>;
};

function mergeSettings(input?: Partial<MindSparkSettings>): MindSparkSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(input ?? {}),
    excludedFolders: Array.isArray(input?.excludedFolders) ? input.excludedFolders : []
  };
}

function normalizeViewHistory(input: unknown): MindSparkData["viewHistory"] {
  if (!input || typeof input !== "object") {
    return {};
  }

  const result: MindSparkData["viewHistory"] = {};

  for (const [filePath, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const record = value as Partial<{ lastShown: unknown; showCount: unknown }>;
    const lastShown = typeof record.lastShown === "number" ? record.lastShown : 0;
    const showCount = typeof record.showCount === "number" ? record.showCount : 0;

    result[filePath] = { lastShown, showCount };
  }

  return result;
}

export async function loadPluginData(plugin: PluginStorage): Promise<MindSparkData> {
  const raw = await plugin.loadData();

  return {
    settings: mergeSettings(raw?.settings),
    viewHistory: normalizeViewHistory(raw?.viewHistory),
    lastShownPaths: Array.isArray(raw?.lastShownPaths)
      ? raw.lastShownPaths.filter((item): item is string => typeof item === "string")
      : []
  };
}

export async function savePluginData(plugin: PluginStorage, data: MindSparkData): Promise<void> {
  await plugin.saveData(data);
}

export function recordNoteShown(data: MindSparkData, filePath: string): MindSparkData {
  const current = data.viewHistory[filePath];
  const nextCount = current ? current.showCount + 1 : 1;

  return {
    ...data,
    viewHistory: {
      ...data.viewHistory,
      [filePath]: {
        lastShown: Date.now(),
        showCount: nextCount
      }
    }
  };
}

export function clearHistory(data: MindSparkData): MindSparkData {
  return {
    ...data,
    viewHistory: {},
    lastShownPaths: []
  };
}
