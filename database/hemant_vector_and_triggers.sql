-- ============================================================================
-- DBMS Experiential Learning - Level 3 Mini-Project (Team 9)
-- Project : IoT Device Configuration & Compatibility Database
-- Author  : Hemant Ram Nelapati (SRN: PES2UG24CS192)
-- File    : hemant_vector_and_triggers.sql
-- Scope   : pgvector extension, DDL schema evolution (ALTER TABLE),
--           PL/pgSQL audit trigger, and HNSW cosine vector index.
--
-- Extracted from database/schema.sql. The CREATE EXTENSION statement must run
-- before the base tables are created (configuration_notes.embedding uses the
-- vector type); the remaining statements run after the base tables exist.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Vector Database Extension Setup (pgvector)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- DDL Schema Evolution: ALTER TABLE Demonstration
-- Adds official datasheet documentation URL column to components table.
-- ----------------------------------------------------------------------------
ALTER TABLE components ADD COLUMN datasheet_url VARCHAR(255);

-- ----------------------------------------------------------------------------
-- Advanced Feature: PL/pgSQL Trigger for Automatic Timestamp Auditing
-- Automatically updates updated_at whenever a configuration note is modified.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_config_notes_updated_at ON configuration_notes;
DROP FUNCTION IF EXISTS fn_update_config_notes_timestamp() CASCADE;

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
-- pgvector HNSW Index for High-Speed Cosine Semantic Search
-- ----------------------------------------------------------------------------
CREATE INDEX idx_config_notes_embedding_hnsw
    ON configuration_notes
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
