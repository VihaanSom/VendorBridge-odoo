import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  CheckSquare,
  Receipt,
  BarChart3,
  Activity,
  Bell,
  ChevronLeft,
  Building2,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// ── Types ───────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  active?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

// ── Navigation Config ───────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', active: true },
  { label: 'Vendors', icon: Users, href: '/vendors' },
  { label: "RFQ's", icon: FileText, href: '/rfqs' },
  { label: 'Create RFQ', icon: FileText, href: '/rfqs/new' },
  { label: 'Quotations', icon: ClipboardList, href: '/quotations' },
  { label: 'Approvals', icon: CheckSquare, href: '/approvals' },
  { label: 'PO & Invoices', icon: Receipt, href: '/invoices' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  { label: 'Activity', icon: Activity, href: '/activity' },
];

// ── Component ───────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
  activePage = 'Dashboard',
}: DashboardLayoutProps): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const { user, logout } = useAuth();

  // Derive display name from user
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : 'User';
  const displayRole = user?.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : 'User';

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ── Top Navbar ────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-30">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            VendorBridge
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700 leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 leading-tight">{displayRole}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ──────────────────────────────────────── */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-60'
          } bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-20`}
        >
          {/* Collapse Toggle */}
          <div className="flex justify-end px-3 pt-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-300 ${
                  sidebarCollapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === activePage;
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="px-4 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                VendorBridge v1.0
              </p>
            </div>
          )}
        </aside>

        {/* ── Main Content Area ──────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
