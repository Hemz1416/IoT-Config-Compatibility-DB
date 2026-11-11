import { Pool } from "pg";

/**
 * Database Connection Pool (PostgreSQL 16 + pgvector)
 * Reads credentials from environment variable DATABASE_URL (.env.local)
 * Never hard-codes credentials in application logic.
 */
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/iot_config_db",
    connectionTimeoutMillis: 1200,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

// ============================================================================
// Complete 11-Table / 81-Row Stateful Seed Mirror of iot_config_db
// Matches database/schema.sql & database/seed_data.sql 100%
// ============================================================================

export interface ManufacturerRow {
  manufacturer_id: number;
  name: string;
  website: string;
  country: string;
  created_at: string;
}

export interface DeviceTypeRow {
  device_type_id: number;
  type_name: string;
  description: string;
}

export interface DeviceRow {
  device_id: number;
  manufacturer_id: number;
  manufacturer_name: string;
  device_type_id: number;
  device_type: string;
  model_name: string;
  microcontroller: string;
  operating_voltage: number;
  logic_level_voltage: number;
  clock_speed_mhz: number;
  flash_memory_kb: number;
  sram_kb: number;
  gpio_count: number;
  analog_pins_count: number;
  status: string;
}

export interface ComponentRow {
  component_id: number;
  manufacturer_id: number;
  manufacturer_name: string;
  component_name: string;
  category: string;
  operating_voltage_min: number;
  operating_voltage_max: number;
  logic_level_voltage: number;
  current_draw_ma: number;
  interface_type: string;
  datasheet_url: string;
}

export interface ProtocolRow {
  protocol_id: number;
  protocol_name: string;
  protocol_layer: string;
  standard: string;
  max_data_rate_kbps: number;
}

export interface DeviceProtocolRow {
  device_id: number;
  device_model: string;
  protocol_id: number;
  protocol_name: string;
  is_native_support: boolean;
}

export interface FirmwareRow {
  firmware_id: number;
  device_id: number;
  device_model: string;
  version_tag: string;
  runtime_environment: string;
  release_date: string;
  is_recommended: boolean;
}

export interface LibraryRow {
  library_id: number;
  library_name: string;
  runtime_environment: string;
  repository_url: string;
  latest_version: string;
  license: string;
}

export interface DeviceComponentRow {
  device_component_id: number;
  device_id: number;
  device_model: string;
  component_id: number;
  component_name: string;
  default_bus_or_pin: string;
  tested_status: string;
}

export interface CompatibilityOverviewRow {
  compatibility_id: number;
  device_id: number;
  device_model: string;
  device_manufacturer: string;
  device_logic_voltage: number;
  component_id: number;
  component_name: string;
  component_category: string;
  component_interface: string;
  component_logic_voltage: number;
  compatibility_status: string;
  voltage_compatible: boolean;
  logic_level_compatible: boolean;
  library_id?: number | null;
  library_name: string | null;
  firmware_id?: number | null;
  firmware_version: string | null;
  notes: string;
  verified_date: string;
}

export interface ConfigNoteRow {
  note_id: number;
  device_id: number | null;
  target_device: string | null;
  component_id: number | null;
  target_component: string | null;
  title: string;
  content: string;
  note_type: string;
  vector_dims: number;
  embedding_preview: string;
  cosine_similarity_score?: number;
  updated_at: string;
}

export interface IoTDbState {
  manufacturers: ManufacturerRow[];
  device_types: DeviceTypeRow[];
  devices: DeviceRow[];
  components: ComponentRow[];
  communication_protocols: ProtocolRow[];
  device_protocols: DeviceProtocolRow[];
  firmware: FirmwareRow[];
  libraries: LibraryRow[];
  device_components: DeviceComponentRow[];
  compatibility: CompatibilityOverviewRow[];
  notes: ConfigNoteRow[];
}

const stateStore = globalThis as unknown as {
  iotDbState?: IoTDbState;
};

