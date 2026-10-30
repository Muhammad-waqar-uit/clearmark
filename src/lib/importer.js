 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

 

function countBookmarks(node) {
  let total = 0
  for (const child of _nullishCoalesce(node.children, () => ( []))) {
    total += child.url ? 1 : countBookmarks(child)
  }
  return total
}

/** Create a folder that will hold imported bookmarks, under `parentId`. */
export async function createImportFolder(parentId, title) {
  const created = await chrome.bookmarks.create({ parentId, title })
  return created.id
}

/**
 * Recreate a parsed import tree beneath `parentId`.
 * Returns the number of bookmarks created.
 */
export async function importTree(
  parentId,
  node,
  onProgress
) {
  const total = countBookmarks(node)
  let done = 0
  let created = 0

  const walk = async (folderId, current) => {
    for (const child of _nullishCoalesce(current.children, () => ( []))) {
      if (child.url) {
        await chrome.bookmarks.create({ parentId: folderId, title: child.title, url: child.url })
        created += 1
        done += 1
        _optionalChain([onProgress, 'optionalCall', _ => _(done, total)])
        continue
      }
      const folder = await chrome.bookmarks.create({ parentId: folderId, title: child.title })
      await walk(folder.id, child)
    }
  }

  await walk(parentId, node)
  return created
}

/** Trigger a file download from an in-memory string. */
export function downloadFile(fileName, contents, type) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give Chrome a moment to start the download before revoking the URL.
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/** "clearmark-bookmarks-2026-10-30" */
export function backupFileName(extension, date = new Date()) {
  return `clearmark-bookmarks-${date.toISOString().slice(0, 10)}.${extension}`
}
