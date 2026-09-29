import { clubDateKey } from "@/domain/dates"
import type { AppState, DomainRevisions } from "@/domain/types"
import { createSeedActivity } from "./activity"
import { createSeedAnnouncements } from "./announcements"
import { createSeedEvents } from "./events"
import { createSeedMembers } from "./members"
import { createSeedProjects } from "./projects"

export const SEED_REVISIONS: DomainRevisions = {
  members: 1,
  events: 3,
  projects: 1,
  announcements: 2,
}

export function createSeedStateForAnchor(seedAnchor: string): AppState {
  return {
    members: createSeedMembers(seedAnchor),
    events: createSeedEvents(seedAnchor),
    projects: createSeedProjects(seedAnchor),
    announcements: createSeedAnnouncements(seedAnchor),
    activity: createSeedActivity(seedAnchor),
    seedAnchor,
    seedRevisions: { ...SEED_REVISIONS },
    theme: "light",
    role: "admin",
    readNoticeIds: [],
    storageAvailable: true,
  }
}

export function createSeedState(now: Date = new Date()): AppState {
  return createSeedStateForAnchor(clubDateKey(now))
}
