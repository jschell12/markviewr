# MarkViewr

A standalone Markdown viewer for repositories. Opens a folder and displays only `.md` files in their directory structure — nothing else.

## Features

- **Markdown-only file tree** — Directories containing no `.md` files are hidden
- **GitHub-flavored Markdown** — Tables, task lists, fenced code blocks
- **Syntax highlighting** — Code blocks with language detection
- **CLI support** — Pass a directory path as an argument
- **Clean UI** — Dark sidebar, light content area

## Install

```bash
git clone https://github.com/jschell12/markviewr.git
cd markviewr
npm install
```

## Usage

```bash
# Launch and open a folder via the UI
npm start

# Open a specific directory
npm start -- /path/to/your/repo
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+O` / `Ctrl+O` | Open folder |
| `Cmd+R` / `Ctrl+R` | Reload |
| `Cmd++` / `Cmd+-` | Zoom in/out |

## License

MIT
