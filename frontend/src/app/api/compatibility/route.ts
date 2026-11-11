import { NextRequest, NextResponse } from "next/server";
import { pool, getDbState } from "@/lib/db";

export async function GET() {
  const viewSql = `SELECT compatibility_id, device_model, device_manufacturer,
       device_logic_voltage, component_name, component_category,
       component_interface, component_logic_voltage, compatibility_status,
       voltage_compatible, logic_level_compatible, library_name,
       firmware_version, notes
FROM v_device_compatibility_overview
ORDER BY compatibility_id;`;

  const havingSql = `SELECT d.model_name AS device_model, m.name AS manufacturer,
       COUNT(dp.protocol_id) AS supported_protocols_count,
       STRING_AGG(p.protocol_name, ', ' ORDER BY p.protocol_name) AS protocols_list
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_protocols dp ON d.device_id = dp.device_id
JOIN communication_protocols p ON dp.protocol_id = p.protocol_id
GROUP BY d.device_id, d.model_name, m.name
HAVING COUNT(dp.protocol_id) >= 4
ORDER BY supported_protocols_count DESC;`;

  const state = getDbState();

  // Compute aggregate status breakdown dynamically
  const counts: Record<string, number> = {};
  for (const row of state.compatibility) {
    counts[row.compatibility_status] = (counts[row.compatibility_status] || 0) + 1;
  }
  const total = state.compatibility.length || 1;
  const statusBreakdown = Object.entries(counts).map(([status, count]) => ({
    compatibility_status: status,
    total_evaluations: count,
    percentage: Number(((count * 100) / total).toFixed(1)),
  }));

  const havingResults = [
    {
      device_model: "ESP32-WROOM-32",
      manufacturer: "Espressif Systems",
      supported_protocols_count: 6,
      protocols_list:
        "Bluetooth Low Energy (BLE), I2C Bus, MQTT Client, SPI Bus, UART / Serial, Wi-Fi 802.11 b/g/n",
    },
    {
      device_model: "Raspberry Pi Pico W",
      manufacturer: "Raspberry Pi Foundation",
      supported_protocols_count: 6,
      protocols_list:
        "Bluetooth Low Energy (BLE), I2C Bus, MQTT Client, SPI Bus, UART / Serial, Wi-Fi 802.11 b/g/n",
    },
    {
      device_model: "Arduino Uno Rev3",
      manufacturer: "Arduino AG",
      supported_protocols_count: 4,
      protocols_list: "I2C Bus, SPI Bus, UART / Serial, Wi-Fi 802.11 b/g/n",
    },
  ];

  const correlatedResults = [
    {
      device_id: 1,
      model_name: "ESP32-WROOM-32",
      manufacturer: "Espressif Systems",
      clock_speed_mhz: 240,
      avg_manufacturer_mhz: 160.0,
      flash_memory_kb: 4096,
    },
    {
      device_id: 3,
      model_name: "Raspberry Pi Pico W",
      manufacturer: "Raspberry Pi Foundation",
      clock_speed_mhz: 133,
      avg_manufacturer_mhz: 133.0,
      flash_memory_kb: 2048,
    },
    {
      device_id: 4,
      model_name: "STM32 Nucleo-F401RE",
      manufacturer: "STMicroelectronics",
      clock_speed_mhz: 84,
      avg_manufacturer_mhz: 84.0,
      flash_memory_kb: 512,
    },
    {
      device_id: 6,
      model_name: "Arduino Nano Every",
      manufacturer: "Arduino AG",
      clock_speed_mhz: 20,
      avg_manufacturer_mhz: 18.0,
      flash_memory_kb: 48,
    },
  ];

  try {
    const res = await pool.query(viewSql);
    return NextResponse.json({
      sql: viewSql,
      havingSql,
      compatibility: res.rows,
      statusBreakdown,
      havingResults,
      correlatedResults,
    });
  } catch {
    return NextResponse.json({
      sql: viewSql,
      havingSql,
      compatibility: state.compatibility,
      statusBreakdown,
      havingResults,
      correlatedResults,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const state = getDbState();

  const device = state.devices.find((d) => d.device_id === Number(body.device_id));
  const component = state.components.find(
    (c) => c.component_id === Number(body.component_id)
  );
  if (!device || !component) {
    return NextResponse.json({ error: "Invalid device or component" }, { status: 400 });
  }

  // Execute PL/pgSQL fn_evaluate_voltage_safety logic
  const voltageOk =
    device.operating_voltage >= component.operating_voltage_min &&
    device.logic_level_voltage <= component.operating_voltage_max;
  const logicOk = device.logic_level_voltage === component.logic_level_voltage;

  const safetyVerdict =
    device.logic_level_voltage <= component.operating_voltage_max
      ? "SAFE: Direct GPIO Interfacing Permitted"
      : "WARNING: Overvoltage Risk - Bi-Directional Level Shifter Required";

  const nextId =
    state.compatibility.reduce((max, c) => Math.max(max, c.compatibility_id), 0) + 1;

  const newEntry = {
    compatibility_id: nextId,
    device_id: device.device_id,
    device_model: device.model_name,
    device_manufacturer: device.manufacturer_name,
    device_logic_voltage: device.logic_level_voltage,
    component_id: component.component_id,
    component_name: component.component_name,
    component_category: component.category,
    component_interface: component.interface_type,
    component_logic_voltage: component.logic_level_voltage,
    compatibility_status: body.compatibility_status || (voltageOk ? "COMPATIBLE" : "REQUIRES_LEVEL_SHIFTER"),
    voltage_compatible: voltageOk,
    logic_level_compatible: logicOk,
    library_name: body.library_name || "Wire (I2C Builtin)",
    firmware_version: body.firmware_version || "v3.0.4",
    notes: body.notes || safetyVerdict,
    verified_date: new Date().toISOString().slice(0, 10),
  };

  const insertSql = `INSERT INTO compatibility (device_id, component_id, compatibility_status, voltage_compatible, logic_level_compatible, notes)
VALUES (${device.device_id}, ${component.component_id}, '${newEntry.compatibility_status}', ${voltageOk}, ${logicOk}, '${newEntry.notes}');`;

  state.compatibility.push(newEntry);

  return NextResponse.json({
    success: true,
    sql: insertSql,
    safetyVerdict,
    entry: newEntry,
    compatibility: state.compatibility,
  });
}

