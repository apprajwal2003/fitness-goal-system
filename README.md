# Adaptive & Personalized Dynamic Fitness Goal System

A full-stack web app that generates **personalized meal and workout schedules** using a **Constraint Satisfaction Algorithm** paired with a **Smart Recommendation Engine**. It adapts to your body type, goals, sleep, work hours, and diet — and reschedules in real time when you add busy slots. Includes **squad leaderboards** for group accountability.

---

## Features

- **Smart onboarding** — Body metrics, body type, athleticism level, exercise modality, diet, food preferences, sleep schedule, preferred workout time, energy level, work intensity, calorie target
- **AI-powered recommendations** — Exercises matched by body type, goal, modality, intensity, and muscle group rotation; meals matched by diet, avoid list, food preference, and calorie target
- **Constraint-based scheduling** — Algorithm finds feasible time slots using your sleep, work, routine, and busy blocks; respects preferred workout time (morning/afternoon/evening)
- **Calorie & macro tracking** — BMR/TDEE calculation, daily calorie and protein/carbs/fat targets, per-meal and per-workout calorie data
- **Rest day intelligence** — Skips workouts on rest days based on weekly workout target; suggests rest after high-intensity streaks
- **Progress analytics** — Streak tracking, goal % charts, calorie burn graph, protein intake graph, daily completion heatmap, performance insights, fitness predictions
- **Dashboard** — Auto-generates today's schedule, calorie tracker, macro progress bars, BMI display, energy prediction based on sleep, motivation messages
- **Calendar** — Month view with workout status (done/missed/partial), hover stats, monthly summary
- **Squad & leaderboard** — Create/join squads, daily/weekly/monthly leaderboard with ranked display
- **Profile editor** — Update all preferences anytime; schedule recalculates with new settings

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts
- **Backend:** Node.js, Express, TypeScript, Mongoose, Zod
- **Database:** MongoDB
- **Containers:** Podman / Docker (same Dockerfile and compose.yaml)

---

## Prerequisites

Install these **before** following the run steps.

