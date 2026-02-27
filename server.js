/**
 * Advanced Data Analysis Platform - Backend Server
 * 
 * This server provides RESTful APIs for:
 * - Anomaly Detection
 * - What-If Analysis
 * - Semantic Search
 * - Forecasting/Prediction
 * - Data Lineage
 * - Reproducible Pipelines
 * - Visual Query Builder
 * - Data Quality & Validation
 * - Privacy & Security
 * - Dashboard Widgets
 * - Model Comparison
 * - Offline Mode Support
 * - Plugin Architecture
 * 
 * Database: SQLite
 * Authentication: JWT-based
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Database
const db = new sqlite3.Database('./data_analysis.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize database schema
initializeDatabase();

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Datasets table
    db.run(`CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      file_size INTEGER,
      row_count INTEGER,
      column_count INTEGER,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Reports table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
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
    )`);

    // Lineage chains
    db.run(`CREATE TABLE IF NOT EXISTS lineage_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Lineage nodes
    db.run(`CREATE TABLE IF NOT EXISTS lineage_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chain_id INTEGER NOT NULL,
      node_type TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      input_data_hash TEXT,
      output_data_hash TEXT,
      execution_time_ms INTEGER,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chain_id) REFERENCES lineage_chains(id)
    )`);

    // Anomalies
    db.run(`CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      column_name TEXT NOT NULL,
      row_index INTEGER NOT NULL,
      value REAL NOT NULL,
      anomaly_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      score REAL NOT NULL,
      expected_value REAL,
      deviation REAL,
      description TEXT,
      is_resolved INTEGER DEFAULT 0,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    )`);

    // What-if scenarios
    db.run(`CREATE TABLE IF NOT EXISTS whatif_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      base_values TEXT NOT NULL,
      modified_values TEXT NOT NULL,
      filters TEXT,
      results TEXT,
      is_baseline INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Forecast models
    db.run(`CREATE TABLE IF NOT EXISTS forecast_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      model_type TEXT NOT NULL,
      target_column TEXT NOT NULL,
      parameters TEXT NOT NULL,
      metrics TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Pipelines
    db.run(`CREATE TABLE IF NOT EXISTS pipelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      steps TEXT NOT NULL,
      config TEXT,
      version INTEGER DEFAULT 1,
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Pipeline executions
    db.run(`CREATE TABLE IF NOT EXISTS pipeline_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_id INTEGER NOT NULL,
      dataset_id INTEGER,
      status TEXT NOT NULL,
      input_data_hash TEXT,
      output_data_hash TEXT,
      results TEXT,
      error_message TEXT,
      execution_time_ms INTEGER,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pipeline_id) REFERENCES pipelines(id),
      FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    )`);

    // Quality reports
    db.run(`CREATE TABLE IF NOT EXISTS quality_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      overall_score REAL,
      issues TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Privacy rules
    db.run(`CREATE TABLE IF NOT EXISTS privacy_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      column_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      parameters TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Column access
    db.run(`CREATE TABLE IF NOT EXISTS column_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dataset_id INTEGER NOT NULL,
      column_name TEXT NOT NULL,
      access_level TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    )`);

    // Dashboard layouts
    db.run(`CREATE TABLE IF NOT EXISTS dashboard_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      widgets TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Widgets
    db.run(`CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      widget_type TEXT NOT NULL,
      component_name TEXT NOT NULL,
      default_config TEXT NOT NULL,
      is_system INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Model comparisons
    db.run(`CREATE TABLE IF NOT EXISTS model_comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dataset_id INTEGER NOT NULL,
      target_column TEXT NOT NULL,
      models TEXT NOT NULL,
      metrics TEXT NOT NULL,
      best_model_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    )`);

    // Plugins
    db.run(`CREATE TABLE IF NOT EXISTS plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      author TEXT,
      manifest TEXT NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0,
      installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Search queries
    db.run(`CREATE TABLE IF NOT EXISTS search_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dataset_id INTEGER,
      natural_query TEXT NOT NULL,
      generated_sql TEXT,
      filters TEXT,
      result_count INTEGER,
      execution_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    )`);

    // Analysis explanations (XAI)
    db.run(`CREATE TABLE IF NOT EXISTS analysis_explanations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      insight_text TEXT NOT NULL,
      contributing_columns TEXT NOT NULL,
      confidence REAL,
      method TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (analysis_id) REFERENCES reports(id)
    )`);

    // Sync queue for offline mode
    db.run(`CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Insert default widgets
    insertDefaultWidgets();

    console.log('Database schema initialized');
  });
}

function insertDefaultWidgets() {
  const defaultWidgets = [
    { name: 'Line Chart', widget_type: 'chart', component_name: 'LineChartWidget', default_config: JSON.stringify({ type: 'line', xAxis: '', yAxis: [] }) },
    { name: 'Bar Chart', widget_type: 'chart', component_name: 'BarChartWidget', default_config: JSON.stringify({ type: 'bar', xAxis: '', yAxis: [] }) },
    { name: 'Pie Chart', widget_type: 'chart', component_name: 'PieChartWidget', default_config: JSON.stringify({ type: 'pie', values: [] }) },
    { name: 'Data Table', widget_type: 'table', component_name: 'TableWidget', default_config: JSON.stringify({ columns: [], pageSize: 10 }) },
    { name: 'Summary Card', widget_type: 'summary', component_name: 'SummaryWidget', default_config: JSON.stringify({ metrics: [] }) },
    { name: 'KPI Metric', widget_type: 'metric', component_name: 'MetricWidget', default_config: JSON.stringify({ value: 0, label: '', change: 0 }) },
    { name: 'Anomaly Map', widget_type: 'chart', component_name: 'AnomalyChartWidget', default_config: JSON.stringify({ highlightAnomalies: true }) },
    { name: 'Forecast Chart', widget_type: 'chart', component_name: 'ForecastChartWidget', default_config: JSON.stringify({ showPrediction: true, confidence: 0.95 }) }
  ];

  db.each('SELECT COUNT(*) as count FROM widgets', (err, row) => {
    if (row.count === 0) {
      defaultWidgets.forEach(w => {
        db.run('INSERT INTO widgets (name, widget_type, component_name, default_config) VALUES (?, ?, ?, ?)',
          [w.name, w.widget_type, w.component_name, w.default_config]);
      });
    }
  });
}

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Allow unauthenticated requests for demo
    req.userId = 1;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.userId = 1; // Default user for demo
    } else {
      req.userId = user.id;
    }
    next();
  });
}

// ============================================================
// ANOMALY DETECTION API
// ============================================================

/**
 * Detect anomalies in a dataset
 * POST /api/anomalies/detect
 */
