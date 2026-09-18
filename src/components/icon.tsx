export type IconName =
  | "calendar"
  | "heart"
  | "cart"
  | "arrow"
  | "chevron"
  | "phone"
  | "chat"
  | "pin"
  | "mail"
  | "clock"
  | "shield"
  | "users"
  | "hanger"
  | "book"
  | "money"
  | "close"
  | "menu"
  | "search"
  | "tag"
  | "reset";

const paths: Record<IconName, React.ReactNode> = {
  search: <><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></>,
  tag: <><path d="M20 3h-7L3 13a2 2 0 0 0 0 3l5 5a2 2 0 0 0 3 0L21 11V4a1 1 0 0 0-1-1Z" /><circle cx="17" cy="7" r="1" /></>,
  reset: <><path d="M20 7a9 9 0 0 0-15-2L3 8m0-5v5h5M4 17a9 9 0 0 0 15 2l2-3m0 5v-5h-5" /></>,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M4 11h16" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  cart: (
    <>
      <path d="M3 3h2l3 12h11l2-9H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  phone: <path d="m7 3 3 5-3 2a15 15 0 0 0 7 7l2-3 5 3-1 4C10 23 1 14 3 4Z" />,
  chat: (
    <>
      <path d="M21 15a3 3 0 0 1-3 3H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M7 8h10M7 12h7" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2" />
    </>
  ),
  hanger: <path d="M10 5a2 2 0 1 1 3 2c-1 1-1 2-1 4L2 18v2h20v-2l-10-7" />,
  book: (
    <>
      <path d="M5 3h15v18H5a2 2 0 0 1 0-4h15M5 3a2 2 0 0 0-2 2v14M8 7h8M8 11h6" />
    </>
  ),
  money: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M5 9v6m14-6v6" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
