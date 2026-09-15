// Cloudflare Pages Function — handles every request under /api/*
//
// IMPORTANT: files under /functions must export onRequest / onRequestGet /
// onRequestPost handlers (Pages Functions routing), NOT a Worker-style
// `export default { fetch(request, env) }`. The old functions/api.js used
// the Worker export shape, which Pages silently ignores — every /api/*
// call 404'd. The [[path]].js filename is Pages' "match everything under
// this folder" convention, equivalent to a wildcard route.
import { Router } from 'itty-router';

const router = Router();

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const handleBadRequest = (message) => jsonResponse({ error: message }, 400);
const handleNotFound = (message) => jsonResponse({ error: message }, 404);
const handleServerError = (message) => jsonResponse({ error: message }, 500);

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- Password hashing (PBKDF2-SHA256 via Web Crypto, built into the Workers/Pages runtime) ---
const PBKDF2_ITERATIONS = 100000;

const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `${toHex(salt)}:${toHex(derivedBits)}`;
}

async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toHex(derivedBits) === hashHex;
}

const dbQuery = async (query, params = [], env) => {
  // D1 binding is available on env for Pages Functions
  const conn = env.D1.prepare(query);
  const result = await conn.bind(...params).all();
  return result;
};

// Converts a raw D1 row (snake_case DB column names, e.g. user_type,
// role_tier, preferred_location) into the camelCase shape the frontend
// reads everywhere (currentUser.userType, .roleTier, .preferredLocation,
// etc. - see js/auth.js, js/dashboard.js, js/profile.js). Without this,
// a user object stored straight from the DB would carry `user_type`
// instead of `userType`, and every role check in the app
// (isAdminUser, the allowedRoles gates, the sidebar's data-roles filter)
// would silently see `undefined` and deny access.
function mapUserRow(row) {
  if (!row) return null;
  const {
    password: _omit,
    user_type,
    role_tier,
    organisation_id,
    created_at,
    updated_at,
    preferred_location,
    preferred_months,
    preferred_days,
    preferred_times,
    preferred_teams,
    saha_level,
    ...rest
  } = row;

  return {
    ...rest,
    userType: user_type,
    roleTier: role_tier || '',
    organisationId: organisation_id,
    createdAt: created_at,
    updatedAt: updated_at,
    preferredLocation: preferred_location || '',
    preferredMonths: preferred_months || '',
    preferredDays: preferred_days || '',
    preferredTimes: preferred_times || '',
    preferredTeams: preferred_teams || '',
    sahaLevel: saha_level || ''
  };
}

const sendEmailNotification = async (to, subject, message, env) => {
  const EMAIL_API_KEY = env.EMAIL_API_KEY;
  const EMAIL_API_URL = env.EMAIL_API_URL;
  if (!EMAIL_API_KEY || !EMAIL_API_URL) {
    console.warn('Email provider not configured');
    return;
  }

  await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${EMAIL_API_KEY}`
    },
    body: JSON.stringify({ to, subject, text: message })
  });
};

router.get('/health', () => jsonResponse({ status: 'ok' }));

router.post('/auth/register', async (request, env) => {
  const data = await request.json();
  const { email, password, name, userType, roleTier } = data;

  if (!email || !password || !name || !userType) {
    return handleBadRequest('Missing required fields');
  }

  if (!validateEmail(email)) {
    return handleBadRequest('Invalid email');
  }

  if (userType !== 'umpire') {
    return handleBadRequest('Only umpire accounts can self-register. Other accounts must be created by an organisation owner.');
  }

  const existing = await dbQuery('SELECT id FROM users WHERE email = ? LIMIT 1', [email], env);
  if (existing.results.length > 0) {
    return handleBadRequest('Email already registered');
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  await dbQuery(
    'INSERT INTO users (id, email, password, name, user_type, role_tier, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, email, passwordHash, name, userType, roleTier || '', createdAt],
    env
  );

  return jsonResponse({ id, email, name, userType, roleTier, createdAt }, 201);
});

router.post('/auth/login', async (request, env) => {
  const data = await request.json();
  const { email, password } = data;

  if (!email || !password) {
    return handleBadRequest('Missing required fields');
  }

  if (!validateEmail(email)) {
    return handleBadRequest('Invalid email');
  }

  const result = await dbQuery(
    `SELECT u.id, u.email, u.name, u.password, u.user_type, u.phone, u.location, u.role_tier,
            p.preferred_location, p.preferred_months, p.preferred_days, p.preferred_times, p.preferred_teams, p.saha_level
     FROM users u
     LEFT JOIN umpire_profiles p ON p.user_id = u.id
     WHERE u.email = ?
     LIMIT 1`,
    [email],
    env
  );

  if (result.results.length === 0) {
    return handleBadRequest('Invalid credentials');
  }

  const row = result.results[0];
  const passwordMatches = await verifyPassword(password, row.password);
  if (!passwordMatches) {
    return handleBadRequest('Invalid credentials');
  }

  return jsonResponse({ user: mapUserRow(row) });
});

router.get('/users/:id', async ({ params }, env) => {
  const result = await dbQuery(
    `SELECT u.*, p.preferred_location, p.preferred_months, p.preferred_days, p.preferred_times, p.preferred_teams, p.saha_level
     FROM users u
     LEFT JOIN umpire_profiles p ON p.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [params.id],
    env
  );
  if (result.results.length === 0) return handleNotFound('User not found');
  return jsonResponse(mapUserRow(result.results[0]));
});

