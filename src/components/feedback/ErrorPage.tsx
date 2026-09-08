import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

export type ErrorPageAction = {
  label: string
  onClick: () => void
}

export type ErrorPageProps = {
  code?: string
  title: string
  description: string
  icon: ReactNode
  primaryAction: ErrorPageAction
  secondaryAction?: ErrorPageAction
}

/**
 * Shared full-page error shell for status/preview error screens.
 * Uses design tokens + Button so pages stay consistent with the app UI.
 */
export function ErrorPage({
  code,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: ErrorPageProps) {
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm sm:max-w-lg sm:p-8">
        <div className="flex flex-col items-center text-center">
          {code ? (
            <p className="text-header tracking-[0.125rem] text-text-gray uppercase">
              {code}
            </p>
          ) : null}

          <div
            className="mt-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-20"
            aria-hidden="true"
          >
            <span className="[&_svg]:size-8 sm:[&_svg]:size-10">{icon}</span>
          </div>

          <h1 className="text-h1 mt-5 text-text-black">{title}</h1>

          <p className="text-body mt-3 max-w-sm text-text-gray">{description}</p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
            {secondaryAction ? (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
