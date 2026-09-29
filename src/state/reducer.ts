import { createSeedState } from "@/data/seeds"
import type { Activity, Announcement, AppState, ClubEvent, ClubProject, Member, PreviewRole, Theme } from "@/domain/types"

export type AppAction =
  | { type: "set-theme"; theme: Theme }
  | { type: "set-role"; role: PreviewRole }
  | { type: "mark-notice-read"; noticeId: string }
  | { type: "prune-read-notices"; validIds: string[] }
  | { type: "create-event"; event: ClubEvent; activity: Activity }
  | { type: "add-member"; member: Member; activity: Activity }
  | { type: "create-project"; project: ClubProject; activity: Activity }
  | { type: "publish-announcement"; announcement: Announcement; activity: Activity }
  | { type: "update-event"; event: ClubEvent; activity: Activity; registrationActivity?: Activity }
  | { type: "update-project"; project: ClubProject; activity: Activity }
  | { type: "reset-demo"; now: Date }
  | { type: "storage-unavailable" }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "set-theme":
      return { ...state, theme: action.theme }
    case "set-role":
      return { ...state, role: action.role }
    case "mark-notice-read":
      if (state.readNoticeIds.includes(action.noticeId)) return state
      return { ...state, readNoticeIds: [...state.readNoticeIds, action.noticeId] }
    case "prune-read-notices": {
      const valid = new Set(action.validIds)
      const readNoticeIds = state.readNoticeIds.filter((id) => valid.has(id))
      return readNoticeIds.length === state.readNoticeIds.length ? state : { ...state, readNoticeIds }
    }
    case "create-event":
      return { ...state, events: [...state.events, action.event], activity: [action.activity, ...state.activity] }
    case "add-member":
      return { ...state, members: [...state.members, action.member], activity: [action.activity, ...state.activity] }
    case "create-project":
      return { ...state, projects: [...state.projects, action.project], activity: [action.activity, ...state.activity] }
    case "publish-announcement":
      return { ...state, announcements: [action.announcement, ...state.announcements], activity: [action.activity, ...state.activity] }
    case "update-event":
      return {
        ...state,
        events: state.events.map((event) => event.id === action.event.id ? action.event : event),
        activity: [action.registrationActivity, action.activity, ...state.activity].filter((item): item is Activity => Boolean(item)),
      }
    case "update-project":
      return {
        ...state,
        projects: state.projects.map((project) => project.id === action.project.id ? action.project : project),
        activity: [action.activity, ...state.activity],
      }
    case "reset-demo":
      return {
        ...createSeedState(action.now),
        theme: state.theme,
        storageAvailable: state.storageAvailable,
        storageNotice: state.storageAvailable ? undefined : state.storageNotice,
      }
    case "storage-unavailable":
      return {
        ...state,
        storageAvailable: false,
        storageNotice: "Browser storage is unavailable. Changes will last only until this page closes.",
      }
  }
}
