export type PreviewRole = "admin" | "event-lead" | "member"
export type Theme = "light" | "dark"
export type MemberStatus = "Active" | "Inactive"
export type ProjectStatus = "Planning" | "Active" | "Completed"
export type AnnouncementPriority = "Standard" | "Important"
export type EventCategory = "Workshop" | "Hackathon" | "Competition" | "Community"
export type ProjectCategory = "Web" | "AI/ML" | "Mobile" | "IoT" | "Design"

export interface Member {
  id: string
  name: string
  avatar?: string
  year: 1 | 2 | 3 | 4
  branch: string
  clubRole: string
  team: string
  status: MemberStatus
  joinedAt: string
  skills: string[]
}

export interface ClubEvent {
  id: string
  title: string
  description: string
  category: EventCategory
  startsAt: string
  endsAt: string
  registrationClosesAt?: string
  venue: string
  leadMemberId?: string
  externalLeadName?: string
  capacity?: number
  registeredCount: number
  attendedCount: number
  dateOnly?: boolean
  participationTracked?: boolean
  leadUnspecified?: boolean
  cancelled: boolean
}

export interface ClubProject {
  id: string
  title: string
  description: string
  category: ProjectCategory
  status: ProjectStatus
  leadMemberId?: string
  externalLeadName?: string
  memberIds: string[]
  startedAt: string
  targetDate?: string
  updatedAt: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  authorMemberId?: string
  authorLabel?: string
  priority: AnnouncementPriority
  createdAt: string
}

export type EntityType = "event" | "member" | "project" | "announcement"
export type ActivityType =
  | "event-created"
  | "event-updated"
  | "registrations-recorded"
  | "member-added"
  | "project-created"
  | "project-updated"
  | "announcement-published"

export interface Activity {
  id: string
  type: ActivityType
  entityType: EntityType
  entityId: string
  message: string
  createdAt: string
  registrationDelta?: number
}

export interface DomainRevisions {
  members: number
  events: number
  projects: number
  announcements: number
}

export interface AppState {
  members: Member[]
  events: ClubEvent[]
  projects: ClubProject[]
  announcements: Announcement[]
  activity: Activity[]
  seedAnchor: string
  seedRevisions: DomainRevisions
  theme: Theme
  role: PreviewRole
  readNoticeIds: string[]
  storageAvailable: boolean
  storageNotice?: string
}
