# IronLog v2 — Workout Tracker

**Repository:** https://github.com/YOUR_USERNAME/ironlog-v2

A full-stack single-page application for logging workouts, tracking progressive overload, monitoring body weight and BMI trends, and managing users — built with React, Express, and MongoDB.

---

## Problem Statement

IronLog v2 extends Assignment 1 by adding multi-user support, authentication, and an admin layer. Users define a weekly workout routine, auto-fill 6 months of sessions with progressive overload, log daily exercises and health metrics, and visualise their weight and BMI trends over time. Admins can manage all user accounts and post gym closure notices visible to everyone on the calendar.

---

## Technical Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Frontend    | React 18 + Vite                                 |
| Routing     | React Router v6 (SPA — single index.html)       |
| Styling     | Custom CSS with CSS variables (no framework)    |
| Fonts       | Barlow Condensed + Barlow (Google Fonts)        |
| HTTP client | Axios with JWT interceptor                      |
| Auth        | JWT (jsonwebtoken) + bcrypt password hashing    |
| Backend     | Node.js + Express.js                            |
| Database    | MongoDB via Mongoose ODM                        |
| Dev server  | Vite dev server (port 5173) + nodemon (3001)    |

---

## CRUD Entities

| Entity         | Create | Read | Update | Delete |
|----------------|--------|------|--------|--------|
| User           | Register | Login, admin list | Edit profile/role | Admin delete |
| Exercise       | Add to calendar | Calendar, log, routine | Edit details | Delete single or all |
| HealthMetric   | Log weight/calories | Weight graph, day drawer | Edit entry | Delete entry |
| GymClosure     | Admin creates notice | All users see on calendar | Admin edits | Admin deletes |
| Routine        | Add exercise to template | Routine view | Edit exercise | Delete exercise / clear day |

---

## Features

- **Authentication** — JWT-based register/login, password hashing with bcrypt, token stored in localStorage
- **Role-based access control** — user vs admin roles enforced on both frontend and backend
- **Single-Page Application** — React Router handles all navigation; only one `index.html`
- **Dashboard** — greeting, workout streak counter, today's planned exercises, week summary stats
- **Calendar view** — month grid with exercise pills, gym closure notices, category colour coding
- **Day drawer** — slide-in panel to add/edit/delete exercises and log weight/calories per day
- **Full log** — filterable table by type and month; filter state persists across view switches
- **Live search** — real-time filtering across exercise name, notes, and category (300ms debounce)
- **Monthly stats bar** — total exercises, active days, strength/cardio split, total volume lifted
- **Routine editor** — add, edit, and delete exercises per weekday with inline forms
- **6-month schedule fill** — auto-generates sessions from routine template; skips existing entries
- **Progressive overload** — first strength exercise per day increases +5kg every 3 weeks
- **Clear controls** — clear a specific weekday or the entire calendar in one click
- **Health metrics** — log daily weight (kg) and calories; data feeds the weight/BMI graph
- **Animated weight/BMI graph** — SVG line graph with animated stroke-dashoffset draw effect; hover tooltips; toggle between weight and BMI y-axis
- **Admin dashboard** — view all users, change roles, delete accounts and all associated data
- **Admin user search** — live search over any selected user's exercise history
- **Gym closure notices** — admin creates date-range notices; shown as red badges on all users' calendars
- **Toast notifications** — success/error feedback for every action; click to dismiss
- **Responsive design** — mobile sidebar with hamburger toggle, full-width drawer on small screens
- **Error handling** — graceful messages when backend is unavailable; never shows blank screens

---

## Folder Structure

