import { clubDateKey } from "./dates"
import { getEventLifecycle } from "./selectors"
import type { AppState, PreviewRole } from "./types"
import { EVENT_LEAD_PREVIEW_ID } from "@/data/seeds/members"

export interface AttentionItem {
  id: string
  entityType: "event" | "project"
  entityId: string
  title: string
  reason: string
  level: "High" | "Normal"
}

function calendarDaysFromToday(value: string, now: Date): number {
  const today = Date.parse(`${clubDateKey(now)}T00:00:00Z`)
  const date = Date.parse(`${clubDateKey(new Date(value))}T00:00:00Z`)
  return Math.round((date - today) / 86_400_000)
}

export function getAttentionItems(state: AppState, now: Date, role: PreviewRole = state.role): AttentionItem[] {
  if (role === "member") return []

  const items: AttentionItem[] = []
  for (const event of state.events) {
    if (role === "event-lead" && event.leadMemberId !== EVENT_LEAD_PREVIEW_ID) continue
    const lifecycle = getEventLifecycle(event, now)
    if (lifecycle === "Cancelled" || lifecycle === "Completed") continue

    if (!event.leadUnspecified && !event.leadMemberId && !event.externalLeadName?.trim()) {
      items.push({ id: `event-no-lead:${event.id}`, entityType: "event", entityId: event.id, title: event.title, reason: "No event lead assigned", level: "High" })
    }

    const deadline = event.registrationClosesAt
    const registrationOpen = !deadline || new Date(deadline).getTime() >= now.getTime()
    if (deadline && registrationOpen && calendarDaysFromToday(deadline, now) <= 3) {
      items.push({ id: `event-registration-closing:${event.id}`, entityType: "event", entityId: event.id, title: event.title, reason: "Registration closes within 3 days", level: "Normal" })
    }

    if (lifecycle === "Upcoming" && registrationOpen && event.participationTracked !== false && event.capacity && event.registeredCount < event.capacity * 0.25 && calendarDaysFromToday(event.startsAt, now) <= 7) {
      items.push({ id: `event-low-registration:${event.id}`, entityType: "event", entityId: event.id, title: event.title, reason: `${event.registeredCount} of ${event.capacity} places filled; event is within 7 days`, level: "Normal" })
    }
  }

  if (role === "admin") {
    for (const project of state.projects) {
      if (project.status === "Completed") continue
      if ((project.status === "Planning" || project.status === "Active") && calendarDaysFromToday(project.updatedAt, now) <= -21) {
        items.push({ id: `project-stale:${project.id}`, entityType: "project", entityId: project.id, title: project.title, reason: "No update in at least 21 days", level: "Normal" })
      }
      if (project.targetDate) {
        const daysLeft = calendarDaysFromToday(project.targetDate, now)
        if (daysLeft >= 0 && daysLeft <= 7) {
          items.push({ id: `project-due-soon:${project.id}`, entityType: "project", entityId: project.id, title: project.title, reason: daysLeft === 0 ? "Target date is today" : `Target date is in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, level: "Normal" })
        }
      }
    }
  }

  return items.sort((first, second) =>
    (first.level === second.level ? first.title.localeCompare(second.title) || first.id.localeCompare(second.id) : first.level === "High" ? -1 : 1),
  )
}
