import { useState } from "react"

import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Network,
  ShieldCheck,
} from "lucide-react"

import Dashboard from "./pages/Dashboard"
import Maintenance from "./pages/Maintenance"
import JointOpportunities from "./pages/JointOpportunities"
import BlockPlanner from "./pages/BlockPlanner"
import Approvals from "./pages/Approvals"
import BDMS from "./pages/BDMS"

import type { PageKey } from "./types/navigation"

import "./App.css"

const navigationItems: {
  key: PageKey
  label: string
  icon: typeof LayoutDashboard
}[] = [
  {
    key: "Dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "Maintenance",
    label: "Maintenance",
    icon: ClipboardList,
  },
  {
    key: "Joint Opportunities",
    label: "Joint Opportunities",
    icon: Network,
  },
  {
    key: "Block Planner",
    label: "Block Planner",
    icon: CalendarDays,
  },
  {
    key: "Approvals",
    label: "Approvals",
    icon: ShieldCheck,
  },
  {
    key: "BDMS",
    label: "BDMS",
    icon: FileCheck2,
  },
]

function App() {
  const [activePage, setActivePage] =
    useState<PageKey>("Dashboard")

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img
              src="/railsync-icon.png"
              alt="RailSync AI"
            />
          </div>

          <div>
            <div className="sidebar-title">
              RAILSYNC AI
            </div>

            <div className="sidebar-subtitle">
              Railway Block Planning
            </div>
          </div>
        </div>

        <div className="division-context">
          <span>PLANNING CONTEXT</span>

          <strong>
            Kharagpur Division
          </strong>

          <small>
            Howrah–Kharagpur Operational Simulation
          </small>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.key}
                type="button"
                className={`navigation-item ${
                  activePage === item.key
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActivePage(item.key)
                }
              >
                <Icon
                  size={17}
                  strokeWidth={1.8}
                />

                <span>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <div className="system-status-header">
              <span>
                SYSTEM STATUS
              </span>

              <span className="status-dot" />
            </div>

            <strong>
              Prototype operational
            </strong>

            <small>
              Synthetic railway data environment
            </small>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">
              BO
            </div>

            <div>
              <strong>
                Block Planning Official
              </strong>

              <span>
                Operations Control
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div>
            <span className="topbar-label">
              RAILWAY OPERATIONS
            </span>

            <strong>
              {activePage}
            </strong>
          </div>

          <div className="topbar-actions">
            <span className="planning-status">
              PLANNING MODE
            </span>

            <button
              type="button"
              className="notification-button"
              title="Notifications"
            >
              <Bell size={17} />

              <span className="notification-badge">
                3
              </span>
            </button>
          </div>
        </header>

        <div className="page-container">
          <PageContent
            page={activePage}
            onNavigate={setActivePage}
          />
        </div>
      </main>
    </div>
  )
}

function PageContent({
  page,
  onNavigate,
}: {
  page: PageKey
  onNavigate: (page: PageKey) => void
}) {
  switch (page) {
    case "Dashboard":
      return <Dashboard />

    case "Maintenance":
      return <Maintenance />

    case "Joint Opportunities":
      return <JointOpportunities />

    case "Block Planner":
      return <BlockPlanner />

    case "Approvals":
      return (
        <Approvals
          onNavigate={onNavigate}
        />
      )

    case "BDMS":
      return (
        <BDMS
          onNavigate={onNavigate}
        />
      )

    default:
      return null
  }
}

export default App