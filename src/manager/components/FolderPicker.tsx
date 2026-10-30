import { useState } from 'react'
import type { FlatFolder } from '../../lib/types'
import { Modal } from './ui'

type FolderPickerProps = {
  title: string
  confirmLabel: string
  folders: FlatFolder[]
  initialFolderId: string
  onConfirm: (folderId: string) => void
  onClose: () => void
}

/** Modal with an indented folder list used for moving bookmarks. */
export function FolderPicker({
  title,
  confirmLabel,
  folders,
  initialFolderId,
  onConfirm,
  onClose,
}: FolderPickerProps) {
  const [folderId, setFolderId] = useState(initialFolderId)

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(folderId)}
            disabled={!folderId}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="folder-picker">
        Destination folder
      </label>
      <select
        id="folder-picker"
        className="select w-full"
        value={folderId}
        onChange={(event) => setFolderId(event.target.value)}
      >
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {`${'— '.repeat(folder.depth)}${folder.title}`}
          </option>
        ))}
      </select>
    </Modal>
  )
}
