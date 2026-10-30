import { useRef, useState } from 'react'
import {
  exportToHtml,
  exportToJson,
  importedFolderName,
  parseBackup,
  summarizeImport,
  type ImportNode,
  type ImportSummary,
} from '../../lib/exportImport'
import { backupFileName, createImportFolder, downloadFile, importTree } from '../../lib/importer'
import { getDefaultParentId } from '../../lib/bookmarks'
import type { BookmarkMeta, FlatBookmark, FlatFolder } from '../../lib/types'
import { Notice, ProgressBar } from './Feedback'

type TransferPanelProps = {
  folders: FlatFolder[]
  bookmarks: FlatBookmark[]
  meta: Record<string, BookmarkMeta>
  defaultFolderId: string
}

type PendingImport = {
  node: ImportNode
  summary: ImportSummary
  fileName: string
}

/** JSON/HTML export and previewed import of bookmark backups. */
export function TransferPanel({
  folders,
  bookmarks,
  meta,
  defaultFolderId,
}: TransferPanelProps) {
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [destination, setDestination] = useState('new')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const fileInput = useRef<HTMLInputElement>(null)

  const readFile = (file: File): void => {
    void (async () => {
      setError('')
      setMessage('')
      try {
        const node = parseBackup(await file.text(), file.name)
        setPending({ node, summary: summarizeImport(node), fileName: file.name })
        setDestination('new')
      } catch (parseError) {
        setPending(null)
        setError(parseError instanceof Error ? parseError.message : 'That file could not be read.')
      }
    })()
  }

  const runImport = (): void => {
    void (async () => {
      if (!pending) return
      setBusy(true)
      setError('')
      setMessage('')
      setProgress({ done: 0, total: pending.summary.bookmarks })

      try {
        const parentId =
          destination === 'new'
            ? await createImportFolder(
                defaultFolderId || (await getDefaultParentId()),
                importedFolderName()
              )
            : destination

        const created = await importTree(parentId, pending.node, (done, total) =>
          setProgress({ done, total })
        )
        setPending(null)
        setMessage(`Imported ${created} bookmark${created === 1 ? '' : 's'}.`)
      } catch {
        setError('The import stopped part way through. Bookmarks already created were kept.')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <div className="space-y-3">
      <section className="card p-3">
        <h2 className="mb-1 text-sm font-semibold">Export</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          JSON keeps folder structure, tags and notes. HTML is the standard Netscape format that
          Chrome, Firefox and Edge can import.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              downloadFile(
                backupFileName('json'),
                exportToJson(bookmarks, meta),
                'application/json'
              )
            }
            disabled={bookmarks.length === 0}
          >
            Export JSON ({bookmarks.length})
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              downloadFile(
                backupFileName('html'),
                exportToHtml(folders, bookmarks, meta),
                'text/html'
              )
            }
            disabled={bookmarks.length === 0}
          >
            Export HTML
          </button>
        </div>
      </section>

      <section className="card p-3">
        <h2 className="mb-1 text-sm font-semibold">Import</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Choose a Clearmark JSON backup or a Netscape HTML file. Nothing is created until you
          confirm the preview.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Choose file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.html,.htm,application/json,text/html"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) readFile(file)
              event.target.value = ''
            }}
          />
          {pending ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">{pending.fileName}</span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-3">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}
        {message ? (
          <div className="mt-3">
            <Notice tone="success">{message}</Notice>
          </div>
        ) : null}

        {pending ? (
          <div className="mt-3 space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm">
              Found <strong>{pending.summary.bookmarks}</strong> bookmark
              {pending.summary.bookmarks === 1 ? '' : 's'} in{' '}
              <strong>{pending.summary.folders}</strong> folder
              {pending.summary.folders === 1 ? '' : 's'}.
            </p>

            <div>
              <label
                className="mb-1 block text-xs font-medium text-slate-500"
                htmlFor="import-destination"
              >
                Import into
              </label>
              <select
                id="import-destination"
                className="select w-full"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                <option value="new">A new “{importedFolderName()}” folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {`${'— '.repeat(folder.depth)}${folder.path}`}
                  </option>
                ))}
              </select>
            </div>

            {busy ? (
              <div className="space-y-1">
                <ProgressBar done={progress.done} total={progress.total} />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {progress.done} of {progress.total} created
                </p>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setPending(null)} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runImport}
                disabled={busy || pending.summary.bookmarks === 0}
              >
                Import {pending.summary.bookmarks} bookmarks
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
