## MedSentinel – Product Requirements Document (PRD)

### 1. Project Overview

- **Vision:** Predict district-level disease outbreaks early and orchestrate logistics actions (medicine, staff, ambulances) before crises escalate.
- **Differentiator:** Unifies predictive analytics, supply chain optimization, and collaborative visualization within a single MERN-based platform.
- **Primary Users:** State epidemiologists, district logistics officers, field supervisors, hospital network coordinators.
- **Value Proposition:** Delivers earlier warnings, actionable recommendations, transparent data pipelines, and intuitive dashboards tailored for low-data contexts.

### 2. Goals & Success Metrics

- **Lead Time:** ≥5-day average forecast lead time ahead of actual outbreaks.
- **Forecast Accuracy:** ≤15% MAPE on 14-day disease forecasts across districts.
- **Action Adoption:** ≥70% of generated logistics recommendations reviewed/approved.
- **Response Efficiency:** ≤4 hours median time from alert generation to logistics initiation.
- **Data Freshness:** All connected data sources ingested within 3 hours of release.

### 3. User Personas & Key Jobs

- **State Epidemiologist:** Interpret risk trends, validate forecasts, brief leadership on impending outbreaks.
- **District Logistics Officer:** Review logistics recommendations, adjust allocations, coordinate dispatch.
- **Field Supervisor:** Receive alert notifications, prepare local resources, feed ground intelligence back.
- **Executive Stakeholder:** Track portfolio-level risks, monitor interventions, request periodic reports.

### 4. Primary User Stories (MVP Scope)

1. As a state epidemiologist, I view outbreak risk heatmaps and drill into any district to inspect drivers and confidence bands.
2. As a logistics officer, I receive prioritized action recommendations (what, where, how much) and approve or modify them prior to execution.
3. As a field supervisor, I get real-time alerts about impending outbreaks and resulting resource reallocations to prepare crews on the ground.
4. As an executive, I export scheduled reports summarizing forecasts, executed actions, and model performance.

### 5. Core Features (MVP)

- **AI Forecasting Engine:** Prophet/LSTM-based models producing district-level risk scores (0–1) and 14-day case forecasts with confidence intervals and feature summaries.
- **Data Aggregation Pipeline:** Node.js ETL jobs pulling epidemiological, climate, mobility, and trends data; normalizes and stores in MongoDB with provenance metadata.
- **React Dashboard:** Mapbox heatmap, district filters, chart panels (trend lines, forecast bands, actual vs predicted), alerts sidebar, and search.
- **Logistics Decision Engine:** Converts outbreak risk plus inventory data into reallocation or dispatch plans using rule thresholds and OR-Tools optimization.
- **Reporting & Transparency:** PDF/CSV exports, model versioning, forecast-versus-actual comparisons, action audit logs.
- **Collaboration & Alerts:** Approval workflow, notifications (email/Slack; extensible to WhatsApp/Telegram), comments on recommendations.

### 6. Non-Functional Requirements

- **Performance:** Dashboard initial load under 3 seconds; backend cached reads under 500 ms; forecasting microservice under 5 seconds per request.
- **Availability:** 99% uptime target (hackathon stretch goal 95%).
- **Security & Privacy:** JWT authentication, role-based access (viewer/analyst/admin), encrypted secrets, least-privilege data access, audit logs.
- **Observability:** Structured logging, ingestion dashboards, model error monitoring, alerting on job failures, traceability across services.
- **Transparency & Trust:** Surface model confidence intervals, top contributing features, historical accuracy metrics by disease/district.

### 7. Risks & Mitigations

- **Sparse or noisy epidemiological data:** Supplement with proxy signals (Google Trends, weather, mobility), implement imputation and fallback heuristics.
- **Model underperformance:** Launch with Prophet baseline, iterate with LSTM; maintain manual override workflows and continuously log metrics.
- **API rate limits/outages:** Cache responses, implement exponential backoff, schedule staggered cron fetches, retain offline backups.
- **Logistics complexity:** Begin with rule-based allocations before scaling to full OR-Tools optimization; decouple engine for independent tuning.
- **User adoption challenges:** Conduct rapid UX feedback loops, invest in onboarding materials, ensure recommendations are clear and explainable.

### 8. Dependencies & Assumptions

- Stable access to historical and live datasets (WHO, MoHFW, Kaggle, local authorities).
- API keys for OpenWeather/OpenMeteo, Google Trends or alternative providers, Mapbox.
- MongoDB Atlas cluster and infrastructure to run Node.js and Python services (Docker or managed hosting).
- Availability of domain SME for logistics assumptions and validation.
- Hackathon timeline (30 days) with dedicated team roles covering backend, frontend, data/ML, and operations.

### 9. Pitch Narrative (Hackathon)

> Today’s outbreak systems react when it is already too late. MedSentinel predicts where disease will strike next — and tells healthcare teams exactly what to do. Using a MERN stack plus AI forecasting, we fuse health, climate, and mobility data to deliver real-time risk maps and automated logistics plans. In our demo, MedSentinel spots a dengue surge in Pune, reallocates medicine from Nagpur, and alerts officers instantly — saving critical time, stock, and lives.

### 10. Team Roles (Recommended)

- **Data & ML Lead:** Model development, feature engineering, evaluation, monitoring.
- **Backend Lead:** Data ingestion, Express APIs, integration with FastAPI and optimization services.
- **Frontend Lead:** React dashboard, UX research, accessibility.
- **Logistics/Operations SME:** Define action rules, validate recommendations, liaise with stakeholders.
- **DevOps/Infra Engineer:** CI/CD, deployments, secret management, observability, security posture.

### 11. Next Steps

- Socialize PRD with stakeholders for feedback and sign-off.
- Prioritize backlog for MVP delivery based on the 30-day plan.
- Initiate work on the accompanying technical blueprint to guide implementation teams.