```
ironlog-v2/
│
├── package.json                 # Server dependencies + scripts
├── .env.example                 # Environment variable template
├── .gitignore
├── README.md
│
├── server/                      # Express backend (Node.js)
│   ├── index.js                 # Entry point — CORS, middleware, route mounting
│   ├── db.js                    # MongoDB connection via Mongoose
│   ├── middleware/
│   │   └── auth.js              # JWT verification + requireAdmin guard
│   ├── models/
│   │   ├── User.js              # bcrypt hashing, toJSON strips password
│   │   ├── Exercise.js          # userId-scoped, indexed on date
│   │   ├── Routine.js           # One document per user
│   │   ├── HealthMetric.js      # Daily weight/calories, unique per user+date
│   │   └── GymClosure.js        # Admin-created closure notices
│   └── routes/
│       ├── auth.js              # Register, login, /me, profile update
│       ├── exercises.js         # Full CRUD + live search + clear routes
│       ├── routine.js           # Routine CRUD + fill-schedule + clear-day
│       ├── healthMetrics.js     # Weight/calorie CRUD
│       ├── gymClosures.js       # Admin-only closure CRUD
│       └── admin.js             # User management + read-only user data views
│
├── client/                      # React frontend (Vite)
│   ├── index.html               # Single HTML entry point
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite + proxy config
│   └── src/
│       ├── main.jsx             # React entry — mounts App in BrowserRouter
│       ├── App.jsx              # Root — auth guard, layout, SPA routing
│       ├── styles/
│       │   └── global.css       # Design system — variables, buttons, inputs
│       ├── context/
│       │   └── AuthContext.jsx  # Global auth state (user, token, login, logout)
│       ├── hooks/
│       │   ├── useToast.js      # Toast notification state manager
│       │   └── useExercises.js  # Reusable exercise fetch hook
│       ├── services/
│       │   └── api.js           # Axios instance + all API function groups
│       ├── components/
│       │   ├── Auth/
│       │   │   └── AuthPage.jsx       # Login + register combined screen
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.jsx      # Home view with streak and today's plan
│       │   │   └── Sidebar.jsx        # Navigation sidebar with user info
│       │   ├── Graph/
│       │   │   └── WeightGraph.jsx    # Animated SVG weight/BMI line graph
│       │   └── UI/
│       │       ├── Toast.jsx          # Toast notification renderer
│       │       ├── Spinner.jsx        # Loading spinner
│       │       ├── Modal.jsx          # Reusable modal dialog
│       │       └── ExerciseForm.jsx   # Shared strength/cardio form
│       └── pages/
│           ├── CalendarPage.jsx       # Month grid, day drawer, gym closures
│           ├── LogPage.jsx            # Full log with live search + weight graph
│           ├── RoutinePage.jsx        # Weekly template editor + fill schedule
│           ├── ProfilePage.jsx        # Edit name, height; logout
│           └── AdminPage.jsx          # User management + gym closure CRUD
│
└── database/
    ├── users.json               # Sample user export
    ├── exercises.json           # Sample exercise export
    ├── routines.json            # Sample routine export
    ├── healthmetrics.json       # Sample health metric export
    └── gymclosures.json         # Sample gym closure export
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) v7+
- [MongoDB Compass](https://www.mongodb.com/try/download/compass) (for importing sample data)

---

## Setup & Running

### Step 1 — Install dependencies

From the project root (installs both server and client):

```bash
npm run install:all
```

Or manually:
```bash
npm install
cd client && npm install
```

### Step 2 — Create environment file

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac / Linux:**
```bash
cp .env.example .env
```

The default `.env` contains:
```
MONGODB_URI=mongodb://localhost:27017/ironlog_v2
PORT=3001
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d
```

Change `JWT_SECRET` to any long random string before sharing or deploying.

### Step 3 — Import sample data (optional)

Open **MongoDB Compass**, connect to `mongodb://localhost:27017`, then for each file in `database/`, create the matching collection in the `ironlog_v2` database and import the JSON file via **Add Data → Import JSON**.

Collections to create: `users`, `exercises`, `routines`, `healthmetrics`, `gymclosures`

> **Note:** The sample admin account credentials are in `database/users.json`.

### Step 4 — Start the backend

In a terminal from the project root:

```bash
npm run dev:server
```