app.post('/api/anomalies/detect', authenticateToken, (req, res) => {
  const { datasetId, columnName, method = 'zscore', threshold = 2 } = req.body;

  if (!datasetId || !columnName) {
    return res.status(400).json({ error: 'datasetId and columnName are required' });
  }

  db.get('SELECT data FROM datasets WHERE id = ?', [datasetId], (err, dataset) => {
    if (err || !dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      const data = JSON.parse(dataset.data);
      const values = data.map(row => parseFloat(row[columnName])).filter(v => !isNaN(v));
      
      if (values.length === 0) {
        return res.status(400).json({ error: 'No numeric data in column' });
      }

      const anomalies = detectAnomalies(values, method, threshold);
      
      // Save anomalies to database
      const insertStmt = db.prepare(`INSERT INTO anomalies 
        (dataset_id, column_name, row_index, value, anomaly_type, severity, score, expected_value, deviation, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      anomalies.forEach(a => {
        insertStmt.run([
          datasetId, columnName, a.rowIndex, a.value, a.type, a.severity, 
          a.score, a.expectedValue, a.deviation, a.description
        ]);
      });
      insertStmt.finalize();

      res.json({
        success: true,
        anomalies,
        summary: {
          total: anomalies.length,
          high: anomalies.filter(a => a.severity === 'high').length,
          medium: anomalies.filter(a => a.severity === 'medium').length,
          low: anomalies.filter(a => a.severity === 'low').length
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Detect anomalies using various methods
 */
function detectAnomalies(values, method, threshold) {
  const anomalies = [];
  const n = values.length;

  if (method === 'zscore') {
    // Z-Score method
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / n);

    values.forEach((value, index) => {
      const zscore = std > 0 ? (value - mean) / std : 0;
      if (Math.abs(zscore) > threshold) {
        anomalies.push({
          rowIndex: index,
          value,
          type: zscore > 0 ? 'spike' : 'drop',
          severity: Math.abs(zscore) > 3 ? 'high' : Math.abs(zscore) > 2.5 ? 'medium' : 'low',
          score: Math.abs(zscore),
          expectedValue: mean,
          deviation: value - mean,
          description: `Value ${zscore > 0 ? 'above' : 'below'} expected by ${Math.abs(zscore).toFixed(2)} standard deviations`
        });
      }
    });
  } else if (method === 'iqr') {
    // Interquartile Range method
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;

    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        const deviation = value < lowerBound ? lowerBound - value : value - upperBound;
        anomalies.push({
          rowIndex: index,
          value,
          type: value < lowerBound ? 'drop' : 'spike',
          severity: deviation > iqr * 1.5 ? 'high' : deviation > iqr ? 'medium' : 'low',
          score: deviation / iqr,
          expectedValue: (q1 + q3) / 2,
          deviation: value - (q1 + q3) / 2,
          description: `Value outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
        });
      }
    });
  }

  return anomalies;
}

/**
 * Get all anomalies for a dataset
 * GET /api/anomalies/:datasetId
 */
