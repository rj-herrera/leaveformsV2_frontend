/** Full-viewport loading state shown while auth is bootstrapping. */
export function BootLoadingView() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-0 overflow-y-auto bg-background px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <img
        src={`${import.meta.env.BASE_URL}wind2.svg`}
        alt=""
        width={500}
        height={500}
        className="size-[500px]"
        aria-hidden
      />
      <p className="boot-brand-fade -mt-16 text-4xl font-semibold text-primary">
        KDT Leave Forms
      </p>
    </div>
  )
}
