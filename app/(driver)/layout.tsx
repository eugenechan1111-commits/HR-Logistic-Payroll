import Link from "next/link";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#0F1117" }}>
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t"
        style={{ background: "#161B22", borderColor: "#21262D", height: "64px" }}
      >
        <NavItem href="/driver" label="Home" icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />
        <NavItem href="/driver/claims" label="Claims" icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 14l6-6M9.5 8.5a.5.5 0 11-1 0 .5.5 0 011 0M14.5 13.5a.5.5 0 11-1 0 .5.5 0 011 0M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        } />
        <NavItem href="/driver/history" label="History" icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3M3.05 11a9 9 0 109.02-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 5v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />
      </nav>
    </div>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 text-xs font-medium transition-colors"
      style={{ color: "#8B949E" }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
