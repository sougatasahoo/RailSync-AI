import { useState } from "react"

import OperationsOverview, {
  type PageKey,
} from "./components/OperationsOverview"

import MaintenanceRequests from "./components/MaintenanceRequests"
import BlockPlanning from "./components/BlockPlanning"
import ResourceReadiness from "./components/ResourceReadiness"
import AnalyticsReports from "./components/AnalyticsReports"
import AlertsNotifications from "./components/AlertsNotifications"

import "./App.css"

const navigationItems: PageKey[] = [
  "Operations Overview",
  "Maintenance Requests",
  "Block Planning",
  "Resource Readiness",
  "Analytics & Reports",
  "Alerts & Notifications",
]

function ModulePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="page-placeholder">
      <div className="page-placeholder-icon">●</div>

      <h1>{title}</h1>

      <p>{description}</p>

      <span>Module foundation ready for implementation.</span>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] =
    useState<PageKey>("Operations Overview")

  const navigateTo = (page: PageKey) => {
    setActivePage(page)
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">RS</div>

          <div>
            <div className="sidebar-title">RAILSYNC AI</div>
            <div className="sidebar-subtitle">
              Railway Operations Platform
            </div>
          </div>
        </div>

        <div className="division-context">
          <span>DIVISION</span>
          <strong>Kharagpur Division</strong>
          <small>Block Planning</small>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`navigation-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => navigateTo(item)}
            >
              <span className="navigation-indicator" />
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <div className="system-status-header">
              <span>SYSTEM STATUS</span>
              <span className="status-dot" />
            </div>

            <strong>7/7 systems online</strong>

            <small>Operational data synchronized</small>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">BO</div>

            <div>
              <strong>Block Planning Official</strong>
              <span>Operations Control</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="app-main">
        <header className="topbar">
          <div>
            <span className="topbar-label">RAILWAY OPERATIONS</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="global-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search requests, blocks, resources..."
              />
            </div>

            <button
              type="button"
              className="topbar-notification"
              onClick={() => navigateTo("Alerts & Notifications")}
              title="Open alerts and notifications"
            >
              <span className="notification-icon">!</span>
              <span className="notification-badge">3</span>
            </button>
          </div>
        </header>

        <div className="page-container">
          {activePage === "Operations Overview" && (
            <OperationsOverview onNavigate={navigateTo} />
          )}

          {activePage === "Maintenance Requests" && (
            <MaintenanceRequests onNavigate={navigateTo} />
          )}

          {activePage === "Block Planning" && (
            <BlockPlanning onNavigate={navigateTo} />
          )}

          {activePage === "Resource Readiness" && (
            <ResourceReadiness onNavigate={navigateTo} />
          )}

          {activePage === "Analytics & Reports" && (
            <AnalyticsReports onNavigate={navigateTo} />
          )}

          {activePage === "Alerts & Notifications" && (
            <AlertsNotifications onNavigate={navigateTo} />
          )}

          {!navigationItems.includes(activePage) && (
            <ModulePlaceholder
              title={activePage}
              description="This operational module is part of the RailSync AI platform."
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App