import { OSShell } from './OSShell'
import { Dashboard } from '../ui/Dashboard'
import { EvidenceLab } from '../ui/EvidenceLab'
import { VerificationEngine } from '../ui/VerificationEngine'
import type { ReactNode } from 'react'

export function ShellLayout({ children }: { children?: ReactNode }) {
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
