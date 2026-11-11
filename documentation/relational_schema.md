# Relational Schema & Data Dictionary

**Project Title:** IoT Device Configuration & Compatibility Database  
**Team Number:** 9  
**Students:**  
1. Hitha Shree Suresh (SRN: `PES2UG24CS196`)  
2. Hemant Ram Nelapati (SRN: `PES2UG24CS192`)  
**Database System:** PostgreSQL 16+ with `pgvector`

---

## 1. Summary of Tables

| # | Table Name | Purpose | Primary Key | Foreign Keys |
|---|------------|---------|-------------|--------------|
| 1 | `manufacturers` | Hardware vendors & component manufacturers | `manufacturer_id` | — |
| 2 | `device_types` | Categories of IoT compute boards | `device_type_id` | — |
| 3 | `devices` | IoT development boards and electrical specifications | `device_id` | `manufacturer_id`, `device_type_id` |
| 4 | `components` | Peripheral sensors, actuators, and display modules | `component_id` | `manufacturer_id` |
| 5 | `communication_protocols` | Hardware bus & networking protocol standards | `protocol_id` | — |
| 6 | `device_protocols` | Junction table (M:N) for devices and supported protocols | `(device_id, protocol_id)` | `device_id`, `protocol_id` |
| 7 | `firmware` | Firmware builds and operating runtime versions | `firmware_id` | `device_id` |
| 8 | `libraries` | Software drivers & SDK libraries for hardware interfacing | `library_id` | — |
| 9 | `device_components` | Physical wiring & pinout bus configurations | `device_component_id` | `device_id`, `component_id` |
| 10 | `compatibility` | Multi-dimensional compatibility evaluation matrix | `compatibility_id` | `device_id`, `component_id`, `library_id`, `firmware_id` |
| 11 | `configuration_notes` | Setup guides, troubleshooting & vector embeddings | `note_id` | `device_id`, `component_id` |

---

## 2. Table-by-Table Data Dictionary

### 2.1 Table: `manufacturers`
Stores organization details for hardware vendors and semiconductor companies.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `manufacturer_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the manufacturer |
| `name` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Name of the hardware company (e.g. Espressif, Arduino) |
| `website` | `VARCHAR(255)` | `NULL` | Official corporate/documentation website URL |
| `country` | `VARCHAR(100)` | `NULL` | Country of headquarters origin |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Timestamp of record creation |

---

### 2.2 Table: `device_types`
Categorizes devices into functional classes.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `device_type_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for device category |
| `type_name` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Name of type (e.g. 'Microcontroller Board', 'Edge Gateway') |
| `description` | `TEXT` | `NULL` | Functional summary of the device type |

---

### 2.3 Table: `devices`
Core IoT compute boards with electrical, memory, and pinout specifications.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `device_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the IoT board |
| `manufacturer_id` | `INT` | `NOT NULL, FK -> manufacturers(manufacturer_id) ON DELETE RESTRICT` | Referencing manufacturer |
| `device_type_id` | `INT` | `NOT NULL, FK -> device_types(device_type_id) ON DELETE RESTRICT` | Referencing classification category |
| `model_name` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Commercial board name (e.g. 'ESP32-WROOM-32') |
| `microcontroller` | `VARCHAR(100)` | `NULL` | Integrated core SoC (e.g. 'ESP32-D0WDQ6') |
| `operating_voltage` | `NUMERIC(4,2)` | `NOT NULL, CHECK (operating_voltage > 0 AND <= 48.0)` | Nominal supply voltage (V) |
| `logic_level_voltage` | `NUMERIC(4,2)` | `NOT NULL, CHECK (logic_level_voltage > 0 AND <= 12.0)` | GPIO logic HIGH voltage (e.g. 3.30V, 5.00V) |
| `clock_speed_mhz` | `INT` | `CHECK (clock_speed_mhz > 0)` | Processor clock frequency in MHz |
| `flash_memory_kb` | `INT` | `CHECK (flash_memory_kb >= 0)` | Total onboard non-volatile flash storage in KB |
| `sram_kb` | `INT` | `CHECK (sram_kb >= 0)` | Total static RAM in KB |
| `gpio_count` | `INT` | `NOT NULL, DEFAULT 0, CHECK (gpio_count >= 0)` | Number of general purpose I/O pins |
| `analog_pins_count` | `INT` | `NOT NULL, DEFAULT 0, CHECK (analog_pins_count >= 0)` | Number of ADC input channels |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE', CHECK (status IN ('ACTIVE','DISCONTINUED','DEPRECATED','PROTOTYPE'))` | Commercial lifecycle status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Record timestamp |

---

