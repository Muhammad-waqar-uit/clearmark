/** Wrapper for chrome.management calls - keeps all management API calls in one place */
export async function getAllExtensions() {
  return chrome.management.getAll()
}

export async function getExtension(id: string) {
  return chrome.management.get(id)
}

export async function setEnabled(id: string, enabled: boolean) {
  return chrome.management.setEnabled(id, enabled)
}

export async function uninstall(id: string, showConfirmDialog: boolean = true) {
  return chrome.management.uninstall(id, { showConfirmDialog })
}

export async function getPermissionWarningsById(id: string) {
  return chrome.management.getPermissionWarningsById(id)
}

export async function getAll() {
  return chrome.management.getAll()
}

/** Filter to show only extensions (not themes/apps) */
export function filterExtensions(all: ChromeManagement.Extension[]) {
  return all.filter(
    (ext) => ext.type === 'extension' && !ext.title.toLowerCase().includes('theme')
  )
}

/** Check if an extension can be disabled/removed */
export function canManage(ext: ChromeManagement.Extension) {
  return ext.mayDisable !== false
}