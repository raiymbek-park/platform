type FieldMeta = {
  errors: readonly unknown[]
  isDirty: boolean
  isTouched: boolean
}

export const inputState = ({ errors, isDirty, isTouched }: FieldMeta) => {
  if (errors.length > 0) return isTouched ? 'error' : undefined
  return isDirty ? 'success' : undefined
}
