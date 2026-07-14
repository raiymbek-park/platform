import type { Event } from '../events/events-store'

import { describe, expect, test } from 'vitest'

import { digestBody } from './digest-copy'

const announcement = (title: string, createdAt: number): Event => ({
  category: 'complex',
  createdAt,
  id: `post-${createdAt}`,
  title,
  type: 'announcement',
})

const offer = (title: string, createdAt: number): Event => ({
  category: 'services',
  createdAt,
  id: `offer-${createdAt}`,
  title,
  type: 'offer',
})

const statusChange: Event = {
  createdAt: 300,
  issueId: 'issue-14',
  number: 14,
  status: 'in-progress',
  type: 'issue-status',
}

const comment: Event = {
  createdAt: 400,
  issueId: 'issue-14',
  number: 14,
  type: 'issue-comment',
}

const opened = (title: string): Event => ({
  createdAt: 500,
  issueId: 'issue-18',
  number: 18,
  title,
  type: 'issue',
})

describe('digestBody — single event names it with no remaining count', () => {
  test('an announcement is named by its stored title', () => {
    expect(digestBody('ru', [announcement('Отключение воды 15 июля', 1)])).toBe(
      'Отключение воды 15 июля',
    )
  })

  test('an offer is named by its stored title', () => {
    expect(digestBody('ru', [offer('Продам самокат', 1)])).toBe(
      'Продам самокат',
    )
  })
})

describe('digestBody — several events name the newest plus a count', () => {
  test('three events yield the newest title and 2 remaining', () => {
    const events = [
      announcement('Лифт не работает', 300),
      announcement('Отключение воды', 200),
      offer('Продам самокат', 100),
    ]
    expect(digestBody('ru', events)).toBe('Лифт не работает · и ещё 2')
  })

  test('ten events yield a remaining count of 9', () => {
    const events = Array.from({ length: 10 }, (_, index) =>
      announcement(`Событие ${10 - index}`, 1000 - index),
    )
    expect(digestBody('ru', events)).toBe('Событие 10 · и ещё 9')
  })
})

describe('digestBody — per-kind headlines', () => {
  test('an issue status change is named by number and new status', () => {
    expect(digestBody('ru', [statusChange])).toBe('Заявка №14: В работе')
  })

  test('an issue comment is named as new messages on the issue number, without the comment text', () => {
    expect(digestBody('ru', [comment])).toBe('Новые сообщения по заявке №14')
  })

  test('push happy-path 17: a newly opened issue is named by its number and title', () => {
    expect(digestBody('ru', [opened('Протечка воды в подвале')])).toBe(
      'Заявка №18: Протечка воды в подвале',
    )
  })
})

describe('digestBody — written per locale', () => {
  test('kk copy is Kazakh', () => {
    expect(digestBody('kk', [statusChange, comment])).toBe(
      'Өтінім №14: Жұмыста · және тағы 1',
    )
  })

  test('en copy is English', () => {
    expect(digestBody('en', [statusChange, comment])).toBe(
      'Issue #14: In progress · and 1 more',
    )
  })

  test('a newly opened issue is framed in Kazakh around its projected Kazakh title', () => {
    expect(digestBody('kk', [opened('Жертөледегі су ағуы')])).toBe(
      'Өтінім №18: Жертөледегі су ағуы',
    )
  })

  test('a newly opened issue is framed in English around its projected title', () => {
    expect(digestBody('en', [opened('Basement water leak')])).toBe(
      'Issue #18: Basement water leak',
    )
  })
})

describe('digestBody — empty window', () => {
  test('yields an empty body', () => {
    expect(digestBody('ru', [])).toBe('')
  })
})
