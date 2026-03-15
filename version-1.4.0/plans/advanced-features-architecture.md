# Advanced Data Analysis Platform - Architecture

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Angular 17+)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Dashboard  │  │   Reports    │  │   Pipeline   │  │   Analysis   │   │
│  │   Widgets    │  │   Viewer      │  │   Builder    │  │   Studio     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Core Services Layer                                │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │  │
│  │  │ Anomaly    │ │ Forecasting│ │ Semantic   │ │ Data Lineage   │   │  │
│  │  │ Detection  │ │ Service    │ │ Search     │ │ Service        │   │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │  │
│  │  │ What-If    │ │ Data       │ │ Privacy   │ │ Pipeline       │   │  │
│  │  │ Analysis   │ │ Quality    │ │ Service   │ │ Service        │   │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Storage Layer (IndexedDB/WASM)                   │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │  │
│  │  │ Local Data │ │ Pipeline   │ │ Widget     │ │ Cache          │   │  │
│  │  │ Store      │ │ Store      │ │ Layouts    │ │ Store          │   │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API + WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js/Express)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        API Gateway                                    │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │   │
│  │  │ Auth       │ │ Data       │ │ Pipeline   │ │ Analysis       │   │   │
│  │  │ Middleware │ │ Routes     │ │ Routes     │ │ Routes         │   │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Analysis Engine                                   │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐   │   │
│  │  │ Statistical│ │ ML/AI      │ │ NLP        │ │ Visualization  │   │   │
│  │  │ Analyzer   │ │ Engine     │ │ Processor  │ │ Generator      │   │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (SQLite + File Storage)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │
│  │  Users     │ │  Datasets  │ │ Pipelines  │ │  Analysis Results      │  │
│  │  Tables    │ │  Tables    │ │ Tables     │ │  Tables                │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │
│  │  Lineage   │ │  Widgets   │ │  Plugins   │ │  Audit Logs             │  │
│  │  Tables    │ │  Tables    │ │  Tables    │ │  Tables                │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Feature Modules

### 2.1 Data Lineage & Provenance
- Track full pipeline: source → transformations → analysis → visualization → report
- Store transformation chains with timestamps
- Visual flow diagram in UI

### 2.2 Explainable Analysis (XAI)
- Column/field contribution scores
- Trend/spike explanation generation
- Insight attribution

### 2.3 Anomaly Detection
- Statistical outlier detection (Z-score, IQR)
- Sudden spike/drop detection
- Visual highlighting on charts

### 2.4 What-If Analysis
- Dynamic value modification
- Real-time recalculation
- Scenario comparison

### 2.5 Semantic Search
- Natural language queries
- SQL filter generation
- Context-aware search

### 2.6 Forecasting/Prediction
- Moving average
- Linear regression
- Trend visualization

### 2.7 Reproducible Pipelines
- Pipeline save/load
- One-click re-run
- Version control

### 2.8 Visual Query Builder
- Drag-drop column selection
- Aggregation builder
- SQL auto-generation

### 2.9 Data Quality & Validation
- Missing value detection
- Type validation
- Auto-cleaning suggestions

### 2.10 Privacy & Security
- Field masking (PII)
- Hash encryption
- Column-level access

### 2.11 Dashboard Widget System
- Widget library
- Layout management
- User preferences

### 2.12 Model Comparison
- Multi-strategy comparison
- Performance metrics
- Benchmarking

### 2.13 Offline Mode
- IndexedDB storage
- WASM SQLite
- Sync on reconnect

### 2.14 Plugin Architecture
- Module loader
- Extension points
- Custom charts

## 3. Component Hierarchy

```
AppComponent
├── AuthGuard
├── DashboardComponent
│   ├── WidgetContainerComponent
│   │   ├── ChartWidgetComponent
│   │   ├── TableWidgetComponent
│   │   ├── SummaryWidgetComponent
│   │   └── CustomWidgetComponent
│   └── QuickActionsComponent
├── AnalysisStudioComponent
│   ├── DataLineageComponent (new)
│   │   └── LineageGraphComponent
│   ├── AnomalyDetectionComponent (new)
│   │   ├── AnomalyListComponent
│   │   └── AnomalyChartComponent
│   ├── WhatIfAnalysisComponent (new)
│   │   ├── ScenarioBuilderComponent
│   │   └── ComparisonViewComponent
│   ├── SemanticSearchComponent (new)
│   │   ├── QueryInputComponent
│   │   └── ResultsViewComponent
│   ├── ForecastingComponent (new)
│   │   ├── ModelSelectorComponent
│   │   └── ForecastChartComponent
│   ├── XAIExplanationComponent (new)
│   │   └── InsightAttributionComponent
│   └── ModelComparisonComponent (new)
├── PipelineBuilderComponent
│   ├── BlockPaletteComponent
│   ├── PipelineCanvasComponent
│   └── PipelineExecutorComponent
├── VisualQueryBuilderComponent (new)
│   ├── ColumnSelectorComponent
│   ├── FilterBuilderComponent
│   ├── AggregationBuilderComponent
│   └── SQLPreviewComponent
├── DataQualityComponent (new)
│   ├── ValidationRulesComponent
│   ├── IssueListComponent
│   └── CleaningSuggestionsComponent
├── PrivacySettingsComponent (new)
│   ├── FieldMaskingComponent
│   ├── AccessControlComponent
│   └── EncryptionSettingsComponent
├── PluginManagerComponent (new)
│   ├── PluginListComponent
│   ├── PluginInstallerComponent
│   └── PluginSettingsComponent
└── SettingsComponent
    └── OfflineSettingsComponent (new)
```