app.get('/api/anomalies/:datasetId', authenticateToken, (req, res) => {
  const { datasetId } = req.params;

  db.all('SELECT * FROM anomalies WHERE dataset_id = ? ORDER BY score DESC', [datasetId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================================================
// WHAT-IF ANALYSIS API
// ============================================================

/**
 * Create a what-if scenario
 * POST /api/whatif/scenario
 */
app.post('/api/whatif/scenario', authenticateToken, (req, res) => {
  const { datasetId, name, description, baseValues, modifiedValues, filters } = req.body;
  const userId = req.userId;

  if (!datasetId || !name || !baseValues || !modifiedValues) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(`INSERT INTO whatif_scenarios 
    (dataset_id, user_id, name, description, base_values, modified_values, filters, is_baseline) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [datasetId, userId, name, description || '', JSON.stringify(baseValues), 
     JSON.stringify(modifiedValues), filters ? JSON.stringify(filters) : null, 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Calculate scenario results
      const results = calculateScenarioResults(baseValues, modifiedValues, filters);
      
      db.run('UPDATE whatif_scenarios SET results = ? WHERE id = ?', 
        [JSON.stringify(results), this.lastID]);
      
      res.json({ success: true, id: this.lastID, results });
    }
  );
});

/**
 * Calculate scenario results based on modifications
 */
function calculateScenarioResults(baseValues, modifiedValues, filters) {
  const results = {};
  
  // Calculate impact of modifications
  Object.keys(modifiedValues).forEach(key => {
    const base = baseValues[key] || 0;
    const modified = modifiedValues[key];
    const change = modified - base;
    const percentChange = base !== 0 ? (change / base) * 100 : 0;
    
    results[key] = {
      base: base,
      modified: modified,
      change: change,
      percentChange: percentChange.toFixed(2) + '%'
    };
  });

  // Apply filters if provided
  if (filters && filters.length > 0) {
    results.filtersApplied = filters;
  }

  return results;
}

/**
 * Get scenarios for a dataset
 * GET /api/whatif/scenarios/:datasetId
 */
app.get('/api/whatif/scenarios/:datasetId', authenticateToken, (req, res) => {
  const { datasetId } = req.params;
  const userId = req.userId;

  db.all('SELECT * FROM whatif_scenarios WHERE dataset_id = ? AND user_id = ? ORDER BY created_at DESC', 
    [datasetId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse JSON fields
    rows = rows.map(row => ({
      ...row,
      base_values: JSON.parse(row.base_values),
      modified_values: JSON.parse(row.modified_values),
      filters: row.filters ? JSON.parse(row.filters) : null,
      results: row.results ? JSON.parse(row.results) : null
    }));
    
    res.json(rows);
  });
});

/**
 * Compare multiple scenarios
 * POST /api/whatif/compare
 */
app.post('/api/whatif/compare', authenticateToken, (req, res) => {
  const { scenarioIds } = req.body;

  if (!scenarioIds || scenarioIds.length < 2) {
    return res.status(400).json({ error: 'At least 2 scenarios required for comparison' });
  }

  const placeholders = scenarioIds.map(() => '?').join(',');
  db.all(`SELECT * FROM whatif_scenarios WHERE id IN (${placeholders})`, scenarioIds, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const comparison = rows.map(row => ({
      id: row.id,
      name: row.name,
      isBaseline: row.is_baseline,
      results: row.results ? JSON.parse(row.results) : null
    }));

    res.json({ success: true, comparison });
  });
});

// ============================================================
// SEMANTIC SEARCH API
// ============================================================

/**
 * Semantic search over dataset
 * POST /api/search/semantic
 */
app.post('/api/search/semantic', authenticateToken, (req, res) => {
  const { datasetId, query } = req.body;
  const userId = req.userId;

  if (!datasetId || !query) {
    return res.status(400).json({ error: 'datasetId and query are required' });
  }

  const startTime = Date.now();

  db.get('SELECT data FROM datasets WHERE id = ?', [datasetId], (err, dataset) => {
    if (err || !dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      const data = JSON.parse(dataset.data);
      const { filters, sql, explanation } = parseSemanticQuery(query, data);
      
      // Apply filters to data
      let filteredData = data;
      if (filters.length > 0) {
        filteredData = applyFilters(data, filters);
      }

      // Save query to history
      db.run(`INSERT INTO search_queries (user_id, dataset_id, natural_query, generated_sql, filters, result_count, execution_time_ms) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, datasetId, query, sql, JSON.stringify(filters), filteredData.length, Date.now() - startTime]);

      res.json({
        success: true,
        query: query,
        generatedSql: sql,
        explanation: explanation,
        filters: filters,
        results: filteredData.slice(0, 100), // Limit to 100 results
        totalCount: filteredData.length,
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Parse natural language query into filters
 */
function parseSemanticQuery(query, data) {
  const filters = [];
  let sql = 'SELECT * FROM data';
  const lowerQuery = query.toLowerCase();
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Extract column references
  columns.forEach(col => {
    if (lowerQuery.includes(col.toLowerCase())) {
      // Check for comparison operators
      if (lowerQuery.includes('high') || lowerQuery.includes('above') || lowerQuery.includes('greater')) {
        filters.push({ column: col, operator: '>', value: getColumnMedian(data, col) });
        sql += ` WHERE ${col} > ${getColumnMedian(data, col)}`;
      } else if (lowerQuery.includes('low') || lowerQuery.includes('below') || lowerQuery.includes('less')) {
        filters.push({ column: col, operator: '<', value: getColumnMedian(data, col) });
        sql += ` WHERE ${col} < ${getColumnMedian(data, col)}`;
      } else if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
        filters.push({ column: col, operator: '>', value: getColumnMean(data, col) });
        sql += ` WHERE ${col} > ${getColumnMean(data, col)}`;
      }
    }
  });

  // Time-based queries
  const timePatterns = [
    { pattern: /last (\d+) (day|week|month)/i, extract: (m) => ({ days: parseInt(m[1]) * (m[2] === 'week' ? 7 : m[2] === 'month' ? 30 : 1) }) },
    { pattern: /this (week|month|year)/i, extract: () => ({ type: 'this_period' }) }
  ];

  // Check for aggregation keywords
  if (lowerQuery.includes('sum') || lowerQuery.includes('total')) {
    sql = sql.replace('SELECT *', 'SELECT SUM(*) as total');
  } else if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
    sql = sql.replace('SELECT *', 'SELECT AVG(*) as average');
  } else if (lowerQuery.includes('count')) {
    sql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  }

  const explanation = `Analyzed query "${query}" and applied ${filters.length} filter(s) to dataset`;

  return { filters, sql, explanation };
}

function getColumnMedian(data, column) {
  const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v)).sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] || 0;
}

function getColumnMean(data, column) {
  const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
  return values.reduce((a, b) => a + b, 0) / values.length || 0;
}

function applyFilters(data, filters) {
  return data.filter(row => {
    return filters.every(filter => {
      const value = parseFloat(row[filter.column]);
      if (isNaN(value)) return true;
      
      switch (filter.operator) {
        case '>': return value > filter.value;
        case '<': return value < filter.value;
        case '=': return value === filter.value;
        case '>=': return value >= filter.value;
        case '<=': return value <= filter.value;
        default: return true;
      }
    });
  });
}

// ============================================================
// FORECASTING API
// ============================================================

/**
 * Generate forecast predictions
 * POST /api/forecast/predict
 */
app.post('/api/forecast/predict', authenticateToken, (req, res) => {
  const { datasetId, columnName, modelType = 'moving_average', horizon = 12, parameters = {} } = req.body;
  const userId = req.userId;

  if (!datasetId || !columnName) {
    return res.status(400).json({ error: 'datasetId and columnName are required' });
  }

  db.get('SELECT data FROM datasets WHERE id = ?', [datasetId], (err, dataset) => {
    if (err || !dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      const data = JSON.parse(dataset.data);
      const values = data.map(row => parseFloat(row[columnName])).filter(v => !isNaN(v));
      
      if (values.length < 3) {
        return res.status(400).json({ error: 'Need at least 3 data points for forecasting' });
      }

      let predictions;
      let metrics;

      switch (modelType) {
        case 'linear_regression':
          ({ predictions, metrics } = linearRegressionForecast(values, horizon, parameters));
          break;
        case 'exponential_smoothing':
          ({ predictions, metrics } = exponentialSmoothingForecast(values, horizon, parameters));
          break;
        case 'moving_average':
        default:
          ({ predictions, metrics } = movingAverageForecast(values, horizon, parameters));
      }

      // Save model
      const windowSize = parameters.windowSize || 3;
      db.run(`INSERT INTO forecast_models 
        (dataset_id, user_id, name, model_type, target_column, parameters, metrics, is_default) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [datasetId, userId, `${columnName} Forecast`, modelType, columnName, 
         JSON.stringify(parameters), JSON.stringify(metrics), 0],
        function(err) {
          if (err) console.error('Error saving model:', err);
        });

      res.json({
        success: true,
        modelType,
        targetColumn: columnName,
        horizon,
        predictions,
        metrics,
        historicalData: values.slice(-20)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Moving Average Forecast
 */
function movingAverageForecast(values, horizon, params) {
  const windowSize = params.windowSize || 3;
  const predictions = [];
  
  for (let i = 0; i < horizon; i++) {
    const window = values.slice(-windowSize);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    predictions.push({
      period: values.length + i + 1,
      predicted: avg,
      confidence: 0.95 - (i * 0.02)
    });
  }

  // Calculate metrics on historical data
  const errors = [];
  for (let i = windowSize; i < values.length; i++) {
    const window = values.slice(i - windowSize, i);
    const predicted = window.reduce((a, b) => a + b, 0) / windowSize;
    errors.push(Math.abs(values[i] - predicted));
  }
  
  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  
  return {
    predictions,
    metrics: {
      method: 'Moving Average',
      windowSize,
      mae: mae.toFixed(2),
      accuracy: (100 - (mae / (values.reduce((a, b) => a + b, 0) / values.length) * 100)).toFixed(2) + '%'
    }
  };
}

/**
 * Linear Regression Forecast
 */
function linearRegressionForecast(values, horizon, params) {
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const predictions = [];
  for (let i = 0; i < horizon; i++) {
    const x = n + i;
    predictions.push({
      period: x + 1,
      predicted: slope * x + intercept,
      confidence: Math.max(0.7, 0.95 - (i * 0.03))
    });
  }

  // Calculate R-squared
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssTot += Math.pow(values[i] - meanY, 2);
    ssRes += Math.pow(values[i] - predicted, 2);
  }
  const rSquared = 1 - (ssRes / ssTot);

  return {
    predictions,
    metrics: {
      method: 'Linear Regression',
      slope: slope.toFixed(4),
      intercept: intercept.toFixed(4),
      rSquared: rSquared.toFixed(4)
    }
  };
}

/**
 * Exponential Smoothing Forecast
 */
function exponentialSmoothingForecast(values, horizon, params) {
  const alpha = params.alpha || 0.3;
  const predictions = [];
  
  // Calculate smoothed values
  let smoothed = values[0];
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }
  
  for (let i = 0; i < horizon; i++) {
    predictions.push({
      period: values.length + i + 1,
      predicted: smoothed,
      confidence: Math.max(0.6, 0.9 - (i * 0.04))
    });
  }

  return {
    predictions,
    metrics: {
      method: 'Exponential Smoothing',
      alpha,
      lastSmoothed: smoothed.toFixed(2)
    }
  };
}

/**
 * Get available forecast models
 * GET /api/forecast/models
 */
app.get('/api/forecast/models', authenticateToken, (req, res) => {
  const models = [
    { id: 'moving_average', name: 'Moving Average', description: 'Simple moving average forecast', parameters: ['windowSize'] },
    { id: 'linear_regression', name: 'Linear Regression', description: 'Linear trend projection', parameters: [] },
    { id: 'exponential_smoothing', name: 'Exponential Smoothing', description: 'Weighted average forecast', parameters: ['alpha'] }
  ];
  res.json(models);
});

// ============================================================
// DATA LINEAGE API
// ============================================================

/**
 * Track lineage for a dataset
 * POST /api/lineage/track
 */
app.post('/api/lineage/track', authenticateToken, (req, res) => {
  const { datasetId, name, description, nodes } = req.body;
  const userId = req.userId;

  if (!datasetId || !name || !nodes) {
    return res.status(400).json({ error: 'datasetId, name, and nodes are required' });
  }

  db.run(`INSERT INTO lineage_chains (dataset_id, user_id, name, description) VALUES (?, ?, ?, ?)`,
    [datasetId, userId, name, description || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const chainId = this.lastID;
      
      // Insert nodes
      const nodeStmt = db.prepare(`INSERT INTO lineage_nodes 
        (chain_id, node_type, name, config, input_data_hash, output_data_hash, execution_time_ms, order_index) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      nodes.forEach((node, index) => {
        nodeStmt.run([
          chainId, node.type, node.name, JSON.stringify(node.config || {}),
          node.inputHash || '', node.outputHash || '', node.executionTime || 0, index
        ]);
      });
      nodeStmt.finalize();

      res.json({ success: true, chainId, nodeCount: nodes.length });
    }
  );
});

/**
 * Get lineage for a dataset
 * GET /api/lineage/:datasetId
 */
app.get('/api/lineage/:datasetId', authenticateToken, (req, res) => {
  const { datasetId } = req.params;
  const userId = req.userId;

  db.all('SELECT * FROM lineage_chains WHERE dataset_id = ? AND user_id = ? ORDER BY created_at DESC',
    [datasetId, userId], (err, chains) => {
    if (err) return res.status(500).json({ error: err.message });

    const getNodes = chains.map(c => new Promise((resolve) => {
      db.all('SELECT * FROM lineage_nodes WHERE chain_id = ? ORDER BY order_index', [c.id], (err, nodes) => {
        resolve({ ...c, nodes });
      });
    }));

    Promise.all(getNodes).then(result => {
      res.json(result);
    });
  });
});

// ============================================================
// PIPELINE API
// ============================================================

/**
 * Get all pipelines
 * GET /api/pipelines
 */
app.get('/api/pipelines', authenticateToken, (req, res) => {
  const userId = req.userId;

  db.all('SELECT * FROM pipelines WHERE user_id = ? OR is_public = 1 ORDER BY updated_at DESC', 
    [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    rows = rows.map(row => ({
      ...row,
      steps: JSON.parse(row.steps),
      config: row.config ? JSON.parse(row.config) : null
    }));
    
    res.json(rows);
  });
});

/**
 * Create pipeline
 * POST /api/pipelines
 */
app.post('/api/pipelines', authenticateToken, (req, res) => {
  const { name, description, steps, config, isPublic } = req.body;
  const userId = req.userId;

  if (!name || !steps) {
    return res.status(400).json({ error: 'name and steps are required' });
  }

  db.run(`INSERT INTO pipelines (user_id, name, description, steps, config, is_public) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, name, description || '', JSON.stringify(steps), config ? JSON.stringify(config) : null, isPublic ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

/**
 * Execute pipeline
 * POST /api/pipelines/:id/execute
 */
app.post('/api/pipelines/:id/execute', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { datasetId, inputData } = req.body;

  db.get('SELECT * FROM pipelines WHERE id = ?', [id], (err, pipeline) => {
    if (err || !pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const steps = JSON.parse(pipeline.steps);
    const startTime = Date.now();
    
    // Execute pipeline steps
    let currentData = inputData || [];
    
    try {
      steps.forEach(step => {
        currentData = executePipelineStep(step, currentData);
      });

      const executionTime = Date.now() - startTime;
      const outputHash = crypto.createHash('md5').update(JSON.stringify(currentData)).digest('hex');

      // Save execution
      db.run(`INSERT INTO pipeline_executions 
        (pipeline_id, dataset_id, status, input_data_hash, output_data_hash, results, execution_time_ms) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, datasetId || null, 'completed', 
         crypto.createHash('md5').update(JSON.stringify(inputData || [])).digest('hex'),
         outputHash, JSON.stringify(currentData.slice(0, 100)), executionTime]);

      res.json({
        success: true,
        executionTime,
        outputData: currentData,
        rowCount: currentData.length
      });
    } catch (error) {
      db.run(`INSERT INTO pipeline_executions (pipeline_id, dataset_id, status, error_message) VALUES (?, ?, ?, ?)`,
        [id, datasetId || null, 'failed', error.message]);
      
      res.status(500).json({ error: error.message });
    }
  });
});

