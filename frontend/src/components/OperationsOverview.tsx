import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Gauge,
  MapPin,
  PackageCheck,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
  Wrench,
  XCircle,
} from "lucide-react"

export type PageKey =
  | "Operations Overview"
  | "Maintenance Requests"
  | "Block Planning"
  | "Resource Readiness"
  | "Analytics & Reports"
  | "Alerts & Notifications"

type OperationsOverviewProps = {
  onNavigate: (page: PageKey) => void
}

type AttentionItem = {
  id: string
  title: string
  description: string
  priority: "Critical" | "High" | "Action"
  time: string
  action: string
}

type TimelineItem = {
  time: string
  title: string
  location: string
  department: string
  status: "Completed" | "Active" | "Upcoming"
}

const attentionItems: AttentionItem[] = [
  {
    id: "MR-2048",
    title: "Track renewal request requires planning",
    description: "TMS · KGP–BLS Section · Block required",
    priority: "Critical",
    time: "Due today",
    action: "Review request",
  },
  {
    id: "MR-2039",
    title: "Signal maintenance window awaiting block",
    description: "SMMS · Kharagpur Yard · 3-hour window",
    priority: "High",
    time: "Due today",
    action: "Open request",
  },
  {
    id: "MR-2027",
    title: "Machine availability affects planned work",
    description: "TMMMS · Tamna Section · Machine allocation",
    priority: "Action",
    time: "Planning impact",
    action: "Check resources",
  },
]

const timelineItems: TimelineItem[] = [
  {
    time: "06:30",
    title: "Track inspection window",
    location: "Kharagpur – Jhargram",
    department: "Engineering",
    status: "Completed",
  },
  {
    time: "09:15",
    title: "Signal maintenance",
    location: "Kharagpur Yard",
    department: "S&T",
    status: "Active",
  },
  {
    time: "11:30",
    title: "OHE inspection",
    location: "Kharagpur – Midnapore",
    department: "Electrical",
    status: "Upcoming",
  },
  {
    time: "14:00",
    title: "Joint maintenance window",
    location: "Santragachi Section",
    department: "Multi-department",
    status: "Upcoming",
  },
  {
    time: "18:30",
    title: "Evening operational review",
    location: "Division Control",
    department: "Operations",
    status: "Upcoming",
  },
]

const corridors = [
  {
    name: "Kharagpur – Balasore",
    status: "Normal",
    detail: "Operations running normally",
    value: "92%",
  },
  {
    name: "Kharagpur – Midnapore",
    status: "Planned",
    detail: "Maintenance activity scheduled",
    value: "81%",
  },
  {
    name: "Kharagpur Yard",
    status: "Attention",
    detail: "2 maintenance decisions pending",
    value: "74%",
  },
]

function statusClasses(status: string) {
  if (status === "Normal") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }

  if (status === "Planned") {
    return "bg-amber-50 text-amber-700 border-amber-200"
  }

  return "bg-red-50 text-red-700 border-red-200"
}

function priorityClasses(priority: AttentionItem["priority"]) {
  if (priority === "Critical") {
    return "bg-red-50 text-red-700 border-red-200"
  }

  if (priority === "High") {
    return "bg-amber-50 text-amber-700 border-amber-200"
  }

  return "bg-blue-50 text-blue-700 border-blue-200"
}

function timelineStatusClasses(status: TimelineItem["status"]) {
  if (status === "Completed") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "Active") {
    return "bg-blue-50 text-blue-700"
  }

  return "bg-slate-50 text-slate-600"
}

