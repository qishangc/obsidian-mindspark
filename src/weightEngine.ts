import type { TFile } from "obsidian";
import type { NoteViewRecord } from "./types";

function hoursSince(timestamp: number, now: number): number {
  return Math.max((now - timestamp) / (1000 * 60 * 60), 0);
}

function daysSince(timestamp: number, now: number): number {
  return Math.max((now - timestamp) / (1000 * 60 * 60 * 24), 0);
}

export function computeWeight(file: TFile, record: NoteViewRecord | undefined, now: number): number {
  let weight = 1;

  if (!record || record.showCount === 0) {
    weight *= 3;
  } else {
    const decay = Math.min(hoursSince(record.lastShown, now) / 72, 1);
    weight *= decay;
  }

  const ageBoost = 1 + Math.log2(daysSince(file.stat.ctime, now) + 1) * 0.1;
  weight *= ageBoost;

  return Math.max(weight, 0);
}

export function filterFiles(files: TFile[], excludedFolders: string[]): TFile[] {
  const excludes = excludedFolders
    .map((folder) => folder.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase())
    .filter(Boolean);

  return files.filter((file) => {
    if (file.extension !== "md") {
      return false;
    }

    const normalizedPath = file.path.replace(/\\/g, "/").toLowerCase();
    return !excludes.some((folder) => {
      return (
        normalizedPath === folder ||
        normalizedPath.startsWith(`${folder}/`) ||
        normalizedPath.includes(`/${folder}/`)
      );
    });
  });
}

export function weightedRandomSample<T>(items: T[], weights: number[], count: number): T[] {
  const pool = items.map((item, index) => ({
    item,
    weight: Number.isFinite(weights[index]) ? Math.max(weights[index], 0) : 0
  }));

  const picks = Math.min(Math.max(count, 0), pool.length);
  const result: T[] = [];

  for (let i = 0; i < picks; i += 1) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);

    if (total <= 0) {
      result.push(pool.shift()!.item);
      continue;
    }

    let threshold = Math.random() * total;
    let selectedIndex = 0;

    for (let j = 0; j < pool.length; j += 1) {
      threshold -= pool[j].weight;
      if (threshold <= 0) {
        selectedIndex = j;
        break;
      }
    }

    result.push(pool.splice(selectedIndex, 1)[0].item);
  }

  return result;
}

export function selectNotes(
  files: TFile[],
  history: Record<string, NoteViewRecord>,
  excludedFolders: string[],
  count: number
): TFile[] {
  const candidates = filterFiles(files, excludedFolders);
  const now = Date.now();
  const weights = candidates.map((file) => computeWeight(file, history[file.path], now));

  return weightedRandomSample(candidates, weights, count);
}
