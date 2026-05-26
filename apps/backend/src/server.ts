import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { createClient } from '@supabase/supabase-js';
import { createAuthRouter } from './modules/auth/interfaces/router.js';
import { createUsersRouter } from './modules/users/interfaces/router.js';
import { errorHandler } from './shared/error-handler.js';
import { swaggerSpec } from './shared/swagger.js';
import logger from './shared/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Swagger UI
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
app.use('/docs', swaggerUi.serve as any);
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
app.get('/docs', swaggerUi.setup(swaggerSpec) as any);
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.send(swaggerSpec as any);
});

// Rutas de salud
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de módulos
app.use('/auth', createAuthRouter(supabase));
app.use('/users', createUsersRouter(supabase));

// Middleware de error (siempre al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`);
});
