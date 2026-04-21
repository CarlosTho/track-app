import { describe, it, expect } from 'vitest'
import { getMotivationalMessage } from '../motivation'

describe('getMotivationalMessage', () => {
  const TOTAL = 14

  it('shows launch message on day 1', () => {
    const msg = getMotivationalMessage(1, TOTAL, 100)
    expect(msg.emoji).toBe('🚀')
    expect(msg.title).toContain('Day 1')
  })

  it('shows "just getting started" in early days (<=20%)', () => {
    const msg = getMotivationalMessage(2, TOTAL, 100) // 14% = <=20%
    expect(msg.emoji).toBe('💪')
    expect(msg.title).toContain('getting started')
    expect(msg.subtitle).toContain('12 days left')
  })

  it('shows "building momentum" between 20% and 50%', () => {
    const msg = getMotivationalMessage(5, TOTAL, 80) // 35%
    expect(msg.emoji).toBe('🔥')
    expect(msg.subtitle).toContain('5 days in')
  })

  it('shows "halfway there" at exactly 50%', () => {
    const msg = getMotivationalMessage(7, TOTAL, 90) // 7/14 = 50%
    expect(msg.emoji).toBe('⚡')
    expect(msg.title).toContain('Halfway')
  })

  it('shows "more than halfway" between 50% and 80%', () => {
    const msg = getMotivationalMessage(9, TOTAL, 90) // 64%
    expect(msg.emoji).toBe('🎯')
    expect(msg.subtitle).toContain('5 days left')
  })

  it('shows "almost there" in final stretch (>=80%, not last day)', () => {
    const msg = getMotivationalMessage(13, TOTAL, 90) // 92%
    expect(msg.emoji).toBe('🏁')
    expect(msg.subtitle).toContain('1 day')
  })

  it('uses plural "days" when multiple days remain in final stretch', () => {
    const msg = getMotivationalMessage(12, TOTAL, 90) // 85%
    expect(msg.subtitle).toContain('2 days')
  })

  it('shows final day message on last day', () => {
    const msg = getMotivationalMessage(14, TOTAL, 90)
    expect(msg.emoji).toBe('🌟')
    expect(msg.title).toContain('Final day')
  })

  it('shows encouraging subtitle on final day with high compliance', () => {
    const msg = getMotivationalMessage(14, TOTAL, 80)
    expect(msg.subtitle).toContain('crushing it')
  })

  it('shows motivating subtitle on final day with low compliance', () => {
    const msg = getMotivationalMessage(14, TOTAL, 60)
    expect(msg.subtitle).toContain('Make today count')
  })

  it('each message has emoji, title, subtitle, and color', () => {
    for (let day = 1; day <= TOTAL; day++) {
      const msg = getMotivationalMessage(day, TOTAL, 75)
      expect(msg.emoji).toBeTruthy()
      expect(msg.title).toBeTruthy()
      expect(msg.subtitle).toBeTruthy()
      expect(msg.color).toMatch(/^from-/)
    }
  })
})
