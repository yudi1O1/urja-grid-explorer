export interface UpstreamMeter {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: string;
  installStatus: string;
  dtCode: string;
}

export interface UpstreamMeterSearchResponse {
  data: UpstreamMeter[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublicMeter {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: string;
  installStatus: string;
  dtCode: string;
}

export interface PublicMeterResponse {
  data: PublicMeter[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface MeterNameplate {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: string;
  installStatus: string;
  installationType: string;
}

export interface HierarchyItem {
  name: string;
  code: string;
}

export interface MeterHierarchy {
  zone: HierarchyItem;
  circle: HierarchyItem;
  division: HierarchyItem;
  subdivision: HierarchyItem;
  substation: HierarchyItem;
  feeder: HierarchyItem;
  dt: HierarchyItem;
}

export interface PublicMeterDetailResponse {
  data: {
    nameplate: MeterNameplate;
    hierarchy: MeterHierarchy;
  };
}

export interface UpstreamTransformer {
  code: string;
  name: string;
  feederCode: string;
  capacityKva: number;
}

export interface UpstreamTransformerResponse {
  data: UpstreamTransformer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublicTransformerResponse {
  data: UpstreamTransformer[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface UpstreamMeterLocation {
  data: {
    latitude: string;
    longitude: string;
  };
}

export interface PublicMeterLocation {
  data: {
    latitude: number;
    longitude: number;
  };
}

export interface UpstreamEnergyReading {
  timestamp: string;
  kwh: string;
  kvah: string;
  voltR: string;
}

export interface PublicEnergyReading {
  timestamp: string;
  kwh: number;
  kvah: number;
  voltR: number;
}

export interface UpstreamEnergyResponse {
  data: UpstreamEnergyReading[];
}

export interface PublicEnergyResponse {
  data: PublicEnergyReading[];
}
