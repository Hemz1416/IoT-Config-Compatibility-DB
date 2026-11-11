"use client";

import React, { useState, useEffect } from "react";

type TabType = "compatibility" | "vector" | "catalog" | "analytics" | "database";
type RoleType = "Hardware Admin" | "Embedded Engineer";

export default function IoTPortalPage() {
  const [activeTab, setActiveTab] = useState<TabType>("compatibility");
  const [role, setRole] = useState<RoleType>("Hardware Admin");
  const [activeSql, setActiveSql] = useState<string>("");
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data states
  const [devices, setDevices] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [compatibility, setCompatibility] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [havingResults, setHavingResults] = useState<any[]>([]);
  const [correlatedResults, setCorrelatedResults] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [hybridAnalysis, setHybridAnalysis] = useState<any | null>(null);
  const [queryVectorPreview, setQueryVectorPreview] = useState<string>("");

  // Backend Database Explorer state
  const [dbCatalog, setDbCatalog] = useState<any | null>(null);
  const [selectedDbMode, setSelectedDbMode] = useState<"tables" | "views">("tables");
  const [selectedTableName, setSelectedTableName] = useState<string>("devices");
  const [selectedViewName, setSelectedViewName] = useState<string>(
    "v_device_compatibility_overview"
  );

  // Filters & Forms
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [vectorQuery, setVectorQuery] = useState<string>(
    "Is MPU-6050 compatible with ESP32"
  );
  const [triggerAuditLog, setTriggerAuditLog] = useState<{
    noteId: number;
    prev: string;
    next: string;
    trigger: string;
  } | null>(null);

  // New Device Form
  const [newDevModel, setNewDevModel] = useState("TEMP-TEST-PROTOTYPE-V1");
  const [newDevMcu, setNewDevMcu] = useState("ESP32-C6 RISC-V SoC");
  const [newDevOpV, setNewDevOpV] = useState("3.30");
  const [newDevLogV, setNewDevLogV] = useState("3.30");
  const [newDevClock, setNewDevClock] = useState("160");
  const [newDevFlash, setNewDevFlash] = useState("4096");

  // New Compatibility Evaluation Form
  const [evalDeviceId, setEvalDeviceId] = useState("1");
  const [evalComponentId, setEvalComponentId] = useState("3");
  const [evalNotes, setEvalNotes] = useState(
    "Bench verified SSD1306 OLED on I2C bus (GPIO21/GPIO22) at 3.3V."
  );

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    const [devRes, compRes, notesRes, dbRes] = await Promise.all([
      fetch("/api/devices").then((r) => r.json()),
      fetch("/api/compatibility").then((r) => r.json()),
      fetch(`/api/notes?q=${encodeURIComponent(vectorQuery)}&anchor=1`).then((r) =>
        r.json()
      ),
      fetch("/api/database").then((r) => r.json()),
    ]);
    setDevices(devRes.devices || []);
    setComponents(devRes.components || []);
    setCompatibility(compRes.compatibility || []);
    setStatusBreakdown(compRes.statusBreakdown || []);
    setHavingResults(compRes.havingResults || []);
    setCorrelatedResults(compRes.correlatedResults || []);
    setNotes(notesRes.notes || []);
    setHybridAnalysis(notesRes.hybridAnalysis || null);
    setQueryVectorPreview(notesRes.queryVectorPreview || "");
    setDbCatalog(dbRes);
    setActiveSql(compRes.sql || "");
  }

  async function refreshDbCatalog() {
    const dbRes = await fetch("/api/database").then((r) => r.json());
    setDbCatalog(dbRes);
  }

  async function runVectorSearchWithQuery(qText: string) {
    setVectorQuery(qText);
    const res = await fetch(
      `/api/notes?q=${encodeURIComponent(qText)}&anchor=1`
    ).then((r) => r.json());
    setNotes(res.notes || []);
    setHybridAnalysis(res.hybridAnalysis || null);
    setQueryVectorPreview(res.queryVectorPreview || "");
    setActiveSql(res.sql || "");
    setBannerMsg(
      `Executed 384-d pgvector HNSW cosine distance (<=>) search + Hybrid SQL lookup for "${qText}".`
    );
  }

  async function handleVectorSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    await runVectorSearchWithQuery(vectorQuery);
  }

  async function handleTriggerUpdate(noteId: number) {
    setErrorMsg(null);
    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note_id: noteId,
        append_text: " [Bench verified with ESP32-WROOM-32 hardware].",
      }),
    }).then((r) => r.json());

    if (res.success) {
      setNotes(res.notes);
      setActiveSql(res.sql);
      setTriggerAuditLog({
        noteId,
        prev: res.previousUpdatedAt,
        next: res.newUpdatedAt,
        trigger: res.triggerFired,
      });
      setBannerMsg(
        `UPDATE configuration_notes (note_id=${noteId}) succeeded — Trigger trg_config_notes_updated_at automatically updated timestamp!`
      );
      await refreshDbCatalog();
    }
  }

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setBannerMsg(null);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: newDevModel,
        microcontroller: newDevMcu,
        operating_voltage: newDevOpV,
        logic_level_voltage: newDevLogV,
        clock_speed_mhz: newDevClock,
        flash_memory_kb: newDevFlash,
        status: "PROTOTYPE",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setDevices(data.devices);
    setActiveSql(data.sql);
    setBannerMsg(`Inserted device '${newDevModel}' into PostgreSQL devices table.`);
    await refreshDbCatalog();
  }

  async function handleDeleteDevice(deviceId: number, modelName: string) {
    setErrorMsg(null);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", device_id: deviceId }),
    }).then((r) => r.json());
    if (res.success) {
      setDevices(res.devices);
      setActiveSql(res.sql);
      setBannerMsg(
        `Transaction-safe DELETE executed for '${modelName}' (device_id=${deviceId}).`
      );
      await refreshDbCatalog();
    }
  }

  async function handleAddCompatibility(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const res = await fetch("/api/compatibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: evalDeviceId,
        component_id: evalComponentId,
        notes: evalNotes,
      }),
    }).then((r) => r.json());
    if (res.success) {
      setCompatibility(res.compatibility);
      setActiveSql(res.sql);
      setBannerMsg(
        `Stored Function fn_evaluate_voltage_safety() Verdict: "${res.safetyVerdict}"`
      );
      await refreshDbCatalog();
    }
  }

  const filteredCompatibility = compatibility.filter((row) => {
    const matchStatus =
      statusFilter === "ALL" || row.compatibility_status === statusFilter;
    const matchDev =
      deviceFilter === "ALL" || row.device_model === deviceFilter;
    return matchStatus && matchDev;
  });

  function getStatusBadgeStyle(status: string): React.CSSProperties {
    if (
      status === "COMPATIBLE" ||
      status === "ACTIVE" ||
      status === "VERIFIED" ||
      status === "true"
    ) {
      return {
        backgroundColor: "rgba(16, 185, 129, 0.18)",
        color: "#34D399",
        border: "1px solid rgba(16, 185, 129, 0.4)",
      };
    }
    if (
      status.includes("PULLUP") ||
      status === "PROTOTYPE" ||
      status === "EXPERIMENTAL"
    ) {
      return {
        backgroundColor: "rgba(245, 158, 11, 0.18)",
        color: "#FBBF24",
        border: "1px solid rgba(245, 158, 11, 0.4)",
      };
    }
    return {
      backgroundColor: "rgba(239, 68, 68, 0.18)",
      color: "#F87171",
      border: "1px solid rgba(239, 68, 68, 0.4)",
    };
  }

  const activeDbTable =
    dbCatalog?.tables?.find((t: any) => t.name === selectedTableName) ||
    dbCatalog?.tables?.[0];

  const activeDbView =
    dbCatalog?.views?.find((v: any) => v.name === selectedViewName) ||
    dbCatalog?.views?.[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: "#1E293B",
          borderBottom: "1px solid #334155",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284C7, #2563EB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "16px",
              color: "#FFF",
            }}
          >
            IoT
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#F8FAFC" }}>
              IoT Device Configuration &amp; Compatibility Portal
            </h1>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
              UE24CS351A DBMS Mini-Project &bull; Team 9 (Hitha Shree Suresh{" "}
              <code>PES2UG24CS196</code> &amp; Hemant Ram Nelapati{" "}
              <code>PES2UG24CS192</code>)
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Prominent View Backend Database Button for Presentation */}
          <button
            onClick={() => {
              setActiveTab("database");
              setBannerMsg(
                "Opened Live Backend Database Inspector (iot_config_db: 11 Tables, 3 Views, 81 Seed Rows, 50 Constraints)."
              );
              if (activeDbTable) {
                setActiveSql(activeDbTable.sql);
              }
            }}
            style={{
              background:
                activeTab === "database"
                  ? "linear-gradient(135deg, #059669, #10B981)"
                  : "linear-gradient(135deg, #0F766E, #0D9488)",
              color: "#FFFFFF",
              border: "1px solid #34D399",
              padding: "8px 16px",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🗄️</span>
            <span>
              {activeTab === "database"
                ? "Viewing Backend Database (11 Tables / 3 Views)"
                : `View Backend Database (${dbCatalog?.totalRows || 81} Rows / 11 Tables)`}
            </span>
          </button>

          <span
            style={{
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(14, 165, 233, 0.4)",
              color: "#38BDF8",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
            }}
          >
            ● PostgreSQL 16.15 + pgvector v0.6.0
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", color: "#CBD5E1" }}>RBAC Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleType)}
              style={{
                backgroundColor: role === "Hardware Admin" ? "#1D4ED8" : "#334155",
                color: "#FFFFFF",
                border: "1px solid #475569",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="Hardware Admin">Role: Hardware Admin (Full CRUD)</option>
              <option value="Embedded Engineer">Role: Embedded Engineer (Read/Search)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        style={{
          flex: 1,
          padding: "22px 28px",
          maxWidth: "1440px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Top Summary KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "18px",
            marginBottom: "22px",
          }}
        >
          {[
            {
              title: `11 Normalized Tables (3NF)`,
              sub: `50 Catalog Constraints | ${dbCatalog?.totalRows || 81} Populated Rows`,
              accent: "#3B82F6",
              onClick: () => setActiveTab("database"),
            },
            {
              title: `${devices.length} Active IoT Compute Boards`,
              sub: "ESP32, Pico W, Uno Rev3, STM32, ESP8266...",
              accent: "#10B981",
              onClick: () => setActiveTab("catalog"),
            },
            {
              title: `${compatibility.length} Bench Compatibility Audits`,
              sub: "Multi-Way Matrix + Voltage Safety Checks",
              accent: "#F59E0B",
              onClick: () => setActiveTab("compatibility"),
            },
            {
              title: "384-d HNSW Vector Index",
              sub: "pgvector Cosine Similarity (<=>) + Trigger",
              accent: "#8B5CF6",
              onClick: () => setActiveTab("vector"),
            },
          ].map((card, i) => (
            <div
              key={i}
              onClick={card.onClick}
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderLeft: `4px solid ${card.accent}`,
                borderRadius: "10px",
                padding: "14px 18px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC" }}>
                {card.title}
              </div>
              <div style={{ fontSize: "12.5px", color: "#94A3B8", marginTop: "4px" }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: "1px solid #334155",
            paddingBottom: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {[
            {
              id: "compatibility",
              label: "1. Hardware Compatibility Matrix (View + Stored Function)",
            },
            {
              id: "vector",
              label: "2. pgvector Semantic Search (<=>) & Audit Trigger",
            },
            {
              id: "catalog",
              label: "3. Devices & Components Catalog (DDL CHECK + DML CRUD)",
            },
            {
              id: "analytics",
              label: "4. SQL Analytics (GROUP BY / HAVING & Correlated Queries)",
            },
            {
              id: "database",
              label: "5. 🗄️ Backend Database Explorer (All 11 Tables & 3 Views)",
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as TabType);
                setBannerMsg(null);
                setErrorMsg(null);
              }}
              style={{
                backgroundColor:
                  activeTab === t.id
                    ? t.id === "database"
                      ? "#059669"
                      : "#0284C7"
                    : "#1E293B",
                color: activeTab === t.id ? "#FFFFFF" : "#CBD5E1",
                border:
                  activeTab === t.id
                    ? t.id === "database"
                      ? "1px solid #34D399"
                      : "1px solid #38BDF8"
                    : "1px solid #334155",
                padding: "9px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Notification Banners */}
        {bannerMsg && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.14)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#6EE7B7",
              padding: "10px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            ✓ {bannerMsg}
          </div>
        )}
        {errorMsg && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.16)",
              border: "1px solid rgba(239, 68, 68, 0.45)",
              color: "#FCA5A5",
              padding: "10px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
              fontFamily: "Consolas, monospace",
            }}
          >
            ✗ {errorMsg}
          </div>
        )}

        {/* ==================== TAB 1: COMPATIBILITY MATRIX ==================== */}
        {activeTab === "compatibility" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", color: "#38BDF8" }}>
                    Multi-Table Compatibility Matrix (View:{" "}
                    <code>v_device_compatibility_overview</code>)
                  </h2>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    6-Table Join across compatibility, devices, manufacturers, components,
                    libraries, and firmware
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={deviceFilter}
                    onChange={(e) => setDeviceFilter(e.target.value)}
                    style={{
                      backgroundColor: "#0F172A",
                      color: "#E2E8F0",
                      border: "1px solid #475569",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    <option value="ALL">All Boards</option>
                    <option value="ESP32-WROOM-32">ESP32-WROOM-32</option>
                    <option value="Arduino Uno Rev3">Arduino Uno Rev3</option>
                    <option value="Raspberry Pi Pico W">Raspberry Pi Pico W</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      backgroundColor: "#0F172A",
                      color: "#E2E8F0",
                      border: "1px solid #475569",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    <option value="ALL">All Compatibility States</option>
                    <option value="COMPATIBLE">COMPATIBLE</option>
                    <option value="REQUIRES_LEVEL_SHIFTER">REQUIRES_LEVEL_SHIFTER</option>
                    <option value="REQUIRES_PULLUP_RESISTOR">REQUIRES_PULLUP_RESISTOR</option>
                  </select>
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12.5px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#334155", color: "#F1F5F9", textAlign: "left" }}>
                    <th style={{ padding: "10px" }}>Device Model</th>
                    <th style={{ padding: "10px" }}>Logic V</th>
                    <th style={{ padding: "10px" }}>Peripheral Component</th>
                    <th style={{ padding: "10px" }}>Interface</th>
                    <th style={{ padding: "10px" }}>Status</th>
                    <th style={{ padding: "10px" }}>Driver / FW</th>
                    <th style={{ padding: "10px" }}>Engineering Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompatibility.map((row, idx) => (
                    <tr
                      key={row.compatibility_id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#0F172A" : "#162033",
                        borderBottom: "1px solid #1E293B",
                      }}
                    >
                      <td style={{ padding: "10px", fontWeight: 600, color: "#F8FAFC" }}>
                        {row.device_model}
                      </td>
                      <td style={{ padding: "10px", color: "#38BDF8", fontWeight: 600 }}>
                        {Number(row.device_logic_voltage).toFixed(2)}V
                      </td>
                      <td style={{ padding: "10px" }}>{row.component_name}</td>
                      <td style={{ padding: "10px", color: "#94A3B8" }}>
                        {row.component_interface}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span
                          style={{
                            ...getStatusBadgeStyle(row.compatibility_status),
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "inline-block",
                          }}
                        >
                          {row.compatibility_status}
                        </span>
                      </td>
                      <td style={{ padding: "10px", color: "#CBD5E1" }}>
                        {row.library_name || "Native GPIO"}{" "}
                        <span style={{ color: "#64748B" }}>({row.firmware_version})</span>
                      </td>
                      <td style={{ padding: "10px", color: "#94A3B8", fontSize: "11.5px" }}>
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Column: Stored Function Evaluator & New Matrix Entry */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#F8FAFC" }}>
                Evaluate Voltage Safety &amp; Log Test
              </h3>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "14px" }}>
                Invokes PL/pgSQL logic{" "}
                <code>fn_evaluate_voltage_safety(board_v, sensor_max_v)</code> and inserts into{" "}
                <code>compatibility</code>.
              </div>

              <form
                onSubmit={handleAddCompatibility}
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#CBD5E1",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Select IoT Compute Board:
                  </label>
                  <select
                    value={evalDeviceId}
                    onChange={(e) => setEvalDeviceId(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0F172A",
                      color: "#F8FAFC",
                      border: "1px solid #475569",
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                    }}
                  >
                    {devices.map((d) => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.model_name} (Logic: {Number(d.logic_level_voltage).toFixed(2)}V)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#CBD5E1",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Select Peripheral Component:
                  </label>
                  <select
                    value={evalComponentId}
                    onChange={(e) => setEvalComponentId(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0F172A",
                      color: "#F8FAFC",
                      border: "1px solid #475569",
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                    }}
                  >
                    {components.map((c) => (
                      <option key={c.component_id} value={c.component_id}>
                        {c.component_name} ({c.operating_voltage_min}V–{c.operating_voltage_max}V)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#CBD5E1",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Bench Verification Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0F172A",
                      color: "#F8FAFC",
                      border: "1px solid #475569",
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={role !== "Hardware Admin"}
                  style={{
                    backgroundColor: role === "Hardware Admin" ? "#0284C7" : "#475569",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: role === "Hardware Admin" ? "pointer" : "not-allowed",
                  }}
                >
                  {role === "Hardware Admin"
                    ? "Run Voltage Check & Insert Evaluation"
                    : "Requires Hardware Admin Role"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PGVECTOR & TRIGGER ==================== */}
        {activeTab === "vector" && (
          <div
            style={{
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <h2 style={{ margin: 0, fontSize: "16.5px", color: "#38BDF8" }}>
                AI Semantic Troubleshooting &amp; Compatibility Search (<code>pgvector</code> 384-d
                HNSW Index <code>idx_config_notes_embedding_hnsw</code>)
              </h2>
              <div style={{ fontSize: "12.5px", color: "#94A3B8", marginTop: "4px" }}>
                Encodes your natural-language query into a 384-dimensional unit vector, ranks{" "}
                <code>configuration_notes.embedding vector(384)</code> using PostgreSQL&apos;s
                cosine distance operator (<code>&lt;=&gt;</code>), and cross-checks relational{" "}
                <code>devices</code> &amp; <code>components</code> electrical specs.
              </div>
            </div>

            {/* Visual How-It-Works Pipeline Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px",
                backgroundColor: "#0F172A",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "14px",
                fontSize: "11.5px",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#38BDF8" }}>
                  Step 1: Query Embedding
                </div>
                <div style={{ color: "#94A3B8" }}>
                  Stop-word filtered text &rarr; 384-d unit vector (<code>||v|| = 1.0</code>)
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#A78BFA" }}>
                  Step 2: HNSW Graph Traversal
                </div>
                <div style={{ color: "#94A3B8" }}>
                  <code>USING hnsw (embedding vector_cosine_ops)</code> (<code>m=16, ef=64</code>)
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#34D399" }}>
                  Step 3: Cosine Distance (&lt;=&gt;)
                </div>
                <div style={{ color: "#94A3B8" }}>
                  <code>similarity = 1 - (cn.embedding &lt;=&gt; qv.embedding)</code>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#FBBF24" }}>
                  Step 4: Hybrid SQL Voltage Audit
                </div>
                <div style={{ color: "#94A3B8" }}>
                  Joins <code>devices</code> + <code>components</code> &amp; runs{" "}
                  <code>fn_evaluate_voltage_safety()</code>
                </div>
              </div>
            </div>

            {/* Preset Query Pills */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "11.5px", color: "#94A3B8", fontWeight: 600 }}>
                Try Sample Queries:
              </span>
              {[
                "Is MPU-6050 compatible with ESP32",
                "How to wire BME280 I2C sensor to ESP32 3.3V pins",
                "Can Arduino Uno 5V connect to BME280 without level shifter",
                "DHT22 pull-up resistor timeout on ESP32 GPIO4",
                "Driving 5V relay module safely with Arduino Uno",
                "Raspberry Pi Pico W Wi-Fi and MQTT client setup",
              ].map((sampleQ) => (
                <button
                  key={sampleQ}
                  type="button"
                  onClick={() => runVectorSearchWithQuery(sampleQ)}
                  style={{
                    backgroundColor:
                      vectorQuery.toLowerCase() === sampleQ.toLowerCase()
                        ? "rgba(14, 165, 233, 0.25)"
                        : "#0F172A",
                    color:
                      vectorQuery.toLowerCase() === sampleQ.toLowerCase()
                        ? "#38BDF8"
                        : "#CBD5E1",
                    border: "1px solid #334155",
                    borderRadius: "999px",
                    padding: "4px 11px",
                    fontSize: "11.5px",
                    cursor: "pointer",
                  }}
                >
                  {sampleQ}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleVectorSearch}
              style={{ display: "flex", gap: "12px", marginBottom: "14px" }}
            >
              <input
                type="text"
                value={vectorQuery}
                onChange={(e) => setVectorQuery(e.target.value)}
                placeholder="Ask a hardware compatibility or wiring question (e.g. 'Is MPU-6050 compatible with ESP32')..."
                style={{
                  flex: 1,
                  backgroundColor: "#0F172A",
                  color: "#F8FAFC",
                  border: "1px solid #475569",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "13.5px",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#0284C7",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                Execute pgvector Cosine Search (&lt;=&gt;)
              </button>
            </form>

            {queryVectorPreview && (
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#94A3B8",
                  fontFamily: "Consolas, monospace",
                  marginBottom: "14px",
                }}
              >
                Query Vector <code>qv.embedding vector(384)</code>: {queryVectorPreview}
              </div>
            )}

            {/* Hybrid Relational + Vector Compatibility Verdict Card */}
            {hybridAnalysis && (
              <div
                style={{
                  backgroundColor: "rgba(14, 165, 233, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.45)",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#38BDF8" }}>
                    ⚡ Hybrid Relational + Vector Hardware Compatibility Verdict:{" "}
                    <span style={{ color: "#F8FAFC" }}>
                      {hybridAnalysis.device.model_name} + {hybridAnalysis.component.component_name}
                    </span>
                  </div>
                  <span
                    style={{
                      ...getStatusBadgeStyle(hybridAnalysis.compatibilityStatus),
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {hybridAnalysis.compatibilityStatus}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                    fontSize: "12px",
                    color: "#CBD5E1",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#0F172A",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #334155",
                    }}
                  >
                    <div style={{ color: "#94A3B8", fontSize: "11px" }}>
                      Board Specs (<code>devices</code> Table)
                    </div>
                    <div style={{ fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
                      {hybridAnalysis.device.model_name} ( Supply:{" "}
                      {Number(hybridAnalysis.device.operating_voltage).toFixed(2)}V | Logic:{" "}
                      {Number(hybridAnalysis.device.logic_level_voltage).toFixed(2)}V )
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#0F172A",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #334155",
                    }}
                  >
                    <div style={{ color: "#94A3B8", fontSize: "11px" }}>
                      Sensor Specs (<code>components</code> Table)
                    </div>
                    <div style={{ fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
                      {hybridAnalysis.component.component_name} ({" "}
                      {hybridAnalysis.component.operating_voltage_min}V–
                      {hybridAnalysis.component.operating_voltage_max}V |{" "}
                      {hybridAnalysis.component.interface_type} )
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#0F172A",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #334155",
                    }}
                  >
                    <div style={{ color: "#94A3B8", fontSize: "11px" }}>
                      Stored Function <code>fn_evaluate_voltage_safety()</code>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: hybridAnalysis.fnSafetyVerdict.startsWith("SAFE")
                          ? "#34D399"
                          : "#FBBF24",
                        marginTop: "2px",
                      }}
                    >
                      {hybridAnalysis.fnSafetyVerdict}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "12.5px", color: "#E2E8F0" }}>
                  <strong>Recommended Bus &amp; Pinout:</strong>{" "}
                  <code>{hybridAnalysis.pinoutGuide}</code> &mdash;{" "}
                  {hybridAnalysis.engineeringSummary}
                </div>
              </div>
            )}

            {triggerAuditLog && (
              <div
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.15)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "12.5px",
                }}
              >
                <div style={{ fontWeight: 700, color: "#C4B5FD", marginBottom: "4px" }}>
                  ⚡ Automated Trigger Verification (Note #{triggerAuditLog.noteId}):{" "}
                  <code>{triggerAuditLog.trigger}</code>
                </div>
                <div style={{ color: "#E2E8F0", fontFamily: "Consolas, monospace" }}>
                  BEFORE UPDATE <code>updated_at</code>: {triggerAuditLog.prev} &nbsp;&rarr;&nbsp;{" "}
                  <span style={{ color: "#34D399", fontWeight: 700 }}>
                    AFTER UPDATE <code>updated_at</code>: {triggerAuditLog.next}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notes.map((n, idx) => (
                <div
                  key={n.note_id}
                  style={{
                    backgroundColor: "#0F172A",
                    border: idx === 0 ? "1px solid #0284C7" : "1px solid #334155",
                    borderRadius: "8px",
                    padding: "14px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          backgroundColor: idx === 0 ? "#0284C7" : "#1E293B",
                          color: idx === 0 ? "#FFFFFF" : "#38BDF8",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        Rank #{idx + 1} &bull; Note #{n.note_id} ({n.note_type})
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "14.5px", color: "#F8FAFC" }}>
                        {n.title}
                      </span>
                      {n.target_device && (
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                          ({n.target_device}
                          {n.target_component ? ` + ${n.target_component}` : ""})
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          backgroundColor:
                            Number(n.cosine_similarity_score) >= 0.65
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(59, 130, 246, 0.2)",
                          color:
                            Number(n.cosine_similarity_score) >= 0.65
                              ? "#34D399"
                              : "#60A5FA",
                          border: "1px solid rgba(59, 130, 246, 0.4)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Cosine Similarity: {Number(n.cosine_similarity_score).toFixed(4)}
                      </span>
                      <button
                        onClick={() => handleTriggerUpdate(n.note_id)}
                        disabled={role !== "Hardware Admin"}
                        style={{
                          backgroundColor: "#7C3AED",
                          color: "#FFFFFF",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "5px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: role === "Hardware Admin" ? "pointer" : "not-allowed",
                        }}
                      >
                        UPDATE &amp; Fire Trigger
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
                    {n.content}
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "11.5px",
                      color: "#64748B",
                      fontFamily: "Consolas, monospace",
                    }}
                  >
                    Vector Column: embedding vector({n.vector_dims || 384}){" "}
                    {n.embedding_preview ? `= ${n.embedding_preview}` : ""} | Last Audit Timestamp
                    (updated_at): {n.updated_at}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: DEVICES & COMPONENTS CATALOG ==================== */}
        {activeTab === "catalog" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Devices Table */}
              <div
                style={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "18px",
                }}
              >
                <h2 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#38BDF8" }}>
                  IoT Compute Boards Catalog (<code>devices</code> Table)
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#334155", color: "#F1F5F9", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>ID</th>
                      <th style={{ padding: "8px" }}>Model Name</th>
                      <th style={{ padding: "8px" }}>Manufacturer</th>
                      <th style={{ padding: "8px" }}>Supply / Logic V</th>
                      <th style={{ padding: "8px" }}>Clock</th>
                      <th style={{ padding: "8px" }}>Flash / SRAM</th>
                      <th style={{ padding: "8px" }}>GPIO</th>
                      <th style={{ padding: "8px" }}>Status</th>
                      <th style={{ padding: "8px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d, idx) => (
                      <tr
                        key={d.device_id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#0F172A" : "#162033",
                        }}
                      >
                        <td style={{ padding: "8px", fontWeight: 700 }}>#{d.device_id}</td>
                        <td style={{ padding: "8px", fontWeight: 600, color: "#F8FAFC" }}>
                          {d.model_name}
                        </td>
                        <td style={{ padding: "8px", color: "#CBD5E1" }}>
                          {d.manufacturer_name}
                        </td>
                        <td style={{ padding: "8px", color: "#38BDF8" }}>
                          {Number(d.operating_voltage).toFixed(2)}V /{" "}
                          {Number(d.logic_level_voltage).toFixed(2)}V
                        </td>
                        <td style={{ padding: "8px" }}>{d.clock_speed_mhz} MHz</td>
                        <td style={{ padding: "8px" }}>
                          {d.flash_memory_kb} KB / {d.sram_kb} KB
                        </td>
                        <td style={{ padding: "8px" }}>{d.gpio_count}</td>
                        <td style={{ padding: "8px" }}>
                          <span
                            style={{
                              ...getStatusBadgeStyle(d.status),
                              padding: "2px 7px",
                              borderRadius: "4px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                            }}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td style={{ padding: "8px" }}>
                          <button
                            onClick={() => handleDeleteDevice(d.device_id, d.model_name)}
                            disabled={role !== "Hardware Admin"}
                            style={{
                              backgroundColor: "rgba(239, 68, 68, 0.2)",
                              color: "#F87171",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: role === "Hardware Admin" ? "pointer" : "not-allowed",
                            }}
                          >
                            DELETE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Components Table */}
              <div
                style={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "18px",
                }}
              >
                <h2 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#38BDF8" }}>
                  Peripheral Sensors &amp; Actuators (<code>components</code> Table with{" "}
                  <code>ALTER TABLE datasheet_url</code>)
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#334155", color: "#F1F5F9", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>ID</th>
                      <th style={{ padding: "8px" }}>Component Name</th>
                      <th style={{ padding: "8px" }}>Category</th>
                      <th style={{ padding: "8px" }}>Voltage Envelope</th>
                      <th style={{ padding: "8px" }}>Logic V</th>
                      <th style={{ padding: "8px" }}>Interface</th>
                      <th style={{ padding: "8px" }}>Datasheet (ALTER DDL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c, idx) => (
                      <tr
                        key={c.component_id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#0F172A" : "#162033",
                        }}
                      >
                        <td style={{ padding: "8px", fontWeight: 700 }}>#{c.component_id}</td>
                        <td style={{ padding: "8px", fontWeight: 600, color: "#F8FAFC" }}>
                          {c.component_name}
                        </td>
                        <td style={{ padding: "8px", color: "#CBD5E1" }}>{c.category}</td>
                        <td style={{ padding: "8px", color: "#34D399" }}>
                          {c.operating_voltage_min}V – {c.operating_voltage_max}V
                        </td>
                        <td style={{ padding: "8px", color: "#38BDF8" }}>
                          {Number(c.logic_level_voltage).toFixed(2)}V
                        </td>
                        <td style={{ padding: "8px" }}>{c.interface_type}</td>
                        <td style={{ padding: "8px", color: "#60A5FA", fontSize: "11px" }}>
                          PDF Spec Linked ✓
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Insert Device Form with CHECK Constraint Validation */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
                height: "fit-content",
              }}
            >
              <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#F8FAFC" }}>
                Add IoT Prototype Board (<code>INSERT</code>)
              </h3>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "14px" }}>
                Enforces PostgreSQL domain CHECK constraints:{" "}
                <code>chk_devices_operating_voltage (0 &lt; V &lt;= 48)</code> and{" "}
                <code>chk_devices_logic_level_voltage (0 &lt; V &lt;= 12)</code>.
              </div>

              <form
                onSubmit={handleAddDevice}
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <div>
                  <label style={{ fontSize: "11.5px", color: "#CBD5E1" }}>
                    Model Name (UNIQUE):
                  </label>
                  <input
                    type="text"
                    value={newDevModel}
                    onChange={(e) => setNewDevModel(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0F172A",
                      color: "#F8FAFC",
                      border: "1px solid #475569",
                      padding: "7px",
                      borderRadius: "5px",
                      marginTop: "3px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11.5px", color: "#CBD5E1" }}>
                    Microcontroller SoC:
                  </label>
                  <input
                    type="text"
                    value={newDevMcu}
                    onChange={(e) => setNewDevMcu(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0F172A",
                      color: "#F8FAFC",
                      border: "1px solid #475569",
                      padding: "7px",
                      borderRadius: "5px",
                      marginTop: "3px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11.5px", color: "#CBD5E1" }}>
                      Supply V (&le;48V):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newDevOpV}
                      onChange={(e) => setNewDevOpV(e.target.value)}
                      style={{
                        width: "100%",
                        backgroundColor: "#0F172A",
                        color: "#F8FAFC",
                        border: "1px solid #475569",
                        padding: "7px",
                        borderRadius: "5px",
                        marginTop: "3px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11.5px", color: "#CBD5E1" }}>
                      Logic V (&le;12V):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newDevLogV}
                      onChange={(e) => setNewDevLogV(e.target.value)}
                      style={{
                        width: "100%",
                        backgroundColor: "#0F172A",
                        color: "#F8FAFC",
                        border: "1px solid #475569",
                        padding: "7px",
                        borderRadius: "5px",
                        marginTop: "3px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11.5px", color: "#CBD5E1" }}>Clock (MHz):</label>
                    <input
                      type="number"
                      value={newDevClock}
                      onChange={(e) => setNewDevClock(e.target.value)}
                      style={{
                        width: "100%",
                        backgroundColor: "#0F172A",
                        color: "#F8FAFC",
                        border: "1px solid #475569",
                        padding: "7px",
                        borderRadius: "5px",
                        marginTop: "3px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11.5px", color: "#CBD5E1" }}>Flash (KB):</label>
                    <input
                      type="number"
                      value={newDevFlash}
                      onChange={(e) => setNewDevFlash(e.target.value)}
                      style={{
                        width: "100%",
                        backgroundColor: "#0F172A",
                        color: "#F8FAFC",
                        border: "1px solid #475569",
                        padding: "7px",
                        borderRadius: "5px",
                        marginTop: "3px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={role !== "Hardware Admin"}
                  style={{
                    backgroundColor: role === "Hardware Admin" ? "#10B981" : "#475569",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "13px",
                    marginTop: "6px",
                    cursor: role === "Hardware Admin" ? "pointer" : "not-allowed",
                  }}
                >
                  INSERT Prototype Board
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: SQL ANALYTICS ==================== */}
        {activeTab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* HAVING Clause Query */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <h3 style={{ margin: "0 0 6px 0", fontSize: "15.5px", color: "#38BDF8" }}>
                Query 7.1a: Protocol Aggregation (<code>GROUP BY</code> +{" "}
                <code>HAVING COUNT &gt;= 4</code>)
              </h3>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>
                Uses <code>COUNT(dp.protocol_id)</code> and{" "}
                <code>STRING_AGG(p.protocol_name, &apos;, &apos;)</code> across 4 joined tables.
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#334155", color: "#F1F5F9", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Device Model</th>
                    <th style={{ padding: "8px" }}>Manufacturer</th>
                    <th style={{ padding: "8px" }}>Count</th>
                    <th style={{ padding: "8px" }}>Aggregated Protocols (STRING_AGG)</th>
                  </tr>
                </thead>
                <tbody>
                  {havingResults.map((r, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#0F172A" : "#162033" }}
                    >
                      <td style={{ padding: "8px", fontWeight: 700, color: "#F8FAFC" }}>
                        {r.device_model}
                      </td>
                      <td style={{ padding: "8px" }}>{r.manufacturer}</td>
                      <td style={{ padding: "8px", color: "#34D399", fontWeight: 700 }}>
                        {r.supported_protocols_count}
                      </td>
                      <td style={{ padding: "8px", color: "#94A3B8", fontSize: "11.5px" }}>
                        {r.protocols_list}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Correlated Subquery */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
              }}
            >
              <h3 style={{ margin: "0 0 6px 0", fontSize: "15.5px", color: "#38BDF8" }}>
                Query 7.4: Correlated Subquery (Boards &ge; Manufacturer AVG Clock Speed)
              </h3>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>
                <code>
                  WHERE d.clock_speed_mhz &gt;= (SELECT AVG(d2.clock_speed_mhz) FROM devices d2
                  WHERE d2.manufacturer_id = d.manufacturer_id)
                </code>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#334155", color: "#F1F5F9", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Board Model</th>
                    <th style={{ padding: "8px" }}>Manufacturer</th>
                    <th style={{ padding: "8px" }}>Board Clock</th>
                    <th style={{ padding: "8px" }}>Vendor AVG</th>
                    <th style={{ padding: "8px" }}>Flash Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {correlatedResults.map((r, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: i % 2 === 0 ? "#0F172A" : "#162033" }}
                    >
                      <td style={{ padding: "8px", fontWeight: 700, color: "#F8FAFC" }}>
                        {r.model_name}
                      </td>
                      <td style={{ padding: "8px" }}>{r.manufacturer}</td>
                      <td style={{ padding: "8px", color: "#38BDF8", fontWeight: 700 }}>
                        {r.clock_speed_mhz} MHz
                      </td>
                      <td style={{ padding: "8px", color: "#94A3B8" }}>
                        {r.avg_manufacturer_mhz} MHz
                      </td>
                      <td style={{ padding: "8px" }}>{r.flash_memory_kb} KB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status Distribution Breakdown */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
                gridColumn: "span 2",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", fontSize: "15.5px", color: "#38BDF8" }}>
                Query 7.1b: Compatibility Status Aggregate Distribution (<code>COUNT(*)</code> +
                Scalar Subquery Percentage)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                {statusBreakdown.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      padding: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          ...getStatusBadgeStyle(s.compatibility_status),
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        {s.compatibility_status}
                      </span>
                      <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "6px" }}>
                        Evaluated Hardware Combinations: {s.total_evaluations}
                      </div>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#F8FAFC" }}>
                      {s.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: BACKEND DATABASE EXPLORER ==================== */}
        {activeTab === "database" && dbCatalog && (
          <div style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: "20px" }}>
            {/* Left Sidebar: 11 Base Tables & 3 Views Selector */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", color: "#34D399" }}>
                  🗄️ Schema Objects (<code>iot_config_db</code>)
                </h3>
                <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "3px" }}>
                  Click any table or view to inspect its live rows, PK/FK constraints, and SQL.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  onClick={() => {
                    setSelectedDbMode("tables");
                    if (activeDbTable) setActiveSql(activeDbTable.sql);
                  }}
                  style={{
                    backgroundColor: selectedDbMode === "tables" ? "#0284C7" : "#0F172A",
                    color: "#FFFFFF",
                    border: "1px solid #334155",
                    padding: "7px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  11 Base Tables ({dbCatalog.totalRows})
                </button>
                <button
                  onClick={() => {
                    setSelectedDbMode("views");
                    if (activeDbView) setActiveSql(activeDbView.sql);
                  }}
                  style={{
                    backgroundColor: selectedDbMode === "views" ? "#0284C7" : "#0F172A",
                    color: "#FFFFFF",
                    border: "1px solid #334155",
                    padding: "7px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  3 SQL Views
                </button>
              </div>

              {selectedDbMode === "tables" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {dbCatalog.tables.map((t: any) => {
                    const isSel = t.name === selectedTableName;
                    return (
                      <button
                        key={t.name}
                        onClick={() => {
                          setSelectedTableName(t.name);
                          setActiveSql(t.sql);
                        }}
                        style={{
                          backgroundColor: isSel ? "rgba(14, 165, 233, 0.2)" : "#0F172A",
                          border: isSel ? "1px solid #38BDF8" : "1px solid #334155",
                          color: isSel ? "#F8FAFC" : "#CBD5E1",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12.5px",
                        }}
                      >
                        <span>
                          <strong>{t.order}.</strong> <code>{t.name}</code>
                        </span>
                        <span
                          style={{
                            backgroundColor: isSel ? "#0284C7" : "#1E293B",
                            color: "#E2E8F0",
                            padding: "2px 7px",
                            borderRadius: "99px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {t.rowCount} rows
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {dbCatalog.views.map((v: any, idx: number) => {
                    const isSel = v.name === selectedViewName;
                    return (
                      <button
                        key={v.name}
                        onClick={() => {
                          setSelectedViewName(v.name);
                          setActiveSql(v.sql);
                        }}
                        style={{
                          backgroundColor: isSel ? "rgba(16, 185, 129, 0.2)" : "#0F172A",
                          border: isSel ? "1px solid #34D399" : "1px solid #334155",
                          color: isSel ? "#F8FAFC" : "#CBD5E1",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#34D399" }}>
                          View #{idx + 1}: <code>{v.name}</code>
                        </div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                          {v.rows.length} result rows
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Panel: Selected Table or View Inspector */}
            <div
              style={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "18px",
                overflowX: "auto",
              }}
            >
              {selectedDbMode === "tables" && activeDbTable && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: "17px", color: "#38BDF8" }}>
                        Table #{activeDbTable.order}: <code>public.{activeDbTable.name}</code>{" "}
                        <span
                          style={{
                            fontSize: "12px",
                            backgroundColor: "rgba(16, 185, 129, 0.2)",
                            color: "#34D399",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            marginLeft: "8px",
                          }}
                        >
                          {activeDbTable.normalForm}
                        </span>
                      </h2>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC" }}>
                      Populated Rows: {activeDbTable.rowCount}
                    </div>
                  </div>

                  {/* Schema & Constraint Metadata Bar */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "10px",
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "14px",
                      fontSize: "11.5px",
                    }}
                  >
                    <div>
                      <div style={{ color: "#94A3B8", fontWeight: 600 }}>Primary Key (PK)</div>
                      <div style={{ color: "#F8FAFC", fontWeight: 700, marginTop: "2px" }}>
                        <code>{activeDbTable.primaryKey}</code>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#94A3B8", fontWeight: 600 }}>
                        Foreign Keys (FK &amp; Referential Actions)
                      </div>
                      <div style={{ color: "#38BDF8", marginTop: "2px" }}>
                        {activeDbTable.foreignKeys}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#94A3B8", fontWeight: 600 }}>
                        Enforced Constraints &amp; Indexes
                      </div>
                      <div style={{ color: "#FBBF24", marginTop: "2px" }}>
                        {activeDbTable.constraints}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Data Table */}
                  {activeDbTable.rows.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#334155",
                              color: "#F1F5F9",
                              textAlign: "left",
                            }}
                          >
                            {Object.keys(activeDbTable.rows[0]).map((col) => (
                              <th
                                key={col}
                                style={{
                                  padding: "9px 10px",
                                  fontFamily: "Consolas, monospace",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDbTable.rows.map((row: any, rIdx: number) => (
                            <tr
                              key={rIdx}
                              style={{
                                backgroundColor: rIdx % 2 === 0 ? "#0F172A" : "#162033",
                                borderBottom: "1px solid #1E293B",
                              }}
                            >
                              {Object.entries(row).map(([col, val]: [string, any], cIdx) => (
                                <td
                                  key={cIdx}
                                  style={{
                                    padding: "8px 10px",
                                    color:
                                      cIdx === 0
                                        ? "#38BDF8"
                                        : typeof val === "boolean"
                                        ? val
                                          ? "#34D399"
                                          : "#F87171"
                                        : "#E2E8F0",
                                    fontWeight: cIdx === 0 ? 700 : 400,
                                    maxWidth: "340px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {typeof val === "boolean" ? String(val).toUpperCase() : String(val ?? "NULL")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {selectedDbMode === "views" && activeDbView && (
                <>
                  <div style={{ marginBottom: "14px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", color: "#34D399" }}>
                      Analytical SQL View: <code>public.{activeDbView.name}</code>
                    </h2>
                    <div style={{ fontSize: "12.5px", color: "#94A3B8", marginTop: "4px" }}>
                      {activeDbView.description}
                    </div>
                  </div>

                  {activeDbView.rows.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#334155",
                              color: "#F1F5F9",
                              textAlign: "left",
                            }}
                          >
                            {Object.keys(activeDbView.rows[0]).map((col) => (
                              <th
                                key={col}
                                style={{
                                  padding: "9px 10px",
                                  fontFamily: "Consolas, monospace",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDbView.rows.map((row: any, rIdx: number) => (
                            <tr
                              key={rIdx}
                              style={{
                                backgroundColor: rIdx % 2 === 0 ? "#0F172A" : "#162033",
                                borderBottom: "1px solid #1E293B",
                              }}
                            >
                              {Object.entries(row).map(([col, val]: [string, any], cIdx) => (
                                <td
                                  key={cIdx}
                                  style={{
                                    padding: "8px 10px",
                                    color: cIdx === 0 ? "#38BDF8" : "#E2E8F0",
                                  }}
                                >
                                  {typeof val === "boolean" ? String(val).toUpperCase() : String(val ?? "NULL")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Live Executed SQL Inspector Box */}
        <div
          style={{
            marginTop: "20px",
            backgroundColor: "#0F172A",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "14px 18px",
          }}
        >
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: "#38BDF8",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              marginBottom: "6px",
            }}
          >
            Live Executed PostgreSQL / pgvector Statement (API Route Layer)
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: "Consolas, monospace",
              fontSize: "12px",
              color: "#E2E8F0",
              whiteSpace: "pre-wrap",
            }}
          >
            {activeSql}
          </pre>
        </div>
      </main>
    </div>
  );
}
