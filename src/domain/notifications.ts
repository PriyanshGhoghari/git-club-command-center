import { getAttentionItems } from "./attention"
import type { AppState } from "./types"

export interface Notice {
  id: string
  title: string
  message: string
  kind: "operational" | "announcement"
  level: "High" | "Normal" | "Information"
  entityType: "event" | "project" | "announcement"
  entityId: string
  createdAt?: string
}

export function getNotifications(state: AppState, now: Date): Notice[] {
  const operational: Notice[] = getAttentionItems(state, now).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.reason,
    kind: "operational",
    level: item.level,
    entityType: item.entityType,
    entityId: item.entityId,
  }))
  const announcements: Notice[] = state.announcements
    .filter((item) => item.priority === "Important")
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map((item) => ({
      id: `announcement:${item.id}`,
      title: item.title,
      message: item.message,
      kind: "announcement",
      level: "Information",
      entityType: "announcement",
      entityId: item.id,
      createdAt: item.createdAt,
    }))
  return [...operational, ...announcements]
}
