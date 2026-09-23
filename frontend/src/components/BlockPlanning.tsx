import { useMemo, useState } from "react"
import type { PageKey } from "./OperationsOverview"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Gauge,
  MapPin,
  PackageCheck,
  Plus,
  Route,
  ShieldCheck,
  TrainFront,
  Users,
  Wrench,
  Zap,
} from "lucide-react"

type BlockPlanningProps = {
  onNavigate: (page: PageKey) => void
}

type PlanningStatus =
  | "Ready"
  | "Needs Resources"
  | "Conflict"
  | "Scheduled"

type Opportunity = {
  id: string
  title: string
  corridor: string
  location: string
  date: string
  start: string
  end: string
  duration: string
  requests: number
  departments: string[]
  status: PlanningStatus
  trainImpact: string
  manpower: string
  machine: string
  confidence: number
  reason: string
}

const opportunities: Opportunity[] = [
  {
    id: "BLK-260924-01",
    title: "Kharagpur–Jhargram Maintenance Window",
    corridor: "Kharagpur–Jhargram",
    location: "Km 126/4 – Km 129/8",
    date: "24 Sep 2026",
    start: "10:30",
    end: "13:00",
    duration: "2 hr 30 min",
    requests: 3,
    departments: ["TMS", "TDMS"],
    status: "Ready",
    trainImpact: "2 freight movements can be rescheduled",
    manpower: "15 staff available",
    machine: "Rail Cutting Machine + Tower Wagon",
    confidence: 94,
    reason:
      "Combines a critical rail joint replacement with nearby OHE maintenance while maintaining an acceptable traffic window.",
  },
  {
    id: "BLK-260925-02",
    title: "Andul Signalling Maintenance Window",
    corridor: "Howrah–Kharagpur",
    location: "Andul Yard – Signal 42",
    date: "25 Sep 2026",
    start: "01:00",
    end: "02:30",
    duration: "1 hr 30 min",
    requests: 2,
    departments: ["SMMS"],
    status: "Needs Resources",
    trainImpact: "1 passenger movement requires coordination",
    manpower: "5 of 6 staff available",
    machine: "Diagnostic Kit available",
    confidence: 87,
    reason:
      "Suitable timing identified, but one signalling resource is currently unavailable for the complete activity.",
  },
  {
    id: "BLK-260926-03",
    title: "Panskura OHE Maintenance Window",
    corridor: "Howrah–Kharagpur",
    location: "Panskura Station – Mast 17",
    date: "26 Sep 2026",
    start: "11:00",
    end: "13:00",
    duration: "2 hr",
    requests: 2,
    departments: ["TDMS"],
    status: "Ready",
    trainImpact: "Power isolation required",
    manpower: "7 staff available",
    machine: "Tower Wagon available",
    confidence: 91,
    reason:
      "Resource availability and power isolation window align with the requested OHE maintenance duration.",
  },
  {
    id: "BLK-260927-04",
    title: "Kharagpur Yard Joint Window",
    corridor: "Kharagpur Yard",
    location: "Point 118 – Yard Section C",
    date: "27 Sep 2026",
    start: "14:00",
    end: "15:15",
    duration: "1 hr 15 min",
    requests: 2,
    departments: ["SMMS", "TMS"],
    status: "Conflict",
    trainImpact: "Yard movement conflict detected",
    manpower: "9 staff available",
    machine: "Diagnostic Equipment available",
    confidence: 72,
    reason:
      "Potential joint opportunity exists, but the current yard movement plan creates a timing conflict.",
  },
]

