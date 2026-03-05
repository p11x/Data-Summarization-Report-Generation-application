# Database Schema - Advanced Features

## SQLite Database Schema

```sql
-- ============================================================
-- CORE TABLES (Existing)
-- ============================================================

-- Users table (existing)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Datasets table (existing)
CREATE TABLE datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    file_size INTEGER,
    row_count INTEGER,
    column_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reports table (existing)
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dataset_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'standard',
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- ============================================================
-- DATA LINEAGE & PROVENANCE TABLES
-- ============================================================

-- Dataset lineage chain
CREATE TABLE lineage_chains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Lineage nodes (each transformation step)
CREATE TABLE lineage_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain_id INTEGER NOT NULL,
    node_type TEXT NOT NULL, -- 'source', 'transform', 'analysis', 'visualization', 'report'
    name TEXT NOT NULL,
    config JSON NOT NULL, -- stores transformation/analysis config
    input_data_hash TEXT,
    output_data_hash TEXT,
    execution_time_ms INTEGER,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chain_id) REFERENCES lineage_chains(id)
);

-- Lineage connections
CREATE TABLE lineage_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain_id INTEGER NOT NULL,
    from_node_id INTEGER NOT NULL,
    to_node_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chain_id) REFERENCES lineage_chains(id),
    FOREIGN KEY (from_node_id) REFERENCES lineage_nodes(id),
    FOREIGN KEY (to_node_id) REFERENCES lineage_nodes(id)
);

-- ============================================================
-- ANOMALY DETECTION TABLES
-- ============================================================

-- Anomaly detection results
CREATE TABLE anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    column_name TEXT NOT NULL,
    row_index INTEGER NOT NULL,
    value REAL NOT NULL,
    anomaly_type TEXT NOT NULL, -- 'outlier', 'spike', 'drop', 'missing'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high'
    score REAL NOT NULL, -- anomaly score
    expected_value REAL,
    deviation REAL,
    description TEXT,
    is_resolved BOOLEAN DEFAULT 0,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- Anomaly detection configs
CREATE TABLE anomaly_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    method TEXT NOT NULL, -- 'zscore', 'iqr', 'isolation_forest'
    parameters JSON NOT NULL, -- method-specific parameters
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- WHAT-IF ANALYSIS TABLES
-- ============================================================

-- What-if scenarios
CREATE TABLE whatif_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_values JSON NOT NULL, -- original values
    modified_values JSON NOT NULL, -- user modifications
    filters JSON, -- applied filters
    results JSON, -- calculated results
    is_baseline BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Scenario comparisons
CREATE TABLE scenario_comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    scenario_ids JSON NOT NULL, -- array of scenario IDs
    comparison_data JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- FORECASTING TABLES
-- ============================================================

-- Forecasting models
CREATE TABLE forecast_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    model_type TEXT NOT NULL, -- 'moving_average', 'linear_regression', 'exponential_smoothing'
    target_column TEXT NOT NULL,
    parameters JSON NOT NULL,
    metrics JSON, -- accuracy metrics
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Forecasting results
CREATE TABLE forecast_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    predictions JSON NOT NULL,
    confidence_intervals JSON,
    horizon INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES forecast_models(id)
);

-- ============================================================
-- SEMANTIC SEARCH TABLES
-- ============================================================

-- Search queries history
CREATE TABLE search_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dataset_id INTEGER,
    natural_query TEXT NOT NULL,
    generated_sql TEXT,
    filters JSON,
    result_count INTEGER,
    execution_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- Query templates
CREATE TABLE query_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    sql_template TEXT NOT NULL,
    description TEXT,
    category TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REPRODUCIBLE PIPELINES TABLES
-- ============================================================

-- Analysis pipelines
CREATE TABLE pipelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    steps JSON NOT NULL, -- array of pipeline steps
    config JSON, -- pipeline configuration
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Pipeline execution history
CREATE TABLE pipeline_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id INTEGER NOT NULL,
    dataset_id INTEGER,
    status TEXT NOT NULL, -- 'running', 'completed', 'failed'
    input_data_hash TEXT,
    output_data_hash TEXT,
    results JSON,
    error_message TEXT,
    execution_time_ms INTEGER,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- Pipeline versions
CREATE TABLE pipeline_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    steps JSON NOT NULL,
    config JSON,
    changelog TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
);

-- ============================================================
-- VISUAL QUERY BUILDER TABLES
-- ============================================================

-- Saved queries
CREATE TABLE saved_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dataset_id INTEGER,
    name TEXT NOT NULL,
    query_config JSON NOT NULL, -- visual query configuration
    generated_sql TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- Query components library
CREATE TABLE query_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_type TEXT NOT NULL, -- 'column', 'filter', 'aggregation', 'join'
    name TEXT NOT NULL,
    config JSON NOT NULL,
    is_preset BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATA QUALITY TABLES
-- ============================================================

-- Data quality reports
CREATE TABLE quality_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    overall_score REAL,
    issues JSON NOT NULL,
    summary JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Quality rules
CREATE TABLE quality_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'not_null', 'unique', 'range', 'regex', 'type'
    target_columns JSON NOT NULL,
    parameters JSON NOT NULL,
    severity TEXT DEFAULT 'warning',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quality issues
CREATE TABLE quality_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    rule_id INTEGER,
    column_name TEXT,
    row_range TEXT,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_fix TEXT,
    is_resolved BOOLEAN DEFAULT 0,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES quality_reports(id),
    FOREIGN KEY (rule_id) REFERENCES quality_rules(id)
);

-- ============================================================
-- PRIVACY & SECURITY TABLES
-- ============================================================

-- Privacy rules
CREATE TABLE privacy_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'mask', 'hash', 'encrypt', 'redact', 'remove'
    parameters JSON, -- mask character, hash algorithm, etc.
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Column access control
CREATE TABLE column_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dataset_id INTEGER NOT NULL,
    column_name TEXT NOT NULL,
    access_level TEXT NOT NULL, -- 'full', 'read', 'masked', 'none'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- Audit logs
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id INTEGER,
    details JSON,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- DASHBOARD WIDGET SYSTEM TABLES
-- ============================================================

-- Dashboard layouts
CREATE TABLE dashboard_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    widgets JSON NOT NULL, -- widget positions and configs
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Widget definitions
CREATE TABLE widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    widget_type TEXT NOT NULL, -- 'chart', 'table', 'summary', 'metric', 'custom'
    component_name TEXT NOT NULL,
    default_config JSON NOT NULL,
    is_system BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Widget instances
CREATE TABLE widget_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layout_id INTEGER NOT NULL,
    widget_id INTEGER NOT NULL,
    position JSON NOT NULL, -- {x, y, w, h}
    config JSON,
    data_source JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (layout_id) REFERENCES dashboard_layouts(id),
    FOREIGN KEY (widget_id) REFERENCES widgets(id)
);

-- ============================================================
-- MODEL COMPARISON TABLES
-- ============================================================

-- Model comparison sessions
CREATE TABLE model_comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    dataset_id INTEGER NOT NULL,
    target_column TEXT NOT NULL,
    models JSON NOT NULL, -- array of model configs
    metrics JSON NOT NULL, -- comparison metrics
    best_model_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

-- Comparison results
CREATE TABLE comparison_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comparison_id INTEGER NOT NULL,
    model_id INTEGER,
    metrics JSON NOT NULL,
    rankings JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comparison_id) REFERENCES model_comparisons(id)
);

-- ============================================================
-- OFFLINE MODE TABLES
-- ============================================================

-- Sync queue
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    operation TEXT NOT NULL, -- 'create', 'update', 'delete'
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    data JSON NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Local dataset cache
CREATE TABLE dataset_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    local_data BLOB NOT NULL,
    metadata JSON NOT NULL,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- PLUGIN ARCHITECTURE TABLES
-- ============================================================

-- Plugins registry
CREATE TABLE plugins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    author TEXT,
    manifest JSON NOT NULL, -- plugin metadata
    is_enabled BOOLEAN DEFAULT 1,
    is_system BOOLEAN DEFAULT 0,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plugin extensions
CREATE TABLE plugin_extensions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plugin_id INTEGER NOT NULL,
    extension_type TEXT NOT NULL, -- 'chart', 'transform', 'analysis', 'export'
    name TEXT NOT NULL,
    implementation TEXT NOT NULL,
    config JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id)
);

-- ============================================================
-- XAI (EXPLAINABLE AI) TABLES
-- ============================================================

-- Analysis explanations
CREATE TABLE analysis_explanations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    insight_text TEXT NOT NULL,
    contributing_columns JSON NOT NULL, -- {column: contribution_score}
    confidence REAL,
    method TEXT NOT NULL, -- 'shap', 'lime', 'correlation', 'statistical'
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES reports(id)
);

-- Insight attributions
CREATE TABLE insight_attributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    explanation_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    contribution_score REAL NOT NULL,
    direction TEXT, -- 'positive', 'negative'
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (explanation_id) REFERENCES analysis_explanations(id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_datasets_user ON datasets(user_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_lineage_chain_dataset ON lineage_chains(dataset_id);
CREATE INDEX idx_anomalies_dataset ON anomalies(dataset_id);
CREATE INDEX idx_whatif_scenarios_dataset ON whatif_scenarios(dataset_id);
CREATE INDEX idx_forecast_models_dataset ON forecast_models(dataset_id);
CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_pipelines_user ON pipelines(user_id);
CREATE INDEX idx_quality_reports_dataset ON quality_reports(dataset_id);
CREATE INDEX idx_privacy_rules_user ON privacy_rules(user_id);
CREATE INDEX idx_dashboard_layouts_user ON dashboard_layouts(user_id);
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_plugins_enabled ON plugins(is_enabled);
```

## IndexedDB Schema (Frontend Offline Storage)

```javascript
// IndexedDB Database Name: 'DataAnalysisOffline'

const stores = {
  // Local datasets
  'localDatasets': {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name' },
      { name: 'cachedAt', keyPath: 'cachedAt' }
    ]
  },
  
  // Pipeline definitions
  'localPipelines': {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name' },
      { name: 'synced', keyPath: 'synced' }
    ]
  },
  
  // Widget layouts
  'widgetLayouts': {
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId' },
      { name: 'isDefault', keyPath: 'isDefault' }
    ]
  },
  
  // Analysis cache
  'analysisCache': {
    keyPath: 'id',
    indexes: [
      { name: 'datasetId', keyPath: 'datasetId' },
      { name: 'type', keyPath: 'type' },
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  },
  
  // Offline queue
  'offlineQueue': {
    keyPath: 'id',
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  },
  
  // User preferences
  'userPreferences': {
    keyPath: 'key'
  },
  
  // Search history
  'searchHistory': {
    keyPath: 'id',
    indexes: [
      { name: 'query', keyPath: 'query' },
      { name: 'timestamp', keyPath: 'timestamp' }
    ]
  }
};
```
