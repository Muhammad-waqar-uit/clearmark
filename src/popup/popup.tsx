/** Popup component - quick search with top 10 results */
import { PopupState, usePopupState } from '../lib/types'
import { useEffect, useState } from 'react'

export function Popup() {
  const [state, setState] = useState<PopupState>({
    showSearch: false,
    searchQuery: '',
    selectedFolder: null
  })

  const handleSearchFocus = () => {
    setState({ showSearch: true, searchQuery: '', selectedFolder: null })
  }

  const handleAddCurrentPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        chrome.bookmarks.create({
          title: tabs[0].title,
          url: tabs[0].url,
          parentId: state.selectedFolder || ''
        }, () => {
          console.log('Current page bookmarked')
        })
    })
    })
  }

  const handleOpenManager = () => {
    chrome.tabs.create({ url: '/manager' }, () => {
      // Close popup
    })
  }

  return (
    <div className="popup-container">
      <div className="search-bar">
        <button onClick={handleSearchFocus} className="search-button">
          🔍
        </button>
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={state.searchQuery}
          onChange={(e) => setState({ ...state, searchQuery: e.target.value })}
          className="search-input"
        />
      </div>

      <div className="actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleAddCurrentPage} disabled={!state.selectedFolder}>
          Add to folder
        </button>
        <button onClick={handleOpenManager} style={{ flexShrink: '0' }}>
          Manager
        </button>
      </div>
    </div>
  )
}