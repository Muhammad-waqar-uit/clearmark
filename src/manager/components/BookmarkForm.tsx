import { useState } from 'react'
import type { FlatFolder } from '../../lib/types'
import { Modal } from './ui'

export type BookmarkFormValues = {
  title: string
  url: string
  parentId: string
}

type BookmarkFormProps = {
  mode: 'create' | 'edit'
  folders: FlatFolder[]
  initial: BookmarkFormValues
  onSave: (values: BookmarkFormValues) => void
  onClose: () => void
}

/** Create or edit a bookmark. */
export function BookmarkForm({ mode, folders, initial, onSave, onClose }: BookmarkFormProps) {
  const [title, setTitle] = useState(initial.title)
  const [url, setUrl] = useState(initial.url)
  const [parentId, setParentId] = useState(initial.parentId)
  const [error, setError] = useState('')

  const submit = (): void => {
    const trimmedUrl = url.trim()
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Enter a URL starting with http:// or https://')
      return
    }
    onSave({ title: title.trim() || trimmedUrl, url: trimmedUrl, parentId })
  }

  return (
    <Modal
      title={mode === 'create' ? 'New bookmark' : 'Edit bookmark'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            {mode === 'create' ? 'Create bookmark' : 'Save changes'}
          </button>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="bookmark-title">
            Title
          </label>
          <input
            id="bookmark-title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example page"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="bookmark-url">
            URL
          </label>
          <input
            id="bookmark-url"
            className="input"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setError('')
            }}
            placeholder="https://example.com"
            inputMode="url"
          />
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
        {mode === 'create' ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="bookmark-folder">
              Folder
            </label>
            <select
              id="bookmark-folder"
              className="select w-full"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {`${'— '.repeat(folder.depth)}${folder.title}`}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
