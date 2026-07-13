import { describe, expect, test } from 'vitest'

import { generateCode, hashCode, isCodeMatch, newSalt } from './generate-code'

describe('generateCode — 6-digit CSPRNG code (happy-path 7)', () => {
  const samples = Array.from({ length: 500 }, generateCode)

  test('every code is exactly six numeric digits, zero-padded', () => {
    expect(samples.every(code => /^\d{6}$/.test(code))).toBe(true)
  })

  test('codes vary across draws rather than returning a constant', () => {
    expect(new Set(samples).size).toBeGreaterThan(1)
  })
})

describe('newSalt — per-code random salt', () => {
  test('returns 16 bytes as a 32-character hex string', () => {
    expect(newSalt()).toMatch(/^[0-9a-f]{32}$/)
  })

  test('two salts drawn back to back differ', () => {
    expect(newSalt()).not.toBe(newSalt())
  })
})

describe('hashCode — salted SHA-256 of the code', () => {
  test('produces a 64-character hex digest', () => {
    expect(hashCode('salt', '123456')).toMatch(/^[0-9a-f]{64}$/)
  })

  test('is deterministic for the same salt and code', () => {
    expect(hashCode('salt', '123456')).toBe(hashCode('salt', '123456'))
  })

  test('a different salt yields a different hash for the same code', () => {
    expect(hashCode('salt-a', '123456')).not.toBe(hashCode('salt-b', '123456'))
  })

  test('a different code yields a different hash for the same salt', () => {
    expect(hashCode('salt', '123456')).not.toBe(hashCode('salt', '654321'))
  })

  test('never returns the plaintext code', () => {
    expect(hashCode('salt', '123456')).not.toContain('123456')
  })
})

describe('isCodeMatch — constant-time comparison (happy-path 8)', () => {
  const salt = newSalt()
  const codeHash = hashCode(salt, '654321')

  test('accepts the code whose hash was stored', () => {
    expect(isCodeMatch(salt, codeHash, '654321')).toBe(true)
  })

  test('rejects a wrong code under the same salt', () => {
    expect(isCodeMatch(salt, codeHash, '000000')).toBe(false)
  })

  test('rejects the right code hashed under a different salt', () => {
    expect(isCodeMatch(newSalt(), codeHash, '654321')).toBe(false)
  })

  test('returns false without throwing when the stored hash length differs', () => {
    expect(isCodeMatch(salt, 'ab', '654321')).toBe(false)
  })
})
