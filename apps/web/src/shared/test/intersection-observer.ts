type Registered = {
  callback: IntersectionObserverCallback
  observer: IntersectionObserver
}

let registered: Registered[] = []

export class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: number[] = []

  constructor(callback: IntersectionObserverCallback) {
    registered.push({ callback, observer: this })
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

export const intersectionObserver = {
  reset: () => {
    registered = []
  },
  trigger: (isIntersecting = true) => {
    const entry = { isIntersecting } as IntersectionObserverEntry
    registered.forEach(({ callback, observer }) => {
      callback([entry], observer)
    })
  },
}
