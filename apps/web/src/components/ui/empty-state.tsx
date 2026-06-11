"use client";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'Empty',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-6 py-14 text-center">
      <span
        className="mb-4 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-primary-light px-3 text-sm font-bold text-primary-dark"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
