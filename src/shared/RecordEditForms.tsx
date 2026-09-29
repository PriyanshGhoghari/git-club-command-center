import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { fromClubDateTimeInput, toClubDateTimeInput } from "@/domain/dates"
import type { Activity, ClubEvent, ClubProject, ProjectStatus } from "@/domain/types"
import { FormField, fieldProps, focusFirstError, inputClass, validWholeNumber, valueOf, type FormErrors } from "@/shared/FormFields"
import { useApp } from "@/state/app-context"

function changeActivity(type: Activity["type"], entityType: "event" | "project", entityId: string, message: string, now: string): Activity {
  return { id: crypto.randomUUID(), type, entityType, entityId, message, createdAt: now }
}

export function EventEditForm({ event, onDone }: { event: ClubEvent; onDone: () => void }) {
  const { state, dispatch, notify } = useApp()
  const [errors, setErrors] = useState<FormErrors>({})
  const defaultLead = state.members.some((member) => member.id === event.leadMemberId) ? event.leadMemberId : event.externalLeadName ? "external" : ""

  function submit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    const data = new FormData(submitEvent.currentTarget)
    const startsAt = fromClubDateTimeInput(valueOf(data, "edit-event-startsAt"))
    const endsAt = fromClubDateTimeInput(valueOf(data, "edit-event-endsAt"))
    const deadlineInput = valueOf(data, "edit-event-registrationClosesAt")
    const registrationClosesAt = deadlineInput ? fromClubDateTimeInput(deadlineInput) : undefined
    const capacityInput = valueOf(data, "edit-event-capacity")
    const registeredInput = valueOf(data, "edit-event-registeredCount")
    const attendedInput = valueOf(data, "edit-event-attendedCount")
    const venue = valueOf(data, "edit-event-venue")
    const next: FormErrors = {}
    if (!startsAt) next["edit-event-startsAt"] = "Enter a valid start time."
    if (!endsAt || (startsAt && endsAt <= startsAt)) next["edit-event-endsAt"] = "End time must be after the start."
    if (deadlineInput && (!registrationClosesAt || (startsAt && registrationClosesAt > startsAt))) next["edit-event-registrationClosesAt"] = "Deadline must be on or before the start."
    if (capacityInput && (!validWholeNumber(capacityInput) || Number(capacityInput) <= 0)) next["edit-event-capacity"] = "Use a positive whole number."
    if (!validWholeNumber(registeredInput)) next["edit-event-registeredCount"] = "Use a nonnegative whole number."
    if (!validWholeNumber(attendedInput)) next["edit-event-attendedCount"] = "Use a nonnegative whole number."
    if (validWholeNumber(registeredInput) && validWholeNumber(attendedInput) && Number(attendedInput) > Number(registeredInput)) next["edit-event-attendedCount"] = "Attendance cannot exceed registrations."
    if (capacityInput && validWholeNumber(capacityInput) && validWholeNumber(registeredInput) && Number(registeredInput) > Number(capacityInput)) next["edit-event-registeredCount"] = "Registrations cannot exceed capacity."
    if (!venue) next["edit-event-venue"] = "Enter a venue."
    setErrors(next)
    if (Object.keys(next).length) focusFirstError(submitEvent.currentTarget, next)
    if (Object.keys(next).length || !startsAt || !endsAt) return
    const now = new Date().toISOString()
    const registeredCount = Number(registeredInput)
    const leadChoice = valueOf(data, "edit-event-leadMemberId")
    const updated: ClubEvent = {
      ...event, startsAt, endsAt, registrationClosesAt, venue,
      dateOnly: event.dateOnly && startsAt === event.startsAt && endsAt === event.endsAt,
      leadMemberId: leadChoice && leadChoice !== "external" ? leadChoice : undefined,
      externalLeadName: leadChoice === "external" ? event.externalLeadName : undefined,
      leadUnspecified: event.leadUnspecified && !leadChoice,
      capacity: capacityInput ? Number(capacityInput) : undefined,
      registeredCount, attendedCount: Number(attendedInput),
      participationTracked: event.participationTracked === false && registeredCount === 0 && Number(attendedInput) === 0 ? false : true,
    }
    const delta = registeredCount - event.registeredCount
    dispatch({
      type: "update-event", event: updated,
      activity: changeActivity("event-updated", "event", event.id, `${event.title} was updated`, now),
      registrationActivity: delta > 0 ? { ...changeActivity("registrations-recorded", "event", event.id, `${delta} new registration${delta === 1 ? "" : "s"} for ${event.title}`, now), registrationDelta: delta } : undefined,
    })
    notify("Event updated")
    onDone()
  }

  return <form noValidate autoComplete="off" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
    <FormField name="edit-event-leadMemberId" label="Lead"><select {...fieldProps("edit-event-leadMemberId", errors)} className={inputClass} defaultValue={defaultLead}><option value="">Unassigned</option>{event.externalLeadName && <option value="external">{event.externalLeadName} (external)</option>}{state.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="edit-event-startsAt" label="Starts (IST)" error={errors["edit-event-startsAt"]}><input {...fieldProps("edit-event-startsAt", errors)} type="datetime-local" defaultValue={toClubDateTimeInput(event.startsAt)} className={inputClass} /></FormField>
      <FormField name="edit-event-endsAt" label="Ends (IST)" error={errors["edit-event-endsAt"]}><input {...fieldProps("edit-event-endsAt", errors)} type="datetime-local" defaultValue={toClubDateTimeInput(event.endsAt)} className={inputClass} /></FormField>
    </div>
    <FormField name="edit-event-registrationClosesAt" label="Registration deadline (IST)" error={errors["edit-event-registrationClosesAt"]}><input {...fieldProps("edit-event-registrationClosesAt", errors)} type="datetime-local" defaultValue={event.registrationClosesAt ? toClubDateTimeInput(event.registrationClosesAt) : ""} className={inputClass} /></FormField>
    <FormField name="edit-event-venue" label="Venue" error={errors["edit-event-venue"]}><input {...fieldProps("edit-event-venue", errors)} defaultValue={event.venue} className={inputClass} /></FormField>
    <div className="grid gap-4 sm:grid-cols-3">
      <FormField name="edit-event-capacity" label="Capacity" error={errors["edit-event-capacity"]}><input {...fieldProps("edit-event-capacity", errors)} type="number" min="1" step="1" defaultValue={event.capacity ?? ""} className={inputClass} /></FormField>
      <FormField name="edit-event-registeredCount" label="Registered" error={errors["edit-event-registeredCount"]}><input {...fieldProps("edit-event-registeredCount", errors)} type="number" min="0" step="1" defaultValue={event.registeredCount} className={inputClass} /></FormField>
      <FormField name="edit-event-attendedCount" label="Attended" error={errors["edit-event-attendedCount"]}><input {...fieldProps("edit-event-attendedCount", errors)} type="number" min="0" step="1" defaultValue={event.attendedCount} className={inputClass} /></FormField>
    </div>
    <div className="flex gap-2"><Button type="submit" size="lg">Save event</Button><Button type="button" variant="outline" size="lg" onClick={onDone}>Cancel</Button></div>
  </form>
}

