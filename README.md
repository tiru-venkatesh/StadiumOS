# StadiumOS Backend — Smart Stadium & Tournament Operations Platform

This backend powers a platform designed to move fans beyond passive viewing. By enabling real-time interactions, gamified outcomes, and seamless physical concessions delivery, StadiumOS transforms the live sporting arena from a traditional, isolated scoreboard experience into an immersive, active, and highly participatory ecosystem.

---

## 🏟️ Core Fan Engagement Modules

StadiumOS achieves deep fan immersion through three core architectural modules. These systems are optimized for performance, security, and low-latency feedback.

### 🗳️ 1. Live Polls Module (`/api/v1/polls`)
* **How it drives engagement**: Transforms passive spectating into active stadium consensus. Organizers can instantly push real-time match trivia, player of the match surveys, and halftime event feedback directly to fan devices.
* **Technical details**: Prevent duplicate submissions using compound indexing and atomic mongo updates (`$findOneAndUpdate`). Real-time results are instantly broadcasted to clients in the match-specific Socket.io room, allowing fans to watch voting meters update live.

### 🔮 2. Gamified Predictions & Leaderboards (`/api/v1/predictions`)
* **How it drives engagement**: Infuses stakes and competition directly into match schedules. Fans predict team winners for upcoming matches, gaining points for successful outcomes. A live leaderboard shows real-time stadium-wide rankings, keeping engagement continuous throughout the entire season.
* **Technical details**: Employs MongoDB Aggregation frameworks to compute point tallies and join metadata on demand. Automatically evaluates predictions when a match is updated to "completed".

### 🍔 3. Seat-Side Concessions Ordering (`/api/v1/orders`)
* **How it drives engagement**: Keeps fans in their seats so they never miss a critical play due to physical queues. Fans order food, drinks, and merchandise, and receive direct real-time updates as vendor crews prepare and deliver items directly to their seat location.
* **Technical details**: Server-side total calculation prevents malicious price-manipulation attempts in transit. Uses targeted, secure Socket.io rooms (`user:<userId>`) to notify fans of preparing and delivery changes without broadcasting status updates to others.

---

## 🛠️ Stack & Architecture Overview

The codebase implements a robust, industry-standard **Layered Architecture**:

```
[Client App] ──(HTTP / Socket)──► [Routing Layer] ──► [Zod Validator] ──► [Auth Middleware] ──► [Controller Layer] ──► [Service Layer] ──► [Mongoose Models] ──► [MongoDB Engine]
```

### 🧱 1. Code Quality
* **Layered Separation of Concerns**: Clear mapping from router, controller, service layer, to mongoose database schemas.
* **No Magic Strings**: All entity roles (`organizer`, `team`, `fan`), match statuses, and order fulfillment states are housed within typed TS enums under `src/constants/index.ts`.

### 🔒 2. Security Checks
* **Payload Sanitation**: `express-mongo-sanitize` intercepts incoming requests, filtering out potential NoSQL Injection queries.
* **Rate Limiting**: Custom `express-rate-limit` limits authentication endpoints (`/api/v1/auth/*`) to safeguard against brute-force credential stuffing.
* **Role-Based Access Control**: Reusable server-side auth middleware prevents unauthorized users from updating scores or launching administrative polls (returns `403 Forbidden`).
* **Zod Schemas**: Strict input validation on every request body rejects malformed values before controllers or databases are touched.

### ⚡ 3. Efficiency & Projections
* **Mongoose Indexes**: Unique indexing on user emails, compound unique index on predictions (`userId_1_matchId_1`), and query indexes on status fields.
* **Subscribed Socket Rooms**: Lowers overhead by grouping clients into isolated match channels (`match:<matchId>`), avoiding inefficient global broadcasts.
* **Reduced Data Payloads**: Allows low-bandwidth or assistive technology devices to load minimal, projected structures by passing the query flag `?reduced=true`.

### 🧪 4. Testing & Verification
* Extensive Supertest + Jest tests utilizing `mongodb-memory-server` to run fully isolated tests on core auth flows, CRUD endpoints, and access checks.

---

## 🚀 Local Operations Guide

### 📂 Setup & Variables
Verify your environment settings inside `.env` or `.env.example`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stadiumos
JWT_SECRET=stadiumos_super_access_secret_key_12345
JWT_REFRESH_SECRET=stadiumos_super_refresh_secret_key_12345
```

### 🏃 Running Commands
```bash
# Run unit & integration test suite
npm run test

# Run tests with coverage statistics
npm run test:coverage

# Start development server with tsx
npm run dev

# Compile server and bundler outputs
npm run build

# Start production server
npm run start
```
