import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, FolderKanban, TicketCheck, Users } from "lucide-react"
import { getAttentionItems } from "@/domain/attention"
import { formatClubDateTime, formatEventStart } from "@/domain/dates"
import { getDashboardMetrics, getProjectStatusCounts, getTeamComposition, getUpcomingEvents } from "@/domain/selectors"
import { RecordDetailSheet, type SelectedRecord } from "@/shared/RecordDetailSheet"
import { useApp } from "@/state/app-context"
import { QuickActions } from "./QuickActions"
import { EVENT_LEAD_PREVIEW_ID, MEMBER_PREVIEW_ID } from "@/data/seeds/members"
import { AnimatedCounter } from "@/shared/AnimatedCounter"
import { cardInteraction, pageGroup, reveal } from "@/shared/motion-system"

const AnalyticsSection = lazy(() => import("./AnalyticsSection").then((module) => ({ default: module.AnalyticsSection })))

function SectionHeading({ title, to, linkLabel, count }: { title: string; to?: string; linkLabel?: string; count?: number }) {
  return <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
    <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">{title}{count !== undefined && <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary">{count}</span>}</h2>
    {to && <Link to={to} className="section-link inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{linkLabel}<ArrowUpRight aria-hidden="true" className="size-4" /></Link>}
  </div>
}

