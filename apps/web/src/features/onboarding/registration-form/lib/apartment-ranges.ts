export type BlockId = 1 | 2 | 3 | 4

export const apartmentRanges: Record<BlockId, [number, number]> = {
  1: [1, 70],
  2: [71, 139],
  3: [1, 63],
  4: [64, 126],
}

export const blockIds: BlockId[] = [1, 2, 3, 4]

export const isApartmentInBlock = (block: BlockId, apartment: number) => {
  const [min, max] = apartmentRanges[block]
  return apartment >= min && apartment <= max
}
