import { describe, expect, it } from 'vitest'

import { appRouter } from '../router'
import { changes, contacts, profile, services } from './mock'

const caller = appRouter.createCaller({})

describe('home.profile', () => {
  it('returns the resident profile with name, block, and apartment', async () => {
    const result = await caller.home.profile()
    expect(result).toEqual(profile)
    expect(result.name).toBe('Азиза')
    expect(result.block).toBe(1)
    expect(result.apartment).toBe(142)
  })
})

describe('home.changes', () => {
  it('returns the changes feed in the mocked order', async () => {
    const result = await caller.home.changes()
    expect(result).toEqual(changes)
    expect(result.map(change => change.id)).toEqual([
      'announcements',
      'request-done',
      'water-shutdown',
    ])
  })
})

describe('home.services', () => {
  it('returns the services list in the mocked order', async () => {
    const result = await caller.home.services()
    expect(result).toEqual(services)
    expect(result).toHaveLength(5)
    expect(result[0]?.title).toBe('Объявления')
  })
})

describe('home.contacts', () => {
  it('returns the contacts with a dialable phone number', async () => {
    const result = await caller.home.contacts()
    expect(result).toEqual(contacts)
    expect(result).toHaveLength(4)
    result.forEach(contact => {
      expect(contact.phone).toMatch(/^\+7\d{10}$/)
    })
  })
})
