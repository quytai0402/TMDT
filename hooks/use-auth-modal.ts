"use client"

import { create } from "zustand"

type AuthTab = "login" | "register" | "forgot"

interface AuthModalStore {
  isOpen: boolean
  defaultTab: AuthTab
  openLogin: () => void
  openRegister: () => void
  openForgot: () => void
  close: () => void
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  defaultTab: "login",
  openLogin: () => set({ isOpen: true, defaultTab: "login" }),
  openRegister: () => set({ isOpen: true, defaultTab: "register" }),
  openForgot: () => set({ isOpen: true, defaultTab: "forgot" }),
  close: () => set({ isOpen: false, defaultTab: "login" }), // Reset to login tab when closing
}))
