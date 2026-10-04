import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Factory,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

type ShapExplanation = {
  feature: string;
  label: string;
  contribution: number;
  direction: string;
};

type MaintenanceRecord = {
  request_id: string;
  request_date: string;
  department: string;
  section: string;
  section_code: string;
  km: number;
  defect_type: string;
  priority: string;
  severity_score: number;
  duration_minutes: number;
  required_resource: string;
  due_date: string;
  scenario: string;
  status: string;
  department_name: string;
  priority_score: number;
  days_to_due: number;
  maintenance_score: number;
  is_cluster_candidate: boolean;
  mapped_section_code: string;
  mapped_section_name: string;
  ml_priority_score: number;
  priority_rank: number;
  shap_explanation: ShapExplanation[];
  top_priority_reason: string | null;
};

type MaintenanceResponse = {
  status: string;
  count: number;
  records: MaintenanceRecord[];
};

type SummaryResponse = {
  status: string;
  summary: {
    total_requests: number;
    average_ml_priority: number;
    highest_ml_priority: number;
    cluster_candidates: number;
    department_distribution: Record<string, number>;
    priority_distribution: Record<string, number>;
    status_distribution: Record<string, number>;
    section_distribution: Record<string, number>;
  };
};

const API_BASE = "http://127.0.0.1:8000";

function getPriorityClass(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical":
      return "maintenance-critical";
    case "high":
      return "maintenance-high";
    case "medium":
      return "maintenance-medium";
    case "low":
      return "maintenance-low";
    default:
      return "";
  }
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "status-pending";
    case "open":
      return "status-open";
    case "under review":
      return "status-review";
    case "planned":
      return "status-planned";
    default:
      return "";
  }
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatScore(value: number) {
  return Number(value).toFixed(2);
}

