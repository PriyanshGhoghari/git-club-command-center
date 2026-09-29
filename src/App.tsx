import { Navigate, Route, Routes } from "react-router"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { EventsPage } from "@/features/events/EventsPage"
import { MembersPage } from "@/features/members/MembersPage"
import { ProjectsPage } from "@/features/projects/ProjectsPage"
import { AppShell } from "@/shared/AppShell"
import { useApp } from "@/state/app-context"

function MembersRoute() {
  const { state } = useApp()
  return state.role === "member" ? <Navigate to="/" replace /> : <MembersPage />
}

function NotFoundPage() {
  return (
    <section className="page-intro">
      <p className="page-kicker">Page not found</p>
      <h1 className="page-title">This page is outside the Command Center.</h1>
      <p className="page-description">Use the navigation to return to club activity.</p>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/members" element={<MembersRoute />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