| Requirement | Version | Notes |
|-------------|---------|--------|
| **Node.js** | 18 or higher | [Download](https://nodejs.org/) — includes npm |
| **MongoDB** | 5.x or 7.x | Only for **Option A** (development). For **Option B** (containers), MongoDB runs inside the container. |
| **Podman** or **Docker** | Latest | Only for **Option B**. [Podman](https://podman.io/) + [podman-compose](https://github.com/containers/podman-compose), or [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose). |

**Check versions:**

```bash
node -v    # v18.x or higher
npm -v     # 9.x or higher
```

---

## Option A: Run in Development (recommended for coding)

### Step 1: Get the project

```bash
cd fitness-goal-system
```

Or if cloning: `git clone <repo-url> && cd fitness-goal-system`

### Step 2: Install dependencies

```bash
npm run install:all
```

### Step 3: Start MongoDB

- **Local:** `brew services start mongodb-community` (Mac) or start the MongoDB service (Windows).
- **Atlas:** Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) and copy the connection string.
- **Container only:** `podman-compose up -d mongo` or `docker compose up -d mongo`, then use `mongodb://localhost:27017/fitness_goal_system`.

### Step 4: Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

| Variable | Required | What to set |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/fitness_goal_system` (local) or your Atlas connection string |
| `JWT_SECRET` | Yes | Any long random string (32+ characters) |

### Step 5: Run

```bash
npm run dev
```

### Step 6: Open

- **App:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000](http://localhost:3000)

Register → complete onboarding → Dashboard shows your personalized schedule automatically.

---

## Option B: Run with Podman or Docker

No local Node.js or MongoDB needed. Same steps on Mac and Windows.

### Step 1: Configure

```bash
cp .env.example .env
```

Edit `.env` and set `JWT_SECRET` to a long random string.

### Step 2: Build and start

```bash
# Podman
podman-compose up -d --build

# Docker
docker compose up -d --build
```

### Step 3: Open

Open **[http://localhost:3000](http://localhost:3000)** — app and API served from the same origin.

### Container commands

| Task | Podman | Docker |
|------|--------|--------|
| Stop | `podman-compose down` | `docker compose down` |
| Logs | `podman-compose logs -f app` | `docker compose logs -f app` |
| Rebuild after changes | `podman-compose up -d --build` | `docker compose up -d --build` |
| Remove database | `podman-compose down -v` | `docker compose down -v` |

---

## How It Works

### Algorithm

1. **User profile** provides constraints: body type, goal, diet, work hours, sleep schedule, preferred workout time, exercise modality, intensity cap, weekly workout days
2. **Recommendation engine** selects exercises (scored by body type, goal, modality, muscle group rotation per weekday, athleticism level) and meals (scored by diet, avoid list, food preference, calorie proximity)
3. **Constraint scheduler** takes blocked time (work, sleep, routine, busy slots), computes free intervals, and places meals (with spacing) and workout (at preferred time) into available slots
4. **Calorie/macro engine** calculates BMR (Mifflin-St Jeor), TDEE, daily targets adjusted by goal (deficit/surplus/maintenance), and macro split by food preference
5. **Insights engine** analyzes completion patterns, identifies best/worst days, predicts fitness outcomes, suggests rest days

### Pages

| Page | What it does |
|------|-------------|
| **Dashboard** | Auto-generates today's plan, shows calorie tracker, macro bars, BMI, energy prediction, motivation, streak |
| **Schedule** | Day view with expandable activities showing nutrition, exercises with sets/reps/muscle groups, meal descriptions with alternatives |
| **Calendar** | Month view with done/missed/partial status, hover stats, monthly summary |
| **Progress** | Charts (goal %, calories burned, protein, meals/workouts per day), heatmap, insights, fitness prediction |
| **Squad** | Create/join squad, ranked leaderboard with daily/weekly/monthly filter |
| **Profile** | Edit all onboarding fields; schedule recalculates with new preferences |

---

## Verify Everything Works

1. Open the app (Option A: localhost:5173 — Option B: localhost:3000)
2. **Register** a new account
3. Complete **onboarding** (3 steps: body/goals/diet, work/sleep/routine, durations/intensity)
4. Land on **Dashboard** — your personalized schedule is auto-generated
5. Open **Schedule** → expand an activity to see exercises or meal alternatives
6. Mark activities **Done** and check **Progress** for charts and insights

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Cannot connect to MongoDB | Ensure MongoDB is running; check `MONGODB_URI` in `server/.env` |
| Port already in use | Stop the process using the port, or change `PORT` in `server/.env` |
| Cannot connect to Podman/Docker | Start the machine: `podman machine start` or open Docker Desktop |
| JWT / login errors | Set `JWT_SECRET` in `.env` and restart |
| After pulling new code | Run `npm run install:all` then `npm run dev` (dev) or `podman-compose up -d --build` (containers) |

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run install:all` | Install all dependencies (root + client + server) |
| `npm run dev` | Start client and server with hot reload |
| `npm run build` | Build client and server for production |
| `npm start` | Start server only (after build) |

---

## Environment Variables

### Development (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/fitness_goal_system` | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing key (32+ chars) |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | `production` for prod |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry |
| `CORS_ORIGINS` | No | localhost:5173, localhost:3000 | Allowed origins |

### Containers (root `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | JWT signing key |

Other settings are in `compose.yaml`.

---

## Project Structure

```
fitness-goal-system/
├── client/                    # React frontend
│   └── src/
│       ├── components/        # UI components (Button, Card, Layout)
│       ├── pages/             # Dashboard, Schedule, Calendar, Progress, Squad, Profile, Login, Register, Onboarding
│       ├── services/          # API client
│       ├── context/           # Auth state
│       └── types/             # TypeScript types
├── server/                    # Node.js API
│   └── src/
│       ├── data/              # Exercise database (40+), Meal database (40+)
│       ├── models/            # User, UserProfile, Schedule, Squad, SquadProgress
│       ├── routes/            # API routes
│       ├── controllers/       # Request handlers
│       ├── services/          # Recommendation engine, scheduler, schedule logic
│       └── middleware/        # Auth, error handling
├── Dockerfile                 # Multi-stage build
├── compose.yaml               # App + MongoDB
├── .env.example               # Container env template
└── server/.env.example        # Dev env template
```

---

## License

MIT (academic / project use).