export default function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [summary, setSummary] =
    useState<SummaryResponse["summary"] | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRecord | null>(null);

  const [department, setDepartment] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMaintenance() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("limit", "100");

      if (department !== "All") {
        params.set("department", department);
      }

      if (status !== "All") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const [maintenanceResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE}/api/maintenance/?${params.toString()}`),
        fetch(`${API_BASE}/api/maintenance/summary`),
      ]);

      if (!maintenanceResponse.ok) {
        throw new Error(
          `Maintenance API returned ${maintenanceResponse.status}`
        );
      }

      if (!summaryResponse.ok) {
        throw new Error(
          `Maintenance summary API returned ${summaryResponse.status}`
        );
      }

      const maintenanceData: MaintenanceResponse =
        await maintenanceResponse.json();

      const summaryData: SummaryResponse =
        await summaryResponse.json();

      setRecords(maintenanceData.records);
      setSummary(summaryData.summary);

      if (maintenanceData.records.length > 0) {
        setSelectedRequest((current) => {
          if (!current) {
            return maintenanceData.records[0];
          }

          return (
            maintenanceData.records.find(
              (record) => record.request_id === current.request_id
            ) ?? maintenanceData.records[0]
          );
        });
      } else {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load maintenance intelligence. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaintenance();
  }, [department, status, search]);

  const filteredRecords = useMemo(() => {
    if (priority === "All") {
      return records;
    }

    return records.filter(
      (record) =>
        record.priority.toLowerCase() === priority.toLowerCase()
    );
  }, [records, priority]);

  const selectedShap = selectedRequest?.shap_explanation ?? [];

  const maxShap = useMemo(() => {
    if (selectedShap.length === 0) {
      return 1;
    }

    return Math.max(
      ...selectedShap.map((item) => Math.abs(item.contribution)),
      1
    );
  }, [selectedShap]);

  return (
    <div className="page maintenance-page">
      <div className="page-header maintenance-header">
        <div>
          <div className="eyebrow">MAINTENANCE INTELLIGENCE</div>

          <h1>Maintenance Register</h1>

          <p>
            XGBoost-prioritized maintenance requests with SHAP explanations
          </p>
        </div>

        <div className="maintenance-header-actions">
          <div className="ai-status">
            <span className="ai-status-dot" />
            AI PRIORITIZATION ACTIVE
          </div>

          <button
            className="secondary-button"
            onClick={loadMaintenance}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="maintenance-summary-grid">
          <div className="maintenance-summary-card">
            <div className="maintenance-summary-icon">
              <Wrench size={18} />
            </div>

            <div>
              <span>TOTAL REQUESTS</span>
              <strong>{summary.total_requests.toLocaleString()}</strong>
            </div>
          </div>

          <div className="maintenance-summary-card">
            <div className="maintenance-summary-icon">
              <BrainCircuit size={18} />
            </div>

            <div>
              <span>AVERAGE ML PRIORITY</span>
              <strong>{summary.average_ml_priority.toFixed(2)}</strong>
            </div>
          </div>

          <div className="maintenance-summary-card">
            <div className="maintenance-summary-icon">
              <AlertTriangle size={18} />
            </div>

            <div>
              <span>CLUSTER CANDIDATES</span>
              <strong>
                {summary.cluster_candidates.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="maintenance-summary-card">
            <div className="maintenance-summary-icon">
              <ShieldCheck size={18} />
            </div>

            <div>
              <span>HIGHEST ML PRIORITY</span>
              <strong>{summary.highest_ml_priority.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="maintenance-toolbar">
        <div className="maintenance-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search request, work type, resource, section..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="maintenance-filter">
          <Filter size={14} />

          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="TMS">TMS</option>
            <option value="TDMS">TDMS</option>
            <option value="SMMS">SMMS</option>
          </select>
        </div>

        <div className="maintenance-filter">
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="maintenance-filter">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Planned">Planned</option>
          </select>
        </div>
      </div>

      <div className="maintenance-layout">
        <section className="maintenance-table-panel">
          <div className="maintenance-panel-header">
            <div>
              <div className="panel-kicker">PRIORITIZED REQUESTS</div>

              <h2>
                Maintenance Work Queue
              </h2>
            </div>

            <div className="maintenance-count">
              Showing {filteredRecords.length} requests
            </div>
          </div>

          {loading ? (
            <div className="maintenance-loading">
              <RefreshCw size={21} className="spin" />
              <span>
                Loading prioritized maintenance requests...
              </span>
            </div>
          ) : error ? (
            <div className="maintenance-error">
              <AlertTriangle size={20} />

              <div>
                <strong>Maintenance data unavailable</strong>
                <p>{error}</p>
              </div>

              <button
                className="secondary-button"
                onClick={loadMaintenance}
              >
                Retry
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="maintenance-empty">
              <Search size={22} />

              <strong>No maintenance requests found</strong>

              <span>
                Change the filters or search terms and try again.
              </span>
            </div>
          ) : (
            <div className="maintenance-table-wrapper">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>REQUEST</th>
                    <th>DEPT.</th>
                    <th>SECTION</th>
                    <th>WORK</th>
                    <th>PRIORITY</th>
                    <th>ML SCORE</th>
                    <th>DUE</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.request_id}
                      className={
                        selectedRequest?.request_id ===
                        record.request_id
                          ? "selected"
                          : ""
                      }
                      onClick={() => setSelectedRequest(record)}
                    >
                      <td>
                        <span className="rank-number">
                          {record.priority_rank}
                        </span>
                      </td>

                      <td>
                        <div className="request-cell">
                          <strong>{record.request_id}</strong>

                          <span>
                            {record.required_resource}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="department-badge">
                          {record.department}
                        </span>
                      </td>

                      <td>
                        <div className="section-cell">
                          <strong>
                            {record.mapped_section_code}
                          </strong>

                          <span>
                            {record.km.toFixed(1)} km
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="work-cell">
                          <strong>{record.defect_type}</strong>

                          <span>
                            {record.duration_minutes} min
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`priority-badge ${getPriorityClass(
                            record.priority
                          )}`}
                        >
                          {record.priority}
                        </span>
                      </td>

                      <td>
                        <div className="ml-score-cell">
                          <strong>
                            {formatScore(
                              record.ml_priority_score
                            )}
                          </strong>

                          <div className="ml-score-bar">
                            <span
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    record.ml_priority_score
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="due-cell">
                          <strong>
                            {formatDate(record.due_date)}
                          </strong>

                          <span>
                            {record.days_to_due === 0
                              ? "Due today"
                              : record.days_to_due === 1
                              ? "1 day"
                              : `${record.days_to_due} days`}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`maintenance-status ${getStatusClass(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td>
                        <ChevronRight
                          size={15}
                          className="row-chevron"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="maintenance-detail-panel">
          {selectedRequest ? (
            <>
              <div className="maintenance-detail-header">
                <div>
                  <div className="panel-kicker">
                    REQUEST DETAIL
                  </div>

                  <h2>{selectedRequest.request_id}</h2>

                  <span className="detail-subtitle">
                    {selectedRequest.department_name} ·{" "}
                    {selectedRequest.department}
                  </span>
                </div>

                <span
                  className={`priority-badge ${getPriorityClass(
                    selectedRequest.priority
                  )}`}
                >
                  {selectedRequest.priority}
                </span>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <MapPin size={15} />
                  Maintenance Location
                </div>

                <div className="detail-grid">
                  <div>
                    <span>Section</span>
                    <strong>
                      {selectedRequest.mapped_section_code}
                    </strong>
                  </div>

                  <div>
                    <span>Location</span>
                    <strong>
                      {selectedRequest.km.toFixed(3)} km
                    </strong>
                  </div>

                  <div>
                    <span>Section name</span>
                    <strong>
                      {selectedRequest.mapped_section_name}
                    </strong>
                  </div>

                  <div>
                    <span>Resource</span>
                    <strong>
                      {selectedRequest.required_resource}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <Wrench size={15} />
                  Maintenance Work
                </div>

                <div className="work-detail-card">
                  <strong>{selectedRequest.defect_type}</strong>

                  <div className="work-detail-meta">
                    <span>
                      Duration{" "}
                      <b>
                        {selectedRequest.duration_minutes} min
                      </b>
                    </span>

                    <span>
                      Severity{" "}
                      <b>
                        {selectedRequest.severity_score}
                      </b>
                    </span>

                    <span>
                      Due{" "}
                      <b>
                        {formatDate(selectedRequest.due_date)}
                      </b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section ai-priority-section">
                <div className="detail-section-title">
                  <BrainCircuit size={15} />
                  AI Priority Assessment
                </div>

                <div className="ai-score-box">
                  <div>
                    <span>ML PRIORITY SCORE</span>

                    <strong>
                      {selectedRequest.ml_priority_score.toFixed(
                        2
                      )}
                    </strong>
                  </div>

                  <div className="ai-rank">
                    <span>RANK</span>

                    <strong>
                      #{selectedRequest.priority_rank}
                    </strong>
                  </div>
                </div>

                <div className="ai-reason">
                  <CheckCircle2 size={15} />

                  <span>
                    {selectedRequest.top_priority_reason ??
                      "SHAP explanation available for this request."}
                  </span>
                </div>

                <div className="shap-list">
                  {selectedShap.map((item) => {
                    const percentage = Math.min(
                      100,
                      (Math.abs(item.contribution) /
                        maxShap) *
                        100
                    );

                    const positive =
                      item.contribution >= 0;

                    return (
                      <div
                        className="shap-row"
                        key={item.feature}
                      >
                        <div className="shap-label">
                          <span>{item.label}</span>

                          <strong
                            className={
                              positive
                                ? "shap-positive"
                                : "shap-negative"
                            }
                          >
                            {positive ? "+" : ""}
                            {item.contribution.toFixed(2)}
                          </strong>
                        </div>

                        <div className="shap-bar">
                          <span
                            className={
                              positive
                                ? "shap-positive-bar"
                                : "shap-negative-bar"
                            }
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="shap-direction">
                          {item.direction}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <Clock3 size={15} />
                  Planning Context
                </div>

                <div className="detail-grid">
                  <div>
                    <span>Request date</span>
                    <strong>
                      {formatDate(
                        selectedRequest.request_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {selectedRequest.status}
                    </strong>
                  </div>

                  <div>
                    <span>Scenario</span>
                    <strong>
                      {selectedRequest.scenario.replaceAll(
                        "_",
                        " "
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Cluster candidate</span>
                    <strong>
                      {selectedRequest.is_cluster_candidate
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="controller-note">
                <ShieldCheck size={17} />

                <div>
                  <strong>Decision-support only</strong>

                  <p>
                    The AI score helps prioritize maintenance
                    work. Final planning and operational
                    approval remain with the responsible
                    controller.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="maintenance-no-selection">
              <Factory size={28} />

              <strong>Select a maintenance request</strong>

              <span>
                Choose a request from the work queue to inspect
                its AI priority assessment.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}