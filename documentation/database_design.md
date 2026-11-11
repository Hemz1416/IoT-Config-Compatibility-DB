# Database Design Document

**Project Title:** IoT Device Configuration & Compatibility Database  
**Team Number:** 9  
**Students:**  
1. Hitha Shree Suresh (SRN: `PES2UG24CS196`)  
2. Hemant Ram Nelapati (SRN: `PES2UG24CS192`)  
**Database System:** PostgreSQL 16+ with `pgvector`  

---

## 1. Problem Domain & Motivation
The rapid expansion of the Internet of Things (IoT) ecosystem has led to a fragmented landscape of microcontrollers (e.g., ESP32, Arduino, Raspberry Pi Pico, STM32), operating voltages (1.8V, 3.3V, 5.0V), communication buses (I2C, SPI, UART, 1-Wire), wireless standards (Wi-Fi, BLE, Zigbee, LoRa, MQTT), runtime frameworks (Arduino C++, MicroPython, Zephyr, FreeRTOS), and peripheral driver libraries.

Engineers and hobbyists frequently face hardware incompatibility issues, voltage mismatch damage (e.g., connecting a 5V Uno to a 3.3V BME280 without a level shifter), and hours of manual debugging due to dispersed documentation.

**Objective:** This database provides a centralized, normalized relational foundation combined with vector semantic search to model IoT hardware specifications, evaluate electrical/firmware compatibility, and enable intelligent semantic discovery of technical configuration notes and setup guides.

---

## 2. Why PostgreSQL & pgvector?
- **PostgreSQL 16:** Provides enterprise-grade relational modeling with strict ACID compliance, robust constraint checks, expressive composite foreign keys, customizable indexing, and rich view support.
- **pgvector Extension:** Bridges relational data and AI semantic search inside a unified database instance. It enables high-speed nearest-neighbor vector search directly via SQL using cosine distance (`<=>`), eliminating the operational complexity of running separate vector database servers.

---

## 3. Structured Data Stored (Relational SQL Component)
The relational schema manages 11 structured tables in Third Normal Form (3NF):
1. **`manufacturers`**: Hardware vendors and component suppliers.
2. **`device_types`**: Device categories (Microcontroller, Single Board Computer, Edge Gateway).
3. **`devices`**: Compute boards, SoCs, clock speeds, flash/SRAM capacities, GPIO pin counts, logic levels, and operating voltages.
4. **`components`**: Peripheral sensors, actuators, displays, operating voltage envelopes, interfaces, and datasheet documentation URLs.
5. **`communication_protocols`**: Bus and networking protocols across hardware, transport, and application layers.
6. **`device_protocols`**: Many-to-Many junction table resolving protocol support per device.
7. **`firmware`**: Supported OS environments, firmware version tags, and recommendation flags.
8. **`libraries`**: Hardware driver packages, software licenses, repository URLs, and framework bindings.
9. **`device_components`**: Physical wiring, bus allocations, and tested pin mappings.
10. **`compatibility`**: Multi-dimensional matrix determining compatibility status (`COMPATIBLE`, `REQUIRES_LEVEL_SHIFTER`, `REQUIRES_PULLUP_RESISTOR`, `INCOMPATIBLE`, `DEGRADED_FUNCTION`), logic level compatibility, and engineering notes.
11. **`configuration_notes`**: Technical guides, wiring tutorials, and troubleshooting docs with vector embeddings.

---

## 4. Vector Database Relevance & Semantic Search Architecture
Traditional SQL queries excel at exact filtering (e.g., `WHERE flash_memory_kb >= 2048 AND operating_voltage = 3.30`). However, developers often query using natural language (e.g., *"How do I wire a 3.3V temperature sensor to ESP32 without frying it?"* or *"Pico W MQTT client keepalive setup"*).

