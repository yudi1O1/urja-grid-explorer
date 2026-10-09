import React from 'react';
import type { Meter } from '../types/meter';

interface Props {
  meters: Meter[];
  onSelectMeter: (meter: Meter) => void;
  selectedMeterId?: string;
}

export const MeterTable: React.FC<Props> = ({ meters, onSelectMeter, selectedMeterId }) => {
  if (meters.length === 0) {
    return <div className="no-results">No meters found.</div>;
  }

  return (
    <div className="table-container">
      <table className="meter-table">
        <thead>
          <tr>
            <th>Meter ID</th>
            <th>Serial Number</th>
            <th>Make</th>
            <th>Phase</th>
            <th>Status</th>
            <th>DT Code</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {meters.map(meter => (
            <tr 
              key={meter.meterId} 
              className={selectedMeterId === meter.meterId ? 'selected-row' : ''}
            >
              <td>{meter.meterId}</td>
              <td>{meter.serialNo}</td>
              <td>{meter.make}</td>
              <td>{meter.phaseType}</td>
              <td>{meter.installStatus}</td>
              <td>{meter.dtCode}</td>
              <td>
                <button
                  type="button"
                  data-meter-id={meter.meterId}
                  aria-pressed={selectedMeterId === meter.meterId}
                  onClick={() => onSelectMeter(meter)}
                >
                  {selectedMeterId === meter.meterId ? 'Viewing' : 'View'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
