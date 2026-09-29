import { clubDateAt } from "@/domain/dates"
import type { Announcement } from "@/domain/types"

export function createSeedAnnouncements(anchor: string): Announcement[] {
  return [
    {
      id: "announcement-project-showcase",
      title: "Project showcase this month",
      message: "The club will share progress from its current projects later this month.",
      authorMemberId: "member-aanya",
      priority: "Important",
      createdAt: clubDateAt(anchor, -1, 13),
    },
    {
      id: "announcement-project-review",
      title: "Project check-in this week",
      message: "Project leads can update their status before the weekly committee check-in.",
      authorMemberId: "member-aanya",
      priority: "Standard",
      createdAt: clubDateAt(anchor, -3, 11),
    },
  ]
}
