import { createSeedState, createSeedStateForAnchor, SEED_REVISIONS } from "@/data/seeds"
import { createSeedMembers } from "@/data/seeds/members"
import { createSeedEvents } from "@/data/seeds/events"
import { createSeedProjects } from "@/data/seeds/projects"
import { createSeedAnnouncements } from "@/data/seeds/announcements"
import type {
  Activity,
  Announcement,
  AppState,
  ClubEvent,
  ClubProject,
  Member,
  PreviewRole,
  Theme,
} from "@/domain/types"

const STORAGE_KEY = "git-club-command-center"
const SCHEMA_VERSION = 1

type ObjectLike = Record<string, unknown>

function isObject(value: unknown): value is ObjectLike {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function hasString(record: ObjectLike, key: string): boolean {
  return typeof record[key] === "string"
}

function isMember(value: unknown): value is Member {
  return isObject(value)
    && ["id", "name", "branch", "clubRole", "team", "status", "joinedAt"].every((key) => hasString(value, key))
    && typeof value.year === "number"
    && Array.isArray(value.skills)
}

function isEvent(value: unknown): value is ClubEvent {
  return isObject(value)
    && ["id", "title", "description", "category", "startsAt", "endsAt", "venue"].every((key) => hasString(value, key))
    && typeof value.registeredCount === "number"
    && typeof value.attendedCount === "number"
    && typeof value.cancelled === "boolean"
}

function isProject(value: unknown): value is ClubProject {
  return isObject(value)
    && ["id", "title", "description", "category", "status", "startedAt", "updatedAt"].every((key) => hasString(value, key))
    && ["Planning", "Active", "Blocked", "Completed"].includes(value.status as string)
    && Array.isArray(value.memberIds)
}

function isAnnouncement(value: unknown): value is Announcement {
  return isObject(value)
    && ["id", "title", "message", "priority", "createdAt"].every((key) => hasString(value, key))
}

function isActivity(value: unknown): value is Activity {
  return isObject(value)
    && ["id", "type", "entityType", "entityId", "message", "createdAt"].every((key) => hasString(value, key))
}

function validList<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard)
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark"
}

function isRole(value: unknown): value is PreviewRole {
  return value === "admin" || value === "event-lead" || value === "member"
}

function validAnchor(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function loadAppState(now: Date = new Date()): AppState {
  const fresh = createSeedState(now)
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      ...fresh,
      storageAvailable: false,
      storageNotice: "Browser storage is unavailable. Changes will last only until this page closes.",
    }
  }
  if (!raw) return fresh

  try {
    const stored: unknown = JSON.parse(raw)
    if (!isObject(stored) || stored.schemaVersion !== SCHEMA_VERSION || !validAnchor(stored.seedAnchor)) {
      return { ...fresh, storageNotice: "Saved demo data was reset after an app update." }
    }

    const base = createSeedStateForAnchor(stored.seedAnchor)
    const revisions = isObject(stored.seedRevisions) ? stored.seedRevisions : {}
    const replaced = new Set<string>()

    const members = revisions.members === SEED_REVISIONS.members && validList(stored.members, isMember)
      ? stored.members : createSeedMembers(base.seedAnchor)
    if (members !== stored.members) replaced.add("member")

    const savedEvents = revisions.events === SEED_REVISIONS.events && validList(stored.events, isEvent)
      ? stored.events : null
    const seededEvents = createSeedEvents(base.seedAnchor)
    const seededEventById = new Map(seededEvents.map((event) => [event.id, event]))
    const events = savedEvents
      ? savedEvents.map((event) => {
          const seeded = seededEventById.get(event.id)
          return event.participationTracked === false && seeded && seeded.registeredCount > 0
            ? { ...event, registeredCount: seeded.registeredCount, attendedCount: seeded.attendedCount, participationTracked: true }
            : event
        })
      : seededEvents
    if (!savedEvents) replaced.add("event")

    const savedProjects = revisions.projects === SEED_REVISIONS.projects && validList(stored.projects, isProject)
      ? stored.projects : null
    const projects = savedProjects
      ? savedProjects.some((project) => (project.status as string) === "Blocked")
        ? savedProjects.map((project) => (project.status as string) === "Blocked" ? { ...project, status: "Active" as const } : project)
        : savedProjects
      : createSeedProjects(base.seedAnchor)
    if (!savedProjects) replaced.add("project")

    const announcements = revisions.announcements === SEED_REVISIONS.announcements && validList(stored.announcements, isAnnouncement)
      ? stored.announcements : createSeedAnnouncements(base.seedAnchor)
    if (announcements !== stored.announcements) replaced.add("announcement")

    const activity = validList(stored.activity, isActivity)
      ? stored.activity.filter((entry) => !replaced.has(entry.entityType))
      : base.activity
    const readNoticeIds = Array.isArray(stored.readNoticeIds)
      ? stored.readNoticeIds.filter((id): id is string =>
          typeof id === "string" && ![...replaced].some((domain) => id.startsWith(domain + ":")))
      : []

    return {
      ...base,
      members,
      events,
      projects,
      announcements,
      activity,
      theme: isTheme(stored.theme) ? stored.theme : "light",
      role: isRole(stored.role) ? stored.role : "admin",
      readNoticeIds,
      storageNotice: replaced.size > 0 ? "Some sample data was refreshed for this version." : undefined,
    }
  } catch {
    return { ...fresh, storageNotice: "Saved demo data could not be read, so sample data was restored." }
  }
}

export function saveAppState(state: AppState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      seedAnchor: state.seedAnchor,
      seedRevisions: state.seedRevisions,
      members: state.members,
      events: state.events,
      projects: state.projects,
      announcements: state.announcements,
      activity: state.activity,
      theme: state.theme,
      role: state.role,
      readNoticeIds: state.readNoticeIds,
    }))
    return true
  } catch {
    return false
  }
}
