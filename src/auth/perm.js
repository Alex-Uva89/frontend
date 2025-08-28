// Deve rispecchiare ESATTAMENTE il backend/src/auth/permissions.js

export const PERM = {
  MANAGE_ALL_BUSINESSES: 1 << 0,
  MANAGE_OWN_BUSINESS:   1 << 1,

  // CATEGORIES (CRUD + legacy WRITE)
  CATEGORIES_READ:       1 << 2,
  CATEGORIES_CREATE:     1 << 3,
  CATEGORIES_UPDATE:     1 << 4,
  CATEGORIES_DELETE:     1 << 5,
  CATEGORIES_WRITE:      1 << 6, // legacy

  // PRODUCTS (CRUD + legacy WRITE)
  PRODUCTS_READ:         1 << 7,
  PRODUCTS_CREATE:       1 << 8,
  PRODUCTS_UPDATE:       1 << 9,
  PRODUCTS_DELETE:       1 << 10,
  PRODUCTS_WRITE:        1 << 11, // legacy

  USERS_READ:            1 << 12,
  USERS_WRITE:           1 << 13,

  READ_ALL_BUSINESSES:   1 << 14,
  AUDIT_EXPORT:          1 << 15
}


export function hasBit (mask, bit) {
  return !!(Number(mask || 0) & bit)
}
