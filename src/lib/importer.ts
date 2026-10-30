import type { ImportNode } from './exportImport'

export type ImportProgress = (done: number, total: number) => void

function countBookmarks(node: ImportNode): number {
  let total = 0
  for (const child of node.children ?? []) {
    total += child.url ? 1 : countBookmarks(child)
  }
  return total
}

/** Create a folder that will hold imported bookmarks, under `parentId`. */
export async function createImportFolder(parentId: string, title: string): Promise<string> {
  const created = await chrome.bookmarks.create({ parentId, title })
  return created.id
}

/**
 * Recreate a parsed import tree beneath `parentId`.
 * Returns the number of bookmarks created.
 */
export async function importTree(
  parentId: string,
  node: ImportNode,
  onProgress?: ImportProgress
): Promise<number> {
  const total = countBookmarks(node)
  let done = 0
  let created = 0

  const walk = async (folderId: string, current: ImportNode): Promise<void> => {
    for (const child of current.children ?? []) {
      if (child.url) {
        await chrome.bookmarks.create({ parentId: folderId, title: child.title, url: child.url })
        created += 1
        done += 1
        onProgress?.(done, total)
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
export function downloadFile(fileName: string, contents: string, type: string): void {
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
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** "clearmark-bookmarks-2026-10-30" */
export function backupFileName(extension: 'json' | 'html', date: Date = new Date()): string {
  return `clearmark-bookmarks-${date.toISOString().slice(0, 10)}.${extension}`
}
