import { createContext, useContext, useEffect, useReducer, useState } from "react"
import type { ReactNode } from "react"
import type { AppState } from "@/domain/types"
import { appReducer, type AppAction } from "./reducer"
import { loadAppState, saveAppState } from "./persistence"
import { getNotifications } from "@/domain/notifications"

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  now: Date
  toast: string | null
  notify: (message: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => loadAppState())
  const [now, setNow] = useState(() => new Date())
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark")
    document.documentElement.style.colorScheme = state.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", state.theme === "dark" ? "#211f1b" : "#f6f7f4")
  }, [state.theme])

  useEffect(() => {
    if (!state.storageAvailable) return
    if (!saveAppState(state)) dispatch({ type: "storage-unavailable" })
  }, [state])

  useEffect(() => {
    const validIds = new Set(getNotifications({ ...state, role: "admin" }, now).map((item) => item.id))
    if (state.readNoticeIds.some((id) => !validIds.has(id))) {
      dispatch({ type: "prune-read-notices", validIds: [...validIds] })
    }
  }, [state, now])

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [])

  return <AppContext.Provider value={{ state, dispatch, now, toast, notify: setToast }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
