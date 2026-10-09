import { useEffect, useState } from 'react';
import { meterApi } from '../api/meterApi';
import type { ConsumptionReading, MeterDetailResponse, MeterLocation } from '../types/meter';

interface Props {
  meterId: string;
}

const hierarchy = [
  ['zone', 'Zone'],
  ['circle', 'Circle'],
  ['division', 'Division'],
  ['subdivision', 'Subdivision'],
  ['substation', 'Substation'],
  ['feeder', 'Feeder'],
  ['dt', 'Transformer'],
] as const;

const makeChartPoints = (readings: ConsumptionReading[]) => {
  const sample = readings.slice(-48);
  if (sample.length < 2) return '';
  const values = sample.map((reading) => reading.kwh);
  const minimum = Math.min(...values);
  const spread = Math.max(...values) - minimum || 1;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 34 - ((value - minimum) / spread) * 28;
    return `${x},${y}`;
  }).join(' ');
};

const formatNumber = (value: number | undefined) => value === undefined
  ? '—'
  : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);

export const MeterDetails = ({ meterId }: Props) => {
  const [detail, setDetail] = useState<MeterDetailResponse['data'] | null>(null);
  const [location, setLocation] = useState<MeterLocation | null>(null);
  const [readings, setReadings] = useState<ConsumptionReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      meterApi.getMeterDetail(meterId),
      meterApi.getMeterLocation(meterId),
      meterApi.getMeterConsumption(meterId),
    ])
      .then(([meterResponse, locationResponse, consumptionResponse]) => {
        if (!active) return;
        setDetail(meterResponse.data);
        setLocation(locationResponse.data);
        setReadings(consumptionResponse.data);
      })
      .catch(() => {
        if (active) setError('Details are temporarily unavailable. Close this panel and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [meterId]);

  if (loading) {
    return <div className="detail-loading" role="status"><span className="spinner" /> Loading meter record…</div>;
  }
  if (error) return <div className="detail-error" role="alert">{error}</div>;
  if (!detail) return null;

  const plate = detail.nameplate;
  const path = hierarchy.map(([key, label]) => ({ label, ...detail.hierarchy[key] }));
  const latest = readings.at(-1);
  const recent = readings.slice(-10).reverse();
  const statusClass = plate.installStatus.toLowerCase().includes('fault')
    ? 'status-warning'
    : plate.installStatus.toLowerCase().includes('decommission')
      ? 'status-muted'
      : 'status-good';

  return (
    <div className="detail-content">
      <header className="detail-topline">
        <div>
          <p className="overline">METER PROFILE</p>
          <h2 id="detail-title">{plate.meterId}</h2>
          <p className="detail-subtitle">{plate.make} <span>·</span> serial {plate.serialNo}</p>
        </div>
        <span className={`status-tag ${statusClass}`}><i aria-hidden="true" />{plate.installStatus}</span>
      </header>

      <section className="profile-grid" aria-label="Meter overview">
        <article className="profile-card identity-card">
          <div className="profile-card-title"><span className="card-icon meter-card-icon" aria-hidden="true">M</span><div><p>NAMEPLATE</p><h3>Configuration</h3></div></div>
          <dl className="spec-list">
            <div><dt>Phase</dt><dd>{plate.phaseType}</dd></div>
            <div><dt>Installation type</dt><dd>{plate.installationType}</dd></div>
          </dl>
        </article>
        <article className="profile-card location-card">
          <div className="profile-card-title"><span className="card-icon pin-card-icon" aria-hidden="true">⌖</span><div><p>LOCATION</p><h3>Coordinates</h3></div></div>
          {location ? (
            <div className="coordinate-grid">
              <div><span>LATITUDE</span><strong>{location.latitude.toFixed(5)}</strong></div>
              <div><span>LONGITUDE</span><strong>{location.longitude.toFixed(5)}</strong></div>
            </div>
          ) : <p className="unavailable-note">Coordinates were not returned for this meter.</p>}
        </article>
      </section>

      <section className="detail-section network-section" aria-labelledby="network-title">
        <div className="section-title-line">
          <div><p className="overline">CONNECTION MAP</p><h3 id="network-title">Network path</h3></div>
          <span className="level-count">{path.length} levels</span>
        </div>
        <ol className="network-path">
          {path.map((item, index) => (
            <li key={item.label} className={index === path.length - 1 ? 'path-terminal' : undefined}>
              <span className="path-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="path-label">{item.label}</span>
              <strong title={item.name}>{item.name || 'Unassigned'}</strong>
              <code>{item.code || '—'}</code>
            </li>
          ))}
        </ol>
      </section>

      <section className="detail-section usage-section" aria-labelledby="usage-title">
        <div className="section-title-line usage-title-line">
          <div><p className="overline">METER READINGS</p><h3 id="usage-title">Recent consumption</h3></div>
          <span className="reading-count">{readings.length.toLocaleString()} <small>records</small></span>
        </div>
        <div className="usage-summary">
          <div><span>LATEST kWh</span><strong>{formatNumber(latest?.kwh)}</strong></div>
          <div><span>LATEST kVAh</span><strong>{formatNumber(latest?.kvah)}</strong></div>
          <div><span>VOLTAGE R</span><strong>{latest ? `${formatNumber(latest.voltR)} V` : '—'}</strong></div>
        </div>
        {readings.length > 1 && (
          <div className="usage-chart">
            <svg viewBox="0 0 100 38" preserveAspectRatio="none" role="img" aria-label="Recent meter kWh readings">
              <path className="chart-fill" d={`M 0 35 L ${makeChartPoints(readings)} L 100 35 Z`} />
              <polyline points={makeChartPoints(readings)} />
            </svg>
            <div><span>Older</span><span>Latest: {latest?.timestamp}</span></div>
          </div>
        )}
        <div className="reading-table-wrap">
          <table className="reading-table">
            <thead><tr><th scope="col">Timestamp</th><th scope="col">kWh</th><th scope="col">kVAh</th><th scope="col">Voltage R</th></tr></thead>
            <tbody>
              {recent.map((reading) => (
                <tr key={reading.timestamp}><td>{reading.timestamp}</td><td>{formatNumber(reading.kwh)}</td><td>{formatNumber(reading.kvah)}</td><td>{formatNumber(reading.voltR)} V</td></tr>
              ))}
            </tbody>
          </table>
          {readings.length === 0 && <p className="unavailable-note">No consumption readings are available.</p>}
        </div>
        <p className="timestamp-note">Timestamps are displayed as received. The portal does not include a timezone.</p>
      </section>
    </div>
  );
};
