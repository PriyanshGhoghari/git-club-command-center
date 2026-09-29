import { clubDateAt } from "@/domain/dates"
import type { Activity } from "@/domain/types"

export function createSeedActivity(anchor: string): Activity[] {
  return [
    {
      id: "activity-wayfinder",
      type: "project-updated",
      entityType: "project",
      entityId: "project-campus-map",
      message: "Campus Wayfinder was updated",
      createdAt: clubDateAt(anchor, -2, 16),
    },
  ]
}
