import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Popup } from '../src/popup/popup'
import { OptionsPage } from '../src/options/options'
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

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('Popup', () => {
  beforeEach(() => {
    installFakeChrome({
      activeTab: { url: 'https://example.test/page', title: 'Example Page' },
    })
  })

  it('offers the current page and quick search results', async () => {
    await act(async () => {
      root.render(<Popup />)
    })
    await flush()

    const text = container.textContent ?? ''
    expect(text).toContain('Clearmark')
    expect(text).toContain('Example Page')
    expect(text).toContain('Docs')
    expect(text).toContain('Home')
    expect(text).toContain('Add page')
  })

  it('saves the current page into the selected folder', async () => {
    await act(async () => {
      root.render(<Popup />)
    })
    await flush()

    await act(async () => {
      button('Add page').click()
    })
    await flush()

    expect(container.textContent).toContain('Saved to your bookmarks.')
  })
})

describe('OptionsPage', () => {
  beforeEach(() => {
    installFakeChrome()
  })

  it('renders appearance, sorting and uninstall settings', async () => {
    await act(async () => {
      root.render(<OptionsPage />)
    })
    await flush()

    const text = container.textContent ?? ''
    expect(text).toContain('Clearmark settings')
    expect(text).toContain('Appearance')
    expect(text).toContain('Default sorting')
    expect(text).toContain('Uninstall feedback page')
    expect(container.querySelector('#default-sort')).not.toBeNull()
    expect(container.querySelector('#uninstall-url')).not.toBeNull()
  })

  it('saves a new theme choice', async () => {
    await act(async () => {
      root.render(<OptionsPage />)
    })
    await flush()

    const dark = container.querySelector<HTMLInputElement>('input[value="dark"]')
    if (!dark) throw new Error('Dark theme option missing')

    await act(async () => {
      dark.click()
    })
    await flush()

    expect(dark.checked).toBe(true)
  })
})
