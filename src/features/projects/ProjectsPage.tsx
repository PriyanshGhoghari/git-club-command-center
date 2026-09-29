import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { formatClubDate } from "@/domain/dates"
import { getFilteredProjects, getLeadName, type ProjectFilters } from "@/domain/selectors"
import type { ProjectCategory, ProjectStatus } from "@/domain/types"
import { FilterSelect, ListEmptyState, ResultsSummary, SearchField } from "@/shared/ListFilters"
import { RecordDetailSheet } from "@/shared/RecordDetailSheet"
import { useApp } from "@/state/app-context"
import { cardInteraction, listGroup, pageGroup, reveal } from "@/shared/motion-system"

const initialFilters: ProjectFilters = { query: "", category: "all", status: "all" }
const statusOrder: ProjectStatus[] = ["Planning", "Active", "Completed"]
const statusMarker: Record<ProjectStatus, string> = {
  Planning: "bg-[var(--chart-3)]",
  Active: "bg-[var(--chart-2)]",
  Completed: "bg-[var(--chart-5)]",
}

export function ProjectsPage() {
  const { state, now } = useApp()
  const reducedMotion = useReducedMotion() ?? false
  const revealMotion = reveal(reducedMotion)
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const categories = [...new Set(state.projects.map((project) => project.category))].sort()
  const projects = getFilteredProjects(state.projects, filters)
  const filtered = filters.query.trim() !== "" || filters.category !== "all" || filters.status !== "all"
  const clear = () => setFilters(initialFilters)

  return <motion.section variants={pageGroup} initial="hidden" animate="visible" className="flex flex-col gap-5">
    <motion.div variants={revealMotion} className="page-intro">
      <p className="page-kicker">Club work</p>
      <h1 className="page-title">Projects</h1>
    </motion.div>

    <motion.div variants={revealMotion} className="workspace-panel p-4">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
        <SearchField id="project-search" label="Project title" value={filters.query} onChange={(query) => setFilters({ ...filters, query })} />
        <FilterSelect id="project-category" label="Category" value={filters.category} onChange={(category) => setFilters({ ...filters, category: category as ProjectCategory | "all" })}
          options={[{ value: "all", label: "All categories" }, ...categories.map((category) => ({ value: category, label: category }))]} />
        <FilterSelect id="project-status" label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status: status as ProjectFilters["status"] })}
          options={["all", "Planning", "Active", "Completed"].map((status) => ({ value: status, label: status === "all" ? "All status" : status }))} />
      </div>
    </motion.div>

    <motion.div variants={revealMotion}><ResultsSummary shown={projects.length} total={state.projects.length} noun="projects" filtered={filtered} onClear={clear} /></motion.div>
    {projects.length === 0 ? <ListEmptyState noun="projects" total={state.projects.length} filtered={filtered} onClear={clear} /> :
      <motion.div variants={listGroup} className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statusOrder.filter((status) => projects.some((project) => project.status === status)).map((status) => {
          const laneProjects = projects.filter((project) => project.status === status)
          return <motion.section variants={revealMotion} key={status} aria-label={`${status} projects`} className="min-w-0 rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2 px-1 pb-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden="true" className={`size-2 rounded-full ${statusMarker[status]}`} />{status}</h2><span className="status-tag tabular-nums">{laneProjects.length}</span></div>
            <ul className="flex flex-col gap-2">{laneProjects.map((project) => <li key={project.id}>
              <motion.button type="button" {...cardInteraction(reducedMotion)} onClick={() => setSelectedId(project.id)} className="workspace-panel interactive-card group flex w-full flex-col items-start gap-3 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span className="flex w-full items-start justify-between gap-2"><span className="font-semibold leading-snug group-hover:text-primary">{project.title}</span><ArrowRight aria-hidden="true" className="motion-arrow mt-0.5 size-4 shrink-0 text-muted-foreground" /></span>
                <span className="text-xs text-muted-foreground">{project.category}</span>
                <span className="w-full border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Lead: {getLeadName(project.leadMemberId, project.externalLeadName, state.members)}<br />{project.targetDate ? `Target ${formatClubDate(project.targetDate)}` : "No target date"} / {project.memberIds.length} team members</span>
              </motion.button>
            </li>)}</ul>
          </motion.section>
        })}
      </motion.div>}
    <RecordDetailSheet selected={selectedId ? { type: "project", id: selectedId } : null} onClose={() => setSelectedId(null)} state={state} now={now} />
  </motion.section>
}