export function DashboardPage() {
  const { state, now } = useApp()
  const reducedMotion = useReducedMotion() ?? false
  const revealMotion = reveal(reducedMotion)
  const [selected, setSelected] = useState<SelectedRecord>(null)
  const metrics = getDashboardMetrics(state, now)
  const attention = getAttentionItems(state, now)
  const assignedEvents = state.events.filter((event) => event.leadMemberId === EVENT_LEAD_PREVIEW_ID)
  const relevantProjects = state.projects.filter((project) => project.leadMemberId === MEMBER_PREVIEW_ID || project.memberIds.includes(MEMBER_PREVIEW_ID))
  const upcoming = getUpcomingEvents(state.role === "event-lead" ? assignedEvents : state.events, now).slice(0, 3)
  const teams = getTeamComposition(state.members)
  const projectStatuses = getProjectStatusCounts(state.projects)
  const announcements = [...state.announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2)
  const activity = [...state.activity]
    .filter((item) => state.role === "admin" || (state.role === "event-lead" && item.entityType === "event" && assignedEvents.some((event) => event.id === item.entityId)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  const adminCards = [
    { label: "Active members", value: metrics.activeMembers, icon: Users },
    { label: "Upcoming events", value: metrics.upcomingEvents, icon: CalendarDays },
    { label: "Active projects", value: metrics.activeProjects, icon: FolderKanban },
    { label: "Sample registrations", value: metrics.registrations, icon: TicketCheck },
  ]
  const leadCards = [
    { label: "Assigned events", value: assignedEvents.length, icon: CalendarDays },
    { label: "Upcoming assigned", value: getUpcomingEvents(assignedEvents, now).length, icon: CalendarDays },
    { label: "Sample registrations", value: assignedEvents.filter((event) => !event.cancelled && event.participationTracked !== false).reduce((sum, event) => sum + event.registeredCount, 0), icon: TicketCheck },
    { label: "Sample attendance", value: assignedEvents.filter((event) => event.participationTracked !== false).reduce((sum, event) => sum + event.attendedCount, 0), icon: Users },
  ]
  const memberCards = [
    { label: "Upcoming events", value: metrics.upcomingEvents, icon: CalendarDays },
    { label: "Active projects", value: metrics.activeProjects, icon: FolderKanban },
    { label: "Your projects", value: relevantProjects.length, icon: FolderKanban },
  ]
  const cards = state.role === "admin" ? adminCards : state.role === "event-lead" ? leadCards : memberCards
  const featured = upcoming[0]
  const featuredDate = featured ? new Date(featured.startsAt) : null
  const featuredDay = featuredDate ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" }).format(featuredDate) : ""
  const featuredMonth = featuredDate ? new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).format(featuredDate) : ""

  return <motion.div variants={pageGroup} initial="hidden" animate="visible" className="flex flex-col gap-6 lg:gap-7">
    <motion.div variants={revealMotion} className="page-intro flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="page-kicker">Git Club / Command Center</p>
        <h1 className="page-title">Club overview</h1>
      </div>
    </motion.div>

    <motion.section variants={revealMotion} aria-label="Club totals" className={`workspace-panel grid grid-cols-2 ${state.role === "member" ? "sm:grid-cols-3" : "lg:grid-cols-4"}`}>
      {cards.map(({ label, value, icon: Icon }, index) => <div key={label} className={`metric-cell min-w-0 px-4 py-5 sm:px-6 sm:py-6 ${index % 2 === 1 ? "border-l border-border" : ""} ${index > 1 ? "border-t border-border" : ""} ${state.role === "member" ? `${index === 2 ? "col-span-2 sm:col-span-1" : ""} sm:border-t-0 sm:[&:not(:first-child)]:border-l` : "lg:border-t-0 lg:[&:not(:first-child)]:border-l"}`}>
        <div className="flex items-center justify-between gap-2 text-muted-foreground"><span className="text-xs font-medium sm:text-sm">{label}</span><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon aria-hidden="true" className="size-4" /></span></div>
        <strong className="mt-3 block text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"><AnimatedCounter value={value} /></strong>
      </div>)}
    </motion.section>

    <motion.div variants={revealMotion} className={`grid items-start gap-4 ${state.role === "member" ? "" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"}`}>
      {state.role !== "member" && <section className="workspace-panel">
        <SectionHeading title="Needs attention" count={attention.length} />
        {attention.length ? <ul className="divide-y divide-border">
          {attention.map((item) => <li key={item.id}>
            <button type="button" onClick={() => setSelected({ type: item.entityType, id: item.entityId })} className="record-row group min-h-19">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.level === "High" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><CircleAlert aria-hidden="true" className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold group-hover:text-primary">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.reason}</span></span>
              <span className="sr-only">Open {item.entityType} details</span><ChevronRight aria-hidden="true" className="motion-arrow size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>)}
        </ul> : <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground"><CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-[var(--chart-5)]" /><span>No operational items need attention right now.</span></div>}
      </section>}

      <section className="workspace-panel">
        <SectionHeading title="Coming up" to="/events" linkLabel="All events" />
        {featured ? <>
          <motion.button type="button" {...cardInteraction(reducedMotion)} onClick={() => setSelected({ type: "event", id: featured.id })} className="feature-event group relative flex w-full gap-5 p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:p-6">
            <span className="flex w-14 shrink-0 flex-col items-center border-r border-white/20 pr-4 text-center"><span className="text-3xl font-semibold leading-none tabular-nums">{featuredDay}</span><span className="mt-1 text-xs font-semibold uppercase text-white/60">{featuredMonth}</span></span>
            <span className="min-w-0 flex-1"><span className="text-xs font-medium text-white/60">Next event / {featured.category}</span><span className="mt-2 block text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{featured.title}</span><span className="mt-3 block text-xs leading-5 text-white/70">{formatEventStart(featured)}<br />{featured.venue}</span></span>
            <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-white/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </motion.button>
          {upcoming.length > 1 && <ul className="divide-y divide-border">{upcoming.slice(1).map((event) => <li key={event.id}><button type="button" onClick={() => setSelected({ type: "event", id: event.id })} className="record-row group"><span className="min-w-0 flex-1"><span className="block text-sm font-medium group-hover:text-primary">{event.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{formatEventStart(event)}</span></span><ChevronRight aria-hidden="true" className="motion-arrow size-4 shrink-0 text-muted-foreground" /></button></li>)}</ul>}
        </> : <p className="px-5 py-7 text-sm text-muted-foreground">{state.role === "event-lead" ? "No upcoming assigned events." : "No upcoming events are scheduled."}</p>}
      </section>
    </motion.div>

    <motion.div variants={revealMotion}><QuickActions /></motion.div>

    <motion.div variants={revealMotion} className="grid items-start gap-4 md:grid-cols-2">
      {state.role === "admin" && <section className="workspace-panel">
        <SectionHeading title="Team composition" to="/members" linkLabel="Members" />
        {teams.length ? <ul className="divide-y divide-border px-5">{teams.map(({ team, count }) => <li key={team} className="flex items-center gap-4 py-3.5 text-sm"><span className="min-w-0 flex-1 font-medium">{team}</span><span className="w-20 overflow-hidden rounded-full bg-muted"><span className="metric-bar block h-1.5 rounded-full bg-primary" style={{ width: `${Math.round(count / metrics.activeMembers * 100)}%` }} /></span><strong className="w-5 text-right tabular-nums">{count}</strong></li>)}</ul> : <p className="px-5 py-6 text-sm text-muted-foreground">No active members yet.</p>}
      </section>}
      {state.role === "admin" && <section className="workspace-panel">
        <SectionHeading title="Project status" to="/projects" linkLabel="Projects" />
        {state.projects.length ? <ul className="grid grid-cols-3">{projectStatuses.map(({ status, count }) => <li key={status} className="border-r border-border px-5 py-4 last:border-r-0"><strong className="block text-2xl font-semibold tabular-nums">{count}</strong><span className="text-xs text-muted-foreground">{status}</span></li>)}</ul> : <p className="px-5 py-6 text-sm text-muted-foreground">No projects yet.</p>}
      </section>}
      {state.role === "member" && <section className="workspace-panel">
        <SectionHeading title="Your projects" to="/projects" linkLabel="All projects" />
        {relevantProjects.length ? <ul className="divide-y divide-border">{relevantProjects.map((project) => <li key={project.id}><button type="button" onClick={() => setSelected({ type: "project", id: project.id })} className="record-row group"><span className="min-w-0 flex-1"><span className="block text-sm font-medium group-hover:text-primary">{project.title}</span><span className="mt-1 block text-xs text-muted-foreground">{project.status} · {project.category}</span></span><ChevronRight aria-hidden="true" className="motion-arrow size-4 text-muted-foreground" /></button></li>)}</ul> : <p className="px-5 py-6 text-sm text-muted-foreground">No related projects yet.</p>}
      </section>}
      <section className="workspace-panel">
        <SectionHeading title="Announcements" />
        {announcements.length ? <ul className="divide-y divide-border">{announcements.map((item) => <li key={item.id} className="px-5 py-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{item.title}</h3>{item.priority === "Important" && <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Important</span>}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.message}</p><p className="mt-2 text-[11px] text-muted-foreground">{formatClubDateTime(item.createdAt)}</p></li>)}</ul> : <p className="px-5 py-6 text-sm text-muted-foreground">No announcements yet.</p>}
      </section>
      {state.role !== "member" && <section className="workspace-panel">
        <SectionHeading title="Recent activity" />
        {activity.length ? <ol className="divide-y divide-border">{activity.map((item) => <li key={item.id} className="flex gap-3 px-5 py-4"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><span><span className="block text-sm">{item.message}</span><time dateTime={item.createdAt} className="mt-1 block text-xs text-muted-foreground">{formatClubDateTime(item.createdAt)}</time></span></li>)}</ol> : <p className="px-5 py-6 text-sm text-muted-foreground">No activity yet.</p>}
      </section>}
    </motion.div>

    {state.role !== "member" && <motion.div variants={revealMotion}><Suspense fallback={<AnalyticsSkeleton />}><AnalyticsSection state={state} now={now} /></Suspense></motion.div>}

    <RecordDetailSheet selected={selected} onClose={() => setSelected(null)} state={state} now={now} />
  </motion.div>
}

function AnalyticsSkeleton() {
  return <div role="status" aria-label="Loading analytics" className="grid items-start gap-4 lg:grid-cols-2">
    {[0, 1].map((index) => <div key={index} aria-hidden="true" className="workspace-panel p-5">
      <div className="skeleton-shimmer h-5 w-40 rounded bg-muted" />
      <div className={`skeleton-shimmer mt-7 rounded bg-muted ${index === 0 ? "h-40" : "mx-auto size-40 rounded-full"}`} />
    </div>)}
  </div>
}
