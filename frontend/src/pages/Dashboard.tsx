import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  GitMerge,
  ShieldCheck,
  Wrench,
} from "lucide-react"

export default function Dashboard() {
  return (
    <section className="dashboard-page">
      {/* Page heading */}
      <div className="module-heading">
        <span className="section-kicker">
          BLOCK PLANNING DASHBOARD
        </span>

        <h1>
          Daily Operational Overview
        </h1>

        <p>
          Maintenance, train operations and proposed
          block activity for the current planning
          cycle.
        </p>
      </div>

      {/* Operational context */}
      <div className="dashboard-context">
        <ContextItem
          label="PLANNING AREA"
          value="Howrah–Kharagpur"
        />

        <ContextItem
          label="CONTROL CONTEXT"
          value="Kharagpur Division"
        />

        <ContextItem
          label="DATA MODE"
          value="Synthetic Simulation"
        />

        <ContextItem
          label="DECISION MODE"
          value="Human Approval"
        />
      </div>

      {/* Key operational metrics */}
      <div className="dashboard-metrics">
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Critical Maintenance"
          value="12"
          detail="Requires priority review"
          type="critical"
        />

        <MetricCard
          icon={<Wrench size={18} />}
          label="Pending Requests"
          value="187"
          detail="Across TMS / TDMS / SMMS"
          type="warning"
        />

        <MetricCard
          icon={<GitMerge size={18} />}
          label="Joint Opportunities"
          value="24"
          detail="Candidate combinations"
          type="normal"
        />

        <MetricCard
          icon={<Clock3 size={18} />}
          label="Proposed Blocks"
          value="8"
          detail="Awaiting controller review"
          type="normal"
        />
      </div>

      {/* Main dashboard */}
      <div className="dashboard-columns">
        {/* Planning pipeline */}
        <section className="dashboard-panel">
          <PanelHeader
            eyebrow="PLANNING PIPELINE"
            title="Current Planning Status"
          />

          <div className="planning-pipeline">
            <PipelineStep
              number="01"
              title="Data Fusion"
              description="TMS, TDMS, SMMS, COA and resource feeds"
              status="Complete"
              icon={<Database size={17} />}
            />

            <PipelineStep
              number="02"
              title="Maintenance Prioritization"
              description="XGBoost priority scoring with SHAP explanation"
              status="Complete"
              icon={<Wrench size={17} />}
            />

            <PipelineStep
              number="03"
              title="Joint Opportunity Detection"
              description="Spatial, temporal and resource compatibility"
              status="Complete"
              icon={<GitMerge size={17} />}
            />

            <PipelineStep
              number="04"
              title="Block Optimization"
              description="Constraint-based scheduling using CP-SAT"
              status="Ready"
              icon={<Clock3 size={17} />}
            />

            <PipelineStep
              number="05"
              title="Human Approval"
              description="Controller reviews proposed block plan"
              status="Pending"
              icon={<ShieldCheck size={17} />}
            />
          </div>
        </section>

        {/* Source systems */}
        <section className="dashboard-panel">
          <PanelHeader
            eyebrow="SOURCE FEEDS"
            title="Data Availability"
          />

          <div className="source-feed-list">
            <SourceFeed
              system="TMS"
              description="Track maintenance"
              count="65"
            />

            <SourceFeed
              system="TDMS"
              description="Traction / OHE"
              count="63"
            />

            <SourceFeed
              system="SMMS"
              description="Signal & Telecom"
              count="68"
            />

            <SourceFeed
              system="COA"
              description="Train operations"
              count="312"
            />

            <SourceFeed
              system="Resources"
              description="Crew / machine / material"
              count="Available"
            />
          </div>
        </section>
      </div>

      {/* Operational attention */}
      <section className="dashboard-panel attention-panel">
        <PanelHeader
          eyebrow="CONTROLLER ATTENTION"
          title="Items Requiring Review"
        />

        <div className="attention-list">
          <AttentionRow
            icon={<AlertTriangle size={17} />}
            title="Critical track defect"
            detail="TMS request TRK-26027-0142 requires priority review."
            action="View maintenance"
            type="critical"
          />

          <AttentionRow
            icon={<GitMerge size={17} />}
            title="Cross-department opportunity"
            detail="Track and OHE requests detected near the same section."
            action="View opportunity"
            type="warning"
          />

          <AttentionRow
            icon={<Clock3 size={17} />}
            title="Block proposal awaiting approval"
            detail="Proposed maintenance block requires controller decision."
            action="Open approvals"
            type="normal"
          />
        </div>
      </section>

      {/* Human-in-the-loop statement */}
      <div className="human-decision-banner">
        <div className="human-decision-icon">
          <ShieldCheck size={20} />
        </div>

        <div>
          <strong>
            AI recommends. Human decides.
          </strong>

          <span>
            RailSync AI prepares maintenance and block
            recommendations. Final approval remains with
            the authorized railway controller.
          </span>
        </div>

        <ArrowRight size={18} />
      </div>
    </section>
  )
}

function ContextItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="dashboard-context-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  type,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  type: "critical" | "warning" | "normal"
}) {
  return (
    <div className={`dashboard-metric ${type}`}>
      <div className="metric-icon">
        {icon}
      </div>

      <span className="metric-label">
        {label}
      </span>

      <strong className="metric-value">
        {value}
      </strong>

      <small>{detail}</small>
    </div>
  )
}

function PanelHeader({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div className="dashboard-panel-header">
      <div>
        <span className="section-kicker">
          {eyebrow}
        </span>

        <h2>{title}</h2>
      </div>
    </div>
  )
}

function PipelineStep({
  number,
  title,
  description,
  status,
  icon,
}: {
  number: string
  title: string
  description: string
  status: "Complete" | "Ready" | "Pending"
  icon: React.ReactNode
}) {
  const statusClass =
    status === "Complete"
      ? "complete"
      : status === "Ready"
        ? "ready"
        : "pending"

  return (
    <div className="pipeline-step">
      <div className="pipeline-step-number">
        {number}
      </div>

      <div className="pipeline-step-icon">
        {icon}
      </div>

      <div className="pipeline-step-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <span
        className={`pipeline-step-status ${statusClass}`}
      >
        {status}
      </span>
    </div>
  )
}

function SourceFeed({
  system,
  description,
  count,
}: {
  system: string
  description: string
  count: string
}) {
  return (
    <div className="source-feed">
      <div className="source-feed-indicator">
        <CheckCircle2 size={15} />
      </div>

      <div className="source-feed-info">
        <strong>{system}</strong>
        <span>{description}</span>
      </div>

      <div className="source-feed-count">
        {count}
      </div>

      <span className="source-feed-status">
        Available
      </span>
    </div>
  )
}

function AttentionRow({
  icon,
  title,
  detail,
  action,
  type,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  action: string
  type: "critical" | "warning" | "normal"
}) {
  return (
    <div className={`attention-row ${type}`}>
      <div className="attention-icon">
        {icon}
      </div>

      <div className="attention-content">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>

      <button type="button">
        {action}
        <ArrowRight size={14} />
      </button>
    </div>
  )
}