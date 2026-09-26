"use client";

// ============================================================
// Sidebar navigation
// Collapsible on tablet (<1024px), shows icon-only mode.
// Uses a drawer overlay on mobile.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Products", href: "/products", icon: "📦" },
  {
    label: "Operations",
    icon: "⚙️",
    children: [
      { label: "Receipts", href: "/operations/receipts", icon: "📥" },
      { label: "Delivery Orders", href: "/operations/deliveries", icon: "📤" },
      { label: "Internal Transfers", href: "/operations/transfers", icon: "🔄" },
      { label: "Stock Adjustments", href: "/operations/adjustments", icon: "🔧" },
      { label: "Move History", href: "/operations/history", icon: "📋" },
    ],
  },
  { label: "Warehouses", href: "/warehouses", icon: "🏭" },
  { label: "Stock Ledger", href: "/ledger", icon: "📚" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Operations"]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  }

  function isActive(href?: string) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
        <span className="text-2xl">📦</span>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">
            Stock<span className="text-indigo-400">Sense</span>
          </span>
        )}
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 text-slate-400 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            const isExpanded = expandedGroups.includes(item.label);
            const hasActiveChild = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    hasActiveChild
                      ? "text-white bg-slate-700"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">
                        {item.label}
                      </span>
                      <span
                        className={`text-xs transition-transform duration-150 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      >
                        ›
                      </span>
                    </>
                  )}
                </button>
                {isExpanded && !collapsed && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href!}
                        onClick={onMobileClose}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? "text-white bg-indigo-600"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-sm shrink-0">{child.icon}</span>
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? "text-white bg-indigo-600"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Profile shortcut */}
      <div className="border-t border-slate-800 px-2 py-3">
        <Link
          href="/profile"
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            D
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">Demo User</p>
              <p className="text-xs truncate">demo@stocksense.app</p>
            </div>
          )}
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-slate-900 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
