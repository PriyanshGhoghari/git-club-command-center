import { Inbox, Search, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SearchField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="min-w-0 flex-1 min-[360px]:col-span-2 sm:min-w-56">
    <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
        className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
    </div>
  </div>
}

export function FilterSelect({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="min-w-0 flex-1 sm:flex-none">
    <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className="h-10 w-full min-w-0 sm:w-40"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}

export function ResultsSummary({ shown, total, noun, filtered, onClear }: { shown: number; total: number; noun: string; filtered: boolean; onClear: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
    <p role="status">Showing {shown} of {total} {noun}</p>
    {filtered && shown > 0 && <Button type="button" variant="ghost" size="sm" onClick={onClear}>Clear filters</Button>}
  </div>
}

export function ListEmptyState({ noun, total, filtered, onClear }: { noun: string; total: number; filtered: boolean; onClear: () => void }) {
  const noMatches = total > 0 && filtered
  return <div className="empty-state rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
    <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary">{noMatches ? <SearchX aria-hidden="true" className="size-5" /> : <Inbox aria-hidden="true" className="size-5" />}</span>
    <p className="font-medium">{noMatches ? `No ${noun} match these filters` : `No ${noun} yet`}</p>
    <p className="mt-1 text-sm text-muted-foreground">{noMatches ? "Try another search or clear the filters." : "Records will appear here when they are added."}</p>
    {filtered && <Button type="button" variant="outline" className="mt-4" onClick={onClear}>Clear filters</Button>}
  </div>
}
