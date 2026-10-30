# Limitations

## Chrome MV3 Constraints

- No background long-running scripts; service worker lifecycle limited
- chrome.bookmarks API synchronous only; bulk operations may block UI
- chrome.storage.local quota: ~10MB total across all keys
- No native fetch in service worker; limited to Fetch API with restrictions
- Extension cannot auto-update; user must manually reinstall

## Browser/Platform Limits

- Bookmark tree depth limited by browser performance
- Concurrent dead link checks limited to 4 parallel URLs
- Storage operations are async; UI must handle loading states
- No server-side state; all data is client-side only
- Policy-managed extensions may restrict management API access

## Known Issues

- Empty folder detection may not detect folders with hidden bookmarks
- Dead link checker 8s timeout per URL may miss very slow responses
- Drag-and-drop reorganization relies on browser native DnD