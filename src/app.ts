import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import apiV1 from './routes/v1';
import { errorHandler } from './middleware/error.middleware';
import { swaggerSpec } from './lib/swagger';

const app = express();

// CORS: lista blanca desde CORS_ORIGINS, separada por comas.
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Healthcheck.
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Documentación OpenAPI. El spec crudo se expone como JSON para herramientas
// (clientes generados, validadores) y la UI interactiva en /api-docs.
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API v1.
app.use('/api/v1', apiV1);

// 404 para rutas no encontradas.
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found', details: null },
  });
});

// Error handler global (debe ir al final).
app.use(errorHandler);

export default app;
