# MarkViewr

A standalone Markdown viewer for repositories. Opens a folder and displays only `.md` files in their directory structure — nothing else.

## Features

- **Markdown-only file tree** — Directories containing no `.md` files are hidden
- **GitHub-flavored Markdown** — Tables, task lists, fenced code blocks
- **Syntax highlighting** — Code blocks with language detection
- **Cross-document search** — Search across all Markdown files from the sidebar
- **In-document search** — Find and highlight matches within the current document
- **CLI support** — Pass a directory path as an argument
- **Clean UI** — Dark sidebar, light content area
- **Packaged app** — Build a native `.app` with `make build`

## Install

```bash
git clone https://github.com/jschell12/markviewr.git
cd markviewr
make install
```

## Usage

```bash
# Launch and open a folder via the UI
make up

# Open a specific directory
npm start -- /path/to/your/repo

# Build a native macOS app
make build

# Stop the app
make down
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+O` / `Ctrl+O` | Open folder |
| `Cmd+F` / `Ctrl+F` | Find in document |
| `Enter` / `Shift+Enter` | Next / previous match |
| `Escape` | Close search |
| `Cmd+R` / `Ctrl+R` | Reload |
| `Cmd++` / `Cmd+-` | Zoom in/out |

## License

MIT
