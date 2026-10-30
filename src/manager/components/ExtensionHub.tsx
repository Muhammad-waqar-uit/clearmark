import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addWantedExtension,
  getWantedExtensions,
  removeWantedExtension,
  replaceWantedExtensions,
} from '../../lib/storage'
import {
  iconUrl,
  isManageable,
  isPolicyManaged,
  listInstalled,
  matchesFilter,
  parseExtensionId,
  parseWantedList,
  permissionWarnings,
  removeMany,
  removeExtension,
  setExtensionEnabled,
  setManyEnabled,
  storeUrl,
  wantedToJson,
  type ExtensionFilter,
} from '../../lib/extensions'
import { downloadFile } from '../../lib/importer'
import type { WantedExtension } from '../../lib/types'
import { EmptyState, LetterAvatar, Modal } from './ui'
import { Notice, ProgressBar } from './Feedback'

type ExtensionHubProps = {
  explained: boolean
  onAcknowledge: () => void
}

/** Lists installed extensions and mirrors a saved "install list". */
export function ExtensionHub({ explained, onAcknowledge }: ExtensionHubProps) {
  const [installed, setInstalled] = useState<chrome.management.ExtensionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ExtensionFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState('')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'error'; text: string } | null>(
    null
  )
  const [detail, setDetail] = useState<chrome.management.ExtensionInfo | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [wanted, setWanted] = useState<WantedExtension[]>([])
  const [wantedInput, setWantedInput] = useState('')
  const [wantedError, setWantedError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async (): Promise<void> => {
    const [items, savedWanted] = await Promise.all([listInstalled(), getWantedExtensions()])
    setInstalled(items)
    setWanted(savedWanted)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    const reload = (): void => {
      void load()
    }
    chrome.management.onInstalled.addListener(reload)
    chrome.management.onUninstalled.addListener(reload)
    chrome.management.onEnabled.addListener(reload)
    chrome.management.onDisabled.addListener(reload)
    return () => {
      chrome.management.onInstalled.removeListener(reload)
      chrome.management.onUninstalled.removeListener(reload)
      chrome.management.onEnabled.removeListener(reload)
      chrome.management.onDisabled.removeListener(reload)
    }
  }, [load])

  useEffect(() => {
    if (!detail) return
    let active = true
    setWarnings([])
    void permissionWarnings(detail.id).then((result) => {
      if (active) setWarnings(result)
    })
    return () => {
      active = false
    }
  }, [detail])

  const visible = useMemo(
    () => installed.filter((ext) => matchesFilter(ext, filter, query)),
    [installed, filter, query]
  )

  const manageableVisible = visible.filter(isManageable)
  const allVisibleSelected =
    manageableVisible.length > 0 && manageableVisible.every((ext) => selected.has(ext.id))

  const toggleSelected = (id: string): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = (checked: boolean): void => {
    setSelected((current) => {
      const next = new Set(current)
      for (const ext of manageableVisible) {
        if (checked) next.add(ext.id)
        else next.delete(ext.id)
      }
      return next
    })
  }

  const runBulk = (kind: 'enable' | 'disable' | 'remove'): void => {
    void (async () => {
      const items = installed.filter((ext) => selected.has(ext.id))
      if (items.length === 0) return
      if (kind === 'remove' && !window.confirm(`Remove ${items.length} extension(s)? Chrome will ask for each one.`)) {
        return
      }

      setMessage(null)
      setBusy(kind === 'remove' ? 'Removing…' : kind === 'enable' ? 'Enabling…' : 'Disabling…')
      setProgress({ done: 0, total: items.length })

      const options = {
        onProgress: (done: number, total: number) => setProgress({ done, total }),
      }
      const result =
        kind === 'remove'
          ? await removeMany(items, options)
          : await setManyEnabled(items, kind === 'enable', options)

      setSelected(new Set())
      setBusy('')
      await load()

      const parts = [`${result.changed} changed`]
      if (result.skipped > 0) parts.push(`${result.skipped} protected`)
      if (result.failed.length > 0) parts.push(`${result.failed.length} failed`)
      setMessage({
        tone: result.failed.length > 0 ? 'error' : 'success',
        text: parts.join(' · '),
      })
    })()
  }

  const toggleOne = (ext: chrome.management.ExtensionInfo): void => {
    void (async () => {
      try {
        await setExtensionEnabled(ext.id, !ext.enabled)
        await load()
      } catch {
        setMessage({ tone: 'error', text: `Chrome refused to change ${ext.name}.` })
      }
    })()
  }

  const removeOne = (ext: chrome.management.ExtensionInfo): void => {
    void (async () => {
      try {
        await removeExtension(ext.id)
        await load()
      } catch {
        setMessage({ tone: 'info', text: `Removal of ${ext.name} was cancelled.` })
      }
    })()
  }

  const addWanted = (): void => {
    const id = parseExtensionId(wantedInput)
    if (!id) {
      setWantedError('Paste a Chrome Web Store link or a 32-character extension id.')
      return
    }
    setWantedError('')
    void (async () => {
      await addWantedExtension({ id, name: id })
      setWantedInput('')
      setWanted(await getWantedExtensions())
    })()
  }

  const importWanted = (file: File): void => {
    void (async () => {
      try {
        const parsed = parseWantedList(await file.text())
        if (parsed.length === 0) {
          setWantedError('No extension ids found in that file.')
          return
        }
        const merged = [...wanted]
        for (const entry of parsed) {
          if (!merged.some((item) => item.id === entry.id)) merged.push(entry)
        }
        await replaceWantedExtensions(merged)
        setWanted(merged)
        setWantedError('')
        setMessage({ tone: 'success', text: `Added ${parsed.length} extension(s) to the list.` })
      } catch {
        setWantedError('That file could not be read.')
      }
    })()
  }

  const openWanted = (): void => {
    void (async () => {
      for (const entry of wanted.slice(0, 10)) {
        await chrome.tabs.create({ url: storeUrl(entry.id) })
      }
    })()
  }

  const enabledCount = installed.filter((ext) => ext.enabled && ext.type === 'extension').length
  const disabledCount = installed.filter((ext) => !ext.enabled && ext.type === 'extension').length

  return (
    <div className="space-y-3">
      {!explained ? (
        <div className="card border-brand-200 p-3 dark:border-brand-700">
          <h2 className="mb-1 text-sm font-semibold">Why Clearmark asks for extension access</h2>
          <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">
            The <code>management</code> permission lets this page list installed extensions, turn
            them on or off and remove them. Clearmark never reads extension data or browsing
            content, and it never includes itself in bulk actions.
          </p>
          <button type="button" className="btn btn-primary" onClick={onAcknowledge}>
            Got it
          </button>
        </div>
      ) : null}

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="extension-search" className="sr-only">
            Search extensions
          </label>
          <input
            id="extension-search"
            type="search"
            className="input max-w-xs"
            placeholder="Search extensions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label htmlFor="extension-filter" className="sr-only">
            Filter extensions
          </label>
          <select
            id="extension-filter"
            className="select"
            value={filter}
            onChange={(event) => setFilter(event.target.value as ExtensionFilter)}
          >
            <option value="all">All ({enabledCount + disabledCount})</option>
            <option value="enabled">Enabled ({enabledCount})</option>
            <option value="disabled">Disabled ({disabledCount})</option>
          </select>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => runBulk('enable')}
              disabled={selected.size === 0 || busy !== ''}
            >
              Enable
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => runBulk('disable')}
              disabled={selected.size === 0 || busy !== ''}
            >
              Disable
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => runBulk('remove')}
              disabled={selected.size === 0 || busy !== ''}
            >
              Remove
            </button>
          </div>
        </div>

        {busy !== '' ? (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {busy} {progress.done} of {progress.total}
            </p>
            <ProgressBar done={progress.done} total={progress.total} />
          </div>
        ) : null}

        {message ? (
          <div className="mt-3">
            <Notice tone={message.tone}>{message.text}</Notice>
          </div>
        ) : null}
      </div>

      <div className="card p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-600"
            checked={allVisibleSelected}
            onChange={(event) => selectAllVisible(event.target.checked)}
            aria-label="Select all shown extensions"
            disabled={manageableVisible.length === 0}
          />
          <span>Select all shown</span>
        </div>

        {loading ? (
          <EmptyState title="Loading installed extensions…" />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No extensions match"
            hint="Try another search term or switch the filter."
          />
        ) : (
          <ul className="space-y-1" aria-label="Installed extensions">
            {visible.map((ext) => {
              const manageable = isManageable(ext)
              const icon = iconUrl(ext)
              return (
                <li
                  key={ext.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={selected.has(ext.id)}
                    onChange={() => toggleSelected(ext.id)}
                    disabled={!manageable}
                    aria-label={`Select ${ext.name}`}
                  />
                  {icon ? (
                    <img src={icon} alt="" className="h-7 w-7 shrink-0 rounded" />
                  ) : (
                    <LetterAvatar label={ext.name} seed={ext.id} />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="truncate text-left text-sm font-medium text-slate-800 hover:text-brand-600 hover:underline dark:text-slate-100"
                        onClick={() => setDetail(ext)}
                      >
                        {ext.name}
                      </button>
                      <span
                        className={`badge ${
                          ext.enabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {ext.enabled ? 'on' : 'off'}
                      </span>
                      {isPolicyManaged(ext) ? (
                        <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          managed
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {ext.version}
                      {ext.description ? ` · ${ext.description}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="btn px-2 py-1 text-xs"
                      onClick={() => toggleOne(ext)}
                      disabled={!manageable}
                    >
                      {ext.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost px-2 py-1 text-xs text-red-600 dark:text-red-400"
                      onClick={() => removeOne(ext)}
                      disabled={!manageable}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <section className="card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Install list</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extensions you want to install later, saved in this browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              onClick={openWanted}
              disabled={wanted.length === 0}
            >
              Open in store
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                downloadFile('clearmark-extension-list.json', wantedToJson(wanted), 'application/json')
              }
              disabled={wanted.length === 0}
            >
              Export list
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              Import list
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,.txt,application/json,text/plain"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) importWanted(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label htmlFor="wanted-input" className="sr-only">
            Chrome Web Store link or extension id
          </label>
          <input
            id="wanted-input"
            className="input flex-1"
            placeholder="Chrome Web Store link or 32-character id"
            value={wantedInput}
            onChange={(event) => {
              setWantedInput(event.target.value)
              setWantedError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addWanted()
            }}
          />
          <button type="button" className="btn btn-primary" onClick={addWanted}>
            Add
          </button>
        </div>
        {wantedError ? <p className="mt-1 text-xs text-red-600">{wantedError}</p> : null}

        {wanted.length === 0 ? (
          <EmptyState title="Install list is empty" hint="Paste a store link above to save it here." />
        ) : (
          <ul className="mt-2 space-y-1">
            {wanted.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-700"
              >
                <span className="min-w-0 flex-1 truncate" title={entry.id}>
                  {entry.name === entry.id ? entry.id : entry.name}
                </span>
                <a
                  className="btn btn-ghost px-2 py-1 text-xs"
                  href={storeUrl(entry.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Store
                </a>
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-xs"
                  onClick={() => {
                    void (async () => {
                      await removeWantedExtension(entry.id)
                      setWanted(await getWantedExtensions())
                    })()
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail ? (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">Version</dt>
              <dd>{detail.version}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">State</dt>
              <dd>{detail.enabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Installed by</dt>
              <dd>{detail.installType}</dd>
            </div>
            {detail.description ? (
              <div>
                <dt className="text-xs font-medium text-slate-500">Description</dt>
                <dd className="text-slate-600 dark:text-slate-300">{detail.description}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium text-slate-500">Permissions</dt>
              <dd>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {(detail.permissions.length > 0 ? detail.permissions : ['none']).map((permission) => (
                    <li key={permission} className="chip">
                      {permission}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            {detail.hostPermissions.length > 0 ? (
              <div>
                <dt className="text-xs font-medium text-slate-500">Site access</dt>
                <dd>
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {detail.hostPermissions.map((permission) => (
                      <li key={permission} className="chip">
                        {permission}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium text-slate-500">Warnings</dt>
              <dd>
                {warnings.length === 0 ? (
                  <span className="text-xs text-slate-500">No warnings reported.</span>
                ) : (
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-700 dark:text-amber-300">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-end gap-2">
            <a
              className="btn"
              href={storeUrl(detail.id)}
              target="_blank"
              rel="noreferrer"
            >
              Store page
            </a>
            <button type="button" className="btn" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
