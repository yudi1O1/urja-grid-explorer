import { useEffect, useState } from 'react';
import type { ConsumptionReading, MeterDetailResponse, MeterLocation } from '../types/meter';
import { meterApi } from '../api/meterApi';

interface Props {
  meterId: string;
}

const hierarchyLevels = [
  ['zone', 'Zone'],
  ['circle', 'Circle'],
  ['division', 'Division'],
  ['subdivision', 'Subdivision'],
  ['substation', 'Substation'],
  ['feeder', 'Feeder'],
  ['dt', 'Transformer'],
] as const;

const chartPoints = (readings: ConsumptionReading[]): string => {
  const recent = readings.slice(-48);
  if (recent.length < 2) return '';
  const values = recent.map((reading) => reading.kwh);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  return values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${34 - ((value - min) / range) * 28}`)
    .join(' ');
};

export const MeterDetails = ({ meterId }: Props) => {
  const [detail, setDetail] = useState<MeterDetailResponse['data'] | null>(null);
  const [location, setLocation] = useState<MeterLocation | null>(null);
  const [consumption, setConsumption] = useState<ConsumptionReading[]>([]);
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
      .then(([detailResponse, locationResponse, consumptionResponse]) => {
        if (!active) return;
        setDetail(detailResponse.data);
        setLocation(locationResponse.data);
        setConsumption(consumptionResponse.data);
      })
      .catch(() => {
        if (active) setError('Meter details could not be loaded. Try again in a moment.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [meterId]);

  if (loading) return <section id="meter-details" className="details-panel" aria-live="polite">Loading meter details…</section>;
  if (error) return <section id="meter-details" className="details-panel error" role="alert">{error}</section>;
  if (!detail) return null;

  const nameplate = detail.nameplate;
  const levels = hierarchyLevels.map(([key, label]) => ({
    label,
    ...detail.hierarchy[key],
  }));
  const latest = consumption.at(-1);
  const recentReadings = consumption.slice(-12).reverse();
  const statusClass = nameplate.installStatus.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <section id="meter-details" className="details-panel" aria-labelledby="detail-heading">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">METER RECORD</p>
          <h2 id="detail-heading">{nameplate.meterId}</h2>
          <p className="muted">{nameplate.make} · {nameplate.serialNo}</p>
        </div>
        <span className={`status-pill status-${statusClass}`}>{nameplate.installStatus}</span>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <p className="section-label">NAMEPLATE</p>
          <dl className="nameplate-grid">
            <div><dt>Phase</dt><dd>{nameplate.phaseType}</dd></div>
            <div><dt>Installation</dt><dd>{nameplate.installationType}</dd></div>
          </dl>
        </section>
        <section className="detail-card">
          <p className="section-label">LOCATION</p>
          {location ? (
            <div className="coordinate-pair">
              <div><span>LAT</span><strong>{location.latitude.toFixed(6)}</strong></div>
              <div><span>LON</span><strong>{location.longitude.toFixed(6)}</strong></div>
            </div>
          ) : <p className="muted">Coordinates unavailable.</p>}
        </section>
      </div>

      <section className="detail-card hierarchy-card">
        <div className="section-heading">
          <p className="section-label">NETWORK PATH</p>
          <span className="muted">7 levels</span>
        </div>
        <ol className="hierarchy-list">
          {levels.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.name || 'Unassigned'}</strong>
              <code>{item.code || '—'}</code>
            </li>
          ))}
        </ol>
      </section>

      <section className="detail-card consumption-card">
        <div className="section-heading">
          <div><p className="section-label">RECENT CONSUMPTION</p><h3>Energy readings</h3></div>
          <div className="reading-total"><strong>{consumption.length}</strong><span>readings</span></div>
        </div>
        {consumption.length > 1 && (
          <div className="chart-wrap">
            <svg viewBox="0 0 100 38" preserveAspectRatio="none" role="img" aria-label="Recent cumulative kilowatt-hour readings">
              <line x1="0" y1="34" x2="100" y2="34" className="chart-axis" />
              <polyline points={chartPoints(consumption)} className="chart-line" />
            </svg>
            <div className="chart-caption"><span>Earlier</span><span>Latest · {latest?.timestamp}</span></div>
          </div>
        )}
        <div className="table-container">
          <table className="meter-table readings-table">
            <thead><tr><th>Timestamp</th><th>kWh</th><th>kVAh</th><th>Voltage R</th></tr></thead>
            <tbody>
              {recentReadings.map((reading) => (
                <tr key={reading.timestamp}>
                  <td>{reading.timestamp}</td><td>{reading.kwh}</td><td>{reading.kvah}</td><td>{reading.voltR} V</td>
                </tr>
              ))}
            </tbody>
          </table>
          {consumption.length === 0 && <p className="muted">No consumption readings are available.</p>}
        </div>
        <p className="data-note">Timestamps are shown exactly as provided by the portal; timezone is unspecified.</p>
      </section>
    </section>
  );
};
