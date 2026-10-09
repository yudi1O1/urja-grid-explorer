import type { Meter } from '../types/meter';

interface Props {
  meters: Meter[];
  onSelectMeter: (meter: Meter) => void;
  selectedMeterId?: string;
}

const statusTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('fault')) return 'status-warning';
  if (normalized.includes('decommission')) return 'status-muted';
  return 'status-good';
};

export const MeterTable = ({ meters, onSelectMeter, selectedMeterId }: Props) => {
  if (meters.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">⌕</span>
        <h3>No matching meters</h3>
        <p>Try a shorter meter ID or serial number.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="meter-table">
        <thead>
          <tr>
            <th scope="col">Meter</th>
            <th scope="col">Serial number</th>
            <th scope="col">Manufacturer</th>
            <th scope="col">Phase</th>
            <th scope="col">Install status</th>
            <th scope="col">Transformer</th>
            <th scope="col"><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody>
          {meters.map((meter) => (
            <tr key={meter.meterId} className={selectedMeterId === meter.meterId ? 'selected-row' : undefined}>
              <td>
                <span className="meter-id-cell"><span className="meter-glyph" aria-hidden="true">M</span><strong>{meter.meterId}</strong></span>
              </td>
              <td className="serial-cell">{meter.serialNo}</td>
              <td>{meter.make}</td>
              <td><span className="phase-tag">{meter.phaseType}</span></td>
              <td><span className={`status-tag ${statusTone(meter.installStatus)}`}><i aria-hidden="true" />{meter.installStatus}</span></td>
              <td><code className="transformer-code">{meter.dtCode || '—'}</code></td>
              <td className="action-cell">
                <button
                  type="button"
                  className="view-button"
                  data-meter-id={meter.meterId}
                  aria-pressed={selectedMeterId === meter.meterId}
                  onClick={() => onSelectMeter(meter)}
                >
                  {selectedMeterId === meter.meterId ? 'Viewing' : 'View'} <span aria-hidden="true">↗</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
