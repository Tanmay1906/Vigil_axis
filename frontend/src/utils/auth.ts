import Cookies from 'js-cookie'

export type UserRole = 'forensic-investigator' | 'forensic-auditor'

interface AuthPayload {
  username: string
  role: UserRole
  timestamp: number
}

const JWT_COOKIE_NAME = 'vigil-jwt'

export function setAuthToken(payload: AuthPayload): string {
  // In production, this would come from a backend API
  // For now, we're creating a client-side JWT representation
  const token = btoa(JSON.stringify(payload))
  
  Cookies.set(JWT_COOKIE_NAME, token, {
    expires: 7, // 7 days
    secure: true, // HTTPS only
    sameSite: 'strict'
  })
  
  return token
}

export function getAuthToken(): string | undefined {
  return Cookies.get(JWT_COOKIE_NAME)
}

export function getAuthPayload(): AuthPayload | null {
  const token = getAuthToken()
  if (!token) return null
  
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}

export function clearAuthToken(): void {
  Cookies.remove(JWT_COOKIE_NAME)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

export function getCurrentRole(): UserRole | null {
  return getAuthPayload()?.role ?? null
}

export function hasAnyRole(allowedRoles: UserRole[]): boolean {
  const current = getCurrentRole()
  if (!current) {
    return false
  }
  return allowedRoles.includes(current)
}
