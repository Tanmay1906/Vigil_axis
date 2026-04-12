import { useLocation } from 'react-router-dom'
import { OSShell } from './OSShell'
import { Dashboard } from '../ui/Dashboard'
import { EvidenceLab } from '../ui/EvidenceLab'
import { VerificationEngine } from '../ui/VerificationEngine'

export function ShellLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()

  // Get active module from URL path
  const getActiveModule = () => {
    if (location.pathname.includes('evidence')) return 'evidence'
    if (location.pathname.includes('verification')) return 'verification'
    return 'dashboard'
  }

  return (
    <OSShell>
      {(activeModule) => {
        if (children) return children

        switch (activeModule) {
          case 'evidence':
            return <EvidenceLab />
          case 'verification':
            return <VerificationEngine />
          case 'dashboard':
          default:
            return <Dashboard />
        }
      }}
    </OSShell>
  )
}
