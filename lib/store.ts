"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TimeLeftState {
  birthdate: string | null
  lifeExpectancy: number
  setBirthdate: (date: string) => void
  setLifeExpectancy: (years: number) => void
}

export const useStore = create<TimeLeftState>()(
  persist(
    (set) => ({
      birthdate: null,
      lifeExpectancy: 80,
      setBirthdate: (date) => set({ birthdate: date }),
      setLifeExpectancy: (years) => set({ lifeExpectancy: years }),
    }),
    {
      name: "time-left-storage",
    },
  ),
)
