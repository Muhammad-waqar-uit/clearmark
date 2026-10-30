 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

export const WEBSTORE_PREFIX = 'https://chromewebstore.google.com/detail/'

/** Id of Clearmark itself; never offered for bulk actions. */
export function selfId() {
  return chrome.runtime.id
}

/** Every installed item, sorted by name (extensions, apps and themes included). */
export async function listInstalled() {
  const all = await chrome.management.getAll()
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export function isInstalledExtension(ext) {
  return ext.type === 'extension'
}

/** True when Chrome lets the user disable or remove this item. */
export function isManageable(ext) {
  return ext.mayDisable !== false && ext.id !== selfId()
}

/** True when an administrator installed the item. */
export function isPolicyManaged(ext) {
  return ext.installType === 'admin' || ext.mayDisable === false
}

export function storeUrl(id) {
  return `${WEBSTORE_PREFIX}${id}`
}

/** Best available icon URL for an installed item. */
export function iconUrl(ext) {
  const icons = [...(_nullishCoalesce(ext.icons, () => ( [])))].sort((a, b) => (_nullishCoalesce(b.size, () => ( 0))) - (_nullishCoalesce(a.size, () => ( 0))))
  return _optionalChain([icons, 'access', _ => _[0], 'optionalAccess', _2 => _2.url])
}

/** Accept a bare id, a Chrome Web Store URL or a crx:// URL. */
export function parseExtensionId(input) {
  const value = input.trim()
  if (!value) return null
  const fromUrl = /\/detail\/(?:[^/]+\/)?([a-p]{32})/i.exec(value)
  if (fromUrl) return fromUrl[1].toLowerCase()
  const bare = /^[a-p]{32}$/i.exec(value)
  if (bare) return value.toLowerCase()
  return null
}

 

export function matchesFilter(
  ext,
  filter,
  query
) {
  if (!isInstalledExtension(ext)) return false
  if (filter === 'enabled' && !ext.enabled) return false
  if (filter === 'disabled' && ext.enabled) return false
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    ext.name.toLowerCase().includes(needle) ||
    (_nullishCoalesce(ext.description, () => ( ''))).toLowerCase().includes(needle) ||
    ext.id.toLowerCase().includes(needle)
  )
}

export async function setExtensionEnabled(id, enabled) {
  await chrome.management.setEnabled(id, enabled)
}

export async function removeExtension(id) {
  await chrome.management.uninstall(id, { showConfirmDialog: true })
}

export async function permissionWarnings(id) {
  try {
    return await chrome.management.getPermissionWarningsById(id)
  } catch {
    return []
  }
}

 










/** Apply an action to many extensions, one at a time, skipping protected items. */
async function runSequentially(
  items,
  action,
  { onProgress, shouldStop } = {}
) {
  const result = { changed: 0, skipped: 0, failed: [] }
  let done = 0

  for (const ext of items) {
    if (_optionalChain([shouldStop, 'optionalCall', _3 => _3()])) break
    if (!isManageable(ext)) {
      result.skipped += 1
      done += 1
      _optionalChain([onProgress, 'optionalCall', _4 => _4(done, items.length)])
      continue
    }
    try {
      await action(ext)
      result.changed += 1
    } catch (error) {
      result.failed.push({
        name: ext.name,
        message: error instanceof Error ? error.message : 'Chrome refused the change',
      })
    }
    done += 1
    _optionalChain([onProgress, 'optionalCall', _5 => _5(done, items.length)])
  }

  return result
}

export function setManyEnabled(
  items,
  enabled,
  options
) {
  return runSequentially(items, (ext) => setExtensionEnabled(ext.id, enabled), options)
}

export function removeMany(
  items,
  options
) {
  return runSequentially(items, (ext) => removeExtension(ext.id), options)
}

 

/** Validate an import list of ids or store URLs. */
export function parseWantedList(text) {
  let raw = text
  try {
    raw = JSON.parse(text)
  } catch {
    // Plain text: one id or URL per line.
    raw = text.split(/\s+/).filter(Boolean)
  }
  const entries = Array.isArray(raw) ? raw : []
  const result = []
  const seen = new Set()

  for (const entry of entries) {
    const source = typeof entry === 'string' ? entry : _optionalChain([(entry ), 'optionalAccess', _6 => _6.id])
    if (typeof source !== 'string') continue
    const id = parseExtensionId(source)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const name =
      typeof entry === 'object' && entry !== null && typeof (entry ).name === 'string'
        ? (entry ).name
        : id
    result.push({ id, name, addedAt: Date.now() })
  }

  return result
}

export function wantedToJson(wanted) {
  return JSON.stringify(
    wanted.map((entry) => ({ id: entry.id, name: entry.name, url: storeUrl(entry.id) })),
    null,
    2
  )
}
