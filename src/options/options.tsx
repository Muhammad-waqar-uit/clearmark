import { useEffect, useState } from 'react'
import { useSettings } from '../lib/useSettings'
import type { SortKey, Theme } from '../lib/types'

const THEMES: Array<{ value: Theme; label: string; hint: string }> = [
  { value: 'light', label: 'Light', hint: 'Always use the light interface' },
  { value: 'dark', label: 'Dark', hint: 'Always use the dark interface' },
  { value: 'system', label: 'System', hint: 'Follow the operating system setting' },
]

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: 'title', label: 'Title A–Z' },
  { value: 'dateAdded', label: 'Newest first' },
  { value: 'url', label: 'URL A–Z' },
]

/** Settings: appearance, default sorting, uninstall feedback page and removal. */
export function OptionsPage() {
  const { settings, loading, update } = useSettings()
  const [uninstallUrl, setUninstallUrl] = useState('')
  const [saved, setSaved] = useState('')
  const version = chrome.runtime.getManifest().version

  useEffect(() => {
    if (!loading) setUninstallUrl(settings.uninstallUrl)
  }, [loading, settings.uninstallUrl])

  const saveUninstallUrl = (): void => {
    const value = uninstallUrl.trim()
    if (value && !/^https?:\/\//i.test(value)) {
      setSaved('Enter a URL starting with http:// or https://')
      return
    }
    void (async () => {
      await update({ uninstallUrl: value })
      await chrome.runtime.sendMessage({ type: 'clearmark:settings-updated' })
      setSaved(value ? 'Uninstall page saved.' : 'Uninstall page cleared.')
    })()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Clearmark settings</h1>
        <span className="text-xs text-slate-500 dark:text-slate-400">v{version}</span>
        <button
          type="button"
          className="btn ml-auto"
          onClick={() => void chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') })}
        >
          Open manager
        </button>
      </header>

      <section className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Appearance</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          The theme applies to the manager, popup and this page.
        </p>
        <div className="space-y-2">
          {THEMES.map((theme) => (
            <label
              key={theme.value}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
            >
              <input
                type="radio"
                name="theme"
                value={theme.value}
                className="mt-1 h-4 w-4 accent-brand-600"
                checked={settings.theme === theme.value}
                onChange={() => void update({ theme: theme.value })}
              />
              <span>
                <span className="block font-medium">{theme.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{theme.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Default sorting</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          How the bookmark list is ordered when it opens.
        </p>
        <label className="sr-only" htmlFor="default-sort">
          Default sort order
        </label>
        <select
          id="default-sort"
          className="select w-full max-w-xs"
          value={settings.defaultSort}
          onChange={(event) => void update({ defaultSort: event.target.value as SortKey })}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </section>

      <section className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Uninstall feedback page</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Opened if you remove Clearmark. Leave empty for none. Bookmarks and tags are never deleted
          when the extension is removed.
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="uninstall-url">
            Uninstall page URL
          </label>
          <input
            id="uninstall-url"
            className="input flex-1"
            placeholder="https://example.com/clearmark-feedback"
            value={uninstallUrl}
            onChange={(event) => {
              setUninstallUrl(event.target.value)
              setSaved('')
            }}
          />
          <button type="button" className="btn btn-primary" onClick={saveUninstallUrl}>
            Save
          </button>
        </div>
        {saved ? <p className="mt-2 text-xs text-emerald-600">{saved}</p> : null}
      </section>

      <section className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Extension access</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          The extension hub can list, enable, disable and remove other extensions. Show the
          explanation banner again the next time you open that tab.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => void update({ managementExplained: false })}
          disabled={!settings.managementExplained}
        >
          Show explanation again
        </button>
      </section>

      <section className="card border-red-200 p-4 dark:border-red-900">
        <h2 className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">Remove Clearmark</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Chrome will ask you to confirm. Your bookmarks stay in the browser.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            void chrome.management.uninstallSelf({ showConfirmDialog: true }).catch(() => undefined)
          }}
        >
          Remove extension
        </button>
      </section>
    </div>
  )
}
