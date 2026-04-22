const PACKAGE_UNIT_CANONICAL_MAP: Record<string, string> = {
  each: 'Each',
  item: 'Each',
  items: 'Each',
  pc: 'Each',
  pcs: 'Each',
  piece: 'Each',
  pieces: 'Each',
  roll: 'Roll',
  rolls: 'Roll',
  pair: 'Pair',
  pairs: 'Pair',
  set: 'Set',
  sets: 'Set',
  box: 'Box',
  boxes: 'Box',
  case: 'Case',
  cases: 'Case',
  pack: 'Pack',
  packs: 'Pack',
  bag: 'Bag',
  bags: 'Bag',
  bottle: 'Bottle',
  bottles: 'Bottle',
  sheet: 'Sheet',
  sheets: 'Sheet',
  bundle: 'Bundle',
  bundles: 'Bundle',
  bucket: 'Bucket',
  buckets: 'Bucket',
  tray: 'Tray',
  trays: 'Tray',
  unit: 'Unit',
  units: 'Unit',
  meter: 'Meter',
  meters: 'Meter',
  kilogram: 'Kilogram',
  kilograms: 'Kilogram',
  kg: 'Kilogram',
  centimeter: 'Centimeter',
  centimeters: 'Centimeter',
  cm: 'Centimeter',
  'square meter': 'Square Meter',
  'square meters': 'Square Meter',
  sqm: 'Square Meter',
}

export const PACKAGE_UNIT_TRANSLATIONS: Record<string, string> = {
  个: 'Each',
  件: 'Each',
  把: 'Each',
  支: 'Each',
  只: 'Each',
  根: 'Each',
  条: 'Each',
  块: 'Each',
  顶: 'Each',
  台: 'Unit',
  辆: 'Unit',
  架: 'Unit',
  卷: 'Roll',
  双: 'Pair',
  对: 'Pair',
  副: 'Pair',
  付: 'Pair',
  套: 'Set',
  组: 'Set',
  盒: 'Box',
  箱: 'Case',
  包: 'Pack',
  袋: 'Bag',
  瓶: 'Bottle',
  张: 'Sheet',
  片: 'Sheet',
  米: 'Meter',
  千克: 'Kilogram',
  厘米: 'Centimeter',
  平方米: 'Square Meter',
  捆: 'Bundle',
  桶: 'Bucket',
  盘: 'Roll',
}

export function normalizePackageUnit(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) {
    return undefined
  }

  if (PACKAGE_UNIT_TRANSLATIONS[trimmed]) {
    return PACKAGE_UNIT_TRANSLATIONS[trimmed]
  }

  const canonical = PACKAGE_UNIT_CANONICAL_MAP[trimmed.toLowerCase()]
  return canonical || trimmed
}

export function normalizePackageUnitForPriceUnit(value?: string | null): string | undefined {
  const normalized = normalizePackageUnit(value)
  return normalized?.toLowerCase()
}
