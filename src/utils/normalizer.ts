import { UpstreamProtocolError } from './upstream';

export const toSafeNumber = (value: string): number => {
  const num = Number(value);
  if (value.trim() === '' || !Number.isFinite(num)) {
    throw new UpstreamProtocolError('Portal returned a non-numeric measurement');
  }
  return num;
};
