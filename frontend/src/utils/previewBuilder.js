/**
 * Build a flat normalized relative path map from the nested fileTree,
 * merging any unsaved live edits from openTabs and activeFile.
 */
export const buildFileMap = (fileTree = [], openTabs = [], activeFile = null) => {
  const liveContentById = new Map()

  for (const tab of openTabs) {
    const id = tab._id || tab.id
    if (id && tab.content !== undefined) {
      liveContentById.set(String(id), tab.content)
    }
  }

  if (activeFile) {
    const activeId = activeFile._id || activeFile.id
    if (activeId && activeFile.content !== undefined) {
      liveContentById.set(String(activeId), activeFile.content)
    }
  }

  const fileMap = {}

  const traverse = (nodes, prefix = '') => {
    for (const node of nodes) {
      if (!node || !node.name) continue
      const relPath = prefix ? `${prefix}/${node.name}` : node.name

      if (node.type === 'folder') {
        if (Array.isArray(node.children) && node.children.length > 0) {
          traverse(node.children, relPath)
        }
      } else if (node.type === 'file') {
        const id = node._id || node.id
        const content =
          id && liveContentById.has(String(id))
            ? liveContentById.get(String(id))
            : node.content || ''

        fileMap[relPath] = {
          ...node,
          path: relPath,
          content
        }
      }
    }
  }

  // Skip the single root workspace folder wrapper (parentId === null)
  if (
    Array.isArray(fileTree) &&
    fileTree.length === 1 &&
    fileTree[0].type === 'folder' &&
    !fileTree[0].parentId
  ) {
    traverse(fileTree[0].children || [], '')
  } else if (Array.isArray(fileTree)) {
    traverse(fileTree, '')
  }

  return fileMap
}

/**
 * Determine whether the workspace is previewable:
 * Supports:
 * 1. React + Vite
 * 2. Plain HTML + CSS + JavaScript
 * Everything else -> unsupported ("Can't preview this project")
 */
export const detectProjectKind = (fileMap) => {
  const paths = Object.keys(fileMap)
  if (paths.length === 0) {
    return { kind: 'empty', reason: 'Create files or ask the AI Agent to build a project.' }
  }

  let packageJson = null
  if (fileMap['package.json']?.content) {
    try {
      packageJson = JSON.parse(fileMap['package.json'].content)
    } catch {
      packageJson = null
    }
  }

  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {})
  }

  const hasReactDep = Boolean(deps.react || deps['react-dom'])
  const hasReactEntry = Boolean(
    fileMap['src/main.jsx'] ||
      fileMap['src/main.tsx'] ||
      fileMap['src/main.js'] ||
      fileMap['src/App.jsx'] ||
      fileMap['src/App.tsx'] ||
      fileMap['App.jsx']
  )

  if (hasReactDep || hasReactEntry) {
    return { kind: 'react-vite', packageJson }
  }

  const htmlEntry = fileMap['index.html']
    ? 'index.html'
    : paths.find((p) => !p.includes('/') && p.toLowerCase().endsWith('.html'))

  if (htmlEntry) {
    // Check if HTML explicitly loads a Vite/JSX entry script
    const htmlContent = fileMap[htmlEntry].content || ''
    if (/type=["']module["'][^>]*src=["'][^"']*\.(jsx|tsx)["']/i.test(htmlContent)) {
      return { kind: 'react-vite', packageJson }
    }
    return { kind: 'html-js', entryHtmlPath: htmlEntry }
  }

  return {
    kind: 'unsupported',
    reason: "Can't preview this project"
  }
}

