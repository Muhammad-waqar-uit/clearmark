/** Main manager component - folder tree, bookmark list, search, sort */
import React, { useEffect, useState } from 'react'
import { useBookmarks } from '../lib/bookmarks'
import { useStorage } from '../lib/storage'
import { findDuplicates, normalizeUrl } from '../lib/duplicates'
import { exportBookmarks, importFromNetscape } from '../lib/exportImport'
import { BookmarkMeta, Storage } from '../lib/types'
import { useFocusEffect } from '@react-native/hooks'

const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ folder: '', domain: '', dateRange: '' })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search bookmarks..."
        value={query}
        onChange={handleSearchChange}
        className="search-input"
      />
      <div className="filter-controls">
        <select className="filter-select">
          <option value="">Folder</option>
          {/* folder options populated dynamically */}
        </select>
        <select className="filter-select">
          <option value="">Domain</option>
          {/* domain options */}
        </select>
      </div>
    </div>
  )
}

const FolderTree = ({ onFolderSelect }: { onFolderSelect: (folderId: string) => void }) => {
  const [folders, setFolders] = useState<string[]>([])
  const { bookmarks, loadBookmarks } = useBookmarks()

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const renderFolders = () => {
    const folderSet = new Set<string>()
    const recurse = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.title && node.url === undefined) {
          // This is a folder
          folderSet.add(node.id)
          if (node.children) {
            recurse(node.children)
          }
        }
      }
    }
    if (bookmarks) recurse(bookmarks)
    setFolders(Array.from(folderSet))
  }

  return (
    <div className="folder-tree">
      <ul>
        {folders.map((folderId) => (
          <li key={folderId} onClick={() => onFolderSelect(folderId)}>
            <span className="folder-icon">📁</span>{folderId}
          </li>
        ))}
      </ul>
    </div>
  )
}

const BookmarkList = ({ bookmarks, onBookmarkAction }: { bookmarks: any[]; onBookmarkAction: any }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBookmarks = bookmarks.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bookmark-list">
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <ul>
        {filteredBookmarks.map((b) => (
          <li key={b.id} className="bookmark-item">
            <img src={b.favicon || '/favicon.ico'} className="favicon" />
            <span className="bookmark-title">{b.title}</span>
            <a href={b.url} className="bookmark-url" target="_blank" rel="noopener noreferrer">
              {b.url}
            </a>
            <div className="bookmark-actions">
              <button onClick={() => onBookmarkAction(b.id, 'edit')}>Edit</button>
              <button onClick={() => onBookmarkAction(b.id, 'delete')}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const BulkActionBar = ({ selectedCount, onBulkAction }: { selectedCount: number; onBulkAction: any }) => {
  return (
    <div className="bulk-action-bar">
      <span>{selectedCount} selected</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => onBulkAction('move')}>Move</button>
        <button onClick={() => onBulkAction('delete')}>Delete</button>
      </div>
    </div>
  )
}

const DeadLinksPanel = () => {
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Array<{ url: string; status: string }>>([])

  const runDeadLinkCheck = async () => {
    const bookmarks = await useBookmarks().then((b) => b.filter((b) => b.url))
    const urls = bookmarks.map((b) => b.url!)
    const results = await useLinkcheck().checkUrlsConcurrently(urls, 5, 8000)
    setResults(results)
    // Update progress
    setProgress(100)
  }

  return (
    <div className="dead-links-panel">
      <button onClick={runDeadLinkCheck} className="btn">
        Check for dead links
      </button>
      {progress > 0 && <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>}
      <ul>
        {results.map((r) => (
          <li key={r.url} className={r.status === 'ok' ? 'ok' : 'broken'}>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              {r.url}
            </a>
            <span>{r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ImportExportPanel = () => {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportJson, setExportJson] = useState<string>('')

  const handleExport = async () => {
    const bookmarks = await useBookmarks()
    const json = exportBookmarks(bookmarks)
    setExportJson(json)
  }

  const handleImport = async () => {
    if (!importFile) return
    const text = await importFile.text()
    const bookmarks = importFromNetscape(text)
    // Add bookmarks to the tree
    bookmarks.forEach((b) => chrome.bookmarks.create(b))
    setImportFile(null)
  }

  return (
    <div className="import-export-panel">
      <button onClick={() => setImportFile(new File([''], 'bookmarks.html'))} className="btn">
        Import from HTML
      </button>
      <button onClick={handleExport} className="btn">
        Export as JSON
      </button>
      {exportJson && (
        <pre style={{ whiteSpace: 'pre-wrap', padding: '1rem', background: '#f1f5f9', borderRadius: '4px' }}>
          {exportJson}
        </pre>
      )}
    </div>
  )
}

export function ManagerPage() {
  const { bookmarks, loadBookmarks } = useBookmarks()
  const { readStorage, updateStorage } = useStorage()
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [view, setView] = useState<'bookmarks' | 'duplicates' | 'deadlinks' | 'importexport'>('bookmarks')

  useFocusEffect(() => {
    loadBookmarks()
  })

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId)
  }

  const handleBookmarkAction = async (id: string, action: string) => {
    if (action === 'delete') {
      chrome.bookmarks.remove(id, () => {
        // Show undo toast
        console.log('Bookmark deleted, offering undo')
      })
    }
    if (action === 'edit') {
      // Open edit dialog
    }
  }

  const handleDuplicateCheck = async () => {
    const allBookmarks = await useBookmarks().then((b) => b)
    const duplicates = findDuplicates(allBookmarks)
    if (duplicates.length === 0) {
      alert('No duplicates found!')
    } else {
      alert(`${duplicates.length} duplicate sets found`)
      // Let user pick which to keep
    }
  }

  return (
    <div className="manager-page">
      <header className="manager-header">
        <h1>Clearmark: Bookmark Manager</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setView('bookmarks')}>Bookmarks</button>
          <button onClick={() => setView('duplicates')}>Duplicates</button>
          <button onClick={() => setView('deadlinks')}>Dead Links</button>
          <button onClick={() => setView('importexport')}>Import/Export</button>
        </div>
      </header>

      <main className="manager-main">
        {view === 'bookmarks' && (
          <div className="bookmarks-view">
            <SearchBar />
            <FolderTree onFolderSelect={handleFolderSelect} />
            <BookmarkList bookmarks={bookmarks || []} onBookmarkAction={handleBookmarkAction} />
            {selectedFolder && <BulkActionBar selectedCount={1} onBulkAction={() => {}} />}
          </div>
        )}

        {view === 'duplicates' && (
          <div className="duplicates-view">
            <button onClick={handleDuplicateCheck} className="btn">
              Check for Duplicates
            </button>
          </div>
        )}

        {view === 'deadlinks' && (
          <DeadLinksPanel />
        )}

        {view === 'importexport' && (
          <ImportExportPanel />
        )}
      </main>
    </div>
  )
}