import { Navigate } from 'react-router-dom'
import { getCurrentRole, hasAnyRole, isAuthenticated, UserRole } from '../../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    const role = getCurrentRole()
    return <Navigate to={role === 'forensic-auditor' ? '/verification' : '/dashboard'} replace />
  }

  return <>{children}</>
}
