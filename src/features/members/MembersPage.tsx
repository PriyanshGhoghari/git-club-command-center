import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { getFilteredMembers, type MemberFilters } from "@/domain/selectors"
import { FilterSelect, ListEmptyState, ResultsSummary, SearchField } from "@/shared/ListFilters"
import { RecordDetailSheet } from "@/shared/RecordDetailSheet"
import { useApp } from "@/state/app-context"
import { cardInteraction, listGroup, pageGroup, reveal } from "@/shared/motion-system"

const initialFilters: MemberFilters = { query: "", team: "all", status: "all" }

export function MembersPage() {
  const { state, now } = useApp()
  const reducedMotion = useReducedMotion() ?? false
  const revealMotion = reveal(reducedMotion)
  const [filters, setFilters] = useState<MemberFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const teams = [...new Set(state.members.map((member) => member.team))].sort()
  const members = getFilteredMembers(state.members, filters)
  const filtered = filters.query.trim() !== "" || filters.team !== "all" || filters.status !== "all"
  const clear = () => setFilters(initialFilters)

  return <motion.section variants={pageGroup} initial="hidden" animate="visible" className="flex flex-col gap-5">
    <motion.div variants={revealMotion} className="page-intro">
      <p className="page-kicker">People of Git Club</p>
      <h1 className="page-title">Members</h1>
    </motion.div>

    <motion.div variants={revealMotion} className="workspace-panel p-4">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
        <SearchField id="member-search" label="Member name" value={filters.query} onChange={(query) => setFilters({ ...filters, query })} />
        <FilterSelect id="member-team" label="Team" value={filters.team} onChange={(team) => setFilters({ ...filters, team })}
          options={[{ value: "all", label: "All teams" }, ...teams.map((team) => ({ value: team, label: team }))]} />
        <FilterSelect id="member-status" label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status: status as MemberFilters["status"] })}
          options={[{ value: "all", label: "All status" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
      </div>
    </motion.div>

    <motion.div variants={revealMotion}><ResultsSummary shown={members.length} total={state.members.length} noun="members" filtered={filtered} onClear={clear} /></motion.div>
    {members.length === 0 ? <ListEmptyState noun="members" total={state.members.length} filtered={filtered} onClear={clear} /> :
      <motion.ul variants={listGroup} className="grid gap-3 md:grid-cols-2">
        {members.map((member) => <motion.li variants={revealMotion} key={member.id}>
          <motion.button type="button" {...cardInteraction(reducedMotion)} onClick={() => setSelectedId(member.id)} className="workspace-panel interactive-card group flex h-full w-full items-start gap-4 p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {member.avatar ? <img src={member.avatar} alt="" width="48" height="48" loading="lazy" className="size-12 shrink-0 rounded-full object-cover" /> :
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold group-hover:text-primary">{member.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{member.clubRole}</span>
              <span className="mt-3 flex flex-wrap items-center gap-2"><span className="status-tag">{member.team}</span><span className="text-xs text-muted-foreground">Year {member.year} / {member.branch}</span></span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-3"><span className="text-xs font-medium text-muted-foreground">{member.status}</span><ArrowRight aria-hidden="true" className="motion-arrow size-4 text-muted-foreground" /></span>
          </motion.button>
        </motion.li>)}
      </motion.ul>}
    <RecordDetailSheet selected={selectedId ? { type: "member", id: selectedId } : null} onClose={() => setSelectedId(null)} state={state} now={now} />
  </motion.section>
}
