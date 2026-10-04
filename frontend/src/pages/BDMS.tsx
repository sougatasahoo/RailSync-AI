import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import type { PageKey } from "../types/navigation";

type PlannedOpportunity = {
  opportunity_id: string;

  request_a_id?: string;
  request_b_id?: string;

  job_1_request_id?: string;
  job_2_request_id?: string;

  start_time: string;
  end_time: string;

  individual_duration_minutes: number;
  joint_duration_minutes: number;
  time_saved_minutes: number;
};

type Plan = {
  status: string;
  solver: string;
  planning_horizon: string;
  section_code: string;

  block: {
    start_time: string;
    end_time: string;
    duration_minutes: number;
  };

  optimization_summary: {
    opportunities_selected: number;
    individual_work_minutes: number;
    joint_work_minutes: number;
    time_saved_minutes: number;
  };

  opportunities: PlannedOpportunity[];
  constraints_checked: string[];
};

type MaintenanceRecord = {
  request_id: string;
  department?: string;
  department_name?: string;
  section?: string;
  section_code?: string;
  km?: number;
  defect_type?: string;
  priority?: string;
  required_resource?: string;
  status?: string;
  ml_priority_score?: number;
  priority_rank?: number;
};

type BDMSProps = {
  onNavigate?: (page: PageKey) => void;
};

type DepartmentKey = "TMS" | "TDMS" | "SMMS";

const API_BASE = "http://127.0.0.1:8000";

const DEPARTMENT_INFO: Record<
  DepartmentKey,
  {
    title: string;
    subtitle: string;
  }
> = {
  TMS: {
    title: "TMS",
    subtitle: "Track Maintenance",
  },

  TDMS: {
    title: "TDMS",
    subtitle: "Traction / OHE",
  },

  SMMS: {
    title: "SMMS",
    subtitle: "Signal & Telecom",
  },
};

/* ============================================================
   SAFE REQUEST ID HELPERS
   ============================================================ */

function getRequestIds(
  opportunity: PlannedOpportunity
): string[] {
  const ids = [
    opportunity.request_a_id,
    opportunity.request_b_id,
    opportunity.job_1_request_id,
    opportunity.job_2_request_id,
  ].filter(
    (value): value is string =>
      typeof value === "string" &&
      value.trim().length > 0
  );

  return Array.from(new Set(ids));
}

function getPrimaryRequestId(
  opportunity: PlannedOpportunity
): string | null {
  return getRequestIds(opportunity)[0] || null;
}

function departmentFromRequestId(
  requestId?: string
): DepartmentKey | null {
  if (
    typeof requestId !== "string" ||
    requestId.length === 0
  ) {
    return null;
  }

  if (requestId.startsWith("TRK-")) {
    return "TMS";
  }

  if (requestId.startsWith("OHE-")) {
    return "TDMS";
  }

  if (requestId.startsWith("SIG-")) {
    return "SMMS";
  }

  return null;
}

