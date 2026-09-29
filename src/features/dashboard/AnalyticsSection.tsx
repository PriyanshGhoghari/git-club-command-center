import { useState } from "react"
import { useReducedMotion } from "motion/react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EVENT_LEAD_PREVIEW_ID } from "@/data/seeds/members"
import { formatClubDate } from "@/domain/dates"
import { getEventLifecycle, getProjectStatusCounts } from "@/domain/selectors"
import type { AppState } from "@/domain/types"

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]
const participationConfig = {
  registered: { label: "Registered", color: "var(--chart-1)" },
  attended: { label: "Attended", color: "var(--chart-2)" },
} satisfies ChartConfig
const projectConfig = {
  Planning: { label: "Planning", color: "var(--chart-1)" },
  Active: { label: "Active", color: "var(--chart-2)" },
  Completed: { label: "Completed", color: "var(--chart-3)" },
} satisfies ChartConfig

export function AnalyticsSection({ state, now }: { state: AppState; now: Date }) {
  const reducedMotion = useReducedMotion() ?? false
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null)
  if (state.role === "member") return null

  const events = state.role === "event-lead" ? state.events.filter((event) => event.leadMemberId === EVENT_LEAD_PREVIEW_ID) : state.events
  const completed = events
    .filter((event) => event.participationTracked !== false && getEventLifecycle(event, now) === "Completed")
    .sort((first, second) => second.startsAt.localeCompare(first.startsAt))
    .slice(0, 5)
    .reverse()
  const chartData = completed.map((event) => ({
    title: event.title,
    date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(event.startsAt)),
    fullDate: formatClubDate(event.startsAt),
    registered: event.registeredCount,
    attended: Math.min(event.attendedCount, event.registeredCount),
  }))
  const chartMax = Math.max(10, ...chartData.map((event) => Math.max(event.registered, event.attended)))
  const projectStatuses = getProjectStatusCounts(state.projects)
  const visibleStatuses = projectStatuses.filter((item) => item.count > 0)
  const focusedStatus = hoveredStatus ?? activeStatus
  const active = projectStatuses.find((item) => item.status === focusedStatus)

  return <div className={`grid items-start gap-4 ${state.role === "admin" ? "lg:grid-cols-2" : ""}`}>
    <section className="participation-panel workspace-panel min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Event participation</h2>
        </div>
      </div>
      {chartData.length ? <ChartContainer config={participationConfig} className="h-64 w-full aspect-auto px-4 py-3">
        <BarChart accessibilityLayer data={chartData} barCategoryGap="24%" barGap={5} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="date" tickLine={false} tickMargin={9} axisLine={false} interval="preserveStartEnd" tick={{ fontSize: 11 }} />
          <YAxis type="number" domain={[0, Math.ceil(chartMax / 25) * 25]} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
          <ChartTooltip isAnimationActive={false} cursor={{ fill: "var(--muted)", opacity: 0.4 }} itemSorter={(item) => item.dataKey === "registered" ? 0 : 1} content={<ChartTooltipContent className="max-w-64 whitespace-normal" labelFormatter={(_, payload) => <span className="grid gap-0.5 leading-snug"><span className="max-w-56 whitespace-normal">{payload[0]?.payload?.title}</span><span className="font-normal text-muted-foreground">{payload[0]?.payload?.fullDate}</span></span>} />} />
          <Bar dataKey="registered" fill="var(--color-registered)" radius={[4, 4, 0, 0]} maxBarSize={34} isAnimationActive={!reducedMotion} animationDuration={reducedMotion ? 0 : 650} />
          <Bar dataKey="attended" fill="var(--color-attended)" radius={[4, 4, 0, 0]} maxBarSize={34} isAnimationActive={!reducedMotion} animationDuration={reducedMotion ? 0 : 650} />
        </BarChart>
      </ChartContainer> : <p className="px-5 py-10 text-sm text-muted-foreground">No completed events with reported participation yet.</p>}
      {chartData.length > 0 && <ul className="flex items-center justify-center gap-5 pb-4 text-xs text-muted-foreground"><li className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-sm bg-[var(--chart-1)]" />Registered</li><li className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-sm bg-[var(--chart-2)]" />Attended</li></ul>}
    </section>

    {state.role === "admin" && <section className="workspace-panel min-w-0 self-start">
      <div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold tracking-tight">Project distribution</h2></div>
      {state.projects.length ? <>
        <div className="relative min-w-0" role="img" aria-label={`Project status chart for ${state.projects.length} projects`}>
          <ChartContainer config={projectConfig} className="h-52 w-full aspect-auto px-4">
            <PieChart accessibilityLayer><ChartTooltip isAnimationActive={false} content={<ChartTooltipContent nameKey="status" labelFormatter={(_, payload) => payload[0]?.payload?.status ?? ""} formatter={(value) => { const count = Number(value); return <span className="font-mono font-medium tabular-nums text-foreground">{count.toLocaleString()} {count === 1 ? "project" : "projects"}</span> }} />} /><Pie data={visibleStatuses} dataKey="count" nameKey="status" innerRadius="56%" outerRadius="76%" paddingAngle={2} stroke="var(--card)" animationBegin={0} animationDuration={reducedMotion ? 0 : 650} isAnimationActive={!reducedMotion} onMouseEnter={(_, index) => setHoveredStatus(visibleStatuses[index]?.status ?? null)} onMouseLeave={() => setHoveredStatus(null)}>{visibleStatuses.map((item) => <Cell key={item.status} fill={chartColors[projectStatuses.findIndex((status) => status.status === item.status)]} opacity={focusedStatus === null || focusedStatus === item.status ? 1 : 0.42} className="chart-sector" />)}</Pie></PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
            <div className="text-center"><strong className="block text-3xl font-semibold tabular-nums">{active?.count ?? state.projects.length}</strong><span className="text-xs text-muted-foreground">{active?.status ?? "Projects"}</span></div>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-1.5 px-5 pb-5 text-sm">{projectStatuses.map((item, index) => <li key={item.status}><button type="button" aria-pressed={activeStatus === item.status} onClick={() => setActiveStatus(activeStatus === item.status ? null : item.status)} onMouseEnter={() => setHoveredStatus(item.status)} onMouseLeave={() => setHoveredStatus(null)} onFocus={() => setHoveredStatus(item.status)} onBlur={() => setHoveredStatus(null)} className={`flex min-h-10 w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${focusedStatus === item.status ? "bg-muted" : ""}`}><span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: chartColors[index] }} /><span className="min-w-0 flex-1">{item.status}</span><strong className="tabular-nums">{item.count}</strong></button></li>)}</ul>
      </> : <p className="px-5 py-10 text-sm text-muted-foreground">No projects to chart yet.</p>}
    </section>}
  </div>
}
