-- ============================================================================
-- DBMS Experiential Learning - Level 3 Mini-Project
-- Team Number : 9
-- Project Title: IoT Device Configuration & Compatibility Database
-- Students    : 1. Hitha Shree Suresh (SRN: PES2UG24CS196)
--               2. Hemant Ram Nelapati (SRN: PES2UG24CS192)
-- Database    : PostgreSQL 16+ with pgvector
-- File        : 9_DDL.sql (Academic Submission Copy of DDL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Cleanup for Clean Re-execution (Idempotent Setup)
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_device_compatibility_overview CASCADE;
DROP VIEW IF EXISTS v_device_protocol_summary CASCADE;
DROP VIEW IF EXISTS v_active_devices_catalog CASCADE;

DROP TRIGGER IF EXISTS trg_config_notes_updated_at ON configuration_notes;
DROP FUNCTION IF EXISTS fn_update_config_notes_timestamp() CASCADE;

DROP TABLE IF EXISTS configuration_notes CASCADE;
DROP TABLE IF EXISTS compatibility CASCADE;
DROP TABLE IF EXISTS device_components CASCADE;
DROP TABLE IF EXISTS libraries CASCADE;
DROP TABLE IF EXISTS firmware CASCADE;
DROP TABLE IF EXISTS device_protocols CASCADE;
DROP TABLE IF EXISTS communication_protocols CASCADE;
DROP TABLE IF EXISTS components CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS device_types CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;

-- ----------------------------------------------------------------------------
-- 0. Vector Database Extension Setup (pgvector)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 1. Table: manufacturers
-- Stores hardware vendors and component manufacturers.
-- ----------------------------------------------------------------------------
CREATE TABLE manufacturers (
    manufacturer_id   SERIAL PRIMARY KEY,
    name              VARCHAR(100) NOT NULL UNIQUE,
    website           VARCHAR(255),
    country           VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Table: device_types
-- Categorizes IoT devices (Microcontroller, SBC, Sensor Module, Gateway, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE device_types (
    device_type_id    SERIAL PRIMARY KEY,
    type_name         VARCHAR(50) NOT NULL UNIQUE,
    description       TEXT
);

-- ----------------------------------------------------------------------------
-- 3. Table: devices
-- Core IoT development boards and processing units with electrical and compute specs.
-- ----------------------------------------------------------------------------
CREATE TABLE devices (
    device_id            SERIAL PRIMARY KEY,
    manufacturer_id      INT NOT NULL,
    device_type_id       INT NOT NULL,
    model_name           VARCHAR(100) NOT NULL UNIQUE,
    microcontroller      VARCHAR(100),
    operating_voltage    NUMERIC(4,2) NOT NULL,
    logic_level_voltage  NUMERIC(4,2) NOT NULL,
    clock_speed_mhz      INT,
    flash_memory_kb      INT,
    sram_kb              INT,
    gpio_count           INT NOT NULL DEFAULT 0,
    analog_pins_count    INT NOT NULL DEFAULT 0,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_devices_manufacturer
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(manufacturer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_devices_device_type
        FOREIGN KEY (device_type_id) REFERENCES device_types(device_type_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Domain & Check Constraints
    CONSTRAINT chk_devices_operating_voltage
        CHECK (operating_voltage > 0 AND operating_voltage <= 48.0),
    CONSTRAINT chk_devices_logic_level_voltage
        CHECK (logic_level_voltage > 0 AND logic_level_voltage <= 12.0),
    CONSTRAINT chk_devices_clock_speed
        CHECK (clock_speed_mhz IS NULL OR clock_speed_mhz > 0),
    CONSTRAINT chk_devices_flash_memory
        CHECK (flash_memory_kb IS NULL OR flash_memory_kb >= 0),
    CONSTRAINT chk_devices_sram
        CHECK (sram_kb IS NULL OR sram_kb >= 0),
    CONSTRAINT chk_devices_gpio_count
        CHECK (gpio_count >= 0),
    CONSTRAINT chk_devices_analog_pins
        CHECK (analog_pins_count >= 0),
    CONSTRAINT chk_devices_status
        CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'DEPRECATED', 'PROTOTYPE'))
);

-- ----------------------------------------------------------------------------
-- 4. Table: components
-- Peripheral sensors, actuators, displays, and shields attached to IoT devices.
-- ----------------------------------------------------------------------------
CREATE TABLE components (
    component_id           SERIAL PRIMARY KEY,
    manufacturer_id        INT,
    component_name         VARCHAR(100) NOT NULL,
    category               VARCHAR(50) NOT NULL,
    operating_voltage_min  NUMERIC(4,2) NOT NULL,
    operating_voltage_max  NUMERIC(4,2) NOT NULL,
    logic_level_voltage    NUMERIC(4,2) NOT NULL,
    current_draw_ma        NUMERIC(6,2),
    interface_type         VARCHAR(50) NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_components_manufacturer
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(manufacturer_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    -- Check Constraints
    CONSTRAINT chk_components_voltage_min
        CHECK (operating_voltage_min > 0),
    CONSTRAINT chk_components_voltage_max
        CHECK (operating_voltage_max >= operating_voltage_min),
    CONSTRAINT chk_components_logic_level
        CHECK (logic_level_voltage > 0),
    CONSTRAINT chk_components_current_draw
        CHECK (current_draw_ma IS NULL OR current_draw_ma >= 0)
);

-- ----------------------------------------------------------------------------
-- DDL Schema Evolution: ALTER TABLE Demonstration
-- Adds official datasheet documentation URL column to components table.
-- ----------------------------------------------------------------------------
ALTER TABLE components ADD COLUMN datasheet_url VARCHAR(255);

-- ----------------------------------------------------------------------------
-- 5. Table: communication_protocols
-- Hardware bus standards, network protocols, and IoT application protocols.
-- ----------------------------------------------------------------------------
CREATE TABLE communication_protocols (
    protocol_id          SERIAL PRIMARY KEY,
    protocol_name        VARCHAR(50) NOT NULL UNIQUE,
    protocol_layer       VARCHAR(30) NOT NULL,
    standard             VARCHAR(100),
    max_data_rate_kbps   NUMERIC(10,2),

    -- Check Constraints
    CONSTRAINT chk_protocols_layer
        CHECK (protocol_layer IN ('Physical/DataLink', 'Network/Transport', 'Application', 'Hardware Bus')),
    CONSTRAINT chk_protocols_data_rate
        CHECK (max_data_rate_kbps IS NULL OR max_data_rate_kbps > 0)
);

-- ----------------------------------------------------------------------------
-- 6. Table: device_protocols
-- Junction table resolving Many-to-Many relationship between Devices and Protocols.
-- ----------------------------------------------------------------------------
CREATE TABLE device_protocols (
    device_id            INT NOT NULL,
    protocol_id          INT NOT NULL,
    is_native_support    BOOLEAN NOT NULL DEFAULT TRUE,

    -- Composite Primary Key
    PRIMARY KEY (device_id, protocol_id),

    -- Foreign Key Constraints
    CONSTRAINT fk_device_protocols_device
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_device_protocols_protocol
        FOREIGN KEY (protocol_id) REFERENCES communication_protocols(protocol_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- 7. Table: firmware
-- Firmware and runtime environments available for IoT devices.
-- ----------------------------------------------------------------------------
CREATE TABLE firmware (
    firmware_id          SERIAL PRIMARY KEY,
    device_id            INT NOT NULL,
    version_tag          VARCHAR(50) NOT NULL,
    runtime_environment  VARCHAR(50) NOT NULL,
    release_date         DATE NOT NULL,
    is_recommended       BOOLEAN NOT NULL DEFAULT FALSE,

    -- Foreign Key Constraint
    CONSTRAINT fk_firmware_device
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- Unique Constraint
    CONSTRAINT uq_firmware_device_version_runtime
        UNIQUE (device_id, version_tag, runtime_environment)
);

-- ----------------------------------------------------------------------------
-- 8. Table: libraries
-- Software driver packages and SDK libraries for interfacing components/protocols.
-- ----------------------------------------------------------------------------
CREATE TABLE libraries (
    library_id           SERIAL PRIMARY KEY,
    library_name         VARCHAR(100) NOT NULL,
    runtime_environment  VARCHAR(50) NOT NULL,
    repository_url       VARCHAR(255),
    latest_version       VARCHAR(30) NOT NULL,
    license              VARCHAR(50) NOT NULL DEFAULT 'MIT',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique Constraint
    CONSTRAINT uq_libraries_name_runtime
        UNIQUE (library_name, runtime_environment)
);

-- ----------------------------------------------------------------------------
-- 9. Table: device_components
-- Physical wiring & bus configuration mapping between devices and components.
-- ----------------------------------------------------------------------------
CREATE TABLE device_components (
    device_component_id  SERIAL PRIMARY KEY,
    device_id            INT NOT NULL,
    component_id         INT NOT NULL,
    default_bus_or_pin   VARCHAR(100) NOT NULL,
    tested_status        VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',

    -- Foreign Key Constraints
    CONSTRAINT fk_device_components_device
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_device_components_component
        FOREIGN KEY (component_id) REFERENCES components(component_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- Constraints
    CONSTRAINT uq_device_components_pair
        UNIQUE (device_id, component_id),
    CONSTRAINT chk_device_components_status
        CHECK (tested_status IN ('VERIFIED', 'EXPERIMENTAL', 'UNTESTED', 'FAILED'))
);

-- ----------------------------------------------------------------------------
-- 10. Table: compatibility
-- Comprehensive compatibility evaluation matrix across hardware and software.
-- ----------------------------------------------------------------------------
CREATE TABLE compatibility (
    compatibility_id      SERIAL PRIMARY KEY,
    device_id             INT NOT NULL,
    component_id          INT NOT NULL,
    library_id            INT,
    firmware_id           INT,
    compatibility_status  VARCHAR(30) NOT NULL,
    voltage_compatible    BOOLEAN NOT NULL,
    logic_level_compatible BOOLEAN NOT NULL,
    notes                 TEXT,
    verified_date         DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Foreign Key Constraints
    CONSTRAINT fk_compatibility_device
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_compatibility_component
        FOREIGN KEY (component_id) REFERENCES components(component_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_compatibility_library
        FOREIGN KEY (library_id) REFERENCES libraries(library_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_compatibility_firmware
        FOREIGN KEY (firmware_id) REFERENCES firmware(firmware_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    -- Check & Unique Constraints
    CONSTRAINT chk_compatibility_status
        CHECK (compatibility_status IN (
            'COMPATIBLE',
            'INCOMPATIBLE',
            'REQUIRES_LEVEL_SHIFTER',
            'REQUIRES_PULLUP_RESISTOR',
            'DEGRADED_FUNCTION'
        )),
    CONSTRAINT uq_compatibility_matrix
        UNIQUE (device_id, component_id, library_id, firmware_id)
);

-- ----------------------------------------------------------------------------
-- 11. Table: configuration_notes (Vector Database Integration)
-- Stores detailed setup guides, pinouts, and troubleshooting notes along with
-- 384-dimensional vector embeddings for semantic similarity search.
-- ----------------------------------------------------------------------------
CREATE TABLE configuration_notes (
    note_id              SERIAL PRIMARY KEY,
    device_id            INT,
    component_id         INT,
    title                VARCHAR(150) NOT NULL,
    content              TEXT NOT NULL,
    note_type            VARCHAR(30) NOT NULL DEFAULT 'SETUP_GUIDE',
    embedding            vector(384),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_config_notes_device
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_config_notes_component
        FOREIGN KEY (component_id) REFERENCES components(component_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- Check Constraints
    CONSTRAINT chk_config_notes_type
        CHECK (note_type IN ('SETUP_GUIDE', 'TROUBLESHOOTING', 'PINOUT_SPEC', 'CALIBRATION', 'WORKAROUND'))
);

-- ----------------------------------------------------------------------------
-- Advanced Feature: PL/pgSQL Trigger for Automatic Timestamp Auditing
-- Automatically updates updated_at whenever a configuration note is modified.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_config_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_config_notes_updated_at
BEFORE UPDATE ON configuration_notes
FOR EACH ROW
EXECUTE FUNCTION fn_update_config_notes_timestamp();

-- ----------------------------------------------------------------------------
-- Indexes for Relational Performance & Vector Search
-- ----------------------------------------------------------------------------
-- B-Tree Indexes on Foreign Keys and Search Fields
CREATE INDEX idx_devices_manufacturer ON devices(manufacturer_id);
CREATE INDEX idx_devices_device_type ON devices(device_type_id);
CREATE INDEX idx_devices_model ON devices(model_name);

CREATE INDEX idx_components_manufacturer ON components(manufacturer_id);
CREATE INDEX idx_components_category ON components(category);
CREATE INDEX idx_components_interface ON components(interface_type);

CREATE INDEX idx_device_protocols_protocol ON device_protocols(protocol_id);
CREATE INDEX idx_firmware_device ON firmware(device_id);
CREATE INDEX idx_libraries_runtime ON libraries(runtime_environment);

CREATE INDEX idx_compatibility_device ON compatibility(device_id);
CREATE INDEX idx_compatibility_component ON compatibility(component_id);
CREATE INDEX idx_compatibility_status ON compatibility(compatibility_status);

CREATE INDEX idx_config_notes_device ON configuration_notes(device_id);
CREATE INDEX idx_config_notes_component ON configuration_notes(component_id);

-- pgvector HNSW Index for High-Speed Cosine Semantic Search
CREATE INDEX idx_config_notes_embedding_hnsw
    ON configuration_notes
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ----------------------------------------------------------------------------
-- Analytical and Application Views
-- ----------------------------------------------------------------------------

-- View 1: Complete Device Compatibility Matrix with Electrical & Software Status
CREATE VIEW v_device_compatibility_overview AS
SELECT
    c.compatibility_id,
    d.model_name AS device_model,
    m_dev.name AS device_manufacturer,
    d.logic_level_voltage AS device_logic_voltage,
    comp.component_name,
    comp.category AS component_category,
    comp.interface_type AS component_interface,
    comp.logic_level_voltage AS component_logic_voltage,
    c.compatibility_status,
    c.voltage_compatible,
    c.logic_level_compatible,
    lib.library_name,
    f.version_tag AS firmware_version,
    c.notes
FROM compatibility c
JOIN devices d ON c.device_id = d.device_id
JOIN manufacturers m_dev ON d.manufacturer_id = m_dev.manufacturer_id
JOIN components comp ON c.component_id = comp.component_id
LEFT JOIN libraries lib ON c.library_id = lib.library_id
LEFT JOIN firmware f ON c.firmware_id = f.firmware_id;

-- View 2: Device Communication Protocols Summary
CREATE VIEW v_device_protocol_summary AS
SELECT
    d.device_id,
    d.model_name,
    m.name AS manufacturer,
    STRING_AGG(p.protocol_name, ', ' ORDER BY p.protocol_name) AS supported_protocols,
    COUNT(p.protocol_id) AS protocol_count
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
LEFT JOIN device_protocols dp ON d.device_id = dp.device_id
LEFT JOIN communication_protocols p ON dp.protocol_id = p.protocol_id
GROUP BY d.device_id, d.model_name, m.name;

-- View 3: Active Device Specifications Catalog
CREATE VIEW v_active_devices_catalog AS
SELECT
    d.device_id,
    d.model_name,
    m.name AS manufacturer_name,
    dt.type_name AS device_type,
    d.microcontroller,
    d.operating_voltage,
    d.logic_level_voltage,
    d.clock_speed_mhz,
    d.flash_memory_kb,
    d.sram_kb,
    d.gpio_count,
    d.analog_pins_count
FROM devices d
JOIN manufacturers m ON d.manufacturer_id = m.manufacturer_id
JOIN device_types dt ON d.device_type_id = dt.device_type_id
WHERE d.status = 'ACTIVE';
