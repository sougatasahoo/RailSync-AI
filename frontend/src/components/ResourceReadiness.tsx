import { useMemo, useState } from "react"
import type { PageKey } from "./OperationsOverview"

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  HardHat,
  MapPin,
  Package,
  PackageCheck,
  Search,
  ShieldAlert,
  Truck,
  Users,
  Wrench,
  X,
  XCircle,
} from "lucide-react"

type ResourceReadinessProps = {
  onNavigate: (page: PageKey) => void
}

type ResourceStatus =
  | "Ready"
  | "Limited"
  | "Unavailable"

type ResourceItem = {
  name: string
  type: "Manpower" | "Machine" | "Material"
  availability: string
  requirement: string
  status: ResourceStatus
  location: string
  relatedBlock: string
}

const resources: ResourceItem[] = [
  {
    name: "Track Maintenance Team A",
    type: "Manpower",
    availability: "8 of 8 staff",
    requirement: "8 required",
    status: "Ready",
    location: "Kharagpur",
    relatedBlock: "BLK-260924-01",
  },
  {
    name: "OHE Maintenance Team",
    type: "Manpower",
    availability: "7 of 7 staff",
    requirement: "7 required",
    status: "Ready",
    location: "Panskura",
    relatedBlock: "BLK-260926-03",
  },
  {
    name: "Signalling Team B",
    type: "Manpower",
    availability: "5 of 6 staff",
    requirement: "6 required",
    status: "Limited",
    location: "Andul",
    relatedBlock: "BLK-260925-02",
  },
  {
    name: "Rail Cutting Machine",
    type: "Machine",
    availability: "Available",
    requirement: "1 required",
    status: "Ready",
    location: "Kharagpur Depot",
    relatedBlock: "BLK-260924-01",
  },
  {
    name: "Tower Wagon TW-07",
    type: "Machine",
    availability: "Available",
    requirement: "1 required",
    status: "Ready",
    location: "Panskura",
    relatedBlock: "BLK-260926-03",
  },
  {
    name: "Diagnostic Test Kit",
    type: "Machine",
    availability: "Available",
    requirement: "1 required",
    status: "Ready",
    location: "Andul",
    relatedBlock: "BLK-260925-02",
  },
  {
    name: "Insulated Rail Joint Set",
    type: "Material",
    availability: "2 sets",
    requirement: "3 sets",
    status: "Limited",
    location: "Kharagpur Stores",
    relatedBlock: "BLK-260924-01",
  },
  {
    name: "OHE Isolator Kit",
    type: "Material",
    availability: "4 kits",
    requirement: "2 kits",
    status: "Ready",
    location: "Panskura Stores",
    relatedBlock: "BLK-260926-03",
  },
]

type BlockReadiness = {
  id: string
  title: string
  date: string
  window: string
  readiness: number
  manpower: ResourceStatus
  machine: ResourceStatus
  material: ResourceStatus
  issue?: string
}

const blocks: BlockReadiness[] = [
  {
    id: "BLK-260924-01",
    title: "Kharagpur–Jhargram Maintenance",
    date: "24 Sep 2026",
    window: "10:30–13:00",
    readiness: 92,
    manpower: "Ready",
    machine: "Ready",
    material: "Limited",
    issue: "1 additional rail joint set required",
  },
  {
    id: "BLK-260925-02",
    title: "Andul Signalling Window",
    date: "25 Sep 2026",
    window: "01:00–02:30",
    readiness: 82,
    manpower: "Limited",
    machine: "Ready",
    material: "Ready",
    issue: "1 signalling staff member unavailable",
  },
  {
    id: "BLK-260926-03",
    title: "Panskura OHE Maintenance",
    date: "26 Sep 2026",
    window: "11:00–13:00",
    readiness: 100,
    manpower: "Ready",
    machine: "Ready",
    material: "Ready",
  },
  {
    id: "BLK-260927-04",
    title: "Kharagpur Yard Joint Window",
    date: "27 Sep 2026",
    window: "14:00–15:15",
    readiness: 88,
    manpower: "Ready",
    machine: "Ready",
    material: "Ready",
    issue: "Awaiting yard movement confirmation",
  },
]