function getOpportunityRequestIds(
  opportunity: PlannedOpportunity
): string[] {
  return getRequestIds(opportunity);
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function BDMS({
  onNavigate,
}: BDMSProps) {
  const [plan, setPlan] =
    useState<Plan | null>(null);

  const [maintenanceRecords, setMaintenanceRecords] =
    useState<MaintenanceRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [approved, setApproved] =
    useState(false);

  const [controllerNote, setControllerNote] =
    useState("");

  /* ==========================================================
     LOAD APPROVED PLAN
     ========================================================== */

  async function loadBDMS() {
    try {
      setLoading(true);
      setError("");

      const savedDecision =
        localStorage.getItem(
          "railsync_approval_decision"
        );

      const savedNote =
        localStorage.getItem(
          "railsync_controller_note"
        ) || "";

      setApproved(
        savedDecision === "Approved"
      );

      setControllerNote(savedNote);

      if (savedDecision !== "Approved") {
        setPlan(null);
        setMaintenanceRecords([]);
        return;
      }

      /* ------------------------------------------------------
         Load today's optimized plan
         ------------------------------------------------------ */

      const planningResponse = await fetch(
        `${API_BASE}/api/planning/today`
      );

      if (!planningResponse.ok) {
        throw new Error(
          "Planning API unavailable"
        );
      }

      const planningData =
        await planningResponse.json();

      const selectedPlan: Plan =
        planningData.plan;

      if (!selectedPlan) {
        throw new Error(
          "No planning result returned by the backend."
        );
      }

      setPlan(selectedPlan);

      /* ------------------------------------------------------
         Extract ONLY selected request IDs
         ------------------------------------------------------ */

      const requestIds = Array.from(
        new Set(
          selectedPlan.opportunities.flatMap(
            getOpportunityRequestIds
          )
        )
      );

      /* ------------------------------------------------------
         Fetch selected maintenance records
         ------------------------------------------------------ */

      const records =
        await Promise.all(
          requestIds.map(
            async (requestId) => {
              try {
                const response =
                  await fetch(
                    `${API_BASE}/api/maintenance/${encodeURIComponent(
                      requestId
                    )}`
                  );

                if (!response.ok) {
                  console.warn(
                    `Maintenance request unavailable: ${requestId}`
                  );

                  return {
                    request_id: requestId,
                    department:
                      departmentFromRequestId(
                        requestId
                      ) || undefined,
                  } as MaintenanceRecord;
                }

                const data =
                  await response.json();

                if (!data.record) {
                  return {
                    request_id: requestId,
                    department:
                      departmentFromRequestId(
                        requestId
                      ) || undefined,
                  } as MaintenanceRecord;
                }

                return {
                  ...data.record,
                  request_id:
                    data.record.request_id ||
                    requestId,
                } as MaintenanceRecord;
              } catch (requestError) {
                console.warn(
                  `Could not load ${requestId}`,
                  requestError
                );

                return {
                  request_id: requestId,
                  department:
                    departmentFromRequestId(
                      requestId
                    ) || undefined,
                } as MaintenanceRecord;
              }
            }
          )
        );

      setMaintenanceRecords(records);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the approved BDMS plan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBDMS();
  }, []);

  /* ==========================================================
     GROUP MAINTENANCE WORK
     ========================================================== */

  const departmentRecords =
    useMemo(() => {
      const grouped: Record<
        DepartmentKey,
        MaintenanceRecord[]
      > = {
        TMS: [],
        TDMS: [],
        SMMS: [],
      };

      for (const record of maintenanceRecords) {
        let department: DepartmentKey | null =
          null;

        if (
          record.department === "TMS" ||
          record.department === "TDMS" ||
          record.department === "SMMS"
        ) {
          department = record.department;
        }

        if (!department) {
          department =
            departmentFromRequestId(
              record.request_id
            );
        }

        if (department) {
          grouped[department].push(record);
        }
      }

      return grouped;
    }, [maintenanceRecords]);

  /* ==========================================================
     FIND OPPORTUNITY FOR REQUEST
     ========================================================== */

  function getOpportunity(
    requestId: string
  ) {
    if (!plan) {
      return null;
    }

    return (
      plan.opportunities.find(
        (opportunity) =>
          getOpportunityRequestIds(
            opportunity
          ).includes(requestId)
      ) || null
    );
  }

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="page bdms-page">
        <div className="empty-state">
          <RefreshCw
            size={22}
            className="spin"
          />

          <strong>
            Loading approved block plan
          </strong>

          <span>
            Preparing the BDMS prototype handoff.
          </span>
        </div>
      </div>
    );
  }

  /* ==========================================================
     NOT APPROVED
     ========================================================== */

  if (!approved) {
    return (
      <div className="page bdms-page">
        <div className="page-header">
          <div>
            <div className="eyebrow">
              RAILWAY OPERATIONS
            </div>

            <h1>BDMS</h1>

            <p>
              Approved maintenance block handoff
            </p>
          </div>
        </div>

        <div className="bdms-alert-card">
          <div className="bdms-alert-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <strong>
              Controller approval required
            </strong>

            <p>
              No approved maintenance block is
              available for BDMS handoff.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              onNavigate?.("Approvals")
            }
          >
            Go to Approval
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
     ========================================================== */

  if (error || !plan) {
    return (
      <div className="page bdms-page">
        <div className="page-header">
          <div>
            <div className="eyebrow">
              RAILWAY OPERATIONS
            </div>

            <h1>BDMS</h1>

            <p>
              Approved maintenance block handoff
            </p>
          </div>
        </div>

        <div className="bdms-alert-card">
          <div className="bdms-alert-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <strong>
              BDMS handoff unavailable
            </strong>

            <p>
              {error ||
                "Approved planning data could not be loaded."}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={loadBDMS}
          >
            <RefreshCw size={15} />

            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN BDMS PAGE
     ========================================================== */

  return (
    <div className="page bdms-page">

      {/* HEADER */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            RAILWAY OPERATIONS
          </div>

          <h1>BDMS</h1>

          <p>
            Approved maintenance block handoff
          </p>
        </div>

        <div className="bdms-approved-status">
          <CheckCircle2 size={16} />

          APPROVED
        </div>
      </div>

      {/* APPROVED BLOCK */}

      <section className="bdms-summary-card">
        <div className="bdms-summary-header">
          <div>
            <div className="panel-kicker">
              APPROVED BLOCK PLAN
            </div>

            <h2>
              {plan.section_code}
            </h2>

            <p>
              Controller-approved maintenance
              coordination plan
            </p>
          </div>

          <div className="bdms-summary-status">
            <CheckCircle2 size={17} />

            Approved
          </div>
        </div>

        <div className="bdms-summary-metrics">
          <div className="bdms-summary-metric">
            <span>
              BLOCK WINDOW
            </span>

            <strong>
              {plan.block.start_time} –{" "}
              {plan.block.end_time}
            </strong>
          </div>

          <div className="bdms-summary-metric">
            <span>
              DURATION
            </span>

            <strong>
              {plan.block.duration_minutes} min
            </strong>
          </div>

          <div className="bdms-summary-metric">
            <span>
              OPPORTUNITIES
            </span>

            <strong>
              {
                plan.optimization_summary
                  .opportunities_selected
              }
            </strong>
          </div>

          <div className="bdms-summary-metric">
            <span>
              TIME SAVED
            </span>

            <strong>
              {
                plan.optimization_summary
                  .time_saved_minutes
              }{" "}
              min
            </strong>
          </div>
        </div>
      </section>

      {/* DEPARTMENT HEADING */}

      <div className="bdms-section-heading">
        <div>
          <div className="panel-kicker">
            APPROVED MAINTENANCE WORK
          </div>

          <h2>
            Department-wise Block Plan
          </h2>

          <p>
            Selected jobs grouped according to
            their originating maintenance department.
          </p>
        </div>
      </div>

      {/* DEPARTMENTS */}

      <div className="bdms-department-grid">
        {(
          ["TMS", "TDMS", "SMMS"] as DepartmentKey[]
        ).map((department) => {
          const records =
            departmentRecords[department];

          const info =
            DEPARTMENT_INFO[department];

          return (
            <section
              className="bdms-department-card"
              key={department}
            >
              <div className="bdms-department-header">
                <div>
                  <div className="bdms-department-code">
                    {info.title}
                  </div>

                  <h3>
                    {info.subtitle}
                  </h3>
                </div>

                <div className="bdms-count-badge">
                  {records.length}
                </div>
              </div>

              {records.length === 0 ? (
                <div className="bdms-no-work">
                  <FileCheck2 size={19} />

                  <span>
                    No selected work from this
                    department in the approved block.
                  </span>
                </div>
              ) : (
                <div className="bdms-table-scroll">
                  <table className="bdms-work-table">
                    <thead>
                      <tr>
                        <th>
                          Request
                        </th>

                        <th>
                          Work
                        </th>

                        <th>
                          Location
                        </th>

                        <th>
                          Time
                        </th>

                        <th>
                          Priority
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map(
                        (record) => {
                          const opportunity =
                            getOpportunity(
                              record.request_id
                            );

                          return (
                            <tr
                              key={
                                record.request_id
                              }
                            >
                              <td>
                                <strong>
                                  {
                                    record.request_id
                                  }
                                </strong>
                              </td>

                              <td>
                                <div className="bdms-work-name">
                                  {
                                    record.defect_type ||
                                    "Maintenance work"
                                  }
                                </div>

                                <div className="bdms-work-resource">
                                  {
                                    record.required_resource ||
                                    "Resource not specified"
                                  }
                                </div>
                              </td>

                              <td>
                                <div>
                                  {
                                    record.section_code ||
                                    plan.section_code
                                  }
                                </div>

                                {record.km !==
                                  undefined && (
                                  <small>
                                    KM{" "}
                                    {record.km}
                                  </small>
                                )}
                              </td>

                              <td>
                                {opportunity ? (
                                  <div className="bdms-time">
                                    <Clock3
                                      size={13}
                                    />

                                    {
                                      opportunity.start_time
                                    }{" "}
                                    –{" "}
                                    {
                                      opportunity.end_time
                                    }
                                  </div>
                                ) : (
                                  <span>
                                    Approved block
                                  </span>
                                )}
                              </td>

                              <td>
                                <span
                                  className={`bdms-priority bdms-priority-${(
                                    record.priority ||
                                    "Medium"
                                  ).toLowerCase()}`}
                                >
                                  {record.priority ||
                                    "Medium"}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* OPTIMIZATION */}

      <section className="bdms-detail-card">
        <div className="bdms-detail-header">
          <div>
            <div className="panel-kicker">
              OPTIMIZATION RECORD
            </div>

            <h2>
              CP-SAT Planning Result
            </h2>
          </div>

          <ShieldCheck size={19} />
        </div>

        <div className="bdms-detail-grid">
          <div>
            <span>
              SOLVER
            </span>

            <strong>
              {plan.solver}
            </strong>
          </div>

          <div>
            <span>
              PLANNING HORIZON
            </span>

            <strong>
              {plan.planning_horizon}
            </strong>
          </div>

          <div>
            <span>
              INDIVIDUAL WORK
            </span>

            <strong>
              {
                plan.optimization_summary
                  .individual_work_minutes
              }{" "}
              min
            </strong>
          </div>

          <div>
            <span>
              JOINT WORK
            </span>

            <strong>
              {
                plan.optimization_summary
                  .joint_work_minutes
              }{" "}
              min
            </strong>
          </div>
        </div>

        <div className="bdms-constraints">
          <div className="bdms-constraints-title">
            <ShieldCheck size={15} />

            Constraints checked
          </div>

          <div className="bdms-constraint-list">
            {plan.constraints_checked.map(
              (constraint, index) => (
                <div
                  key={`${constraint}-${index}`}
                  className="bdms-constraint"
                >
                  <CheckCircle2 size={14} />

                  {constraint}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CONTROLLER RECORD */}

      <section className="bdms-controller-card">
        <div className="bdms-controller-icon">
          <CheckCircle2 size={21} />
        </div>

        <div className="bdms-controller-content">
          <div className="panel-kicker">
            HUMAN-IN-THE-LOOP
          </div>

          <h2>
            Controller Approval Record
          </h2>

          <p>
            This block was approved by the
            controller before handoff to the
            existing BDMS workflow.
          </p>

          {controllerNote && (
            <div className="bdms-controller-note">
              <strong>
                Controller remarks
              </strong>

              <span>
                {controllerNote}
              </span>
            </div>
          )}
        </div>

        <div className="bdms-controller-approved">
          <CheckCircle2 size={15} />

          APPROVED
        </div>
      </section>

      {/* DISCLAIMER */}

      <div className="bdms-prototype-note">
        <AlertTriangle size={16} />

        <div>
          <strong>
            Prototype handoff
          </strong>

          <span>
            This page represents the approved-plan
            handoff to the existing Block Demand
            Management System workflow. It does not
            connect to or execute actions in a real
            railway BDMS system.
          </span>
        </div>
      </div>

      {/* BACK */}

      <div className="bdms-footer-action">
        <button
          type="button"
          className="btn"
          onClick={() =>
            onNavigate?.("Approvals")
          }
        >
          <ArrowLeft size={15} />

          Back to Approval
        </button>
      </div>
    </div>
  );
}