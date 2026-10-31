type IconName =
  | 'search'
  | 'folder'
  | 'folder-open'
  | 'all-folders'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'edit'
  | 'tag'
  | 'trash'
  | 'note'
  | 'moon'
  | 'sun'
  | 'monitor'
  | 'broom'
  | 'open'
  | 'external'
  | 'plus'

const PATHS: Record<IconName, string> = {
  search: 'M10 2a8 8 0 1 0 5.3 13.9l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z',
  folder:
    'M4 5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z',
  'folder-open':
    'M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2H4V6Zm0 4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10H4Z',
  'all-folders': 'M4 4h5l2 2h7a2 2 0 0 1 2 2v2H4V4Zm0 10v4h16v-4H4Z',
  close: 'M6 6l12 12M18 6L6 18',
  'chevron-down': 'M5 8l7 7 7-7',
  'chevron-right': 'M9 6l7 7-7 7',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  tag: 'M3 7a2 2 0 0 1 2-2h4l9 9a2 2 0 0 1 0 2.8l-3.2 3.2a2 2 0 0 1-2.8 0L3 10.8V7Zm4 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  note: 'M4 4h10l6 6v10H4V4Zm6 11 6-6',
  trash: 'M5 6h14M9 6V4h6v2M6 6v14h12V6M10 10l-1 8m6-8l1 8',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z',
  sun: 'M12 4v2M12 18v2M5 5l1.4 1.4M17.6 17.6 19 19M4 12h2M18 12h2M5 19l1.4-1.4M17.6 6.4 19 5M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  monitor: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6l-2 2H6a2 2 0 0 1-2-2V5Z',
  broom: 'M4 11l4-4 7 7-4 4-7-7Zm13.5 2.5 2.5 2.5-1.5 1.5-2.5-2.5 1.5-1.5Z',
  open: 'M7 17h6v-6M11 3 3 11l6-6',
  external: 'M14 3h7v7M5 19h12v-7M19 10 12 17',
  plus: 'M12 5v14M5 12h14',
}

export function Icon({ name, className = '', 'aria-hidden': hidden = true }: { name: IconName; className?: string; 'aria-hidden'?: boolean }) {
  return (
    <svg
      aria-hidden={hidden}
      className={`inline-block align-text-bottom ${className}`}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}