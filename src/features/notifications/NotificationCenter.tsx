import { useState } from "react"
import { ArrowLeft, Bell, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatClubDateTime } from "@/domain/dates"
import { getNotifications } from "@/domain/notifications"
import { RecordDetailSheet, type SelectedRecord } from "@/shared/RecordDetailSheet"
import { useApp } from "@/state/app-context"

export function NotificationCenter() {
  const { state, dispatch, now } = useApp()
  const [open, setOpen] = useState(false)
  const [announcementId, setAnnouncementId] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord>(null)
  const notices = getNotifications(state, now)
  const unread = notices.filter((item) => !state.readNoticeIds.includes(item.id)).length
  const announcement = state.announcements.find((item) => item.id === announcementId)

  return <>
    <Button type="button" variant="outline" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} onClick={() => setOpen(true)} className="relative size-11">
      <Bell aria-hidden="true" />
      {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground" aria-hidden="true">{unread}</span>}
    </Button>
    <Sheet open={open} onOpenChange={(next) => { setOpen(next); if (!next) setAnnouncementId(null) }}>
      <SheetContent className="data-[side=right]:!w-full data-[side=right]:sm:!max-w-md">
        {announcement ? <>
          <SheetHeader className="border-b border-border pb-5 pr-12">
            <Button type="button" variant="ghost" size="sm" className="mb-3 w-fit" onClick={() => setAnnouncementId(null)}><ArrowLeft aria-hidden="true" />Back to notifications</Button>
            <p className="text-xs font-medium text-primary">Important announcement</p>
            <SheetTitle className="text-2xl tracking-tight">{announcement.title}</SheetTitle>
            <SheetDescription>{formatClubDateTime(announcement.createdAt)}</SheetDescription>
          </SheetHeader>
          <p className="overflow-y-auto whitespace-pre-wrap break-words px-4 pb-6 text-sm leading-6">{announcement.message}</p>
        </> : <>
          <SheetHeader className="border-b border-border pb-5 pr-12"><SheetTitle className="text-2xl tracking-tight">Notifications</SheetTitle><SheetDescription>{unread ? `${unread} unread notice${unread === 1 ? "" : "s"}` : "You are all caught up"}</SheetDescription></SheetHeader>
          {notices.length ? <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto border-t border-border">
            {notices.map((notice) => {
              const read = state.readNoticeIds.includes(notice.id)
              return <li key={notice.id} className="px-4 py-4">
                <button type="button" className="flex w-full items-start gap-3 rounded-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => {
                  dispatch({ type: "mark-notice-read", noticeId: notice.id })
                  if (notice.entityType === "announcement") setAnnouncementId(notice.entityId)
                  else { setOpen(false); setSelectedRecord({ type: notice.entityType, id: notice.entityId }) }
                }}>
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${read ? "bg-muted-foreground/40" : "bg-primary"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words"><span className="block text-sm font-semibold">{notice.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{notice.message}</span><span className="mt-2 block text-[11px] font-medium text-muted-foreground">{notice.level} · {read ? "Read" : "Unread"}</span></span>
                  <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </button>
                {!read && <Button type="button" variant="ghost" size="sm" className="ml-5 mt-2" onClick={() => dispatch({ type: "mark-notice-read", noticeId: notice.id })}>Mark as read</Button>}
              </li>
            })}
          </ul> : <p className="px-4 py-8 text-sm text-muted-foreground">No notifications right now.</p>}
        </>}
      </SheetContent>
    </Sheet>
    <RecordDetailSheet selected={selectedRecord} onClose={() => setSelectedRecord(null)} state={state} now={now} />
  </>
}