router.put('/users/:id', async ({ params, request }, env) => {
  const updates = await request.json();
  const fields = [];
  const values = [];

  if (updates.name) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }
  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }
  if (updates.role_tier !== undefined) {
    fields.push('role_tier = ?');
    values.push(updates.role_tier);
  }
  if (updates.password !== undefined) {
    fields.push('password = ?');
    values.push(await hashPassword(updates.password));
  }

  // These live on umpire_profiles, not users - see cloudflare-d1-schema.md.
  const umpireProfileFields = ['preferred_location', 'preferred_months', 'preferred_days', 'preferred_times', 'preferred_teams', 'saha_level'];
  const hasUmpireProfileUpdates = umpireProfileFields.some((field) => updates[field] !== undefined);

  if (fields.length === 0 && !hasUmpireProfileUpdates) {
    return handleBadRequest('No fields to update');
  }

  if (fields.length > 0) {
    values.push(params.id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await dbQuery(query, values, env);
  }

  if (hasUmpireProfileUpdates) {
    const existing = await dbQuery('SELECT * FROM umpire_profiles WHERE user_id = ? LIMIT 1', [params.id], env);
    const existingRow = existing.results[0];
    const now = new Date().toISOString();

    const merged = {};
    umpireProfileFields.forEach((field) => {
      merged[field] = updates[field] !== undefined ? updates[field] : (existingRow ? existingRow[field] : null) || null;
    });

    if (existingRow) {
      await dbQuery(
        `UPDATE umpire_profiles
         SET preferred_location = ?, preferred_months = ?, preferred_days = ?, preferred_times = ?, preferred_teams = ?, saha_level = ?, updated_at = ?
         WHERE user_id = ?`,
        [
          merged.preferred_location,
          merged.preferred_months,
          merged.preferred_days,
          merged.preferred_times,
          merged.preferred_teams,
          merged.saha_level,
          now,
          params.id
        ],
        env
      );
    } else {
      await dbQuery(
        `INSERT INTO umpire_profiles (id, user_id, preferred_location, preferred_months, preferred_days, preferred_times, preferred_teams, saha_level, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          params.id,
          merged.preferred_location,
          merged.preferred_months,
          merged.preferred_days,
          merged.preferred_times,
          merged.preferred_teams,
          merged.saha_level,
          now,
          now
        ],
        env
      );
    }
  }

  return jsonResponse({ success: true });
});

router.delete('/users/:id', async ({ params }, env) => {
  await dbQuery('DELETE FROM umpire_profiles WHERE user_id = ?', [params.id], env);
  await dbQuery('DELETE FROM users WHERE id = ?', [params.id], env);
  return jsonResponse({ success: true });
});

router.get('/healthchecks/expired-assignments', async (_req, env) => {
  await dbQuery(
    `UPDATE matches SET status = 'unassigned' WHERE status = 'assigned' AND datetime(date || 'T' || time) <= datetime('now', '+48 hours')`,
    [],
    env
  );

  return jsonResponse({ success: true });
});

router.all('*', () => handleNotFound('Route not found'));

export async function onRequest(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const normalizedPath = url.pathname.startsWith('/api')
      ? url.pathname.slice('/api'.length) || '/'
      : url.pathname;
    const rewrittenUrl = `${url.origin}${normalizedPath}${url.search}`;
    const normalizedRequest = new Request(request, { url: rewrittenUrl });
    return await router.handle(normalizedRequest, env);
  } catch (err) {
    return handleServerError(err.message || 'Internal error');
  }
}
