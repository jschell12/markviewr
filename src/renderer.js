/* global markviewr */

let activeItem = null;
let currentRootPath = null;
let currentTree = null;

document.addEventListener('DOMContentLoaded', () => {
  const fileTree = document.getElementById('file-tree');
  const emptyState = document.getElementById('empty-state');
  const welcome = document.getElementById('welcome');
  const markdownBody = document.getElementById('markdown-body');
  const markdownHeader = document.getElementById('markdown-header');
  const filePathDisplay = document.getElementById('file-path-display');
  const openFolderBtn = document.getElementById('open-folder-btn');
  const sidebarSearch = document.getElementById('sidebar-search');
  const searchResults = document.getElementById('search-results');
  const findBar = document.getElementById('find-bar');
  const findInput = document.getElementById('find-input');
  const findCount = document.getElementById('find-count');
  const findPrev = document.getElementById('find-prev');
  const findNext = document.getElementById('find-next');
  const findClose = document.getElementById('find-close');

  // ── Folder open ──

  openFolderBtn.addEventListener('click', async () => {
    const result = await markviewr.openFolder();
    if (result) handleFolderOpened(result);
  });

  markviewr.onFolderOpened((data) => handleFolderOpened(data));

  function handleFolderOpened({ rootPath, tree }) {
    currentRootPath = rootPath;
    currentTree = tree;
    sidebarSearch.value = '';
    searchResults.classList.add('hidden');
    renderTree(tree, rootPath);
  }

  function renderTree(tree, rootPath) {
    fileTree.innerHTML = '';
    fileTree.style.display = '';
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
        li.className = 'tree-dir collapsed';
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
        item.addEventListener('click', () => openFile(entry.path, entry.name, item));
        li.appendChild(item);
      }

      parentEl.appendChild(li);
    }
  }

  async function openFile(filePath, fileName, itemEl) {
    if (activeItem) activeItem.classList.remove('active');
    if (itemEl) {
      itemEl.classList.add('active');
      activeItem = itemEl;
    }

    welcome.style.display = 'none';
    markdownHeader.classList.remove('hidden');
    filePathDisplay.textContent = filePath.replace(currentRootPath + '/', '');
    markdownBody.innerHTML = '<p style="color:#888;">Loading…</p>';

    const content = await markviewr.readFile(filePath);
    const html = markviewr.parseMarkdown(content);
    markdownBody.innerHTML = html;
    markdownBody.scrollTop = 0;

    // Close find bar when switching files
    closeFindBar();
  }

  // ── Cross-document search ──

  let searchDebounce = null;

  sidebarSearch.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const query = sidebarSearch.value.trim();

    if (!query) {
      searchResults.classList.add('hidden');
      searchResults.innerHTML = '';
      fileTree.style.display = '';
      return;
    }

    searchDebounce = setTimeout(async () => {
      const results = await markviewr.searchFiles(query);
      renderSearchResults(results, query);
    }, 300);
  });

  sidebarSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sidebarSearch.value = '';
      sidebarSearch.dispatchEvent(new Event('input'));
      sidebarSearch.blur();
    }
  });

  function renderSearchResults(results, query) {
    searchResults.innerHTML = '';
    fileTree.style.display = 'none';

    if (results.length === 0) {
      searchResults.innerHTML = '<div style="padding:16px;text-align:center;color:var(--accent-dim);font-size:13px;">No results found</div>';
      searchResults.classList.remove('hidden');
      return;
    }

    const lowerQuery = query.toLowerCase();

    for (const file of results) {
      const fileEl = document.createElement('div');
      fileEl.className = 'search-result-file';
      fileEl.textContent = file.relativePath;
      searchResults.appendChild(fileEl);

      for (const match of file.matches) {
        const matchEl = document.createElement('div');
        matchEl.className = 'search-result-match';

        const lineNum = document.createElement('span');
        lineNum.className = 'line-num';
        lineNum.textContent = match.lineNumber;

        const lineText = document.createElement('span');
        lineText.className = 'line-text';
        lineText.innerHTML = highlightText(match.line, lowerQuery);

        matchEl.appendChild(lineNum);
        matchEl.appendChild(lineText);

        matchEl.addEventListener('click', () => {
          openFile(file.filePath, file.fileName, null);
        });

        searchResults.appendChild(matchEl);
      }
    }

    searchResults.classList.remove('hidden');
  }

  function highlightText(text, query) {
    const escaped = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const regex = new RegExp(`(${escapeRegex(escapedQuery)})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── In-document search ──

  let findMarks = [];
  let findCurrentIndex = -1;

  markviewr.onToggleFind(() => toggleFindBar());

  function toggleFindBar() {
    if (findBar.classList.contains('hidden')) {
      findBar.classList.remove('hidden');
      findInput.focus();
      findInput.select();
    } else {
      closeFindBar();
    }
  }

  function closeFindBar() {
    findBar.classList.add('hidden');
    findInput.value = '';
    findCount.textContent = '';
    clearHighlights();
  }

  findClose.addEventListener('click', closeFindBar);

  findInput.addEventListener('input', () => {
    performFind(findInput.value);
  });

  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFindBar();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateFind(-1);
      } else {
        navigateFind(1);
      }
    }
  });

  findPrev.addEventListener('click', () => navigateFind(-1));
  findNext.addEventListener('click', () => navigateFind(1));

  function performFind(query) {
    clearHighlights();

    if (!query) {
      findCount.textContent = '';
      return;
    }

    const textNodes = getTextNodes(markdownBody);
    const lowerQuery = query.toLowerCase();

    for (const node of textNodes) {
      const text = node.textContent;
      const lowerText = text.toLowerCase();
      let startIndex = 0;
      const parts = [];
      let lastEnd = 0;

      while (true) {
        const idx = lowerText.indexOf(lowerQuery, startIndex);
        if (idx === -1) break;

        if (idx > lastEnd) {
          parts.push({ text: text.slice(lastEnd, idx), match: false });
        }
        parts.push({ text: text.slice(idx, idx + query.length), match: true });
        lastEnd = idx + query.length;
        startIndex = idx + 1;
      }

      if (parts.length === 0) continue;
      if (lastEnd < text.length) {
        parts.push({ text: text.slice(lastEnd), match: false });
      }

      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (part.match) {
          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = part.text;
          findMarks.push(mark);
          frag.appendChild(mark);
        } else {
          frag.appendChild(document.createTextNode(part.text));
        }
      }
      node.parentNode.replaceChild(frag, node);
    }

    findCurrentIndex = findMarks.length > 0 ? 0 : -1;
    updateFindCount();
    scrollToCurrentMark();
  }

  function clearHighlights() {
    for (const mark of findMarks) {
      const parent = mark.parentNode;
      if (!parent) continue;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    }
    findMarks = [];
    findCurrentIndex = -1;
  }

  function navigateFind(direction) {
    if (findMarks.length === 0) return;
    findCurrentIndex = (findCurrentIndex + direction + findMarks.length) % findMarks.length;
    updateFindCount();
    scrollToCurrentMark();
  }

  function updateFindCount() {
    for (const mark of findMarks) {
      mark.classList.remove('current');
    }
    if (findMarks.length === 0) {
      findCount.textContent = 'No results';
      return;
    }
    findMarks[findCurrentIndex].classList.add('current');
    findCount.textContent = `${findCurrentIndex + 1} of ${findMarks.length}`;
  }

  function scrollToCurrentMark() {
    if (findCurrentIndex >= 0 && findMarks[findCurrentIndex]) {
      findMarks[findCurrentIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function getTextNodes(el) {
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim()) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  // ── Utilities ──

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