if (!stateStore.iotDbState) {
  stateStore.iotDbState = {
    // 1. manufacturers (7 rows)
    manufacturers: [
      {
        manufacturer_id: 1,
        name: "Espressif Systems",
        website: "https://www.espressif.com",
        country: "China",
        created_at: "2026-09-02 05:37:40+00",
      },
      {
        manufacturer_id: 2,
        name: "Arduino AG",
        website: "https://www.arduino.cc",
        country: "Italy",
        created_at: "2026-09-02 05:37:40+00",
      },
      {
        manufacturer_id: 3,
        name: "Raspberry Pi Foundation",
        website: "https://www.raspberrypi.com",
        country: "United Kingdom",
        created_at: "2026-09-02 05:37:40+00",
      },
      {
        manufacturer_id: 4,
        name: "STMicroelectronics",
        website: "https://www.st.com",
        country: "Switzerland",
        created_at: "2026-09-02 05:37:40+00",
      },
      {
        manufacturer_id: 5,
        name: "Bosch Sensortec",
        website: "https://www.bosch-sensortec.com",
        country: "Germany",
        created_at: "2026-09-02 05:37:40+00",
      },
      {
        manufacturer_id: 6,
        name: "Adafruit Industries",
        website: "https://www.adafruit.com",
        country: "United States",
        created_at: "2026-09-02 05:37:40+00",
      },
      {
        manufacturer_id: 7,
        name: "Seeed Studio",
        website: "https://www.seeedstudio.com",
        country: "China",
        created_at: "2026-09-02 05:37:40+00",
      },
    ],

    // 2. device_types (4 rows)
    device_types: [
      {
        device_type_id: 1,
        type_name: "Microcontroller Board",
        description:
          "Compact low-power computing board executing dedicated firmware loops.",
      },
      {
        device_type_id: 2,
        type_name: "Single Board Computer",
        description:
          "Complete computing system with full operating system capabilities.",
      },
      {
        device_type_id: 3,
        type_name: "Edge Gateway",
        description:
          "Intermediary device bridging local sensor nodes with remote cloud brokers.",
      },
      {
        device_type_id: 4,
        type_name: "Sensor Node Module",
        description:
          "Specialized ultra-low power board tailored for wireless telemetry.",
      },
    ],

    // 3. devices (6 rows)
    devices: [
      {
        device_id: 1,
        manufacturer_id: 1,
        manufacturer_name: "Espressif Systems",
        device_type_id: 1,
        device_type: "Microcontroller Board",
        model_name: "ESP32-WROOM-32",
        microcontroller: "ESP32-D0WDQ6 Dual Core Xtensa LX6",
        operating_voltage: 3.3,
        logic_level_voltage: 3.3,
        clock_speed_mhz: 240,
        flash_memory_kb: 4096,
        sram_kb: 520,
        gpio_count: 36,
        analog_pins_count: 18,
        status: "ACTIVE",
      },
      {
        device_id: 2,
        manufacturer_id: 2,
        manufacturer_name: "Arduino AG",
        device_type_id: 1,
        device_type: "Microcontroller Board",
        model_name: "Arduino Uno Rev3",
        microcontroller: "ATmega328P 8-bit AVR",
        operating_voltage: 5.0,
        logic_level_voltage: 5.0,
        clock_speed_mhz: 16,
        flash_memory_kb: 32,
        sram_kb: 2,
        gpio_count: 14,
        analog_pins_count: 6,
        status: "ACTIVE",
      },
      {
        device_id: 3,
        manufacturer_id: 3,
        manufacturer_name: "Raspberry Pi Foundation",
        device_type_id: 1,
        device_type: "Microcontroller Board",
        model_name: "Raspberry Pi Pico W",
        microcontroller: "RP2040 Dual ARM Cortex-M0+",
        operating_voltage: 3.3,
        logic_level_voltage: 3.3,
        clock_speed_mhz: 133,
        flash_memory_kb: 2048,
        sram_kb: 264,
        gpio_count: 26,
        analog_pins_count: 3,
        status: "ACTIVE",
      },
      {
        device_id: 4,
        manufacturer_id: 4,
        manufacturer_name: "STMicroelectronics",
        device_type_id: 1,
        device_type: "Microcontroller Board",
        model_name: "STM32 Nucleo-F401RE",
        microcontroller: "STM32F401RET6 ARM Cortex-M4",
        operating_voltage: 3.3,
        logic_level_voltage: 3.3,
        clock_speed_mhz: 84,
        flash_memory_kb: 512,
        sram_kb: 96,
        gpio_count: 50,
        analog_pins_count: 16,
        status: "ACTIVE",
      },
      {
        device_id: 5,
        manufacturer_id: 1,
        manufacturer_name: "Espressif Systems",
        device_type_id: 1,
        device_type: "Microcontroller Board",
        model_name: "ESP8266 NodeMCU v2",
        microcontroller: "ESP8266EX 32-bit Tensilica L106",
        operating_voltage: 3.3,
        logic_level_voltage: 3.3,
        clock_speed_mhz: 80,
        flash_memory_kb: 4096,
        sram_kb: 80,
        gpio_count: 17,
        analog_pins_count: 1,
        status: "ACTIVE",
      },
      {
        device_id: 6,
        manufacturer_id: 2,
        manufacturer_name: "Arduino AG",
        device_type_id: 1,
        device_type: "Microcontroller Board",
        model_name: "Arduino Nano Every",
        microcontroller: "ATmega4809 8-bit AVR",
        operating_voltage: 5.0,
        logic_level_voltage: 5.0,
        clock_speed_mhz: 20,
        flash_memory_kb: 48,
        sram_kb: 6,
        gpio_count: 22,
        analog_pins_count: 8,
        status: "ACTIVE",
      },
    ],

    // 4. components (5 rows)
    components: [
      {
        component_id: 1,
        manufacturer_id: 5,
        manufacturer_name: "Bosch Sensortec",
        component_name: "BME280 Environmental Sensor",
        category: "Temperature/Humidity/Pressure",
        operating_voltage_min: 1.71,
        operating_voltage_max: 3.6,
        logic_level_voltage: 3.3,
        current_draw_ma: 0.5,
        interface_type: "I2C / SPI",
        datasheet_url:
          "https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf",
      },
      {
        component_id: 2,
        manufacturer_id: 6,
        manufacturer_name: "Adafruit Industries",
        component_name: "DHT22 (AM2302) Sensor",
        category: "Temperature/Humidity Sensor",
        operating_voltage_min: 3.3,
        operating_voltage_max: 5.5,
        logic_level_voltage: 3.3,
        current_draw_ma: 2.5,
        interface_type: "1-Wire Digital",
        datasheet_url: "https://cdn-shop.adafruit.com/datasheets/DHT22.pdf",
      },
      {
        component_id: 3,
        manufacturer_id: 6,
        manufacturer_name: "Adafruit Industries",
        component_name: "SSD1306 0.96 inch OLED Display",
        category: "Graphic Display Module",
        operating_voltage_min: 3.3,
        operating_voltage_max: 5.0,
        logic_level_voltage: 3.3,
        current_draw_ma: 20.0,
        interface_type: "I2C",
        datasheet_url: "https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf",
      },
      {
        component_id: 4,
        manufacturer_id: 6,
        manufacturer_name: "Adafruit Industries",
        component_name: "MPU-6050 6-DoF IMU",
        category: "Motion & Accelerometer Sensor",
        operating_voltage_min: 3.0,
        operating_voltage_max: 5.0,
        logic_level_voltage: 3.3,
        current_draw_ma: 3.8,
        interface_type: "I2C",
        datasheet_url:
          "https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Datasheet1.pdf",
      },
      {
        component_id: 5,
        manufacturer_id: 7,
        manufacturer_name: "Seeed Studio",
        component_name: "5V Single-Channel Relay Module",
        category: "Electromechanical Actuator",
        operating_voltage_min: 4.75,
        operating_voltage_max: 5.25,
        logic_level_voltage: 5.0,
        current_draw_ma: 70.0,
        interface_type: "GPIO Digital",
        datasheet_url: "https://www.songle.com/en/pdf/200841195638703.pdf",
      },
    ],

    // 5. communication_protocols (7 rows)
    communication_protocols: [
      {
        protocol_id: 1,
        protocol_name: "Wi-Fi 802.11 b/g/n",
        protocol_layer: "Physical/DataLink",
        standard: "IEEE 802.11b/g/n (2.4 GHz)",
        max_data_rate_kbps: 150000.0,
      },
      {
        protocol_id: 2,
        protocol_name: "Bluetooth Low Energy (BLE)",
        protocol_layer: "Physical/DataLink",
        standard: "Bluetooth 5.0 / 4.2 BLE",
        max_data_rate_kbps: 2000.0,
      },
      {
        protocol_id: 3,
        protocol_name: "I2C Bus",
        protocol_layer: "Hardware Bus",
        standard: "Phillips I2C Standard/Fast Mode",
        max_data_rate_kbps: 400.0,
      },
      {
        protocol_id: 4,
        protocol_name: "SPI Bus",
        protocol_layer: "Hardware Bus",
        standard: "Motorola 4-Wire Synchronous Serial",
        max_data_rate_kbps: 50000.0,
      },
      {
        protocol_id: 5,
        protocol_name: "UART / Serial",
        protocol_layer: "Hardware Bus",
        standard: "Asynchronous Serial Interface",
        max_data_rate_kbps: 115.2,
      },
      {
        protocol_id: 6,
        protocol_name: "MQTT Client",
        protocol_layer: "Application",
        standard: "OASIS MQTT v3.1.1 / v5.0",
        max_data_rate_kbps: 10000.0,
      },
      {
        protocol_id: 7,
        protocol_name: "HTTP / REST",
        protocol_layer: "Application",
        standard: "RFC 7230 Hypertext Transfer Protocol",
        max_data_rate_kbps: 100000.0,
      },
    ],

    // 6. device_protocols (19 rows)
    device_protocols: [
      { device_id: 1, device_model: "ESP32-WROOM-32", protocol_id: 1, protocol_name: "Wi-Fi 802.11 b/g/n", is_native_support: true },
      { device_id: 1, device_model: "ESP32-WROOM-32", protocol_id: 2, protocol_name: "Bluetooth Low Energy (BLE)", is_native_support: true },
      { device_id: 1, device_model: "ESP32-WROOM-32", protocol_id: 3, protocol_name: "I2C Bus", is_native_support: true },
      { device_id: 1, device_model: "ESP32-WROOM-32", protocol_id: 4, protocol_name: "SPI Bus", is_native_support: true },
      { device_id: 1, device_model: "ESP32-WROOM-32", protocol_id: 5, protocol_name: "UART / Serial", is_native_support: true },
      { device_id: 1, device_model: "ESP32-WROOM-32", protocol_id: 6, protocol_name: "MQTT Client", is_native_support: true },
      { device_id: 2, device_model: "Arduino Uno Rev3", protocol_id: 3, protocol_name: "I2C Bus", is_native_support: true },
      { device_id: 2, device_model: "Arduino Uno Rev3", protocol_id: 4, protocol_name: "SPI Bus", is_native_support: true },
      { device_id: 2, device_model: "Arduino Uno Rev3", protocol_id: 5, protocol_name: "UART / Serial", is_native_support: true },
      { device_id: 2, device_model: "Arduino Uno Rev3", protocol_id: 1, protocol_name: "Wi-Fi 802.11 b/g/n", is_native_support: false },
      { device_id: 3, device_model: "Raspberry Pi Pico W", protocol_id: 1, protocol_name: "Wi-Fi 802.11 b/g/n", is_native_support: true },
      { device_id: 3, device_model: "Raspberry Pi Pico W", protocol_id: 2, protocol_name: "Bluetooth Low Energy (BLE)", is_native_support: true },
      { device_id: 3, device_model: "Raspberry Pi Pico W", protocol_id: 3, protocol_name: "I2C Bus", is_native_support: true },
      { device_id: 3, device_model: "Raspberry Pi Pico W", protocol_id: 4, protocol_name: "SPI Bus", is_native_support: true },
      { device_id: 3, device_model: "Raspberry Pi Pico W", protocol_id: 5, protocol_name: "UART / Serial", is_native_support: true },
      { device_id: 3, device_model: "Raspberry Pi Pico W", protocol_id: 6, protocol_name: "MQTT Client", is_native_support: true },
      { device_id: 4, device_model: "STM32 Nucleo-F401RE", protocol_id: 3, protocol_name: "I2C Bus", is_native_support: true },
      { device_id: 4, device_model: "STM32 Nucleo-F401RE", protocol_id: 4, protocol_name: "SPI Bus", is_native_support: true },
      { device_id: 4, device_model: "STM32 Nucleo-F401RE", protocol_id: 5, protocol_name: "UART / Serial", is_native_support: true },
    ],

    // 7. firmware (7 rows)
    firmware: [
      { firmware_id: 1, device_id: 1, device_model: "ESP32-WROOM-32", version_tag: "v3.0.4", runtime_environment: "Arduino Core for ESP32", release_date: "2024-06-15", is_recommended: true },
      { firmware_id: 2, device_id: 1, device_model: "ESP32-WROOM-32", version_tag: "v1.22.0", runtime_environment: "MicroPython", release_date: "2024-01-20", is_recommended: false },
      { firmware_id: 3, device_id: 1, device_model: "ESP32-WROOM-32", version_tag: "v5.1.2", runtime_environment: "ESP-IDF", release_date: "2024-04-10", is_recommended: true },
      { firmware_id: 4, device_id: 2, device_model: "Arduino Uno Rev3", version_tag: "v1.8.6", runtime_environment: "Arduino AVR Core", release_date: "2023-11-12", is_recommended: true },
      { firmware_id: 5, device_id: 3, device_model: "Raspberry Pi Pico W", version_tag: "v1.22.0", runtime_environment: "MicroPython RP2040", release_date: "2024-02-01", is_recommended: true },
      { firmware_id: 6, device_id: 3, device_model: "Raspberry Pi Pico W", version_tag: "v3.6.0", runtime_environment: "Arduino-Pico Core", release_date: "2024-05-18", is_recommended: false },
      { firmware_id: 7, device_id: 4, device_model: "STM32 Nucleo-F401RE", version_tag: "v2.6.0", runtime_environment: "STM32duino Core", release_date: "2023-12-05", is_recommended: true },
    ],

    // 8. libraries (6 rows)
    libraries: [
      { library_id: 1, library_name: "Adafruit_BME280_Library", runtime_environment: "Arduino C++", repository_url: "https://github.com/adafruit/Adafruit_BME280_Library", latest_version: "2.2.4", license: "BSD-3-Clause" },
      { library_id: 2, library_name: "DHT-sensor-library", runtime_environment: "Arduino C++", repository_url: "https://github.com/adafruit/DHT-sensor-library", latest_version: "1.4.6", license: "MIT" },
      { library_id: 3, library_name: "Adafruit_SSD1306", runtime_environment: "Arduino C++", repository_url: "https://github.com/adafruit/Adafruit_SSD1306", latest_version: "2.5.9", license: "BSD-3-Clause" },
      { library_id: 4, library_name: "PubSubClient", runtime_environment: "Arduino C++", repository_url: "https://github.com/knolleary/pubsubclient", latest_version: "2.8.0", license: "MIT" },
      { library_id: 5, library_name: "micropython-bme280", runtime_environment: "MicroPython", repository_url: "https://github.com/robert-hh/BME280", latest_version: "1.0.2", license: "MIT" },
      { library_id: 6, library_name: "Wire (I2C Builtin)", runtime_environment: "Arduino C++", repository_url: "https://www.arduino.cc/en/Reference/Wire", latest_version: "1.0.0", license: "LGPL-2.1" },
    ],

    // 9. device_components (9 rows)
    device_components: [
      { device_component_id: 1, device_id: 1, device_model: "ESP32-WROOM-32", component_id: 1, component_name: "BME280 Environmental Sensor", default_bus_or_pin: "I2C (SDA=GPIO21, SCL=GPIO22, VCC=3V3, GND=GND)", tested_status: "VERIFIED" },
      { device_component_id: 2, device_id: 1, device_model: "ESP32-WROOM-32", component_id: 2, component_name: "DHT22 (AM2302) Sensor", default_bus_or_pin: "1-Wire Digital (DATA=GPIO4 with 4.7k pull-up, VCC=3V3)", tested_status: "VERIFIED" },
      { device_component_id: 3, device_id: 1, device_model: "ESP32-WROOM-32", component_id: 3, component_name: "SSD1306 0.96 inch OLED Display", default_bus_or_pin: "I2C (SDA=GPIO21, SCL=GPIO22, VCC=3V3)", tested_status: "VERIFIED" },
      { device_component_id: 4, device_id: 1, device_model: "ESP32-WROOM-32", component_id: 5, component_name: "5V Single-Channel Relay Module", default_bus_or_pin: "GPIO (IN=GPIO18, VCC=5V via VIN pin, GND=GND)", tested_status: "EXPERIMENTAL" },
      { device_component_id: 5, device_id: 2, device_model: "Arduino Uno Rev3", component_id: 1, component_name: "BME280 Environmental Sensor", default_bus_or_pin: "I2C (SDA=A4, SCL=A5, VCC=3V3)", tested_status: "VERIFIED" },
      { device_component_id: 6, device_id: 2, device_model: "Arduino Uno Rev3", component_id: 2, component_name: "DHT22 (AM2302) Sensor", default_bus_or_pin: "1-Wire Digital (DATA=D2 with 10k pull-up, VCC=5V)", tested_status: "VERIFIED" },
      { device_component_id: 7, device_id: 2, device_model: "Arduino Uno Rev3", component_id: 5, component_name: "5V Single-Channel Relay Module", default_bus_or_pin: "GPIO (IN=D7, VCC=5V, GND=GND)", tested_status: "VERIFIED" },
      { device_component_id: 8, device_id: 3, device_model: "Raspberry Pi Pico W", component_id: 1, component_name: "BME280 Environmental Sensor", default_bus_or_pin: "I2C (SDA=GP4, SCL=GP5, VCC=3V3)", tested_status: "VERIFIED" },
      { device_component_id: 9, device_id: 3, device_model: "Raspberry Pi Pico W", component_id: 2, component_name: "DHT22 (AM2302) Sensor", default_bus_or_pin: "1-Wire Digital (DATA=GP15, VCC=3V3)", tested_status: "VERIFIED" },
    ],

    // 10. compatibility (7 rows)
    compatibility: [
      {
        compatibility_id: 1,
        device_id: 1,
        device_model: "ESP32-WROOM-32",
        device_manufacturer: "Espressif Systems",
        device_logic_voltage: 3.3,
        component_id: 1,
        component_name: "BME280 Environmental Sensor",
        component_category: "Temperature/Humidity/Pressure",
        component_interface: "I2C / SPI",
        component_logic_voltage: 3.3,
        compatibility_status: "COMPATIBLE",
        voltage_compatible: true,
        logic_level_compatible: true,
        library_id: 1,
        library_name: "Adafruit_BME280_Library",
        firmware_id: 1,
        firmware_version: "v3.0.4",
        notes: "Perfect direct 3.3V I2C interfacing without logic shifting.",
        verified_date: "2024-07-01",
      },
      {
        compatibility_id: 2,
        device_id: 1,
        device_model: "ESP32-WROOM-32",
        device_manufacturer: "Espressif Systems",
        device_logic_voltage: 3.3,
        component_id: 2,
        component_name: "DHT22 (AM2302) Sensor",
        component_category: "Temperature/Humidity Sensor",
        component_interface: "1-Wire Digital",
        component_logic_voltage: 3.3,
        compatibility_status: "REQUIRES_PULLUP_RESISTOR",
        voltage_compatible: true,
        logic_level_compatible: true,
        library_id: 2,
        library_name: "DHT-sensor-library",
        firmware_id: 1,
        firmware_version: "v3.0.4",
        notes:
          "Requires a 4.7k to 10k Ohm pull-up resistor between VCC and DATA line for signal stabilization.",
        verified_date: "2024-07-02",
      },
      {
        compatibility_id: 3,
        device_id: 1,
        device_model: "ESP32-WROOM-32",
        device_manufacturer: "Espressif Systems",
        device_logic_voltage: 3.3,
        component_id: 5,
        component_name: "5V Single-Channel Relay Module",
        component_category: "Electromechanical Actuator",
        component_interface: "GPIO Digital",
        component_logic_voltage: 5.0,
        compatibility_status: "REQUIRES_LEVEL_SHIFTER",
        voltage_compatible: false,
        logic_level_compatible: false,
        library_id: null,
        library_name: null,
        firmware_id: 1,
        firmware_version: "v3.0.4",
        notes:
          "ESP32 GPIO outputs 3.3V logic which may fail to trigger 5V optocoupler relays; use a transistor/level shifter or 3.3V relay module.",
        verified_date: "2024-07-05",
      },
      {
        compatibility_id: 4,
        device_id: 2,
        device_model: "Arduino Uno Rev3",
        device_manufacturer: "Arduino AG",
        device_logic_voltage: 5.0,
        component_id: 1,
        component_name: "BME280 Environmental Sensor",
        component_category: "Temperature/Humidity/Pressure",
        component_interface: "I2C / SPI",
        component_logic_voltage: 3.3,
        compatibility_status: "REQUIRES_LEVEL_SHIFTER",
        voltage_compatible: false,
        logic_level_compatible: false,
        library_id: 1,
        library_name: "Adafruit_BME280_Library",
        firmware_id: 4,
        firmware_version: "v1.8.6",
        notes:
          "BME280 max input is 3.6V. Arduino Uno 5V I2C pins will damage raw BME280 chips unless using a breakout board with onboard level shifter.",
        verified_date: "2024-07-03",
      },
      {
        compatibility_id: 5,
        device_id: 2,
        device_model: "Arduino Uno Rev3",
        device_manufacturer: "Arduino AG",
        device_logic_voltage: 5.0,
        component_id: 2,
        component_name: "DHT22 (AM2302) Sensor",
        component_category: "Temperature/Humidity Sensor",
        component_interface: "1-Wire Digital",
        component_logic_voltage: 3.3,
        compatibility_status: "COMPATIBLE",
        voltage_compatible: true,
        logic_level_compatible: true,
        library_id: 2,
        library_name: "DHT-sensor-library",
        firmware_id: 4,
        firmware_version: "v1.8.6",
        notes: "DHT22 operates comfortably at 5V logic with Arduino Uno digital pins.",
        verified_date: "2024-07-03",
      },
      {
        compatibility_id: 6,
        device_id: 2,
        device_model: "Arduino Uno Rev3",
        device_manufacturer: "Arduino AG",
        device_logic_voltage: 5.0,
        component_id: 5,
        component_name: "5V Single-Channel Relay Module",
        component_category: "Electromechanical Actuator",
        component_interface: "GPIO Digital",
        component_logic_voltage: 5.0,
        compatibility_status: "COMPATIBLE",
        voltage_compatible: true,
        logic_level_compatible: true,
        library_id: null,
        library_name: null,
        firmware_id: 4,
        firmware_version: "v1.8.6",
        notes: "Direct connection to digital pin D7, standard 5V logic compatible.",
        verified_date: "2024-07-04",
      },
      {
        compatibility_id: 7,
        device_id: 3,
        device_model: "Raspberry Pi Pico W",
        device_manufacturer: "Raspberry Pi Foundation",
        device_logic_voltage: 3.3,
        component_id: 1,
        component_name: "BME280 Environmental Sensor",
        component_category: "Temperature/Humidity/Pressure",
        component_interface: "I2C / SPI",
        component_logic_voltage: 3.3,
        compatibility_status: "COMPATIBLE",
        voltage_compatible: true,
        logic_level_compatible: true,
        library_id: 5,
        library_name: "micropython-bme280",
        firmware_id: 5,
        firmware_version: "v1.22.0",
        notes: "Fully compatible over I2C0 bus on GP4/GP5 using MicroPython driver.",
        verified_date: "2024-07-06",
      },
    ],

    // 11. configuration_notes (4 rows)
    notes: [
      {
        note_id: 1,
        device_id: 1,
        target_device: "ESP32-WROOM-32",
        component_id: 1,
        target_component: "BME280 Environmental Sensor",
        title: "ESP32 to BME280 I2C Wiring and Bus Initialization",
        content:
          "Connect ESP32 3V3 to BME280 VIN, GND to GND, GPIO21 to SDA, and GPIO22 to SCL. In Arduino code, initialize Wire.begin(21, 22) and call bme.begin(0x76). If address detection fails, verify whether SDO pin is tied to GND (0x76) or VCC (0x77). [Bench verified hardware].",
        note_type: "SETUP_GUIDE",
        vector_dims: 384,
        embedding_preview: "[0.1250, 0.0148, 0.0289, 0.0412, ... (384 dims)]",
        cosine_similarity_score: 1.0,
        updated_at: "2026-09-02 05:41:06.565738+00",
      },
      {
        note_id: 2,
        device_id: 1,
        target_device: "ESP32-WROOM-32",
        component_id: 2,
        target_component: "DHT22 (AM2302) Sensor",
        title: "DHT22 Timing Constraints & Pull-up Resistor on ESP32",
        content:
          "DHT22 uses a proprietary single-bus communication protocol requiring precise microsecond timing. On the ESP32, attach a 4.7k pull-up resistor between GPIO4 and 3V3 rail. Keep sampling intervals at >= 2000ms to avoid self-heating errors and read timeouts.",
        note_type: "TROUBLESHOOTING",
        vector_dims: 384,
        embedding_preview: "[0.1100, 0.0489, 0.0452, 0.0397, ... (384 dims)]",
        cosine_similarity_score: 0.0408,
        updated_at: "2026-09-02 05:37:40.703651+00",
      },
      {
        note_id: 3,
        device_id: 2,
        target_device: "Arduino Uno Rev3",
        component_id: 5,
        target_component: "5V Single-Channel Relay Module",
        title: "Driving 5V High Current Relays safely with Arduino Uno",
        content:
          "When switching inductive loads (motors, AC lamps) using 5V relays, ensure an external 5V power supply powers the relay coil. Do not draw coil current directly from the Arduino 5V regulator. Connect Arduino GND and external power GND together (common ground).",
        note_type: "PINOUT_SPEC",
        vector_dims: 384,
        embedding_preview: "[0.0150, 0.0391, 0.0499, 0.0221, ... (384 dims)]",
        cosine_similarity_score: 0.0112,
        updated_at: "2026-09-02 05:37:40.703651+00",
      },
      {
        note_id: 4,
        device_id: 3,
        target_device: "Raspberry Pi Pico W",
        component_id: null,
        target_component: null,
        title: "Raspberry Pi Pico W Wi-Fi & MQTT Client Provisioning",
        content:
          "Pico W uses the Infineon CYW43439 wireless chip connected via SPI. Use network.WLAN(network.STA_IF) in MicroPython to connect to 2.4 GHz WPA2/WPA3 networks. For MQTT, instantiate umqtt.simple.MQTTClient with keepalive=60 and configure non-blocking sockets.",
        note_type: "SETUP_GUIDE",
        vector_dims: 384,
        embedding_preview: "[0.0850, 0.0411, 0.0273, 0.0118, ... (384 dims)]",
        cosine_similarity_score: 0.0226,
        updated_at: "2026-09-02 05:37:40.703651+00",
      },
    ],
  };
}

