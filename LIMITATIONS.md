# Clearmark: Limitations

## Browser API Limits

### MV3 Service Worker Constraints
- Service workers are **not persistent**. Keep state in storage, not in global variables
- Cannot run code at the moment of uninstall. Do all cleanup before calling `uninstallSelf`
- Cannot install other extensions silently. To suggest another extension, open its store page with `chrome.tabs.create({ url: "https://chromewebstore.google.com/detail/<EXTENSION_ID>" })` and let the user click "Add to Chrome"

### Permission Constraints
- **management permission** shows a stronger install warning: "manage your apps, extensions, and themes". This must be explained in store listing and privacy policy
- **management permission** makes Chrome show stronger warnings during installation
- Extensions managed by policy cannot be disabled or removed (`mayDisable` is false)
- The extension list is only what is installed in the current browser profile. Clearmark cannot see other profiles or other browsers

## Technical Limits

### URL Normalization
- Cannot strip all tracking parameters - only common ones (utm_source, utm_medium, utm_campaign, utm_term, utm_content, ref, src)
- Some URL formats may not normalize perfectly - edge cases with relative URLs

### Performance
- Dead link checking is limited to 5 concurrent URLs with 8-second timeout each
- Very large bookmark sets (50,000+) may experience slower initial load
- Drag and drop may have issues with deeply nested folder structures

### Storage Limits
- `chrome.storage.local` has ~10MB quota
- Storage is per-browser-profile, not synced across profiles
- Extension list is only for current profile

### Feature Gaps (v1 Non-Goals)
- ❌ Installing other extensions silently (not possible)
- ❌ Cloud sync or user accounts
- ❌ Mobile browser support
- ❌ Mobile browsers (later phase)
- ❌ Cloud sync or user accounts
- ❌ Installing other extensions silently

## Platform-Specific

### Firefox Support
- Firefox needs `browser_specific_settings` in manifest and check of browser.* API differences
- Some chrome.* API calls may need wrappers for Firefox port

### Management Permission Review
- Expect closer review because of `management` permission
- Must clearly state that nothing about the extension list leaves the browser

### Store Restrictions
- Must justify every permission in store submission form
- `bookmarks`: read and manage bookmarks
- `storage`: save tags, settings, and the install list
- `tabs`: open the manager page and add the current page
- `management`: show installed extensions and let user enable, disable, or remove them from the hub