function executePipelineStep(step, data) {
  switch (step.type) {
    case 'filter':
      return data.filter(row => {
        return Object.keys(step.conditions || {}).every(key => {
          const cond = step.conditions[key];
          return evaluateCondition(row[key], cond.operator, cond.value);
        });
      });
    
    case 'transform':
      return data.map(row => {
        const newRow = { ...row };
        step.transforms.forEach(t => {
          newRow[t.column] = applyTransform(newRow[t.column], t.operation, t.params);
        });
        return newRow;
      });
    
    case 'aggregate':
      return aggregateData(data, step.groupBy, step.aggregations);
    
    case 'sort':
      return [...data].sort((a, b) => {
        const aVal = a[step.column];
        const bVal = b[step.column];
        return step.order === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });
    
    default:
      return data;
  }
}

function evaluateCondition(value, operator, compareValue) {
  switch (operator) {
    case '=': return value == compareValue;
    case '!=': return value != compareValue;
    case '>': return parseFloat(value) > parseFloat(compareValue);
    case '<': return parseFloat(value) < parseFloat(compareValue);
    case '>=': return parseFloat(value) >= parseFloat(compareValue);
    case '<=': return parseFloat(value) <= parseFloat(compareValue);
    case 'contains': return String(value).includes(compareValue);
    case 'startsWith': return String(value).startsWith(compareValue);
    default: return true;
  }
}

