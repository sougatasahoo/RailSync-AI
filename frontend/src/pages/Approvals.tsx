import { useEffect, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gavel,
  RefreshCw,
  ShieldCheck,
  TrainFront,
  UserCheck,
  XCircle,
} from "lucide-react";

import type { PageKey } from "../types/navigation";

type PlannedOpportunity = {
  opportunity_id: string;
  request_a_id: string;
  request_b_id: string;
  start_time: string;
  end_time: string;
  individual_duration_minutes: number;
  joint_duration_minutes: number;
  time_saved_minutes: number;
};

type PlanningResponse = {
  status: string;
  plan: {
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
};

type Decision =
  | "Pending Review"
  | "Approved"
  | "Modified"
  | "Rejected";

type ApprovalsProps = {
  onNavigate?: (page: PageKey) => void;
};

const API_BASE = "http://127.0.0.1:8000";

export default function Approvals({
  onNavigate,
}: ApprovalsProps) {
  const [plan, setPlan] =
    useState<PlanningResponse["plan"] | null>(null);

  const [decision, setDecision] =
    useState<Decision>("Pending Review");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [modifyMode, setModifyMode] =
    useState(false);

  const [controllerNote, setControllerNote] =
    useState("");

  async function loadPlan() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/planning/today`
      );

      if (!response.ok) {
        throw new Error(
          `Planning API returned ${response.status}`
        );
      }

      const data: PlanningResponse =
        await response.json();

      setPlan(data.plan);

      const savedDecision =
        localStorage.getItem(
          "railsync_approval_decision"
        );

      const savedNote =
        localStorage.getItem(
          "railsync_controller_note"
        );

      if (
        savedDecision === "Approved" ||
        savedDecision === "Modified" ||
        savedDecision === "Rejected"
      ) {
        setDecision(savedDecision);
      } else {
        setDecision("Pending Review");
      }

      if (savedNote) {
        setControllerNote(savedNote);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load the recommended block plan. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  function saveDecision(nextDecision: Decision) {
    setDecision(nextDecision);

    localStorage.setItem(
      "railsync_approval_decision",
      nextDecision
    );

    localStorage.setItem(
      "railsync_controller_note",
      controllerNote
    );

    setModifyMode(false);

    /*
     * Only new BDMS behavior:
     * after controller approval, navigate to BDMS.
     */
    if (nextDecision === "Approved") {
      onNavigate?.("BDMS");
    }
  }

  function handleModify() {
    setDecision("Modified");
    setModifyMode(true);

    localStorage.setItem(
      "railsync_approval_decision",
      "Modified"
    );

    localStorage.setItem(
      "railsync_controller_note",
      controllerNote
    );
  }

  function handleReset() {
    setDecision("Pending Review");
    setModifyMode(false);
    setControllerNote("");

    localStorage.removeItem(
      "railsync_approval_decision"
    );

    localStorage.removeItem(
      "railsync_controller_note"
    );
  }

  function getDecisionClass() {
    switch (decision) {
      case "Approved":
        return "approval-approved";

      case "Modified":
        return "approval-modified";

      case "Rejected":
        return "approval-rejected";

      default:
        return "approval-pending";
    }
  }

  if (loading) {
    return (
      <div className="page approvals-page">
        <div className="approval-loading">
          <RefreshCw
            size={22}
            className="spin"
          />

          <span>
            Loading recommended block plan...
          </span>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="page approvals-page">
        <div className="approval-error">
          <AlertTriangle size={22} />

          <div>
            <strong>
              Recommended plan unavailable
            </strong>

            <p>
              {error ||
                "No planning recommendation was returned."}
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadPlan}
          >
            <RefreshCw size={15} />

            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page approvals-page">
      <div className="page-header approvals-header">
        <div>
          <div className="eyebrow">
            HUMAN-IN-THE-LOOP CONTROL
          </div>

          <h1>Plan Approval</h1>

          <p>
            Controller review of the AI-generated
            maintenance block recommendation
          </p>
        </div>

        <div className="approval-header-status">
          <UserCheck size={16} />

          CONTROLLER REVIEW
        </div>
      </div>

      <div className="approval-workflow">
        <div className="approval-flow-step completed">
          <span>01</span>

          <div>
            <strong>
              AI Recommendation
            </strong>

            <small>
              Completed
            </small>
          </div>
        </div>

        <div className="approval-flow-line completed" />

        <div className="approval-flow-step active">
          <span>02</span>

          <div>
            <strong>
              Controller Review
            </strong>

            <small>
              Current step
            </small>
          </div>
        </div>

        <div className="approval-flow-line" />

        <div className="approval-flow-step">
          <span>03</span>

          <div>
            <strong>
              BDMS Workflow
            </strong>

            <small>
              After approval
            </small>
          </div>
        </div>
      </div>

      <div className="approval-status-banner">
        <div className="approval-status-left">
          <div className="approval-status-icon">
            {decision === "Approved" ? (
              <CheckCircle2 size={21} />
            ) : decision === "Rejected" ? (
              <XCircle size={21} />
            ) : (
              <Clock3 size={21} />
            )}
          </div>

          <div>
            <span>
              CONTROLLER DECISION
            </span>

            <strong>
              {decision}
            </strong>
          </div>
        </div>

        <div
          className={`approval-decision-badge ${getDecisionClass()}`}
        >
          {decision}
        </div>
      </div>

      <div className="approval-layout">
        <section className="approval-main-panel">
          <div className="approval-panel-header">
            <div>
              <div className="panel-kicker">
                AI-GENERATED RECOMMENDATION
              </div>

              <h2>
                Recommended Maintenance Block
              </h2>
            </div>

            <div className="solver-badge">
              <ShieldCheck size={14} />

              {plan.solver}
            </div>
          </div>

          <div className="recommended-block">
            <div className="block-primary">
              <span>
                RECOMMENDED BLOCK
              </span>

              <strong>
                {plan.block.start_time} –{" "}
                {plan.block.end_time}
              </strong>

              <small>
                {plan.section_code} ·{" "}
                {plan.planning_horizon}
              </small>
            </div>

            <div className="block-secondary">
              <div>
                <span>
                  BLOCK DURATION
                </span>

                <strong>
                  {plan.block.duration_minutes} min
                </strong>
              </div>

              <div>
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

              <div>
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
          </div>

          <div className="approval-section">
            <div className="approval-section-title">
              <TrainFront size={15} />

              Selected Joint Work
            </div>

            <div className="approval-opportunity-list">
              {plan.opportunities.map(
                (opportunity) => (
                  <div
                    className="approval-opportunity"
                    key={
                      opportunity.opportunity_id
                    }
                  >
                    <div className="approval-opportunity-id">
                      <strong>
                        {
                          opportunity.opportunity_id
                        }
                      </strong>

                      <span>
                        Joint maintenance candidate
                      </span>
                    </div>

                    <div className="approval-job-pair">
                      <span>
                        {
                          opportunity.request_a_id
                        }
                      </span>

                      <span>+</span>

                      <span>
                        {
                          opportunity.request_b_id
                        }
                      </span>
                    </div>

                    <div className="approval-time">
                      <Clock3 size={13} />

                      <strong>
                        {
                          opportunity.start_time
                        }{" "}
                        –{" "}
                        {
                          opportunity.end_time
                        }
                      </strong>
                    </div>

                    <div className="approval-saved">
                      <span>
                        {
                          opportunity.time_saved_minutes
                        }{" "}
                        min
                      </span>

                      <small>
                        saved
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="approval-section">
            <div className="approval-section-title">
              <CheckCircle2 size={15} />

              Optimization Summary
            </div>

            <div className="approval-metrics">
              <div>
                <span>
                  Individual work
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
                  Joint work
                </span>

                <strong>
                  {
                    plan.optimization_summary
                      .joint_work_minutes
                  }{" "}
                  min
                </strong>
              </div>

              <div>
                <span>
                  Time saved
                </span>

                <strong className="saved-value">
                  {
                    plan.optimization_summary
                      .time_saved_minutes
                  }{" "}
                  min
                </strong>
              </div>
            </div>
          </div>

          <div className="approval-section">
            <div className="approval-section-title">
              <ShieldCheck size={15} />

              Constraints Checked
            </div>

            <div className="constraint-list">
              {plan.constraints_checked.map(
                (constraint, index) => (
                  <div
                    className="constraint-item"
                    key={`${constraint}-${index}`}
                  >
                    <CheckCircle2 size={14} />

                    <span>
                      {constraint}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <aside className="approval-review-panel">
          <div className="approval-review-header">
            <div className="panel-kicker">
              CONTROLLER ACTION
            </div>

            <h2>
              Review Recommendation
            </h2>

            <p>
              Verify the recommended block before
              sending it through the existing BDMS
              workflow.
            </p>
          </div>

          <div className="review-checklist">
            <div>
              <CheckCircle2 size={15} />

              <span>
                Maintenance jobs are appropriate
                for joint planning
              </span>
            </div>

            <div>
              <CheckCircle2 size={15} />

              <span>
                Recommended block window is
                available
              </span>
            </div>

            <div>
              <CheckCircle2 size={15} />

              <span>
                Required resources have been
                considered
              </span>
            </div>

            <div>
              <CheckCircle2 size={15} />

              <span>
                Operational constraints have been
                checked
              </span>
            </div>
          </div>

          <div className="controller-note-section">
            <label htmlFor="controller-note">
              Controller remarks
            </label>

            <textarea
              id="controller-note"
              value={controllerNote}
              onChange={(event) =>
                setControllerNote(
                  event.target.value
                )
              }
              placeholder="Enter review remarks, modifications, or operational notes..."
              rows={5}
            />
          </div>

          {modifyMode && (
            <div className="modified-notice">
              <AlertTriangle size={15} />

              <span>
                Plan marked as modified. Record
                the required controller changes in
                the remarks above.
              </span>
            </div>
          )}

          <div className="approval-actions">
            <button
              className="approve-button"
              onClick={() =>
                saveDecision("Approved")
              }
            >
              <CheckCircle2 size={16} />

              Approve Plan
            </button>

            <button
              className="modify-button"
              onClick={handleModify}
            >
              <Gavel size={16} />

              Modify Plan
            </button>

            <button
              className="reject-button"
              onClick={() =>
                saveDecision("Rejected")
              }
            >
              <XCircle size={16} />

              Reject Plan
            </button>
          </div>

          {decision !== "Pending Review" && (
            <button
              className="reset-review-button"
              onClick={handleReset}
            >
              Reset controller decision
            </button>
          )}

          <div className="bdms-handoff">
            <FileCheck2 size={17} />

            <div>
              <strong>
                BDMS workflow
              </strong>

              <p>
                Approval represents the controller's
                decision on the recommendation.
                Execution remains outside RailSync
                AI and follows the existing railway
                workflow.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="approval-principle">
        <ShieldCheck size={18} />

        <div>
          <strong>
            AI recommends. Human decides.
          </strong>

          <span>
            RailSync AI provides decision support;
            the controller retains operational
            authority.
          </span>
        </div>
      </div>
    </div>
  );
}