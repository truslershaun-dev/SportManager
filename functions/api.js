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

const dbQuery = async (query, params = [], env) => {
  // D1 binding is available on env for Pages Functions
  const conn = env.D1.prepare(query);
  const result = await conn.bind(...params).all();
  return result;
};

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

  await dbQuery(
    'INSERT INTO users (id, email, password, name, user_type, role_tier, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, email, password, name, userType, roleTier || '', createdAt],
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
    'SELECT id, email, name, user_type, phone, location, role_tier FROM users WHERE email = ? AND password = ? LIMIT 1',
    [email, password],
    env
  );

  if (result.results.length === 0) {
    return handleBadRequest('Invalid credentials');
  }

  const user = result.results[0];
  return jsonResponse({ user });
});

router.get('/users/:id', async ({ params }, env) => {
  const result = await dbQuery('SELECT * FROM users WHERE id = ? LIMIT 1', [params.id], env);
  if (result.results.length === 0) return handleNotFound('User not found');
  return jsonResponse(result.results[0]);
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
  if (updates.preferred_location !== undefined) {
    fields.push('preferred_location = ?');
    values.push(updates.preferred_location);
  }
  if (updates.preferred_months !== undefined) {
    fields.push('preferred_months = ?');
    values.push(updates.preferred_months);
  }
  if (updates.preferred_days !== undefined) {
    fields.push('preferred_days = ?');
    values.push(updates.preferred_days);
  }
  if (updates.preferred_times !== undefined) {
    fields.push('preferred_times = ?');
    values.push(updates.preferred_times);
  }
  if (updates.preferred_teams !== undefined) {
    fields.push('preferred_teams = ?');
    values.push(updates.preferred_teams);
  }
  if (updates.saha_level !== undefined) {
    fields.push('saha_level = ?');
    values.push(updates.saha_level);
  }

  if (fields.length === 0) {
    return handleBadRequest('No fields to update');
  }

  values.push(params.id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

  await dbQuery(query, values, env);
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

export default {
  async fetch(request, env) {
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
};
