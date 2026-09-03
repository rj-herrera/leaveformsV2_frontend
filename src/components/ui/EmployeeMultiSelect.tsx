import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { fieldLabelClassName, fieldShellClassName } from './form/fieldStyles'

export type EmployeeMultiSelectOption = {
  id: string
  name: string
  employeeNumber: string
  groupLabel?: string
}

type EmployeeMultiSelectProps = {
  label: string
  employees: EmployeeMultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  className?: string
  disabled?: boolean
  /** Tailwind height class applied to the trigger button, e.g. "h-[2.375rem]" */
  controlHeight?: string
  emptyLabel?: string
}

function formatTriggerLabel(selectedCount: number, totalCount: number): string {
  if (selectedCount === 0) return 'Select employees'
  if (selectedCount === totalCount && totalCount > 0) {
    return `All employees (${selectedCount})`
  }
  return `${selectedCount} employee${selectedCount === 1 ? '' : 's'} selected`
}

export function EmployeeMultiSelect({
  label,
  employees,
  value,
  onChange,
  className = '',
  disabled = false,
  controlHeight = 'min-h-11',
  emptyLabel = 'No employees in group',
}: EmployeeMultiSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedSet = useMemo(() => new Set(value), [value])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return employees

    return employees.filter((employee) => {
      const haystack = [
        employee.name,
        employee.employeeNumber,
        employee.groupLabel ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [employees, search])

  const filteredIds = useMemo(
    () => filteredEmployees.map((employee) => employee.id),
    [filteredEmployees],
  )

  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedSet.has(id))

  const someFilteredSelected =
    filteredIds.some((id) => selectedSet.has(id)) && !allFilteredSelected

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) {
      searchRef.current?.focus()
    } else {
      setSearch('')
    }
  }, [open])

  function toggleEmployee(employeeId: string) {
    if (selectedSet.has(employeeId)) {
      onChange(value.filter((id) => id !== employeeId))
      return
    }
    onChange([...value, employeeId])
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredIds)
      onChange(value.filter((id) => !filteredIdSet.has(id)))
      return
    }

    const next = new Set(value)
    for (const id of filteredIds) {
      next.add(id)
    }
    onChange(Array.from(next))
  }

  const triggerLabel = formatTriggerLabel(value.length, employees.length)
  const controlDisabled = disabled || employees.length === 0

  return (
    <div className={`relative min-w-0 ${className}`} ref={rootRef}>
      <span className={fieldLabelClassName}>{label}</span>
      <div className={fieldShellClassName}>
        <button
          type="button"
          disabled={controlDisabled}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className={`box-border flex w-full ${controlHeight} items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-body leading-normal text-text-black outline-none transition-[border-color,box-shadow] hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border`}
        >
          <span
            className={
              value.length === 0 || employees.length === 0
                ? 'text-text-gray'
                : undefined
            }
          >
            {employees.length === 0 ? emptyLabel : triggerLabel}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-text-gray"
            aria-hidden="true"
          />
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1">
          <div className="rounded-md border border-border bg-surface shadow-sm">
            <div className="border-b border-border p-2">
              <label className="relative block">
                <span className="sr-only">Search employees</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-gray"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or number"
                  className="box-border w-full rounded-md border border-border bg-surface py-2 pr-3 pl-9 text-body text-text-black outline-none transition-[border-color,box-shadow] placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <div className="border-b border-border px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-body text-text-black">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = someFilteredSelected
                  }}
                  disabled={filteredEmployees.length === 0}
                  onChange={toggleSelectAllFiltered}
                  className="size-4 accent-primary disabled:cursor-not-allowed"
                />
                <span>Select All Employees</span>
              </label>
            </div>

            <ul
              role="listbox"
              aria-label={label}
              aria-multiselectable="true"
              className="max-h-60 overflow-y-auto py-1"
            >
              {filteredEmployees.length === 0 ? (
                <li className="px-3 py-2 text-body text-text-gray">
                  No employees match your search.
                </li>
              ) : (
                filteredEmployees.map((employee) => {
                  const checked = selectedSet.has(employee.id)
                  return (
                    <li key={employee.id}>
                      <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-body text-text-black transition-colors hover:bg-surface-muted">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEmployee(employee.id)}
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {employee.name}
                          </span>
                          <span className="block text-small text-text-gray">
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
