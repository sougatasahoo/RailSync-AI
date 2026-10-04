import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Filter,
  MapPin,
  RefreshCw,
  Route,
  Search,
  Users,
  Wrench,
  X,
} from "lucide-react";

type Opportunity = {
  opportunity_id: string;
  section_code: string;
  section_name: string;

  job_1_request_id: string;
  job_1_department: string;
  job_1_defect_type: string;
  job_1_km: number;
  job_1_resource: string;
  job_1_priority_score: number;

  job_2_request_id: string;
  job_2_department: string;
  job_2_defect_type: string;
  job_2_km: number;
  job_2_resource: string;
  job_2_priority_score: number;

  spatial_distance_km: number;
  temporal_compatible: boolean;
  resource_compatible: boolean;

  opportunity_score: number;
  status: string;
};

type OpportunityResponse = {
  status: string;
  count: number;
  opportunities: Opportunity[];
};

type OpportunitySummary = {
  total_opportunities: number;
  status_distribution: Record<string, number>;
  section_distribution: Record<string, number>;
  average_opportunity_score: number;
  highest_opportunity_score: number;
};

type SummaryResponse = {
  status: string;
  summary: OpportunitySummary;
};

const API_BASE = "http://127.0.0.1:8000";

function getScoreClass(score: number) {
  if (score >= 90) {
    return "opportunity-score-critical";
  }

  if (score >= 80) {
    return "opportunity-score-high";
  }

  return "opportunity-score-normal";
}

function getDepartmentClass(department: string) {
  switch (department) {
    case "TMS":
      return "opp-dept-tms";
    case "TDMS":
      return "opp-dept-tdms";
    case "SMMS":
      return "opp-dept-smms";
    default:
      return "";
  }
}

function formatScore(value: number) {
  return Number(value).toFixed(2);
}

function formatDistance(value: number) {
  return Number(value).toFixed(3);
}

