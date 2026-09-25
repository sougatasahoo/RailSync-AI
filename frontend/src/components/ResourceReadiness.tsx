import "./ResourceReadiness.css";
import { useEffect, useMemo, useState } from "react";

type ResourceStatus = "Ready" | "Limited" | "Unavailable";

type Resource = {
  resource_id: string;
  name: string;
  department?: string;
  skill?: string;
  location?: string;
  machine_type?: string;
  category?: string;
  availability_date?: string;
  availability_status?: string;
  max_daily_hours?: number;
  assigned_hours?: number;
  remaining_hours?: number;
  maintenance_due_date?: string;
  available_quantity?: number;
  reserved_quantity?: number;
  usable_quantity?: number;
  reorder_level?: number;
  last_updated?: string;
  readiness_status: ResourceStatus;
};

type ResourceReadinessResponse = {
  status: string;
  overall_readiness: number;
  summary: {
    total_resources: number;
    ready_resources: number;
    limited_resources: number;
    unavailable_resources: number;
  };
  manpower: {
    total: number;
    ready: number;
    limited: number;
    unavailable: number;
    resources: Resource[];
  };
  machines: {
    total: number;
    ready: number;
    limited: number;
    unavailable: number;
    resources: Resource[];
  };
  materials: {
    total: number;
    ready: number;
    limited: number;
    unavailable: number;
    resources: Resource[];
  };
};

type ResourceReadinessProps = {
  onNavigate: (page: string) => void;
};

type FilterType = "All" | "Manpower" | "Machine" | "Material";
type FilterStatus = "All" | ResourceStatus;

const API_BASE = "http://127.0.0.1:8000";

function statusClass(status: ResourceStatus) {
  if (status === "Ready") {
    return "resource-status resource-status-ready";
  }

  if (status === "Limited") {
    return "resource-status resource-status-limited";
  }

  return "resource-status resource-status-unavailable";
}

function statusDot(status: ResourceStatus) {
  if (status === "Ready") {
    return "resource-dot resource-dot-ready";
  }

  if (status === "Limited") {
    return "resource-dot resource-dot-limited";
  }

  return "resource-dot resource-dot-unavailable";
}