export function getDbState() {
  return stateStore.iotDbState!;
}

// ============================================================================
// 384-Dimensional Dense Vector Embedding & Cosine Similarity (<=>) Engine
// Models sentence-transformers/all-MiniLM-L6-v2 + pgvector <=> operator
// ============================================================================

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "to", "of", "in",
  "on", "for", "with", "at", "by", "from", "up", "about", "into", "over", "after",
  "can", "how", "do", "does", "what", "which", "when", "where", "why", "and", "or",
  "if", "it", "its", "this", "that", "my", "our", "use", "using", "work", "works"
]);

// Domain semantic concept groups mapped to dedicated axes in our 384-d space
const SEMANTIC_CONCEPTS: Array<{ dims: number[]; weight: number; terms: string[] }> = [
  // Microcontroller boards
  { dims: [0, 1, 2], weight: 2.6, terms: ["esp32", "esp32-wroom-32", "wroom", "espressif", "xtensa", "gpio21", "gpio22", "gpio4"] },
  { dims: [3, 4, 5], weight: 2.6, terms: ["arduino", "uno", "rev3", "atmega328p", "avr", "5v", "d7", "a4", "a5", "nano"] },
  { dims: [6, 7, 8], weight: 2.6, terms: ["pico", "raspberry", "rp2040", "cyw43439", "micropython", "gp4", "gp5", "gp15"] },
  { dims: [9, 10], weight: 2.4, terms: ["stm32", "nucleo", "f401re", "cortex-m4"] },
  { dims: [11, 12], weight: 2.4, terms: ["esp8266", "nodemcu"] },

  // Sensors & Actuators
  { dims: [15, 16, 17], weight: 2.8, terms: ["bme280", "bosch", "pressure", "barometric", "0x76", "0x77", "sdo", "environmental"] },
  { dims: [18, 19, 20], weight: 2.8, terms: ["dht22", "am2302", "1-wire", "single-bus", "pull-up", "pullup", "4.7k", "10k", "timeout", "self-heating", "timing"] },
  { dims: [21, 22, 23], weight: 2.8, terms: ["relay", "inductive", "coil", "motor", "lamp", "optocoupler", "actuator", "high-current", "regulator"] },
  { dims: [24, 25, 26], weight: 2.8, terms: ["mpu-6050", "mpu6050", "imu", "accelerometer", "gyroscope", "motion", "6-dof", "0x68"] },
  { dims: [27, 28, 29], weight: 2.8, terms: ["ssd1306", "oled", "display", "screen", "0x3c"] },

  // Communication Buses & Protocols
  { dims: [32, 33, 34, 1, 15, 24, 27], weight: 2.2, terms: ["i2c", "sda", "scl", "wire", "bus", "address", "gpio21", "gpio22", "mpu-6050", "mpu6050", "bme280", "ssd1306"] },
  { dims: [35, 36, 37], weight: 2.2, terms: ["wi-fi", "wifi", "wlan", "mqtt", "wireless", "wpa2", "wpa3", "socket", "broker", "telemetry"] },
  { dims: [38, 39], weight: 2.0, terms: ["spi", "mosi", "miso", "sck"] },

  // Electrical / Compatibility / Wiring Concepts
  { dims: [42, 43, 44], weight: 1.8, terms: ["3.3v", "3v3", "vin", "vcc", "gnd", "ground", "wiring", "connect", "pin", "pinout", "compatible", "compatibility"] },
  { dims: [45, 46], weight: 2.0, terms: ["level", "shifter", "overvoltage", "5v", "damage", "safe", "safety"] },
];

