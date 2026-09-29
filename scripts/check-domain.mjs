import assert from "node:assert/strict"
import { createServer } from "vite"

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" })

try {
  const [{ createSeedState }, selectors, { getAttentionItems }, { getNotifications }, { appReducer }, dates, { EVENT_LEAD_PREVIEW_ID }, persistence] = await Promise.all([
    vite.ssrLoadModule("/src/data/seeds/index.ts"),
    vite.ssrLoadModule("/src/domain/selectors.ts"),
    vite.ssrLoadModule("/src/domain/attention.ts"),
    vite.ssrLoadModule("/src/domain/notifications.ts"),
    vite.ssrLoadModule("/src/state/reducer.ts"),
    vite.ssrLoadModule("/src/domain/dates.ts"),
    vite.ssrLoadModule("/src/data/seeds/members.ts"),
    vite.ssrLoadModule("/src/state/persistence.ts"),
  ])
  const now = new Date("2026-09-28T06:30:00.000Z")
  const state = createSeedState(now)
  const metrics = selectors.getDashboardMetrics(state, now)
  assert.deepEqual(metrics, { activeMembers: 8, upcomingEvents: 5, activeProjects: 1, registrations: 267 })

  const ids = getAttentionItems(state, now).map((item) => item.id)
  assert.ok(ids.includes("event-no-lead:event-build-night"))
  assert.ok(ids.includes("event-registration-closing:event-git-foundations"))
  assert.ok(ids.includes("event-low-registration:event-git-foundations"))
  assert.ok(ids.includes("project-blocked:project-attendance-insights"))
  assert.ok(ids.includes("project-stale:project-lab-sensors"))
  assert.ok(ids.includes("project-due-soon:project-attendance-insights"))
  const earlyEvent = {
    ...state.events[0], id: "check-early-event", startsAt: dates.clubDateAt(state.seedAnchor, 7, 2),
    endsAt: dates.clubDateAt(state.seedAnchor, 7, 4), registrationClosesAt: undefined,
    registeredCount: 0, capacity: 20,
  }
  assert.ok(getAttentionItems({ ...state, events: [earlyEvent] }, now).some((item) => item.id === "event-low-registration:check-early-event"))
  assert.equal(getAttentionItems(state, now, "member").length, 0)
  assert.ok(getAttentionItems(state, now, "event-lead").every((item) => item.entityType === "event" && state.events.find((event) => event.id === item.entityId)?.leadMemberId === EVENT_LEAD_PREVIEW_ID))
  assert.equal(getNotifications({ ...state, role: "member" }, now).filter((item) => item.kind === "operational").length, 0)
  assert.ok(getNotifications({ ...state, role: "admin" }, now).some((item) => item.id === "event-no-lead:event-build-night"))
  assert.ok(getNotifications(state, now).some((item) => item.id === "announcement:announcement-build-night"))

  const buildNight = state.events.find((event) => event.id === "event-build-night")
  const activity = { id: "check-activity", type: "event-updated", entityType: "event", entityId: buildNight.id, message: "Updated", createdAt: now.toISOString() }
  const updated = appReducer(state, { type: "update-event", event: { ...buildNight, leadMemberId: EVENT_LEAD_PREVIEW_ID }, activity })
  assert.ok(!getAttentionItems(updated, now).some((item) => item.id === "event-no-lead:event-build-night"))
  assert.equal(updated.activity[0].id, "check-activity")
  assert.equal(state.events.find((event) => event.id === buildNight.id).leadMemberId, undefined)

  const newEvent = { ...buildNight, id: "check-created", leadMemberId: EVENT_LEAD_PREVIEW_ID, registeredCount: 0 }
  const created = appReducer(updated, { type: "create-event", event: newEvent, activity: { ...activity, id: "check-created-activity", type: "event-created", entityId: newEvent.id } })
  assert.equal(selectors.getDashboardMetrics(created, now).upcomingEvents, metrics.upcomingEvents + 1)
  assert.equal(created.events.length, state.events.length + 1)

  const completed = selectors.getParticipationData(state.events, now, "90d", "all")
  assert.equal(completed.length, 2)
  assert.equal(selectors.getParticipationData(state.events, now, "90d", "Workshop").length, 1)
  assert.ok(completed.every((event) => event.attended <= event.registered))
  assert.equal(selectors.getFilteredEvents(state.events, { query: "git", category: "Workshop", status: "Upcoming" }, now).length, 1)
  assert.equal(selectors.getFilteredMembers(state.members, { query: "RISHI", team: "Events", status: "Active" }).length, 1)
  assert.equal(selectors.getFilteredProjects(state.projects, { query: "attendance", category: "AI/ML", status: "Blocked" }).length, 1)

  const input = "2026-09-29T14:30"
  assert.equal(dates.toClubDateTimeInput(dates.fromClubDateTimeInput(input)), input)
  assert.equal(dates.fromClubDateTimeInput("2026-02-30T14:30"), undefined)
  const read = appReducer(created, { type: "mark-notice-read", noticeId: "event-no-lead:event-build-night" })
  const pruned = appReducer(read, { type: "prune-read-notices", validIds: [] })
  assert.deepEqual(pruned.readNoticeIds, [])
  const reset = appReducer({ ...pruned, theme: "dark", role: "member" }, { type: "reset-demo", now })
  assert.equal(reset.theme, "dark")
  assert.equal(reset.role, "admin")
  assert.equal(reset.events.length, state.events.length)
  const previousWindow = globalThis.window
  let stored = null
  globalThis.window = { localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value } } }
  try {
    assert.equal(persistence.saveAppState({ ...created, role: "member", theme: "dark" }), true)
    const hydrated = persistence.loadAppState(now)
    assert.equal(hydrated.role, "member")
    assert.equal(hydrated.theme, "dark")
    assert.equal(hydrated.events.length, created.events.length)
    stored = "{broken"
    assert.equal(persistence.loadAppState(now).events.length, state.events.length)
  } finally {
    globalThis.window = previousWindow
  }
  console.log("Domain checks passed: metrics, attention, roles, actions, filters, chart data, dates, read state, reset, persistence")
} finally {
  await vite.close()
}
