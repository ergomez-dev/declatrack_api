import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import logger from './config/logger';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { errorMiddleware } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import contribuyentesRoutes from './modules/contribuyentes/contribuyente.routes';
import declaracionesRoutes from './modules/declaraciones/declaracion.routes';
import certificadosRoutes from './modules/certificados/certificado.routes';
import plataformasRoutes from './modules/plataformas/plataforma.routes';
import usuariosRoutes from './modules/usuarios/usuario.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import tenantsRoutes from './modules/tenants/tenant.routes';
import rolesRoutes from './modules/roles/rol.routes';
import permisosRoutes from './modules/permisos/permiso.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use('/api/', generalLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/contribuyentes', contribuyentesRoutes);
app.use('/api/v1/declaraciones', declaracionesRoutes);
app.use('/api/v1/certificados', certificadosRoutes);
app.use('/api/v1/plataformas', plataformasRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/tenants', tenantsRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/permisos', permisosRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));
app.use(errorMiddleware);

export default app;
