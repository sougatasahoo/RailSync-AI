import { useEffect, useMemo, useState } from "react"
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

type Status =
  | "Pending"
  | "Under Review"
  | "Scheduled"
  | "Completed"

type Department = "TMS" | "SMMS" | "TDMS"

type ShapExplanation = {
  feature: string
  contribution: number
  direction?: string
}

type MaintenanceRequest = {
  id: string
  activity: string
  department: Department
  location: string
  corridor: string
  priority: Priority
  priorityScore: number
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
  aiReasons: string[]
  recommendation: string
  shapExplanations: ShapExplanation[]
}

type MaintenanceApiResponse = {
  status: string
  total_requests: number
  requests: MaintenanceApiRequest[]
}

type MaintenanceApiRequest = {
  request_id: string
  source_system: Department

  activity: string
  asset_type?: string
  asset_id?: string

  location: string
  section: string

  priority: Priority
  priority_score?: number
  priority_category?: Priority

  status: string

  reported_date: string
  due_date: string

  estimated_duration_hours: number

  block_required: boolean

  operational_impact: string

  required_manpower: number
  required_machine?: string | null
  required_materials?: string[] | null

  priority_reasons?: string[]
  reasons?: string[]

  shap_explanations?: Record<
    string,
    number | string
  > | ShapExplanation[]

  shap?: Record<
    string,
    number | string
  > | ShapExplanation[]
}

type MaintenanceSummaryResponse = {
  status: string
  total_requests: number
  critical_requests: number
  high_requests: number
  medium_requests: number
  low_requests: number
  top_priority_request: string
}

const API_BASE_URL = "http://127.0.0.1:8000"

const priorityOrder: Record<Priority, number> = {
  Critical: 1,
  High: 2,
  Medium: 3,
  Low: 4,
}

