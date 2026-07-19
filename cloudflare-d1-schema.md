# Cloudflare D1 Database Schema for SportManager

This document contains the comprehensive database schema and Cloudflare integration steps required for deploying SportManager on Cloudflare Pages + Workers + D1.

## Database Tables

### `users`
- `id TEXT PRIMARY KEY`
- `email TEXT UNIQUE NOT NULL`
- `password TEXT NOT NULL`
- `name TEXT NOT NULL`
- `user_type TEXT NOT NULL` (`owner`, `manager`, `umpire`, `saha_representative`, `application_manager`, `admin`)
- `role_tier TEXT`
- `phone TEXT`
- `location TEXT`
- `organisation_id TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(organisation_id) REFERENCES organisations(id)`

### `organisations`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `owner_id TEXT NOT NULL`
- `licence_level TEXT NOT NULL`
- `licence_expiry TEXT`
- `subscription_status TEXT NOT NULL DEFAULT 'active'`
- `sports_limit TEXT`
- `teams_limit TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(owner_id) REFERENCES users(id)`

### `organisation_managers`
- `id TEXT PRIMARY KEY`
- `organisation_id TEXT NOT NULL`
- `manager_id TEXT NOT NULL`
- `assigned_at TEXT NOT NULL`
- `active INTEGER NOT NULL DEFAULT 1`
- `FOREIGN KEY(organisation_id) REFERENCES organisations(id)`
- `FOREIGN KEY(manager_id) REFERENCES users(id)`

### `subscription_plans`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `sports_limit TEXT`
- `teams_limit TEXT`
- `description TEXT`
- `price_amount INTEGER`
- `currency TEXT`
- `created_at TEXT NOT NULL`

### `sports`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `category TEXT`
- `organisation_id TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(organisation_id) REFERENCES organisations(id)`

### `teams`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `sport_id TEXT NOT NULL`
- `organisation_id TEXT`
- `location TEXT`
- `manager_id TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(sport_id) REFERENCES sports(id)`
- `FOREIGN KEY(organisation_id) REFERENCES organisations(id)`
- `FOREIGN KEY(manager_id) REFERENCES users(id)`

### `fields`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `location TEXT`
- `region TEXT`
- `organisation_id TEXT`
- `phone TEXT`
- `notes TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(organisation_id) REFERENCES organisations(id)`

### `leagues_tournaments`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `type TEXT NOT NULL`
- `start_date TEXT NOT NULL`
- `end_date TEXT NOT NULL`
- `required_umpire_level TEXT`
- `organisation_id TEXT`
- `created_by TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(organisation_id) REFERENCES organisations(id)`
- `FOREIGN KEY(created_by) REFERENCES users(id)`

### `umpire_profiles`
- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL`
- `preferred_location TEXT`
- `preferred_months TEXT`
- `preferred_days TEXT`
- `preferred_times TEXT`
- `preferred_teams TEXT`
- `saha_level TEXT`
- `rank TEXT`
- `availability_notes TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(user_id) REFERENCES users(id)`

### `matches`
- `id TEXT PRIMARY KEY`
- `date TEXT NOT NULL`
- `time TEXT NOT NULL`
- `sport_id TEXT`
- `home_team_id TEXT`
- `away_team_id TEXT`
- `location TEXT`
- `field_id TEXT`
- `tournament_id TEXT`
- `status TEXT NOT NULL`
- `home_score INTEGER`
- `away_score INTEGER`
- `assigned_umpires TEXT`
- `created_by TEXT`
- `created_at TEXT NOT NULL`
- `updated_at TEXT`
- `FOREIGN KEY(home_team_id) REFERENCES teams(id)`
- `FOREIGN KEY(away_team_id) REFERENCES teams(id)`
- `FOREIGN KEY(field_id) REFERENCES fields(id)`
- `FOREIGN KEY(tournament_id) REFERENCES leagues_tournaments(id)`
- `FOREIGN KEY(created_by) REFERENCES users(id)`

### `umpire_assignments`
- `id TEXT PRIMARY KEY`
- `match_id TEXT NOT NULL`
- `umpire_id TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `assigned_at TEXT NOT NULL`
- `responded_at TEXT`
- `response TEXT`
- `FOREIGN KEY(match_id) REFERENCES matches(id)`
- `FOREIGN KEY(umpire_id) REFERENCES users(id)`