### 2.4 Table: `components`
Sensors, actuators, displays, and shields connected to IoT devices.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `component_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the peripheral |
| `manufacturer_id` | `INT` | `NULL, FK -> manufacturers(manufacturer_id) ON DELETE SET NULL` | Sensor chip / module vendor |
| `component_name` | `VARCHAR(100)` | `NOT NULL` | Part name (e.g. 'BME280 Environmental Sensor') |
| `category` | `VARCHAR(50)` | `NOT NULL` | Functional group (e.g. 'Temperature/Humidity Sensor') |
| `operating_voltage_min` | `NUMERIC(4,2)` | `NOT NULL, CHECK (operating_voltage_min > 0)` | Minimum operating voltage (V) |
| `operating_voltage_max` | `NUMERIC(4,2)` | `NOT NULL, CHECK (operating_voltage_max >= min)` | Maximum operating voltage (V) |
| `logic_level_voltage` | `NUMERIC(4,2)` | `NOT NULL, CHECK (logic_level_voltage > 0)` | Sensor digital interface logic voltage |
| `current_draw_ma` | `NUMERIC(6,2)` | `NULL, CHECK (current_draw_ma >= 0)` | Typical active current consumption in mA |
| `interface_type` | `VARCHAR(50)` | `NOT NULL` | Electrical bus (e.g. 'I2C', 'SPI', '1-Wire Digital') |
| `datasheet_url` | `VARCHAR(255)` | `NULL (Added via ALTER TABLE DDL)` | Official manufacturer PDF datasheet URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Record timestamp |

---

### 2.5 Table: `communication_protocols`
Defines communication protocols and hardware bus standards.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `protocol_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for protocol |
| `protocol_name` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Standard name (e.g. 'Wi-Fi 802.11 b/g/n', 'MQTT Client') |
| `protocol_layer` | `VARCHAR(30)` | `NOT NULL, CHECK (protocol_layer IN ('Physical/DataLink','Network/Transport','Application','Hardware Bus'))` | Protocol stack layer |
| `standard` | `VARCHAR(100)` | `NULL` | Specification identifier (e.g. 'IEEE 802.11b/g/n') |
| `max_data_rate_kbps` | `NUMERIC(10,2)` | `NULL, CHECK (max_data_rate_kbps > 0)` | Maximum throughput in kbps |

---

### 2.6 Table: `device_protocols`
Junction table resolving the Many-to-Many relationship between `devices` and `communication_protocols`.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `device_id` | `INT` | `NOT NULL, PK, FK -> devices(device_id) ON DELETE CASCADE` | Associated IoT board |
| `protocol_id` | `INT` | `NOT NULL, PK, FK -> communication_protocols(protocol_id) ON DELETE RESTRICT` | Supported protocol |
| `is_native_support` | `BOOLEAN` | `NOT NULL, DEFAULT true` | `TRUE` if built-in SoC hardware, `FALSE` if shield/module |

---

### 2.7 Table: `firmware`
Firmware builds, SDK runtimes, and OS platforms for IoT boards.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `firmware_id` | `SERIAL` | `PRIMARY KEY` | Unique firmware release ID |
| `device_id` | `INT` | `NOT NULL, FK -> devices(device_id) ON DELETE CASCADE` | Target board |
| `version_tag` | `VARCHAR(50)` | `NOT NULL` | SemVer tag (e.g. 'v3.0.4', 'v1.22.0') |
| `runtime_environment` | `VARCHAR(50)` | `NOT NULL` | Runtime platform (e.g. 'MicroPython', 'Arduino C++') |
| `release_date` | `DATE` | `NOT NULL` | Release date |
| `is_recommended` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Recommended stable production release indicator |

*Composite Unique Constraint:* `UNIQUE (device_id, version_tag, runtime_environment)`

---