You should see:
```
✓ MongoDB connected: mongodb://localhost:27017/ironlog_v2
✓ IronLog v2 running → http://localhost:3001
```

### Step 5 — Start the frontend

In a second terminal from the project root:

```bash
npm run dev:client
```

The app opens at **http://localhost:5173**

Both terminals must stay running simultaneously.

---

## API Endpoints

| Method | Path                              | Auth     | Description                          |
|--------|-----------------------------------|----------|--------------------------------------|
| POST   | /api/auth/register                | None     | Create account                       |
| POST   | /api/auth/login                   | None     | Login, returns JWT                   |
| GET    | /api/auth/me                      | User     | Get current user profile             |
| PUT    | /api/auth/me                      | User     | Update name / height                 |
| GET    | /api/exercises?date=              | User     | Exercises for one date               |
| GET    | /api/exercises/all                | User     | All exercises with filters + search  |
| GET    | /api/exercises/summary            | User     | Calendar summary for a month         |
| POST   | /api/exercises                    | User     | Create exercise                      |
| PUT    | /api/exercises/:id                | User     | Update exercise                      |
| DELETE | /api/exercises/:id                | User     | Delete exercise                      |
| DELETE | /api/exercises/all                | User     | Clear calendar (optional ?weekday=)  |
| GET    | /api/routine                      | User     | Get routine template                 |
| PUT    | /api/routine                      | User     | Save routine template                |
| POST   | /api/routine/fill-schedule        | User     | Generate 6-month schedule            |
| DELETE | /api/routine/clear-day/:weekday   | User     | Clear a weekday from schedule        |
| GET    | /api/health-metrics               | User     | Get range of health metrics          |
| POST   | /api/health-metrics               | User     | Create/update metric for a date      |
| PUT    | /api/health-metrics/:date         | User     | Update metric                        |
| DELETE | /api/health-metrics/:date         | User     | Delete metric                        |
| GET    | /api/gym-closures                 | User     | Get closure notices                  |
| POST   | /api/gym-closures                 | Admin    | Create closure notice                |
| PUT    | /api/gym-closures/:id             | Admin    | Update closure notice                |
| DELETE | /api/gym-closures/:id             | Admin    | Delete closure notice                |
| GET    | /api/admin/users                  | Admin    | List all users                       |
| PUT    | /api/admin/users/:id/role         | Admin    | Change user role                     |
| DELETE | /api/admin/users/:id              | Admin    | Delete user and all their data       |
| GET    | /api/admin/users/:id/exercises    | Admin    | View any user's exercises            |
| GET    | /api/admin/users/:id/routine      | Admin    | View any user's routine              |
| GET    | /api/admin/users/:id/metrics      | Admin    | View any user's health metrics       |

---

## Workload Allocation

This project was completed individually by Rishabh (Student ID: 25980816).

All files were authored by Rishabh. File-level author comments are included throughout the codebase confirming this.

---

## Challenges Overcome

Scoping all data to individual users was the foundational architectural change from Assignment 1 — every Mongoose query now includes a `userId` filter, and the JWT middleware attaches the decoded user to `req.user` so routes never trust a client-supplied userId for writes. Implementing the animated SVG line graph required careful use of `getTotalLength()` combined with `stroke-dasharray` and `stroke-dashoffset` CSS properties, with a double `requestAnimationFrame` call to ensure the browser had painted the initial state before triggering the transition. The live search feature uses a 300ms debounce via `useRef` to avoid firing an API call on every keystroke, keeping the experience fast without hammering the server. Keeping React Router's URL-based navigation in sync with the sidebar's active state required deriving the active page from `useLocation()` rather than storing it in component state, which also meant deep-linking to any page works correctly on reload. Building a truly reusable `ExerciseForm` component — used identically across the day drawer, routine editor, and edit modal — required lifting all field state up to the parent and passing `onChange` handlers down, which reduced the total form-related code by roughly two thirds compared to duplicating the form in each location.
