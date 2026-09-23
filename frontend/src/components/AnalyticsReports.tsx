import { useState } from "react"
import type { PageKey } from "./OperationsOverview"
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  Gauge,
  Layers3,
  PackageCheck,
  Route,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react"

type AnalyticsReportsProps = {
  onNavigate: (page: PageKey) => void
}

type TrendPoint = {
  label: string
  value: number
}

const weeklyUtilization: TrendPoint[] = [
  { label: "Mon", value: 72 },
  { label: "Tue", value: 78 },
  { label: "Wed", value: 81 },
  { label: "Thu", value: 76 },
  { label: "Fri", value: 88 },
  { label: "Sat", value: 84 },
  { label: "Sun", value: 91 },
]

const departmentData = [
  {
    name: "TMS",
    requests: 42,
    completed: 37,
    utilization: 88,
  },
  {
    name: "SMMS",
    requests: 31,
    completed: 27,
    utilization: 84,
  },
  {
    name: "TDMS",
    requests: 26,
    completed: 23,
    utilization: 91,
  },
]

type RecentOutcome = {
  id: string
  activity: string
  corridor: string
  date: string
  requests: number
  duration: string
  utilization: string
  status: "Completed" | "Approved"
}

const recentOutcomes: RecentOutcome[] = [
  {
    id: "BLK-260922-04",
    activity: "Kharagpur Yard Joint Maintenance",
    corridor: "Kharagpur Yard",
    date: "22 Sep 2026",
    requests: 4,
    duration: "2 hr",
    utilization: "94%",
    status: "Completed",
  },
  {
    id: "BLK-260921-02",
    activity: "OHE & Track Coordinated Window",
    corridor: "Kharagpur–Jhargram",
    date: "21 Sep 2026",
    requests: 3,
    duration: "2 hr 30 min",
    utilization: "91%",
    status: "Completed",
  },
  {
    id: "BLK-260920-06",
    activity: "Signal Maintenance Window",
    corridor: "Howrah–Kharagpur",
    date: "20 Sep 2026",
    requests: 2,
    duration: "1 hr 30 min",
    utilization: "86%",
    status: "Approved",
  },
  {
    id: "BLK-260919-03",
    activity: "Track Geometry Verification",
    corridor: "Kharagpur–Balasore",
    date: "19 Sep 2026",
    requests: 2,
    duration: "1 hr",
    utilization: "89%",
    status: "Completed",
  },
]

