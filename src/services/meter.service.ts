import { authenticatedUrjaGet } from '../clients/urjaClient';
import {
  PublicMeterResponse,
  PublicMeterLocation,
  PublicEnergyResponse,
  PublicMeterDetailResponse,
  MeterNameplate,
  MeterHierarchy,
  PublicTransformerResponse,
} from '../types/meter';
import { decodeSvelteData } from '../utils/svelteData';
import { toSafeNumber } from '../utils/normalizer';
import { UpstreamProtocolError } from '../utils/upstream';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const searchMeters = async (q: string, page: number): Promise<PublicMeterResponse> => {
  const responseData = await authenticatedUrjaGet<unknown>('/portal/meters/search', {
    params: {
      q,
      page,
    },
  });

  if (!isRecord(responseData) || !Array.isArray(responseData.data) ||
      !Number.isSafeInteger(responseData.total) || !Number.isSafeInteger(responseData.page) ||
      !Number.isSafeInteger(responseData.pageSize)) {
    throw new UpstreamProtocolError('Portal returned an invalid meter search page');
  }
  const data = responseData.data.map((meter) => {
    if (!isRecord(meter) ||
        !['meterId', 'serialNo', 'make', 'phaseType', 'installStatus', 'dtCode']
          .every((key) => typeof meter[key] === 'string')) {
      throw new UpstreamProtocolError('Portal returned an invalid meter record');
    }
    return meter as unknown as PublicMeterResponse['data'][number];
  });

  return {
    data,
    pagination: {
      total: responseData.total as number,
      page: responseData.page as number,
      pageSize: responseData.pageSize as number,
    },
  };
};

export const getMeterLocation = async (meterId: string): Promise<PublicMeterLocation> => {
  const responseData = await authenticatedUrjaGet<unknown>(`/portal/meters/${encodeURIComponent(meterId)}/geo`);
  if (!isRecord(responseData) || !isRecord(responseData.data) ||
      typeof responseData.data.latitude !== 'string' || typeof responseData.data.longitude !== 'string') {
    throw new UpstreamProtocolError('Portal returned an invalid meter location');
  }
  return {
    data: {
      latitude: toSafeNumber(responseData.data.latitude),
      longitude: toSafeNumber(responseData.data.longitude),
    },
  };
};

export const getMeterConsumption = async (meterId: string): Promise<PublicEnergyResponse> => {
  const responseData = await authenticatedUrjaGet<unknown>(`/portal/meters/${encodeURIComponent(meterId)}/energy`);
  if (!isRecord(responseData) || !Array.isArray(responseData.data)) {
    throw new UpstreamProtocolError('Portal returned an invalid consumption response');
  }
  return {
    data: responseData.data.map((reading) => {
      if (!isRecord(reading) || typeof reading.timestamp !== 'string' ||
          typeof reading.kwh !== 'string' || typeof reading.kvah !== 'string' ||
          typeof reading.voltR !== 'string') {
        throw new UpstreamProtocolError('Portal returned an invalid consumption reading');
      }
      return {
        timestamp: reading.timestamp,
        kwh: toSafeNumber(reading.kwh),
        kvah: toSafeNumber(reading.kvah),
        voltR: toSafeNumber(reading.voltR),
      };
    }),
  };
};

const normalizedLabel = (value: string): string => value.toLowerCase().replace(/[^a-z]/g, '');

const readNameplate = (detail: Record<string, unknown>): MeterNameplate => {
  let fields: Record<string, unknown>;

  if (Array.isArray(detail.data)) {
    fields = {};
    for (const item of detail.data) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      if (typeof record.parameterName === 'string') {
        fields[normalizedLabel(record.parameterName)] = record.parameterValue;
      }
    }
  } else if (typeof detail.classData === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(detail.classData);
    } catch {
      throw new UpstreamProtocolError('Portal returned invalid meter detail data');
    }
    const installedMeter = (parsed as Record<string, unknown>)?.installed_meter;
    if (!installedMeter || typeof installedMeter !== 'object') {
      throw new UpstreamProtocolError('Portal meter detail is missing nameplate fields');
    }
    fields = Object.fromEntries(
      Object.entries(installedMeter as Record<string, unknown>).map(([key, value]) => [
        normalizedLabel(key),
        value,
      ]),
    );
  } else {
    throw new UpstreamProtocolError('Portal meter detail format is unsupported');
  }

  const readString = (key: string): string => {
    const value = fields[key];
    if (typeof value !== 'string') {
      throw new UpstreamProtocolError('Portal meter detail is missing a nameplate field');
    }
    return value;
  };

  return {
    meterId: readString('meterid'),
    serialNo: readString('serialno'),
    make: readString('make'),
    phaseType: readString('phasetype'),
    installStatus: readString('installationstatus'),
    installationType: readString('installationtype'),
  };
};

const readHierarchyItem = (value: unknown): { name: string; code: string } => {
  if (typeof value !== 'string') {
    throw new UpstreamProtocolError('Portal meter hierarchy is incomplete');
  }
  const match = value.match(/^(.*?)\s+\(([^()]*)\)$/);
  return match ? { name: match[1], code: match[2] } : { name: value, code: '' };
};

const readHierarchy = (value: unknown): MeterHierarchy => {
  if (!value || typeof value !== 'object') {
    throw new UpstreamProtocolError('Portal meter hierarchy is missing');
  }
  const fields = value as Record<string, unknown>;
  const get = (key: string) => {
    const result = Object.entries(fields).find(([label]) => normalizedLabel(label) === key)?.[1];
    return readHierarchyItem(result);
  };
  return {
    zone: get('zone'),
    circle: get('circle'),
    division: get('division'),
    subdivision: get('subdivision'),
    substation: get('substation'),
    feeder: get('feeder'),
    dt: get('dt'),
  };
};

export const getMeterDetail = async (meterId: string): Promise<PublicMeterDetailResponse> => {
  const payload = await authenticatedUrjaGet<unknown>(
    `/meters/${encodeURIComponent(meterId)}/__data.json`,
    { params: { 'x-sveltekit-invalidated': '001' } },
  );
  const decoded = decodeSvelteData(payload) as Record<string, unknown>;
  const detail = decoded?.detail;
  const nameplate = detail && typeof detail === 'object'
    ? readNameplate(detail as Record<string, unknown>)
    : null;

  if (!nameplate || nameplate.meterId !== meterId) {
    throw new UpstreamProtocolError('Portal returned details for a different meter');
  }

  return {
    data: {
      nameplate,
      hierarchy: readHierarchy(decoded.hierarchy),
    },
  };
};

export const searchTransformers = async (page: number): Promise<PublicTransformerResponse> => {
  const response = await authenticatedUrjaGet<unknown>('/portal/dts', {
    params: { page },
  });
  if (!isRecord(response) || !Array.isArray(response.data) || !Number.isSafeInteger(response.total) ||
      !Number.isSafeInteger(response.page) || !Number.isSafeInteger(response.pageSize)) {
    throw new UpstreamProtocolError('Portal returned an invalid transformer page');
  }
  const data = response.data.map((transformer) => {
    if (!isRecord(transformer) || typeof transformer.code !== 'string' ||
        typeof transformer.name !== 'string' || typeof transformer.feederCode !== 'string' ||
        typeof transformer.capacityKva !== 'number' || !Number.isFinite(transformer.capacityKva)) {
      throw new UpstreamProtocolError('Portal returned an invalid transformer record');
    }
    return transformer as unknown as PublicTransformerResponse['data'][number];
  });
  return {
    data,
    pagination: {
      total: response.total as number,
      page: response.page as number,
      pageSize: response.pageSize as number,
    },
  };
};
