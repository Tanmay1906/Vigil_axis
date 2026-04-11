import { create } from 'zustand'

export interface ForensicEvent {
  id: string
  timestamp: number
  type: 'INFO' | 'WARN' | 'CRITICAL' | 'SCANNED'
  message: string
}

export interface VigilState {
  systemHealth: number
  activeInvestigationID: string | null
  evidenceLog: ForensicEvent[]
  isScanning: boolean
  setSystemHealth: (health: number) => void
  setActiveInvestigation: (id: string | null) => void
  addEvent: (event: Omit<ForensicEvent, 'id' | 'timestamp'>) => void
  setIsScanning: (scanning: boolean) => void
}

export const useVigilStore = create<VigilState>((set) => ({
  systemHealth: 100,
  activeInvestigationID: null,
  evidenceLog: [],
  isScanning: false,
  setSystemHealth: (health) => set({ systemHealth: Math.max(0, Math.min(100, health)) }),
  setActiveInvestigation: (id) => set({ activeInvestigationID: id }),
  addEvent: (event) => set((state) => ({
    evidenceLog: [
      { ...event, id: crypto.randomUUID(), timestamp: Date.now() },
      ...state.evidenceLog
    ]
  })),
  setIsScanning: (scanning) => set({ isScanning: scanning })
}))
