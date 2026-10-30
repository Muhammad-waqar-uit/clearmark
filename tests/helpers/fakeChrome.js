 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/**
 * Minimal in-memory stand-in for the chrome.* APIs Clearmark uses, so the
 * manager can be rendered in jsdom during tests.
 */







function basicEvent() {
  return {
    addListener: () => undefined,
    removeListener: () => undefined,
    hasListener: () => false,
  }
}









export function buildDefaultTree() {
  return [
    {
      id: '0',
      title: '',
      children: [
        {
          id: '1',
          parentId: '0',
          title: 'Bookmarks bar',
          children: [
            {
              id: '10',
              parentId: '1',
              title: 'Work',
              children: [
                {
                  id: '100',
                  parentId: '10',
                  title: 'Docs',
                  url: 'https://docs.example.test/guide',
                  dateAdded: 1700000000000,
                },
              ],
            },
            {
              id: '101',
              parentId: '1',
              title: 'Home',
              url: 'https://home.example.test/',
              dateAdded: 1700000000000,
            },
          ],
        },
      ],
    },
  ]
}

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = node.children ? findNode(node.children, id) : undefined
    if (found) return found
  }
  return undefined
}

function removeNode(nodes, id) {
  for (let index = 0; index < nodes.length; index += 1) {
    if (nodes[index].id === id) {
      nodes.splice(index, 1)
      return true
    }
    const children = nodes[index].children
    if (children && removeNode(children, id)) return true
  }
  return false
}

/** Install the fake on `globalThis.chrome` and return the mutable state. */
export function installFakeChrome(options = {}) {
  const tree = _nullishCoalesce(options.tree, () => ( buildDefaultTree()))
  const storage = {}
  let counter = 1000

  const bookmarks = {
    getTree: () => Promise.resolve(tree),
    get: (id) => {
      const node = findNode(tree, id)
      return node ? Promise.resolve([node]) : Promise.reject(new Error('Bookmark not found'))
    },
    getSubTree: (id) => {
      const node = findNode(tree, id)
      return node ? Promise.resolve([node]) : Promise.reject(new Error('Bookmark not found'))
    },
    search: () => Promise.resolve([]),
    create: (arg) => {
      const node = {
        id: `gen-${counter++}`,
        parentId: _nullishCoalesce(arg.parentId, () => ( '1')),
        title: _nullishCoalesce(arg.title, () => ( '')),
        dateAdded: Date.now(),
        ...(arg.url ? { url: arg.url } : { children: [] }),
      }
      const parent = arg.parentId ? findNode(tree, arg.parentId) : undefined
      if (parent) parent.children = [...(_nullishCoalesce(parent.children, () => ( []))), node]
      return Promise.resolve(node)
    },
    update: (id, changes) => {
      const node = findNode(tree, id)
      if (!node) return Promise.reject(new Error('Bookmark not found'))
      if (changes.title !== undefined) node.title = changes.title
      if (changes.url !== undefined) node.url = changes.url
      return Promise.resolve(node)
    },
    move: (id, destination) => {
      const node = findNode(tree, id)
      if (!node || !destination.parentId) return Promise.reject(new Error('Bookmark not found'))
      removeNode(tree, id)
      const parent = findNode(tree, destination.parentId)
      if (parent) parent.children = [...(_nullishCoalesce(parent.children, () => ( []))), node]
      node.parentId = destination.parentId
      return Promise.resolve(node)
    },
    remove: (id) => {
      removeNode(tree, id)
      return Promise.resolve()
    },
    removeTree: (id) => {
      removeNode(tree, id)
      return Promise.resolve()
    },
    onCreated: basicEvent(),
    onRemoved: basicEvent(),
    onChanged: basicEvent(),
    onMoved: basicEvent(),
    onChildrenReordered: basicEvent(),
    onImportEnded: basicEvent(),
  }

  const chromeFake = {
    runtime: {
      id: 'clearmark-test',
      getURL: (path) => path,
      getManifest: () => ({ version: '0.1.0' }),
      openOptionsPage: () => Promise.resolve(),
      sendMessage: () => Promise.resolve({ ok: true }),
      setUninstallURL: (_url, callback) => _optionalChain([callback, 'optionalCall', _ => _()]),
      onInstalled: basicEvent(),
      onStartup: basicEvent(),
      onMessage: basicEvent(),
    },
    bookmarks,
    storage: {
      local: {
        get: (keys) => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storage[keys] })
          }
          if (Array.isArray(keys)) {
            const out = {}
            for (const key of keys) {
              if (key in storage) out[key] = storage[key]
            }
            return Promise.resolve(out)
          }
          return Promise.resolve({ ...storage })
        },
        set: (patch) => {
          Object.assign(storage, patch)
          return Promise.resolve()
        },
        remove: () => Promise.resolve(),
        clear: () => {
          for (const key of Object.keys(storage)) delete storage[key]
          return Promise.resolve()
        },
      },
      onChanged: basicEvent(),
    },
    tabs: {
      create: () => Promise.resolve({}),
      query: () =>
        Promise.resolve(options.activeTab ? [options.activeTab] : []),
    },
    management: {
      getAll: () =>
        Promise.resolve(_nullishCoalesce(options.extensions, () => ( []))),
      get: (id) => {
        const found = (_nullishCoalesce(options.extensions, () => ( []))).find((ext) => ext.id === id)
        return found ? Promise.resolve(found) : Promise.reject(new Error('Extension not found'))
      },
      setEnabled: () => Promise.resolve(),
      uninstall: () => Promise.resolve(),
      uninstallSelf: () => Promise.resolve(),
      getPermissionWarningsById: () => Promise.resolve([]),
      onInstalled: basicEvent(),
      onUninstalled: basicEvent(),
      onEnabled: basicEvent(),
      onDisabled: basicEvent(),
    },
    permissions: {
      contains: () => Promise.resolve(true),
      request: () => Promise.resolve(true),
    },
  }

  Object.defineProperty(globalThis, 'chrome', {
    value: chromeFake ,
    configurable: true,
    writable: true,
  })

  return { tree, storage, chrome: chromeFake }
}
