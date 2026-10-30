import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ManagerPage } from '../src/manager/manager'
import { installFakeChrome } from './helpers/fakeChrome'

const reactGlobal = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
reactGlobal.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}

function button(label: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll('button')).find(
    (element) => element.textContent?.trim() === label
  )
  if (!match) throw new Error(`Button "${label}" not found`)
  return match as HTMLButtonElement
}

function type(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

beforeEach(() => {
  installFakeChrome()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

async function renderManager(): Promise<void> {
  await act(async () => {
    root.render(<ManagerPage />)
  })
  await flush()
}

describe('ManagerPage', () => {
  it('renders the folder tree and bookmark list', async () => {
    await renderManager()
    const text = container.textContent ?? ''

    expect(text).toContain('Clearmark')
    expect(text).toContain('Bookmarks bar')
    expect(text).toContain('Work')
    expect(text).toContain('Docs')
    expect(text).toContain('Home')
    expect(text).toContain('2 bookmarks shown')
  })

  it('filters the list as the user types', async () => {
    await renderManager()
    const search = container.querySelector<HTMLInputElement>('#bookmark-search')
    expect(search).not.toBeNull()
    if (!search) return

    await act(async () => {
      type(search, 'home')
    })
    await flush()

    expect(container.textContent).toContain('1 bookmark shown')
    expect(container.querySelector('[aria-label="Select Docs"]')).toBeNull()
    expect(container.querySelector('[aria-label="Select Home"]')).not.toBeNull()
  })

  it('opens the create dialog and saves a bookmark', async () => {
    await renderManager()

    await act(async () => {
      button('New bookmark').click()
    })
    await flush()

    const url = container.querySelector<HTMLInputElement>('#bookmark-url')
    const title = container.querySelector<HTMLInputElement>('#bookmark-title')
    expect(url).not.toBeNull()
    expect(title).not.toBeNull()
    if (!url || !title) return

    await act(async () => {
      type(title, 'Created Site')
      type(url, 'https://created.example.test/')
    })

    await act(async () => {
      button('Create bookmark').click()
    })
    await flush()

    expect(container.textContent).not.toContain('Edit bookmark')
    expect(container.querySelector('#bookmark-url')).toBeNull()
  })

  it('rejects a bookmark without an http URL', async () => {
    await renderManager()

    await act(async () => {
      button('New bookmark').click()
    })
    await flush()

    const url = container.querySelector<HTMLInputElement>('#bookmark-url')
    if (!url) throw new Error('URL field missing')

    await act(async () => {
      type(url, 'not-a-url')
    })
    await act(async () => {
      button('Create bookmark').click()
    })
    await flush()

    expect(container.textContent).toContain('Enter a URL starting with http:// or https://')
  })

  it('shows cleanup results and the extension hub', async () => {
    await renderManager()

    await act(async () => {
      button('Cleanup').click()
    })
    await flush()
    expect(container.textContent).toContain('Duplicate bookmarks')
    expect(container.textContent).toContain('No duplicates found')
    expect(container.textContent).toContain('Empty folders')

    await act(async () => {
      button('Extensions').click()
    })
    await flush()
    expect(container.textContent).toContain('Install list')
    expect(container.textContent).toContain('No extensions match')
  })
})
