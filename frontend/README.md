# IoT Device Configuration & Compatibility Portal (Next.js 15 + PostgreSQL 16 + pgvector)

This directory contains the full-stack Next.js 15 web application (`iot-config-compatibility-portal`) built for **Team 9's UE24CS351A DBMS Mini-Project**: **IoT Device Configuration & Compatibility Database (`iot_config_db`)**.

---

## 1. Architecture & Database Integration

- **Frontend Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Database Engine:** PostgreSQL 16.15 + `pgvector` v0.6.0 (`iot_config_db`)
- **Database Connection Layer (`src/lib/db.ts`):**
  - Connects via `node-postgres` (`pg.Pool`) using `process.env.DATABASE_URL` configured in `.env.local` (satisfying the Level 3 requirement that zero database credentials are hardcoded in source files).
  - Includes a synchronized stateful mirror of all 11 normalized 3NF tables and 81 seed records (`manufacturers`, `device_types`, `devices`, `components`, `communication_protocols`, `device_protocols`, `firmware`, `libraries`, `device_components`, `compatibility`, `configuration_notes`) so the portal remains 100% interactive even if the local PostgreSQL service or WSL instance is offline.

### API Routes (`src/app/api/*`)
1. **`GET / POST / DELETE /api/devices` (`src/app/api/devices/route.ts`):**
   - `GET`: Queries `v_active_devices_catalog`, `components`, `manufacturers`, and `device_types`.
   - `POST`: Inserts a new IoT compute board into `devices` while enforcing database-level domain `CHECK` constraints (`chk_devices_operating_voltage: 0 < V <= 48.0`, `chk_devices_logic_level_voltage: 0 < V <= 12.0`).
   - `DELETE`: Executes a transaction-safe `DELETE FROM devices WHERE device_id = $1`.
2. **`GET / POST /api/compatibility` (`src/app/api/compatibility/route.ts`):**
   - `GET`: Queries the 6-table analytical view `v_device_compatibility_overview`, the `GROUP BY / HAVING COUNT(dp.protocol_id) >= 4` protocol aggregation query, the compatibility status percentage breakdown, and the correlated subquery (`d.clock_speed_mhz >= AVG(d2.clock_speed_mhz)`).
   - `POST`: Invokes the PL/pgSQL stored function `fn_evaluate_voltage_safety(p_board_v, p_sensor_max_v)` and inserts a new hardware bench evaluation into `compatibility`.
3. **`GET / PATCH /api/notes` (`src/app/api/notes/route.ts`):**
   - `GET`: Executes `pgvector` cosine distance (`<=>`) semantic nearest-neighbor search over 384-dimensional embeddings in `configuration_notes` indexed by `idx_config_notes_embedding_hnsw`.
   - `PATCH`: Executes `UPDATE configuration_notes SET content = ... WHERE note_id = $1`, firing the `BEFORE UPDATE` trigger `trg_config_notes_updated_at` (`fn_update_config_notes_timestamp()`) and returning the before/after `updated_at` audit timestamps.

---

## 2. Role-Based Access Control (RBAC)

The top navigation bar provides an interactive RBAC role switcher demonstrating the two required roles:
- **`Hardware Admin` (Lab Instructor / Systems Architect):** Full read/write privileges—can register new prototype IoT boards, record compatibility bench evaluations, delete prototype boards, and append verification notes to trigger `trg_config_notes_updated_at`.
- **`Embedded Engineer` (Student / Developer):** Read-only privileges—can inspect the compatibility matrix, run voltage safety evaluations, execute `pgvector` semantic searches, and inspect `GROUP BY / HAVING` and correlated subquery analytics. Mutation forms are locked with RBAC notices.

---

## 3. Running Locally

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

