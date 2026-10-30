/** Hook that provides storage from chrome.storage.local */
import { useEffect, useState } from 'react'
import { readStorage, writeStorage, updateStorage } from './storage'

/** Returns the storage object and an update function */
export function useStorage() {
  const [storage, setStorage] = useState<Storage>({
    meta: {},
    wantedExtensions: [],
    settings: {
      theme: 'system',
      defaultSort: 'title',
      uninstallUrl: ''
    }
  })

  useEffect(() => {
    readStorage().then((result) => {
      setStorage(result)
    })
  }, [])

  const update = async (data: Partial<Storage>) => {
    await updateStorage(data)
    readStorage().then((result) => {
      setStorage(result)
    })
  }

  return { storage, update }
}