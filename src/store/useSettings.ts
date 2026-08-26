import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface State {
  /** who the gifts are for; fills in the default copy */
  partner: string
  /** where the share button sends the link */
  whatsapp: string
  setPartner: (name: string) => void
  setWhatsapp: (number: string) => void
}

export const useSettings = create<State>()(
  persist(
    (set) => ({
      partner: '',
      whatsapp: '',
      setPartner: (partner) => set({ partner }),
      setWhatsapp: (whatsapp) => set({ whatsapp }),
    }),
    { name: 'dates-settings' },
  ),
)