function OperationsOverview({
  onNavigate,
}: OperationsOverviewProps) {
  return (
    <div className="space-y-5">
      {/* Page introduction */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d5f8c]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Network Operations · 23 September 2026
          </div>

          <h1 className="text-[25px] font-bold tracking-[-0.035em] text-[#172b3a]">
            Operations Overview
          </h1>

          <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-slate-500">
            A live operational view of maintenance demand, block decisions,
            resources and network readiness across Kharagpur Division.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate("Analytics & Reports")}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <BarChart3 size={15} />
            View reports
          </button>

          <button
            onClick={() => onNavigate("Block Planning")}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#1d5f8c] px-3.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#174e75]"
          >
            <CalendarClock size={15} />
            Open block planning
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* Network KPIs */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={<TrainFront size={19} />}
          label="Active Operations"
          value="42"
          detail="Across 18 corridors"
          iconClass="bg-blue-50 text-[#1d5f8c]"
          onClick={() => onNavigate("Analytics & Reports")}
        />

        <KpiCard
          icon={<Wrench size={19} />}
          label="Pending Requests"
          value="18"
          detail="4 require urgent action"
          iconClass="bg-amber-50 text-amber-700"
          emphasis="warning"
          onClick={() => onNavigate("Maintenance Requests")}
        />

        <KpiCard
          icon={<CalendarClock size={19} />}
          label="Scheduled Blocks"
          value="07"
          detail="Next 24 hours"
          iconClass="bg-indigo-50 text-indigo-700"
          onClick={() => onNavigate("Block Planning")}
        />

        <KpiCard
          icon={<Gauge size={19} />}
          label="Network Efficiency"
          value="91.4%"
          detail="+2.8% from last week"
          iconClass="bg-emerald-50 text-emerald-700"
          emphasis="positive"
          onClick={() => onNavigate("Analytics & Reports")}
        />

        <KpiCard
          icon={<PackageCheck size={19} />}
          label="Resource Readiness"
          value="87%"
          detail="Manpower · machine · material"
          iconClass="bg-slate-100 text-slate-700"
          onClick={() => onNavigate("Resource Readiness")}
        />
      </section>

      {/* Main attention + AI insight */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_0.8fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle size={17} />
              </div>

              <div>
                <h2 className="text-[12px] font-bold text-[#172b3a]">
                  Attention Required
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Items that may affect today's planning decisions
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("Maintenance Requests")}
              className="flex items-center gap-1 text-[9px] font-bold text-[#1d5f8c]"
            >
              View all
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 md:flex-row md:items-center"
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    item.priority === "Critical"
                      ? "bg-red-50 text-red-600"
                      : item.priority === "High"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {item.priority === "Critical" ? (
                    <XCircle size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-[#244b65]">
                      {item.title}
                    </span>

                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide ${priorityClasses(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-1 text-[9px] text-slate-500">
                    {item.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end md:gap-1">
                  <span className="text-[8px] font-semibold text-slate-400">
                    {item.time}
                  </span>

                  <button
                    onClick={() =>
                      onNavigate(
                        item.id === "MR-2027"
                          ? "Resource Readiness"
                          : "Maintenance Requests",
                      )
                    }
                    className="flex items-center gap-1 text-[8px] font-bold text-[#1d5f8c]"
                  >
                    {item.action}
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI insight */}
        <div className="relative overflow-hidden rounded-xl border border-[#cfe1ed] bg-gradient-to-br from-[#f3f9fc] via-white to-[#edf5f9] shadow-sm">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#1d5f8c]/5" />

          <div className="relative p-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d5f8c] text-white shadow-sm">
                <Sparkles size={16} />
              </div>

              <div>
                <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#1d5f8c]">
                  RailSync Insight
                </p>

                <h2 className="mt-0.5 text-[12px] font-bold text-[#172b3a]">
                  Planning opportunity detected
                </h2>
              </div>
            </div>

            <p className="mt-4 text-[10px] leading-[1.65] text-slate-600">
              Two engineering requests and one signalling request are located
              within the same operational corridor and have compatible
              maintenance windows.
            </p>

            <div className="mt-3 rounded-lg border border-[#d7e6ef] bg-white/80 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                  Potential planning benefit
                </span>

                <span className="text-[11px] font-extrabold text-emerald-700">
                  1 combined block
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[8px] text-slate-400">
                    Separate windows
                  </span>

                  <strong className="text-[12px] text-slate-700">
                    2
                  </strong>
                </div>

                <div>
                  <span className="block text-[8px] text-slate-400">
                    Proposed duration
                  </span>

                  <strong className="text-[12px] text-slate-700">
                    3 hrs 20 min
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("Block Planning")}
              className="mt-4 flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-[#1d5f8c] text-[9px] font-bold text-white transition hover:bg-[#174e75]"
            >
              Review planning opportunity
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* Today's operations */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_0.95fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#1d5f8c]">
                <Clock3 size={17} />
              </div>

              <div>
                <h2 className="text-[12px] font-bold text-[#172b3a]">
                  Today's Operations
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Maintenance and operational activity across the division
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">
              1 active
            </span>
          </div>

          <div className="px-4 py-2">
            {timelineItems.map((item, index) => (
              <div
                key={`${item.time}-${item.title}`}
                className="grid grid-cols-[58px_18px_1fr_auto] items-center gap-2 border-b border-slate-100 py-3 last:border-0"
              >
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#31566f]">
                    {item.time}
                  </span>
                </div>

                <div className="relative flex h-full justify-center">
                  {index < timelineItems.length - 1 && (
                    <span className="absolute top-4 h-[calc(100%+18px)] w-px bg-slate-200" />
                  )}

                  <span
                    className={`relative z-10 mt-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ${
                      item.status === "Active"
                        ? "bg-blue-600 ring-blue-200"
                        : item.status === "Completed"
                          ? "bg-emerald-500 ring-emerald-100"
                          : "bg-slate-300 ring-slate-100"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-[#31566f]">
                      {item.title}
                    </span>

                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold ${timelineStatusClasses(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[8px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {item.location}
                    </span>

                    <span>•</span>

                    <span>{item.department}</span>
                  </div>
                </div>

                {item.status === "Active" ? (
                  <span className="hidden items-center gap-1 text-[8px] font-bold text-blue-600 sm:flex">
                    <CircleDot size={10} />
                    In progress
                  </span>
                ) : (
                  <span className="hidden text-[8px] text-slate-400 sm:block">
                    {item.status === "Completed"
                      ? "Closed"
                      : "Scheduled"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Planning decisions */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <ShieldCheck size={17} />
              </div>

              <div>
                <h2 className="text-[12px] font-bold text-[#172b3a]">
                  Upcoming Decisions
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Items waiting for official action
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <DecisionItem
              icon={<CalendarClock size={15} />}
              title="3 blocks awaiting approval"
              detail="Planning horizon · This week"
              count="3"
              onClick={() => onNavigate("Block Planning")}
            />

            <DecisionItem
              icon={<Wrench size={15} />}
              title="6 high-priority requests"
              detail="Maintenance requests"
              count="6"
              onClick={() => onNavigate("Maintenance Requests")}
            />

            <DecisionItem
              icon={<Users size={15} />}
              title="2 resource constraints"
              detail="Manpower / machine"
              count="2"
              onClick={() => onNavigate("Resource Readiness")}
            />

            <DecisionItem
              icon={<Bell size={15} />}
              title="3 new operational alerts"
              detail="Since last review"
              count="3"
              onClick={() => onNavigate("Alerts & Notifications")}
            />
          </div>

          <div className="p-3">
            <button
              onClick={() => onNavigate("Block Planning")}
              className="flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-[9px] font-bold text-[#1d5f8c] transition hover:bg-slate-100"
            >
              Review all decisions
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </section>

      {/* Corridor status + quick actions */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600">
                <MapPin size={17} />
              </div>

              <div>
                <h2 className="text-[12px] font-bold text-[#172b3a]">
                  Network Status
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Operational condition by key corridor
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("Block Planning")}
              className="flex items-center gap-1 text-[9px] font-bold text-[#1d5f8c]"
            >
              Detailed view
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid gap-2.5 p-3 md:grid-cols-3">
            {corridors.map((corridor) => (
              <div
                key={corridor.name}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-bold leading-4 text-[#31566f]">
                    {corridor.name}
                  </span>

                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-bold ${statusClasses(
                      corridor.status,
                    )}`}
                  >
                    {corridor.status}
                  </span>
                </div>

                <p className="mt-2 text-[8px] leading-4 text-slate-400">
                  {corridor.detail}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[8px] font-semibold text-slate-400">
                    Readiness
                  </span>

                  <strong className="text-[10px] text-[#31566f]">
                    {corridor.value}
                  </strong>
                </div>

                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      corridor.status === "Normal"
                        ? "bg-emerald-500"
                        : corridor.status === "Planned"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: corridor.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#1d5f8c]">
              <Settings2 size={17} />
            </div>

            <div>
              <h2 className="text-[12px] font-bold text-[#172b3a]">
                Quick Actions
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                Common planning tasks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <QuickAction
              icon={<ClipboardIcon />}
              title="Review requests"
              count="18 pending"
              onClick={() => onNavigate("Maintenance Requests")}
            />

            <QuickAction
              icon={<CalendarClock size={16} />}
              title="Plan blocks"
              count="7 scheduled"
              onClick={() => onNavigate("Block Planning")}
            />

            <QuickAction
              icon={<PackageCheck size={16} />}
              title="Check resources"
              count="87% ready"
              onClick={() => onNavigate("Resource Readiness")}
            />

            <QuickAction
              icon={<Bell size={16} />}
              title="View alerts"
              count="3 new"
              onClick={() => onNavigate("Alerts & Notifications")}
            />
          </div>
        </div>
      </section>

      {/* Footer system note */}
      <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 text-[8px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          RailSync AI · Operational data shown here is for prototype
          demonstration.
        </span>

        <span className="flex items-center gap-1.5 text-emerald-700">
          <CheckCircle2 size={11} />
          All connected systems reporting normally
        </span>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  detail,
  iconClass,
  emphasis,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  iconClass: string
  emphasis?: "warning" | "positive"
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>

        {emphasis === "warning" && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[7px] font-bold text-amber-700">
            Attention
          </span>
        )}

        {emphasis === "positive" && (
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold text-emerald-700">
            Improving
          </span>
        )}
      </div>

      <p className="mt-3 text-[9px] font-medium text-slate-500">
        {label}
      </p>

      <div className="mt-0.5 flex items-end justify-between gap-2">
        <strong className="text-[23px] font-bold tracking-[-0.04em] text-[#172b3a]">
          {value}
        </strong>

        {emphasis === "positive" && (
          <span className="mb-1 text-[8px] font-bold text-emerald-600">
            +2.8%
          </span>
        )}
      </div>

      <p className="mt-0.5 text-[8px] text-slate-400">{detail}</p>
    </button>
  )
}

function DecisionItem({
  icon,
  title,
  detail,
  count,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  count: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
    >
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-50 text-[#1d5f8c]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-bold text-[#31566f]">
          {title}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-400">
          {detail}
        </p>
      </div>

      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#eaf1f5] px-1.5 text-[8px] font-extrabold text-[#1d5f8c]">
        {count}
      </span>

      <ChevronRight size={13} className="shrink-0 text-slate-300" />
    </button>
  )
}

function QuickAction({
  icon,
  title,
  count,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  count: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-[#cbdde8] hover:bg-[#f3f8fb]"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#1d5f8c] shadow-sm">
          {icon}
        </div>

        <ArrowRight
          size={12}
          className="text-slate-300 transition group-hover:text-[#1d5f8c]"
        />
      </div>

      <p className="mt-2 text-[9px] font-bold text-[#31566f]">
        {title}
      </p>

      <p className="mt-0.5 text-[7px] text-slate-400">{count}</p>
    </button>
  )
}

function ClipboardIcon() {
  return <Wrench size={16} />
}

export default OperationsOverview