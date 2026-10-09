import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { UpstreamProtocolError } from '../utils/upstream';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (axios.isAxiosError(err)) {
    console.error('Upstream request failed:', err.response?.status ?? 'network error');
    res.status(502).json({
      error: {
        code: 'UPSTREAM_ERROR',
        message: 'Failed to fetch data from the Urja portal',
      },
    });
    return;
  }

  if (err instanceof UpstreamProtocolError) {
    console.error('Upstream response could not be interpreted');
    res.status(502).json({
      error: {
        code: 'UPSTREAM_INVALID_RESPONSE',
        message: 'The Urja portal returned data in an unexpected format',
      },
    });
    return;
  }

  console.error('Unhandled error:', err instanceof Error ? err.stack : err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    },
  });
};
