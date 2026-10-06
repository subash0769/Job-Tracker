# Job Application Tracker

A full-stack, responsive web application for organizing, tracking, and managing software engineering and tech job applications through each interview phase. Built with **Node.js (Express), MongoDB, and Vanilla JavaScript** — strictly **Node and JavaScript only, with no Vite, no React, no bundlers, and no build steps**.

Engineered with clean separation of concerns and container-ready design: perfect for Docker practice, containerizing services, bridge networking, volume persistence, and publishing to GitHub as a standalone portfolio project.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Local Setup & Running (Without Docker)](#local-setup--running-without-docker)
  - [1. MongoDB Database Setup](#1-mongodb-database-setup)
  - [2. Node.js Application Setup](#2-node-js-application-setup)
- [Environment Variables](#environment-variables)
- [REST API Endpoints & curl Examples](#rest-api-endpoints--curl-examples)
- [Dockerization Guide & Architecture Notes](#dockerization-guide--architecture-notes)
- [License](#license)

---

## Project Overview

Job Application Tracker helps job seekers track their application pipeline:
- **Track Opportunities**: Company name, role/title, application status, location, salary range, applied date, posting URL, and interview notes.
- **Pipeline Stages**: Visual color-coded badges for `Applied`, `Interviewing`, `Offered`, `Rejected`, and `Withdrawn`.
- **Live Metrics Dashboard**: Real-time counter cards showing total applications, active interviews, offers, and rejections. Click any card to instantly filter.
- **Search & Filter**: Real-time debounced search by company name, role, or location, combined with status and sorting filters.
- **Responsive Layout**: Desktop table view with action buttons and mobile card view.
- **Dialog Modals**: Accessible edit modal for updating application details and confirmation modal for deletions.
- **Health & DB Indicator**: Header badge verifying MongoDB connection with live ping status.
- **Zero Build Step**: Native browser JavaScript (ES6+), HTML5, and modern CSS custom properties with light/dark theme support.

---

## Folder Structure

```text
job-tracker/
├── .gitignore                     # Ignores node_modules, .env, and OS/IDE files
├── README.md                      # Complete project documentation & API guide
├── database/
│   └── init-mongo.js              # MongoDB initialization script (collection, indexes, seed data)
├── backend/
│   ├── .env.example               # Template for PORT, MONGO_URI, and CORS_ORIGIN
│   ├── package.json               # Dependencies: express, mongodb (native driver), dotenv, cors
│   ├── server.js                  # Express entry point, static asset serving, graceful shutdown
│   └── src/
│       ├── config/
│       │   └── db.js              # Native MongoDB MongoClient with startup retry loop
│       ├── controllers/
│       │   └── applicationController.js # CRUD handlers and dashboard aggregation
│       ├── middleware/
│       │   └── errorHandler.js    # Global 404 and 500 error handlers
│       ├── routes/
│       │   ├── applicationRoutes.js # /api/applications endpoints
│       │   └── healthRoutes.js    # /api/health with live MongoDB ping
│       └── utils/
│           └── validation.js      # Reusable validation and sanitization rules
└── frontend/
    ├── index.html                 # Semantic HTML5 shell with accessible modals & cards
    ├── css/
    │   └── style.css              # Responsive CSS tokens, light/dark themes, animations
    └── js/
        └── app.js                 # Vanilla JavaScript application (state, DOM, API fetch)
```

---

## Prerequisites

- **Node.js**: `v20.x` LTS or newer
- **npm**: `v10.x` or newer
- **MongoDB**: `v7.0` or `v8.0`

---

## Local Setup & Running (Without Docker)

### 1. MongoDB Database Setup

1. Start your local MongoDB server:
   ```bash
   # macOS (Homebrew):
   brew services start mongodb-community

   # Linux (systemd):
   sudo systemctl start mongod
   ```

2. Seed initial sample applications using `mongosh`:
   ```bash
   mongosh < database/init-mongo.js
   ```
   *(This initializes the `job_tracker` database, creates indexes, and inserts sample applications.)*

---

### 2. Node.js Application Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   # Production mode:
   npm start

   # Development mode (with auto-reload):
   npm run dev
   ```

5. Open your browser and visit:
   - **Web UI**: [http://localhost:5000](http://localhost:5000)
   - **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - **REST API**: [http://localhost:5000/api/applications](http://localhost:5000/api/applications)

---

## Environment Variables

Configure these in `backend/.env`:

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express HTTP server |
| `MONGO_URI` | `mongodb://localhost:27017/job_tracker` | Connection string for MongoDB |
| `CORS_ORIGIN` | `*` | Allowed origins for Cross-Origin requests |



## REST API Endpoints & curl Examples

### 1. Health Check
Verifies server uptime and MongoDB ping:
```bash
curl -s http://localhost:5000/api/health | jq
```
**Response:**
```json
{
  "status": "ok",
  "service": "job-tracker-backend",
  "timestamp": "2026-10-06T08:00:00.000Z",
  "database": "connected"
}
```

---

### 2. Get Application Statistics
Returns count breakdown across all stages:
```bash
curl -s http://localhost:5000/api/applications/stats | jq
```
**Response:**
```json
{
  "total": 6,
  "applied": 2,
  "interviewing": 2,
  "offered": 1,
  "rejected": 1,
  "withdrawn": 0
}
```

---

### 3. List Applications (with optional search and filters)
```bash
# Get all applications (newest first)
curl -s http://localhost:5000/api/applications | jq

# Search by company name or role
curl -s "http://localhost:5000/api/applications?search=Google" | jq

# Filter by stage
curl -s "http://localhost:5000/api/applications?status=Interviewing" | jq

# Sort alphabetically by company
curl -s "http://localhost:5000/api/applications?sort=company_asc" | jq
```

---

### 4. Create an Application
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Amazon AWS",
    "position": "Senior Solutions Architect",
    "status": "Applied",
    "location": "Seattle, WA (Hybrid)",
    "salary": "$175,000 - $205,000",
    "appliedDate": "2026-10-06",
    "jobUrl": "https://amazon.jobs",
    "notes": "Applied via referral. Recruiter reach-out expected in 3 days."
  }' | jq
```

---

### 5. Update an Application
```bash
curl -X PUT http://localhost:5000/api/applications/<APPLICATION_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Amazon AWS",
    "position": "Senior Solutions Architect",
    "status": "Interviewing",
    "location": "Seattle, WA (Hybrid)",
    "salary": "$180,000 - $210,000",
    "appliedDate": "2026-10-06",
    "notes": "Recruiter phone screen passed. Moving to technical round."
  }' | jq
```

---

### 6. Delete an Application
```bash
curl -X DELETE http://localhost:5000/api/applications/<APPLICATION_ID> | jq
```

---

## Dockerization Guide & Architecture Notes

This codebase is specifically engineered to be containerized seamlessly:

1. **Host Binding (`0.0.0.0`)**:
   `server.js` listens on `0.0.0.0:${PORT}` so traffic routes properly through Docker port forwarding.

2. **Database Startup Retry Loop**:
   `backend/src/config/db.js` implements a connection retry loop (`connectWithRetry(20, 3000)`). When `docker compose up` starts both MongoDB and Node simultaneously, Node won't crash while MongoDB initializes.

3. **Stdout / Stderr Logging**:
   HTTP requests and server events log directly to stdout in real-time, making them easily inspectable via `docker logs <container-id>`.

4. **Graceful Shutdown**:
   Listens for `SIGTERM` and `SIGINT` to safely close the HTTP listener and cleanly disconnect MongoDB connections when stopping containers.

5. **Static File Serving**:
   Express serves the frontend directly from `../frontend` without requiring any separate web server or compilation step.

---

## License

MIT License. Feel free to use this project for your portfolio, resume, and learning!
# Job-Tracker
