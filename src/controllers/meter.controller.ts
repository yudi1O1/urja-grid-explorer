import { Request, Response, NextFunction } from 'express';
import {
  getMeterDetail as serviceGetMeterDetail,
  getMeterLocation as serviceGetMeterLocation,
  getMeterConsumption as serviceGetMeterConsumption,
  searchMeters,
  searchTransformers,
} from '../services/meter.service';

const parsePage = (value: unknown): number | null => {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
};

const isMeterId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/.test(value);

export const getMeters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const qParam = req.query.q;
    let q = '';

    if (qParam !== undefined) {
      if (typeof qParam !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_QUERY',
            message: 'q must be a string',
          },
        });
        return;
      }
      q = qParam;
    }

    const page = parsePage(req.query.page);
    if (page === null) {
      res.status(400).json({
        error: {
          code: 'INVALID_PAGE',
          message: 'page must be a positive integer',
        },
      });
      return;
    }

    const response = await searchMeters(q, page);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getMeterDetail = async (req: Request, res: Response, next: NextFunction) => {
  const { meterId } = req.params;
  if (!isMeterId(meterId)) {
    res.status(400).json({
      error: { code: 'INVALID_METER_ID', message: 'meterId has an invalid format' },
    });
    return;
  }
  try {
    res.json(await serviceGetMeterDetail(meterId));
  } catch (error) {
    next(error);
  }
};

export const getMeterLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meterId } = req.params;
    if (!isMeterId(meterId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_METER_ID',
          message: 'meterId has an invalid format',
        },
      });
      return;
    }

    const response = await serviceGetMeterLocation(meterId);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getMeterConsumption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { meterId } = req.params;
    if (!isMeterId(meterId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_METER_ID',
          message: 'meterId has an invalid format',
        },
      });
      return;
    }

    const response = await serviceGetMeterConsumption(meterId);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getTransformers = async (req: Request, res: Response, next: NextFunction) => {
  const page = parsePage(req.query.page);
  if (page === null) {
    res.status(400).json({
      error: { code: 'INVALID_PAGE', message: 'page must be a positive integer' },
    });
    return;
  }
  try {
    res.json(await searchTransformers(page));
  } catch (error) {
    next(error);
  }
};