### Semantic Embedding Strategy & Implementation Details:
- **Target Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense vector embeddings from note `title` and `content`.
- **Storage:** Stored in the `embedding vector(384)` column of `configuration_notes`.
- **Indexing:** Indexed using PostgreSQL's Hierarchical Navigable Small World (**HNSW**) vector index with cosine similarity operator class (`vector_cosine_ops`, `m = 16`, `ef_construction = 64`).
- **Seed Data Generation & Offline Reproducibility:** To ensure zero-dependency, fully offline, and deterministic evaluation in university DBMS lab environments (without requiring external network downloads or PyTorch/transformers runtime packages), the seed data script (`seed_data.sql`) generates normalized, unit-length 384-dimensional test vectors directly via a PL/pgSQL mathematical routine. In a production pipeline, this column is populated via inference from `all-MiniLM-L6-v2`.
- **Retrieval:** Executed directly in SQL via cosine distance queries:
  ```sql
  WITH query_vector AS (
      SELECT embedding FROM configuration_notes WHERE note_id = 1
  )
  SELECT 
      cn.note_id,
      d.model_name AS target_device,
      cn.title,
      ROUND((1 - (cn.embedding <=> qv.embedding))::numeric, 4) AS cosine_similarity_score,
      cn.content
  FROM configuration_notes cn
  CROSS JOIN query_vector qv
  LEFT JOIN devices d ON cn.device_id = d.device_id
  ORDER BY cn.embedding <=> qv.embedding
  LIMIT 3;
  ```

---

## 5. Normalization & Relational Integrity (3NF / BCNF)
- **1NF (Atomic Attributes):** All column values are atomic (e.g., protocol names and pinouts are modeled as dedicated rows rather than comma-separated strings).
- **2NF (No Partial Dependencies):** Composite key junction tables (`device_protocols` on `(device_id, protocol_id)`) only contain attributes dependent on the complete key (`is_native_support`).
- **3NF (No Transitive Dependencies):** Manufacturer metadata is decoupled into `manufacturers`, firmware into `firmware`, and categories into `device_types`. No non-key column depends on another non-key column.

---

## 6. Constraints & Domain Validation (17 CHECK, 8 UNIQUE, 14 FK, 11 PK)
The database enforces rigorous relational integrity through 50 constraints cataloged in PostgreSQL:

- **17 Named Domain CHECK Constraints:**
  - `chk_devices_operating_voltage`: `operating_voltage > 0 AND operating_voltage <= 48.0`
  - `chk_devices_logic_level_voltage`: `logic_level_voltage > 0 AND logic_level_voltage <= 12.0`
  - `chk_devices_clock_speed`: `clock_speed_mhz IS NULL OR clock_speed_mhz > 0`
  - `chk_devices_flash_memory`: `flash_memory_kb IS NULL OR flash_memory_kb >= 0`
  - `chk_devices_sram`: `sram_kb IS NULL OR sram_kb >= 0`
  - `chk_devices_gpio_count`: `gpio_count >= 0`
  - `chk_devices_analog_pins`: `analog_pins_count >= 0`
  - `chk_devices_status`: `status IN ('ACTIVE', 'DISCONTINUED', 'DEPRECATED', 'PROTOTYPE')`
  - `chk_components_voltage_min`: `operating_voltage_min > 0`
  - `chk_components_voltage_max`: `operating_voltage_max >= operating_voltage_min`
  - `chk_components_logic_level`: `logic_level_voltage > 0` *(enforces positive voltage without artificial upper bound)*
  - `chk_components_current_draw`: `current_draw_ma IS NULL OR current_draw_ma >= 0`
  - `chk_protocols_layer`: `protocol_layer IN ('Physical/DataLink', 'Network/Transport', 'Application', 'Hardware Bus')`
  - `chk_protocols_data_rate`: `max_data_rate_kbps IS NULL OR max_data_rate_kbps > 0`
  - `chk_device_components_status`: `tested_status IN ('VERIFIED', 'EXPERIMENTAL', 'UNTESTED', 'FAILED')`
  - `chk_compatibility_status`: `compatibility_status IN ('COMPATIBLE', 'INCOMPATIBLE', 'REQUIRES_LEVEL_SHIFTER', 'REQUIRES_PULLUP_RESISTOR', 'DEGRADED_FUNCTION')`
  - `chk_config_notes_type`: `note_type IN ('SETUP_GUIDE', 'TROUBLESHOOTING', 'PINOUT_SPEC', 'CALIBRATION', 'WORKAROUND')`

- **8 Named / Natural UNIQUE Constraints:**
  - `manufacturers_name_key`: `UNIQUE (name)` on `manufacturers`
  - `device_types_type_name_key`: `UNIQUE (type_name)` on `device_types`
  - `devices_model_name_key`: `UNIQUE (model_name)` on `devices`
  - `communication_protocols_protocol_name_key`: `UNIQUE (protocol_name)` on `communication_protocols`
  - `uq_firmware_device_version_runtime`: `UNIQUE (device_id, version_tag, runtime_environment)` on `firmware`
  - `uq_libraries_name_runtime`: `UNIQUE (library_name, runtime_environment)` on `libraries`
  - `uq_device_components_pair`: `UNIQUE (device_id, component_id)` on `device_components`
  - `uq_compatibility_matrix`: `UNIQUE (device_id, component_id, library_id, firmware_id)` on `compatibility`

