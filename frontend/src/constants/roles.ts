// User role constants
export const ROLE_MEMBER = 'member'
export const ROLE_ADMIN = 'admin'
export const ROLE_ORGANIZER = 'organizer'
export const ROLE_OWNER = 'owner'

// Role types for TypeScript
export type Role = typeof ROLE_MEMBER | typeof ROLE_ADMIN | typeof ROLE_ORGANIZER | typeof ROLE_OWNER

// Helper functions for role checks
export const isAdminRole = (role: string): boolean => {
  return role === ROLE_ADMIN || role === ROLE_ORGANIZER || role === ROLE_OWNER
}

export const isOrganizerRole = (role: string): boolean => {
  return role === ROLE_ORGANIZER || role === ROLE_ADMIN || role === ROLE_OWNER
}
