import { useState } from "react"
import type { FormEvent } from "react"
import { CalendarPlus, Megaphone, Plus, UserPlus } from "lucide-react"
import { EVENT_LEAD_PREVIEW_ID } from "@/data/seeds/members"
import { clubDateAt, clubDateKey, fromClubDateTimeInput, toClubDateTimeInput } from "@/domain/dates"
import type { Activity, Announcement, ClubEvent, ClubProject, EventCategory, Member, MemberStatus, ProjectCategory, ProjectStatus } from "@/domain/types"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FormField, fieldProps, focusFirstError, inputClass, textareaClass, validWholeNumber, valueOf, type FormErrors } from "@/shared/FormFields"
import { useApp } from "@/state/app-context"

type ActionKind = "event" | "member" | "project" | "announcement"

function activity(type: Activity["type"], entityType: Activity["entityType"], entityId: string, message: string): Activity {
  return { id: crypto.randomUUID(), type, entityType, entityId, message, createdAt: new Date().toISOString() }
}

function EventForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch, notify, now } = useApp()
  const [errors, setErrors] = useState<FormErrors>({})
  const tomorrow = clubDateAt(clubDateKey(now), 1, 14)
  const end = clubDateAt(clubDateKey(now), 1, 16)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = valueOf(data, "title")
    const description = valueOf(data, "description")
    const category = valueOf(data, "category") as EventCategory
    const venue = valueOf(data, "venue")
    const startsAt = fromClubDateTimeInput(valueOf(data, "startsAt"))
    const endsAt = fromClubDateTimeInput(valueOf(data, "endsAt"))
    const deadlineInput = valueOf(data, "registrationClosesAt")
    const registrationClosesAt = deadlineInput ? fromClubDateTimeInput(deadlineInput) : undefined
    const capacityInput = valueOf(data, "capacity")
    const next: FormErrors = {}
    if (!title) next.title = "Enter an event title."
    if (!description) next.description = "Describe the event."
    if (!category) next.category = "Choose a category."
    if (!venue) next.venue = "Enter a venue."
    if (!startsAt || new Date(startsAt).getTime() <= Date.now()) next.startsAt = "Choose a future start time."
    if (!endsAt || (startsAt && endsAt <= startsAt)) next.endsAt = "End time must be after the start."
    if (deadlineInput && (!registrationClosesAt || (startsAt && registrationClosesAt > startsAt))) next.registrationClosesAt = "Deadline must be on or before the start."
    if (capacityInput && (!validWholeNumber(capacityInput) || Number(capacityInput) <= 0)) next.capacity = "Enter a positive whole number."
    setErrors(next)
    if (Object.keys(next).length) focusFirstError(event.currentTarget, next)
    if (Object.keys(next).length || !startsAt || !endsAt) return
    const record: ClubEvent = {
      id: crypto.randomUUID(), title, description, category, startsAt, endsAt, venue,
      registrationClosesAt, capacity: capacityInput ? Number(capacityInput) : undefined,
      leadMemberId: state.role === "event-lead" ? EVENT_LEAD_PREVIEW_ID : valueOf(data, "leadMemberId") || undefined,
      registeredCount: 0, attendedCount: 0, cancelled: false,
    }
    dispatch({ type: "create-event", event: record, activity: activity("event-created", "event", record.id, `${title} was added`) })
    notify("Event created")
    onDone()
  }

  return <form noValidate autoComplete="off" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
    <FormField name="title" label="Title *" error={errors.title}><input {...fieldProps("title", errors)} className={inputClass} /></FormField>
    <FormField name="description" label="Description *" error={errors.description}><textarea {...fieldProps("description", errors)} className={textareaClass} /></FormField>
    <FormField name="category" label="Category *" error={errors.category}><select {...fieldProps("category", errors)} className={inputClass} defaultValue="Workshop"><option>Workshop</option><option>Hackathon</option><option>Competition</option><option>Community</option></select></FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="startsAt" label="Starts (IST) *" error={errors.startsAt}><input {...fieldProps("startsAt", errors)} type="datetime-local" defaultValue={toClubDateTimeInput(tomorrow)} className={inputClass} /></FormField>
      <FormField name="endsAt" label="Ends (IST) *" error={errors.endsAt}><input {...fieldProps("endsAt", errors)} type="datetime-local" defaultValue={toClubDateTimeInput(end)} className={inputClass} /></FormField>
    </div>
    <FormField name="venue" label="Venue *" error={errors.venue}><input {...fieldProps("venue", errors)} className={inputClass} /></FormField>
    {state.role === "admin" && <FormField name="leadMemberId" label="Event lead"><select {...fieldProps("leadMemberId", errors)} className={inputClass} defaultValue=""><option value="">Unassigned</option>{state.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></FormField>}
    {state.role === "event-lead" && <p className="text-sm text-muted-foreground">You will be assigned as this event’s lead.</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="registrationClosesAt" label="Registration deadline (IST)" error={errors.registrationClosesAt}><input {...fieldProps("registrationClosesAt", errors)} type="datetime-local" className={inputClass} /></FormField>
      <FormField name="capacity" label="Capacity" error={errors.capacity}><input {...fieldProps("capacity", errors)} type="number" min="1" step="1" className={inputClass} /></FormField>
    </div>
    <Button type="submit" size="lg" className="w-full">Create event</Button>
  </form>
}

function MemberForm({ onDone }: { onDone: () => void }) {
  const { dispatch, notify, now } = useApp()
  const [errors, setErrors] = useState<FormErrors>({})
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = valueOf(data, "name")
    const year = Number(valueOf(data, "year"))
    const branch = valueOf(data, "branch")
    const clubRole = valueOf(data, "clubRole")
    const team = valueOf(data, "team")
    const status = valueOf(data, "status") as MemberStatus
    const joinedAt = valueOf(data, "joinedAt")
    const avatar = valueOf(data, "avatar")
    const next: FormErrors = {}
    if (!name) next.name = "Enter the member’s name."
    if (![1, 2, 3, 4].includes(year)) next.year = "Choose a year from 1 to 4."
    if (!branch) next.branch = "Enter the branch."
    if (!clubRole) next.clubRole = "Enter the committee role."
    if (!team) next.team = "Enter the team."
    if (!joinedAt || joinedAt > clubDateKey(now)) next.joinedAt = "Joined date cannot be after today."
    if (avatar) { try { const url = new URL(avatar); if (!(["http:", "https:"].includes(url.protocol))) next.avatar = "Use an http or https image URL." } catch { next.avatar = "Enter a valid image URL." } }
    setErrors(next)
    if (Object.keys(next).length) focusFirstError(event.currentTarget, next)
    if (Object.keys(next).length) return
    const member: Member = {
      id: crypto.randomUUID(), name, year: year as Member["year"], branch, clubRole, team, status, joinedAt,
      avatar: avatar || undefined, skills: valueOf(data, "skills").split(",").map((skill) => skill.trim()).filter(Boolean),
    }
    dispatch({ type: "add-member", member, activity: activity("member-added", "member", member.id, `${name} joined the club team`) })
    notify("Member added")
    onDone()
  }
  return <form noValidate autoComplete="off" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
    <FormField name="name" label="Name *" error={errors.name}><input {...fieldProps("name", errors)} className={inputClass} /></FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="year" label="Year *" error={errors.year}><select {...fieldProps("year", errors)} className={inputClass} defaultValue="1">{[1, 2, 3, 4].map((year) => <option key={year}>{year}</option>)}</select></FormField>
      <FormField name="status" label="Status *" error={errors.status}><select {...fieldProps("status", errors)} className={inputClass} defaultValue="Active"><option>Active</option><option>Inactive</option></select></FormField>
    </div>
    <FormField name="branch" label="Branch *" error={errors.branch}><input {...fieldProps("branch", errors)} className={inputClass} /></FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="clubRole" label="Committee role *" error={errors.clubRole}><input {...fieldProps("clubRole", errors)} className={inputClass} /></FormField>
      <FormField name="team" label="Team *" error={errors.team}><input {...fieldProps("team", errors)} className={inputClass} /></FormField>
    </div>
    <FormField name="joinedAt" label="Joined date *" error={errors.joinedAt}><input {...fieldProps("joinedAt", errors)} type="date" defaultValue={clubDateKey(now)} max={clubDateKey(now)} className={inputClass} /></FormField>
    <FormField name="avatar" label="Avatar URL"><input {...fieldProps("avatar", errors)} type="url" className={inputClass} /></FormField>
    <FormField name="skills" label="Skills (comma separated)"><input {...fieldProps("skills", errors)} className={inputClass} placeholder="Git, React" /></FormField>
    <Button type="submit" size="lg" className="w-full">Add member</Button>
  </form>
}

function ProjectForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch, notify, now } = useApp()
  const [errors, setErrors] = useState<FormErrors>({})
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = valueOf(data, "title")
    const description = valueOf(data, "description")
    const category = valueOf(data, "category") as ProjectCategory
    const status = valueOf(data, "status") as ProjectStatus
    const startedAt = valueOf(data, "startedAt")
    const targetDate = valueOf(data, "targetDate")
    const next: FormErrors = {}
    if (!title) next.title = "Enter a project title."
    if (!description) next.description = "Describe the project."
    if (!category) next.category = "Choose a category."
    if (!status) next.status = "Choose a status."
    if (!startedAt || startedAt > clubDateKey(now)) next.startedAt = "Start date cannot be after today."
    if (targetDate && targetDate < startedAt) next.targetDate = "Target date must be on or after the start."
    setErrors(next)
    if (Object.keys(next).length) focusFirstError(event.currentTarget, next)
    if (Object.keys(next).length) return
    const project: ClubProject = {
      id: crypto.randomUUID(), title, description, category, status, startedAt, targetDate: targetDate || undefined,
      leadMemberId: valueOf(data, "leadMemberId") || undefined,
      memberIds: data.getAll("memberIds").map(String), updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "create-project", project, activity: activity("project-created", "project", project.id, `${title} was added`) })
    notify("Project added")
    onDone()
  }
  return <form noValidate autoComplete="off" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
    <FormField name="title" label="Title *" error={errors.title}><input {...fieldProps("title", errors)} className={inputClass} /></FormField>
    <FormField name="description" label="Description *" error={errors.description}><textarea {...fieldProps("description", errors)} className={textareaClass} /></FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="category" label="Category *" error={errors.category}><select {...fieldProps("category", errors)} className={inputClass} defaultValue="Web"><option>Web</option><option>AI/ML</option><option>Mobile</option><option>IoT</option><option>Design</option></select></FormField>
      <FormField name="status" label="Status *" error={errors.status}><select {...fieldProps("status", errors)} className={inputClass} defaultValue="Planning"><option>Planning</option><option>Active</option><option>Completed</option></select></FormField>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField name="startedAt" label="Start date *" error={errors.startedAt}><input {...fieldProps("startedAt", errors)} type="date" max={clubDateKey(now)} defaultValue={clubDateKey(now)} className={inputClass} /></FormField>
      <FormField name="targetDate" label="Target date" error={errors.targetDate}><input {...fieldProps("targetDate", errors)} type="date" className={inputClass} /></FormField>
    </div>
    <FormField name="leadMemberId" label="Project lead"><select {...fieldProps("leadMemberId", errors)} className={inputClass} defaultValue=""><option value="">Unassigned</option>{state.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></FormField>
    <fieldset className="space-y-2"><legend className="text-sm font-medium">Team members</legend><div className="grid grid-cols-2 gap-2">{state.members.map((member) => <label key={member.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><input type="checkbox" name="memberIds" value={member.id} />{member.name}</label>)}</div></fieldset>
    <Button type="submit" size="lg" className="w-full">Add project</Button>
  </form>
}

function AnnouncementForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch, notify } = useApp()
  const [errors, setErrors] = useState<FormErrors>({})
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = valueOf(data, "title")
    const message = valueOf(data, "message")
    const next: FormErrors = {}
    if (!title) next.title = "Enter a title."
    if (!message) next.message = "Write the announcement."
    setErrors(next)
    if (Object.keys(next).length) focusFirstError(event.currentTarget, next)
    if (Object.keys(next).length) return
    const announcement: Announcement = { id: crypto.randomUUID(), title, message, priority: valueOf(data, "priority") === "Important" ? "Important" : "Standard", authorMemberId: state.members.find((member) => member.clubRole === "President")?.id, authorLabel: "Git Club", createdAt: new Date().toISOString() }
    dispatch({ type: "publish-announcement", announcement, activity: activity("announcement-published", "announcement", announcement.id, `${title} was published`) })
    notify("Announcement published")
    onDone()
  }
  return <form noValidate autoComplete="off" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
    <FormField name="title" label="Title *" error={errors.title}><input {...fieldProps("title", errors)} className={inputClass} /></FormField>
    <FormField name="message" label="Message *" error={errors.message}><textarea {...fieldProps("message", errors)} className={textareaClass} /></FormField>
    <FormField name="priority" label="Priority"><select {...fieldProps("priority", errors)} className={inputClass} defaultValue="Standard"><option>Standard</option><option>Important</option></select></FormField>
    <p className="text-xs text-muted-foreground">Important announcements also appear in notifications.</p>
    <Button type="submit" size="lg" className="w-full">Publish announcement</Button>
  </form>
}

