import 'express-async-errors';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { createClient } from '@supabase/supabase-js';
import { createAuthRouter } from './modules/auth/interfaces/router.js';
import { createUsersRouter } from './modules/users/interfaces/router.js';
import { createMarketRouter } from './modules/market/interfaces/router.js';
import { createLocationsRouter } from './modules/locations/interfaces/router.js';
import { createPreferencesRouter } from './modules/preferences/interfaces/router.js';
import { errorHandler } from './shared/error-handler.js';
import { swaggerSpec } from './shared/swagger.js';
import logger from './shared/logger.js';
import { runMigrations } from './shared/migrations.js';
import seedAdmin from './shared/seed-admin.js';
import { cryptoMiddleware } from './shared/crypto-middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
app.use('/docs', swaggerUi.serve as any);
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
app.get('/docs', swaggerUi.setup(swaggerSpec) as any);
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.send(swaggerSpec as any);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authLimiter, cryptoMiddleware as RequestHandler, createAuthRouter(supabase));
app.use('/users', generalLimiter, cryptoMiddleware as RequestHandler, createUsersRouter(supabase));
app.use('/market', generalLimiter, createMarketRouter(supabase));
app.use('/locations', generalLimiter, createLocationsRouter());
app.use('/preferences', generalLimiter, createPreferencesRouter(supabase));

app.use(errorHandler);

const runStartupTasks = async (): Promise<void> => {
  try {
    await runMigrations(supabase);

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? '';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? '';
    await seedAdmin(supabase, adminEmail, adminPassword);
  } catch (err) {
    logger.error('Error en tareas de arranque (migraciones/seed)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const start = (): void => {
  app.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
  });

  void runStartupTasks();
};

void start();
