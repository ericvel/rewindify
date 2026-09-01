import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { createMockAuthSource } from '../mockAuthSource'
import { MOCK_SESSION } from '@/data/session'
import type { AuthSource } from '../types'

const STORAGE_KEY = 'rewindify:session'

/** The source is built inside a store's scope in the app; mirror that here. */
function createInScope(): AuthSource {
  const scope = effectScope()
  const source = scope.run(() => createMockAuthSource())
  if (!source) throw new Error('Scope did not run.')
  scopes.push(scope)
  return source
}

let scopes: ReturnType<typeof effectScope>[] = []

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  for (const scope of scopes) scope.stop()
  scopes = []
})

describe('createMockAuthSource', () => {
  it('starts disconnected when nothing is stored', () => {
    expect(createInScope().session.value).toBeNull()
  })

  it('connects as the fixture account', async () => {
    const source = createInScope()
    await source.connect()
    expect(source.session.value).toEqual(MOCK_SESSION)
  })

  it('clears the session on disconnect', async () => {
    const source = createInScope()
    await source.connect()
    await source.disconnect()
    expect(source.session.value).toBeNull()
  })

  it('persists the session so a reload finds it', async () => {
    await createInScope().connect()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(MOCK_SESSION)

    // A fresh source stands in for the next boot.
    expect(createInScope().session.value).toEqual(MOCK_SESSION)
  })

  it('persists a disconnect too', async () => {
    const source = createInScope()
    await source.connect()
    await source.disconnect()
    expect(createInScope().session.value).toBeNull()
  })

  it('starts disconnected when the stored value is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(createInScope().session.value).toBeNull()
  })
})