function ResourceReadiness({
  onNavigate,
}: ResourceReadinessProps) {
  const [selectedResource, setSelectedResource] =
    useState<ResourceItem>(resources[0])

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] =
    useState("All Resources")
  const [statusFilter, setStatusFilter] =
    useState("All Status")

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase()

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.name.toLowerCase().includes(query) ||
        resource.location.toLowerCase().includes(query) ||
        resource.relatedBlock.toLowerCase().includes(query)

      const matchesType =
        typeFilter === "All Resources" ||
        resource.type === typeFilter

      const matchesStatus =
        statusFilter === "All Status" ||
        resource.status === statusFilter

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      )
    })
  }, [search, typeFilter, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <PackageCheck size={15} />
            Resource Workspace
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Resource Readiness
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Confirm manpower, machines and materials before
            maintenance blocks are finalized.
          </p>
        </div>

        <button
          onClick={() => onNavigate("Block Planning")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]"
        >
          Back to Block Planning
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Readiness summary */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ReadinessKpi
          label="Overall Readiness"
          value="91%"
          detail="For upcoming blocks"
          icon={<Gauge size={18} />}
          accent="blue"
        />

        <ReadinessKpi
          label="Resources Ready"
          value="18"
          detail="Of 21 required"
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />

        <ReadinessKpi
          label="Limited"
          value="2"
          detail="Needs attention"
          icon={<AlertTriangle size={18} />}
          accent="amber"
        />

        <ReadinessKpi
          label="Unavailable"
          value="1"
          detail="Currently constrained"
          icon={<XCircle size={18} />}
          accent="red"
        />
      </section>

      {/* Critical attention */}
      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ShieldAlert size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-amber-900">
                2 resource constraints need attention
              </h2>

              <p className="mt-1 text-xs leading-5 text-amber-800/80">
                One signalling staff shortage and one material
                shortage may affect upcoming block readiness.
              </p>
            </div>
          </div>

          <button className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-50">
            Review Constraints
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Block readiness */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Upcoming Block Readiness
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Resource status for proposed maintenance windows.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Next 7 days
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {blocks.map((block) => (
            <BlockReadinessCard
              key={block.id}
              block={block}
            />
          ))}
        </div>
      </section>

      {/* Resource inventory */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                placeholder="Search resources, location or block..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1d5f8c] focus:bg-white focus:ring-2 focus:ring-[#1d5f8c]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterSelect
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  "All Resources",
                  "Manpower",
                  "Machine",
                  "Material",
                ]}
              />

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  "All Status",
                  "Ready",
                  "Limited",
                  "Unavailable",
                ]}
              />

              <button
                onClick={() => {
                  setSearch("")
                  setTypeFilter("All Resources")
                  setStatusFilter("All Status")
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={15} />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-[520px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Resource list */}
          <div className="min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Resource Availability
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {filteredResources.length} resources shown
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredResources.map((resource) => (
                <ResourceRow
                  key={resource.name}
                  resource={resource}
                  selected={
                    selectedResource.name === resource.name
                  }
                  onClick={() =>
                    setSelectedResource(resource)
                  }
                />
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                <Search
                  size={24}
                  className="text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No resources found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Try changing the search or filters.
                </p>
              </div>
            )}
          </div>

          {/* Resource detail */}
          <ResourceDetails
            resource={selectedResource}
            onNavigate={onNavigate}
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
          Resource availability shown here uses representative
          prototype data. Live manpower, machine and stores systems
          will provide the operational values in the connected
          system.
        </span>
      </div>
    </div>
  )
}

function ReadinessKpi({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  accent: "blue" | "green" | "amber" | "red"
}) {
  const styles = {
    blue: "bg-[#eef6fb] text-[#1d5f8c]",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
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
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles[accent]}`}
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

function BlockReadinessCard({
  block,
}: {
  block: BlockReadiness
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold tracking-wide text-slate-400">
              {block.id}
            </span>

            <ReadinessBadge
              readiness={block.readiness}
            />
          </div>

          <h3 className="mt-1.5 text-sm font-bold text-slate-900">
            {block.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={13} />
              {block.date}
            </span>

            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} />
              {block.window}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {block.readiness}%
          </p>

          <p className="text-[10px] font-medium text-slate-400">
            readiness
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            block.readiness >= 95
              ? "bg-emerald-500"
              : block.readiness >= 85
                ? "bg-[#1d5f8c]"
                : "bg-amber-500"
          }`}
          style={{
            width: `${block.readiness}%`,
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatusMini
          label="Manpower"
          status={block.manpower}
        />

        <StatusMini
          label="Machine"
          status={block.machine}
        />

        <StatusMini
          label="Material"
          status={block.material}
        />
      </div>

      {block.issue && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0"
          />

          <span>{block.issue}</span>
        </div>
      )}
    </div>
  )
}