export function ProjectEditForm({ project, onDone }: { project: ClubProject; onDone: () => void }) {
  const { state, dispatch, notify } = useApp()
  const [errors, setErrors] = useState<FormErrors>({})
  const defaultLead = state.members.some((member) => member.id === project.leadMemberId) ? project.leadMemberId : project.externalLeadName ? "external" : ""
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const status = valueOf(data, "edit-project-status") as ProjectStatus
    const targetDate = valueOf(data, "edit-project-targetDate")
    const next: FormErrors = {}
    if (targetDate && targetDate < project.startedAt) next["edit-project-targetDate"] = "Target date must be on or after the start."
    setErrors(next)
    if (Object.keys(next).length) focusFirstError(event.currentTarget, next)
    if (Object.keys(next).length) return
    const leadChoice = valueOf(data, "edit-project-leadMemberId")
    const updated: ClubProject = {
      ...project, status, targetDate: targetDate || undefined,
      leadMemberId: leadChoice && leadChoice !== "external" ? leadChoice : undefined,
      externalLeadName: leadChoice === "external" ? project.externalLeadName : undefined,
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "update-project", project: updated, activity: changeActivity("project-updated", "project", project.id, `${project.title} was updated`, updated.updatedAt) })
    notify("Project updated")
    onDone()
  }
  return <form noValidate autoComplete="off" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
    <FormField name="edit-project-status" label="Status"><select {...fieldProps("edit-project-status", errors)} defaultValue={project.status} className={inputClass}><option>Planning</option><option>Active</option><option>Completed</option></select></FormField>
    <FormField name="edit-project-leadMemberId" label="Lead"><select {...fieldProps("edit-project-leadMemberId", errors)} defaultValue={defaultLead} className={inputClass}><option value="">Unassigned</option>{project.externalLeadName && <option value="external">{project.externalLeadName} (external)</option>}{state.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></FormField>
    <FormField name="edit-project-targetDate" label="Target date" error={errors["edit-project-targetDate"]}><input {...fieldProps("edit-project-targetDate", errors)} type="date" min={project.startedAt} defaultValue={project.targetDate ?? ""} className={inputClass} /></FormField>
    <div className="flex gap-2"><Button type="submit" size="lg">Save project</Button><Button type="button" variant="outline" size="lg" onClick={onDone}>Cancel</Button></div>
  </form>
}
