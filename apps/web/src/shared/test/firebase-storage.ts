import { vi } from 'vitest'

type StorageRef = { fullPath: string }

const state = {
  failNames: new Set<string>(),
  uploaded: [] as string[],
  deleted: [] as string[],
}

const getStorage = () => ({ name: 'test-storage' })

const connectStorageEmulator = vi.fn()

const ref = (_storage: unknown, fullPath: string): StorageRef => ({ fullPath })

const uploadBytesResumable = (target: StorageRef, data: File) => {
  if (state.failNames.has(data.name)) {
    return Promise.reject(new Error(`upload failed: ${data.name}`))
  }
  state.uploaded.push(target.fullPath)
  return Promise.resolve({ ref: target })
}

const getDownloadURL = (target: StorageRef) =>
  Promise.resolve(`https://cdn.test/${target.fullPath}`)

const deleteObject = (target: StorageRef) => {
  state.deleted.push(target.fullPath)
  return Promise.resolve()
}

export const firebaseStorageModule = {
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
}

export const firebaseStorage = {
  failUploadsNamed: (...names: string[]) => {
    names.forEach(name => {
      state.failNames.add(name)
    })
  },
  uploaded: () => state.uploaded,
  deleted: () => state.deleted,
  reset: () => {
    state.failNames.clear()
    state.uploaded = []
    state.deleted = []
  },
}