### `notifications`
- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL`
- `type TEXT NOT NULL`
- `subject TEXT`
- `message TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'pending'`
- `sent_at TEXT`
- `created_at TEXT NOT NULL`
- `FOREIGN KEY(user_id) REFERENCES users(id)`

### `activity_logs`
- `id TEXT PRIMARY KEY`
- `user_id TEXT`
- `action TEXT NOT NULL`
- `model TEXT`
- `model_id TEXT`
- `details TEXT`
- `created_at TEXT NOT NULL`
- `FOREIGN KEY(user_id) REFERENCES users(id)`

### `audit_trails`
- `id TEXT PRIMARY KEY`
- `event_type TEXT NOT NULL`
- `performed_by TEXT`
- `target_id TEXT`
- `target_type TEXT`
- `details TEXT`
- `created_at TEXT NOT NULL`
- `FOREIGN KEY(performed_by) REFERENCES users(id)`

## D1 SQL Table Creation

```sql
-- Cloudflare D1 schema for SportManager
-- Comprehensive database schema for owners, managers, umpires, matches, organisations, and notifications

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL,
  role_tier TEXT,
  phone TEXT,
  location TEXT,
  organisation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(organisation_id) REFERENCES organisations(id)
);

CREATE TABLE organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  licence_level TEXT NOT NULL,
  licence_expiry TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  sports_limit TEXT,
  teams_limit TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE organisation_managers (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(organisation_id) REFERENCES organisations(id),
  FOREIGN KEY(manager_id) REFERENCES users(id)
);

CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sports_limit TEXT,
  teams_limit TEXT,
  description TEXT,
  price_amount INTEGER,
  currency TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE sports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  organisation_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(organisation_id) REFERENCES organisations(id)
);

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_id TEXT NOT NULL,
  organisation_id TEXT,
  location TEXT,
  manager_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(sport_id) REFERENCES sports(id),
  FOREIGN KEY(organisation_id) REFERENCES organisations(id),
  FOREIGN KEY(manager_id) REFERENCES users(id)
);

CREATE TABLE fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  region TEXT,
  organisation_id TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(organisation_id) REFERENCES organisations(id)
);

CREATE TABLE leagues_tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  required_umpire_level TEXT,
  organisation_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(organisation_id) REFERENCES organisations(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE umpire_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preferred_location TEXT,
  preferred_months TEXT,
  preferred_days TEXT,
  preferred_times TEXT,
  preferred_teams TEXT,
  saha_level TEXT,
  rank TEXT,
  availability_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  sport_id TEXT,
  home_team_id TEXT,
  away_team_id TEXT,
  location TEXT,
  field_id TEXT,
  tournament_id TEXT,
  status TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  assigned_umpires TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY(home_team_id) REFERENCES teams(id),
  FOREIGN KEY(away_team_id) REFERENCES teams(id),
  FOREIGN KEY(field_id) REFERENCES fields(id),
  FOREIGN KEY(tournament_id) REFERENCES leagues_tournaments(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE umpire_assignments (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  umpire_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_at TEXT NOT NULL,
  responded_at TEXT,
  response TEXT,
  FOREIGN KEY(match_id) REFERENCES matches(id),
  FOREIGN KEY(umpire_id) REFERENCES users(id)
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  model TEXT,
  model_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE audit_trails (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  performed_by TEXT,
  target_id TEXT,
  target_type TEXT,
  details TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(performed_by) REFERENCES users(id)
);
```

## Cloudflare D1 Setup Steps

1. Install Wrangler or use Cloudflare dashboard.
2. Create a new D1 database in Cloudflare named `sportsmanager_db`.
3. Connect your Worker to the D1 database variable `D1`.
4. Run the schema SQL under the Cloudflare D1 UI or via Wrangler.

### Wrangler command sequence

```bash
npm install -g wrangler
wrangler login
wrangler d1 create sportsmanager_db
wrangler d1 migrations apply --database sportsmanager_db
wrangler secret put EMAIL_API_KEY
wrangler secret put EMAIL_API_URL
wrangler publish --env production
```

> If you prefer Cloudflare dashboard setup, skip the `wrangler d1 create` and use the dashboard to create the D1 database. Then add the same binding in `wrangler.toml`.

## Integration Steps

1. Deploy the static frontend to Cloudflare Pages.
2. Deploy the Worker with the `wrangler.toml` configuration.
3. Set `CLOUDFLARE_API_URL` in `config.js` to the Worker endpoint.
4. Configure Worker environment secrets:
   - `EMAIL_API_KEY`
   - `EMAIL_API_URL`
   - `D1` binding to the database
5. Use the `cloudflare-api.js` client for auth and owner/organisation operations.

## Notes

- Store passwords securely; this schema uses plain text for prototyping only.
- Add hashing and JWT authentication on the Worker for production.
- The `organisation_managers` table allows multiple managers per owner organisation.
