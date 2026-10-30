/**
 * Minimal in-memory stand-in for the chrome.* APIs Clearmark uses, so the
 * manager can be rendered in jsdom during tests.
 */

type BasicEvent = {
  addListener: () => void
  removeListener: () => void
  hasListener: () => boolean
}

function basicEvent(): BasicEvent {
  return {
    addListener: () => undefined,
    removeListener: () => undefined,
    hasListener: () => false,
  }
}

type FakeNode = chrome.bookmarks.BookmarkTreeNode

export type FakeChromeOptions = {
  tree?: FakeNode[]
  extensions?: chrome.management.ExtensionInfo[]
  activeTab?: { url?: string; title?: string }
}

export function buildDefaultTree(): FakeNode[] {
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
                  dateAdded: 1_700_000_000_000,
                },
              ],
            },
            {
              id: '101',
              parentId: '1',
              title: 'Home',
              url: 'https://home.example.test/',
              dateAdded: 1_700_000_000_000,
            },
          ],
        },
      ],
    },
  ]
}

function findNode(nodes: FakeNode[], id: string): FakeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = node.children ? findNode(node.children, id) : undefined
    if (found) return found
  }
  return undefined
}

function removeNode(nodes: FakeNode[], id: string): boolean {
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
export function installFakeChrome(options: FakeChromeOptions = {}) {
  const tree = options.tree ?? buildDefaultTree()
  const storage: Record<string, unknown> = {}
  let counter = 1000

  const bookmarks = {
    getTree: (): Promise<FakeNode[]> => Promise.resolve(tree),
    get: (id: string): Promise<FakeNode[]> => {
      const node = findNode(tree, id)
      return node ? Promise.resolve([node]) : Promise.reject(new Error('Bookmark not found'))
    },
    getSubTree: (id: string): Promise<FakeNode[]> => {
      const node = findNode(tree, id)
      return node ? Promise.resolve([node]) : Promise.reject(new Error('Bookmark not found'))
    },
    search: (): Promise<FakeNode[]> => Promise.resolve([]),
    create: (arg: { parentId?: string; title?: string; url?: string }): Promise<FakeNode> => {
      const node: FakeNode = {
        id: `gen-${counter++}`,
        parentId: arg.parentId ?? '1',
        title: arg.title ?? '',
        dateAdded: Date.now(),
        ...(arg.url ? { url: arg.url } : { children: [] }),
      }
      const parent = arg.parentId ? findNode(tree, arg.parentId) : undefined
      if (parent) parent.children = [...(parent.children ?? []), node]
      return Promise.resolve(node)
    },
    update: (id: string, changes: { title?: string; url?: string }): Promise<FakeNode> => {
      const node = findNode(tree, id)
      if (!node) return Promise.reject(new Error('Bookmark not found'))
      if (changes.title !== undefined) node.title = changes.title
      if (changes.url !== undefined) node.url = changes.url
      return Promise.resolve(node)
    },
    move: (id: string, destination: { parentId?: string }): Promise<FakeNode> => {
      const node = findNode(tree, id)
      if (!node || !destination.parentId) return Promise.reject(new Error('Bookmark not found'))
      removeNode(tree, id)
      const parent = findNode(tree, destination.parentId)
      if (parent) parent.children = [...(parent.children ?? []), node]
      node.parentId = destination.parentId
      return Promise.resolve(node)
    },
    remove: (id: string): Promise<void> => {
      removeNode(tree, id)
      return Promise.resolve()
    },
    removeTree: (id: string): Promise<void> => {
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
      getURL: (path: string): string => path,
      getManifest: () => ({ version: '0.1.0' }),
      openOptionsPage: (): Promise<void> => Promise.resolve(),
      sendMessage: (): Promise<unknown> => Promise.resolve({ ok: true }),
      setUninstallURL: (_url: string, callback?: () => void): void => callback?.(),
      onInstalled: basicEvent(),
      onStartup: basicEvent(),
      onMessage: basicEvent(),
    },
    bookmarks,
    storage: {
      local: {
        get: (keys?: string[] | string): Promise<Record<string, unknown>> => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storage[keys] })
          }
          if (Array.isArray(keys)) {
            const out: Record<string, unknown> = {}
            for (const key of keys) {
              if (key in storage) out[key] = storage[key]
            }
            return Promise.resolve(out)
          }
          return Promise.resolve({ ...storage })
        },
        set: (patch: Record<string, unknown>): Promise<void> => {
          Object.assign(storage, patch)
          return Promise.resolve()
        },
        remove: (): Promise<void> => Promise.resolve(),
        clear: (): Promise<void> => {
          for (const key of Object.keys(storage)) delete storage[key]
          return Promise.resolve()
        },
      },
      onChanged: basicEvent(),
    },
    tabs: {
      create: (): Promise<Record<string, never>> => Promise.resolve({}),
      query: (): Promise<Array<{ url?: string; title?: string }>> =>
        Promise.resolve(options.activeTab ? [options.activeTab] : []),
    },
    management: {
      getAll: (): Promise<chrome.management.ExtensionInfo[]> =>
        Promise.resolve(options.extensions ?? []),
      get: (id: string): Promise<chrome.management.ExtensionInfo> => {
        const found = (options.extensions ?? []).find((ext) => ext.id === id)
        return found ? Promise.resolve(found) : Promise.reject(new Error('Extension not found'))
      },
      setEnabled: (): Promise<void> => Promise.resolve(),
      uninstall: (): Promise<void> => Promise.resolve(),
      uninstallSelf: (): Promise<void> => Promise.resolve(),
      getPermissionWarningsById: (): Promise<string[]> => Promise.resolve([]),
      onInstalled: basicEvent(),
      onUninstalled: basicEvent(),
      onEnabled: basicEvent(),
      onDisabled: basicEvent(),
    },
    permissions: {
      contains: (): Promise<boolean> => Promise.resolve(true),
      request: (): Promise<boolean> => Promise.resolve(true),
    },
  }

  Object.defineProperty(globalThis, 'chrome', {
    value: chromeFake as unknown as typeof chrome,
    configurable: true,
    writable: true,
  })

  return { tree, storage, chrome: chromeFake }
}
