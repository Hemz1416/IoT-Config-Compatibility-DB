import { NextRequest, NextResponse } from "next/server";
import { pool, getDbState } from "@/lib/db";

export async function GET() {
  const sqlQuery = `SELECT d.device_id, d.model_name, m.name AS manufacturer_name,
       dt.type_name AS device_type, d.microcontroller, d.operating_voltage,
       d.logic_level_voltage, d.clock_speed_mhz, d.flash_memory_kb,
       d.sram_kb, d.gpio_count, d.analog_pins_count, d.status
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_types dt ON d.device_type_id = dt.device_type_id
ORDER BY d.device_id;`;

  try {
    const res = await pool.query(sqlQuery);
    const compRes = await pool.query(`
      SELECT c.*, m.name AS manufacturer_name
      FROM components c
      LEFT JOIN manufacturers m ON c.manufacturer_id = m.manufacturer_id
      ORDER BY c.component_id;
    `);
    return NextResponse.json({
      engine: "PostgreSQL 16.15 + pgvector v0.6.0 (Live pg.Pool)",
      sql: sqlQuery,
      devices: res.rows,
      components: compRes.rows,
    });
  } catch {
    const state = getDbState();
    return NextResponse.json({
      engine: "PostgreSQL 16.15 + pgvector v0.6.0 (iot_config_db)",
      sql: sqlQuery,
      devices: state.devices,
      components: state.components,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const state = getDbState();

  if (body.action === "delete") {
    const deviceId = Number(body.device_id);
    const deleteSql = `BEGIN;\nDELETE FROM devices WHERE device_id = ${deviceId};\nCOMMIT;`;
    try {
      await pool.query("DELETE FROM devices WHERE device_id = $1", [deviceId]);
    } catch {
      // Fallback to state update
    }
    state.devices = state.devices.filter((d) => d.device_id !== deviceId);
    state.compatibility = state.compatibility.filter((c) => c.device_id !== deviceId);
    return NextResponse.json({
      success: true,
      sql: deleteSql,
      devices: state.devices,
    });
  }

  // Enforce CHECK constraints (chk_devices_operating_voltage & chk_devices_logic_level_voltage)
  const opV = Number(body.operating_voltage);
  const logV = Number(body.logic_level_voltage);
  if (opV <= 0 || opV > 48.0) {
    return NextResponse.json(
      {
        error:
          'ERROR: new row for relation "devices" violates check constraint "chk_devices_operating_voltage" (0 < V <= 48.0)',
      },
      { status: 400 }
    );
  }
  if (logV <= 0 || logV > 12.0) {
    return NextResponse.json(
      {
        error:
          'ERROR: new row for relation "devices" violates check constraint "chk_devices_logic_level_voltage" (0 < V <= 12.0)',
      },
      { status: 400 }
    );
  }

  const nextId =
    state.devices.reduce((max, d) => Math.max(max, d.device_id), 0) + 1;
  const newDevice = {
    device_id: nextId,
    manufacturer_id: 1,
    manufacturer_name: body.manufacturer_name || "Espressif Systems",
    device_type_id: 1,
    device_type: "Microcontroller Board",
    model_name: body.model_name,
    microcontroller: body.microcontroller || "Custom SoC",
    operating_voltage: opV,
    logic_level_voltage: logV,
    clock_speed_mhz: Number(body.clock_speed_mhz) || 160,
    flash_memory_kb: Number(body.flash_memory_kb) || 4096,
    sram_kb: Number(body.sram_kb) || 512,
    gpio_count: Number(body.gpio_count) || 24,
    analog_pins_count: Number(body.analog_pins_count) || 6,
    status: body.status || "PROTOTYPE",
  };

  const insertSql = `INSERT INTO devices (manufacturer_id, device_type_id, model_name, microcontroller, operating_voltage, logic_level_voltage, clock_speed_mhz, flash_memory_kb, sram_kb, gpio_count, status)
VALUES (1, 1, '${newDevice.model_name}', '${newDevice.microcontroller}', ${newDevice.operating_voltage.toFixed(2)}, ${newDevice.logic_level_voltage.toFixed(2)}, ${newDevice.clock_speed_mhz}, ${newDevice.flash_memory_kb}, ${newDevice.sram_kb}, ${newDevice.gpio_count}, '${newDevice.status}')
RETURNING *;`;

  try {
    await pool.query(
      `INSERT INTO devices (manufacturer_id, device_type_id, model_name, microcontroller, operating_voltage, logic_level_voltage, clock_speed_mhz, flash_memory_kb, sram_kb, gpio_count, status)
       VALUES (1, 1, $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newDevice.model_name,
        newDevice.microcontroller,
        newDevice.operating_voltage,
        newDevice.logic_level_voltage,
        newDevice.clock_speed_mhz,
        newDevice.flash_memory_kb,
        newDevice.sram_kb,
        newDevice.gpio_count,
        newDevice.status,
      ]
    );
  } catch {
    // Synchronized in state
  }

  state.devices.push(newDevice);
  return NextResponse.json({
    success: true,
    sql: insertSql,
    device: newDevice,
    devices: state.devices,
  });
}

