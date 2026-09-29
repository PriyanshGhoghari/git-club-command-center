import { useLayoutEffect, useState } from "react"
import { Link, NavLink, useLocation, useOutlet } from "react-router"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Moon,
  RotateCcw,
  Sun,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { PreviewRole } from "@/domain/types"
import { useApp } from "@/state/app-context"
import { NotificationCenter } from "@/features/notifications/NotificationCenter"
import { motionEase, motionTiming } from "./motion-system"

interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
  hiddenForMember?: boolean
}

const navigation: NavigationItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Events", to: "/events", icon: CalendarDays },
  { label: "Members", to: "/members", icon: Users, hiddenForMember: true },
  { label: "Projects", to: "/projects", icon: FolderKanban },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 rounded-lg text-sidebar-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sidebar-ring">
      <img src="/git-club-logo.jpg" alt="" width="42" height="42" className="size-10 shrink-0 rounded-full border border-sidebar-border bg-white object-cover" />
      <span className="min-w-0 leading-tight">
        <strong className="block text-sm font-bold">Git Club</strong>
        <small className="block text-xs text-sidebar-foreground/60">CHARUSAT</small>
      </span>
    </Link>
  )
}

function Navigation({ desktop = false, onNavigate }: { desktop?: boolean; onNavigate?: () => void }) {
  const { state } = useApp()
  const reducedMotion = useReducedMotion()
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navigation
        .filter((item) => !item.hiddenForMember || state.role !== "member")
        .map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={desktop ? label : undefined}
            aria-label={desktop ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                desktop ? "justify-center xl:justify-start" : "",
                isActive
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              ].join(" ")
            }
          >
            {({ isActive }) => <>
              {isActive && <motion.span aria-hidden="true" layoutId={desktop ? "desktop-nav-active" : "mobile-nav-active"} className="absolute inset-0 rounded-lg border-l-2 border-sidebar-primary bg-sidebar-accent" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }} />}
              <Icon aria-hidden="true" className="relative z-10 size-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
              <span className={`relative z-10 ${desktop ? "hidden xl:inline" : ""}`}>{label}</span>
            </>}
          </NavLink>
        ))}
    </nav>
  )
}

function ResetControl() {
  const { dispatch } = useApp()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset demo data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset this demo?</AlertDialogTitle>
          <AlertDialogDescription>
            This restores the sample records and clears local changes and read notifications. Your theme stays the same.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my changes</AlertDialogCancel>
          <AlertDialogAction onClick={() => dispatch({ type: "reset-demo", now: new Date() })}>
            Reset demo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AppShell() {
  const { state, dispatch, toast } = useApp()
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const reducedMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg">Skip to main content</a>
      <div className="flex min-h-screen">
        <aside className="hidden w-20 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-6 text-sidebar-foreground md:flex xl:w-60 xl:px-5">
          <div className="hidden xl:block"><Brand /></div>
          <img src="/git-club-logo.jpg" alt="Git Club" width="40" height="40" className="mx-auto size-10 rounded-full border border-sidebar-border bg-white object-cover xl:hidden" />
          <div className="mt-12">
            <p className="mb-3 hidden px-3 text-xs font-medium text-sidebar-foreground/45 xl:block">Workspace</p>
            <Navigation desktop />
          </div>
          <div className="mt-auto hidden border-t border-sidebar-border pt-5 xl:block">
            <p className="text-xs font-medium text-sidebar-foreground/85">Demo workspace</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-17 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-8">
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="size-10 sm:size-11" aria-label="Open navigation">
                    <Menu aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground">
                  <SheetHeader>
                    <SheetTitle><Brand /></SheetTitle>
                    <SheetDescription>Club operations demo</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 py-4"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-semibold">Command Center</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
              <NotificationCenter />
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <label className="sr-only text-xs font-medium text-muted-foreground sm:not-sr-only" htmlFor="role-preview">Preview as</label>
                <select
                  id="role-preview"
                  value={state.role}
                  onChange={(event) => dispatch({ type: "set-role", role: event.target.value as PreviewRole })}
                  className="h-9 max-w-28 rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-11 sm:max-w-none sm:text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="event-lead">Event Lead</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="theme-toggle size-10 sm:size-11"
                aria-label={state.theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
                onClick={() => dispatch({ type: "set-theme", theme: state.theme === "light" ? "dark" : "light" })}
              >
                {state.theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
              </Button>
            </div>
          </header>

          {state.storageNotice && (
            <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 sm:px-6 lg:px-8">
              {state.storageNotice}
            </div>
          )}

          <main id="main-content" tabIndex={-1} className="workspace-main relative mx-auto max-w-7xl scroll-mt-20 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={pathname} className="relative" initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : motionTiming.page, ease: motionEase }}>{outlet}</motion.div>
            </AnimatePresence>
          </main>
          <footer className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-border px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>Git Club CHARUSAT · Command Center demo</span>
            <ResetControl />
          </footer>
          {toast && <div role="status" className="toast-enter fixed bottom-5 right-5 z-[80] max-w-[calc(100vw-2.5rem)] rounded-lg border border-border bg-popover px-4 py-3 text-sm font-medium text-popover-foreground shadow-lg">{toast}</div>}
        </div>
      </div>
    </div>
  )
}
