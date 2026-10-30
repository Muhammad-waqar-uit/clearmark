import type { WantedExtension } from './types'

export const WEBSTORE_PREFIX = 'https://chromewebstore.google.com/detail/'

/** Id of Clearmark itself; never offered for bulk actions. */
export function selfId(): string {
  return chrome.runtime.id
}

/** Every installed item, sorted by name (extensions, apps and themes included). */
export async function listInstalled(): Promise<chrome.management.ExtensionInfo[]> {
  const all = await chrome.management.getAll()
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export function isInstalledExtension(ext: chrome.management.ExtensionInfo): boolean {
  return ext.type === 'extension'
}

/** True when Chrome lets the user disable or remove this item. */
export function isManageable(ext: chrome.management.ExtensionInfo): boolean {
  return ext.mayDisable !== false && ext.id !== selfId()
}

/** True when an administrator installed the item. */
export function isPolicyManaged(ext: chrome.management.ExtensionInfo): boolean {
  return ext.installType === 'admin' || ext.mayDisable === false
}

export function storeUrl(id: string): string {
  return `${WEBSTORE_PREFIX}${id}`
}

/** Best available icon URL for an installed item. */
export function iconUrl(ext: chrome.management.ExtensionInfo): string | undefined {
  const icons = [...(ext.icons ?? [])].sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
  return icons[0]?.url
}

/** Accept a bare id, a Chrome Web Store URL or a crx:// URL. */
export function parseExtensionId(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  const fromUrl = /\/detail\/(?:[^/]+\/)?([a-p]{32})/i.exec(value)
  if (fromUrl) return fromUrl[1].toLowerCase()
  const bare = /^[a-p]{32}$/i.exec(value)
  if (bare) return value.toLowerCase()
  return null
}

export type ExtensionFilter = 'all' | 'enabled' | 'disabled'

export function matchesFilter(
  ext: chrome.management.ExtensionInfo,
  filter: ExtensionFilter,
  query: string
): boolean {
  if (!isInstalledExtension(ext)) return false
  if (filter === 'enabled' && !ext.enabled) return false
  if (filter === 'disabled' && ext.enabled) return false
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    ext.name.toLowerCase().includes(needle) ||
    (ext.description ?? '').toLowerCase().includes(needle) ||
    ext.id.toLowerCase().includes(needle)
  )
}

export async function setExtensionEnabled(id: string, enabled: boolean): Promise<void> {
  await chrome.management.setEnabled(id, enabled)
}

export async function removeExtension(id: string): Promise<void> {
  await chrome.management.uninstall(id, { showConfirmDialog: true })
}

export async function permissionWarnings(id: string): Promise<string[]> {
  try {
    return await chrome.management.getPermissionWarningsById(id)
  } catch {
    return []
  }
}

export type BulkResult = {
  changed: number
  skipped: number
  failed: Array<{ name: string; message: string }>
}

type BulkOptions = {
  onProgress?: (done: number, total: number) => void
  shouldStop?: () => boolean
}

/** Apply an action to many extensions, one at a time, skipping protected items. */
async function runSequentially(
  items: chrome.management.ExtensionInfo[],
  action: (ext: chrome.management.ExtensionInfo) => Promise<void>,
  { onProgress, shouldStop }: BulkOptions = {}
): Promise<BulkResult> {
  const result: BulkResult = { changed: 0, skipped: 0, failed: [] }
  let done = 0

  for (const ext of items) {
    if (shouldStop?.()) break
    if (!isManageable(ext)) {
      result.skipped += 1
      done += 1
      onProgress?.(done, items.length)
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
    onProgress?.(done, items.length)
  }

  return result
}

export function setManyEnabled(
  items: chrome.management.ExtensionInfo[],
  enabled: boolean,
  options?: BulkOptions
): Promise<BulkResult> {
  return runSequentially(items, (ext) => setExtensionEnabled(ext.id, enabled), options)
}

export function removeMany(
  items: chrome.management.ExtensionInfo[],
  options?: BulkOptions
): Promise<BulkResult> {
  return runSequentially(items, (ext) => removeExtension(ext.id), options)
}

export type WantedList = WantedExtension[]

/** Validate an import list of ids or store URLs. */
export function parseWantedList(text: string): WantedList {
  let raw: unknown = text
  try {
    raw = JSON.parse(text)
  } catch {
    // Plain text: one id or URL per line.
    raw = text.split(/\s+/).filter(Boolean)
  }
  const entries = Array.isArray(raw) ? raw : []
  const result: WantedList = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const source = typeof entry === 'string' ? entry : (entry as { id?: unknown })?.id
    if (typeof source !== 'string') continue
    const id = parseExtensionId(source)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const name =
      typeof entry === 'object' && entry !== null && typeof (entry as WantedExtension).name === 'string'
        ? (entry as WantedExtension).name
        : id
    result.push({ id, name, addedAt: Date.now() })
  }

  return result
}

export function wantedToJson(wanted: WantedList): string {
  return JSON.stringify(
    wanted.map((entry) => ({ id: entry.id, name: entry.name, url: storeUrl(entry.id) })),
    null,
    2
  )
}
