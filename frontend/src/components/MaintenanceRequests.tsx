import { useMemo, useState } from "react"
import type { PageKey } from "./OperationsOverview"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Gauge,
  MapPin,
  PackageCheck,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react"

type MaintenanceRequestsProps = {
  onNavigate: (page: PageKey) => void
}

type Priority = "Critical" | "High" | "Medium" | "Low"
type Status = "Pending" | "Under Review" | "Scheduled" | "Completed"

type MaintenanceRequest = {
  id: string
  activity: string
  department: "TMS" | "SMMS" | "TDMS"
  location: string
  corridor: string
  priority: Priority
  status: Status
  submitted: string
  dueDate: string
  duration: string
  blockRequired: boolean
  operationalImpact: string
  manpower: number
  machine: string
  materials: string[]
  aiReason: string
  recommendation: string
}

const requests: MaintenanceRequest[] = [
  {
    id: "TMS-2408",
    activity: "Rail Joint Replacement",
    department: "TMS",
    location: "Kharagpur–Jhargram, Km 126/4",
    corridor: "Kharagpur–Jhargram",
    priority: "Critical",
    status: "Pending",
    submitted: "Today, 08:42",
    dueDate: "24 Sep 2026",
    duration: "2 hr 30 min",
    blockRequired: true,
    operationalImpact:
      "Defect is located on an active passenger corridor and requires a controlled maintenance window.",
    manpower: 8,
    machine: "Rail Cutting Machine",
    materials: ["Rail joint set", "Fasteners", "Insulated liners"],
    aiReason:
      "High priority due to defect severity, traffic exposure and approaching maintenance deadline.",
    recommendation:
      "Coordinate with the signalling and traction teams and include this request in the next suitable block window.",
  },
  {
    id: "SMMS-1832",
    activity: "Signal Cable Inspection",
    department: "SMMS",
    location: "Andul Yard, Signal 42",
    corridor: "Howrah–Kharagpur",
    priority: "High",
    status: "Under Review",
    submitted: "Today, 07:55",
    dueDate: "25 Sep 2026",
    duration: "1 hr 30 min",
    blockRequired: true,
    operationalImpact:
      "Inspection requires controlled access near a signal location used by scheduled movements.",
    manpower: 5,
    machine: "Test & Diagnostic Kit",
    materials: ["Cable joints", "Insulation tape"],
    aiReason:
      "Elevated priority because the inspection affects signalling reliability on a busy section.",
    recommendation:
      "Check for a compatible block with nearby maintenance activities before scheduling separately.",
  },
  {
    id: "TDMS-0917",
    activity: "OHE Isolator Maintenance",
    department: "TDMS",
    location: "Panskura Station, OHE Mast 17",
    corridor: "Howrah–Kharagpur",
    priority: "High",
    status: "Pending",
    submitted: "Yesterday, 16:20",
    dueDate: "26 Sep 2026",
    duration: "2 hr",
    blockRequired: true,
    operationalImpact:
      "Requires power isolation and coordinated access to the overhead equipment zone.",
    manpower: 7,
    machine: "Tower Wagon",
    materials: ["Isolator kit", "Contact hardware"],
    aiReason:
      "Priority is driven by equipment condition, power isolation requirements and resource dependency.",
    recommendation:
      "Match with an existing OHE-compatible block and confirm tower wagon availability.",
  },
  {
    id: "TMS-2394",
    activity: "Track Geometry Verification",
    department: "TMS",
    location: "Kharagpur–Balasore, Km 188/2",
    corridor: "Kharagpur–Balasore",
    priority: "Medium",
    status: "Pending",
    submitted: "Yesterday, 13:10",
    dueDate: "27 Sep 2026",
    duration: "1 hr",
    blockRequired: true,
    operationalImpact:
      "Verification can be completed during a planned maintenance window with limited operational disruption.",
    manpower: 4,
    machine: "Track Recording Trolley",
    materials: ["Calibration kit"],
    aiReason:
      "Routine verification is due soon but does not currently indicate an immediate operational risk.",
    recommendation:
      "Combine with another TMS activity in the same corridor to improve block utilization.",
  },
  {
    id: "SMMS-1819",
    activity: "Point Machine Inspection",
    department: "SMMS",
    location: "Kharagpur Yard, Point 118",
    corridor: "Kharagpur Yard",
    priority: "Medium",
    status: "Scheduled",
    submitted: "22 Sep 2026",
    dueDate: "28 Sep 2026",
    duration: "1 hr 15 min",
    blockRequired: true,
    operationalImpact:
      "Inspection can be performed within a planned yard maintenance window.",
    manpower: 4,
    machine: "Diagnostic Equipment",
    materials: ["Lubricant", "Replacement contacts"],
    aiReason:
      "Scheduled maintenance with sufficient lead time and no current critical operational constraint.",
    recommendation:
      "Retain the planned slot and coordinate with other yard activities if resources overlap.",
  },
  {
    id: "TDMS-0898",
    activity: "OHE Registration Check",
    department: "TDMS",
    location: "Jhargram Station, Mast 62",
    corridor: "Kharagpur–Jhargram",
    priority: "Low",
    status: "Pending",
    submitted: "22 Sep 2026",
    dueDate: "30 Sep 2026",
    duration: "45 min",
    blockRequired: false,
    operationalImpact:
      "Can be completed during an available maintenance opportunity without a dedicated block.",
    manpower: 3,
    machine: "Inspection Kit",
    materials: ["Measuring gauge"],
    aiReason:
      "Low urgency with sufficient time remaining before the requested completion date.",
    recommendation:
      "Complete during an available access opportunity or combine with nearby OHE work.",
  },
]

