/* global markviewr */

let activeItem = null;

document.addEventListener('DOMContentLoaded', () => {
  const fileTree = document.getElementById('file-tree');
  const emptyState = document.getElementById('empty-state');
  const welcome = document.getElementById('welcome');
  const markdownBody = document.getElementById('markdown-body');
  const markdownHeader = document.getElementById('markdown-header');
  const filePathDisplay = document.getElementById('file-path-display');
  const openFolderBtn = document.getElementById('open-folder-btn');

  openFolderBtn.addEventListener('click', () => {
    markviewr.openFolder();
  });

  markviewr.onFolderOpened(({ rootPath, tree }) => {
    renderTree(tree, rootPath);
  });

  function renderTree(tree, rootPath) {
    fileTree.innerHTML = '';
    emptyState.style.display = 'none';

    if (tree.length === 0) {
      emptyState.style.display = 'block';
      emptyState.querySelector('p').textContent = 'No Markdown files found';
      return;
    }

    const rootName = rootPath.split('/').pop() || rootPath;
    const rootLabel = document.createElement('li');
    rootLabel.innerHTML = `<div class="tree-item" style="font-weight:600;color:var(--accent);padding:6px 12px 2px;cursor:default;">${escapeHtml(rootName)}</div>`;
    fileTree.appendChild(rootLabel);

    buildTreeNodes(tree, fileTree, rootPath);
  }

  function buildTreeNodes(entries, parentEl, rootPath) {
    for (const entry of entries) {
      const li = document.createElement('li');

      if (entry.type === 'directory') {
        li.className = 'tree-dir';
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.innerHTML = `<span class="chevron">▼</span><span class="icon">📁</span><span>${escapeHtml(entry.name)}</span>`;
        item.addEventListener('click', () => {
          li.classList.toggle('collapsed');
        });
        li.appendChild(item);

        const subList = document.createElement('ul');
        buildTreeNodes(entry.children, subList, rootPath);
        li.appendChild(subList);
      } else {
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.innerHTML = `<span class="icon">📄</span><span>${escapeHtml(entry.name)}</span>`;
        item.addEventListener('click', () => openFile(entry, item, rootPath));
        li.appendChild(item);
      }

      parentEl.appendChild(li);
    }
  }

  async function openFile(entry, itemEl, rootPath) {
    if (activeItem) activeItem.classList.remove('active');
    itemEl.classList.add('active');
    activeItem = itemEl;

    welcome.style.display = 'none';
    markdownHeader.classList.remove('hidden');
    filePathDisplay.textContent = entry.path.replace(rootPath + '/', '');
    markdownBody.innerHTML = '<p style="color:#888;">Loading…</p>';

    const content = await markviewr.readFile(entry.path);
    const html = markviewr.parseMarkdown(content);
    markdownBody.innerHTML = html;
    markdownBody.scrollTop = 0;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
