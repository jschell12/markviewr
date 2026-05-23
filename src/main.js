const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'MarkViewr',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  const menu = Menu.buildFromTemplate([
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
  await openFolder();
});

// Open folder passed as CLI argument
function openFromArgs() {
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const dirArg = args.find((a) => !a.startsWith('-'));
  if (dirArg) {
    const resolved = path.resolve(dirArg);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      const tree = scanMarkdownFiles(resolved);
      mainWindow.webContents.send('folder-opened', {
        rootPath: resolved,
        tree,
      });
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  mainWindow.webContents.on('did-finish-load', () => {
    openFromArgs();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