const normalizeRelPath = (baseDir, refPath) => {
  if (!refPath) return ''
  if (/^(https?:)?\/\//i.test(refPath) || refPath.startsWith('data:') || refPath.startsWith('blob:')) {
    return null
  }
  const cleaned = refPath.split('?')[0].split('#')[0].replace(/^\.\//, '').replace(/^\//, '')
  if (!baseDir) return cleaned
  const baseParts = baseDir.split('/').filter(Boolean)
  const relParts = refPath.split('?')[0].split('#')[0].split('/')
  if (refPath.startsWith('/')) {
    return cleaned
  }
  const stack = [...baseParts]
  for (const part of relParts) {
    if (!part || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

const findMatchingFile = (fileMap, targetPath) => {
  if (!targetPath) return null
  if (fileMap[targetPath]) return fileMap[targetPath]
  const lower = targetPath.toLowerCase()
  const key = Object.keys(fileMap).find((k) => k.toLowerCase() === lower)
  return key ? fileMap[key] : null
}

const STORAGE_SHIM_JS = `
(function() {
  function createMemoryStorage() {
    var store = {};
    return {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function(k, v) { store[String(k)] = String(v); },
      removeItem: function(k) { delete store[String(k)]; },
      clear: function() { store = {}; },
      key: function(i) { return Object.keys(store)[i] || null; },
      get length() { return Object.keys(store).length; }
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function(prop) {
    try {
      var s = window[prop];
      s.setItem('__sandbox_test__', '1');
      s.removeItem('__sandbox_test__');
    } catch (e) {
      try {
        Object.defineProperty(window, prop, { value: createMemoryStorage(), configurable: true });
      } catch (err) {}
    }
  });
})();
`

const ERROR_BRIDGE_SCRIPT = `
<script>
${STORAGE_SHIM_JS}
(function() {
  function notify(type, message) {
    try {
      window.parent.postMessage({ source: 'ai-ide-preview', type: type, message: String(message || '') }, '*');
    } catch (e) {}
  }
  window.addEventListener('error', function(e) {
    notify('error', (e.message || 'Runtime error') + (e.lineno ? ' (line ' + e.lineno + ')' : ''));
  });
  window.addEventListener('unhandledrejection', function(e) {
    notify('error', 'Unhandled promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
  });
  window.addEventListener('DOMContentLoaded', function() {
    notify('ready', 'Preview loaded');
  });
})();
</script>
`

/**
 * Build a self-contained HTML srcDoc for Plain HTML + CSS + JavaScript projects
 */
export const buildHtmlPreviewDoc = (fileMap, entryHtmlPath = 'index.html') => {
  const htmlFile = fileMap[entryHtmlPath]
  let html = htmlFile?.content || '<!DOCTYPE html><html><head></head><body></body></html>'
  const baseDir = entryHtmlPath.includes('/') ? entryHtmlPath.split('/').slice(0, -1).join('/') : ''

  // Inline local <link rel="stylesheet" href="...">
  html = html.replace(
    /<link\b([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (fullMatch, before, href, after) => {
      const isStylesheet = /rel=["']stylesheet["']/i.test(before + after) || href.toLowerCase().endsWith('.css')
      if (!isStylesheet) return fullMatch
      const resolved = normalizeRelPath(baseDir, href)
      const cssFile = findMatchingFile(fileMap, resolved)
      if (!cssFile) return fullMatch
      return `<style data-source="${cssFile.path}">\n${cssFile.content}\n</style>`
    }
  )

  // Inline local <script src="..."></script> (defer/head scripts are moved before </body> so DOM exists)
  const deferredScripts = []
  const bodyOpenIdx = html.search(/<body\b/i)

  html = html.replace(
    /<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (fullMatch, before, src, after, offset) => {
      const resolved = normalizeRelPath(baseDir, src)
      const jsFile = findMatchingFile(fileMap, resolved)
      if (!jsFile) return fullMatch
      const safeJs = (jsFile.content || '').replace(/<\/script/gi, '<\\/script')
      const attrs = before + after
      const typeAttr = /type=["']module["']/i.test(attrs) ? ' type="module"' : ''
      const isDeferred = /\bdefer\b/i.test(attrs) || (bodyOpenIdx !== -1 && offset < bodyOpenIdx)
      const inlined = `<script${typeAttr} data-source="${jsFile.path}">\n${safeJs}\n</script>`
      if (isDeferred) {
        deferredScripts.push(inlined)
        return ''
      }
      return inlined
    }
  )

  if (deferredScripts.length > 0) {
    const joined = deferredScripts.join('\n')
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${joined}\n</body>`)
    } else {
      html = `${html}\n${joined}`
    }
  }

  // Inject error bridge + storage shim in <head> (or prepend)
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${ERROR_BRIDGE_SCRIPT}`)
  } else {
    html = `${ERROR_BRIDGE_SCRIPT}\n${html}`
  }

  return html
}

/**
 * Build a self-contained React + Vite in-browser sandbox srcDoc
 */
export const buildReactPreviewDoc = (fileMap, packageJson = null) => {
  const paths = Object.keys(fileMap)

  // Detect Tailwind CSS usage
  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {})
  }
  const htmlRaw = fileMap['index.html']?.content || fileMap['src/index.html']?.content || ''
  const allCssText = paths
    .filter((p) => p.toLowerCase().endsWith('.css'))
    .map((p) => fileMap[p].content || '')
    .join('\n')

  const allCodeText = paths
    .filter((p) => /\.(jsx?|tsx?)$/i.test(p))
    .map((p) => fileMap[p].content || '')
    .join('\n')

  const hasTailwindClassesInJsx =
    /className=["'`][^"'`]*\b(min-h-screen|bg-(?:slate|gray|zinc|neutral|blue|indigo|emerald|cyan|purple|amber|rose)-\d{2,3}|text-(?:xs|sm|lg|xl|2xl|3xl|4xl|5xl)|rounded-(?:lg|xl|2xl|full)|items-center|justify-center)\b/.test(
      allCodeText
    )

  const usesTailwind =
    Boolean(deps.tailwindcss || deps['@tailwindcss/vite']) ||
    /@tailwind\b|@import\s+["']tailwindcss["']/i.test(allCssText) ||
    /cdn\.tailwindcss\.com/i.test(htmlRaw) ||
    hasTailwindClassesInJsx

  // Extract external <link> tags from project's index.html (e.g. Google Fonts)
  const externalHeadTags = []
  const linkMatches = htmlRaw.match(/<link\b[^>]*>/gi) || []
  for (const tag of linkMatches) {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
    const href = hrefMatch?.[1] || ''
    if (/^https?:\/\//i.test(href) && !/\.svg$/i.test(href)) {
      externalHeadTags.push(tag)
    }
  }

  // Extract body inner HTML (preserving #root or custom mount node)
  let bodyContent = '<div id="root"></div>'
  const bodyMatch = htmlRaw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    const cleanedBody = bodyMatch[1]
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .trim()
    if (cleanedBody) {
      bodyContent = cleanedBody
    }
  }
  if (!/id=["']root["']/i.test(bodyContent)) {
    bodyContent = `<div id="root"></div>\n${bodyContent}`
  }

  // Build clean CSS style blocks
  const styleTags = paths
    .filter((p) => p.toLowerCase().endsWith('.css'))
    .map((p) => {
      let css = fileMap[p].content || ''
      // Strip Tailwind v4 @import "tailwindcss"; since Tailwind CDN provides utilities
      css = css.replace(/@import\s+["']tailwindcss["']\s*;?/gi, '')
      if (usesTailwind && /@(tailwind|apply|layer)\b/.test(css)) {
        return `<style type="text/tailwindcss" data-source="${p}">\n${css}\n</style>`
      }
      css = css.replace(/@tailwind\s+(base|components|utilities)\s*;?/gi, '')
      return `<style data-source="${p}">\n${css}\n</style>`
    })
    .join('\n')

  // Prepare JS/JSX/TS/TSX/JSON modules payload
  const codeFiles = {}
  const externalPackages = new Set(['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'])

  for (const p of paths) {
    if (/\.(jsx?|tsx?|json)$/i.test(p) && p !== 'package.json' && p !== 'package-lock.json' && p !== 'vite.config.js' && p !== 'vite.config.ts') {
      const content = fileMap[p].content || ''
      codeFiles[p] = content

      // Scan for bare npm imports
      if (!p.endsWith('.json')) {
        const importRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g
        let match
        while ((match = importRegex.exec(content)) !== null) {
          const spec = match[1] || match[2]
          if (
            spec &&
            !spec.startsWith('.') &&
            !spec.startsWith('/') &&
            !spec.endsWith('.css') &&
            !spec.startsWith('http')
          ) {
            externalPackages.add(spec)
          }
        }
      }
    }
  }

  const serializedFiles = JSON.stringify(codeFiles).replace(/<\/script/gi, '<\\/script')
  const serializedExternals = JSON.stringify(Array.from(externalPackages)).replace(/<\/script/gi, '<\\/script')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  ${externalHeadTags.join('\n  ')}
  ${usesTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  ${styleTags}
  <script>${STORAGE_SHIM_JS}</script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    #__preview_error_overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(9, 12, 19, 0.96);
      color: #fca5a5;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding: 24px;
      z-index: 99999;
      overflow: auto;
    }
    #__preview_error_overlay h3 {
      margin: 0 0 10px 0;
      color: #f87171;
      font-size: 14px;
    }
    #__preview_error_overlay pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      line-height: 1.5;
      color: #fecaca;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 8px;
      padding: 14px;
    }
  </style>
</head>
<body>
  ${bodyContent}
  <div id="__preview_error_overlay">
    <h3>Preview Runtime Error</h3>
    <pre id="__preview_error_text"></pre>
  </div>

  <script type="module">
    const FILES = ${serializedFiles};
    const EXTERNAL_SPECS = ${serializedExternals};

    function notify(type, message) {
      try {
        window.parent.postMessage({ source: 'ai-ide-preview', type, message: String(message || '') }, '*');
      } catch {}
    }

    function showError(err) {
      const msg = err?.stack || err?.message || String(err);
      const overlay = document.getElementById('__preview_error_overlay');
      const text = document.getElementById('__preview_error_text');
      if (overlay && text) {
        text.textContent = msg;
        overlay.style.display = 'block';
      }
      notify('error', err?.message || String(err));
    }

    window.addEventListener('error', (e) => showError(e.error || e.message));
    window.addEventListener('unhandledrejection', (e) => showError(e.reason));

    function resolveFilePath(fromFile, request) {
      if (!request) return null;
      let target = request.split('?')[0];
      if (target.startsWith('/')) {
        target = target.slice(1);
      } else if (target.startsWith('.')) {
        const baseParts = fromFile.split('/').slice(0, -1);
        for (const part of target.split('/')) {
          if (!part || part === '.') continue;
          if (part === '..') baseParts.pop();
          else baseParts.push(part);
        }
        target = baseParts.join('/');
      }

      const candidates = [
        target,
        target + '.jsx',
        target + '.tsx',
        target + '.js',
        target + '.ts',
        target + '.json',
        target + '/index.jsx',
        target + '/index.tsx',
        target + '/index.js',
        target + '/index.ts'
      ];

      for (const cand of candidates) {
        if (Object.prototype.hasOwnProperty.call(FILES, cand)) {
          return cand;
        }
      }
      const lowerMap = {};
      for (const k of Object.keys(FILES)) lowerMap[k.toLowerCase()] = k;
      for (const cand of candidates) {
        if (lowerMap[cand.toLowerCase()]) return lowerMap[cand.toLowerCase()];
      }
      return null;
    }

    async function loadExternal(spec) {
      const pinned = {
        'react': 'https://esm.sh/react@18.3.1',
        'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
        'react-dom': 'https://esm.sh/react-dom@18.3.1',
        'react-dom/client': 'https://esm.sh/react-dom@18.3.1/client'
      };
      const url = pinned[spec] || ('https://esm.sh/' + spec + '?deps=react@18.3.1,react-dom@18.3.1');
      const mod = await import(url);
      const normalized = { ...mod, __esModule: true };
      if (mod.default && typeof mod.default === 'object') {
        Object.assign(normalized, mod.default);
        normalized.default = mod.default;
      } else if (mod.default) {
        normalized.default = mod.default;
      } else {
        normalized.default = normalized;
      }
      return normalized;
    }

    async function boot() {
      try {
        if (!window.Babel) {
          throw new Error('Failed to load @babel/standalone compiler. Check your internet connection.');
        }

        const externals = {};
        await Promise.all(
          EXTERNAL_SPECS.map(async (spec) => {
            try {
              externals[spec] = await loadExternal(spec);
            } catch (err) {
              console.warn('Could not load package ' + spec, err);
            }
          })
        );

        if (externals['react']) {
          window.React = externals['react'].default || externals['react'];
        }

        const moduleCache = {};

        function customRequire(fromFile, request) {
          if (externals[request]) {
            return externals[request];
          }
          if (/\\.css(\\?.*)?$/i.test(request)) {
            return {};
          }
          if (!request.startsWith('.') && !request.startsWith('/')) {
            throw new Error('Package "' + request + '" could not be resolved.');
          }

          const resolved = resolveFilePath(fromFile, request);
          if (!resolved) {
            throw new Error('Cannot find module "' + request + '" imported from "' + fromFile + '"');
          }

          if (moduleCache[resolved]) {
            return moduleCache[resolved].exports;
          }

          if (resolved.endsWith('.json')) {
            const mod = { exports: JSON.parse(FILES[resolved] || '{}') };
            moduleCache[resolved] = mod;
            return mod.exports;
          }

          const mod = { exports: {} };
          moduleCache[resolved] = mod;

          const transformed = window.Babel.transform(FILES[resolved], {
            filename: resolved,
            presets: [
              ['env', { modules: 'commonjs' }],
              ['react', { runtime: 'classic' }],
              'typescript'
            ]
          }).code;

          const fn = new Function('require', 'module', 'exports', transformed);
          fn((req) => customRequire(resolved, req), mod, mod.exports);
          return mod.exports;
        }

        const entryCandidates = ['src/main.jsx', 'src/main.tsx', 'src/main.js', 'src/index.jsx', 'src/index.js', 'main.jsx'];
        const entry = entryCandidates.find((c) => Object.prototype.hasOwnProperty.call(FILES, c));

        if (entry) {
          customRequire('__root__', './' + entry);
        } else {
          const appCandidates = ['src/App.jsx', 'src/App.tsx', 'src/App.js', 'App.jsx'];
          const appPath = appCandidates.find((c) => Object.prototype.hasOwnProperty.call(FILES, c));
          if (!appPath) {
            throw new Error('No React entry file (src/main.jsx or src/App.jsx) found.');
          }
          const appMod = customRequire('__root__', './' + appPath);
          const AppComp = appMod.default || appMod;
          const ReactLib = externals['react'].default || externals['react'];
          const ReactDOMClient = externals['react-dom/client'];
          const rootEl = document.getElementById('root');
          ReactDOMClient.createRoot(rootEl).render(ReactLib.createElement(AppComp));
        }

        notify('ready', 'React preview running');
      } catch (err) {
        showError(err);
      }
    }

    boot();
  </script>
</body>
</html>`
}
