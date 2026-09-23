-- ========================================================
-- Production Schema for Safety Intelligence Platform (PostgreSQL + PostGIS)
-- Compatible with unified events model & spatial queries
-- ========================================================

-- Enable PostGIS extension if available
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Unified Safety Events Table
CREATE TABLE IF NOT EXISTS unified_events (
    id VARCHAR(64) PRIMARY KEY,
    fingerprint VARCHAR(128) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100),
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) NOT NULL, -- ACTIVE, MONITORING, RESOLVED, HISTORICAL_RECORD
    temporal_status VARCHAR(30) NOT NULL, -- REALTIME, NEAR_REALTIME, HISTORICAL, VERIFIED_REPORT
    source_name VARCHAR(100) NOT NULL,
    source_url TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326),
    location_name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    regency_city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_label VARCHAR(50) NOT NULL,
    casualties_fatal INT DEFAULT 0,
    casualties_injured INT DEFAULT 0,
    impact_summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_events_category ON unified_events(category);
CREATE INDEX IF NOT EXISTS idx_events_severity ON unified_events(severity);
CREATE INDEX IF NOT EXISTS idx_events_regency ON unified_events(regency_city);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON unified_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_temporal_status ON unified_events(temporal_status);
CREATE INDEX IF NOT EXISTS idx_events_geom ON unified_events USING GIST (geom);

-- 2. Regions & Administrative Registry
CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL, -- KOTA, KABUPATEN, PROVINSI
    province VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    bounding_box JSONB,
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    risk_level VARCHAR(20) DEFAULT 'LOW',
    safety_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Data Synchronization & Audit Logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id VARCHAR(64) PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL, -- SUCCESS, PARTIAL, FAILED
    records_fetched INT DEFAULT 0,
    records_inserted INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    error_message TEXT
);
