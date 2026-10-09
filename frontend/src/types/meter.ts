export interface Meter {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: string;
  installStatus: string;
  dtCode: string;
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
}

export interface MeterSearchResponse {
  data: Meter[];
  pagination: Pagination;
}

export interface MeterLocation {
  latitude: number;
  longitude: number;
}

export interface MeterLocationResponse {
  data: MeterLocation;
}

export interface ConsumptionReading {
  timestamp: string;
  kwh: number;
  kvah: number;
  voltR: number;
}

export interface ConsumptionResponse {
  data: ConsumptionReading[];
}

export interface MeterDetailResponse {
  data: {
    nameplate: {
      meterId: string;
      serialNo: string;
      make: string;
      phaseType: string;
      installStatus: string;
      installationType: string;
    };
    hierarchy: {
      zone: { name: string; code: string };
      circle: { name: string; code: string };
      division: { name: string; code: string };
      subdivision: { name: string; code: string };
      substation: { name: string; code: string };
      feeder: { name: string; code: string };
      dt: { name: string; code: string };
    };
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
