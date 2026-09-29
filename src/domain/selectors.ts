import type { AppState, ClubEvent, ClubProject, EventCategory, Member, MemberStatus, ProjectCategory, ProjectStatus } from "./types"
import { clubDateKey } from "./dates"

export type EventLifecycle = "Upcoming" | "Ongoing" | "Completed" | "Cancelled"

export function getEventLifecycle(event: ClubEvent, now: Date): EventLifecycle {
  if (event.cancelled) return "Cancelled"
  if (new Date(event.startsAt).getTime() > now.getTime()) return "Upcoming"
  if (new Date(event.endsAt).getTime() > now.getTime()) return "Ongoing"
  return "Completed"
}

export function getUpcomingEvents(events: ClubEvent[], now: Date): ClubEvent[] {
  return events
    .filter((event) => getEventLifecycle(event, now) === "Upcoming")
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
}

export function getActiveProjects(projects: ClubProject[]): ClubProject[] {
  return projects.filter((project) => project.status === "Active")
}

export function getDashboardMetrics(state: AppState, now: Date) {
  return {
    activeMembers: state.members.filter((member) => member.status === "Active").length,
    upcomingEvents: getUpcomingEvents(state.events, now).length,
    activeProjects: getActiveProjects(state.projects).length,
    registrations: state.events
      .filter((event) => !event.cancelled && event.participationTracked !== false)
      .reduce((total, event) => total + event.registeredCount, 0),
  }
}

export function getLeadName(
  leadMemberId: string | undefined,
  externalLeadName: string | undefined,
  members: Member[],
): string {
  return members.find((member) => member.id === leadMemberId)?.name
    ?? externalLeadName
    ?? "Unassigned"
}

export interface EventFilters {
  query: string
  category: EventCategory | "all"
  status: EventLifecycle | "all"
}

export interface MemberFilters {
  query: string
  team: string
  status: MemberStatus | "all"
}

export interface ProjectFilters {
  query: string
  category: ProjectCategory | "all"
  status: ProjectStatus | "all"
}

export function getFilteredEvents(events: ClubEvent[], filters: EventFilters, now: Date): ClubEvent[] {
  const query = filters.query.trim().toLocaleLowerCase()
  const rank: Record<EventLifecycle, number> = { Ongoing: 0, Upcoming: 1, Completed: 2, Cancelled: 3 }
  return events
    .filter((event) => event.title.toLocaleLowerCase().includes(query)
      && (filters.category === "all" || event.category === filters.category)
      && (filters.status === "all" || getEventLifecycle(event, now) === filters.status))
    .sort((first, second) => {
      const firstStatus = getEventLifecycle(first, now)
      const secondStatus = getEventLifecycle(second, now)
      return rank[firstStatus] - rank[secondStatus]
        || (firstStatus === "Completed" || firstStatus === "Cancelled"
          ? second.startsAt.localeCompare(first.startsAt)
          : first.startsAt.localeCompare(second.startsAt))
    })
}

export function getFilteredMembers(members: Member[], filters: MemberFilters): Member[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return members
    .filter((member) => member.name.toLocaleLowerCase().includes(query)
      && (filters.team === "all" || member.team === filters.team)
      && (filters.status === "all" || member.status === filters.status))
    .sort((first, second) => first.name.localeCompare(second.name))
}

export function getFilteredProjects(projects: ClubProject[], filters: ProjectFilters): ClubProject[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return projects
    .filter((project) => project.title.toLocaleLowerCase().includes(query)
      && (filters.category === "all" || project.category === filters.category)
      && (filters.status === "all" || project.status === filters.status))
    .sort((first, second) => first.title.localeCompare(second.title))
}

export type ParticipationRange = "90d" | "12m" | "all"

export function getParticipationData(events: ClubEvent[], now: Date, range: ParticipationRange, category: EventCategory | "all") {
  const [year, month, day] = clubDateKey(now).split("-").map(Number)
  const from = range === "all" ? -Infinity : range === "90d"
    ? Date.UTC(year, month - 1, day - 90) - 330 * 60_000
    : Date.UTC(year - 1, month - 1, day) - 330 * 60_000
  return events
    .filter((event) => event.participationTracked !== false && getEventLifecycle(event, now) === "Completed"
      && new Date(event.endsAt).getTime() >= from
      && (category === "all" || event.category === category))
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
    .map((event) => ({ id: event.id, title: event.title, registered: event.registeredCount, attended: Math.min(event.attendedCount, event.registeredCount) }))
}

export function getTeamComposition(members: Member[]) {
  const counts = new Map<string, number>()
  for (const member of members) {
    if (member.status === "Active") counts.set(member.team, (counts.get(member.team) ?? 0) + 1)
  }
  return [...counts].map(([team, count]) => ({ team, count }))
    .sort((first, second) => second.count - first.count || first.team.localeCompare(second.team))
}

export function getProjectStatusCounts(projects: ClubProject[]) {
  return (["Planning", "Active", "Completed"] as const).map((status) => ({
    status,
    count: projects.filter((project) => project.status === status).length,
  }))
}
