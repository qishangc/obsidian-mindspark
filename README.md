# MindSpark

> Resurface your forgotten notes through weighted randomness — let old ideas find you again.

## What it does

MindSpark adds a sidebar panel to Obsidian that randomly surfaces notes from your vault. It prioritizes notes you haven't seen in a while and suppresses recently shown ones, creating a serendipity engine for reconnecting with past ideas.

## Features

- **Weighted random surfacing** — Notes you've never seen get 3× priority. Recently shown notes are suppressed for 72 hours. Older notes get a mild age boost.
- **Sidebar panel** — A glanceable panel showing 3–10 note cards with title and content preview.
- **Click to open** — Click any card to open the note in the editor.
- **Refresh** — Manually reshuffle with the refresh button, or enable auto-refresh on sidebar open.
- **Folder exclusion** — Tree-style folder picker in settings to exclude folders you don't want surfaced (e.g. templates, daily notes).
- **First-use onboarding** — A brief inline guide on first open, dismissible permanently.
- **Smart previews** — Handles YAML frontmatter, code blocks, and Mermaid diagrams gracefully.
- **Theme compatible** — Uses Obsidian CSS variables throughout, works with any theme in light or dark mode.
- **Keyboard accessible** — Tab to focus cards, Enter to open.

## How it works

All `.md` files in your vault are candidates (minus excluded folders). Each note gets a weight based on:

| Factor | Effect |
|--------|--------|
| Never shown before | Weight × 3 |
| Shown recently | Suppressed (decays over 72 hours) |
| Note age | Mild boost for older notes |

Notes are then selected via weighted random sampling (without replacement).

## Settings

| Setting | Description |
|---------|-------------|
| **Note count** | Number of cards shown (3–10, default 5) |
| **Excluded folders** | Tree-style picker — toggle folders on/off |
| **Auto-refresh** | On: new notes each time sidebar opens. Off: keep previous notes until manual refresh |

## Installation

### From Obsidian Community Plugins

1. Open **Settings → Community Plugins → Browse**
2. Search for **MindSpark**
3. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/qishangc/obsidian-mindspark/releases)
2. Create folder `.obsidian/plugins/obsidian-mindspark-plugin/` in your vault
3. Copy the three files into that folder
4. Enable the plugin in **Settings → Community Plugins**

## Usage

1. Click the 🎲 dice icon in the left ribbon (or use command palette: `MindSpark: 打开侧边栏`)
2. Browse the surfaced notes
3. Click a card to open the note
4. Click 🔄 to refresh, or let it auto-refresh

## Data & Privacy

- All data stays local — view history is stored in your vault's plugin data
- No external network requests
- No modifications to your notes

## Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```

## License

[MIT](LICENSE)
