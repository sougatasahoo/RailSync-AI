import { useEffect, useState } from "react"

const API = "http://127.0.0.1:8000"

type Opportunity = {
  opportunity_id: string
  request_ids: string[]
  activities: string[]
  departments: string[]
  section: string
  date: string
  window_id: string
  window_type: string
  available_hours: number
  combined_duration_hours: number
  utilization_percent: number
  opportunity_score: number
  compatibility_reasons: string[]
  resource_saving_percent: number
  traffic_level: string
  block_feasible: boolean
}

type Conflict = {
  opportunity_id: string
  conflict_status: string
  severity: string
  can_proceed: boolean
  conflict_count: number
  conflicts: {
    code: string
    severity: string
    message: string
  }[]
  available_hours: number
  required_hours: number
  utilization_percent: number
  opportunity_score: number
  operational_indicators: {
    traffic_level: string
    passenger_train_count: number
    goods_train_count: number
    total_train_count: number
    block_allowed: boolean
    window_type: string
    available_hours: number
    required_hours: number
    utilization_percent: number
    opportunity_score: number
  }
  recommended_action: string
  section: string
  date: string
  window_id: string
  window_type: string
  request_ids: string[]
  departments: string[]
  activities: string[]
  compatibility_reasons: string[]
}

type OptimizedItem = {
  opportunity_id: string
  request_ids: string[]
  section: string
  date: string
  window_id: string
  window_type: string
  duration_hours: number
  available_hours: number
  utilization_percent: number
  opportunity_score: number
  conflict_status: string
}

type Approval = {
  approval_id: string
  status: string
  reviewer: string
  submitted_at: string | null
  reviewed_at: string | null
  remarks: string
  plan_status: string
  solver_status: string
  summary: {
    candidate_count: number
    selected_count: number
    unscheduled_count: number
    total_planned_hours: number
    total_opportunity_score: number
  }
  selected_opportunities: OptimizedItem[]
}

type HandoffItem = {
  opportunity_id: string
  request_ids: string[]
  section: string
  date: string
  window_id: string
  window_type: string
  planned_duration_hours: number
  available_window_hours: number
  utilization_percent: number
  opportunity_score: number
  conflict_status: string
  handoff_status: string
}

type Handoff = {
  status: string
  handoff_id: string
  generated_at: string
  source: {
    approval_id: string
    approval_status: string
    reviewer: string
    reviewed_at: string | null
  }
  plan: {
    solver_status: string
    selected_blocks: number
    planned_work_hours: number
    opportunity_value: number
  }
  handoff_items: HandoffItem[]
  destination: string
  integration_status: string
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function text(
  value: unknown,
  fallback = "—",
): string {
  return typeof value === "string" && value
    ? value
    : fallback
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string",
      )
    : []
}

function dateText(value: string): string {
  if (!value) return "—"

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function dateTimeText(
  value: string | null,
): string {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

async function getJson<T>(
  endpoint: string,
): Promise<T> {
  const response = await fetch(
    `${API}${endpoint}`,
  )

  const data = await response.json()

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Request failed."

    throw new Error(message)
  }

  return data as T
}

function statusStyle(
  severity: string,
): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700"

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700"

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700"

    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-800">
        {value}
      </div>

      <div className="mt-1 text-xs font-medium text-slate-500">
        {description}
      </div>
    </div>
  )
}

