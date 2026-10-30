

/** Apply light/dark/system theme to the document root. */
export function applyTheme(theme) {
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

/** Re-apply the theme when the OS appearance changes (system mode only). */
export function watchSystemTheme(theme) {
  if (theme !== 'system' || typeof window.matchMedia !== 'function') return () => undefined
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => applyTheme('system')
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
