import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Overview", icon: "⬡" },
  { href: "/admin/drivers", label: "Drivers", icon: "◈" },
  { href: "/admin/allowances", label: "Allowances", icon: "◆" },
  { href: "/admin/payroll", label: "Payroll", icon: "◉" },
  { href: "/admin/settings", label: "Settings", icon: "◎" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full" style={{ background: "#0F1117" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 border-r"
        style={{ background: "#161B22", borderColor: "#21262D" }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "#21262D" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F59E0B" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 17h2M21 17h2M3 17V9l5-5h8l5 5v8M7 17v-4h10v4" stroke="#0F1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>FLEETPAY</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Boss Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "#8B949E" }}
            >
              <span className="text-base" style={{ color: "#F59E0B", fontFamily: "monospace" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: "#21262D" }}>
          <form action="/api/admin/logout" method="POST">
            <button className="w-full text-left px-3 py-2 text-xs rounded-lg transition-colors" style={{ color: "#8B949E" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b" style={{ background: "#161B22", borderColor: "#21262D" }}>
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>FLEETPAY</span>
          <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>Boss</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around border-t px-2" style={{ background: "#161B22", borderColor: "#21262D", height: "56px" }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 text-xs" style={{ color: "#8B949E" }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
