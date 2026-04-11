
import { OSShell } from './components/layout/OSShell'
import { Dashboard } from './components/ui/Dashboard'
import { EvidenceLab } from './components/ui/EvidenceLab'
import { VerificationEngine } from './components/ui/VerificationEngine'


function App() {
  return (
    <OSShell>
      {(activeModule) => {
        switch (activeModule) {
          case 'dashboard':
            return <Dashboard />
          case 'evidence':
            return <EvidenceLab />
          case 'verification':
            return <VerificationEngine />
          case 'ledger':
            return null // Handled in 3D MainScene
          default:
            return <Dashboard />
        }
      }}
    </OSShell>
  )
}

export default App
