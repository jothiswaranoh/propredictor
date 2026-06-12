# Football Match Prediction Backend

A production-ready Python FastAPI backend using MongoDB (Motor) for a Football Match Prediction application. Built following Clean Architecture principles.

---

## Folder Structure

```
api/
├── app/
│   ├── models/            # Database schema representations
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── match.py
│   │   └── prediction.py
│   ├── schemas/           # Pydantic validation & response serialization
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── match.py
│   │   ├── prediction.py
│   │   └── leaderboard.py
│   ├── repositories/      # Database access layers
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── match.py
│   │   └── prediction.py
│   ├── services/          # Core business logic orchestrators
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── match.py
│   │   ├── prediction.py
│   │   └── leaderboard.py
│   ├── routers/           # FastAPI API endpoints
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── admin.py
│   ├── config.py          # Settings parser
│   ├── database.py        # Mongo connection and index creator
│   ├── dependencies.py    # Dependency injection utilities
│   ├── exceptions.py      # Error handler declarations
│   └── main.py            # Main entry point & app initializer
├── tests/                 # Integration test suite
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_predictions.py
├── Dockerfile             # Multi-stage production container setup
├── docker-compose.yml     # Multi-container orchestration (DB + API)
├── requirements.txt       # Dependencies manifest
├── .env.example           # Config environment template
└── .env                   # Local settings
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- MongoDB 6.0+ (running locally or via Docker)

### Local Setup
1. **Navigate to the `api` directory**:
   ```bash
   cd api
   ```

2. **Set up a Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Mac/Linux
   # or .venv\Scripts\activate on Windows
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and adjust the variables as needed:
   ```bash
   cp .env.example .env
   ```

5. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`. The interactive Swagger UI documentation can be accessed at `http://localhost:8000/docs`.

---

## Docker Setup

To spin up the backend API and a MongoDB instance in separate containers:

1. **Start the containers**:
   ```bash
   docker-compose up -d --build
   ```

2. **Logs tracking**:
   ```bash
   docker-compose logs -f
   ```

3. **Stop the containers**:
   ```bash
   docker-compose down -v
   ```

---

## Run Tests
To run the automated integration tests:
1. Ensure you have a MongoDB server running locally (or test DB accessible).
2. Run pytest in the `api` folder:
   ```bash
   pytest -v
   ```

---

## JWT Authentication Flow

This system uses a **password-less authentication model** using **Company Email** and **Employee ID**:

1. **Request**: The user requests a JWT by sending their `email` and `employee_id` to `/api/auth/login`.
2. **Verification**: The system looks up the database. If the user is active and records match, a JWT token is signed.
3. **Payload**: The token payload contains:
   - `sub`: User ID
   - `email`: User Email
   - `role`: Role (`admin` or `user`)
   - `exp`: Expiry timestamp (configured to 24 hours by default).
4. **Usage**: For protected endpoints, clients include the header:
   ```http
   Authorization: Bearer <token>
   ```

---

## API Summary Contracts

### Authentication & User APIs
- `POST /api/auth/login` - Authenticates user and issues JWT.
- `GET /api/users/me` - Retrieves the authenticated user's profile.
- `GET /api/matches` - Returns all matches (upcoming, live, completed) populated with team details. If logged in, embeds user prediction data.
- `GET /api/matches/active` - Lists matches currently accepting predictions.
- `POST /api/predictions/{match_id}` - Submits a prediction (must be within open/close window).
- `GET /api/predictions/history` - Fetches the user's prediction history, indicating points/correctness for completed matches.
- `GET /api/leaderboard` - Fetches the cached leaderboard rankings.

### Admin APIs (Protected by `require_admin`)
- **Teams (CRUD)**:
  - `POST /api/admin/teams` - Add team
  - `GET /api/admin/teams` - List all teams
  - `GET /api/admin/teams/{id}` - Fetch team details
  - `PUT /api/admin/teams/{id}` - Edit team details
  - `DELETE /api/admin/teams/{id}` - Delete team
- **Matches (CRUD)**:
  - `POST /api/admin/matches` - Create match
  - `GET /api/admin/matches` - List matches
  - `PUT /api/admin/matches/{id}` - Update match details
  - `DELETE /api/admin/matches/{id}` - Cancel/Delete match
- **Users**:
  - `POST /api/admin/users` - Create user record
  - `GET /api/admin/users` - List all users
  - `PUT /api/admin/users/{id}` - Update user roles, details, or active status
- **Scoring & Predictions**:
  - `GET /api/admin/predictions` - View predictions submitted by all users.
  - `POST /api/admin/matches/{match_id}/result` - Declare match result (`winning_team_id` or `null` for draw) and mark match as `completed`.
  - `POST /api/admin/leaderboard/generate` - Force dynamic recalculation and update the cache of leaderboard rankings.

---

## Business Rules Implemented
1. **One Prediction per Match**: Controlled via unique index `(user_id, match_id)` and checked dynamically at service level.
2. **Prediction Windows**: Predictions can only be submitted if `prediction_open_time <= UTC_now <= prediction_close_time`.
3. **Immutable Predictions**: Predictions cannot be altered once submitted (returns `409 Conflict`).
4. **Admin Winning Declaration**: Admins can set `winning_team_id` (only matching one of the two participating teams, or `null` for a draw) and set match status to `completed`.

---

## Error Handling Strategy
The system uses custom subclasses of `FootballAppException` mapped to standard HTTP statuses:
- `401 Unauthorized` for missing/expired tokens or invalid login combinations.
- `403 Forbidden` for users requesting admin resources.
- `404 Not Found` for nonexistent matches, teams, or users.
- `400 Bad Request` for prediction window violations, invalid time ranges, or non-participating winning teams.
- `409 Conflict` for duplicate predictions or duplicate email/employee ID registrations.

---

## Production Deployment Recommendations

1. **Reverse Proxy (Nginx/Traefik)**:
   Place the FastAPI service behind Nginx or Traefik to manage SSL termination, rate limiting, and request logging.
2. **ASGI Server Customization**:
   Run Uvicorn inside gunicorn for better process management:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```
3. **MongoDB Production Setting**:
   - Secure MongoDB with authorization enabled (`--auth`).
   - Use replication sets for high availability.
   - Configure continuous daily database backups.
4. **Security Enhancements**:
   - Change the `JWT_SECRET` in production to a secure 32-byte hexadecimal key.
   - Configure CORS domains to explicitly allow the React web application's host only (avoid `*`).