export default function JointOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    []
  );

  const [summary, setSummary] =
    useState<OpportunitySummary | null>(null);

  const [section, setSection] = useState("All");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOpportunities() {
    try {
      setLoading(true);
      setError("");

      const [opportunityResponse, summaryResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/opportunities/?limit=100`),
          fetch(`${API_BASE}/api/opportunities/summary`),
        ]);

      if (!opportunityResponse.ok) {
        throw new Error(
          `Opportunity API returned ${opportunityResponse.status}`
        );
      }

      if (!summaryResponse.ok) {
        throw new Error(
          `Opportunity summary API returned ${summaryResponse.status}`
        );
      }

      const opportunityData: OpportunityResponse =
        await opportunityResponse.json();

      const summaryData: SummaryResponse =
        await summaryResponse.json();

      setOpportunities(opportunityData.opportunities);
      setSummary(summaryData.summary);

      if (opportunityData.opportunities.length > 0) {
        setSelectedOpportunity((current) => {
          if (!current) {
            return opportunityData.opportunities[0];
          }

          return (
            opportunityData.opportunities.find(
              (item) =>
                item.opportunity_id ===
                current.opportunity_id
            ) ?? opportunityData.opportunities[0]
          );
        });
      } else {
        setSelectedOpportunity(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load joint opportunities. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  const sectionOptions = useMemo(() => {
    if (!summary) {
      return [];
    }

    return Object.keys(summary.section_distribution);
  }, [summary]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      const matchesSection =
        section === "All" ||
        opportunity.section_code === section;

      const matchesScore =
        scoreFilter === "All" ||
        (scoreFilter === "90+" &&
          opportunity.opportunity_score >= 90) ||
        (scoreFilter === "80+" &&
          opportunity.opportunity_score >= 80) ||
        (scoreFilter === "70+" &&
          opportunity.opportunity_score >= 70);

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        opportunity.opportunity_id
          .toLowerCase()
          .includes(searchText) ||
        opportunity.job_1_request_id
          .toLowerCase()
          .includes(searchText) ||
        opportunity.job_2_request_id
          .toLowerCase()
          .includes(searchText) ||
        opportunity.section_code
          .toLowerCase()
          .includes(searchText) ||
        opportunity.job_1_department
          .toLowerCase()
          .includes(searchText) ||
        opportunity.job_2_department
          .toLowerCase()
          .includes(searchText) ||
        opportunity.job_1_defect_type
          .toLowerCase()
          .includes(searchText) ||
        opportunity.job_2_defect_type
          .toLowerCase()
          .includes(searchText);

      return (
        matchesSection &&
        matchesScore &&
        matchesSearch
      );
    });
  }, [
    opportunities,
    section,
    scoreFilter,
    search,
  ]);

  return (
    <div className="page opportunities-page">
      <div className="page-header opportunities-header">
        <div>
          <div className="eyebrow">
            JOINT WORK DETECTION
          </div>

          <h1>Joint Opportunities</h1>

          <p>
            Detect maintenance jobs that may be coordinated
            within the same maintenance block
          </p>
        </div>

        <div className="opportunities-header-actions">
          <div className="candidate-status">
            <span className="candidate-status-dot" />
            CANDIDATE DETECTION ACTIVE
          </div>

          <button
            className="secondary-button"
            onClick={loadOpportunities}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="opportunity-summary-grid">
          <div className="opportunity-summary-card">
            <div className="opportunity-summary-icon">
              <Route size={18} />
            </div>

            <div>
              <span>JOINT OPPORTUNITIES</span>

              <strong>
                {summary.total_opportunities.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="opportunity-summary-card">
            <div className="opportunity-summary-icon">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <span>AVERAGE SCORE</span>

              <strong>
                {summary.average_opportunity_score.toFixed(
                  2
                )}
              </strong>
            </div>
          </div>

          <div className="opportunity-summary-card">
            <div className="opportunity-summary-icon">
              <AlertTriangle size={18} />
            </div>

            <div>
              <span>HIGHEST SCORE</span>

              <strong>
                {summary.highest_opportunity_score.toFixed(
                  2
                )}
              </strong>
            </div>
          </div>

          <div className="opportunity-summary-card">
            <div className="opportunity-summary-icon">
              <Users size={18} />
            </div>

            <div>
              <span>ACTIVE CANDIDATES</span>

              <strong>
                {(
                  summary.status_distribution.Candidate ?? 0
                ).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="opportunity-method-strip">
        <div className="method-step">
          <span className="method-number">01</span>

          <div>
            <strong>Spatial</strong>
            <span>Location proximity</span>
          </div>
        </div>

        <ChevronRight size={15} />

        <div className="method-step">
          <span className="method-number">02</span>

          <div>
            <strong>Temporal</strong>
            <span>Compatible planning timing</span>
          </div>
        </div>

        <ChevronRight size={15} />

        <div className="method-step">
          <span className="method-number">03</span>

          <div>
            <strong>Resources</strong>
            <span>Compatible work resources</span>
          </div>
        </div>

        <ChevronRight size={15} />

        <div className="method-step">
          <span className="method-number">04</span>

          <div>
            <strong>Optimization</strong>
            <span>CP-SAT final scheduling</span>
          </div>
        </div>
      </div>

      <div className="opportunity-toolbar">
        <div className="opportunity-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search opportunity, request, section..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
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

        <div className="opportunity-filter">
          <Filter size={14} />

          <select
            value={section}
            onChange={(event) =>
              setSection(event.target.value)
            }
          >
            <option value="All">All Sections</option>

            {sectionOptions.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="opportunity-filter">
          <select
            value={scoreFilter}
            onChange={(event) =>
              setScoreFilter(event.target.value)
            }
          >
            <option value="All">All Scores</option>
            <option value="90+">Score 90+</option>
            <option value="80+">Score 80+</option>
            <option value="70+">Score 70+</option>
          </select>
        </div>
      </div>

      <div className="opportunity-layout">
        <section className="opportunity-table-panel">
          <div className="opportunity-panel-header">
            <div>
              <div className="panel-kicker">
                CANDIDATE JOINT WORK
              </div>

              <h2>Opportunity Register</h2>
            </div>

            <div className="opportunity-count">
              Showing {filteredOpportunities.length} candidates
            </div>
          </div>

          {loading ? (
            <div className="opportunity-loading">
              <RefreshCw size={21} className="spin" />

              <span>
                Loading joint opportunity candidates...
              </span>
            </div>
          ) : error ? (
            <div className="opportunity-error">
              <AlertTriangle size={20} />

              <div>
                <strong>
                  Opportunity data unavailable
                </strong>

                <p>{error}</p>
              </div>

              <button
                className="secondary-button"
                onClick={loadOpportunities}
              >
                Retry
              </button>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="opportunity-empty">
              <Search size={22} />

              <strong>
                No matching opportunities
              </strong>

              <span>
                Change the section, score, or search filter.
              </span>
            </div>
          ) : (
            <div className="opportunity-table-wrapper">
              <table className="opportunity-table">
                <thead>
                  <tr>
                    <th>OPPORTUNITY</th>
                    <th>SECTION</th>
                    <th>REQUEST PAIR</th>
                    <th>LOCATION</th>
                    <th>RESOURCES</th>
                    <th>SCORE</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredOpportunities.map(
                    (opportunity) => (
                      <tr
                        key={opportunity.opportunity_id}
                        className={
                          selectedOpportunity?.opportunity_id ===
                          opportunity.opportunity_id
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setSelectedOpportunity(
                            opportunity
                          )
                        }
                      >
                        <td>
                          <div className="opportunity-id-cell">
                            <strong>
                              {opportunity.opportunity_id}
                            </strong>

                            <span>
                              Candidate joint work
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="opportunity-section-cell">
                            <strong>
                              {opportunity.section_code}
                            </strong>

                            <span>
                              {opportunity.section_name}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="request-pair-cell">
                            <div>
                              <span
                                className={`opp-dept ${getDepartmentClass(
                                  opportunity.job_1_department
                                )}`}
                              >
                                {opportunity.job_1_department}
                              </span>

                              <strong>
                                {opportunity.job_1_request_id}
                              </strong>
                            </div>

                            <div>
                              <span
                                className={`opp-dept ${getDepartmentClass(
                                  opportunity.job_2_department
                                )}`}
                              >
                                {opportunity.job_2_department}
                              </span>

                              <strong>
                                {opportunity.job_2_request_id}
                              </strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="distance-cell">
                            <strong>
                              {formatDistance(
                                opportunity.spatial_distance_km
                              )}{" "}
                              km
                            </strong>

                            <span>
                              {opportunity.job_1_km.toFixed(1)}{" "}
                              ↔{" "}
                              {opportunity.job_2_km.toFixed(
                                1
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="resource-cell">
                            <span>
                              {opportunity.job_1_resource}
                            </span>

                            <span>
                              {opportunity.job_2_resource}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`opportunity-score ${getScoreClass(
                              opportunity.opportunity_score
                            )}`}
                          >
                            {formatScore(
                              opportunity.opportunity_score
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="candidate-badge">
                            {opportunity.status}
                          </span>
                        </td>

                        <td>
                          <ChevronRight
                            size={15}
                            className="row-chevron"
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="opportunity-detail-panel">
          {selectedOpportunity ? (
            <>
              <div className="opportunity-detail-header">
                <div>
                  <div className="panel-kicker">
                    OPPORTUNITY DETAIL
                  </div>

                  <h2>
                    {selectedOpportunity.opportunity_id}
                  </h2>

                  <span className="detail-subtitle">
                    {selectedOpportunity.section_code} ·{" "}
                    {selectedOpportunity.section_name}
                  </span>
                </div>

                <span
                  className={`opportunity-score ${getScoreClass(
                    selectedOpportunity.opportunity_score
                  )}`}
                >
                  {formatScore(
                    selectedOpportunity.opportunity_score
                  )}
                </span>
              </div>

              <div className="opportunity-detail-section">
                <div className="detail-section-title">
                  <MapPin size={15} />
                  Spatial Compatibility
                </div>

                <div className="compatibility-box">
                  <div className="compatibility-main">
                    <strong>
                      {formatDistance(
                        selectedOpportunity.spatial_distance_km
                      )}{" "}
                      km
                    </strong>

                    <span>
                      Detected location distance
                    </span>
                  </div>

                  {selectedOpportunity.spatial_distance_km <=
                  1 ? (
                    <div className="compatibility-pass">
                      <CheckCircle2 size={17} />
                      Compatible
                    </div>
                  ) : (
                    <div className="compatibility-fail">
                      <AlertTriangle size={17} />
                      Outside threshold
                    </div>
                  )}
                </div>

                <div className="location-pair">
                  <div>
                    <span>
                      {selectedOpportunity.job_1_request_id}
                    </span>

                    <strong>
                      {selectedOpportunity.job_1_km.toFixed(
                        3
                      )}{" "}
                      km
                    </strong>
                  </div>

                  <div className="location-line" />

                  <div>
                    <span>
                      {selectedOpportunity.job_2_request_id}
                    </span>

                    <strong>
                      {selectedOpportunity.job_2_km.toFixed(
                        3
                      )}{" "}
                      km
                    </strong>
                  </div>
                </div>
              </div>

              <div className="opportunity-detail-section">
                <div className="detail-section-title">
                  <CalendarCheck2 size={15} />
                  Temporal Compatibility
                </div>

                <div className="compatibility-box">
                  <div className="compatibility-main">
                    <strong>
                      {selectedOpportunity.temporal_compatible
                        ? "Compatible"
                        : "Not compatible"}
                    </strong>

                    <span>
                      Determined by the opportunity detector
                    </span>
                  </div>

                  {selectedOpportunity.temporal_compatible ? (
                    <div className="compatibility-pass">
                      <CheckCircle2 size={17} />
                      Compatible
                    </div>
                  ) : (
                    <div className="compatibility-fail">
                      <AlertTriangle size={17} />
                      Not compatible
                    </div>
                  )}
                </div>
              </div>

              <div className="opportunity-detail-section">
                <div className="detail-section-title">
                  <Wrench size={15} />
                  Resource Compatibility
                </div>

                <div className="resource-pair">
                  <div>
                    <span>
                      {selectedOpportunity.job_1_department}
                    </span>

                    <strong>
                      {selectedOpportunity.job_1_resource}
                    </strong>
                  </div>

                  <div className="resource-plus">+</div>

                  <div>
                    <span>
                      {selectedOpportunity.job_2_department}
                    </span>

                    <strong>
                      {selectedOpportunity.job_2_resource}
                    </strong>
                  </div>
                </div>

                {selectedOpportunity.resource_compatible ? (
                  <div className="resource-compatible">
                    <CheckCircle2 size={15} />
                    Resources are compatible for candidate
                    joint planning
                  </div>
                ) : (
                  <div className="resource-incompatible">
                    <AlertTriangle size={15} />
                    Resource combination requires review
                  </div>
                )}
              </div>

              <div className="opportunity-detail-section">
                <div className="detail-section-title">
                  <Route size={15} />
                  Opportunity Score
                </div>

                <div className="score-breakdown">
                  <div>
                    <span>Spatial fit</span>
                    <strong>40%</strong>
                  </div>

                  <div>
                    <span>Temporal fit</span>
                    <strong>25%</strong>
                  </div>

                  <div>
                    <span>ML priority</span>
                    <strong>35%</strong>
                  </div>
                </div>

                <div className="job-priority-pair">
                  <div>
                    <span>
                      {selectedOpportunity.job_1_request_id}
                    </span>

                    <strong>
                      {formatScore(
                        selectedOpportunity.job_1_priority_score
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {selectedOpportunity.job_2_request_id}
                    </span>

                    <strong>
                      {formatScore(
                        selectedOpportunity.job_2_priority_score
                      )}
                    </strong>
                  </div>
                </div>

                <div className="opportunity-score-large">
                  <span>COMBINED OPPORTUNITY SCORE</span>

                  <strong>
                    {formatScore(
                      selectedOpportunity.opportunity_score
                    )}
                  </strong>
                </div>
              </div>

              <div className="opportunity-controller-note">
                <AlertTriangle size={16} />

                <div>
                  <strong>
                    Candidate — not yet optimized
                  </strong>

                  <p>
                    The detector identifies a potentially
                    useful joint-work combination. OR-Tools
                    CP-SAT performs the final feasibility and
                    scheduling decision.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="opportunity-no-selection">
              <Route size={28} />

              <strong>
                Select a joint opportunity
              </strong>

              <span>
                Choose a candidate from the register to inspect
                its compatibility analysis.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}