export class UpstreamProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamProtocolError';
  }
}