const priorityOrder: Record<Priority, number> = {
  Critical: 1,
  High: 2,
  Medium: 3,
  Low: 4,
}

function MaintenanceRequests({
  onNavigate,
}: MaintenanceRequestsProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(requests[0])

  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] =
    useState("All Departments")
  const [priorityFilter, setPriorityFilter] =
    useState("All Priorities")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [blockOnly, setBlockOnly] = useState(false)

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests
      .filter((request) => {
        const matchesSearch =
          !query ||
          request.id.toLowerCase().includes(query) ||
          request.activity.toLowerCase().includes(query) ||
          request.location.toLowerCase().includes(query) ||
          request.corridor.toLowerCase().includes(query)

        const matchesDepartment =
          departmentFilter === "All Departments" ||
          request.department === departmentFilter

        const matchesPriority =
          priorityFilter === "All Priorities" ||
          request.priority === priorityFilter

        const matchesStatus =
          statusFilter === "All Status" ||
          request.status === statusFilter

        const matchesBlock =
          !blockOnly || request.blockRequired

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesPriority &&
          matchesStatus &&
          matchesBlock
        )
      })
      .sort(
        (a, b) =>
          priorityOrder[a.priority] -
          priorityOrder[b.priority],
      )
  }, [
    search,
    departmentFilter,
    priorityFilter,
    statusFilter,
    blockOnly,
  ])

  const resetFilters = () => {
    setSearch("")
    setDepartmentFilter("All Departments")
    setPriorityFilter("All Priorities")
    setStatusFilter("All Status")
    setBlockOnly(false)
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <ClipboardIcon />
            Maintenance Workspace
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Maintenance Requests
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review maintenance requirements, understand operational
            impact and prepare requests for coordinated block planning.
          </p>
        </div>

        <button
          onClick={() => onNavigate("Block Planning")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]"
        >
          Open Block Planning
          <ArrowRight size={16} />
        </button>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Requests"
          value="18"
          detail="Across departments"
          icon={<ClipboardIcon />}
        />

        <SummaryCard
          label="Critical"
          value="4"
          detail="Needs immediate review"
          icon={<ShieldAlert size={19} />}
          accent="critical"
        />

        <SummaryCard
          label="High Priority"
          value="6"
          detail="Requires planning action"
          icon={<AlertTriangle size={19} />}
          accent="warning"
        />

        <SummaryCard
          label="Block Required"
          value="11"
          detail="Needs coordinated access"
          icon={<CalendarDays size={19} />}
          accent="blue"
        />
      </section>

      {/* Workspace */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search request, activity, location..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1d5f8c] focus:bg-white focus:ring-2 focus:ring-[#1d5f8c]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterSelect
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={[
                  "All Departments",
                  "TMS",
                  "SMMS",
                  "TDMS",
                ]}
              />

              <FilterSelect
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={[
                  "All Priorities",
                  "Critical",
                  "High",
                  "Medium",
                  "Low",
                ]}
              />

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  "All Status",
                  "Pending",
                  "Under Review",
                  "Scheduled",
                  "Completed",
                ]}
              />

              <button
                onClick={() => setBlockOnly((value) => !value)}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                  blockOnly
                    ? "border-[#1d5f8c] bg-[#eef6fb] text-[#1d5f8c]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal size={15} />
                Block Required
              </button>

              <button
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={15} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid min-h-[580px] xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* Request list */}
          <div className="min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Requests Requiring Attention
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {filteredRequests.length} request
                  {filteredRequests.length !== 1 ? "s" : ""} shown
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <Filter size={14} />
                Priority sorted
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="flex min-h-[450px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={21} />
                </div>

                <h3 className="font-semibold text-slate-900">
                  No matching requests
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Try changing the filters or search terms to find
                  maintenance requests.
                </p>

                <button
                  onClick={resetFilters}
                  className="mt-4 text-sm font-semibold text-[#1d5f8c] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    selected={selectedRequest?.id === request.id}
                    onClick={() => setSelectedRequest(request)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="border-t border-slate-200 bg-slate-50 xl:border-l xl:border-t-0">
            {selectedRequest ? (
              <RequestDetails
                request={selectedRequest}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="flex h-full min-h-[500px] items-center justify-center p-6 text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <ClipboardIcon />
                  </div>

                  <h3 className="font-semibold text-slate-900">
                    Select a request
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Select a maintenance request to view its details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Prototype note */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
        <Gauge
          size={16}
          className="mt-0.5 shrink-0 text-[#1d5f8c]"
        />

        <span>
          Prototype workspace using representative maintenance
          requests. Live TMS, SMMS and TDMS integration will replace
          this sample data in the connected system.
        </span>
      </div>
    </div>
  )
}

function RequestRow({
  request,
  selected,
  onClick,
}: {
  request: MaintenanceRequest
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
      <div className="flex gap-3 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              request.priority === "Critical"
                ? "bg-red-500"
                : request.priority === "High"
                  ? "bg-amber-500"
                  : request.priority === "Medium"
                    ? "bg-blue-500"
                    : "bg-slate-400"
            }`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-500">
                {request.id}
              </span>

              <DepartmentBadge
                department={request.department}
              />

              <PriorityBadge priority={request.priority} />
            </div>

            <h3 className="mt-1.5 truncate text-sm font-bold text-slate-900">
              {request.activity}
            </h3>

            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} />
                {request.location}
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock3 size={13} />
                {request.duration}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />

              {request.blockRequired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6fb] px-2 py-1 text-[11px] font-semibold text-[#1d5f8c]">
                  <CalendarDays size={11} />
                  Block required
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronRight
          size={18}
          className={`mt-3 shrink-0 transition ${
            selected
              ? "text-[#1d5f8c]"
              : "text-slate-300 group-hover:text-slate-500"
          }`}
        />
      </div>
    </button>
  )
}

function RequestDetails({
  request,
  onNavigate,
}: {
  request: MaintenanceRequest
  onNavigate: (page: PageKey) => void
}) {
  return (
    <div className="h-full">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-500">
                {request.id}
              </span>

              <DepartmentBadge department={request.department} />
            </div>

            <h2 className="mt-2 text-lg font-bold leading-6 text-slate-900">
              {request.activity}
            </h2>
          </div>

          <PriorityBadge priority={request.priority} />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Basic details */}
        <div className="grid grid-cols-2 gap-3">
          <DetailMetric
            icon={<MapPin size={15} />}
            label="Location"
            value={request.location}
            wide
          />

          <DetailMetric
            icon={<CalendarDays size={15} />}
            label="Due Date"
            value={request.dueDate}
          />

          <DetailMetric
            icon={<Clock3 size={15} />}
            label="Duration"
            value={request.duration}
          />

          <DetailMetric
            icon={<CheckCircle2 size={15} />}
            label="Status"
            value={request.status}
          />
        </div>

        {/* Operational impact */}
        <DetailSection
          title="Operational Impact"
          icon={<Zap size={16} />}
        >
          <p className="text-sm leading-6 text-slate-600">
            {request.operationalImpact}
          </p>
        </DetailSection>

        {/* Resource requirements */}
        <DetailSection
          title="Required Resources"
          icon={<PackageCheck size={16} />}
        >
          <div className="space-y-2.5">
            <ResourceLine
              icon={<Users size={15} />}
              label="Manpower"
              value={`${request.manpower} staff`}
            />

            <ResourceLine
              icon={<Wrench size={15} />}
              label="Machine"
              value={request.machine}
            />

            <ResourceLine
              icon={<PackageCheck size={15} />}
              label="Materials"
              value={request.materials.join(", ")}
            />
          </div>
        </DetailSection>

        {/* AI reasoning */}
        <div className="rounded-xl border border-[#cfe1ed] bg-[#f1f7fa] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#dcecf5] text-[#1d5f8c]">
              <Gauge size={15} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#123b5d]">
                RailSync AI Priority Insight
              </h3>

              <p className="text-[11px] text-[#567187]">
                Based on operational conditions
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {request.aiReason}
          </p>
        </div>

        {/* Recommendation */}
        <DetailSection
          title="Recommended Action"
          icon={<ArrowRight size={16} />}
        >
          <p className="text-sm leading-6 text-slate-600">
            {request.recommendation}
          </p>
        </DetailSection>

        {/* Planning action */}
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => onNavigate("Block Planning")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]"
          >
            Add to Block Planning
            <ArrowRight size={16} />
          </button>

          <p className="mt-2 text-center text-[11px] leading-4 text-slate-400">
            Request will be considered for coordinated planning.
          </p>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
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
  accent?: "default" | "critical" | "warning" | "blue"
}) {
  const iconClasses = {
    default: "bg-slate-100 text-slate-600",
    critical: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    blue: "bg-[#eef6fb] text-[#1d5f8c]",
  }

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

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClasses[accent]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition focus:border-[#1d5f8c] focus:ring-2 focus:ring-[#1d5f8c]/10"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  )
}

function PriorityBadge({
  priority,
}: {
  priority: Priority
}) {
  const styles: Record<Priority, string> = {
    Critical: "bg-red-50 text-red-700 border-red-100",
    High: "bg-amber-50 text-amber-700 border-amber-100",
    Medium: "bg-blue-50 text-blue-700 border-blue-100",
    Low: "bg-slate-100 text-slate-600 border-slate-200",
  }

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-bold ${styles[priority]}`}
    >
      {priority}
    </span>
  )
}

function StatusBadge({
  status,
}: {
  status: Status
}) {
  const styles: Record<Status, string> = {
    Pending: "bg-amber-50 text-amber-700",
    "Under Review": "bg-blue-50 text-blue-700",
    Scheduled: "bg-emerald-50 text-emerald-700",
    Completed: "bg-slate-100 text-slate-600",
  }

  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function DepartmentBadge({
  department,
}: {
  department: "TMS" | "SMMS" | "TDMS"
}) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-600">
      {department}
    </span>
  )
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
        <span className="text-[#1d5f8c]">{icon}</span>
        {title}
      </div>

      {children}
    </section>
  )
}

function DetailMetric({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  )
}

function ResourceLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span className="mt-0.5 text-[#1d5f8c]">{icon}</span>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-medium leading-5 text-slate-700">
          {value}
        </p>
      </div>
    </div>
  )
}

function ClipboardIcon() {
  return <ClipboardIconSvg />
}

function ClipboardIconSvg() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="16" height="18" x="4" y="3" rx="2" />
      <path d="M9 3V1h6v2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  )
}

export default MaintenanceRequests