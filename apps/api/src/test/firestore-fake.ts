import type { Firestore } from 'firebase-admin/firestore'

import { Timestamp } from 'firebase-admin/firestore'

type Data = Record<string, unknown>

type Ref = { path: string }

type Where = { field: string; op: '==' | 'array-contains-any'; value: unknown }

type Constraints = {
  limit?: number
  orderBy?: { dir: 'asc' | 'desc'; field: string }
  startAfter?: unknown
  wheres: Where[]
}

type Write =
  | { data: Data; merge?: boolean; op: 'set'; path: string }
  | { data: Data; op: 'update'; path: string }
  | { op: 'delete'; path: string }

const CLOCK_BASE = 1_700_000_000_000

declare global {
  var __firestoreFake:
    | { autoCounter: number; clock: number; store: Map<string, Data> }
    | undefined
}

const state = globalThis.__firestoreFake ?? {
  autoCounter: 0,
  clock: CLOCK_BASE,
  store: new Map<string, Data>(),
}
globalThis.__firestoreFake = state

const store = state.store

const tick = (): Timestamp => Timestamp.fromMillis(state.clock++)
const autoId = (): string => `auto_${++state.autoCounter}`

const isSentinel = (
  value: unknown,
): value is { __sentinel: string; by?: number } =>
  typeof value === 'object' && value !== null && '__sentinel' in value

const FieldValue = {
  serverTimestamp: () => ({ __sentinel: 'serverTimestamp' }),
  increment: (by: number) => ({ __sentinel: 'increment', by }),
}

const toNumber = (value: unknown): number =>
  typeof value === 'number' ? value : 0

const resolveData = (data: Data, existing: Data | undefined): Data =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (!isSentinel(value)) return [key, value]
      if (value.__sentinel === 'serverTimestamp') return [key, tick()]
      return [key, toNumber(existing?.[key]) + toNumber(value.by)]
    }),
  )

const applyWrite = (write: Write): void => {
  if (write.op === 'delete') {
    store.delete(write.path)
    return
  }
  const existing = store.get(write.path)
  const base = write.op === 'set' && !write.merge ? {} : { ...(existing ?? {}) }
  store.set(write.path, { ...base, ...resolveData(write.data, existing) })
}

const lastSegment = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1)

const parentCollection = (path: string): string =>
  path.slice(0, path.lastIndexOf('/'))

const snapshot = (path: string) => {
  const data = store.get(path)
  return {
    id: lastSegment(path),
    ref: makeDoc(path),
    exists: data !== undefined,
    data: () => (data === undefined ? undefined : { ...data }),
  }
}

const compare = (a: unknown, b: unknown): number => {
  const av = a instanceof Timestamp ? a.toMillis() : a
  const bv = b instanceof Timestamp ? b.toMillis() : b
  if (typeof av === 'number' && typeof bv === 'number') return av - bv
  return String(av).localeCompare(String(bv))
}

const matchesWhere = (data: Data, where: Where): boolean => {
  const field = data[where.field]
  if (where.op === '==') return field === where.value
  const values = Array.isArray(where.value) ? where.value : []
  return Array.isArray(field) && field.some(item => values.includes(item))
}

const runQuery = (collPath: string, constraints: Constraints) => {
  const rows = [...store.entries()]
    .filter(([path]) => parentCollection(path) === collPath)
    .filter(([, data]) => constraints.wheres.every(w => matchesWhere(data, w)))

  const ordered = constraints.orderBy
    ? [...rows].sort(([, a], [, b]) => {
        const sign = constraints.orderBy?.dir === 'desc' ? -1 : 1
        const field = constraints.orderBy?.field ?? ''
        return sign * compare(a[field], b[field])
      })
    : rows

  const afterCursor =
    constraints.startAfter === undefined
      ? ordered
      : ordered.filter(([, data]) => {
          const field = constraints.orderBy?.field ?? ''
          const raw = compare(data[field], constraints.startAfter)
          return constraints.orderBy?.dir === 'desc' ? raw < 0 : raw > 0
        })

  const limited =
    constraints.limit === undefined
      ? afterCursor
      : afterCursor.slice(0, constraints.limit)

  const docs = limited.map(([path]) => snapshot(path))
  return { docs, empty: docs.length === 0, size: docs.length }
}