function MaintenanceRequests({
  onNavigate,
}: MaintenanceRequestsProps) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null)

  const [summary, setSummary] =
    useState<MaintenanceSummaryResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] =
    useState("All Departments")
  const [priorityFilter, setPriorityFilter] =
    useState("All Priorities")
  const [statusFilter, setStatusFilter] =
    useState("All Status")
  const [blockOnly, setBlockOnly] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMaintenanceRequests() {
      try {
        setLoading(true)
        setError("")

        const [requestsResponse, summaryResponse] =
          await Promise.all([
            fetch(
              `${API_BASE_URL}/api/maintenance/prioritized`,
            ),
            fetch(
              `${API_BASE_URL}/api/maintenance/summary`,
            ),
          ])

        if (!requestsResponse.ok) {
          throw new Error(
            `Maintenance API returned ${requestsResponse.status}`,
          )
        }

        if (!summaryResponse.ok) {
          throw new Error(
            `Maintenance summary API returned ${summaryResponse.status}`,
          )
        }

        const requestsData =
          (await requestsResponse.json()) as MaintenanceApiResponse

        const summaryData =
          (await summaryResponse.json()) as MaintenanceSummaryResponse

        if (cancelled) {
          return
        }

        const normalizedRequests =
          requestsData.requests.map(normalizeRequest)

        setRequests(normalizedRequests)
        setSummary(summaryData)

        setSelectedRequest(
          normalizedRequests.length > 0
            ? normalizedRequests[0]
            : null,
        )
      } catch (requestError) {
        if (cancelled) {
          return
        }

        console.error(
          "Unable to load maintenance requests:",
          requestError,
        )

        setError(
          "Unable to load maintenance intelligence from the backend. Make sure the RailSync AI API is running.",
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMaintenanceRequests()

    return () => {
      cancelled = true
    }
  }, [])

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
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore
        }

        return (
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
        )
      })
  }, [
    requests,
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

  const criticalCount =
    summary?.critical_requests ??
    requests.filter(
      (request) => request.priority === "Critical",
    ).length

  const highCount =
    summary?.high_requests ??
    requests.filter(
      (request) => request.priority === "High",
    ).length

  const blockRequiredCount = requests.filter(
    (request) => request.blockRequired,
  ).length

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

      {/* Loading state */}
      {loading && (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#1d5f8c]" />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Loading maintenance intelligence...
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                RailSync AI is retrieving prioritized maintenance
                requests from the backend.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Error state */}
      {!loading && error && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-red-600">
              <ShieldAlert size={18} />
            </div>

            <div>
              <p className="text-sm font-bold text-red-800">
                Maintenance intelligence unavailable
              </p>

              <p className="mt-1 text-sm leading-5 text-red-700">
                {error}
              </p>

              <p className="mt-2 text-xs text-red-600">
                Expected backend:
                <span className="ml-1 font-mono">
                  http://127.0.0.1:8000
                </span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Requests"
          value={
            loading
              ? "—"
              : String(summary?.total_requests ?? requests.length)
          }
          detail="Across departments"
          icon={<ClipboardIcon />}
        />

        <SummaryCard
          label="Critical"
          value={loading ? "—" : String(criticalCount)}
          detail="Needs immediate review"
          icon={<ShieldAlert size={19} />}
          accent="critical"
        />

        <SummaryCard
          label="High Priority"
          value={loading ? "—" : String(highCount)}
          detail="Requires planning action"
          icon={<AlertTriangle size={19} />}
          accent="warning"
        />

        <SummaryCard
          label="Block Required"
          value={loading ? "—" : String(blockRequiredCount)}
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
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
                onClick={() =>
                  setBlockOnly((value) => !value)
                }
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
                  {loading
                    ? "Loading requests..."
                    : `${filteredRequests.length} request${
                        filteredRequests.length !== 1
                          ? "s"
                          : ""
                      } shown`}
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <Filter size={14} />
                AI priority sorted
              </div>
            </div>

            {loading ? (
              <LoadingRequestList />
            ) : filteredRequests.length === 0 ? (
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
                    selected={
                      selectedRequest?.id === request.id
                    }
                    onClick={() =>
                      setSelectedRequest(request)
                    }
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
          Synthetic datasets modeled on Indian Railway operational
          scenarios. RailSync AI priority intelligence combines
          operational conditions, maintenance urgency, resource
          readiness and explainable ML signals.
        </span>
      </div>
    </div>
  )
}

function normalizeRequest(
  request: MaintenanceApiRequest,
): MaintenanceRequest {
  const priority =
    request.priority_category ??
    request.priority ??
    "Medium"

  const status = normalizeStatus(request.status)

  const durationHours =
    Number(request.estimated_duration_hours) || 0

  const reasons =
    request.priority_reasons ??
    request.reasons ??
    []

  const shapExplanations = normalizeShap(
    request.shap_explanations ??
      request.shap ??
      {},
  )

  const corridor =
    request.section?.trim() ||
    request.location?.split(",")[0]?.trim() ||
    "Operational Section"

  const machine =
    request.required_machine?.trim() ||
    "Not specified"

  const materials =
    Array.isArray(request.required_materials)
      ? request.required_materials.filter(
          (material): material is string =>
            typeof material === "string" &&
            material.trim().length > 0,
        )
      : []

  const priorityScore = Number(
    request.priority_score ?? 0,
  )

  const aiReason =
    reasons.length > 0
      ? reasons.join(" ")
      : buildDefaultReason(priority, request)

  return {
    id: request.request_id,
    activity: request.activity,
    department: request.source_system,
    location: request.location,
    corridor,
    priority,
    priorityScore,
    status,
    submitted: formatDate(request.reported_date),
    dueDate: formatDate(request.due_date),
    duration: formatDuration(durationHours),
    blockRequired: Boolean(request.block_required),
    operationalImpact:
      request.operational_impact ||
      "Operational impact information is not available.",
    manpower: Number(request.required_manpower) || 0,
    machine,
    materials,
    aiReason,
    aiReasons: reasons,
    recommendation: buildRecommendation(
      request,
      priority,
    ),
    shapExplanations,
  }
}

function normalizeStatus(status: string): Status {
  const normalized = status.trim().toLowerCase()

  if (
    normalized === "completed" ||
    normalized === "complete"
  ) {
    return "Completed"
  }

  if (
    normalized === "in progress" ||
    normalized === "under review" ||
    normalized === "review"
  ) {
    return "Under Review"
  }

  if (
    normalized === "planned" ||
    normalized === "scheduled"
  ) {
    return "Scheduled"
  }

  return "Pending"
}

function normalizeShap(
  value:
    | Record<string, number | string>
    | ShapExplanation[],
): ShapExplanation[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        feature: String(item.feature ?? "Unknown"),
        contribution:
          Number(item.contribution) || 0,
        direction: item.direction
          ? String(item.direction)
          : undefined,
      }))
      .sort(
        (a, b) =>
          Math.abs(b.contribution) -
          Math.abs(a.contribution),
      )
  }

  return Object.entries(value)
    .map(([feature, contribution]) => {
      const numericContribution =
        Number(contribution) || 0

      return {
        feature,
        contribution: numericContribution,
        direction:
          numericContribution >= 0
            ? "increases"
            : "decreases",
      }
    })
    .sort(
      (a, b) =>
        Math.abs(b.contribution) -
        Math.abs(a.contribution),
    )
}