function StatusMini({
  label,
  status,
}: {
  label: string
  status: ResourceStatus
}) {
  const ready = status === "Ready"

  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div
        className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${
          ready
            ? "text-emerald-600"
            : status === "Limited"
              ? "text-amber-600"
              : "text-red-600"
        }`}
      >
        {ready ? (
          <CheckCircle2 size={12} />
        ) : status === "Limited" ? (
          <AlertTriangle size={12} />
        ) : (
          <XCircle size={12} />
        )}

        {status}
      </div>
    </div>
  )
}

function ResourceRow({
  resource,
  selected,
  onClick,
}: {
  resource: ResourceItem
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
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected
              ? "bg-[#dcecf5] text-[#1d5f8c]"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <ResourceIcon type={resource.type} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {resource.type}
            </span>

            <ResourceStatusBadge
              status={resource.status}
            />
          </div>

          <h3 className="mt-1 text-sm font-bold text-slate-900">
            {resource.name}
          </h3>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>{resource.availability}</span>

            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {resource.location}
            </span>
          </div>
        </div>

        <ChevronRight
          size={18}
          className={`mt-2 shrink-0 ${
            selected
              ? "text-[#1d5f8c]"
              : "text-slate-300 group-hover:text-slate-500"
          }`}
        />
      </div>
    </button>
  )
}

function ResourceDetails({
  resource,
  onNavigate,
}: {
  resource: ResourceItem
  onNavigate: (page: PageKey) => void
}) {
  const ready = resource.status === "Ready"

  return (
    <div className="border-t border-slate-200 bg-slate-50 xl:border-l xl:border-t-0">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {resource.type}
            </span>

            <h2 className="mt-1.5 text-lg font-bold leading-6 text-slate-900">
              {resource.name}
            </h2>
          </div>

          <ResourceStatusBadge
            status={resource.status}
          />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Availability */}
        <section>
          <SectionTitle
            icon={<PackageCheck size={15} />}
            title="Availability"
          />

          <div
            className={`rounded-xl border p-4 ${
              ready
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  ready
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {ready ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>

              <div>
                <p
                  className={`text-lg font-bold ${
                    ready
                      ? "text-emerald-800"
                      : "text-amber-800"
                  }`}
                >
                  {resource.availability}
                </p>

                <p
                  className={`text-xs ${
                    ready
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  Requirement: {resource.requirement}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section>
          <SectionTitle
            icon={<Gauge size={15} />}
            title="Resource Details"
          />

          <div className="space-y-2">
            <InfoLine
              label="Location"
              value={resource.location}
              icon={<MapPin size={14} />}
            />

            <InfoLine
              label="Related Block"
              value={resource.relatedBlock}
              icon={<CalendarDays size={14} />}
            />

            <InfoLine
              label="Requirement"
              value={resource.requirement}
              icon={<Package size={14} />}
            />
          </div>
        </section>

        {/* Planning impact */}
        <section>
          <SectionTitle
            icon={<Wrench size={15} />}
            title="Planning Impact"
          />

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-sm leading-6 text-slate-600">
              {ready
                ? "This resource is currently aligned with the associated block requirement and does not create a readiness constraint."
                : "This resource is below the current requirement and may prevent the associated block from being finalized without corrective action."}
            </p>
          </div>
        </section>

        {/* Action */}
        <div className="border-t border-slate-200 pt-4">
          {!ready ? (
            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]">
              <Users size={16} />
              Resolve Resource Constraint
            </button>
          ) : (
            <button
              onClick={() =>
                onNavigate("Block Planning")
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123b5d] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d304b]"
            >
              <ArrowRight size={16} />
              Continue to Block Planning
            </button>
          )}

          <p className="mt-2 text-center text-[11px] leading-4 text-slate-400">
            Resource status is used by RailSync during block
            feasibility checks.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResourceIcon({
  type,
}: {
  type: ResourceItem["type"]
}) {
  if (type === "Manpower") {
    return <HardHat size={17} />
  }

  if (type === "Machine") {
    return <Truck size={17} />
  }

  return <Package size={17} />
}

function ResourceStatusBadge({
  status,
}: {
  status: ResourceStatus
}) {
  const styles: Record<ResourceStatus, string> = {
    Ready: "bg-emerald-50 text-emerald-700",
    Limited: "bg-amber-50 text-amber-700",
    Unavailable: "bg-red-50 text-red-700",
  }

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function ReadinessBadge({
  readiness,
}: {
  readiness: number
}) {
  const style =
    readiness >= 95
      ? "bg-emerald-50 text-emerald-700"
      : readiness >= 85
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700"

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${style}`}
    >
      {readiness >= 95
        ? "Ready"
        : readiness >= 85
          ? "Mostly Ready"
          : "Needs Attention"}
    </span>
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
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-[#1d5f8c] focus:ring-2 focus:ring-[#1d5f8c]/10"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
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

function InfoLine({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="text-[#1d5f8c]">
          {icon}
        </span>

        {label}
      </div>

      <span className="text-right text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  )
}

export default ResourceReadiness