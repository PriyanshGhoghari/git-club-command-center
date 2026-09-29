import { useState } from "react"
import { formatClubDate, formatClubDateTime } from "@/domain/dates"
import { getEventLifecycle, getLeadName } from "@/domain/selectors"
import type { AppState } from "@/domain/types"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { EVENT_LEAD_PREVIEW_ID } from "@/data/seeds/members"
import { EventEditForm, ProjectEditForm } from "./RecordEditForms"

export type SelectedRecord = { type: "event" | "member" | "project"; id: string } | null

function Field({ label, value }: { label: string; value: string | number }) {
  return <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 border-b border-border py-3.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-medium">{value}</dd></div>
}

export function RecordDetailSheet({ selected, onClose, state, now }: { selected: SelectedRecord; onClose: () => void; state: AppState; now: Date }) {
  const [editing, setEditing] = useState(false)
  const event = selected?.type === "event" ? state.events.find((item) => item.id === selected.id) : undefined
  const member = selected?.type === "member" ? state.members.find((item) => item.id === selected.id) : undefined
  const project = selected?.type === "project" ? state.projects.find((item) => item.id === selected.id) : undefined
  const memberEvents = member ? state.events.filter((item) => item.leadMemberId === member.id) : []
  const memberProjects = member ? state.projects.filter((item) => item.leadMemberId === member.id || item.memberIds.includes(member.id)) : []
  const canEditEvent = event && (state.role === "admin" || (state.role === "event-lead" && event.leadMemberId === EVENT_LEAD_PREVIEW_ID))
  const canEditProject = project && state.role === "admin"
  const close = () => { setEditing(false); onClose() }

  return (
    <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) close() }}>
      <SheetContent className="data-[side=right]:!w-full data-[side=right]:sm:!max-w-md">
        {event ? <>
          <SheetHeader className="border-b border-border pb-5 pr-12">
            <p className="text-xs font-medium text-primary">{event.category} / {getEventLifecycle(event, now)}</p>
            <SheetTitle className="text-2xl tracking-tight">{event.title}</SheetTitle>
            <SheetDescription className="sr-only">Schedule and operational details for {event.title}</SheetDescription>
          </SheetHeader>
          {canEditEvent && <div className="px-4 pt-4"><Button type="button" variant={editing ? "ghost" : "outline"} onClick={() => setEditing(!editing)}>{editing ? "View details" : "Edit event"}</Button></div>}
          {editing && canEditEvent ? <EventEditForm key={event.id} event={event} onDone={() => setEditing(false)} /> : <dl className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            {event.dateOnly ? <Field label="Date" value={formatClubDate(event.startsAt)} /> : <><Field label="Starts" value={formatClubDateTime(event.startsAt)} /><Field label="Ends" value={formatClubDateTime(event.endsAt)} /></>}
            <Field label="Venue" value={event.venue} />
            <Field label="Lead" value={event.leadUnspecified ? "Not provided" : getLeadName(event.leadMemberId, event.externalLeadName, state.members)} />
            <Field label="Registration closes" value={event.registrationClosesAt ? formatClubDateTime(event.registrationClosesAt) : "Not set"} />
            <Field label="Capacity" value={event.capacity ?? "Not set"} />
            <Field label="Registrations (sample)" value={event.participationTracked === false ? "Not reported" : event.registeredCount} />
            <Field label="Attended (sample)" value={event.participationTracked === false ? "Not reported" : event.attendedCount} />
          </dl>}
        </> : project ? <>
          <SheetHeader className="border-b border-border pb-5 pr-12">
            <p className="text-xs font-medium text-primary">{project.category} / {project.status}</p>
            <SheetTitle className="text-2xl tracking-tight">{project.title}</SheetTitle>
            <SheetDescription>{project.description}</SheetDescription>
          </SheetHeader>
          {canEditProject && <div className="px-4 pt-4"><Button type="button" variant={editing ? "ghost" : "outline"} onClick={() => setEditing(!editing)}>{editing ? "View details" : "Edit project"}</Button></div>}
          {editing && canEditProject ? <ProjectEditForm key={project.id} project={project} onDone={() => setEditing(false)} /> : <dl className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <Field label="Lead" value={getLeadName(project.leadMemberId, project.externalLeadName, state.members)} />
            <Field label="Team" value={project.memberIds.map((id) => state.members.find((member) => member.id === id)?.name).filter(Boolean).join(", ") || "No members yet"} />
            <Field label="Started" value={formatClubDate(project.startedAt)} />
            <Field label="Target date" value={project.targetDate ? formatClubDate(project.targetDate) : "Not set"} />
            <Field label="Last updated" value={formatClubDateTime(project.updatedAt)} />
          </dl>}
        </> : member ? <>
          <SheetHeader className="border-b border-border pb-5 pr-12">
            <p className="text-xs font-medium text-primary">{member.team} / {member.status}</p>
            <SheetTitle className="text-2xl tracking-tight">{member.name}</SheetTitle>
            <SheetDescription>{member.clubRole} at Git Club CHARUSAT</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <dl>
              <Field label="Committee role" value={member.clubRole} />
              <Field label="Team" value={member.team} />
              <Field label="Year" value={member.year} />
              <Field label="Branch" value={member.branch} />
              <Field label="Status" value={member.status} />
              <Field label="Joined" value={formatClubDate(member.joinedAt)} />
              <Field label="Skills" value={member.skills.join(", ") || "Not listed"} />
            </dl>
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Recorded assignments</h3>
              {memberEvents.length || memberProjects.length ? <ul className="mt-2 space-y-2 text-sm">
                {memberEvents.map((item) => <li key={item.id} className="rounded-lg bg-muted/60 px-3 py-2"><span className="text-xs text-muted-foreground">Event lead</span><span className="block font-medium">{item.title}</span></li>)}
                {memberProjects.map((item) => <li key={item.id} className="rounded-lg bg-muted/60 px-3 py-2"><span className="text-xs text-muted-foreground">Project {item.leadMemberId === member.id ? "lead" : "member"}</span><span className="block font-medium">{item.title}</span></li>)}
              </ul> : <p className="mt-2 text-sm text-muted-foreground">No related events or projects are recorded yet.</p>}
            </div>
          </div>
        </> : <SheetHeader><SheetTitle>Record unavailable</SheetTitle><SheetDescription>This record may have been removed or reset.</SheetDescription></SheetHeader>}
      </SheetContent>
    </Sheet>
  )
}
