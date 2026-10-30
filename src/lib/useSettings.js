 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, getStorage, updateSettings } from './storage'
import { applyTheme, watchSystemTheme } from './theme'


/** Load and update settings, keeping the document theme in sync. */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
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
      changes,
      areaName
    ) => {
      if (areaName !== 'local' || !_optionalChain([changes, 'access', _ => _.settings, 'optionalAccess', _2 => _2.newValue])) return
      const next = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue ) }
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

  const update = useCallback(async (patch) => {
    const next = await updateSettings(patch)
    setSettings(next)
    applyTheme(next.theme)
  }, [])

  return { settings, loading, update }
}
