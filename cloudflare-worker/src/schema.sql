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