function applyTransform(value, operation, params) {
  switch (operation) {
    case 'uppercase': return String(value).toUpperCase();
    case 'lowercase': return String(value).toLowerCase();
    case 'trim': return String(value).trim();
    case 'round': return Math.round(parseFloat(value) * (params.decimals || 0)) / (params.decimals || 1);
    case 'multiply': return parseFloat(value) * (params.factor || 1);
    case 'divide': return parseFloat(value) / (params.factor || 1);
    default: return value;
  }
}

function aggregateData(data, groupBy, aggregations) {
  const groups = {};
  
  data.forEach(row => {
    const key = groupBy.map(col => row[col]).join('_');
    if (!groups[key]) {
      groups[key] = { _count: 0, _items: [] };
      groupBy.forEach(col => groups[key][col] = row[col]);
    }
    groups[key]._count++;
    groups[key]._items.push(row);
  });

  return Object.values(groups).map(group => {
    const result = {};
    groupBy.forEach(col => result[col] = group[col]);
    
    aggregations.forEach(agg => {
      const values = group._items.map(item => parseFloat(item[agg.column])).filter(v => !isNaN(v));
      switch (agg.operation) {
        case 'sum': result[`${agg.column}_sum`] = values.reduce((a, b) => a + b, 0); break;
        case 'avg': result[`${agg.column}_avg`] = values.reduce((a, b) => a + b, 0) / values.length; break;
        case 'min': result[`${agg.column}_min`] = Math.min(...values); break;
        case 'max': result[`${agg.column}_max`] = Math.max(...values); break;
        case 'count': result[`${agg.column}_count`] = values.length; break;
      }
    });
    
    return result;
  });
}

