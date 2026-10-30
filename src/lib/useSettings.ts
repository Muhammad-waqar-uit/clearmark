import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, getStorage, updateSettings } from './storage'
import { applyTheme, watchSystemTheme } from './theme'
import type { Settings } from './types'

/** Load and update settings, keeping the document theme in sync. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void getStorage()
      .then((storage) => {
        if (!active) return
        setSettings(storage.settings)
        applyTheme(storage.settings.theme)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ): void => {
      if (areaName !== 'local' || !changes.settings?.newValue) return
      const next = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Settings) }
      setSettings(next)
      applyTheme(next.theme)
    }
    chrome.storage.onChanged.addListener(onChanged)

    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  useEffect(() => watchSystemTheme(settings.theme), [settings.theme])

  const update = useCallback(async (patch: Partial<Settings>): Promise<void> => {
    const next = await updateSettings(patch)
    setSettings(next)
    applyTheme(next.theme)
  }, [])

  return { settings, loading, update }
}
