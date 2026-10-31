import { Icon } from '../../lib/Icon'
import type { DateFilter, ViewMode } from '../filters'
import type { SortKey } from '../../lib/types'

type SearchBarProps = {
  query: string
  onQueryChange: (query: string) => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  domains: string[]
  domainFilter: string
  onDomainFilterChange: (domain: string) => void
  tags: string[]
  tagFilter: string
  onTagFilterChange: (tag: string) => void
  dateFilter: DateFilter
  onDateFilterChange: (filter: DateFilter) => void
  resultCount: number
}

/** Search and filtering controls above the bookmark list. */
export function SearchBar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  domains,
  domainFilter,
  onDomainFilterChange,
  tags,
  tagFilter,
  onTagFilterChange,
  dateFilter,
  onDateFilterChange,
  resultCount,
}: SearchBarProps) {
  return (
    <div className="card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <label htmlFor="bookmark-search" className="sr-only">
            Search bookmarks
          </label>
          <input
            id="bookmark-search"
            type="search"
            className="input pl-8"
            placeholder="Search title, URL, folder or tag…  (press /)"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <label className="sr-only" htmlFor="bookmark-sort">
          Sort bookmarks
        </label>
        <select
          id="bookmark-sort"
          className="select"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
        >
          <option value="title">Title A–Z</option>
          <option value="dateAdded">Newest first</option>
          <option value="url">URL A–Z</option>
        </select>

        <label className="sr-only" htmlFor="domain-filter">
          Filter by domain
        </label>
        <select
          id="domain-filter"
          className="select max-w-[160px]"
          value={domainFilter}
          onChange={(event) => onDomainFilterChange(event.target.value)}
        >
          <option value="">All domains</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="tag-filter">
          Filter by tag
        </label>
        <select
          id="tag-filter"
          className="select max-w-[140px]"
          value={tagFilter}
          onChange={(event) => onTagFilterChange(event.target.value)}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="date-filter">
          Filter by date added
        </label>
        <select
          id="date-filter"
          className="select"
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value as DateFilter)}
        >
          <option value="any">Any date</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="365">Last year</option>
        </select>

        <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-700" role="group" aria-label="View mode">
          <button
            type="button"
            className={`px-2.5 py-1.5 text-xs font-medium ${
              view === 'list'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
          >
            List
          </button>
          <button
            type="button"
            className={`px-2.5 py-1.5 text-xs font-medium ${
              view === 'compact'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
            onClick={() => onViewChange('compact')}
            aria-pressed={view === 'compact'}
          >
            Compact
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
        {resultCount.toLocaleString()} bookmark{resultCount === 1 ? '' : 's'} shown
      </p>
    </div>
  )
}
