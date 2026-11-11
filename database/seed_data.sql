-- ============================================================================
-- DBMS Experiential Learning - Level 3 Mini-Project
-- Team Number : 9
-- Project Title: IoT Device Configuration & Compatibility Database
-- File        : seed_data.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Seed: manufacturers
-- ----------------------------------------------------------------------------
INSERT INTO manufacturers (name, website, country) VALUES
('Espressif Systems', 'https://www.espressif.com', 'China'),
('Arduino AG', 'https://www.arduino.cc', 'Italy'),
('Raspberry Pi Foundation', 'https://www.raspberrypi.com', 'United Kingdom'),
('STMicroelectronics', 'https://www.st.com', 'Switzerland'),
('Bosch Sensortec', 'https://www.bosch-sensortec.com', 'Germany'),
('Adafruit Industries', 'https://www.adafruit.com', 'United States'),
('Seeed Studio', 'https://www.seeedstudio.com', 'China');

-- ----------------------------------------------------------------------------
-- 2. Seed: device_types
-- ----------------------------------------------------------------------------
INSERT INTO device_types (type_name, description) VALUES
('Microcontroller Board', 'Compact low-power computing board executing dedicated firmware loops.'),
('Single Board Computer', 'Complete computing system with full operating system capabilities.'),
('Edge Gateway', 'Intermediary device bridging local sensor nodes with remote cloud brokers.'),
('Sensor Node Module', 'Specialized ultra-low power board tailored for wireless telemetry.');

