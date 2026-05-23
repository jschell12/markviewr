const { contextBridge, ipcRenderer } = require('electron');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Custom renderer for code blocks with syntax highlighting
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }) {
  const language = lang && hljs.getLanguage(lang) ? lang : '';
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;
  return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>`;
};

marked.use({ renderer, gfm: true, breaks: true });

contextBridge.exposeInMainWorld('markviewr', {
  onFolderOpened: (callback) =>
    ipcRenderer.on('folder-opened', (_event, data) => callback(data)),
  onToggleFind: (callback) =>
    ipcRenderer.on('toggle-find', () => callback()),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  searchFiles: (query) => ipcRenderer.invoke('search-files', query),
  parseMarkdown: (content) => marked.parse(content),
});
