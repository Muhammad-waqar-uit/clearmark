import type { Storage } from './types'

/** Read the full storage object */
export async function readStorage(): Promise<Storage> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['meta', 'wantedExtensions', 'settings'], (result) => {
      resolve(result as Storage)
    })
  })
}

/** Write the full storage object */
export async function writeStorage(data: Partial<Storage>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve)
  })
}

/** Update a partial storage object */
export async function updateStorage(data: Partial<Storage>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve)
  })
}