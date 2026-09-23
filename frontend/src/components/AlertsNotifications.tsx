import { useMemo, useState } from "react"
import type { PageKey } from "./OperationsOverview"

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Info,
  Search,
  ShieldAlert,
  X,
} from "lucide-react"

type AlertSeverity = "Critical" | "High" | "Medium" | "Info"
type AlertStatus = "Pending" | "Acknowledged" | "Resolved"

type AlertItem = {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  status: AlertStatus
  category: "Block Planning" | "Resource" | "Maintenance" | "Operations" | "System"
  source: string
  timestamp: string
  affectedArea: string
  impact: string
  action: string
  targetPage: PageKey
}

type AlertsNotificationsProps = {
  onNavigate: (page: PageKey) => void
}

const alerts: AlertItem[] = [
  {
    id: "ALT-024",
    title: "Resource shortage affecting proposed block",
    description:
      "Required OHE maintenance team is not fully available for the proposed block window.",
    severity: "Critical",
    status: "Pending",
    category: "Resource",
    source: "Resource Readiness",
    timestamp: "08:42",
    affectedArea: "KGP–BLS Corridor",
    impact: "Proposed block may require rescheduling.",
    action: "Review resource availability and assign alternate team.",
    targetPage: "Resource Readiness",
  },
  {
    id: "ALT-023",
    title: "Block conflict detected",
    description:
      "Two maintenance activities overlap within the same operational window.",
    severity: "Critical",
    status: "Pending",
    category: "Block Planning",
    source: "Block Planning",
    timestamp: "08:18",
    affectedArea: "Kharagpur Yard",
    impact: "Simultaneous execution is not recommended.",
    action: "Review conflict and combine or reschedule activities.",
    targetPage: "Block Planning",
  },
  {
    id: "ALT-022",
    title: "Maintenance request approaching due date",
    description:
      "A high-priority signalling maintenance request is due within 24 hours.",
    severity: "High",
    status: "Pending",
    category: "Maintenance",
    source: "SMMS",
    timestamp: "07:56",
    affectedArea: "KGP–MDN Section",
    impact: "Delay may increase operational maintenance backlog.",
    action: "Review request and include it in the next planning cycle.",
    targetPage: "Maintenance Requests",
  },
  {
    id: "ALT-021",
    title: "High-priority request awaiting planning",
    description:
      "A critical track maintenance request has not yet been assigned to a block.",
    severity: "High",
    status: "Acknowledged",
    category: "Maintenance",
    source: "TMS",
    timestamp: "07:34",
    affectedArea: "BLS Section",
    impact: "Maintenance completion may be delayed.",
    action: "Review maintenance request and evaluate block opportunity.",
    targetPage: "Maintenance Requests",
  },
  {
    id: "ALT-020",
    title: "Machine availability updated",
    description:
      "Track machine availability has changed for the upcoming planning window.",
    severity: "Medium",
    status: "Pending",
    category: "Resource",
    source: "TMMMS",
    timestamp: "07:12",
    affectedArea: "Kharagpur Division",
    impact: "Resource assignment may need adjustment.",
    action: "Review resource readiness before finalizing the plan.",
    targetPage: "Resource Readiness",
  },
  {
    id: "ALT-019",
    title: "Block plan awaiting approval",
    description:
      "The proposed weekly block plan is ready for human review.",
    severity: "Medium",
    status: "Acknowledged",
    category: "Block Planning",
    source: "RailSync AI",
    timestamp: "06:48",
    affectedArea: "Week 39 Planning",
    impact: "Approval is required before downstream handoff.",
    action: "Review proposed plan and approve or revise.",
    targetPage: "Block Planning",
  },
  {
    id: "ALT-018",
    title: "Operational data synchronized",
    description:
      "Latest operational and maintenance data has been successfully synchronized.",
    severity: "Info",
    status: "Resolved",
    category: "System",
    source: "Data Fusion",
    timestamp: "06:30",
    affectedArea: "RailSync AI Platform",
    impact: "No operational impact.",
    action: "No action required.",
    targetPage: "Operations Overview",
  },
  {
    id: "ALT-017",
    title: "Daily planning summary available",
    description:
      "The latest operational planning summary is available for review.",
    severity: "Info",
    status: "Resolved",
    category: "Operations",
    source: "Operations Overview",
    timestamp: "Yesterday",
    affectedArea: "Kharagpur Division",
    impact: "No operational impact.",
    action: "Review the daily operational summary if required.",
    targetPage: "Operations Overview",
  },
]

const severityConfig: Record<
  AlertSeverity,
  {
    icon: typeof AlertCircle
    className: string
    badge: string
  }