function AnalyticsReports({
  onNavigate,
}: AnalyticsReportsProps) {
  const [period, setPeriod] = useState("Last 7 Days")

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <BarChart3 size={15} />
            Performance Workspace
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Analytics & Reports
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Monitor planning performance, maintenance outcomes and
            how effectively available block windows are being used.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#1d5f8c] focus:ring-2 focus:ring-[#1d5f8c]/10"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </section>

      {/* Main KPIs */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AnalyticsKpi
          label="Block Utilization"
          value="86%"
          change="+8.4%"
          detail="vs previous period"
          icon={<Gauge size={18} />}
          trend="up"
        />

        <AnalyticsKpi
          label="Maintenance Completed"
          value="87"
          change="+12"
          detail="activities completed"
          icon={<CheckCircle2 size={18} />}
          trend="up"
        />

        <AnalyticsKpi
          label="Joint Opportunities"
          value="24"
          change="+6"
          detail="combined activities"
          icon={<Layers3 size={18} />}
          trend="up"
        />

        <AnalyticsKpi
          label="Network Availability"
          value="94.2%"
          change="+2.1%"
          detail="operational availability"
          icon={<Activity size={18} />}
          trend="up"
        />
      </section>

      {/* Main chart + insight */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* Utilization chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Block Utilization Trend
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Percentage of available block time effectively
                utilized.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <TrendingUp size={12} />
              Improving
            </span>
          </div>

          <div className="mt-6">
            <UtilizationChart />
          </div>
        </div>

        {/* RailSync insight */}
        <div className="rounded-xl border border-[#cfe1ed] bg-[#f1f7fa] p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dcecf5] text-[#1d5f8c]">
              <Gauge size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#123b5d]">
                RailSync Insight
              </h2>

              <p className="text-[11px] text-[#567187]">
                Planning performance
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <InsightItem
              value="24"
              label="joint activities identified"
              icon={<Layers3 size={15} />}
            />

            <InsightItem
              value="18%"
              label="less unused block time"
              icon={<Clock3 size={15} />}
            />

            <InsightItem
              value="31"
              label="resource conflicts avoided"
              icon={<ShieldIcon />}
            />
          </div>

          <div className="mt-5 border-t border-[#d7e7f0] pt-4">
            <p className="text-xs leading-5 text-[#567187]">
              Coordinating compatible maintenance activities can
              improve utilization of planned maintenance windows.
            </p>
          </div>
        </div>
      </section>

      {/* Outcome metrics */}
      <section className="grid gap-4 lg:grid-cols-3">
        <OutcomeCard
          title="Planning Efficiency"
          value="89%"
          detail="Plans completed without major revision"
          icon={<FileBarChart size={18} />}
          progress={89}
        />

        <OutcomeCard
          title="Resource Utilization"
          value="92%"
          detail="Available resources used in planned work"
          icon={<PackageCheck size={18} />}
          progress={92}
        />

        <OutcomeCard
          title="Schedule Reliability"
          value="94%"
          detail="Approved blocks executed as planned"
          icon={<CalendarDays size={18} />}
          progress={94}
        />
      </section>

      {/* Department performance */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Department Performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Maintenance activity and completion across connected
            departments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Department
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Requests
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Completed
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Completion
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Resource Utilization
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {departmentData.map((department) => {
                const completion = Math.round(
                  (department.completed /
                    department.requests) *
                    100,
                )

                return (
                  <tr
                    key={department.name}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Wrench size={15} />
                        </div>

                        <span className="text-sm font-bold text-slate-800">
                          {department.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {department.requests}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {department.completed}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#1d5f8c]"
                            style={{
                              width: `${completion}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-bold text-slate-600">
                          {completion}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                        <TrendingUp size={14} />
                        {department.utilization}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent outcomes */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Recent Planning Outcomes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Recently completed or approved block plans.
            </p>
          </div>

          <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d5f8c] hover:underline">
            View all reports
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentOutcomes.map((outcome) => (
            <OutcomeRow
              key={outcome.id}
              outcome={outcome}
            />
          ))}
        </div>
      </section>

      {/* Quick reports */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900">
            Quick Reports
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Generate commonly used planning and operational reports.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            title="Weekly Block Report"
            description="Utilization, completed work and exceptions"
            icon={<CalendarDays size={18} />}
          />

          <ReportCard
            title="Maintenance Summary"
            description="Department-wise maintenance performance"
            icon={<Wrench size={18} />}
          />

          <ReportCard
            title="Resource Report"
            description="Manpower, machines and materials"
            icon={<Users size={18} />}
          />

          <ReportCard
            title="Availability Report"
            description="Network availability and block impact"
            icon={<Route size={18} />}
          />
        </div>
      </section>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <button
          onClick={() =>
            onNavigate("Block Planning")
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white transition hover:bg-[#0d304b]"
        >
          <CalendarDays size={16} />
          Open Block Planning
        </button>

        <button
          onClick={() =>
            onNavigate("Maintenance Requests")
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Wrench size={16} />
          View Maintenance
        </button>

        <button
          onClick={() =>
            onNavigate("Resource Readiness")
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <PackageCheck size={16} />
          Resource Readiness
        </button>
      </div>

      {/* Prototype note */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
        <Gauge
          size={16}
          className="mt-0.5 shrink-0 text-[#1d5f8c]"
        />

        <span>
          Analytics shown here use representative prototype data.
          Connected operational data will populate the reports and
          performance indicators in the final system.
        </span>
      </div>
    </div>
  )
}

function AnalyticsKpi({
  label,
  value,
  change,
  detail,
  icon,
  trend,
}: {
  label: string
  value: string
  change: string
  detail: string
  icon: React.ReactNode
  trend: "up" | "down"
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef6fb] text-[#1d5f8c]">
          {icon}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-bold ${
            trend === "up"
              ? "text-emerald-600"
              : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}

          {change}
        </span>

        <span className="text-xs text-slate-400">
          {detail}
        </span>
      </div>
    </div>
  )
}

function UtilizationChart() {
  return (
    <div>
      <div className="relative h-56">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[100, 75, 50, 25, 0].map((value) => (
            <div
              key={value}
              className="flex items-center gap-3"
            >
              <span className="w-7 text-right text-[10px] font-medium text-slate-400">
                {value}%
              </span>

              <div className="h-px flex-1 bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-10 right-0 top-0 flex items-end justify-between gap-2 px-2">
          {weeklyUtilization.map((point) => {
            const height =
              `${Math.max(point.value * 0.92, 8)}%`

            return (
              <div
                key={point.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full max-w-9 rounded-t-md bg-[#1d5f8c] transition hover:bg-[#164d73]"
                    style={{
                      height,
                    }}
                    title={`${point.label}: ${point.value}%`}
                  />
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  {point.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InsightItem({
  value,
  label,
  icon,
}: {
  value: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#1d5f8c] shadow-sm">
        {icon}
      </div>

      <div>
        <span className="text-lg font-bold text-[#123b5d]">
          {value}
        </span>

        <p className="text-xs text-[#567187]">
          {label}
        </p>
      </div>
    </div>
  )
}

function OutcomeCard({
  title,
  value,
  detail,
  icon,
  progress,
}: {
  title: string
  value: string
  detail: string
  icon: React.ReactNode
  progress: number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <span className="text-xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {detail}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#1d5f8c]"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  )
}

function OutcomeRow({
  outcome,
}: {
  outcome: RecentOutcome
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={17} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold tracking-wide text-slate-400">
              {outcome.id}
            </span>

            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              {outcome.status}
            </span>
          </div>

          <h3 className="mt-1 text-sm font-bold text-slate-900">
            {outcome.activity}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {outcome.corridor} · {outcome.date}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 pl-12 lg:w-[330px] lg:pl-0">
        <OutcomeMetric
          label="Activities"
          value={String(outcome.requests)}
        />

        <OutcomeMetric
          label="Duration"
          value={outcome.duration}
        />

        <OutcomeMetric
          label="Utilization"
          value={outcome.utilization}
        />
      </div>
    </div>
  )
}

function OutcomeMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  )
}

function ReportCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <button className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#cfe1ed] hover:bg-[#f8fbfd]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef6fb] text-[#1d5f8c]">
          {icon}
        </div>

        <ArrowRight
          size={16}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1d5f8c]"
        />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </button>
  )
}

function ShieldIcon() {
  return <ShieldIconSvg />
}

function ShieldIconSvg() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export default AnalyticsReports