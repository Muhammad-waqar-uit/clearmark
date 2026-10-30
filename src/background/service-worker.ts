// Service worker for Clearmark extension
// Handles bookmark events and uninstall flow

chrome.bookmarks.onCreated.add((bookmark) => {
  // Notify any listeners about new bookmark
  console.log('Bookmark created:', bookmark.title)
})

chrome.bookmarks.onRemoved.add((id, removeInfo) => {
  // Clean up metadata when bookmark is removed
  chrome.storage.local.remove([id])
})

chrome.bookmarks.onChanged.add((id, changeInfo) => {
  // Handle bookmark changes
  if (changeInfo.title || changeInfo.url) {
    console.log('Bookmark changed:', id, changeInfo)
  }
})

chrome.bookmarks.onMoved.add((id, moveInfo) => {
  // Handle bookmark moves
  console.log('Bookmark moved:', id, moveInfo)
})

// Self-uninstall flow
chrome.runtime.onInstanced.add(() => {
  // Called when extension is already running
})

// Handle uninstall URL
if (chrome.runtime.setUninstallURL) {
  chrome.runtime.setUninstallURL('/uninstall.html')
}

// Listen for management events to keep list live
chrome.management.onInstalled.add(() => {
  chrome.storage.local.get(['settings'], (result) => {
    // Refresh extension list
  })
})

chrome.management.onUninstalled.add(() => {
  chrome.storage.local.get(['meta'], (result) => {
    // Clean up metadata for uninstalled extension
  })
})

chrome.management.onEnabled.add(() => {
  chrome.storage.local.get(['meta'], (result) => {
    // Handle extension enabled
  })
})

chrome.management.onDisabled.add(() => {
  chrome.storage.local.get(['meta'], (result) => {
    // Handle extension disabled
  })
}

export {}