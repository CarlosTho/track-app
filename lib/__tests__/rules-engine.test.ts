import { describe, it, expect } from 'vitest'
import { suggestCompliance } from '../rules-engine'

const BOTH = { noAddedSugar: true, noAddedSalt: true }
const SUGAR_ONLY = { noAddedSugar: true, noAddedSalt: false }
const SALT_ONLY = { noAddedSugar: false, noAddedSalt: true }
const NONE = { noAddedSugar: false, noAddedSalt: false }

describe('suggestCompliance', () => {
  it('returns compliant with no flags for clean meal', () => {
    const result = suggestCompliance('grilled chicken and rice', BOTH)
    expect(result.isCompliant).toBe(true)
    expect(result.flags).toHaveLength(0)
  })

  it('flags sugar keyword when noAddedSugar is on', () => {
    const result = suggestCompliance('I had soda with lunch', SUGAR_ONLY)
    expect(result.isCompliant).toBe(false)
    expect(result.flags[0]).toMatch(/soda/)
  })

  it('flags salt keyword when noAddedSalt is on', () => {
    const result = suggestCompliance('chips and guacamole', SALT_ONLY)
    expect(result.isCompliant).toBe(false)
    expect(result.flags[0]).toMatch(/chips/)
  })

  it('flags both sugar and salt violations', () => {
    const result = suggestCompliance('soda and chips', BOTH)
    expect(result.isCompliant).toBe(false)
    expect(result.flags).toHaveLength(2)
  })

  it('does not flag sugar keyword when noAddedSugar is off', () => {
    const result = suggestCompliance('chocolate cake', NONE)
    expect(result.isCompliant).toBe(true)
  })

  it('does not flag salt keyword when noAddedSalt is off', () => {
    const result = suggestCompliance('chips', NONE)
    expect(result.isCompliant).toBe(true)
  })

  it('is case-insensitive', () => {
    const result = suggestCompliance('SODA', SUGAR_ONLY)
    expect(result.isCompliant).toBe(false)
  })

  it('returns compliant for empty description', () => {
    const result = suggestCompliance('', BOTH)
    expect(result.isCompliant).toBe(true)
    expect(result.flags).toHaveLength(0)
  })

  it('only adds one sugar flag even if multiple sugar keywords appear', () => {
    const result = suggestCompliance('candy and chocolate', SUGAR_ONLY)
    // breaks on first match, so exactly 1 flag
    expect(result.flags.filter(f => f.includes('sugar'))).toHaveLength(1)
  })

  it('flags pizza as salt violation', () => {
    const result = suggestCompliance('pizza for dinner', SALT_ONLY)
    expect(result.isCompliant).toBe(false)
    expect(result.flags[0]).toMatch(/pizza/)
  })
})
