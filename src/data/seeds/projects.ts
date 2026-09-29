import { clubDateAt, clubDateOnly } from "@/domain/dates"
import type { ClubProject } from "@/domain/types"

export function createSeedProjects(anchor: string): ClubProject[] {
  return [
    {
      id: "project-campus-map",
      title: "Campus Wayfinder",
      description: "A mobile-friendly map for finding labs, offices, and event venues.",
      category: "Web",
      status: "Active",
      leadMemberId: "member-meera",
      memberIds: ["member-meera", "member-om"],
      startedAt: clubDateOnly(anchor, -28),
      targetDate: clubDateOnly(anchor, 18),
      updatedAt: clubDateAt(anchor, -2, 16),
    },
    {
      id: "project-attendance-insights",
      title: "Attendance Insights",
      description: "A small analytics concept for understanding participation at club events.",
      category: "AI/ML",
      status: "Active",
      leadMemberId: "member-dhruv",
      memberIds: ["member-dhruv", "member-kunal"],
      startedAt: clubDateOnly(anchor, -42),
      targetDate: clubDateOnly(anchor, 6),
      updatedAt: clubDateAt(anchor, -10, 12),
    },
    {
      id: "project-lab-sensors",
      title: "Lab Environment Monitor",
      description: "An IoT prototype that tracks room temperature and air quality.",
      category: "IoT",
      status: "Planning",
      leadMemberId: "member-nidhi",
      memberIds: ["member-nidhi"],
      startedAt: clubDateOnly(anchor, -25),
      targetDate: clubDateOnly(anchor, 30),
      updatedAt: clubDateAt(anchor, -22, 15),
    },
    {
      id: "project-club-kit",
      title: "Club Visual Kit",
      description: "Reusable visual assets for workshops, social posts, and presentations.",
      category: "Design",
      status: "Completed",
      leadMemberId: "member-isha",
      memberIds: ["member-isha", "member-meera"],
      startedAt: clubDateOnly(anchor, -90),
      targetDate: clubDateOnly(anchor, -12),
      updatedAt: clubDateAt(anchor, -13, 11),
    },
  ]
}
