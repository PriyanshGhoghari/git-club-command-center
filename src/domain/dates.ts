const CLUB_TIME_ZONE = "Asia/Kolkata"
const DAY_IN_MS = 86_400_000

import type { ClubEvent } from "./types"

export function clubDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const value = (part: string) => parts.find((item) => item.type === part)?.value ?? ""
  return `${value("year")}-${value("month")}-${value("day")}`
}

export function clubDateAt(anchor: string, dayOffset: number, hour = 10, minute = 0): string {
  const [year, month, day] = anchor.split("-").map(Number)
  return new Date(
    Date.UTC(year, month - 1, day + dayOffset, hour, minute) - 330 * 60_000,
  ).toISOString()
}

export function clubDateOnly(anchor: string, dayOffset: number): string {
  return clubDateKey(new Date(clubDateAt(anchor, dayOffset, 12)))
}

export function daysBetween(first: Date, second: Date): number {
  return Math.floor((second.getTime() - first.getTime()) / DAY_IN_MS)
}

export function formatClubDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: CLUB_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function formatClubDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: CLUB_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatEventStart(event: ClubEvent): string {
  return event.dateOnly ? formatClubDate(event.startsAt) : formatClubDateTime(event.startsAt)
}

export function toClubDateTimeInput(value: string): string {
  return new Date(new Date(value).getTime() + 330 * 60_000).toISOString().slice(0, 16)
}

export function fromClubDateTimeInput(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined
  const [year, month, day, hour, minute] = value.match(/\d+/g)?.map(Number) ?? []
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute) - 330 * 60_000)
  return toClubDateTimeInput(date.toISOString()) === value ? date.toISOString() : undefined
}
