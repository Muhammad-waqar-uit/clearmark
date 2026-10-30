 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }

export const DEFAULT_SETTINGS = {
  theme: 'system',
  defaultSort: 'title',
  uninstallUrl: '',
  managementExplained: false,
}

const DEFAULT_STORAGE = {
  meta: {},
  wantedExtensions: [],
  settings: DEFAULT_SETTINGS,
}

/** Read the whole extension state, filling in defaults for missing keys. */
export async function getStorage() {
  const raw = (await chrome.storage.local.get(['meta', 'wantedExtensions', 'settings'])) 
  return {
    meta: _nullishCoalesce(raw.meta, () => ( {})),
    wantedExtensions: _nullishCoalesce(raw.wantedExtensions, () => ( [])),
    settings: { ...DEFAULT_SETTINGS, ...(_nullishCoalesce(raw.settings, () => ( {}))) },
  }
}

/** Merge a partial update into stored state. */
export async function writeStorage(patch) {
  await chrome.storage.local.set(patch)
}

export async function updateSettings(patch) {
  const { settings } = await getStorage()
  const next = { ...settings, ...patch }
  await writeStorage({ settings: next })
  return next
}

export async function getBookmarkMeta() {
  const { meta } = await getStorage()
  return meta
}

export async function saveBookmarkMeta(id, meta) {
  const { meta: all } = await getStorage()
  all[id] = meta
  await writeStorage({ meta: all })
}

/** Write metadata for many bookmarks in a single storage operation. */
export async function saveManyBookmarkMeta(
  entries
) {
  const { meta } = await getStorage()
  for (const [id, value] of entries) meta[id] = value
  await writeStorage({ meta })
}

/** Drop tags/notes for bookmarks that no longer exist (e.g. removed folders). */
export async function pruneBookmarkMeta(validIds) {
  const { meta } = await getStorage()
  const valid = new Set(validIds)
  let changed = false
  for (const id of Object.keys(meta)) {
    if (!valid.has(id)) {
      delete meta[id]
      changed = true
    }
  }
  if (changed) await writeStorage({ meta })
}

export async function removeBookmarkMeta(id) {
  const { meta: all } = await getStorage()
  if (id in all) {
    delete all[id]
    await writeStorage({ meta: all })
  }
}

export async function getWantedExtensions() {
  const { wantedExtensions } = await getStorage()
  return wantedExtensions
}

export async function addWantedExtension(entry) {
  const wanted = await getWantedExtensions()
  if (wanted.some((item) => item.id === entry.id)) return
  await writeStorage({ wantedExtensions: [...wanted, { ...entry, addedAt: Date.now() }] })
}

export async function removeWantedExtension(id) {
  const wanted = await getWantedExtensions()
  await writeStorage({ wantedExtensions: wanted.filter((item) => item.id !== id) })
}

export async function replaceWantedExtensions(wanted) {
  await writeStorage({ wantedExtensions: wanted })
}

export { DEFAULT_STORAGE }