const actions = [
  { kind: "event", label: "Create event", icon: CalendarPlus, description: "Schedule a new club event." },
  { kind: "member", label: "Add member", icon: UserPlus, description: "Add someone to the club team." },
  { kind: "project", label: "Add project", icon: Plus, description: "Track a new initiative." },
  { kind: "announcement", label: "Publish announcement", icon: Megaphone, description: "Share an update with the club." },
] as const

export function QuickActions() {
  const { state } = useApp()
  const [selected, setSelected] = useState<ActionKind | null>(null)
  if (state.role === "member") return null
  const available = state.role === "event-lead" ? actions.slice(0, 1) : actions
  const active = available.find((action) => action.kind === selected)
  return <section className="workspace-panel">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4"><h2 className="text-base font-semibold tracking-tight">Quick actions</h2></div>
    <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4 xl:p-5">
      {available.map(({ kind, label, icon: Icon }) => <Button key={kind} type="button" variant="outline" size="lg" className="quick-action h-12 justify-start gap-3 bg-background px-4 text-sm font-medium shadow-none hover:border-primary/50 hover:bg-primary/5" onClick={() => setSelected(kind)}><Icon aria-hidden="true" className="size-4 text-primary" />{label}</Button>)}
    </div>
    <Sheet open={Boolean(active)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
      <SheetContent className="data-[side=right]:!w-full data-[side=right]:sm:!max-w-lg">
        <SheetHeader className="pr-12"><SheetTitle className="text-xl">{active?.label}</SheetTitle><SheetDescription className="sr-only">{active?.description}</SheetDescription></SheetHeader>
        {active?.kind === "event" && <EventForm key="event" onDone={() => setSelected(null)} />}
        {active?.kind === "member" && <MemberForm key="member" onDone={() => setSelected(null)} />}
        {active?.kind === "project" && <ProjectForm key="project" onDone={() => setSelected(null)} />}
        {active?.kind === "announcement" && <AnnouncementForm key="announcement" onDone={() => setSelected(null)} />}
      </SheetContent>
    </Sheet>
  </section>
}
