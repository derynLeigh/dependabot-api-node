import type { Request, Response, NextFunction } from 'express';

export function handleErrorResponse(
  res: Response,
  error: unknown,
  context?: { request?: Request },
): void {
  const timeStamp = new Date().toISOString();
  const errorDetails =
    error instanceof Error
      ? {
          code: 'INTERNAL ERROR',
          message: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }
      : {
          code: 'UNKNOWN ERROR',
          message: 'An unknown error occurred',
        };

  console.error(
    `[${timeStamp}] Error processing request to ${context?.request?.originalUrl}:`,
  );
  console.error(errorDetails);

  res.status(500).json({
    error: {
      code: errorDetails.code,
      message: errorDetails.message,
      ...(process.env.NODE_ENV === 'development' && { details: errorDetails }),
    },
    meta: {
      timeStamp,
      path: context?.request?.originalUrl,
    },
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  handleErrorResponse(res, error, { request: req });
}
