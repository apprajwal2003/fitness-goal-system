# Adaptive & Personalized Dynamic Fitness Goal System

A full-stack web app that generates **personalized meal and workout schedules** using a **Constraint Satisfaction Algorithm**, with rescheduling when you mark slots as busy, and **squad leaderboards** for accountability.

---

## Prerequisites

Install these **before** following the run steps below.

| Requirement | Version | Notes |
|-------------|---------|--------|
| **Node.js** | 18 or higher | [Download](https://nodejs.org/) — includes npm |
| **MongoDB** | 5.x or 7.x | Only for **development** (Option A). For **containers** (Option B), MongoDB runs inside the container. |
| **Podman** or **Docker** | Latest | Only for **Option B**. [Podman](https://podman.io/) + [podman-compose](https://github.com/containers/podman-compose), or [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose). |

**Check your versions:**

```bash
node -v    # should be v18.x or higher
npm -v     # should be 9.x or higher
```

---

## Option A: Run in development (recommended for coding)

Use this when you are changing code. The client and server run locally with hot reload.

### Step 1: Get the project

```bash
# If you have the repo already, just open its folder:
cd fitness-goal-system

# Or clone (replace with your repo URL):
# git clone <repo-url>
# cd fitness-goal-system
```

### Step 2: Install dependencies

From the **project root** (the folder that contains `package.json`, `client/`, and `server/`):

```bash
npm run install:all
```

This installs dependencies for the root, client, and server. Wait until it finishes without errors.

### Step 3: Start MongoDB

You need MongoDB running so the server can connect.

- **Local MongoDB:** Start the MongoDB service (e.g. `brew services start mongodb-community` on Mac, or start the MongoDB process on Windows).
- **MongoDB Atlas:** Create a free cluster and get a connection string like `mongodb+srv://user:pass@cluster.mongodb.net/fitness_goal_system`.

If you use **Podman or Docker** only for MongoDB:

```bash
# Start only the MongoDB container (from project root)
podman-compose up -d mongo
# or: docker compose up -d mongo
```

Then use this in your `.env`: `MONGODB_URI=mongodb://localhost:27017/fitness_goal_system`.

### Step 4: Configure the server environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set at least:

| Variable | Required | What to set |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/fitness_goal_system` for local MongoDB, or your Atlas connection string. |
| `JWT_SECRET` | Yes | Any long random string (e.g. 32+ characters). Keep it secret. |

You can leave `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN`, and `CLIENT_ORIGIN` as in the example unless you need to change them.

### Step 5: Run the app

From the **project root**:

```bash
npm run dev
```

You should see the client and server starting. Wait until you see something like:

- **Vite** running (e.g. `Local: http://localhost:5173`)
- **Server** running (e.g. `Server listening on port 3000`)

### Step 6: Open the app

- **App (frontend):** [http://localhost:5173](http://localhost:5173)
- **API (backend):** [http://localhost:3000](http://localhost:3000)

Register a new user, complete onboarding, then use Dashboard, Schedule, Calendar, Progress, Squad, and Profile.

> Tips:
>
> - In **Profile / Onboarding** you can pick an exercise modality (Gym, Yoga,
>   Aerobics, Home Workout, Cardio, Mixed, or **Not sure — pick for me** when
>   you'd like the recommender to choose for you), and set your **Daily Water
>   Intake** with a "Not sure — use recommended (2.5L)" checkbox. Equipment
>   filtering is also there: tick what you actually have and the recommender
>   will only suggest exercises you can perform.
> - In **Schedule**, marking activities as **Done** now persists across
>   busy-slot edits — adding or removing a busy block re-times your day
>   without un-checking what you've already completed.
> - In **Dashboard**, the Calories card shows **consumed / target** as the
>   headline number and how many kcal you have left for the day. The Water
>   Goal card labels itself "recommended" when you picked **Not sure**.
> - In **Calendar**, missed workout days are highlighted in red with a
>   per-day motivational message (hover preview) and a monthly summary
>   strip so it shows up on mobile too.
> - In **Progress**, the Daily Goal Completion Heatmap distinguishes
>   **No plan** (slate) from **Missed** (red) so a skipped day no longer
>   looks the same as a rest day.
> - In **Squad** you can create an invite-only squad and share the
>   6-character invite code with friends — they can join with **Join with
>   an invite code** instead of a long squad ID.

---

## Option B: Run with Podman or Docker (no local Node/MongoDB needed)

Use this to run the full app and MongoDB in containers. Same steps on **Mac and Windows**.

### Step 1: Get the project

```bash
cd fitness-goal-system
```

### Step 2: Set environment for containers

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
JWT_SECRET=your-secret-key-at-least-32-characters-long
```

Use a long, random string for production. Other variables (e.g. `MONGODB_URI`) are set inside `compose.yaml` for the app and MongoDB.

### Step 3: Build and start

**With Podman:**

```bash
podman-compose up -d --build
```

**With Docker:**

```bash
docker compose up -d --build
```

Wait until the build finishes and both containers are running.

### Step 4: Open the app

Open **[http://localhost:3000](http://localhost:3000)** in your browser. The app and API are served from this single origin.

### Useful container commands

| Task | Podman | Docker |
|------|--------|--------|
| Stop app and MongoDB | `podman-compose down` | `docker compose down` |
| View app logs | `podman-compose logs -f app` | `docker compose logs -f app` |
| Restart after code changes | `podman-compose up -d --build` | `docker compose up -d --build` |
| Remove database data too | `podman-compose down -v` | `docker compose down -v` |

---

## Verify everything works

1. Open the app (Option A: http://localhost:5173 — Option B: http://localhost:3000).
2. Click **Register** and create an account.
3. Complete the **onboarding** (body, diet, goals, work hours, etc.).
4. You should land on the **Dashboard**. Use **Schedule**, **Calendar**, **Progress**, **Squad**, and **Profile** from the nav.

If any step fails, see **Troubleshooting** below.

---

## Troubleshooting

### "Cannot connect to MongoDB" or "MongoServerSelectionError"

- **Development:** Ensure MongoDB is running and `MONGODB_URI` in `server/.env` is correct (e.g. `mongodb://localhost:27017/fitness_goal_system` for local).
- **Containers:** Ensure the `mongo` container is up: `podman-compose ps` or `docker compose ps`. If not, run `podman-compose up -d` (or `docker compose up -d`) again.

### "Port 3000 is already in use" / "Port 5173 is already in use"

- Stop whatever is using that port, or change `PORT` in `server/.env` (e.g. to 3001) and use the new URL for the API. For the client, Vite will usually prompt to use another port if 5173 is busy.

### "Cannot connect to Podman" / "Cannot connect to Docker"

- **Podman:** Start the Podman machine: `podman machine init` then `podman machine start`. On Mac/Windows, Podman Desktop often manages this.
- **Docker:** Start Docker Desktop and wait until it is fully running.

### JWT or login errors

- Set `JWT_SECRET` in `server/.env` (development) or in `.env` (containers). Use a long, random string and restart the server or containers.

### After pulling new code

- **Development:** Run `npm run install:all` if `package.json` or dependencies changed, then `npm run dev`.
- **Containers:** Run `podman-compose up -d --build` (or `docker compose up -d --build`) to rebuild and restart with the latest code.

---

## Scripts (from project root)

| Command | Description |
|--------|-------------|
| `npm run install:all` | Install dependencies for root, client, and server. Run once after clone or when dependencies change. |
| `npm run dev` | Start client (Vite) and server (Node) in development with hot reload. |
| `npm run build` | Build client and server for production. |
| `npm start` | Start the server only (run after `npm run build`; use for production). |

---

## Environment variables

### Development (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/fitness_goal_system` | MongoDB connection string. |
| `JWT_SECRET` | Yes | (none) | Secret key for JWT; use a long random string. |
| `PORT` | No | `3000` | Server port. |
| `NODE_ENV` | No | `development` | Set to `production` for production. |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry (e.g. `7d`, `24h`). |
| `CLIENT_ORIGIN` / `CORS_ORIGINS` | No | localhost:5173, localhost:3000 | Allowed CORS origins. |

### Containers (root `.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | (none) | Secret key for JWT; use a long random string. |

Other settings (e.g. `MONGODB_URI`, `CORS_ORIGINS`) are defined in `compose.yaml`.

---

## Project structure

```
fitness-goal-system/
├── client/                 # React frontend (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── components/      # Reusable UI (Button, Card, Layout, etc.)
│       ├── pages/           # Dashboard, Schedule, Calendar, Progress, Squad, Profile
│       ├── services/        # API client
│       ├── context/         # Auth state
│       └── types/           # TypeScript types
├── server/                  # Node.js API (Express + Mongoose)
│   └── src/
│       ├── models/         # User, UserProfile, Schedule, Squad, etc.
│       ├── routes/         # API routes
│       ├── controllers/    # Request handlers
│       ├── services/       # Scheduler, schedule logic, progress stats
│       └── middleware/     # Auth, validation
├── Dockerfile              # Multi-stage build for app + client
├── compose.yaml            # App + MongoDB (Podman/Docker)
├── .env.example            # For containers (JWT_SECRET)
└── server/.env.example     # For development (MONGODB_URI, JWT_SECRET, etc.)
```

---

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB

---

## Scheduling algorithm

The daily scheduler is implemented as a **Constraint Satisfaction Problem (CSP)** in
`server/src/services/scheduler/constraintScheduler.ts`. For each day:

1. **Variables.** One variable per activity (breakfast, lunch, dinner, optional snack,
   optional workout).
2. **Domain initialization.** Time is discretized into 15-minute blocks within the
   user's awake window (derived from sleep/wake schedule). Blocks where the activity
   would overlap a blocked range (work hours, travel, weekly routine, user busy slot)
   are removed up front — this is the **hard-constraint filtering** step.
3. **AC-3 arc consistency.** Binary constraints between every pair of variables are
   enforced before search begins:
   - No-overlap between any two activities.
   - Strict meal ordering: breakfast before lunch before dinner.
   - Meal–meal gap (default 150 minutes) between any two meal-like activities.
   AC-3 prunes domain values that have no supporting value in any neighbor's domain.
4. **Backtracking search** with:
   - **MRV** (Minimum Remaining Values) variable selection — assign the most
     constrained variable first.
   - **Soft-constraint value ordering** — try preferred-start values first
     (e.g. user's preferred workout time, midday for lunch, evening for dinner).
   - **Forward checking** — after each assignment, prune incompatible values from
     unassigned variables' domains; backtrack on dead-end domains.
5. **Soft-constraint relaxation.** If the strictest configuration is infeasible,
   the solver retries with progressively relaxed configurations: reduced meal gap,
   then drop snack, then drop workout. The first feasible tier wins.

When the user marks a busy slot or a day is recalculated, the schedule is re-solved
incrementally and an entry is appended to the schedule's `reschedulingHistory` log
(see `Schedule.ts`). The recalculation also **preserves completion flags** for
activities that survive into the new plan — so if you've already marked
"Breakfast" as Done at 7:00 and then add a busy block at 14:00, breakfast stays
checked even though the rest of the day re-shuffles.

---

## License

MIT (academic / project use).
