import { clubDateOnly } from "@/domain/dates"
import type { Member } from "@/domain/types"

const rows = [
  { id: "member-aanya", name: "Aanya Shah", year: 4, branch: "Computer Engineering", clubRole: "President", team: "Core", joinedDays: -430, skills: ["Leadership", "Web"] },
  { id: "member-rishi", name: "Rishi Patel", year: 3, branch: "Information Technology", clubRole: "Event Lead", team: "Events", joinedDays: -310, skills: ["Workshops", "Git"] },
  { id: "member-meera", name: "Meera Desai", year: 2, branch: "Computer Engineering", clubRole: "Member", team: "Web", joinedDays: -170, skills: ["React", "Design"] },
  { id: "member-dhruv", name: "Dhruv Joshi", year: 3, branch: "Computer Engineering", clubRole: "Project Lead", team: "AI/ML", joinedDays: -290, skills: ["Python", "ML"] },
  { id: "member-isha", name: "Isha Trivedi", year: 2, branch: "Information Technology", clubRole: "Design Lead", team: "Design", joinedDays: -165, skills: ["Figma", "UI"] },
  { id: "member-kunal", name: "Kunal Mehta", year: 1, branch: "Computer Engineering", clubRole: "Member", team: "Events", joinedDays: -65, skills: ["Community", "Git"] },
  { id: "member-nidhi", name: "Nidhi Parmar", year: 3, branch: "Computer Engineering", clubRole: "Member", team: "IoT", joinedDays: -290, skills: ["Arduino", "Sensors"] },
  { id: "member-om", name: "Om Vyas", year: 2, branch: "Information Technology", clubRole: "Member", team: "Web", joinedDays: -168, skills: ["TypeScript", "CSS"] },
] as const

export const EVENT_LEAD_PREVIEW_ID = "member-rishi"
export const MEMBER_PREVIEW_ID = "member-meera"

export function createSeedMembers(anchor: string): Member[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    year: row.year,
    branch: row.branch,
    clubRole: row.clubRole,
    team: row.team,
    status: "Active",
    joinedAt: clubDateOnly(anchor, row.joinedDays),
    skills: [...row.skills],
  }))
}