function formatDate(value?: string) {
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

function formatNumber(value?: number) {
  if (value === undefined || value === null) {
    return "—";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}

function resourceType(resource: Resource): FilterType {
  if (resource.department || resource.skill) {
    return "Manpower";
  }

  if (resource.machine_type) {
    return "Machine";
  }

  return "Material";
}

export default function ResourceReadiness({
  onNavigate,
}: ResourceReadinessProps) {
  const [data, setData] = useState<ResourceReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("All");
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("All");
  const [selectedResource, setSelectedResource] =
    useState<Resource | null>(null);

  const loadReadiness = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE}/api/resources/readiness`,
      );

      if (!response.ok) {
        throw new Error(
          `Resource readiness request failed: ${response.status}`,
        );
      }

      const result =
        (await response.json()) as ResourceReadinessResponse;

      setData(result);

      if (!selectedResource) {
        const firstResource =
          result.manpower.resources[0] ??
          result.machines.resources[0] ??
          result.materials.resources[0];

        setSelectedResource(firstResource ?? null);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load resource readiness.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();

    const interval = window.setInterval(
      loadReadiness,
      30000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const allResources = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      ...data.manpower.resources,
      ...data.machines.resources,
      ...data.materials.resources,
    ];
  }, [data]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return allResources.filter((resource) => {
      const type = resourceType(resource);

      const matchesType =
        typeFilter === "All" ||
        type === typeFilter;

      const matchesStatus =
        statusFilter === "All" ||
        resource.readiness_status === statusFilter;

      const searchableText = [
        resource.resource_id,
        resource.name,
        resource.department,
        resource.skill,
        resource.location,
        resource.machine_type,
        resource.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return (
        matchesType &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    allResources,
    search,
    typeFilter,
    statusFilter,
  ]);

  const readiness = data?.overall_readiness ?? 0;
  const totalResources =
    data?.summary.total_resources ?? 0;
  const readyResources =
    data?.summary.ready_resources ?? 0;
  const limitedResources =
    data?.summary.limited_resources ?? 0;
  const unavailableResources =
    data?.summary.unavailable_resources ?? 0;

  const readinessMessage =
    readiness >= 90
      ? "Resource availability is currently strong."
      : readiness >= 75
        ? "Most resources are available, with some constraints."
        : "Resource constraints require operational attention.";

  return (
    <section className="module-page resource-readiness-page">
      <div className="module-page-header">
        <div>
          <div className="eyebrow">
            RESOURCE & READINESS
          </div>

          <h1>Resource Readiness</h1>

          <p>
            Monitor manpower, machines and materials
            required for upcoming railway work.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action"
          onClick={() => onNavigate("Block Planning")}
        >
          ← Back to Block Planning
        </button>
      </div>

      {loading && !data ? (
        <div className="resource-loading-card">
          <div className="resource-loading-title">
            Loading resource readiness…
          </div>

          <div className="resource-loading-text">
            Reading current manpower, machine and
            material availability from the backend.
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="resource-error-card">
          <div>
            <strong>Unable to load live resource data.</strong>
            <span>{error}</span>
          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={loadReadiness}
          >
            Retry
          </button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="resource-kpi-grid">
            <div className="resource-kpi-card resource-kpi-primary">
              <div className="resource-kpi-label">
                Overall Readiness
              </div>

              <div className="resource-kpi-value">
                {readiness.toFixed(1)}%
              </div>

              <div className="resource-progress">
                <div
                  className="resource-progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, readiness),
                    )}%`,
                  }}
                />
              </div>

              <div className="resource-kpi-note">
                {readinessMessage}
              </div>
            </div>

            <div className="resource-kpi-card">
              <div className="resource-kpi-label">
                Total Resources
              </div>

              <div className="resource-kpi-value">
                {totalResources}
              </div>

              <div className="resource-kpi-note">
                Across manpower, machines and materials
              </div>
            </div>

            <div className="resource-kpi-card">
              <div className="resource-kpi-label">
                Ready
              </div>

              <div className="resource-kpi-value resource-value-ready">
                {readyResources}
              </div>

              <div className="resource-kpi-note">
                Available for planned work
              </div>
            </div>

            <div className="resource-kpi-card">
              <div className="resource-kpi-label">
                Limited
              </div>

              <div className="resource-kpi-value resource-value-limited">
                {limitedResources}
              </div>

              <div className="resource-kpi-note">
                Requires planning attention
              </div>
            </div>

            <div className="resource-kpi-card">
              <div className="resource-kpi-label">
                Unavailable
              </div>

              <div className="resource-kpi-value resource-value-unavailable">
                {unavailableResources}
              </div>

              <div className="resource-kpi-note">
                Currently unavailable
              </div>
            </div>
          </div>

          <div className="resource-attention-banner">
            <div className="resource-attention-icon">
              !
            </div>

            <div>
              <strong>
                Resource constraints detected
              </strong>

              <p>
                {limitedResources} resources are limited
                and {unavailableResources} are currently
                unavailable. Review these constraints
                before final block approval.
              </p>
            </div>
          </div>

          <div className="resource-category-grid">
            <div className="resource-category-card">
              <div className="resource-category-header">
                <div>
                  <div className="resource-category-title">
                    Manpower
                  </div>

                  <div className="resource-category-subtitle">
                    HRMS readiness
                  </div>
                </div>

                <div className="resource-category-number">
                  {data.manpower.ready}/
                  {data.manpower.total}
                </div>
              </div>

              <div className="resource-category-stats">
                <span>
                  <b>{data.manpower.ready}</b> Ready
                </span>

                <span>
                  <b>{data.manpower.limited}</b> Limited
                </span>

                <span>
                  <b>{data.manpower.unavailable}</b>{" "}
                  Unavailable
                </span>
              </div>
            </div>

            <div className="resource-category-card">
              <div className="resource-category-header">
                <div>
                  <div className="resource-category-title">
                    Machines
                  </div>

                  <div className="resource-category-subtitle">
                    TMMMS readiness
                  </div>
                </div>

                <div className="resource-category-number">
                  {data.machines.ready}/
                  {data.machines.total}
                </div>
              </div>

              <div className="resource-category-stats">
                <span>
                  <b>{data.machines.ready}</b> Ready
                </span>

                <span>
                  <b>{data.machines.limited}</b> Limited
                </span>

                <span>
                  <b>{data.machines.unavailable}</b>{" "}
                  Unavailable
                </span>
              </div>
            </div>

            <div className="resource-category-card">
              <div className="resource-category-header">
                <div>
                  <div className="resource-category-title">
                    Materials
                  </div>

                  <div className="resource-category-subtitle">
                    Stores readiness
                  </div>
                </div>

                <div className="resource-category-number">
                  {data.materials.ready}/
                  {data.materials.total}
                </div>
              </div>

              <div className="resource-category-stats">
                <span>
                  <b>{data.materials.ready}</b> Ready
                </span>

                <span>
                  <b>{data.materials.limited}</b> Limited
                </span>

                <span>
                  <b>{data.materials.unavailable}</b>{" "}
                  Unavailable
                </span>
              </div>
            </div>
          </div>

          <div className="resource-section-card">
            <div className="resource-section-header">
              <div>
                <div className="eyebrow">
                  RESOURCE INVENTORY
                </div>

                <h2>Current Resource Availability</h2>

                <p>
                  Live readiness information from
                  HRMS, TMMMS and Stores data.
                </p>
              </div>

              <div className="resource-live-indicator">
                <span className="resource-live-dot" />
                Live
              </div>
            </div>

            <div className="resource-filter-row">
              <div className="resource-search">
                <input
                  type="text"
                  placeholder="Search resource, skill, location…"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as FilterType,
                  )
                }
              >
                <option value="All">
                  All Types
                </option>
                <option value="Manpower">
                  Manpower
                </option>
                <option value="Machine">
                  Machines
                </option>
                <option value="Material">
                  Materials
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as FilterStatus,
                  )
                }
              >
                <option value="All">
                  All Status
                </option>
                <option value="Ready">
                  Ready
                </option>
                <option value="Limited">
                  Limited
                </option>
                <option value="Unavailable">
                  Unavailable
                </option>
              </select>
            </div>

            <div className="resource-content-grid">
              <div className="resource-list">
                {filteredResources.length === 0 ? (
                  <div className="resource-empty">
                    No resources match the selected filters.
                  </div>
                ) : (
                  filteredResources.map((resource) => {
                    const type =
                      resourceType(resource);

                    const selected =
                      selectedResource?.resource_id ===
                      resource.resource_id;

                    return (
                      <button
                        type="button"
                        key={`${type}-${resource.resource_id}`}
                        className={`resource-list-item ${
                          selected
                            ? "resource-list-item-selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedResource(resource)
                        }
                      >
                        <div className="resource-list-main">
                          <div className="resource-list-title">
                            {resource.name ||
                              resource.resource_id}
                          </div>

                          <div className="resource-list-meta">
                            <span>
                              {type}
                            </span>

                            {resource.location ? (
                              <span>
                                {resource.location}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div
                          className={statusClass(
                            resource.readiness_status,
                          )}
                        >
                          <span
                            className={statusDot(
                              resource.readiness_status,
                            )}
                          />

                          {
                            resource.readiness_status
                          }
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="resource-detail-panel">
                {selectedResource ? (
                  <>
                    <div className="resource-detail-top">
                      <div>
                        <div className="eyebrow">
                          RESOURCE DETAILS
                        </div>

                        <h3>
                          {selectedResource.name ||
                            selectedResource.resource_id}
                        </h3>

                        <div className="resource-detail-id">
                          {selectedResource.resource_id}
                        </div>
                      </div>

                      <div
                        className={statusClass(
                          selectedResource.readiness_status,
                        )}
                      >
                        <span
                          className={statusDot(
                            selectedResource.readiness_status,
                          )}
                        />

                        {
                          selectedResource.readiness_status
                        }
                      </div>
                    </div>

                    <div className="resource-detail-grid">
                      <div>
                        <span>Type</span>
                        <strong>
                          {resourceType(
                            selectedResource,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Location</span>
                        <strong>
                          {selectedResource.location ||
                            "—"}
                        </strong>
                      </div>

                      {selectedResource.department ? (
                        <div>
                          <span>Department</span>
                          <strong>
                            {
                              selectedResource.department
                            }
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.skill ? (
                        <div>
                          <span>Skill</span>
                          <strong>
                            {selectedResource.skill}
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.machine_type ? (
                        <div>
                          <span>Machine Type</span>
                          <strong>
                            {
                              selectedResource.machine_type
                            }
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.category ? (
                        <div>
                          <span>Category</span>
                          <strong>
                            {
                              selectedResource.category
                            }
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.max_daily_hours !==
                      undefined ? (
                        <div>
                          <span>Daily Capacity</span>
                          <strong>
                            {formatNumber(
                              selectedResource.max_daily_hours,
                            )}{" "}
                            hr
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.assigned_hours !==
                      undefined ? (
                        <div>
                          <span>Assigned</span>
                          <strong>
                            {formatNumber(
                              selectedResource.assigned_hours,
                            )}{" "}
                            hr
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.remaining_hours !==
                      undefined ? (
                        <div>
                          <span>Remaining</span>
                          <strong>
                            {formatNumber(
                              selectedResource.remaining_hours,
                            )}{" "}
                            hr
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.available_quantity !==
                      undefined ? (
                        <div>
                          <span>Available Quantity</span>
                          <strong>
                            {formatNumber(
                              selectedResource.available_quantity,
                            )}
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.reserved_quantity !==
                      undefined ? (
                        <div>
                          <span>Reserved</span>
                          <strong>
                            {formatNumber(
                              selectedResource.reserved_quantity,
                            )}
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.usable_quantity !==
                      undefined ? (
                        <div>
                          <span>Usable Quantity</span>
                          <strong>
                            {formatNumber(
                              selectedResource.usable_quantity,
                            )}
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.reorder_level !==
                      undefined ? (
                        <div>
                          <span>Reorder Level</span>
                          <strong>
                            {formatNumber(
                              selectedResource.reorder_level,
                            )}
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.availability_date ? (
                        <div>
                          <span>Availability Date</span>
                          <strong>
                            {formatDate(
                              selectedResource.availability_date,
                            )}
                          </strong>
                        </div>
                      ) : null}

                      {selectedResource.maintenance_due_date ? (
                        <div>
                          <span>Maintenance Due</span>
                          <strong>
                            {formatDate(
                              selectedResource.maintenance_due_date,
                            )}
                          </strong>
                        </div>
                      ) : null}
                    </div>

                    {selectedResource.readiness_status !==
                    "Ready" ? (
                      <div className="resource-detail-warning">
                        <strong>
                          Planning attention required
                        </strong>

                        <p>
                          This resource may constrain
                          block execution and should be
                          reviewed before final approval.
                        </p>
                      </div>
                    ) : (
                      <div className="resource-detail-ready">
                        <strong>
                          Resource available
                        </strong>

                        <p>
                          Current readiness data indicates
                          this resource can support planned
                          operations.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="resource-empty">
                    Select a resource to view details.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="resource-prototype-note">
            <strong>Prototype data integration:</strong>{" "}
            Readiness is now calculated from the synthetic
            HRMS, TMMMS and Stores datasets through the
            RailSync AI backend. The datasets are modeled
            on railway operational scenarios and are not
            live railway-system data.
          </div>
        </>
      ) : null}
    </section>
  );
}