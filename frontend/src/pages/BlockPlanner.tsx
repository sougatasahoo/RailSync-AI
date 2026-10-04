import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Factory,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

type Job = {
  request_id: string;
  department: string;
  work: string;
  resource: string;
  priority: number;
};

type Opportunity = {
  opportunity_id: string;
  job_1_request_id: string;
  job_2_request_id: string;
  section_code: string;
  opportunity_score: number;
  individual_duration_minutes: number;
  joint_duration_minutes: number;
  time_saved_minutes: number;
  spatial_distance_km: number;
  start_time: string;
  end_time: string;
  jobs: Job[];
};

type PlanningResponse = {
  planning_period: string;
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
    opportunities: Opportunity[];
    constraints_checked: string[];
  };
};

type Period = "Today" | "This Week" | "This Month";

const API_BASE = "http://127.0.0.1:8000";

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

function getPriorityClass(priority: number) {
  if (priority >= 90) {
    return "priority-critical";
  }

  if (priority >= 75) {
    return "priority-high";
  }

  if (priority >= 60) {
    return "priority-medium";
  }

  return "priority-low";
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function BlockPlanner() {
  const [period, setPeriod] = useState<Period>("Today");
  const [data, setData] = useState<PlanningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => {
    if (period === "Today") {
      return `${API_BASE}/api/planning/today`;
    }

    if (period === "This Week") {
      return `${API_BASE}/api/planning/week`;
    }

    return `${API_BASE}/api/planning/month`;
  }, [period]);

  async function loadPlan() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Planning API returned ${response.status}`);
      }

      const result: PlanningResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load the optimized block plan. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, [endpoint]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">TRANSPORTATION CONTROL</div>
            <h1>Block Planner</h1>
            <p>AI-assisted maintenance block planning</p>
          </div>
        </div>

        <div className="planner-loading">
          <RefreshCw size={22} className="spin" />
          <span>Running optimization and loading plan...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">TRANSPORTATION CONTROL</div>
            <h1>Block Planner</h1>
            <p>AI-assisted maintenance block planning</p>
          </div>
        </div>

        <div className="planner-error">
          <div>
            <strong>Planning data unavailable</strong>
            <p>{error}</p>
          </div>

          <button className="secondary-button" onClick={loadPlan}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const plan = data.plan;
  const summary = plan.optimization_summary;

  const blockStartMinutes = timeToMinutes(plan.block.start_time);
  const blockEndMinutes = timeToMinutes(plan.block.end_time);
  const blockDuration = blockEndMinutes - blockStartMinutes;

  return (
    <div className="page block-planner-page">
      <div className="page-header planner-header">
        <div>
          <div className="eyebrow">TRANSPORTATION CONTROL</div>
          <h1>Block Planner</h1>
          <p>
            AI-assisted maintenance block planning with controller review
          </p>
        </div>

        <div className="planner-header-right">
          <div className="system-status">
            <span className="status-dot" />
            OPTIMIZATION READY
          </div>

          <button className="secondary-button" onClick={loadPlan}>
            <RefreshCw size={16} />
            Refresh Plan
          </button>
        </div>
      </div>

      <div className="planner-tabs">
        {(["Today", "This Week", "This Month"] as Period[]).map((item) => (
          <button
            key={item}
            className={period === item ? "planner-tab active" : "planner-tab"}
            onClick={() => setPeriod(item)}
          >
            <CalendarDays size={15} />
            {item}
          </button>
        ))}
      </div>

      <div className="planner-banner">
        <div className="planner-banner-main">
          <div className="banner-icon">
            <ShieldCheck size={21} />
          </div>

          <div>
            <strong>AI recommends. Human decides.</strong>
            <span>
              The optimized block is a decision-support recommendation and
              requires controller approval before operational execution.
            </span>
          </div>
        </div>

        <div className="optimization-status">
          <CheckCircle2 size={18} />
          {plan.status}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon">
            <MapPin size={18} />
          </div>

          <div>
            <span>SECTION</span>
            <strong>{plan.section_code}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Clock3 size={18} />
          </div>

          <div>
            <span>BLOCK WINDOW</span>
            <strong>
              {plan.block.start_time} – {plan.block.end_time}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Wrench size={18} />
          </div>

          <div>
            <span>JOINT OPPORTUNITIES</span>
            <strong>{summary.opportunities_selected}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Gauge size={18} />
          </div>

          <div>
            <span>ESTIMATED TIME SAVED</span>
            <strong>{formatMinutes(summary.time_saved_minutes)}</strong>
          </div>
        </div>
      </div>

      <div className="planner-grid">
        <section className="planner-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">OPTIMIZED BLOCK</div>

              <h2>
                {plan.section_code} · {plan.block.start_time}–
                {plan.block.end_time}
              </h2>
            </div>

            <span className="optimal-badge">
              <CheckCircle2 size={14} />
              OPTIMAL
            </span>
          </div>

          <div className="block-meta">
            <div>
              <span>Planning horizon</span>
              <strong>{plan.planning_horizon}</strong>
            </div>

            <div>
              <span>Block duration</span>
              <strong>{formatMinutes(plan.block.duration_minutes)}</strong>
            </div>

            <div>
              <span>Solver</span>
              <strong>OR-Tools CP-SAT</strong>
            </div>
          </div>

          {/* =====================================================
              OPTIMIZED BLOCK TIMELINE
              ===================================================== */}

          <div className="timeline">
            <div className="timeline-scale">
              <span>{plan.block.start_time}</span>

              <span>
                {(() => {
                  const middle =
                    blockStartMinutes + Math.round(blockDuration / 2);

                  const hours = Math.floor(middle / 60);
                  const minutes = middle % 60;

                  return `${String(hours).padStart(2, "0")}:${String(
                    minutes
                  ).padStart(2, "0")}`;
                })()}
              </span>

              <span>{plan.block.end_time}</span>
            </div>

            <div className="timeline-track">
              {plan.opportunities.map((opportunity, index) => {
                const opportunityStart = timeToMinutes(
                  opportunity.start_time
                );

                const opportunityEnd = timeToMinutes(opportunity.end_time);

                const left =
                  ((opportunityStart - blockStartMinutes) /
                    blockDuration) *
                  100;

                const width =
                  ((opportunityEnd - opportunityStart) / blockDuration) * 100;

                /*
                 * IMPORTANT:
                 *
                 * Opportunities can overlap because different maintenance
                 * activities/resources may operate during the same block.
                 *
                 * Therefore each opportunity gets its own horizontal lane.
                 *
                 * Lane 0 -> first opportunity
                 * Lane 1 -> second opportunity
                 * Lane 2 -> third opportunity
                 *
                 * This prevents one opportunity from visually hiding another.
                 */

                const laneHeight = 38;
                const laneGap = 5;

                const top = index * (laneHeight + laneGap) + 5;

                return (
                  <div
                    key={opportunity.opportunity_id}
                    className="timeline-job"
                    style={{
                      left: `${Math.max(0, left)}%`,
                      width: `${Math.min(
                        100 - Math.max(0, left),
                        Math.max(width, 8)
                      )}%`,
                      top: `${top}px`,
                      height: `${laneHeight}px`,
                      zIndex: index + 1,
                    }}
                  >
                    <div className="timeline-job-title">
                      {opportunity.opportunity_id}
                    </div>

                    <div className="timeline-job-time">
                      {opportunity.start_time}–{opportunity.end_time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="opportunity-list">
            {plan.opportunities.map((opportunity, index) => (
              <div className="opportunity-card" key={opportunity.opportunity_id}>
                <div className="opportunity-number">{index + 1}</div>

                <div className="opportunity-main">
                  <div className="opportunity-topline">
                    <strong>{opportunity.opportunity_id}</strong>

                    <span className="score-badge">
                      Score {opportunity.opportunity_score.toFixed(2)}
                    </span>
                  </div>

                  <div className="job-pair">
                    {opportunity.jobs.map((job) => (
                      <div className="job-row" key={job.request_id}>
                        <div className="job-department">
                          {job.department}
                        </div>

                        <div className="job-details">
                          <strong>{job.request_id}</strong>
                          <span>{job.work}</span>
                        </div>

                        <div className="job-resource">
                          <Factory size={14} />
                          {job.resource}
                        </div>

                        <div
                          className={`priority-value ${getPriorityClass(
                            job.priority
                          )}`}
                        >
                          {job.priority.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="opportunity-metrics">
                    <div>
                      <span>Window</span>

                      <strong>
                        {opportunity.start_time}–{opportunity.end_time}
                      </strong>
                    </div>

                    <div>
                      <span>Individual work</span>

                      <strong>
                        {formatMinutes(
                          opportunity.individual_duration_minutes
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Joint work</span>

                      <strong>
                        {formatMinutes(opportunity.joint_duration_minutes)}
                      </strong>
                    </div>

                    <div className="saving">
                      <span>Estimated saving</span>

                      <strong>
                        {formatMinutes(opportunity.time_saved_minutes)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="planner-side">
          <section className="planner-panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">PLAN SUMMARY</div>
                <h2>Optimization Results</h2>
              </div>
            </div>

            <div className="result-list">
              <div className="result-row">
                <span>Selected opportunities</span>
                <strong>{summary.opportunities_selected}</strong>
              </div>

              <div className="result-row">
                <span>Individual work</span>

                <strong>
                  {formatMinutes(summary.individual_work_minutes)}
                </strong>
              </div>

              <div className="result-row">
                <span>Joint work estimate</span>

                <strong>
                  {formatMinutes(summary.joint_work_minutes)}
                </strong>
              </div>

              <div className="result-row emphasis">
                <span>Estimated time saved</span>

                <strong>
                  {formatMinutes(summary.time_saved_minutes)}
                </strong>
              </div>
            </div>

            <div className="summary-note">
              <strong>Planning note</strong>

              <p>
                Joint work duration represents the estimated combined
                maintenance effort for each selected opportunity. It is not
                the elapsed duration of the entire block.
              </p>
            </div>
          </section>

          <section className="planner-panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">CONSTRAINT CHECK</div>
                <h2>Operational Conditions</h2>
              </div>
            </div>

            <div className="constraint-list">
              {plan.constraints_checked.map((constraint) => (
                <div className="constraint-row" key={constraint}>
                  <CheckCircle2 size={15} />
                  <span>{constraint}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="controller-card">
            <div className="controller-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>Controller Review Required</strong>

              <p>
                This recommendation should be reviewed, modified if required,
                and approved by the responsible controller before being passed
                to the operational workflow.
              </p>
            </div>

            <button className="primary-button">
              Review &amp; Approve
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}