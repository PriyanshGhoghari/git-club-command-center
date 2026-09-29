import type { ReactNode } from "react"

export type FormErrors = Record<string, string>

export function FormField({ name, label, error, children }: { name: string; label: string; error?: string; children: ReactNode }) {
  return <div className="space-y-1.5">
    <label htmlFor={name} className="block text-sm font-medium">{label}</label>
    {children}
    {error && <p id={`${name}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
  </div>
}

export const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
export const textareaClass = `${inputClass} min-h-24 py-2`

export function fieldProps(name: string, errors: FormErrors) {
  return { id: name, name, "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined }
}

export function valueOf(data: FormData, name: string): string {
  return String(data.get(name) ?? "").trim()
}

export function validWholeNumber(value: string): boolean {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value))
}

export function focusFirstError(form: HTMLFormElement, errors: FormErrors) {
  const first = Object.keys(errors)[0]
  const control = first ? form.elements.namedItem(first) : null
  if (control instanceof HTMLElement) control.focus()
}
