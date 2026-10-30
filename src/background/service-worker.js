import { DEFAULT_SETTINGS, getStorage, removeBookmarkMeta } from '../lib/storage'

/** Notify open extension pages that bookmark or extension data changed. */
function notifyPages(source) {
  chrome.runtime.sendMessage({ type: 'clearmark:data-changed', source }).catch(() => undefined)
}

/** `setUninstallURL` is callback-only, so wrap it in a promise. */
function setUninstallUrl(url) {
  return new Promise((resolve) => {
    chrome.runtime.setUninstallURL(url, () => resolve())
  })
}

async function syncUninstallUrl() {
  try {
    const { settings } = await getStorage()
    const url = settings.uninstallUrl.trim()
    if (!url || !/^https?:\/\//.test(url)) {
      await setUninstallUrl('')
      return
    }
    await setUninstallUrl(url)
  } catch {
    // An invalid or unreachable URL must never break the service worker.
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void chrome.storage.local.set({
      settings: DEFAULT_SETTINGS,
      meta: {},
      wantedExtensions: [],
    })
  }
  void syncUninstallUrl()
})

chrome.runtime.onStartup.addListener(() => {
  void syncUninstallUrl()
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    (message ).type === 'clearmark:settings-updated'
  ) {
    void syncUninstallUrl().then(() => sendResponse({ ok: true }))
    return true
  }
  return false
})

// Remove tags/notes stored for a bookmark when the bookmark is deleted.
chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  if (removeInfo.node.url) {
    void removeBookmarkMeta(id)
  }
  notifyPages('bookmarks')
})

chrome.bookmarks.onCreated.addListener(() => notifyPages('bookmarks'))
chrome.bookmarks.onChanged.addListener(() => notifyPages('bookmarks'))
chrome.bookmarks.onMoved.addListener(() => notifyPages('bookmarks'))
chrome.bookmarks.onChildrenReordered.addListener(() => notifyPages('bookmarks'))
chrome.bookmarks.onImportEnded.addListener(() => notifyPages('bookmarks'))

chrome.management.onInstalled.addListener(() => notifyPages('extensions'))
chrome.management.onUninstalled.addListener(() => notifyPages('extensions'))
chrome.management.onEnabled.addListener(() => notifyPages('extensions'))
chrome.management.onDisabled.addListener(() => notifyPages('extensions'))