- **Exact Referential Integrity Actions (14 Foreign Keys):**
  - `ON DELETE SET NULL`: Applied to `components.manufacturer_id` (so components persist if vendor is archived), `compatibility.library_id`, and `compatibility.firmware_id` (preserves hardware bench tests even if a specific driver/firmware build is removed).
  - `ON DELETE RESTRICT`: Applied to `devices.manufacturer_id`, `devices.device_type_id`, and `device_protocols.protocol_id` (prevents deleting active hardware manufacturers, types, or protocols while boards reference them).
  - `ON DELETE CASCADE`: Applied to strictly dependent child entities: `device_protocols.device_id`, `firmware.device_id`, `device_components.device_id`, `device_components.component_id`, `compatibility.device_id`, `compatibility.component_id`, `configuration_notes.device_id`, and `configuration_notes.component_id`.

---

## 7. Advanced Database Features Implemented (4 Concepts)

1. **Analytical Views (3 Views):**
   - `v_device_compatibility_overview`: Multi-table join (6 tables) with electrical and software compatibility evaluations.
   - `v_device_protocol_summary`: Aggregates protocols per device with `STRING_AGG()` and `COUNT()`.
   - `v_active_devices_catalog`: Filtered production device catalog.
2. **Indexing Strategy (15 Explicit Indexes, 34 Total Catalog Indexes):**
   - **14 Explicit B-Tree Indexes:** Accelerate foreign-key joins and filtering on `devices(manufacturer_id, device_type_id, model_name)`, `components(manufacturer_id, category, interface_type)`, `device_protocols(protocol_id)`, `firmware(device_id)`, `libraries(runtime_environment)`, `compatibility(device_id, component_id, compatibility_status)`, and `configuration_notes(device_id, component_id)`.
   - **1 Explicit HNSW Vector Index:** `idx_config_notes_embedding_hnsw` on `configuration_notes USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)` for sub-millisecond approximate nearest neighbor semantic search.
   - **19 Implicit Constraint Indexes:** Automatically generated by PostgreSQL to enforce 11 Primary Keys and 8 Unique constraints.
   - **Catalog Total:** 34 indexes active in `pg_indexes`.
3. **Automated Auditing Triggers & Stored Functions:**
   - `trg_config_notes_updated_at` fires `BEFORE UPDATE` on `configuration_notes` executing `fn_update_config_notes_timestamp()` to keep documentation timestamps in sync automatically.
4. **Vector Database Semantic Search:**
   - Unified AI semantic similarity search powered by `pgvector` and dense 384d sentence embeddings.

---

## 8. Explanation of the ER Diagram
The ER Diagram visually maps conceptual entities, attributes, and cardinalities:
- **1 : N (One-to-Many):** `MANUFACTURERS` produces `DEVICES` and `COMPONENTS`. `DEVICE_TYPES` categorizes `DEVICES`. `DEVICES` runs `FIRMWARE`.
- **M : N (Many-to-Many):**
  - `DEVICES` and `COMMUNICATION_PROTOCOLS` resolved via `DEVICE_PROTOCOLS`.
  - `DEVICES` and `COMPONENTS` resolved via `DEVICE_COMPONENTS`.
- **Multi-Way Associative Entity:** `COMPATIBILITY` connects `DEVICES`, `COMPONENTS`, `LIBRARIES`, and `FIRMWARE` with verification flags.
- **Vector Extension Entity:** `CONFIGURATION_NOTES` links optionally to devices/components and encapsulates the `vector(384)` semantic embedding.

---

## 9. Explanation of the Schema Diagram
The Relational Schema Diagram translates the conceptual model into the physical PostgreSQL implementation:
- Displays all 11 tables with exact PostgreSQL data types (`SERIAL`, `VARCHAR`, `NUMERIC`, `BOOLEAN`, `TIMESTAMPTZ`, `vector(384)`).
- Depicts Primary Keys (`[PK]`), Foreign Keys (`[FK]`), and Composite Primary Keys (`[PFK]`).
- Directional relationship arrows connect each Foreign Key child column directly to its corresponding Primary Key parent table.
