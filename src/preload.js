const { contextBridge, ipcRenderer } = require('electron');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked with syntax highlighting
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

// Custom renderer for code blocks to add language class
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }) {
  const language = lang && hljs.getLanguage(lang) ? lang : '';
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;
  return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>`;
};

marked.use({ renderer });

contextBridge.exposeInMainWorld('markviewr', {
  onFolderOpened: (callback) =>
    ipcRenderer.on('folder-opened', (_event, data) => callback(data)),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  parseMarkdown: (content) => marked.parse(content),
});
