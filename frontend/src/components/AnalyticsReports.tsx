import { useEffect, useState } from "react"
import "./AnalyticsReports.css"

const API_BASE = "http://127.0.0.1:8000"

type AnalyticsSummary = {
  block_utilization?: number
  maintenance_total?: number
  maintenance_completed?: number
  joint_opportunities?: number
  selected_opportunities?: number
  unscheduled_opportunities?: number
  resource_readiness?: number
  conflict_reviews?: number
  total_available_hours?: number
  total_planned_hours?: number
  total_opportunity_score?: number
}

type UtilizationPoint = {
  label?: string
  value?: number
}

type DepartmentPerformance = {
  name?: string
  requests?: number
  completed?: number
  completion_percent?: number
}

type RecentOutcome = {
  id?: string
  activity?: string
  corridor?: string
  date?: string
  requests?: number
  duration?: number
  utilization?: number
  status?: string
}

type AnalyticsReport = {
  status?: string
  summary?: AnalyticsSummary
  utilization_trend?: UtilizationPoint[]
  department_performance?: DepartmentPerformance[]
  recent_outcomes?: RecentOutcome[]
  resource_summary?: {
    total_resources?: number
    ready_resources?: number
    limited_resources?: number
    unavailable_resources?: number
  }
  planning_summary?: {
    candidate_count?: number
    selected_count?: number
    unscheduled_count?: number
    total_planned_hours?: number
    total_opportunity_score?: number
  }
  conflict_summary?: {
    total?: number
    review?: number
    clear?: number
  }
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function text(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : String(value)
}

export default function AnalyticsReports() {
  const [report, setReport] = useState<AnalyticsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadAnalytics() {
    try {
      setError("")

      const response = await fetch(`${API_BASE}/api/analytics/report`)

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`)
      }

      const data: AnalyticsReport = await response.json()
      setReport(data)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load analytics.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()

    const interval = window.setInterval(loadAnalytics, 30000)

    return () => window.clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <section className="page-content">
        <div className="page-header">
          <div>
            <h1>Analytics &amp; Reports</h1>
            <p>Operational performance and planning insights.</p>
          </div>
        </div>

        <div className="analytics-loading">
          Loading operational analytics...
        </div>
      </section>
    )
  }

  if (error || !report) {
    return (
      <section className="page-content">
        <div className="page-header">
          <div>
            <h1>Analytics &amp; Reports</h1>
            <p>Operational performance and planning insights.</p>
          </div>
        </div>

        <div className="analytics-error">
          <strong>Analytics unavailable</strong>
          <span>{error || "No analytics data was returned."}</span>

          <button type="button" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      </section>
    )
  }

  const summary = report.summary ?? {}

  const blockUtilization = num(summary.block_utilization)
  const maintenanceTotal = num(summary.maintenance_total)
  const maintenanceCompleted = num(summary.maintenance_completed)
  const jointOpportunities = num(summary.joint_opportunities)
  const selectedOpportunities = num(summary.selected_opportunities)
  const unscheduledOpportunities = num(summary.unscheduled_opportunities)
  const resourceReadiness = num(summary.resource_readiness)
  const availableHours = num(summary.total_available_hours)
  const plannedHours = num(summary.total_planned_hours)
  const opportunityScore = num(summary.total_opportunity_score)

  const utilizationTrend = Array.isArray(report.utilization_trend)
    ? report.utilization_trend
    : []

  const departmentPerformance = Array.isArray(
    report.department_performance,
  )
    ? report.department_performance
    : []

  const recentOutcomes = Array.isArray(report.recent_outcomes)
    ? report.recent_outcomes
    : []

  const resourceSummary = report.resource_summary ?? {}
  const planningSummary = report.planning_summary ?? {}
  const conflictSummary = report.conflict_summary ?? {}

  return (
    <section className="page-content analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics &amp; Reports</h1>
          <p>
            Operational performance, maintenance planning and resource
            insights.
          </p>
        </div>

        <div className="analytics-live-status">
          <span className="analytics-live-dot" />
          Live data
        </div>
      </div>

      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">
            Block Utilization
          </span>

          <strong>{blockUtilization.toFixed(1)}%</strong>

          <span className="analytics-kpi-subtext">
            Planned block hours / available hours
          </span>
        </div>

        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">
            Maintenance Requests
          </span>

          <strong>{maintenanceTotal}</strong>

          <span className="analytics-kpi-subtext">
            {maintenanceCompleted} completed in current dataset
          </span>
        </div>

        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">
            Joint Opportunities
          </span>

          <strong>{jointOpportunities}</strong>

          <span className="analytics-kpi-subtext">
            {selectedOpportunities} selected for proposed plan
          </span>
        </div>

        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">
            Resource Readiness
          </span>

          <strong>{resourceReadiness.toFixed(1)}%</strong>

          <span className="analytics-kpi-subtext">
            Manpower, machines and materials
          </span>
        </div>
      </div>

      <div className="analytics-main-grid">
        <div className="analytics-card analytics-utilization-card">
          <div className="analytics-card-header">
            <div>
              <h2>Block Utilization Trend</h2>
              <p>Available operational window utilization.</p>
            </div>

            <span className="analytics-value-chip">
              {blockUtilization.toFixed(1)}%
            </span>
          </div>

          {utilizationTrend.length > 0 ? (
            <div className="analytics-chart">
              {utilizationTrend.map((item, index) => {
                const value = num(item.value)

                return (
                  <div
                    className="analytics-chart-column"
                    key={`${text(item.label)}-${index}`}
                  >
                    <div className="analytics-chart-value">
                      {value.toFixed(1)}%
                    </div>

                    <div className="analytics-chart-track">
                      <div
                        className="analytics-chart-bar"
                        style={{
                          height: `${Math.min(
                            100,
                            Math.max(0, value),
                          )}%`,
                        }}
                      />
                    </div>

                    <span className="analytics-chart-label">
                      {text(item.label)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="analytics-empty">
              No utilization trend data available.
            </div>
          )}
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>Planning Summary</h2>
              <p>Current optimization output.</p>
            </div>
          </div>

          <div className="analytics-summary-list">
            <div className="analytics-summary-row">
              <span>Available block hours</span>
              <strong>{availableHours.toFixed(1)} h</strong>
            </div>

            <div className="analytics-summary-row">
              <span>Planned block hours</span>
              <strong>{plannedHours.toFixed(1)} h</strong>
            </div>

            <div className="analytics-summary-row">
              <span>Selected opportunities</span>
              <strong>{selectedOpportunities}</strong>
            </div>

            <div className="analytics-summary-row">
              <span>Unscheduled opportunities</span>
              <strong>{unscheduledOpportunities}</strong>
            </div>

            <div className="analytics-summary-row">
              <span>Opportunity score</span>
              <strong>{opportunityScore.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>Department Performance</h2>
            <p>
              Maintenance workload and completion status across
              participating departments.
            </p>
          </div>
        </div>

        {departmentPerformance.length > 0 ? (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Requests</th>
                  <th>Completed</th>
                  <th>Completion</th>
                </tr>
              </thead>

              <tbody>
                {departmentPerformance.map((item, index) => {
                  const completion = num(item.completion_percent)

                  return (
                    <tr key={`${text(item.name)}-${index}`}>
                      <td>
                        <strong>{text(item.name)}</strong>
                      </td>

                      <td>{num(item.requests)}</td>

                      <td>{num(item.completed)}</td>

                      <td>
                        <div className="analytics-readiness-cell">
                          <span>
                            {completion.toFixed(1)}%
                          </span>

                          <div className="analytics-mini-track">
                            <div
                              className="analytics-mini-bar"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, completion),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="analytics-empty">
            No department performance data available.
          </div>
        )}
      </div>

      <div className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>Recent Planning Outcomes</h2>
            <p>Latest generated planning results.</p>
          </div>
        </div>

        {recentOutcomes.length > 0 ? (
          <div className="analytics-outcomes">
            {recentOutcomes.map((item, index) => (
              <div
                className="analytics-outcome-row"
                key={item.id || index}
              >
                <div className="analytics-outcome-main">
                  <strong>{text(item.activity)}</strong>

                  <span>
                    {text(item.corridor)} · {text(item.date)}
                  </span>

                  <span>
                    {num(item.requests)} requests ·{" "}
                    {num(item.duration).toFixed(1)} h
                  </span>
                </div>

                <div className="analytics-outcome-right">
                  <span className="analytics-result-badge">
                    {text(item.status)}
                  </span>

                  <span className="analytics-outcome-utilization">
                    {num(item.utilization).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="analytics-empty">
            No recent outcomes available.
          </div>
        )}
      </div>

      <div className="analytics-insights-grid">
        <div className="analytics-insight-card">
          <span className="analytics-insight-title">
            Resource Pool
          </span>

          <strong>
            {num(resourceSummary.ready_resources)} /{" "}
            {num(resourceSummary.total_resources)}
          </strong>

          <p>
            Resources currently ready for operational planning.
          </p>
        </div>

        <div className="analytics-insight-card">
          <span className="analytics-insight-title">
            Selected Plan
          </span>

          <strong>
            {num(planningSummary.selected_count)}
          </strong>

          <p>
            Joint opportunities selected by the current optimizer.
          </p>
        </div>

        <div className="analytics-insight-card">
          <span className="analytics-insight-title">
            Conflict Reviews
          </span>

          <strong>
            {num(conflictSummary.review)}
          </strong>

          <p>
            Opportunities requiring operational review in the
            current analysis.
          </p>
        </div>
      </div>

      <div className="analytics-note">
        <strong>Prototype data note:</strong>

        <span>
          Analytics are generated from the current synthetic railway
          datasets and RailSync AI planning services.
        </span>
      </div>
    </section>
  )
}