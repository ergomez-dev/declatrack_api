import { Response } from 'express';

export function successResponse(res: Response, data: unknown, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function errorResponse(res: Response, message: string, statusCode = 400, errors?: unknown) {
  return res.status(statusCode).json({ success: false, message, ...(errors ? { errors } : {}) });
}

export function paginatedResponse(
  res: Response,
  data: unknown,
  total: number,
  page: number,
  limit: number,
  message = 'OK'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
