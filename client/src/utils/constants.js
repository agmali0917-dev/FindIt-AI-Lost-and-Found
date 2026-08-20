/**
 * Shared constants for the client
 */

export const ITEM_CATEGORIES = [
  'Electronics', 'Clothing', 'Accessories', 'Bags & Wallets',
  'Keys', 'Documents', 'Jewelry', 'Sports & Outdoors',
  'Books & Stationery', 'Toys & Games', 'Musical Instruments',
  'Vehicles', 'Pets', 'Other',
]

export const ITEM_COLORS = [
  'Black', 'White', 'Silver', 'Gold', 'Red', 'Blue', 'Green',
  'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Gray', 'Multicolor',
]

export const ITEM_STATUS_COLORS = {
  active:   'success',
  matched:  'primary',
  returned: 'accent',
  expired:  'warning',
  deleted:  'danger',
}

export const MATCH_CONFIDENCE_LABELS = {
  very_high: { label: 'Very High', color: 'success' },
  high:      { label: 'High',      color: 'accent' },
  medium:    { label: 'Medium',    color: 'primary' },
  low:       { label: 'Low',       color: 'warning' },
}

export const DEFAULT_MAP_CENTER = [20, 0]
export const DEFAULT_MAP_ZOOM   = 2

export const PAGE_SIZE = 12