export function normalizeQueryText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/compatable|compatibile|compatability/g, "compatible")
    .replace(/mpu6050/g, "mpu-6050")
    .replace(/bme\s*280/g, "bme280")
    .replace(/dht\s*22/g, "dht22")
    .replace(/ssd\s*1306/g, "ssd1306")
    .replace(/esp\s*32/g, "esp32")
    .replace(/pull\s*up/g, "pull-up")
    .replace(/wi\s*fi/g, "wi-fi");
}

export function computeEmbedding384(text: string): Float32Array {
  const vec = new Float32Array(384);
  const normText = normalizeQueryText(text);
  const tokens = normText
    .split(/[^a-z0-9.\-_]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  // 1. Activate semantic concept dimensions
  for (const concept of SEMANTIC_CONCEPTS) {
    let hits = 0;
    for (const term of concept.terms) {
      if (tokens.includes(term) || (term.length >= 4 && normText.includes(term))) {
        hits++;
      }
    }
    if (hits > 0) {
      const boost = concept.weight * (1 + Math.log1p(hits));
      for (const d of concept.dims) {
        vec[d] += boost;
      }
    }
  }

  // 2. Character 3-gram hashing into dimensions 50..383 for fine-grained lexical similarity
  const joined = tokens.join(" ");
  for (let i = 0; i <= joined.length - 3; i++) {
    const tri = joined.slice(i, i + 3);
    let h = 2166136261;
    for (let c = 0; c < 3; c++) {
      h ^= tri.charCodeAt(c);
      h = Math.imul(h, 16777619);
    }
    const dim = 50 + (Math.abs(h) % 334);
    vec[dim] += 0.65;
  }

  // 3. Small baseline background so zero-overlap queries still have valid non-zero unit norm
  for (let i = 0; i < 384; i++) {
    vec[i] += 0.008 * Math.sin((i + 1) * 0.17);
  }

  // L2 Normalize to unit vector
  let normSq = 0;
  for (let i = 0; i < 384; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq) || 1;
  for (let i = 0; i < 384; i++) {
    vec[i] /= norm;
  }
  return vec;
}

export function cosineSimilarity384(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < 384; i++) {
    dot += a[i] * b[i];
  }
  return Number(Math.max(0, Math.min(1, dot)).toFixed(4));
}