### 2.8 Table: `libraries`
Software driver packages and libraries required to operate sensors or protocols.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `library_id` | `SERIAL` | `PRIMARY KEY` | Unique library ID |
| `library_name` | `VARCHAR(100)` | `NOT NULL` | Package name (e.g. 'Adafruit_BME280_Library') |
| `runtime_environment` | `VARCHAR(50)` | `NOT NULL` | Framework (e.g. 'Arduino C++', 'MicroPython') |
| `repository_url` | `VARCHAR(255)` | `NULL` | GitHub / Git repository URL |
| `latest_version` | `VARCHAR(30)` | `NOT NULL` | Current stable package version |
| `license` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'MIT'` | Open source license identifier |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Record timestamp |

*Composite Unique Constraint:* `UNIQUE (library_name, runtime_environment)`

---

### 2.9 Table: `device_components`
Physical pinout and bus connection wiring mapping between devices and components.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `device_component_id` | `SERIAL` | `PRIMARY KEY` | Unique wiring configuration ID |
| `device_id` | `INT` | `NOT NULL, FK -> devices(device_id) ON DELETE CASCADE` | Target board |
| `component_id` | `INT` | `NOT NULL, FK -> components(component_id) ON DELETE CASCADE` | Attached sensor/module |
| `default_bus_or_pin` | `VARCHAR(100)` | `NOT NULL` | Pin definition (e.g. 'I2C (SDA=GPIO21, SCL=GPIO22)') |
| `tested_status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'VERIFIED', CHECK (tested_status IN ('VERIFIED','EXPERIMENTAL','UNTESTED','FAILED'))` | Hardware validation status |

*Composite Unique Constraint:* `UNIQUE (device_id, component_id)`

---

### 2.10 Table: `compatibility`
Multi-dimensional compatibility evaluation between devices, components, firmware, and libraries.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `compatibility_id` | `SERIAL` | `PRIMARY KEY` | Unique compatibility evaluation ID |
| `device_id` | `INT` | `NOT NULL, FK -> devices(device_id) ON DELETE CASCADE` | Evaluated device |
| `component_id` | `INT` | `NOT NULL, FK -> components(component_id) ON DELETE CASCADE` | Evaluated peripheral component |
| `library_id` | `INT` | `NULL, FK -> libraries(library_id) ON DELETE SET NULL` | Required driver library |
| `firmware_id` | `INT` | `NULL, FK -> firmware(firmware_id) ON DELETE SET NULL` | Evaluated firmware runtime |
| `compatibility_status` | `VARCHAR(30)` | `NOT NULL, CHECK (compatibility_status IN ('COMPATIBLE','INCOMPATIBLE','REQUIRES_LEVEL_SHIFTER','REQUIRES_PULLUP_RESISTOR','DEGRADED_FUNCTION'))` | Compatibility outcome classification |
| `voltage_compatible` | `BOOLEAN` | `NOT NULL` | Electrical power rail compatibility flag |
| `logic_level_compatible` | `BOOLEAN` | `NOT NULL` | GPIO logic voltage matching flag |
| `notes` | `TEXT` | `NULL` | Engineering remarks & hardware caveats |
| `verified_date` | `DATE` | `NOT NULL, DEFAULT CURRENT_DATE` | Date of bench verification |

*Composite Unique Constraint:* `UNIQUE (device_id, component_id, library_id, firmware_id)`

---

### 2.11 Table: `configuration_notes` (Vector Database Integration)
Unstructured technical documentation, setup guides, and troubleshooting notes indexed with `pgvector`.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `note_id` | `SERIAL` | `PRIMARY KEY` | Unique note ID |
| `device_id` | `INT` | `NULL, FK -> devices(device_id) ON DELETE CASCADE` | Linked device (if device-specific) |
| `component_id` | `INT` | `NULL, FK -> components(component_id) ON DELETE CASCADE` | Linked component (if component-specific) |
| `title` | `VARCHAR(150)` | `NOT NULL` | Descriptive guide title |
| `content` | `TEXT` | `NOT NULL` | Full technical markdown text to be embedded |
| `note_type` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'SETUP_GUIDE', CHECK (note_type IN ('SETUP_GUIDE','TROUBLESHOOTING','PINOUT_SPEC','CALIBRATION','WORKAROUND'))` | Document functional classification |
| `embedding` | `vector(384)` | `pgvector Type` | 384-dimensional dense vector embedding (targeted for `all-MiniLM-L6-v2`; populated with deterministic unit-norm vectors for zero-dependency offline lab execution) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Last update timestamp (automatically maintained via trigger) |

---

## 3. Database Triggers & Functions (Advanced Feature)

### `trg_config_notes_updated_at`
- **Target Table:** `configuration_notes`
- **Timing / Event:** `BEFORE UPDATE ON configuration_notes FOR EACH ROW`
- **Trigger Function:** `fn_update_config_notes_timestamp()`
- **Logic:** Sets `NEW.updated_at = CURRENT_TIMESTAMP` before write commit, guaranteeing automated auditing for vector note modifications.

---

## 4. Relational Views (Advanced Feature)

1. **`v_device_compatibility_overview`**: Joins `compatibility`, `devices`, `manufacturers`, `components`, `libraries`, and `firmware` to provide an instant, readable hardware compatibility report.
2. **`v_device_protocol_summary`**: Aggregates supported communication protocols per board using `STRING_AGG()` and `COUNT()`.
3. **`v_active_devices_catalog`**: Pre-filtered catalog of active IoT boards and hardware specifications.