function formatDate(value: string) {
  if (!value) {
    return "Not specified"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatDuration(hours: number) {
  if (hours <= 0) {
    return "Not specified"
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round(
    (hours - wholeHours) * 60,
  )

  if (wholeHours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${wholeHours} hr`
  }

  return `${wholeHours} hr ${minutes} min`
}

function buildDefaultReason(
  priority: Priority,
  request: MaintenanceApiRequest,
) {
  if (priority === "Critical") {
    return "High operational priority requires immediate review and coordinated planning."
  }

  if (priority === "High") {
    return "High priority requires near-term planning based on maintenance urgency and operational conditions."
  }

  if (request.block_required) {
    return "Maintenance requires an operational block and should be considered during coordinated planning."
  }

  return "Maintenance request can be scheduled according to operational conditions and available resources."
}

function buildRecommendation(
  request: MaintenanceApiRequest,
  priority: Priority,
) {
  if (request.block_required) {
    if (
      priority === "Critical" ||
      priority === "High"
    ) {
      return "Review this request for the next suitable block and coordinate required resources with other departments."
    }

    return "Combine this activity with compatible maintenance work where possible to improve block utilization."
  }

  return "Complete during a suitable access opportunity while maintaining required resource readiness."
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

              <PriorityBadge
                priority={request.priority}
              />

              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                {request.priorityScore.toFixed(2)}
              </span>
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

              <DepartmentBadge
                department={request.department}
              />
            </div>

            <h2 className="mt-2 text-lg font-bold leading-6 text-slate-900">
              {request.activity}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              AI priority score:{" "}
              <span className="font-bold text-slate-700">
                {request.priorityScore.toFixed(2)}
              </span>
            </p>
          </div>

          <PriorityBadge
            priority={request.priority}
          />
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
              value={
                request.materials.length > 0
                  ? request.materials.join(", ")
                  : "No specific material listed"
              }
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
                Explainable maintenance prioritization
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <div>
              <p className="text-2xl font-bold text-[#123b5d]">
                {request.priorityScore.toFixed(2)}
              </p>

              <p className="text-[11px] text-slate-500">
                Priority score / 100
              </p>
            </div>

            <PriorityBadge
              priority={request.priority}
            />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {request.aiReason}
          </p>
        </div>

        {/* Priority reasons */}
        {request.aiReasons.length > 0 && (
          <DetailSection
            title="Priority Factors"
            icon={<ShieldAlert size={16} />}
          >
            <div className="space-y-2">
              {request.aiReasons.map(
                (reason, index) => (
                  <div
                    key={`${reason}-${index}`}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d5f8c]" />

                    <p className="text-sm leading-5 text-slate-600">
                      {reason}
                    </p>
                  </div>
                ),
              )}
            </div>
          </DetailSection>
        )}

        {/* SHAP explanation */}
        {request.shapExplanations.length > 0 && (
          <DetailSection
            title="Explainable AI Signals"
            icon={<Gauge size={16} />}
          >
            <div className="space-y-2">
              {request.shapExplanations
                .slice(0, 6)
                .map((item) => {
                  const positive =
                    item.contribution >= 0

                  return (
                    <div
                      key={item.feature}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-xs font-semibold text-slate-600">
                          {formatFeatureName(
                            item.feature,
                          )}
                        </span>

                        <span
                          className={`shrink-0 text-xs font-bold ${
                            positive
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {item.contribution.toFixed(4)}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            positive
                              ? "bg-emerald-500"
                              : "bg-red-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.max(
                                Math.abs(
                                  item.contribution,
                                ) * 100,
                                8,
                              ),
                              100,
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {positive
                          ? "Increases priority"
                          : "Reduces priority"}
                      </p>
                    </div>
                  )
                })}
            </div>
          </DetailSection>
        )}

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
            onClick={() =>
              onNavigate("Block Planning")
            }
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

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  )
}

function LoadingRequestList() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="animate-pulse px-4 py-4 sm:px-5"
          >
            <div className="flex gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-200" />

              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="h-4 w-16 rounded bg-slate-200" />
                  <div className="h-4 w-10 rounded bg-slate-200" />
                  <div className="h-4 w-14 rounded bg-slate-200" />
                </div>

                <div className="mt-2 h-4 w-56 rounded bg-slate-200" />

                <div className="mt-2 h-3 w-72 rounded bg-slate-100" />

                <div className="mt-2 h-5 w-20 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        ),
      )}
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
      onChange={(event) =>
        onChange(event.target.value)
      }
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
    Critical:
      "bg-red-50 text-red-700 border-red-100",
    High:
      "bg-amber-50 text-amber-700 border-amber-100",
    Medium:
      "bg-blue-50 text-blue-700 border-blue-100",
    Low:
      "bg-slate-100 text-slate-600 border-slate-200",
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
    Pending:
      "bg-amber-50 text-amber-700",
    "Under Review":
      "bg-blue-50 text-blue-700",
    Scheduled:
      "bg-emerald-50 text-emerald-700",
    Completed:
      "bg-slate-100 text-slate-600",
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
  department: Department
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
        <span className="text-[#1d5f8c]">
          {icon}
        </span>

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
      <span className="mt-0.5 text-[#1d5f8c]">
        {icon}
      </span>

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

function formatFeatureName(feature: string) {
  return feature
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
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
      <rect
        width="16"
        height="18"
        x="4"
        y="3"
        rx="2"
      />

      <path d="M9 3V1h6v2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  )
}

export default MaintenanceRequests