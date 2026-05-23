const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('MarkViewr');

let mainWindow;
let currentRootPath = null;

function createWindow() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '..', 'assets', 'icon.png')
  );

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'MarkViewr',
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  const menu = Menu.buildFromTemplate([
    ...(process.platform === 'darwin'
      ? [
          {
            label: 'MarkViewr',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'copy' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('toggle-find'),
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder…',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFolder(),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

async function openFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Open Repository Folder',
  });

  if (result.canceled || result.filePaths.length === 0) return;

  const dirPath = result.filePaths[0];
  currentRootPath = dirPath;
  const tree = scanMarkdownFiles(dirPath);
  mainWindow.webContents.send('folder-opened', { rootPath: dirPath, tree });
}

function scanMarkdownFiles(dirPath) {
  const entries = [];

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      if (item.name.startsWith('.')) continue;
      if (item.name === 'node_modules') continue;

      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        const children = scanMarkdownFiles(fullPath);
        if (children.length > 0) {
          entries.push({
            name: item.name,
            path: fullPath,
            type: 'directory',
            children,
          });
        }
      } else if (item.name.toLowerCase().endsWith('.md')) {
        entries.push({
          name: item.name,
          path: fullPath,
          type: 'file',
        });
      }
    }
  } catch {
    // skip unreadable directories
  }

  return entries;
}

ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '> Error reading file.';
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Open Repository Folder',
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const dirPath = result.filePaths[0];
  currentRootPath = dirPath;
  const tree = scanMarkdownFiles(dirPath);
  return { rootPath: dirPath, tree };
});

function collectFiles(entries) {
  const files = [];
  for (const entry of entries) {
    if (entry.type === 'file') {
      files.push(entry);
    } else if (entry.children) {
      files.push(...collectFiles(entry.children));
    }
  }
  return files;
}

ipcMain.handle('search-files', async (_event, query) => {
  if (!currentRootPath || !query) return [];

  const tree = scanMarkdownFiles(currentRootPath);
  const files = collectFiles(tree);
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const lines = content.split('\n');
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lowerQuery)) {
          matches.push({ line: lines[i].trim(), lineNumber: i + 1 });
          if (matches.length >= 3) break;
        }
      }
      if (matches.length > 0) {
        results.push({
          filePath: file.path,
          fileName: file.name,
          relativePath: file.path.replace(currentRootPath + '/', ''),
          matches,
        });
      }
    } catch {
      // skip unreadable files
    }
  }

  return results;
});

// Open folder passed as CLI argument
function openFromArgs() {
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const dirArg = args.find((a) => !a.startsWith('-'));
  if (dirArg) {
    const resolved = path.resolve(dirArg);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      currentRootPath = resolved;
      const tree = scanMarkdownFiles(resolved);
      mainWindow.webContents.send('folder-opened', {
        rootPath: resolved,
        tree,
      });
    }
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const dockIcon = nativeImage.createFromPath(
      path.join(__dirname, '..', 'assets', 'icon.png')
    );
    app.dock.setIcon(dockIcon);
  }
  createWindow();
  mainWindow.webContents.on('did-finish-load', () => {
    openFromArgs();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
