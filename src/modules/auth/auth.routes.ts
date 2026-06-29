import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rateLimit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, changePasswordSchema } from './auth.schema';
import * as svc from './auth.service';
import { successResponse } from '../../utils/response.util';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip ?? req.socket.remoteAddress;
    successResponse(res, await svc.login(req.body, ip), 'Login exitoso');
  } catch (e) { next(e); }
});

router.post('/logout', authMiddleware, async (_req: Request, res: Response) => {
  successResponse(res, null, 'Sesión cerrada');
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    successResponse(res, await svc.getProfile(req.user!.sub, req.user!.tenantId ?? undefined));
  } catch (e) { next(e); }
});

router.put('/change-password', authMiddleware, validate(changePasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.changePassword(req.user!.sub, req.user!.tenantId, req.body);
    successResponse(res, null, 'Contraseña actualizada');
  } catch (e) { next(e); }
});

export default router;
