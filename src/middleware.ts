import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { authenticateAdmin, AdminError, permitted } from './lib/admin/access';
import { readConfig } from './lib/ads';

export const onRequest = defineMiddleware(async (context, next) => {
  let path = context.url.pathname;
  try { path = decodeURIComponent(path); } catch { /* Invalid paths stay unprivileged. */ }
  const admin = path === '/admin' || path.startsWith('/admin/');
  const adTest = context.url.searchParams.get('adtest') === '1';
  if (!admin && path !== '/maintenance/') {
    let maintenance = false;
    try { maintenance = await readConfig(env, 'maintenance') === '1'; } catch { /* The route retains its own storage-failure handling. */ }
    if (maintenance) {
      if (path.startsWith('/api/') || path.startsWith('/go/')) return new Response('Service temporarily unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' } });
      return context.rewrite('/maintenance/');
    }
  }
  if (admin || adTest) {
    try {
      context.locals.admin = await authenticateAdmin(context.request, env) || undefined;
      if (!context.locals.admin && admin) context.locals.adminFailure = { status: 401, message: 'Sign in through Cloudflare Access to continue.' };
      context.locals.adTestAuthorized = adTest && !!context.locals.admin && permitted(context.locals.admin, 'ads');
    } catch (error) {
      if (admin) context.locals.adminFailure = error instanceof AdminError ? { status: error.status, message: error.message } : { status: 503, message: 'Admin access is temporarily unavailable.' };
    }
  }
  const original = await next();
  const response = admin || adTest ? new Response(original.body, { status: original.status, statusText: original.statusText, headers: original.headers }) : original;
  if (admin || adTest) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    if (admin) response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  }
  return response;
});
