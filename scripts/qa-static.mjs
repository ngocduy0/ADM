import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

check('service worker JavaScript syntax', () => {
  execFileSync(process.execPath, ['--check', path.join(root, 'public/sw.js')], { stdio: 'pipe' });
});

check('declarative and legacy iOS push payloads are supported', () => {
  const server = read('lib/admin-push-server.ts');
  const worker = read('public/sw.js');
  assert.match(server, /web_push:\s*8030/);
  assert.match(server, /notification:\s*\{/);
  assert.match(server, /app_badge:\s*'1'/);
  assert.match(worker, /raw\.notification/);
  assert.match(worker, /notification\.navigate/);
  assert.match(worker, /showNotification/);
});

check('public venue booking cannot be mistaken for an admin mutation', () => {
  const route = read('app/api/reservations/route.ts');
  const client = read('components/aurelius/data.ts');
  const admin = read('components/admin/AdminDataProvider.tsx');
  assert.match(route, /isExplicitAdminBookingRequest/);
  assert.match(route, /if \(!isAdminMutation\)[\s\S]*sendAdminPush/);
  assert.match(client, /ADMIN_BOOKING_REQUEST_HEADER/);
  assert.match(admin, /adminMode:\s*true/);
});

check('admin login is rate limited and session fallback is disabled in production', () => {
  const login = read('app/api/admin-login/route.ts');
  const auth = read('lib/admin-auth.ts');
  assert.match(login, /consumeRateLimit/);
  assert.match(login, /Retry-After/);
  assert.match(login, /Cache-Control', 'no-store/);
  assert.match(auth, /process\.env\.NODE_ENV === 'production' \? ''/);
});

check('admin mutations have authorization or are explicitly safe public endpoints', () => {
  const allowedPublicMutationRoutes = new Set([
    'app/api/admin-login/route.ts',
    'app/api/admin-logout/route.ts',
    'app/api/contact-requests/route.ts',
    'app/api/reservations/route.ts',
    'app/api/venues/[id]/view/route.ts',
  ]);
  const routeFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name === 'route.ts') routeFiles.push(path.relative(root, absolute).replaceAll('\\', '/'));
    }
  };
  walk(path.join(root, 'app/api'));

  for (const route of routeFiles) {
    const source = read(route);
    const mutates = /export async function (POST|PUT|PATCH|DELETE)/.test(source);
    if (!mutates || allowedPublicMutationRoutes.has(route)) continue;
    assert.match(source, /requireAdminApi\(request\)/, `${route} lacks requireAdminApi`);
  }

  assert.match(read('app/api/contact-requests/route.ts'), /consumeRateLimit/);
  assert.match(read('app/api/reservations/route.ts'), /consumeRateLimit/);
  assert.match(read('app/api/venues/[id]/view/route.ts'), /VIEW_WINDOW_MS/);
});

check('security headers and image proxy are restricted', () => {
  const proxy = read('proxy.ts');
  const nextConfig = read('next.config.ts');
  assert.match(proxy, /NODE_ENV === 'development'/);
  assert.doesNotMatch(proxy, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.doesNotMatch(proxy, /connect-src[^\n]*\shttps:",/);
  assert.match(proxy, /connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co https:\/\/api\.cloudinary\.com/);
  assert.match(proxy, /X-Content-Type-Options/);
  assert.match(proxy, /Strict-Transport-Security/);
  assert.doesNotMatch(nextConfig, /hostname:\s*['"]\*\*['"]/);
});

check('no real environment or private key files are packaged', () => {
  const forbidden = ['.env', '.env.local', 'vapid_private.pem', 'service-role.key'];
  for (const file of forbidden) assert.equal(exists(file), false, `${file} must not be packaged`);
});

check('global CSS does not import an uninstalled shadcn CLI stylesheet', () => {
  const css = read('app/globals.css');
  const packageJson = JSON.parse(read('package.json'));
  assert.doesNotMatch(css, /@import\s+[\"']shadcn\/tailwind\.css[\"']/);
  assert.equal(packageJson.dependencies?.shadcn, undefined);
  assert.equal(packageJson.devDependencies?.shadcn, undefined);
});

check('public availability API is rate limited and never cached', () => {
  const source = read('app/api/reservations/availability/route.ts');
  assert.match(source, /consumeRateLimit/);
  assert.match(source, /Cache-Control": "no-store/);
});

const failed = checks.filter((item) => !item.ok);
console.log(`\nStatic QA: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length) process.exit(1);
