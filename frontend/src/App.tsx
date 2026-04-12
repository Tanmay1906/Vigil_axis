
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ShellLayout } from './components/layout/ShellLayout'
import { Login } from './components/ui/Login'
import { Dashboard } from './components/ui/Dashboard'
import { CaseManagement } from './components/ui/CaseManagement'
import { EvidenceLab } from './components/ui/EvidenceLab'
import { AuditTrail } from './components/ui/AuditTrail'
import { VerificationEngine } from './components/ui/VerificationEngine'
import { BlockchainLedger } from './components/ui/BlockchainLedger'
import { getCurrentRole } from './utils/auth'

function App() {
  const role = getCurrentRole()
  const homeRoute = role ? '/dashboard' : '/login'

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['forensic-investigator', 'forensic-auditor']}>
            <ShellLayout>
              <Dashboard />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute allowedRoles={['forensic-investigator', 'forensic-auditor']}>
            <ShellLayout>
              <CaseManagement />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evidence"
        element={
          <ProtectedRoute allowedRoles={['forensic-investigator']}>
            <ShellLayout>
              <EvidenceLab />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-trail"
        element={
          <ProtectedRoute allowedRoles={['forensic-investigator']}>
            <ShellLayout>
              <AuditTrail />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/verification"
        element={
          <ProtectedRoute allowedRoles={['forensic-auditor']}>
            <ShellLayout>
              <VerificationEngine />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ledger"
        element={
          <ProtectedRoute allowedRoles={['forensic-auditor']}>
            <ShellLayout>
              <BlockchainLedger />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={homeRoute} replace />} />
      <Route path="*" element={<Navigate to={homeRoute} replace />} />
    </Routes>
  )
}

export default App
