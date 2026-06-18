"use client";

import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "./app-icons";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: AppIconName | ReactNode | string;
}

const legacyIconMap: Record<string, AppIconName> = {
  "📊": "chart",
  "📋": "clipboard",
  "📝": "edit",
  "💬": "mail",
  "👥": "users",
  "🏢": "building",
  "💻": "settings",
  "🗺️": "map",
  "📬": "mail",
  "📭": "mail",
  "🎓": "users",
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'info',
}: EmptyStateProps) {
  const renderedIcon = typeof icon === "string" ? <AppIcon name={(legacyIconMap[icon] || icon) as AppIconName} className="h-5 w-5" /> : icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-6 py-14 text-center">
      <span
        className="mb-4 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-primary-light px-3 text-primary-dark"
        aria-hidden="true"
      >
        {renderedIcon}
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