export default function BlockPlanning() {
  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([])

  const [conflicts, setConflicts] =
    useState<Conflict[]>([])

  const [optimized, setOptimized] =
    useState<{
      status: string
      solver_status: string
      selected_opportunities: OptimizedItem[]
      summary: Approval["summary"]
    } | null>(null)

  const [approval, setApproval] =
    useState<Approval | null>(null)

  const [handoff, setHandoff] =
    useState<Handoff | null>(null)

  const [selectedId, setSelectedId] =
    useState("")

  const [remarks, setRemarks] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [actionLoading, setActionLoading] =
    useState(false)

  const [handoffLoading, setHandoffLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [handoffError, setHandoffError] =
    useState("")

  const reviewer =
    "Block Planning Official"

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError("")

      try {
        const [
          opportunityData,
          conflictData,
          optimizedData,
          approvalData,
        ] = await Promise.all([
          getJson<{
            opportunities?: Opportunity[]
          }>("/api/planning/joint-opportunities"),

          getJson<{
            conflicts?: Conflict[]
          }>("/api/planning/conflicts"),

          getJson<{
            status?: string
            solver_status?: string
            selected_opportunities?: OptimizedItem[]
            summary?: Partial<Approval["summary"]>
          }>("/api/planning/optimized-plan"),

          getJson<Approval>(
            "/api/planning/approval",
          ),
        ])

        if (!active) return

        const opps =
          Array.isArray(
            opportunityData.opportunities,
          )
            ? opportunityData.opportunities
            : []

        const conflictList =
          Array.isArray(
            conflictData.conflicts,
          )
            ? conflictData.conflicts
            : []

        const selected =
          Array.isArray(
            optimizedData.selected_opportunities,
          )
            ? optimizedData.selected_opportunities
            : []

        const summary = {
          candidate_count: num(
            optimizedData.summary
              ?.candidate_count,
          ),
          selected_count: num(
            optimizedData.summary
              ?.selected_count,
          ),
          unscheduled_count: num(
            optimizedData.summary
              ?.unscheduled_count,
          ),
          total_planned_hours: num(
            optimizedData.summary
              ?.total_planned_hours,
          ),
          total_opportunity_score: num(
            optimizedData.summary
              ?.total_opportunity_score,
          ),
        }

        setOpportunities(opps)
        setConflicts(conflictList)

        setOptimized({
          status: text(
            optimizedData.status,
            "unknown",
          ),
          solver_status: text(
            optimizedData.solver_status,
            "unknown",
          ),
          selected_opportunities:
            selected,
          summary,
        })

        setApproval(approvalData)

        setRemarks(
          approvalData.remarks ?? "",
        )

        if (
          selected.length > 0 &&
          !selectedId
        ) {
          setSelectedId(
            selected[0].opportunity_id,
          )
        }
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load block planning data.",
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const selectedOpportunity =
    opportunities.find(
      (item) =>
        item.opportunity_id ===
        selectedId,
    ) ?? null

  const selectedConflict =
    conflicts.find(
      (item) =>
        item.opportunity_id ===
        selectedId,
    ) ?? null

  const selectedBlocks =
    optimized?.selected_opportunities ??
    []

  const candidateCount =
    opportunities.length

  const reviewCount =
    conflicts.filter(
      (item) =>
        item.conflict_status === "Review" ||
        ["Medium", "High", "Critical"].includes(
          item.severity,
        ),
    ).length

  const averageUtilization =
    opportunities.length
      ? opportunities.reduce(
          (sum, item) =>
            sum +
            num(
              item.utilization_percent,
            ),
          0,
        ) / opportunities.length
      : 0

  async function approvalAction(
    action:
      | "submit"
      | "approve"
      | "return",
  ) {
    if (
      action === "return" &&
      !remarks.trim()
    ) {
      setError(
        "Remarks are required when returning the plan.",
      )

      return
    }

    setActionLoading(true)
    setError("")

    try {
      const endpoint =
        action === "submit"
          ? "/api/planning/approval/submit"
          : action === "approve"
            ? "/api/planning/approval/approve"
            : "/api/planning/approval/return"

      const response =
        await fetch(
          `${API}${endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              action === "submit"
                ? undefined
                : JSON.stringify({
                    reviewer,
                    remarks:
                      remarks.trim(),
                  }),
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          text(
            data?.detail,
            "Approval action failed.",
          ),
        )
      }

      const updated =
        data as Approval

      setApproval(updated)

      setRemarks(
        updated.remarks ?? "",
      )

      if (
        action === "approve" &&
        updated.status ===
          "APPROVED"
      ) {
        await generateHandoff()
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update approval.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function generateHandoff() {
    setHandoffLoading(true)
    setHandoffError("")

    try {
      const data =
        await getJson<Handoff>(
          "/api/planning/bdms-handoff",
        )

      setHandoff(data)
    } catch (err) {
      setHandoff(null)

      setHandoffError(
        err instanceof Error
          ? err.message
          : "Unable to generate BDMS handoff.",
      )
    } finally {
      setHandoffLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#f5f7f9] p-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-lg font-bold text-slate-800">
              Loading Block Planning…
            </div>

            <div className="mt-2 text-sm font-medium text-slate-500">
              Reading planning data from RailSync AI backend.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f5f7f9] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">

        {/* HEADER */}

        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#155f8f]">
              Planning Control
            </div>

            <h1 className="mt-1 text-2xl font-bold text-slate-800 md:text-3xl">
              Block Planning
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              AI-assisted maintenance block planning,
              operational review and approval.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              Planning Horizon
            </div>

            <div className="mt-1 text-sm font-bold text-slate-800">
              28 Sep — 04 Oct 2026
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* AI PLAN */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  AI Proposed Block Plan
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  CP-SAT optimization selects compatible
                  maintenance combinations.
                </p>
              </div>

              <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#155f8f]">
                {optimized?.solver_status ??
                  "Loading"}
              </span>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">

            <Metric
              label="Candidates"
              value={String(
                candidateCount,
              )}
              description="Joint opportunities"
            />

            <Metric
              label="Selected Blocks"
              value={String(
                optimized?.summary
                  .selected_count ?? 0,
              )}
              description="Proposed blocks"
            />

            <Metric
              label="Planned Work"
              value={`${num(
                optimized?.summary
                  .total_planned_hours,
              )} hr`}
              description="Combined work"
            />

            <Metric
              label="Opportunity Value"
              value={num(
                optimized?.summary
                  .total_opportunity_score,
              ).toFixed(2)}
              description="Optimization objective"
            />

          </div>

          <div className="grid gap-4 px-5 pb-5 lg:grid-cols-[1.1fr_0.9fr]">

            {/* BLOCK LIST */}

            <div className="overflow-hidden rounded-xl border border-slate-200">

              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-bold text-slate-800">
                  Selected Opportunities
                </div>

                <div className="text-xs font-medium text-slate-500">
                  Optimized maintenance combinations.
                </div>
              </div>

              {selectedBlocks.length ===
              0 ? (
                <div className="p-6 text-center text-sm font-medium text-slate-500">
                  No selected blocks available.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedBlocks.map(
                    (item) => (
                      <button
                        key={
                          item.opportunity_id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedId(
                            item.opportunity_id,
                          )
                        }
                        className={`w-full p-4 text-left transition ${
                          selectedId ===
                          item.opportunity_id
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <div className="flex flex-wrap items-center gap-2">

                              <span className="font-bold text-slate-800">
                                {
                                  item.opportunity_id
                                }
                              </span>

                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                SELECTED
                              </span>

                            </div>

                            <div className="mt-1 text-sm font-semibold text-slate-600">
                              {list(
                                item.request_ids,
                              ).join(
                                " + ",
                              )}
                            </div>

                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {item.section} ·{" "}
                              {dateText(
                                item.date,
                              )}{" "}
                              ·{" "}
                              {
                                item.window_id
                              }
                            </div>
                          </div>

                          <div className="flex gap-5">

                            <div>
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Duration
                              </div>

                              <div className="font-bold text-slate-800">
                                {num(
                                  item.duration_hours,
                                )}{" "}
                                hr
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Utilization
                              </div>

                              <div className="font-bold text-[#155f8f]">
                                {num(
                                  item.utilization_percent,
                                ).toFixed(
                                  1,
                                )}
                                %
                              </div>
                            </div>

                          </div>

                        </div>
                      </button>
                    ),
                  )}
                </div>
              )}

            </div>

            {/* DETAIL */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              {selectedOpportunity ? (
                <>
                  <div className="text-lg font-bold text-slate-800">
                    {
                      selectedOpportunity.opportunity_id
                    }
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    {list(
                      selectedOpportunity.activities,
                    ).join(
                      " + ",
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <Info
                      label="Section"
                      value={
                        selectedOpportunity.section
                      }
                    />

                    <Info
                      label="Date"
                      value={dateText(
                        selectedOpportunity.date,
                      )}
                    />

                    <Info
                      label="Window"
                      value={
                        selectedOpportunity.window_id
                      }
                    />

                    <Info
                      label="Traffic"
                      value={
                        selectedOpportunity.traffic_level
                      }
                    />

                    <Info
                      label="Available"
                      value={`${num(
                        selectedOpportunity.available_hours,
                      )} hr`}
                    />

                    <Info
                      label="Required"
                      value={`${num(
                        selectedOpportunity.combined_duration_hours,
                      )} hr`}
                    />

                  </div>

                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

                    <div className="text-xs font-bold uppercase text-[#155f8f]">
                      Compatibility
                    </div>

                    <div className="mt-2 text-sm font-medium leading-6 text-slate-700">
                      {list(
                        selectedOpportunity.compatibility_reasons,
                      ).join(
                        " · ",
                      ) ||
                        "Compatible maintenance activities identified."}
                    </div>

                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-sm font-medium text-slate-500">
                  Select a block to view details.
                </div>
              )}

            </div>

          </div>
        </section>

        {/* APPROVAL */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Human Approval
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Final operational control remains with the
                  authorized planning official.
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${
                  approval?.status ===
                  "APPROVED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {approval?.status?.replaceAll(
                  "_",
                  " ",
                ) ?? "PENDING REVIEW"}
              </span>

            </div>
          </div>

          <div className="space-y-4 p-5">

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

              <Info
                label="Approval ID"
                value={
                  approval?.approval_id ??
                  "APR-001"
                }
              />

              <Info
                label="Reviewer"
                value={
                  approval?.reviewer ??
                  reviewer
                }
              />

              <Info
                label="Selected"
                value={String(
                  approval?.summary
                    .selected_count ??
                    0,
                )}
              />

              <Info
                label="Plan"
                value={
                  approval?.plan_status ??
                  "unknown"
                }
              />

              <Info
                label="Solver"
                value={
                  approval?.solver_status ??
                  "unknown"
                }
              />

            </div>

            <textarea
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value,
                )
              }
              disabled={
                actionLoading ||
                approval?.status ===
                  "APPROVED"
              }
              rows={3}
              placeholder="Enter review remarks..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#155f8f] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

            {approval?.remarks && (
              <div className="rounded-xl bg-slate-50 p-4">

                <div className="text-xs font-bold uppercase text-slate-500">
                  Latest Remarks
                </div>

                <div className="mt-1 text-sm font-medium text-slate-700">
                  {approval.remarks}
                </div>

                {approval.reviewed_at && (
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    {dateTimeText(
                      approval.reviewed_at,
                    )}
                  </div>
                )}

              </div>
            )}

            <div className="flex flex-wrap gap-3">

              {approval?.status !==
                "APPROVED" && (
                <>
                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      void approvalAction(
                        "submit",
                      )
                    }
                    className="rounded-xl border border-[#155f8f] bg-[#155f8f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#104d75] disabled:opacity-50"
                  >
                    Submit for Review
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      void approvalAction(
                        "return",
                      )
                    }
                    className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    Return for Revision
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      void approvalAction(
                        "approve",
                      )
                    }
                    className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Approve Block Plan"}
                  </button>
                </>
              )}

              {approval?.status ===
                "APPROVED" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                  ✓ Plan Approved
                </div>
              )}

            </div>
          </div>
        </section>

        {/* BDMS */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  BDMS Handoff
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Generate the structured handoff package after
                  human approval.
                </p>
              </div>

              {handoff && (
                <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  ✓ Handoff Generated
                </span>
              )}

            </div>
          </div>

          <div className="p-5">

            {!handoff ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                  <Info
                    label="Destination"
                    value="BDMS"
                  />

                  <Info
                    label="Approval"
                    value={
                      approval?.approval_id ??
                      "APR-001"
                    }
                  />

                  <Info
                    label="Blocks"
                    value={String(
                      selectedBlocks.length,
                    )}
                  />

                  <Info
                    label="Work"
                    value={`${num(
                      optimized?.summary
                        .total_planned_hours,
                    )} hr`}
                  />

                </div>

                <button
                  type="button"
                  disabled={
                    approval?.status !==
                      "APPROVED" ||
                    handoffLoading
                  }
                  onClick={() =>
                    void generateHandoff()
                  }
                  className="mt-4 rounded-xl border border-[#155f8f] bg-[#155f8f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#104d75] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {handoffLoading
                    ? "Generating..."
                    : "Generate BDMS Handoff"}
                </button>

                {handoffError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {handoffError}
                  </div>
                )}

              </div>
            ) : (
              <div className="space-y-4">

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                  <Info
                    label="Handoff ID"
                    value={
                      handoff.handoff_id
                    }
                  />

                  <Info
                    label="Approval"
                    value={
                      handoff.source
                        .approval_id
                    }
                  />

                  <Info
                    label="Reviewer"
                    value={
                      handoff.source
                        .reviewer
                    }
                  />

                  <Info
                    label="Blocks"
                    value={String(
                      num(
                        handoff.plan
                          .selected_blocks,
                      ),
                    )}
                  />

                  <Info
                    label="Planned Work"
                    value={`${num(
                      handoff.plan
                        .planned_work_hours,
                    )} hr`}
                  />

                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">

                  <table className="w-full min-w-[700px] text-left">

                    <thead className="bg-slate-50">
                      <tr>

                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                          Opportunity
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                          Requests
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                          Section
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                          Duration
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                          Status
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {handoff.handoff_items.map(
                        (item) => (
                          <tr
                            key={
                              item.opportunity_id
                            }
                            className="hover:bg-slate-50"
                          >

                            <td className="px-4 py-3 text-sm font-bold text-slate-800">
                              {
                                item.opportunity_id
                              }
                            </td>

                            <td className="px-4 py-3 text-sm font-medium text-slate-600">
                              {list(
                                item.request_ids,
                              ).join(
                                " + ",
                              )}
                            </td>

                            <td className="px-4 py-3">

                              <div className="text-sm font-bold text-slate-800">
                                {
                                  item.section
                                }
                              </div>

                              <div className="text-xs text-slate-500">
                                {dateText(
                                  item.date,
                                )}
                              </div>

                            </td>

                            <td className="px-4 py-3 text-sm font-bold text-slate-800">
                              {num(
                                item.planned_duration_hours,
                              )}{" "}
                              hr
                            </td>

                            <td className="px-4 py-3">

                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                {
                                  item.handoff_status
                                }
                              </span>

                            </td>

                          </tr>
                        ),
                      )}

                    </tbody>
                  </table>

                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-900">
                  {handoff.integration_status}
                </div>

              </div>
            )}

          </div>
        </section>

        {/* SUMMARY */}

        <div className="grid gap-4 md:grid-cols-3">

          <Metric
            label="Total Opportunities"
            value={String(
              candidateCount,
            )}
            description="Joint maintenance combinations"
          />

          <Metric
            label="Review Required"
            value={String(
              reviewCount,
            )}
            description="Operational review records"
          />

          <Metric
            label="Average Utilization"
            value={`${num(
              averageUtilization,
            ).toFixed(0)}%`}
            description="Planning-window utilization"
          />

        </div>

        {/* CONFLICT ANALYSIS */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">

            <h2 className="text-xl font-bold text-slate-800">
              Conflict Analysis
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Operational checks applied to proposed opportunities.
            </p>

          </div>

          {/* 2/3 CONFLICT LIST + 1/3 DETAILS */}

          <div className="grid gap-0 lg:grid-cols-[2fr_1fr]">

            {/* LEFT — CONFLICT LIST */}

            <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">

              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">

                <div className="text-sm font-bold text-slate-800">
                  Operational Conflicts
                </div>

                <div className="mt-1 text-xs font-medium text-slate-500">
                  Select a record to view its detailed review.
                </div>

              </div>

              <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100">

                {conflicts.length === 0 && (
                  <div className="p-6 text-center text-sm font-medium text-slate-500">
                    No conflict records available.
                  </div>
                )}

                {conflicts.map(
                  (item) => {
                    const isSelected =
                      selectedId ===
                      item.opportunity_id

                    const traffic =
                      item
                        .operational_indicators
                        ?.traffic_level ??
                      "Unknown"

                    const utilization =
                      item
                        .operational_indicators
                        ?.utilization_percent ??
                      item.utilization_percent

                    return (
                      <button
                        key={
                          item.opportunity_id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedId(
                            item.opportunity_id,
                          )
                        }
                        className={`w-full p-4 text-left transition ${
                          isSelected
                            ? "bg-blue-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >

                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto] md:items-center">

                          {/* ID */}

                          <div>

                            <div className="flex items-center gap-2">

                              <div className="text-sm font-bold text-slate-800">
                                {
                                  item.opportunity_id
                                }
                              </div>

                              {isSelected && (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#155f8f]">
                                  SELECTED
                                </span>
                              )}

                            </div>

                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {list(
                                item.request_ids,
                              ).join(
                                " + ",
                              )}
                            </div>

                          </div>

                          {/* LOCATION */}

                          <div>

                            <div className="text-sm font-bold text-slate-700">
                              {
                                item.section
                              }
                            </div>

                            <div className="text-xs text-slate-500">
                              {dateText(
                                item.date,
                              )}{" "}
                              ·{" "}
                              {
                                item.window_id
                              }
                            </div>

                          </div>

                          {/* UTILIZATION */}

                          <div>

                            <div className="text-[10px] font-bold uppercase text-slate-400">
                              Utilization
                            </div>

                            <div className="text-sm font-bold text-slate-800">
                              {num(
                                utilization,
                              ).toFixed(
                                1,
                              )}
                              %
                            </div>

                          </div>

                          {/* TRAFFIC */}

                          <div>

                            <div className="text-[10px] font-bold uppercase text-slate-400">
                              Traffic
                            </div>

                            <div className="text-sm font-bold text-slate-800">
                              {traffic}
                            </div>

                          </div>

                          {/* SEVERITY */}

                          <span
                            className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle(
                              item.severity,
                            )}`}
                          >
                            {
                              item.severity
                            }
                          </span>

                        </div>

                      </button>
                    )
                  },
                )}

              </div>

            </div>

            {/* RIGHT — STICKY CONFLICT DETAILS */}

            <div className="bg-slate-50">

              <div className="sticky top-4">

                <div className="border-b border-slate-200 bg-white px-5 py-4">

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <h3 className="text-lg font-bold text-slate-800">
                        Conflict Details
                      </h3>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Selected operational review
                      </p>

                    </div>

                    {selectedConflict && (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle(
                          selectedConflict.severity,
                        )}`}
                      >
                        {
                          selectedConflict.severity
                        }
                      </span>
                    )}

                  </div>

                </div>

                {selectedConflict ? (
                  <div className="space-y-4 p-5">

                    {/* SELECTED ID + ACTIVITIES */}

                    <div>

                      <div className="text-xl font-bold text-slate-800">
                        {
                          selectedConflict.opportunity_id
                        }
                      </div>

                      <div className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                        {list(
                          selectedConflict.activities,
                        ).length > 0
                          ? list(
                              selectedConflict.activities,
                            ).join(
                              " + ",
                            )
                          : selectedOpportunity
                            ? list(
                                selectedOpportunity.activities,
                              ).join(
                                " + ",
                              )
                            : list(
                                selectedConflict.request_ids,
                              ).join(
                                " + ",
                              )}
                      </div>

                    </div>

                    {/* KEY INFORMATION */}

                    <div className="grid grid-cols-2 gap-3">

                      <Info
                        label="Section"
                        value={
                          selectedConflict.section
                        }
                      />

                      <Info
                        label="Date"
                        value={dateText(
                          selectedConflict.date,
                        )}
                      />

                      <Info
                        label="Window"
                        value={
                          selectedConflict.window_id
                        }
                      />

                      <Info
                        label="Traffic"
                        value={
                          selectedConflict
                            .operational_indicators
                            ?.traffic_level ??
                          "Unknown"
                        }
                      />

                      <Info
                        label="Available"
                        value={`${num(
                          selectedConflict
                            .operational_indicators
                            ?.available_hours ??
                            selectedConflict.available_hours,
                        )} hr`}
                      />

                      <Info
                        label="Required"
                        value={`${num(
                          selectedConflict
                            .operational_indicators
                            ?.required_hours ??
                            selectedConflict.required_hours,
                        )} hr`}
                      />

                    </div>

                    {/* UTILIZATION */}

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                      <div className="flex items-center justify-between gap-3">

                        <div>

                          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                            Window Utilization
                          </div>

                          <div className="mt-1 text-2xl font-bold text-slate-800">
                            {num(
                              selectedConflict
                                .operational_indicators
                                ?.utilization_percent ??
                                selectedConflict.utilization_percent,
                            ).toFixed(
                              1,
                            )}
                            %
                          </div>

                        </div>

                        <div className="text-right">

                          <div className="text-[11px] font-bold uppercase text-amber-700">
                            Review Status
                          </div>

                          <div className="mt-1 text-sm font-bold text-amber-800">
                            {
                              selectedConflict.conflict_status
                            }
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* OPERATIONAL STATUS */}

                    <div className="rounded-xl border border-slate-200 bg-white p-4">

                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Operational Status
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">

                        <div>

                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Block Allowed
                          </div>

                          <div className="mt-1 text-sm font-bold text-slate-800">
                            {
                              selectedConflict
                                .operational_indicators
                                ?.block_allowed
                                ? "Yes"
                                : "No"
                            }
                          </div>

                        </div>

                        <div>

                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Window Type
                          </div>

                          <div className="mt-1 text-sm font-bold text-slate-800">
                            {
                              selectedConflict
                                .operational_indicators
                                ?.window_type ??
                              selectedConflict.window_type
                            }
                          </div>

                        </div>

                        <div>

                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Passenger Trains
                          </div>

                          <div className="mt-1 text-sm font-bold text-slate-800">
                            {num(
                              selectedConflict
                                .operational_indicators
                                ?.passenger_train_count,
                            )}
                          </div>

                        </div>

                        <div>

                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Goods Trains
                          </div>

                          <div className="mt-1 text-sm font-bold text-slate-800">
                            {num(
                              selectedConflict
                                .operational_indicators
                                ?.goods_train_count,
                            )}
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* CONFLICT REASONS */}

                    {list(
                      selectedConflict.conflicts,
                    ).length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          Review Findings
                        </div>

                        <div className="mt-3 space-y-2">

                          {selectedConflict.conflicts.map(
                            (conflict) => (
                              <div
                                key={
                                  conflict.code
                                }
                                className="rounded-lg border border-amber-200 bg-white p-3"
                              >

                                <div className="text-xs font-bold text-amber-800">
                                  {
                                    conflict.code
                                  }
                                </div>

                                <div className="mt-1 text-sm font-medium leading-5 text-slate-700">
                                  {
                                    conflict.message
                                  }
                                </div>

                              </div>
                            ),
                          )}

                        </div>

                      </div>
                    )}

                    {/* RECOMMENDATION */}

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                      <div className="text-xs font-bold uppercase tracking-wide text-[#155f8f]">
                        Recommendation
                      </div>

                      <div className="mt-2 text-sm font-bold leading-6 text-slate-800">
                        {
                          selectedConflict.recommended_action
                        }
                      </div>

                    </div>

                    {/* COMPATIBILITY */}

                    {(
                      list(
                        selectedConflict.compatibility_reasons,
                      ).length > 0 ||
                      selectedOpportunity
                    ) && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                        <div className="text-xs font-bold uppercase tracking-wide text-[#155f8f]">
                          Compatibility
                        </div>

                        <div className="mt-2 text-sm font-medium leading-6 text-slate-700">
                          {list(
                            selectedConflict.compatibility_reasons,
                          ).length > 0
                            ? list(
                                selectedConflict.compatibility_reasons,
                              ).join(
                                " · ",
                              )
                            : selectedOpportunity
                              ? list(
                                  selectedOpportunity.compatibility_reasons,
                                ).join(
                                  " · ",
                                )
                              : "Compatible maintenance activities identified."}
                        </div>

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-6">

                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">

                      <div className="text-sm font-bold text-slate-700">
                        Select a conflict
                      </div>

                      <div className="mt-1 text-xs font-medium leading-5 text-slate-500">
                        Choose an opportunity from the list to
                        view its operational review details here.
                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* WORKFLOW */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-xl font-bold text-slate-800">
            Planning Workflow
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            {[
              ["01", "Data Fusion"],
              ["02", "Joint Opportunities"],
              ["03", "Optimization"],
              ["04", "Human Approval"],
              ["05", "BDMS Handoff"],
            ].map(
              ([number, title]) => (
                <div
                  key={number}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#155f8f]">
                    {number}
                  </div>

                  <div className="mt-3 text-sm font-bold text-slate-800">
                    {title}
                  </div>

                </div>
              ),
            )}

          </div>
        </section>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium leading-5 text-slate-500">
          Prototype note: RailSync AI uses synthetic datasets modeled
          on Indian Railway operational scenarios. BDMS handoff is a
          structured prototype package and is not connected to a live
          railway BDMS system.
        </div>

      </div>
    </div>
  )
}