function BlockPlanning({
  onNavigate,
}: BlockPlanningProps) {
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity>(opportunities[0])

  const [planningDate, setPlanningDate] =
    useState("24 Sep 2026")

  const [showOnlyReady, setShowOnlyReady] =
    useState(false)

  const filteredOpportunities = useMemo(() => {
    if (!showOnlyReady) {
      return opportunities
    }

    return opportunities.filter(
      (item) => item.status === "Ready",
    )
  }, [showOnlyReady])

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <CalendarDays size={15} />
            Planning Workspace
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Block Planning
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Coordinate maintenance requirements, train operations and
            available resources into practical block windows.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              onNavigate("Maintenance Requests")
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Wrench size={16} />
            Maintenance Requests
          </button>

          <button
            onClick={() =>
              onNavigate("Resource Readiness")
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]"
          >
            <PackageCheck size={16} />
            Resource Readiness
          </button>
        </div>
      </section>

      {/* Planning controls */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Planning horizon
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Weekly Block Planning
              </h2>

              <span className="rounded-full bg-[#eef6fb] px-2.5 py-1 text-xs font-semibold text-[#1d5f8c]">
                23–29 Sep 2026
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">
              Focus date
            </label>

            <select
              value={planningDate}
              onChange={(event) =>
                setPlanningDate(event.target.value)
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#1d5f8c] focus:ring-2 focus:ring-[#1d5f8c]/10"
            >
              <option>24 Sep 2026</option>
              <option>25 Sep 2026</option>
              <option>26 Sep 2026</option>
              <option>27 Sep 2026</option>
              <option>28 Sep 2026</option>
              <option>29 Sep 2026</option>
            </select>

            <button
              onClick={() =>
                setShowOnlyReady((value) => !value)
              }
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                showOnlyReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck size={15} />
              Ready only
            </button>
          </div>
        </div>
      </section>

      {/* Planning KPIs */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <PlanningKpi
          label="Requests in Plan"
          value="11"
          detail="Across 6 corridors"
          icon={<Wrench size={18} />}
        />

        <PlanningKpi
          label="Joint Opportunities"
          value="4"
          detail="Potential combined windows"
          icon={<Zap size={18} />}
          accent="blue"
        />

        <PlanningKpi
          label="Ready to Schedule"
          value="7"
          detail="Resources aligned"
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />

        <PlanningKpi
          label="Conflicts"
          value="2"
          detail="Need planner review"
          icon={<AlertTriangle size={18} />}
          accent="amber"
        />
      </section>

      {/* Main planner */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-h-[650px] xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Opportunities */}
          <div className="min-w-0">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Recommended Planning Opportunities
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    RailSync identifies windows where requests,
                    resources and operations align.
                  </p>
                </div>

                <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">
                  {filteredOpportunities.length} opportunities
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityRow
                  key={opportunity.id}
                  opportunity={opportunity}
                  selected={
                    selectedOpportunity.id === opportunity.id
                  }
                  onClick={() =>
                    setSelectedOpportunity(opportunity)
                  }
                />
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d5f8c] hover:underline">
                <Plus size={16} />
                Add manual planning window
              </button>
            </div>
          </div>

          {/* Selected opportunity */}
          <OpportunityDetails
            opportunity={selectedOpportunity}
            onNavigate={onNavigate}
          />
        </div>
      </section>

      {/* Planning flow */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Block Planning Workflow
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              From maintenance request to approved operational plan.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <WorkflowStep
            number="01"
            title="Requests"
            description="Collect maintenance needs"
            active
          />

          <WorkflowConnector />

          <WorkflowStep
            number="02"
            title="Opportunities"
            description="Find compatible windows"
            active
          />

          <WorkflowConnector />

          <WorkflowStep
            number="03"
            title="Conflicts"
            description="Check traffic constraints"
            active
          />

          <WorkflowConnector />

          <WorkflowStep
            number="04"
            title="Optimization"
            description="Build suitable plan"
            active
          />

          <WorkflowConnector />

          <WorkflowStep
            number="05"
            title="Approval"
            description="Human review & BDMS"
          />
        </div>
      </section>

      {/* Prototype note */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
        <Gauge
          size={16}
          className="mt-0.5 shrink-0 text-[#1d5f8c]"
        />

        <span>
          Planning recommendations shown here use representative
          prototype data. In the connected system, RailSync AI will
          evaluate live operational, maintenance and resource data.
        </span>
      </div>
    </div>
  )
}

function OpportunityRow({
  opportunity,
  selected,
  onClick,
}: {
  opportunity: Opportunity
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group block w-full text-left transition ${
        selected
          ? "bg-[#f2f7fa]"
          : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex gap-4 px-5 py-4">
        <div
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected
              ? "bg-[#dcecf5] text-[#1d5f8c]"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Route size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold tracking-wide text-slate-400">
              {opportunity.id}
            </span>

            <PlanningStatus status={opportunity.status} />
          </div>

          <h3 className="mt-1 text-sm font-bold text-slate-900">
            {opportunity.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={13} />
              {opportunity.date}
            </span>

            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} />
              {opportunity.start}–{opportunity.end}
            </span>

            <span className="inline-flex items-center gap-1">
              <Wrench size={13} />
              {opportunity.requests} requests
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {opportunity.departments.map((department) => (
              <span
                key={department}
                className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-600"
              >
                {department}
              </span>
            ))}

            <span className="text-[11px] text-slate-400">
              {opportunity.location}
            </span>
          </div>
        </div>

        <ChevronRight
          size={18}
          className={`mt-3 shrink-0 ${
            selected
              ? "text-[#1d5f8c]"
              : "text-slate-300 group-hover:text-slate-500"
          }`}
        />
      </div>
    </button>
  )
}

function OpportunityDetails({
  opportunity,
  onNavigate,
}: {
  opportunity: Opportunity
  onNavigate: (page: PageKey) => void
}) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 xl:border-l xl:border-t-0">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold tracking-wide text-slate-400">
              {opportunity.id}
            </span>

            <h2 className="mt-1.5 text-lg font-bold leading-6 text-slate-900">
              {opportunity.title}
            </h2>
          </div>

          <PlanningStatus status={opportunity.status} />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Window */}
        <section>
          <SectionTitle
            icon={<CalendarDays size={15} />}
            title="Proposed Block Window"
          />

          <div className="rounded-xl border border-[#cfe1ed] bg-[#f1f7fa] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dcecf5] text-[#1d5f8c]">
                <Clock3 size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#567187]">
                  {opportunity.date}
                </p>

                <p className="mt-0.5 text-lg font-bold text-[#123b5d]">
                  {opportunity.start} – {opportunity.end}
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-[#d7e7f0] pt-3 text-xs text-[#567187]">
              Duration:{" "}
              <strong className="text-[#123b5d]">
                {opportunity.duration}
              </strong>
            </div>
          </div>
        </section>

        {/* Location */}
        <section>
          <SectionTitle
            icon={<MapPin size={15} />}
            title="Location & Corridor"
          />

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">
              {opportunity.location}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {opportunity.corridor}
            </p>
          </div>
        </section>

        {/* Requests */}
        <section>
          <SectionTitle
            icon={<Wrench size={15} />}
            title="Combined Work"
          />

          <div className="grid grid-cols-2 gap-3">
            <MiniMetric
              label="Requests"
              value={`${opportunity.requests}`}
              icon={<Wrench size={14} />}
            />

            <MiniMetric
              label="Teams"
              value={opportunity.departments.join(" + ")}
              icon={<Users size={14} />}
            />
          </div>
        </section>

        {/* Resources */}
        <section>
          <SectionTitle
            icon={<PackageCheck size={15} />}
            title="Resource Readiness"
          />

          <div className="space-y-2">
            <ResourceCheck
              label="Manpower"
              value={opportunity.manpower}
              ready={opportunity.status !== "Needs Resources"}
            />

            <ResourceCheck
              label="Machine"
              value={opportunity.machine}
              ready={opportunity.status !== "Needs Resources"}
            />
          </div>
        </section>

        {/* Traffic */}
        <section>
          <SectionTitle
            icon={<TrainFront size={15} />}
            title="Traffic Impact"
          />

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-sm leading-5 text-slate-600">
              {opportunity.trainImpact}
            </p>
          </div>
        </section>

        {/* AI insight */}
        <div className="rounded-xl border border-[#cfe1ed] bg-[#f1f7fa] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gauge
                size={16}
                className="text-[#1d5f8c]"
              />

              <span className="text-sm font-bold text-[#123b5d]">
                RailSync AI Match
              </span>
            </div>

            <span className="text-sm font-bold text-[#1d5f8c]">
              {opportunity.confidence}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dce8ee]">
            <div
              className="h-full rounded-full bg-[#1d5f8c]"
              style={{
                width: `${opportunity.confidence}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {opportunity.reason}
          </p>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 pt-4">
          {opportunity.status === "Conflict" ? (
            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
              <AlertTriangle size={16} />
              Review Conflict
            </button>
          ) : opportunity.status === "Needs Resources" ? (
            <button
              onClick={() =>
                onNavigate("Resource Readiness")
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]"
            >
              <PackageCheck size={16} />
              Check Resource Readiness
            </button>
          ) : (
            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]">
              <FileCheck2 size={16} />
              Add to Proposed Plan
            </button>
          )}

          <p className="mt-2 text-center text-[11px] leading-4 text-slate-400">
            Final block plan remains subject to human approval.
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanningKpi({
  label,
  value,
  detail,
  icon,
  accent = "default",
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  accent?: "default" | "blue" | "green" | "amber"
}) {
  const iconStyle = {
    default: "bg-slate-100 text-slate-600",
    blue: "bg-[#eef6fb] text-[#1d5f8c]",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconStyle[accent]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  )
}

function PlanningStatus({
  status,
}: {
  status: PlanningStatus
}) {
  const styles: Record<PlanningStatus, string> = {
    Ready: "bg-emerald-50 text-emerald-700",
    "Needs Resources": "bg-amber-50 text-amber-700",
    Conflict: "bg-red-50 text-red-700",
    Scheduled: "bg-blue-50 text-blue-700",
  }

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
      <span className="text-[#1d5f8c]">{icon}</span>
      {title}
    </div>
  )
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function ResourceCheck({
  label,
  value,
  ready,
}: {
  label: string
  value: string
  ready: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-medium text-slate-700">
          {value}
        </p>
      </div>

      {ready ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircle2 size={14} />
          Ready
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
          <AlertTriangle size={14} />
          Check
        </span>
      )}
    </div>
  )
}

function WorkflowStep({
  number,
  title,
  description,
  active = false,
}: {
  number: string
  title: string
  description: string
  active?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-[#cfe1ed] bg-white"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            active
              ? "bg-[#123b5d] text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {number}
        </span>

        <div>
          <p
            className={`text-sm font-bold ${
              active
                ? "text-slate-900"
                : "text-slate-500"
            }`}
          >
            {title}
          </p>

          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function WorkflowConnector() {
  return (
    <div className="hidden items-center justify-center md:flex">
      <ArrowRight size={17} className="text-slate-300" />
    </div>
  )
}

export default BlockPlanning