
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ShellLayout } from './components/layout/ShellLayout'
import { Login } from './components/ui/Login'
import { Dashboard } from './components/ui/Dashboard'
import { EvidenceLab } from './components/ui/EvidenceLab'
import { VerificationEngine } from './components/ui/VerificationEngine'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ShellLayout>
              <Dashboard />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/evidence"
        element={
          <ProtectedRoute>
            <ShellLayout>
              <EvidenceLab />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/verification"
        element={
          <ProtectedRoute>
            <ShellLayout>
              <VerificationEngine />
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <ShellLayout>
              <div className="h-full rounded-3xl border border-cyan-400/20 bg-slate-950/90 p-6 text-slate-100 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)]">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Ledger Module</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Blockchain Ledger Visualizer</h2>
                <p className="mt-2 text-sm text-slate-300">Ledger chain rendering is active in the 3D scene. Use this module to inspect immutable custody records.</p>
              </div>
            </ShellLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