> = {
  Critical: {
    icon: ShieldAlert,
    className: "border-red-200 bg-red-50 text-red-700",
    badge: "bg-red-100 text-red-700",
  },
  High: {
    icon: AlertCircle,
    className: "border-orange-200 bg-orange-50 text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },
  Medium: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  Info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string
  value: string
  description: string
  icon: typeof Bell
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

export default function AlertsNotifications({
  onNavigate,
}: AlertsNotificationsProps) {
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("All")
  const [status, setStatus] = useState("All")
  const [category, setCategory] = useState("All")
  const [selectedId, setSelectedId] = useState(alerts[0].id)

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return alerts.filter((alert) => {
      const matchesSearch =
        !query ||
        alert.id.toLowerCase().includes(query) ||
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.affectedArea.toLowerCase().includes(query)

      const matchesSeverity =
        severity === "All" || alert.severity === severity

      const matchesStatus =
        status === "All" || alert.status === status

      const matchesCategory =
        category === "All" || alert.category === category

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus &&
        matchesCategory
      )
    })
  }, [search, severity, status, category])

  const selectedAlert =
    alerts.find((alert) => alert.id === selectedId) ??
    filteredAlerts[0] ??
    alerts[0]

  const criticalCount = alerts.filter(
    (alert) => alert.severity === "Critical" && alert.status !== "Resolved",
  ).length

  const pendingCount = alerts.filter(
    (alert) => alert.status === "Pending",
  ).length

  const infoCount = alerts.filter(
    (alert) => alert.severity === "Info",
  ).length

  const resolvedCount = alerts.filter(
    (alert) => alert.status === "Resolved",
  ).length

  const resetFilters = () => {
    setSearch("")
    setSeverity("All")
    setStatus("All")
    setCategory("All")
  }

  const SeverityIcon = severityConfig[selectedAlert.severity].icon

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Bell size={16} />
              Operational awareness
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Alerts & Notifications
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Monitor operational issues, planning conflicts, resource
              constraints, and important system notifications.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notification status
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {pendingCount} actions require attention
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Critical"
          value={String(criticalCount)}
          description="Immediate operational attention"
          icon={ShieldAlert}
        />

        <StatCard
          label="Pending Actions"
          value={String(pendingCount)}
          description="Awaiting official action"
          icon={Clock3}
        />

        <StatCard
          label="Informational"
          value={String(infoCount)}
          description="Recent system notifications"
          icon={Info}
        />

        <StatCard
          label="Resolved"
          value={String(resolvedCount)}
          description="Closed notifications"
          icon={CheckCircle2}
        />
      </div>

      {/* Main workspace */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        {/* Alerts list */}
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Notification Centre
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredAlerts.length} notifications matching current filters
                </p>
              </div>

              <div className="relative w-full lg:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search alerts..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Filter size={14} />
                Filters
              </div>

              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
              >
                <option>All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Info</option>
              </select>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Acknowledged</option>
                <option>Resolved</option>
              </select>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
              >
                <option>All</option>
                <option>Block Planning</option>
                <option>Resource</option>
                <option>Maintenance</option>
                <option>Operations</option>
                <option>System</option>
              </select>

              {(search ||
                severity !== "All" ||
                status !== "All" ||
                category !== "All") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={13} />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredAlerts.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="mx-auto text-slate-300" size={30} />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No notifications found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try changing the current filters.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const config = severityConfig[alert.severity]
                const Icon = config.icon
                const isSelected = alert.id === selectedAlert.id

                return (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => setSelectedId(alert.id)}
                    className={`w-full p-4 text-left transition ${
                      isSelected
                        ? "bg-slate-50"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${config.className}`}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {alert.title}
                              </p>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}
                              >
                                {alert.severity}
                              </span>
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                              {alert.description}
                            </p>
                          </div>

                          <ChevronRight
                            size={16}
                            className="mt-1 shrink-0 text-slate-400"
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span>{alert.id}</span>
                          <span>{alert.category}</span>
                          <span>{alert.affectedArea}</span>
                          <span>{alert.timestamp}</span>

                          <span
                            className={`font-medium ${
                              alert.status === "Pending"
                                ? "text-orange-600"
                                : alert.status === "Acknowledged"
                                  ? "text-blue-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        {/* Detail panel */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Alert details
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedAlert.id}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                  severityConfig[selectedAlert.severity].className
                }`}
              >
                <SeverityIcon size={17} />
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedAlert.title}
                </h3>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    severityConfig[selectedAlert.severity].badge
                  }`}
                >
                  {selectedAlert.severity}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedAlert.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Source
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {selectedAlert.source}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {selectedAlert.status}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Affected area
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {selectedAlert.affectedArea}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Time
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {selectedAlert.timestamp}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Operational impact
              </p>
              <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                {selectedAlert.impact}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recommended action
              </p>
              <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                {selectedAlert.action}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(selectedAlert.targetPage)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open {selectedAlert.targetPage}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>

      {/* Priority action strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-orange-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Priority actions
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Resolve critical planning and resource issues before final block
              approval.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("Block Planning")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Review Block Planning
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("Resource Readiness")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Check Resources
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Prototype note */}
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
        <p className="text-[11px] leading-5 text-slate-500">
          <span className="font-semibold text-slate-700">
            Prototype note:
          </span>{" "}
          Notification records shown here are synthetic demonstration data.
          Live alerts will be generated from RailSync AI system events and
          operational data sources.
        </p>
      </div>
    </div>
  )
}