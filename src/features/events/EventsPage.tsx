import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { formatEventStart } from "@/domain/dates"
import { getEventLifecycle, getFilteredEvents, getLeadName, type EventFilters, type EventLifecycle } from "@/domain/selectors"
import type { EventCategory } from "@/domain/types"
import { FilterSelect, ListEmptyState, ResultsSummary, SearchField } from "@/shared/ListFilters"
import { RecordDetailSheet } from "@/shared/RecordDetailSheet"
import { useApp } from "@/state/app-context"
import { listGroup, pageGroup, reveal } from "@/shared/motion-system"

const initialFilters: EventFilters = { query: "", category: "all", status: "all" }
const lifecycleMarker: Record<EventLifecycle, string> = {
  Upcoming: "bg-[var(--chart-2)]",
  Ongoing: "bg-primary",
  Completed: "bg-[var(--chart-5)]",
  Cancelled: "bg-destructive",
}

export function EventsPage() {
  const { state, now } = useApp()
  const revealMotion = reveal(useReducedMotion() ?? false)
  const [filters, setFilters] = useState<EventFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const categories = [...new Set(state.events.map((event) => event.category))].sort()
  const events = getFilteredEvents(state.events, filters, now)
  const filtered = filters.query.trim() !== "" || filters.category !== "all" || filters.status !== "all"
  const clear = () => setFilters(initialFilters)

  return <motion.section variants={pageGroup} initial="hidden" animate="visible" className="flex flex-col gap-5">
    <motion.div variants={revealMotion} className="page-intro">
      <p className="page-kicker">Club calendar</p>
      <h1 className="page-title">Events</h1>
    </motion.div>

    <motion.div variants={revealMotion} className="workspace-panel p-4">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
        <SearchField id="event-search" label="Event title" value={filters.query} onChange={(query) => setFilters({ ...filters, query })} />
        <FilterSelect id="event-category" label="Category" value={filters.category} onChange={(category) => setFilters({ ...filters, category: category as EventCategory | "all" })}
          options={[{ value: "all", label: "All categories" }, ...categories.map((category) => ({ value: category, label: category }))]} />
        <FilterSelect id="event-status" label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status: status as EventFilters["status"] })}
          options={["all", "Upcoming", "Ongoing", "Completed", "Cancelled"].map((status) => ({ value: status, label: status === "all" ? "All status" : status }))} />
      </div>
    </motion.div>

    <motion.div variants={revealMotion}><ResultsSummary shown={events.length} total={state.events.length} noun="events" filtered={filtered} onClear={clear} /></motion.div>
    {events.length === 0 ? <ListEmptyState noun="events" total={state.events.length} filtered={filtered} onClear={clear} /> :
      <motion.ul variants={listGroup} className="workspace-panel divide-y divide-border">
        {events.map((event) => {
          const lifecycle = getEventLifecycle(event, now)
          const date = new Date(event.startsAt)
          const day = new Intl.DateTimeFormat("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" }).format(date)
          const month = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).format(date)
          return <motion.li variants={revealMotion} key={event.id}>
            <button type="button" onClick={() => setSelectedId(event.id)} className="record-row group gap-3 sm:gap-5">
              <span className="flex w-13 shrink-0 flex-col items-center border-r border-border pr-3 text-center sm:w-16 sm:pr-4"><strong className="text-2xl leading-none tabular-nums">{day}</strong><span className="mt-1 text-xs font-medium text-muted-foreground">{month}</span></span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold group-hover:text-primary">{event.title}</span><span className="status-tag gap-1.5"><span aria-hidden="true" className={`size-1.5 rounded-full ${lifecycleMarker[lifecycle]}`} />{lifecycle}</span></span>
                <span className="mt-1 block text-sm text-muted-foreground">{event.category} / {event.venue}</span>
                <span className="mt-1 block text-xs text-muted-foreground">Lead: {event.leadUnspecified ? "Not provided" : getLeadName(event.leadMemberId, event.externalLeadName, state.members)}</span>
                <span className="mt-1 block text-xs text-muted-foreground md:hidden">{formatEventStart(event)} · {event.participationTracked === false ? "Participation not reported" : `${event.registeredCount} sample registrations`}</span>
              </span>
              <span className="hidden shrink-0 text-right text-sm text-muted-foreground md:block">{formatEventStart(event)}<span className="mt-1 block text-xs">{event.participationTracked === false ? "Participation not reported" : `${event.registeredCount} sample registrations`}</span></span>
              <ArrowRight aria-hidden="true" className="motion-arrow size-4 shrink-0 text-muted-foreground" />
            </button>
          </motion.li>
        })}
      </motion.ul>}
    <RecordDetailSheet selected={selectedId ? { type: "event", id: selectedId } : null} onClose={() => setSelectedId(null)} state={state} now={now} />
  </motion.section>
}
