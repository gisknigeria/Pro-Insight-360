"use client";

import type { ReactNode, SVGProps } from "react";

export type AppIconName =
  | "activity"
  | "alert"
  | "archive"
  | "bot"
  | "building"
  | "calendar"
  | "chart"
  | "check"
  | "chevronRight"
  | "clipboard"
  | "copy"
  | "download"
  | "edit"
  | "expand"
  | "file"
  | "folder"
  | "form"
  | "grid"
  | "globe"
  | "info"
  | "key"
  | "link"
  | "lock"
  | "logOut"
  | "mail"
  | "map"
  | "pause"
  | "play"
  | "plus"
  | "search"
  | "settings"
  | "sitemap"
  | "trash"
  | "upload"
  | "users"
  | "x";

const paths: Record<AppIconName, ReactNode> = {
  activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  alert: <path d="M12 9v4m0 4h.01M10.3 4.3 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />,
  archive: <><path d="M4 7h16v13H4Z" /><path d="M3 4h18v3H3Zm7 7h4" /></>,
  bot: <><path d="M12 8V4M7 8h10a3 3 0 0 1 3 3v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5a3 3 0 0 1 3-3Z" /><path d="M9 13h.01M15 13h.01M10 17h4" /></>,
  building: <><path d="M4 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15" /><path d="M18 21V10h2a2 2 0 0 1 2 2v9" /><path d="M8 8h4M8 12h4M8 16h4M3 21h20" /></>,
  calendar: <><path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /><path d="M8 13h3M13 13h3M8 17h3" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="M8 16v-5M12 16V8M16 16v-8" /></>,
  check: <><path d="M20 6 9 17l-5-5" /><path d="M21 12a9 9 0 1 1-3-6.7" /></>,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  clipboard: <><path d="M9 4h6l1 2h3v15H5V6h3Z" /><path d="M9 10h6M9 14h6M9 18h3" /></>,
  copy: <><path d="M8 8h11v11H8Z" /><path d="M5 16H4a1 1 0 0 1-1-1V4h11v1" /></>,
  download: <><path d="M12 4v12m-5-5 5 5 5-5" /><path d="M4 20h16" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  expand: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" /><path d="M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6" /></>,
  file: <><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  folder: <path d="M3 6h7l2 2h9v11H3Z" />,
  form: <><path d="M6 4h12v16H6Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6m0-9h.01" /></>,
  key: <><circle cx="7" cy="15" r="4" /><path d="M10 12 21 1m-5 5 3 3m-6 0 3 3" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>,
  lock: <><path d="M6 10h12v11H6Z" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  logOut: <><path d="M10 6H6v12h4" /><path d="M14 16l4-4-4-4M8 12h10" /></>,
  mail: <><path d="M4 6h16v12H4Z" /><path d="m4 7 8 6 8-6" /></>,
  map: <><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></>,
  pause: <path d="M8 5h3v14H8Zm5 0h3v14h-3Z" />,
  play: <path d="m8 5 12 7-12 7Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  sitemap: <><path d="M12 4v5M6 15v-3h12v3" /><path d="M4 15h4v5H4ZM10 15h4v5h-4ZM16 15h4v5h-4ZM9 4h6v5H9Z" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 20h16" /></>,
  users: <><path d="M16 19a4 4 0 0 0-8 0" /><circle cx="12" cy="8" r="4" /><path d="M22 19a4 4 0 0 0-4-4M2 19a4 4 0 0 1 4-4" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
};

export function AppIcon({ name, className = "h-5 w-5", ...props }: { name: AppIconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