## 4. Service Architecture

```
CoreServices
├── AnalysisService
│   ├── analyze()
│   ├── generateInsights()
│   └── getContributions()
├── AnomalyService (NEW)
│   ├── detectAnomalies()
│   ├── getOutliers()
│   └── highlightAnomalies()
├── ForecastingService (NEW)
│   ├── predict()
│   ├── movingAverage()
│   └── linearRegression()
├── WhatIfService (NEW)
│   ├── createScenario()
│   ├── compareScenarios()
│   └── recalculate()
├── SemanticSearchService (NEW)
│   ├── search()
│   ├── parseQuery()
│   └── generateFilters()
├── LineageService (NEW)
│   ├── track()
│   ├── getFlow()
│   └── visualize()
├── PipelineService
│   ├── save()
│   ├── execute()
│   └── replay()
├── DataQualityService (NEW)
│   ├── validate()
│   ├── detectIssues()
│   └── suggestCleaning()
├── PrivacyService (NEW)
│   ├── maskField()
│   ├── hashValue()
│   └── checkAccess()
├── WidgetService (NEW)
│   ├── addWidget()
│   ├── removeWidget()
│   └── saveLayout()
├── PluginService (NEW)
│   ├── loadPlugin()
│   ├── unloadPlugin()
│   └── getExtensions()
└── OfflineService (NEW)
    ├── sync()
    ├── getLocalData()
    └── resolveConflicts()
```

## 5. Data Flow

```
User Input → Query Parser → Analysis Engine → Results Cache → UI Update
                    ↓
            ┌───────┴───────┐
            │               │
      Local Analysis    Server Analysis
            │               │
            └───────┬───────┘
                    ↓
            Results + Lineage Metadata
                    ↓
            Storage (IndexedDB/SQLite)
```

## 6. API Endpoints

### Analysis
- `POST /api/analysis/analyze` - Run analysis on dataset
- `GET /api/analysis/insights/:datasetId` - Get generated insights
- `GET /api/analysis/contributions/:insightId` - Get XAI contributions

### Anomaly Detection
- `POST /api/anomalies/detect` - Detect anomalies in dataset
- `GET /api/anomalies/:datasetId` - Get anomaly list
- `PUT /api/anomalies/:id/label` - Label anomaly

### Forecasting
- `POST /api/forecast/predict` - Generate predictions
- `GET /api/forecast/models` - List available models
- `POST /api/forecast/compare` - Compare models

### What-If
- `POST /api/whatif/scenario` - Create scenario
- `GET /api/whatif/scenarios/:datasetId` - List scenarios
- `POST /api/whatif/compare` - Compare scenarios

### Semantic Search
- `POST /api/search/semantic` - Semantic search
- `GET /api/search/translate/:query` - Get SQL translation

### Data Lineage
- `POST /api/lineage/track` - Track lineage
- `GET /api/lineage/:datasetId` - Get lineage graph

### Pipelines
- `GET /api/pipelines` - List pipelines
- `POST /api/pipelines` - Create pipeline
- `POST /api/pipelines/:id/execute` - Execute pipeline

### Data Quality
- `POST /api/quality/validate` - Validate dataset
- `GET /api/quality/issues/:datasetId` - Get issues
- `POST /api/quality/clean` - Apply cleaning

### Privacy
- `POST /api/privacy/mask` - Mask fields
- `GET /api/privacy/rules` - Get privacy rules

### Widgets
- `GET /api/widgets` - List widgets
- `POST /api/widgets` - Add widget
- `PUT /api/widgets/layout` - Save layout

### Plugins
- `GET /api/plugins` - List plugins
- `POST /api/plugins/install` - Install plugin
- `DELETE /api/plugins/:id` - Uninstall plugin
