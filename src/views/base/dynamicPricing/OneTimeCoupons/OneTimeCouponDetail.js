import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import {
  TfiArrowLeft,
  TfiPencilAlt,
  TfiTrash,
  TfiAlert,
  TfiTicket,
} from "react-icons/tfi";
import configWeb from "../../../../components/config.js/ConfigWeb";
import {
  simpleDeleteCallAuth,
  simpleGetCallAuth,
} from "../../../../components/config.js/Setup";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/notify/notify";
import { computeCouponState } from "./OneTimeCouponList";
import "./oneTimeCoupons.css";

const renderScopeWithNames = (scope, lookup) => {
  if (!scope) return "—";
  if (scope.all) return <span className="otc-chip otc-chip-all">All</span>;
  if (!scope.ids?.length) return "—";
  return (
    <div className="otc-chip-row">
      {scope.ids.map((id) => {
        const name = lookup?.[id];
        return (
          <span key={id} className="otc-chip" title={name ? `ID: ${id}` : undefined}>
            {name || `#${id}`}
          </span>
        );
      })}
    </div>
  );
};

const OneTimeCouponDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState(null);
  const [showDel, setShowDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cities, setCities] = useState([]);
  const [cars, setCars] = useState([]);
  const [groups, setGroups] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    simpleGetCallAuth(`${configWeb.GET_CITIES}?page_size=9999`)
      .then((r) => setCities(r?.data || []))
      .catch(() => {});
    simpleGetCallAuth(`${configWeb.GET_CAR}?page_size=9999`)
      .then((r) => setCars(r?.data || []))
      .catch(() => {});
    simpleGetCallAuth(`${configWeb.GET_CAR_GROUPS}?page_size=9999`)
      .then((r) => setGroups(r?.data || []))
      .catch(() => {});
    simpleGetCallAuth(configWeb.GET_LOCATIONS)
      .then((r) => setLocations(r?.data || []))
      .catch(() => {});
  }, []);

  const buildLookup = (arr, nameKey = "name") => {
    const map = {};
    (arr || []).forEach((it) => {
      map[it.id] =
        it[nameKey] ||
        it.name ||
        it.title ||
        it.code ||
        it.plate_number ||
        `#${it.id}`;
    });
    return map;
  };
  const cityLookup = useMemo(() => buildLookup(cities), [cities]);
  const carLookup = useMemo(() => buildLookup(cars), [cars]);
  const groupLookup = useMemo(() => buildLookup(groups), [groups]);
  const locationLookup = useMemo(() => buildLookup(locations), [locations]);

  const isRegular = coupon && (coupon.usage_limit === null || coupon.usage_limit === undefined);

  useEffect(() => {
    setLoading(true);
    simpleGetCallAuth(configWeb.GET_ONE_TIME_COUPON_DETAILS(id))
      .then((res) => {
        if (!res || res?.error) {
          notifyError("Could not load coupon");
          setCoupon(null);
        } else {
          setCoupon(res);
        }
      })
      .catch(() => notifyError("Could not load coupon"))
      .finally(() => setLoading(false));
  }, [id]);

  const state = useMemo(() => computeCouponState(coupon), [coupon]);

  const onDelete = () => {
    setDeleting(true);
    simpleDeleteCallAuth(configWeb.DELETE_ONE_TIME_COUPON(id))
      .then((res) => {
        if (res?.status === "success") {
          notifySuccess("Coupon deleted");
          navigate("/admin/one-time-coupons");
        } else {
          notifyError(
            (Array.isArray(res?.message) ? res?.message[0] : res?.message) ||
              "Delete failed"
          );
        }
      })
      .catch(() => notifyError("Delete failed"))
      .finally(() => setDeleting(false));
  };

  return (
    <div className="otc-page">
      <div className="otc-hero">
        <div className="otc-hero-inner">
          <div>
            <span className="otc-hero-pill">
              <TfiTicket /> Coupon detail
            </span>
            <h1>
              {coupon ? (
                <>
                  Coupon{" "}
                  <span className="otc-hero-accent">{coupon.code || `#${id}`}</span>
                </>
              ) : (
                "Coupon detail"
              )}
            </h1>
            <p>Read-only summary, with quick edit & delete actions.</p>
          </div>
          <div className="otc-hero-actions">
            <Link to="/admin/one-time-coupons" className="otc-btn otc-btn-ghost">
              <TfiArrowLeft /> Back
            </Link>
            <button
              type="button"
              className="otc-btn otc-btn-primary"
              disabled={!coupon || isRegular}
              onClick={() => navigate(`/admin/one-time-coupons/${id}/edit`)}
            >
              <TfiPencilAlt /> Edit
            </button>
            <button
              type="button"
              className="otc-btn otc-btn-danger"
              disabled={!coupon || isRegular}
              onClick={() => setShowDel(true)}
            >
              <TfiTrash /> Delete
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="otc-card">
          <div className="otc-loader">
            <Spinner animation="border" /> Loading…
          </div>
        </div>
      ) : !coupon ? (
        <div className="otc-card">
          <div className="otc-empty">
            <h3>Coupon not found</h3>
          </div>
        </div>
      ) : (
        <>
          {isRegular && (
            <div className="otc-warning">
              <TfiAlert size={20} />
              <div>
                <strong>This coupon belongs to the regular Discount Coupons section.</strong>
                <div>
                  It does not have a usage limit, so editing and deleting it from
                  the One-Time Coupons module is disabled.
                </div>
              </div>
            </div>
          )}

          <div className="otc-detail-grid">
            <div>
              <div className="otc-card otc-section">
                <div className="otc-card-header">
                  <div>
                    <p className="otc-card-title">Coupon</p>
                    <p className="otc-card-sub">Identification & status</p>
                  </div>
                  <span className={`otc-badge ${state.tone}`}>
                    <span className="otc-badge-dot" />
                    {state.label}
                  </span>
                </div>
                <div className="otc-card-body">
                  <dl className="otc-kv">
                    <dt>Code</dt>
                    <dd><span className="otc-code">{coupon.code}</span></dd>
                    <dt>Type</dt>
                    <dd style={{ textTransform: "capitalize" }}>{coupon.type}</dd>
                    <dt>Discount type</dt>
                    <dd style={{ textTransform: "capitalize" }}>{coupon.discount_type}</dd>
                    <dt>Status</dt>
                    <dd>{Number(coupon.status) === 1 ? "Active" : "Inactive"}</dd>
                  </dl>
                </div>
              </div>

              <div className="otc-card otc-section">
                <div className="otc-card-header">
                  <div>
                    <p className="otc-card-title">Validity</p>
                    <p className="otc-card-sub">Redemption window</p>
                  </div>
                </div>
                <div className="otc-card-body">
                  <dl className="otc-kv">
                    <dt>Start date</dt>
                    <dd>{coupon.start_date || coupon.valid_from || "—"}</dd>
                    <dt>End date</dt>
                    <dd>{coupon.end_date || coupon.valid_to || "—"}</dd>
                  </dl>
                </div>
              </div>

              <div className="otc-card otc-section">
                <div className="otc-card-header">
                  <div>
                    <p className="otc-card-title">Discount rates</p>
                    <p className="otc-card-sub">
                      {coupon.discount_type === "percentage"
                        ? "Percentages"
                        : "Fixed amounts"}
                    </p>
                  </div>
                </div>
                <div className="otc-card-body">
                  <dl className="otc-kv">
                    <dt>Rate</dt>
                    <dd>{coupon.rate ?? coupon.discount_value ?? 0}</dd>
                    <dt>CDW</dt>
                    <dd>{coupon.cdw}</dd>
                    <dt>SCDW</dt>
                    <dd>{coupon.scdw}</dd>
                    <dt>PAI</dt>
                    <dd>{coupon.pai}</dd>
                    <dt>GPS</dt>
                    <dd>{coupon.gps}</dd>
                    <dt>Driver</dt>
                    <dd>{coupon.driver}</dd>
                    <dt>Baby seat</dt>
                    <dd>{coupon.baby_seat}</dd>
                  </dl>
                </div>
              </div>

              <div className="otc-card otc-section">
                <div className="otc-card-header">
                  <div>
                    <p className="otc-card-title">Scope</p>
                    <p className="otc-card-sub">Where this coupon applies</p>
                  </div>
                </div>
                <div className="otc-card-body">
                  <dl className="otc-kv">
                    <dt>Cars</dt>
                    <dd>{renderScopeWithNames(coupon.car_ids, carLookup)}</dd>
                    <dt>Cities</dt>
                    <dd>{renderScopeWithNames(coupon.city_ids, cityLookup)}</dd>
                    <dt>Groups</dt>
                    <dd>{renderScopeWithNames(coupon.group_ids, groupLookup)}</dd>
                    <dt>Locations</dt>
                    <dd>{renderScopeWithNames(coupon.location_ids, locationLookup)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div>
              <div className="otc-card otc-section">
                <div className="otc-card-header">
                  <div>
                    <p className="otc-card-title">Redemption</p>
                    <p className="otc-card-sub">Single-use accounting</p>
                  </div>
                </div>
                <div className="otc-card-body">
                  {(() => {
                    const limit = Number(coupon.usage_limit ?? 0);
                    const used = Number(coupon.usage_count ?? 0);
                    const remaining = Math.max(limit - used, 0);
                    const pct =
                      limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                    const tone = pct >= 100 ? "full" : pct >= 70 ? "warn" : "";
                    return (
                      <>
                        <dl className="otc-kv">
                          <dt>Usage limit</dt>
                          <dd>{coupon.usage_limit ?? "—"}</dd>
                          <dt>Used so far</dt>
                          <dd>{used}</dd>
                          <dt>Remaining</dt>
                          <dd>{remaining}</dd>
                          <dt>State</dt>
                          <dd>
                            <span className={`otc-badge ${state.tone}`}>
                              <span className="otc-badge-dot" />
                              {state.label}
                            </span>
                          </dd>
                        </dl>
                        {coupon.usage_limit != null && (
                          <div className="otc-usage" style={{ marginTop: 14 }}>
                            <div className={`otc-usage-bar ${tone}`}>
                              <span style={{ width: `${pct}%` }} />
                            </div>
                            <span className="otc-usage-text">
                              {used}/{limit}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {coupon.note && (
                <div className="otc-card otc-section">
                  <div className="otc-card-header">
                    <div>
                      <p className="otc-card-title">Note</p>
                    </div>
                  </div>
                  <div className="otc-card-body">
                    <p style={{ margin: 0, color: "#334155" }}>{coupon.note}</p>
                  </div>
                </div>
              )}

              <div className="otc-card otc-section">
                <div className="otc-card-header">
                  <div>
                    <p className="otc-card-title">Audit</p>
                  </div>
                </div>
                <div className="otc-card-body">
                  <dl className="otc-kv">
                    <dt>Created by</dt>
                    <dd>{coupon.created_by ?? "—"}</dd>
                    <dt>Created at</dt>
                    <dd>{coupon.created_at ?? "—"}</dd>
                    <dt>Updated by</dt>
                    <dd>{coupon.updated_by ?? "—"}</dd>
                    <dt>Updated at</dt>
                    <dd>{coupon.updated_at ?? "—"}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal show={showDel} onHide={() => setShowDel(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete coupon?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action cannot be undone. The coupon will be soft-deleted and no
          longer available for redemption.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDel(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : <TfiTrash />} Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OneTimeCouponDetail;