-- ----------------------------------------------------------------------------
-- 3. Seed: devices
-- ----------------------------------------------------------------------------
INSERT INTO devices (manufacturer_id, device_type_id, model_name, microcontroller, operating_voltage, logic_level_voltage, clock_speed_mhz, flash_memory_kb, sram_kb, gpio_count, analog_pins_count, status) VALUES
(1, 1, 'ESP32-WROOM-32', 'ESP32-D0WDQ6 Dual Core Xtensa LX6', 3.30, 3.30, 240, 4096, 520, 36, 18, 'ACTIVE'),
(2, 1, 'Arduino Uno Rev3', 'ATmega328P 8-bit AVR', 5.00, 5.00, 16, 32, 2, 14, 6, 'ACTIVE'),
(3, 1, 'Raspberry Pi Pico W', 'RP2040 Dual ARM Cortex-M0+', 3.30, 3.30, 133, 2048, 264, 26, 3, 'ACTIVE'),
(4, 1, 'STM32 Nucleo-F401RE', 'STM32F401RET6 ARM Cortex-M4', 3.30, 3.30, 84, 512, 96, 50, 16, 'ACTIVE'),
(1, 1, 'ESP8266 NodeMCU v2', 'ESP8266EX 32-bit Tensilica L106', 3.30, 3.30, 80, 4096, 80, 17, 1, 'ACTIVE'),
(2, 1, 'Arduino Nano Every', 'ATmega4809 8-bit AVR', 5.00, 5.00, 20, 48, 6, 22, 8, 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 4. Seed: components (including datasheet_url added via ALTER TABLE)
-- ----------------------------------------------------------------------------
INSERT INTO components (manufacturer_id, component_name, category, operating_voltage_min, operating_voltage_max, logic_level_voltage, current_draw_ma, interface_type, datasheet_url) VALUES
(5, 'BME280 Environmental Sensor', 'Temperature/Humidity/Pressure', 1.71, 3.60, 3.30, 0.50, 'I2C / SPI', 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf'),
(6, 'DHT22 (AM2302) Sensor', 'Temperature/Humidity Sensor', 3.30, 5.50, 3.30, 2.50, '1-Wire Digital', 'https://cdn-shop.adafruit.com/datasheets/DHT22.pdf'),
(6, 'SSD1306 0.96 inch OLED Display', 'Graphic Display Module', 3.30, 5.00, 3.30, 20.00, 'I2C', 'https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf'),
(6, 'MPU-6050 6-DoF IMU', 'Motion & Accelerometer Sensor', 3.00, 5.00, 3.30, 3.80, 'I2C', 'https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Datasheet1.pdf'),
(7, '5V Single-Channel Relay Module', 'Electromechanical Actuator', 4.75, 5.25, 5.00, 70.00, 'GPIO Digital', 'https://www.songle.com/en/pdf/200841195638703.pdf');

-- ----------------------------------------------------------------------------
-- 5. Seed: communication_protocols
-- ----------------------------------------------------------------------------
INSERT INTO communication_protocols (protocol_name, protocol_layer, standard, max_data_rate_kbps) VALUES
('Wi-Fi 802.11 b/g/n', 'Physical/DataLink', 'IEEE 802.11b/g/n (2.4 GHz)', 150000.00),
('Bluetooth Low Energy (BLE)', 'Physical/DataLink', 'Bluetooth 5.0 / 4.2 BLE', 2000.00),
('I2C Bus', 'Hardware Bus', 'Phillips I2C Standard/Fast Mode', 400.00),
('SPI Bus', 'Hardware Bus', 'Motorola 4-Wire Synchronous Serial', 50000.00),
('UART / Serial', 'Hardware Bus', 'Asynchronous Serial Interface', 115.20),
('MQTT Client', 'Application', 'OASIS MQTT v3.1.1 / v5.0', 10000.00),
('HTTP / REST', 'Application', 'RFC 7230 Hypertext Transfer Protocol', 100000.00);

-- ----------------------------------------------------------------------------
-- 6. Seed: device_protocols (M:N)
-- ----------------------------------------------------------------------------
INSERT INTO device_protocols (device_id, protocol_id, is_native_support) VALUES
-- ESP32-WROOM-32 (device_id: 1)
(1, 1, TRUE),  -- Wi-Fi
(1, 2, TRUE),  -- BLE
(1, 3, TRUE),  -- I2C
(1, 4, TRUE),  -- SPI
(1, 5, TRUE),  -- UART
(1, 6, TRUE),  -- MQTT

-- Arduino Uno Rev3 (device_id: 2)
(2, 3, TRUE),  -- I2C
(2, 4, TRUE),  -- SPI
(2, 5, TRUE),  -- UART
(2, 1, FALSE), -- Wi-Fi (Requires shield)

-- Raspberry Pi Pico W (device_id: 3)
(3, 1, TRUE),  -- Wi-Fi
(3, 2, TRUE),  -- BLE
(3, 3, TRUE),  -- I2C
(3, 4, TRUE),  -- SPI
(3, 5, TRUE),  -- UART
(3, 6, TRUE),  -- MQTT

-- STM32 Nucleo-F401RE (device_id: 4)
(4, 3, TRUE),  -- I2C
(4, 4, TRUE),  -- SPI
(4, 5, TRUE);  -- UART

-- ----------------------------------------------------------------------------
-- 7. Seed: firmware
-- ----------------------------------------------------------------------------
INSERT INTO firmware (device_id, version_tag, runtime_environment, release_date, is_recommended) VALUES
(1, 'v3.0.4', 'Arduino Core for ESP32', '2024-06-15', TRUE),
(1, 'v1.22.0', 'MicroPython', '2024-01-20', FALSE),
(1, 'v5.1.2', 'ESP-IDF', '2024-04-10', TRUE),
(2, 'v1.8.6', 'Arduino AVR Core', '2023-11-12', TRUE),
(3, 'v1.22.0', 'MicroPython RP2040', '2024-02-01', TRUE),
(3, 'v3.6.0', 'Arduino-Pico Core', '2024-05-18', FALSE),
(4, 'v2.6.0', 'STM32duino Core', '2023-12-05', TRUE);

-- ----------------------------------------------------------------------------
-- 8. Seed: libraries
-- ----------------------------------------------------------------------------
INSERT INTO libraries (library_name, runtime_environment, repository_url, latest_version, license) VALUES
('Adafruit_BME280_Library', 'Arduino C++', 'https://github.com/adafruit/Adafruit_BME280_Library', '2.2.4', 'BSD-3-Clause'),
('DHT-sensor-library', 'Arduino C++', 'https://github.com/adafruit/DHT-sensor-library', '1.4.6', 'MIT'),
('Adafruit_SSD1306', 'Arduino C++', 'https://github.com/adafruit/Adafruit_SSD1306', '2.5.9', 'BSD-3-Clause'),
('PubSubClient', 'Arduino C++', 'https://github.com/knolleary/pubsubclient', '2.8.0', 'MIT'),
('micropython-bme280', 'MicroPython', 'https://github.com/robert-hh/BME280', '1.0.2', 'MIT'),
('Wire (I2C Builtin)', 'Arduino C++', 'https://www.arduino.cc/en/Reference/Wire', '1.0.0', 'LGPL-2.1');

-- ----------------------------------------------------------------------------
-- 9. Seed: device_components (Wiring / Pin Mapping)
-- ----------------------------------------------------------------------------
INSERT INTO device_components (device_id, component_id, default_bus_or_pin, tested_status) VALUES
(1, 1, 'I2C (SDA=GPIO21, SCL=GPIO22, VCC=3V3, GND=GND)', 'VERIFIED'),
(1, 2, '1-Wire Digital (DATA=GPIO4 with 4.7k pull-up, VCC=3V3)', 'VERIFIED'),
(1, 3, 'I2C (SDA=GPIO21, SCL=GPIO22, VCC=3V3)', 'VERIFIED'),
(1, 5, 'GPIO (IN=GPIO18, VCC=5V via VIN pin, GND=GND)', 'EXPERIMENTAL'),
(2, 1, 'I2C (SDA=A4, SCL=A5, VCC=3V3)', 'VERIFIED'),
(2, 2, '1-Wire Digital (DATA=D2 with 10k pull-up, VCC=5V)', 'VERIFIED'),
(2, 5, 'GPIO (IN=D7, VCC=5V, GND=GND)', 'VERIFIED'),
(3, 1, 'I2C (SDA=GP4, SCL=GP5, VCC=3V3)', 'VERIFIED'),
(3, 2, '1-Wire Digital (DATA=GP15, VCC=3V3)', 'VERIFIED');

-- ----------------------------------------------------------------------------
-- 10. Seed: compatibility
-- ----------------------------------------------------------------------------
INSERT INTO compatibility (device_id, component_id, library_id, firmware_id, compatibility_status, voltage_compatible, logic_level_compatible, notes, verified_date) VALUES
-- ESP32 + BME280 (Native 3.3V, Seamless I2C)
(1, 1, 1, 1, 'COMPATIBLE', TRUE, TRUE, 'Perfect direct 3.3V I2C interfacing without logic shifting.', '2024-07-01'),

-- ESP32 + DHT22 (Requires 4.7k-10k pullup resistor to 3.3V)
(1, 2, 2, 1, 'REQUIRES_PULLUP_RESISTOR', TRUE, TRUE, 'Requires a 4.7k to 10k Ohm pull-up resistor between VCC and DATA line for signal stabilization.', '2024-07-02'),

-- ESP32 + 5V Relay (3.3V logic driving 5V relay coil)
(1, 5, NULL, 1, 'REQUIRES_LEVEL_SHIFTER', FALSE, FALSE, 'ESP32 GPIO outputs 3.3V logic which may fail to trigger 5V optocoupler relays; use a transistor/level shifter or 3.3V relay module.', '2024-07-05'),

-- Arduino Uno + BME280 (5V Uno board connecting to 3.3V sensitive sensor)
(2, 1, 1, 4, 'REQUIRES_LEVEL_SHIFTER', FALSE, FALSE, 'BME280 max input is 3.6V. Arduino Uno 5V I2C pins will damage raw BME280 chips unless using a breakout board with onboard level shifter.', '2024-07-03'),

-- Arduino Uno + DHT22 (5V tolerant)
(2, 2, 2, 4, 'COMPATIBLE', TRUE, TRUE, 'DHT22 operates comfortably at 5V logic with Arduino Uno digital pins.', '2024-07-03'),

-- Arduino Uno + 5V Relay (Native 5V)
(2, 5, NULL, 4, 'COMPATIBLE', TRUE, TRUE, 'Direct connection to digital pin D7, standard 5V logic compatible.', '2024-07-04'),

-- Raspberry Pi Pico W + BME280 (MicroPython)
(3, 1, 5, 5, 'COMPATIBLE', TRUE, TRUE, 'Fully compatible over I2C0 bus on GP4/GP5 using MicroPython driver.', '2024-07-06');

-- ----------------------------------------------------------------------------
-- 11. Seed: configuration_notes (with 384-dimensional Vector Embeddings)
-- Note: Embeddings represent normalized 384-dimensional vectors (e.g. from all-MiniLM-L6-v2)
-- ----------------------------------------------------------------------------
-- Helper function to generate mock unit-length 384d vector with specific dominant directions
DO $$
DECLARE
    vec_esp32_bme text;
    vec_esp32_dht text;
    vec_uno_relay text;
    vec_pico_wifi text;
    i int;
BEGIN
    -- Construct representative normalized 384-d vectors
    vec_esp32_bme := '[';
    vec_esp32_dht := '[';
    vec_uno_relay := '[';
    vec_pico_wifi := '[';

    FOR i IN 1..384 LOOP
        IF i = 1 THEN
            vec_esp32_bme := vec_esp32_bme || '0.125';
            vec_esp32_dht := vec_esp32_dht || '0.110';
            vec_uno_relay := vec_uno_relay || '0.015';
            vec_pico_wifi := vec_pico_wifi || '0.085';
        ELSE
            vec_esp32_bme := vec_esp32_bme || ',' || ROUND((sin(i::numeric * 0.15) * 0.05)::numeric, 4)::text;
            vec_esp32_dht := vec_esp32_dht || ',' || ROUND((cos(i::numeric * 0.15) * 0.05)::numeric, 4)::text;
            vec_uno_relay := vec_uno_relay || ',' || ROUND((sin(i::numeric * 0.45) * 0.05)::numeric, 4)::text;
            vec_pico_wifi := vec_pico_wifi || ',' || ROUND((cos(i::numeric * 0.30) * 0.05)::numeric, 4)::text;
        END IF;
    END LOOP;

    vec_esp32_bme := vec_esp32_bme || ']';
    vec_esp32_dht := vec_esp32_dht || ']';
    vec_uno_relay := vec_uno_relay || ']';
    vec_pico_wifi := vec_pico_wifi || ']';

    INSERT INTO configuration_notes (device_id, component_id, title, content, note_type, embedding) VALUES
    (1, 1, 'ESP32 to BME280 I2C Wiring and Bus Initialization',
     'Connect ESP32 3V3 to BME280 VIN, GND to GND, GPIO21 to SDA, and GPIO22 to SCL. In Arduino code, initialize Wire.begin(21, 22) and call bme.begin(0x76). If address detection fails, verify whether SDO pin is tied to GND (0x76) or VCC (0x77).',
     'SETUP_GUIDE',
     vec_esp32_bme::vector),

    (1, 2, 'DHT22 Timing Constraints & Pull-up Resistor on ESP32',
     'DHT22 uses a proprietary single-bus communication protocol requiring precise microsecond timing. On the ESP32, attach a 4.7k pull-up resistor between GPIO4 and 3V3 rail. Keep sampling intervals at >= 2000ms to avoid self-heating errors and read timeouts.',
     'TROUBLESHOOTING',
     vec_esp32_dht::vector),

    (2, 5, 'Driving 5V High Current Relays safely with Arduino Uno',
     'When switching inductive loads (motors, AC lamps) using 5V relays, ensure an external 5V power supply powers the relay coil. Do not draw coil current directly from the Arduino 5V regulator. Connect Arduino GND and external power GND together (common ground).',
     'PINOUT_SPEC',
     vec_uno_relay::vector),

    (3, NULL, 'Raspberry Pi Pico W Wi-Fi & MQTT Client Provisioning',
     'Pico W uses the Infineon CYW43439 wireless chip connected via SPI. Use network.WLAN(network.STA_IF) in MicroPython to connect to 2.4 GHz WPA2/WPA3 networks. For MQTT, instantiate umqtt.simple.MQTTClient with keepalive=60 and configure non-blocking sockets.',
     'SETUP_GUIDE',
     vec_pico_wifi::vector);
END $$;
