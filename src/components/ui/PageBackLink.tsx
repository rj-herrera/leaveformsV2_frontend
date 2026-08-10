import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

const PAGE_BACK_LINK_CLASS =
  'text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary'

export function PageBackLink({
  to,
  children,
}: {
  to: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={PAGE_BACK_LINK_CLASS}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      {children}
    </Link>
  )
}