const makeQuery = (collPath: string, constraints: Constraints) => ({
  where: (field: string, op: Where['op'], value: unknown) =>
    makeQuery(collPath, {
      ...constraints,
      wheres: [...constraints.wheres, { field, op, value }],
    }),
  orderBy: (field: string, dir: 'asc' | 'desc' = 'asc') =>
    makeQuery(collPath, { ...constraints, orderBy: { dir, field } }),
  startAfter: (value: unknown) =>
    makeQuery(collPath, { ...constraints, startAfter: value }),
  limit: (count: number) =>
    makeQuery(collPath, { ...constraints, limit: count }),
  get: () => Promise.resolve(runQuery(collPath, constraints)),
})

const makeDoc = (docPath: string) => ({
  id: lastSegment(docPath),
  path: docPath,
  collection: (name: string) => makeCollection(`${docPath}/${name}`),
  get: () => Promise.resolve(snapshot(docPath)),
  set: (data: Data, options?: { merge?: boolean }) => {
    applyWrite({ op: 'set', path: docPath, data, merge: options?.merge })
    return Promise.resolve()
  },
  update: (data: Data) => {
    applyWrite({ op: 'update', path: docPath, data })
    return Promise.resolve()
  },
  delete: () => {
    applyWrite({ op: 'delete', path: docPath })
    return Promise.resolve()
  },
})

const makeCollection = (collPath: string) => ({
  ...makeQuery(collPath, { wheres: [] }),
  doc: (id?: string) => makeDoc(`${collPath}/${id ?? autoId()}`),
})

const runTransaction = <T>(run: (tx: TxApi) => Promise<T>): Promise<T> => {
  const staged: Write[] = []
  const tx: TxApi = {
    get: (ref: Ref) => Promise.resolve(snapshot(ref.path)),
    set: (ref: Ref, data: Data, options?: { merge?: boolean }) => {
      staged.push({ op: 'set', path: ref.path, data, merge: options?.merge })
    },
    create: (ref: Ref, data: Data) => {
      staged.push({ op: 'set', path: ref.path, data, merge: false })
    },
    update: (ref: Ref, data: Data) => {
      staged.push({ op: 'update', path: ref.path, data })
    },
    delete: (ref: Ref) => {
      staged.push({ op: 'delete', path: ref.path })
    },
  }
  return run(tx).then(result => {
    staged.forEach(applyWrite)
    return result
  })
}

type TxApi = {
  create: (ref: Ref, data: Data) => void
  delete: (ref: Ref) => void
  get: (ref: Ref) => Promise<ReturnType<typeof snapshot>>
  set: (ref: Ref, data: Data, options?: { merge?: boolean }) => void
  update: (ref: Ref, data: Data) => void
}

const batch = () => {
  const staged: Write[] = []
  const self = {
    set: (ref: Ref, data: Data, options?: { merge?: boolean }) => {
      staged.push({ op: 'set', path: ref.path, data, merge: options?.merge })
      return self
    },
    update: (ref: Ref, data: Data) => {
      staged.push({ op: 'update', path: ref.path, data })
      return self
    },
    delete: (ref: Ref) => {
      staged.push({ op: 'delete', path: ref.path })
      return self
    },
    commit: () => {
      staged.forEach(applyWrite)
      return Promise.resolve()
    },
  }
  return self
}

const db = {
  collection: (name: string) => makeCollection(name),
  runTransaction,
  batch,
}

export const fake = {
  db,
  seed: (path: string, data: Data): void => {
    store.set(path, { ...data })
  },
  reset: (): void => {
    state.store.clear()
    state.clock = CLOCK_BASE
    state.autoCounter = 0
  },
  getDoc: (path: string): Data | undefined => store.get(path),
  listDocs: (collPath: string): Array<{ id: string } & Data> =>
    [...store.entries()]
      .filter(([path]) => parentCollection(path) === collPath)
      .map(([path, data]) => ({ id: lastSegment(path), ...data })),
}

export const getFirestore = (): Firestore => db as unknown as Firestore

export { FieldValue, Timestamp }
