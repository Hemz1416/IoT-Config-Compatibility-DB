import { NextResponse } from "next/server";
import { getDbState } from "@/lib/db";

export async function GET() {
  const s = getDbState();

  const tables = [
    {
      name: "manufacturers",
      order: 1,
      normalForm: "3NF",
      primaryKey: "manufacturer_id (SERIAL PK)",
      foreignKeys: "None (Root Parent Entity)",
      constraints: "UNIQUE (name), NOT NULL (name, created_at)",
      sql: "SELECT manufacturer_id, name, website, country, created_at FROM manufacturers ORDER BY manufacturer_id;",
      rowCount: s.manufacturers.length,
      rows: s.manufacturers,
    },
    {
      name: "device_types",
      order: 2,
      normalForm: "3NF",
      primaryKey: "device_type_id (SERIAL PK)",
      foreignKeys: "None (Classification Lookup Entity)",
      constraints: "UNIQUE (type_name), NOT NULL (type_name)",
      sql: "SELECT device_type_id, type_name, description FROM device_types ORDER BY device_type_id;",
      rowCount: s.device_types.length,
      rows: s.device_types,
    },
    {
      name: "devices",
      order: 3,
      normalForm: "3NF",
      primaryKey: "device_id (SERIAL PK)",
      foreignKeys:
        "manufacturer_id -> manufacturers (ON DELETE RESTRICT), device_type_id -> device_types (ON DELETE RESTRICT)",
      constraints:
        "UNIQUE (model_name), chk_devices_operating_voltage (0 < V <= 48), chk_devices_logic_level_voltage (0 < V <= 12), chk_devices_status",
      sql: "SELECT device_id, manufacturer_id, device_type_id, model_name, microcontroller, operating_voltage, logic_level_voltage, clock_speed_mhz, flash_memory_kb, sram_kb, gpio_count, analog_pins_count, status FROM devices ORDER BY device_id;",
      rowCount: s.devices.length,
      rows: s.devices,
    },
    {
      name: "components",
      order: 4,
      normalForm: "3NF",
      primaryKey: "component_id (SERIAL PK)",
      foreignKeys:
        "manufacturer_id -> manufacturers (ON DELETE SET NULL)",
      constraints:
        "chk_components_voltage_min (> 0), chk_components_voltage_max (max >= min), chk_components_logic_level (> 0), ALTER TABLE ADD COLUMN datasheet_url",
      sql: "SELECT component_id, manufacturer_id, component_name, category, operating_voltage_min, operating_voltage_max, logic_level_voltage, current_draw_ma, interface_type, datasheet_url FROM components ORDER BY component_id;",
      rowCount: s.components.length,
      rows: s.components,
    },
    {
      name: "communication_protocols",
      order: 5,
      normalForm: "3NF",
      primaryKey: "protocol_id (SERIAL PK)",
      foreignKeys: "None",
      constraints:
        "UNIQUE (protocol_name), chk_protocols_layer IN ('Physical/DataLink', 'Network/Transport', 'Application', 'Hardware Bus'), chk_protocols_data_rate (> 0)",
      sql: "SELECT protocol_id, protocol_name, protocol_layer, standard, max_data_rate_kbps FROM communication_protocols ORDER BY protocol_id;",
      rowCount: s.communication_protocols.length,
      rows: s.communication_protocols,
    },
    {
      name: "device_protocols",
      order: 6,
      normalForm: "3NF",
      primaryKey: "(device_id, protocol_id) [Composite PK]",
      foreignKeys:
        "device_id -> devices (ON DELETE CASCADE), protocol_id -> communication_protocols (ON DELETE RESTRICT)",
      constraints: "Composite PK (device_id, protocol_id), is_native_support BOOLEAN NOT NULL",
      sql: "SELECT dp.device_id, d.model_name AS device_model, dp.protocol_id, p.protocol_name, dp.is_native_support FROM device_protocols dp JOIN devices d ON dp.device_id = d.device_id JOIN communication_protocols p ON dp.protocol_id = p.protocol_id ORDER BY dp.device_id, dp.protocol_id;",
      rowCount: s.device_protocols.length,
      rows: s.device_protocols,
    },
    {
      name: "firmware",
      order: 7,
      normalForm: "3NF",
      primaryKey: "firmware_id (SERIAL PK)",
      foreignKeys: "device_id -> devices (ON DELETE CASCADE)",
      constraints:
        "uq_firmware_device_version_runtime UNIQUE (device_id, version_tag, runtime_environment)",
      sql: "SELECT firmware_id, device_id, version_tag, runtime_environment, release_date, is_recommended FROM firmware ORDER BY firmware_id;",
      rowCount: s.firmware.length,
      rows: s.firmware,
    },
    {
      name: "libraries",
      order: 8,
      normalForm: "3NF",
      primaryKey: "library_id (SERIAL PK)",
      foreignKeys: "None",
      constraints:
        "uq_libraries_name_runtime UNIQUE (library_name, runtime_environment)",
      sql: "SELECT library_id, library_name, runtime_environment, latest_version, license, repository_url FROM libraries ORDER BY library_id;",
      rowCount: s.libraries.length,
      rows: s.libraries,
    },
    {
      name: "device_components",
      order: 9,
      normalForm: "3NF",
      primaryKey: "device_component_id (SERIAL PK)",
      foreignKeys:
        "device_id -> devices (ON DELETE CASCADE), component_id -> components (ON DELETE CASCADE)",
      constraints:
        "uq_device_components_pair UNIQUE (device_id, component_id), chk_device_components_status IN ('VERIFIED', 'EXPERIMENTAL', 'UNTESTED', 'FAILED')",
      sql: "SELECT device_component_id, device_id, component_id, default_bus_or_pin, tested_status FROM device_components ORDER BY device_component_id;",
      rowCount: s.device_components.length,
      rows: s.device_components,
    },
    {
      name: "compatibility",
      order: 10,
      normalForm: "3NF",
      primaryKey: "compatibility_id (SERIAL PK)",
      foreignKeys:
        "device_id -> devices (CASCADE), component_id -> components (CASCADE), library_id -> libraries (SET NULL), firmware_id -> firmware (SET NULL)",
      constraints:
        "uq_compatibility_matrix UNIQUE (device_id, component_id, library_id, firmware_id), chk_compatibility_status",
      sql: "SELECT compatibility_id, device_id, component_id, library_id, firmware_id, compatibility_status, voltage_compatible, logic_level_compatible, notes, verified_date FROM compatibility ORDER BY compatibility_id;",
      rowCount: s.compatibility.length,
      rows: s.compatibility.map((c) => ({
        compatibility_id: c.compatibility_id,
        device_id: c.device_id,
        device_model: c.device_model,
        component_id: c.component_id,
        component_name: c.component_name,
        library_id: c.library_id ?? "NULL",
        firmware_id: c.firmware_id ?? "NULL",
        compatibility_status: c.compatibility_status,
        voltage_compatible: c.voltage_compatible,
        logic_level_compatible: c.logic_level_compatible,
        verified_date: c.verified_date,
      })),
    },
    {
      name: "configuration_notes",
      order: 11,
      normalForm: "3NF + Vector(384)",
      primaryKey: "note_id (SERIAL PK)",
      foreignKeys:
        "device_id -> devices (ON DELETE CASCADE), component_id -> components (ON DELETE CASCADE)",
      constraints:
        "chk_config_notes_type, HNSW Index idx_config_notes_embedding_hnsw (vector_cosine_ops), Trigger trg_config_notes_updated_at",
      sql: "SELECT note_id, device_id, component_id, title, note_type, vector_dims(embedding) AS vector_dims, updated_at FROM configuration_notes ORDER BY note_id;",
      rowCount: s.notes.length,
      rows: s.notes.map((n) => ({
        note_id: n.note_id,
        device_id: n.device_id ?? "NULL",
        target_device: n.target_device ?? "NULL",
        component_id: n.component_id ?? "NULL",
        target_component: n.target_component ?? "NULL",
        title: n.title,
        note_type: n.note_type,
        vector_dims: n.vector_dims,
        embedding_preview: n.embedding_preview,
        updated_at: n.updated_at,
      })),
    },
  ];

  // 3 Analytical Views
  const views = [
    {
      name: "v_device_compatibility_overview",
      description:
        "6-Table Join (compatibility + devices + manufacturers + components + libraries + firmware) providing a human-readable electrical & software compatibility matrix.",
      sql: `CREATE OR REPLACE VIEW v_device_compatibility_overview AS
SELECT c.compatibility_id, d.model_name AS device_model, m_dev.name AS device_manufacturer,
       d.logic_level_voltage AS device_logic_voltage, comp.component_name, comp.category AS component_category,
       comp.interface_type AS component_interface, comp.logic_level_voltage AS component_logic_voltage,
       c.compatibility_status, c.voltage_compatible, c.logic_level_compatible,
       lib.library_name, f.version_tag AS firmware_version, c.notes, c.verified_date
FROM compatibility c
JOIN devices d ON c.device_id = d.device_id
JOIN manufacturers m_dev ON d.manufacturer_id = m_dev.manufacturer_id
JOIN components comp ON c.component_id = comp.component_id
LEFT JOIN libraries lib ON c.library_id = lib.library_id
LEFT JOIN firmware f ON c.firmware_id = f.firmware_id;`,
      rows: s.compatibility,
    },
    {
      name: "v_device_protocol_summary",
      description:
        "4-Table Aggregation View (devices + manufacturers + device_types + device_protocols + communication_protocols) summarizing native vs. external protocol support.",
      sql: `CREATE OR REPLACE VIEW v_device_protocol_summary AS
SELECT d.device_id, d.model_name, m.name AS manufacturer, dt.type_name AS device_category,
       COUNT(dp.protocol_id) AS total_protocols_supported,
       STRING_AGG(p.protocol_name, ', ' ORDER BY p.protocol_name) AS supported_protocols
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_types dt ON d.device_type_id = dt.device_type_id
LEFT JOIN device_protocols dp ON d.device_id = dp.device_id
LEFT JOIN communication_protocols p ON dp.protocol_id = p.protocol_id
GROUP BY d.device_id, d.model_name, m.name, dt.type_name;`,
      rows: s.devices.map((d) => {
        const dProts = s.device_protocols.filter((dp) => dp.device_id === d.device_id);
        return {
          device_id: d.device_id,
          model_name: d.model_name,
          manufacturer: d.manufacturer_name,
          device_category: d.device_type,
          total_protocols_supported: dProts.length,
          supported_protocols:
            dProts.map((p) => p.protocol_name).sort().join(", ") || "None mapped",
        };
      }),
    },
    {
      name: "v_active_devices_catalog",
      description:
        "Filtered Hardware Catalog View returning only ACTIVE IoT compute boards with vendor metadata and pin/memory specifications.",
      sql: `CREATE OR REPLACE VIEW v_active_devices_catalog AS
SELECT d.device_id, d.model_name, m.name AS manufacturer, m.country AS origin_country,
       dt.type_name AS category, d.microcontroller, d.operating_voltage, d.logic_level_voltage,
       d.clock_speed_mhz, d.flash_memory_kb, d.sram_kb, d.gpio_count, d.analog_pins_count
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_types dt ON d.device_type_id = dt.device_type_id
WHERE d.status = 'ACTIVE';`,
      rows: s.devices.filter((d) => d.status === "ACTIVE"),
    },
  ];

  const totalRows = tables.reduce((acc, t) => acc + t.rowCount, 0);

  return NextResponse.json({
    databaseName: "iot_config_db",
    engine: "PostgreSQL 16.15 + pgvector v0.6.0",
    totalTables: tables.length,
    totalViews: views.length,
    totalRows,
    totalConstraints: 50,
    totalExplicitIndexes: 15,
    tables,
    views,
  });
}

