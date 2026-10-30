/** Options page - theme, default sort, uninstall URL */
import React, { useState, useEffect } from 'react'
import { readStorage, updateStorage } from '../lib/storage'
import { BookmarkMeta, Storage } from '../lib/types'

export function OptionsPage() {
  const [settings, setSettings] = useState<Storage['settings']>({
    theme: 'system',
    defaultSort: 'title',
    uninstallUrl: ''
  })

  const [themeOptions, setThemeOptions] = useState<'light' | 'dark' | 'system'](settings.theme)

  useEffect(() => {
    readStorage().then((storage) => {
      setSettings(storage.settings || {
        theme: 'system',
        defaultSort: 'title',
        uninstallUrl: ''
      })
      setThemeOptions(settings.theme || 'system')
    })
  }, [])

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as 'light' | 'dark' | 'system'
    setThemeOptions(newTheme)
    updateStorage({ settings: { ...settings, theme: newTheme } })
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as 'title' | 'dateAdded' | 'url'
    updateStorage({ settings: { ...settings, defaultSort: newSort } })
  }

  const handleUninstallUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStorage({ settings: { ...settings, uninstallUrl: e.target.value } })
  }

  const handleRemoveExtension = async () => {
    try {
      await chrome.management.uninstallSelf({ showConfirmDialog: true })
    } catch {
      // User cancelled
      console.log('Uninstall cancelled')
    }
  }

  const handleSetUninstallURL = () => {
    if (settings.uninstallUrl) {
      chrome.runtime.setUninstallURL(settings.uninstallUrl)
      alert('Uninstall URL set')
    } else {
      alert('Please enter an uninstall URL first')
    }
  }

  return (
    <div className="options-page">
      <h2>Settings</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }} htmlFor="theme">
          Theme:
        </label>
        <select
          id="theme"
          value={themeOptions}
          onChange={handleThemeChange}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }} htmlFor="defaultSort">
          Default Sort:
        </label>
        <select
          id="defaultSort"
          value={settings.defaultSort}
          onChange={handleSortChange}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="title">Title</option>
          <option value="dateAdded">Date Added</option>
          <option value="url">URL</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }} htmlFor="uninstallUrl">
          Uninstall URL:
        </label>
        <input
          id="uninstallUrl"
          value={settings.uninstallUrl || ''}
          onChange={handleUninstallUrlChange}
          placeholder="https://example.com/uninstall"
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
          Configurable feedback page after removal
        </small>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '4px' }}>
        <button onClick={handleRemoveExtension} style={{ marginRight: '0.5rem' }} className="btn-danger">
          Remove Extension
        </button>
        <button onClick={handleSetUninstallURL} className="btn">
          Set Uninstall URL
        </button>
      </div>
    </div>
  )
}