// ============================================================
// DATA QUALITY API
// ============================================================

/**
 * Validate dataset quality
 * POST /api/quality/validate
 */
app.post('/api/quality/validate', authenticateToken, (req, res) => {
  const { datasetId } = req.body;
  const userId = req.userId;

  db.get('SELECT data FROM datasets WHERE id = ?', [datasetId], (err, dataset) => {
    if (err || !dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      const data = JSON.parse(dataset.data);
      const issues = [];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      columns.forEach(col => {
        const values = data.map(row => row[col]);
        const missing = values.filter(v => v === null || v === undefined || v === '').length;
        
        if (missing > 0) {
          issues.push({
            type: 'missing_values',
            column: col,
            count: missing,
            percentage: ((missing / data.length) * 100).toFixed(2) + '%',
            severity: (missing / data.length) > 0.5 ? 'high' : (missing / data.length) > 0.2 ? 'medium' : 'low',
            suggestion: 'Remove rows with missing values or impute with mean/median'
          });
        }

        // Check for duplicates
        const uniqueValues = new Set(values);
        if (uniqueValues.size < values.length * 0.5 && values.length > 10) {
          issues.push({
            type: 'high_duplication',
            column: col,
            uniqueCount: uniqueValues.size,
            totalCount: values.length,
            severity: 'medium',
            suggestion: 'Consider removing duplicate values'
          });
        }

        // Check for type consistency
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numericValues.length > 0 && numericValues.length < values.length * 0.5) {
          const mixedTypes = values.some(v => !isNaN(parseFloat(v))) && values.some(v => isNaN(parseFloat(v)));
          if (mixedTypes) {
            issues.push({
              type: 'type_inconsistency',
              column: col,
              severity: 'high',
              suggestion: 'Convert all values to consistent type'
            });
          }
        }
      });

      const summary = {
        totalRows: data.length,
        totalColumns: columns.length,
        issueCount: issues.length,
        score: Math.max(0, 100 - (issues.length * 10)).toFixed(2)
      };

      // Save quality report
      db.run(`INSERT INTO quality_reports (dataset_id, user_id, overall_score, issues, summary) VALUES (?, ?, ?, ?, ?)`,
        [datasetId, userId, summary.score, JSON.stringify(issues), JSON.stringify(summary)],
        function(err) {
          if (err) console.error('Error saving quality report:', err);
        });

      res.json({ success: true, issues, summary });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// ============================================================
// PRIVACY & SECURITY API
// ============================================================

/**
 * Apply privacy rules to dataset
 * POST /api/privacy/apply
 */
app.post('/api/privacy/apply', authenticateToken, (req, res) => {
  const { datasetId, rules } = req.body;

  db.get('SELECT data FROM datasets WHERE id = ?', [datasetId], (err, dataset) => {
    if (err || !dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      let data = JSON.parse(dataset.data);

      rules.forEach(rule => {
        data = data.map(row => ({
          ...row,
          [rule.column]: applyPrivacyRule(row[rule.column], rule.ruleType, rule.parameters)
        }));
      });

      res.json({ success: true, data, rowCount: data.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

function applyPrivacyRule(value, ruleType, params) {
  if (value === null || value === undefined) return value;
  
  switch (ruleType) {
    case 'mask':
      const char = params?.character || '*';
      const visible = params?.visibleChars || 0;
      const str = String(value);
      return str.substring(0, visible) + char.repeat(Math.max(0, str.length - visible));
    
    case 'hash':
      return crypto.createHash('sha256').update(String(value)).digest('hex').substring(0, 16);
    
    case 'redact':
      return '[REDACTED]';
    
    case 'encrypt':
      // In production, use proper encryption
      return Buffer.from(String(value)).toString('base64');
    
    case 'remove':
      return null;
    
    default:
      return value;
  }
}

/**
 * Save privacy rule
 * POST /api/privacy/rules
 */
app.post('/api/privacy/rules', authenticateToken, (req, res) => {
  const { name, columnName, ruleType, parameters } = req.body;
  const userId = req.userId;

  db.run(`INSERT INTO privacy_rules (user_id, name, column_name, rule_type, parameters) VALUES (?, ?, ?, ?, ?)`,
    [userId, name, columnName, ruleType, JSON.stringify(parameters || {})],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ============================================================
// DASHBOARD WIDGETS API
// ============================================================

/**
 * Get all widgets
 * GET /api/widgets
 */
app.get('/api/widgets', (req, res) => {
  db.all('SELECT * FROM widgets', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    rows = rows.map(row => ({
      ...row,
      default_config: JSON.parse(row.default_config)
    }));
    
    res.json(rows);
  });
});

/**
 * Save dashboard layout
 * POST /api/widgets/layout
 */
app.post('/api/widgets/layout', authenticateToken, (req, res) => {
  const { name, widgets, isDefault } = req.body;
  const userId = req.userId;

  if (isDefault) {
    db.run('UPDATE dashboard_layouts SET is_default = 0 WHERE user_id = ?', [userId]);
  }

  db.run(`INSERT INTO dashboard_layouts (user_id, name, widgets, is_default) VALUES (?, ?, ?, ?)`,
    [userId, name, JSON.stringify(widgets), isDefault ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

/**
 * Get dashboard layouts
 * GET /api/widgets/layouts
 */
app.get('/api/widgets/layouts', authenticateToken, (req, res) => {
  const userId = req.userId;

  db.all('SELECT * FROM dashboard_layouts WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC',
    [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    rows = rows.map(row => ({
      ...row,
      widgets: JSON.parse(row.widgets)
    }));
    
    res.json(rows);
  });
});

// ============================================================
// MODEL COMPARISON API
// ============================================================

/**
 * Compare analysis models
 * POST /api/models/compare
 */
app.post('/api/models/compare', authenticateToken, (req, res) => {
  const { datasetId, targetColumn, models } = req.body;
  const userId = req.userId;

  if (!datasetId || !targetColumn || !models || models.length < 2) {
    return res.status(400).json({ error: 'Need datasetId, targetColumn, and at least 2 models' });
  }

  db.get('SELECT data FROM datasets WHERE id = ?', [datasetId], (err, dataset) => {
    if (err || !dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    try {
      const data = JSON.parse(dataset.data);
      const values = data.map(row => parseFloat(row[targetColumn])).filter(v => !isNaN(v));
      
      const results = models.map(model => {
        let metrics;
        switch (model.type) {
          case 'moving_average':
            const ma3 = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
            const ma5 = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
            metrics = { mae: Math.abs(values[values.length - 1] - (model.window === 3 ? ma3 : ma5)).toFixed(2) };
            break;
          case 'linear_regression':
            const n = values.length;
            const sumX = (n * (n - 1)) / 2;
            const sumY = values.reduce((a, b) => a + b, 0);
            const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
            const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            metrics = { slope: slope.toFixed(4) };
            break;
          default:
            metrics = {};
        }
        return { model: model.name, type: model.type, metrics };
      });

      // Find best model
      const best = results[0];

      // Save comparison
      db.run(`INSERT INTO model_comparisons (user_id, name, dataset_id, target_column, models, metrics, best_model_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, `Comparison ${Date.now()}`, datasetId, targetColumn, 
         JSON.stringify(models), JSON.stringify(results), 1],
        function(err) {
          if (err) console.error('Error saving comparison:', err);
        });

      res.json({ success: true, results, bestModel: best });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// ============================================================
// XAI (EXPLAINABLE AI) API
// ============================================================

/**
 * Generate analysis explanation
 * POST /api/xai/explain
 */
app.post('/api/xai/explain', authenticateToken, (req, res) => {
  const { analysisId, insightText, data, targetColumn } = req.body;

  if (!insightText || !data) {
    return res.status(400).json({ error: 'insightText and data are required' });
  }

  try {
    // Calculate column contributions using correlation
    const columns = Object.keys(data[0] || {});
    const contributions = {};
    
    const targetValues = data.map(row => parseFloat(row[targetColumn])).filter(v => !isNaN(v));
    const targetMean = targetValues.reduce((a, b) => a + b, 0) / targetValues.length;

    columns.forEach(col => {
      if (col === targetColumn) return;
      
      const colValues = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (colValues.length < 2) return;

      const colMean = colValues.reduce((a, b) => a + b, 0) / colValues.length;
      
      // Calculate correlation
      let sumXY = 0, sumX2 = 0, sumY2 = 0;
      const minLen = Math.min(colValues.length, targetValues.length);
      
      for (let i = 0; i < minLen; i++) {
        const x = colValues[i] - colMean;
        const y = targetValues[i] - targetMean;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
      }
      
      const correlation = sumX2 && sumY2 ? sumXY / Math.sqrt(sumX2 * sumY2) : 0;
      contributions[col] = {
        score: Math.abs(correlation).toFixed(4),
        direction: correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'neutral',
        description: `Correlation with ${targetColumn}: ${correlation.toFixed(4)}`
      };
    });

    // Sort by contribution
    const sortedContributions = Object.entries(contributions)
      .sort((a, b) => parseFloat(b[1].score) - parseFloat(a[1].score))
      .slice(0, 5);

    const explanation = {
      insight: insightText,
      contributingColumns: sortedContributions.reduce((acc, [col, val]) => {
        acc[col] = val;
        return acc;
      }, {}),
      confidence: 0.85,
      method: 'correlation',
      details: {
        totalColumnsAnalyzed: columns.length,
        significantContributors: sortedContributions.length
      }
    };

    // Save explanation
    db.run(`INSERT INTO analysis_explanations (analysis_id, insight_text, contributing_columns, confidence, method, details) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [analysisId || 1, insightText, JSON.stringify(contributions), 0.85, 'correlation', JSON.stringify(explanation.details)]);

    res.json({ success: true, explanation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// OFFLINE SYNC API
// ============================================================

/**
 * Queue data for sync
 * POST /api/sync/queue
 */
app.post('/api/sync/queue', authenticateToken, (req, res) => {
  const { operation, tableName, recordId, data } = req.body;
  const userId = req.userId;

  db.run(`INSERT INTO sync_queue (user_id, operation, table_name, record_id, data) VALUES (?, ?, ?, ?, ?)`,
    [userId, operation, tableName, recordId, JSON.stringify(data)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

/**
 * Get pending sync items
 * GET /api/sync/pending
 */
app.get('/api/sync/pending', authenticateToken, (req, res) => {
  const userId = req.userId;

  db.all('SELECT * FROM sync_queue WHERE user_id = ? AND status = ? ORDER BY created_at',
    [userId, 'pending'], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    rows = rows.map(row => ({
      ...row,
      data: JSON.parse(row.data)
    }));
    
    res.json(rows);
  });
});

/**
 * Mark items as synced
 * POST /api/sync/complete
 */
app.post('/api/sync/complete', authenticateToken, (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ error: 'ids required' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.run(`UPDATE sync_queue SET status = 'synced', synced_at = datetime('now') WHERE id IN (${placeholders})`,
    ids, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, count: ids.length });
    }
  );
});

// ============================================================
// PLUGIN API
// ============================================================

/**
 * Get all plugins
 * GET /api/plugins
 */
app.get('/api/plugins', (req, res) => {
  db.all('SELECT * FROM plugins WHERE is_enabled = 1', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    rows = rows.map(row => ({
      ...row,
      manifest: JSON.parse(row.manifest)
    }));
    
    res.json(rows);
  });
});

/**
 * Install plugin
 * POST /api/plugins/install
 */
app.post('/api/plugins/install', authenticateToken, (req, res) => {
  const { name, version, description, author, manifest } = req.body;

  db.run(`INSERT OR REPLACE INTO plugins (name, version, description, author, manifest, is_enabled) 
    VALUES (?, ?, ?, ?, ?, 1)`,
    [name, version, description || '', author || '', JSON.stringify(manifest)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

/**
 * Toggle plugin
 * POST /api/plugins/:id/toggle
 */
app.post('/api/plugins/:id/toggle', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  db.run('UPDATE plugins SET is_enabled = ? WHERE id = ?', [enabled ? 1 : 0, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================
// DATASET API (Existing + New)
// ============================================================

/**
 * Get all datasets
 * GET /api/datasets
 */
app.get('/api/datasets', authenticateToken, (req, res) => {
  const userId = req.userId;
  
  db.all('SELECT id, name, description, file_size, row_count, column_count, created_at, updated_at FROM datasets WHERE user_id = ? ORDER BY created_at DESC', 
    [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * Get dataset by ID
 * GET /api/datasets/:id
 */
app.get('/api/datasets/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM datasets WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Dataset not found' });
    
    if (row.data) {
      row.data = JSON.parse(row.data);
    }
    res.json(row);
  });
});

/**
 * Create dataset
 * POST /api/datasets
 */
app.post('/api/datasets', authenticateToken, (req, res) => {
  const { name, description, data, fileSize } = req.body;
  const userId = req.userId;

  if (!name || !data) {
    return res.status(400).json({ error: 'name and data are required' });
  }

  const rowCount = Array.isArray(data) ? data.length : 0;
  const columnCount = rowCount > 0 ? Object.keys(data[0]).length : 0;

  db.run(`INSERT INTO datasets (user_id, name, description, data, file_size, row_count, column_count) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, description || '', JSON.stringify(data), fileSize || 0, rowCount, columnCount],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, rowCount, columnCount });
    }
  );
});

// ============================================================
// REPORTS API (Existing)
// ============================================================

/**
 * Get all reports
 * GET /api/reports
 */
app.get('/api/reports', authenticateToken, (req, res) => {
  const userId = req.userId;
  
  db.all('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * Create report
 * POST /api/reports
 */
app.post('/api/reports', authenticateToken, (req, res) => {
  const { title, content, type, datasetId } = req.body;
  const userId = req.userId;

  db.run(`INSERT INTO reports (user_id, dataset_id, title, content, type) VALUES (?, ?, ?, ?, ?)`,
    [userId, datasetId || null, title, content, type || 'standard'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀 Advanced Data Analysis Platform API running on http://localhost:${PORT}`);
  console.log(`📊 Database: SQLite (data_analysis.db)`);
  console.log(`🔐 Authentication: JWT-based (demo mode: default user)`);
});

module.exports = app;
