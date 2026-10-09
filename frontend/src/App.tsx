import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import type { Meter, Pagination } from './types/meter';
import { meterApi } from './api/meterApi';
import { MeterTable } from './components/MeterTable';
import { MeterDetails } from './components/MeterDetails';
import './index.css';

function App() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 20 });
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMeterId, setSelectedMeterId] = useState<string | undefined>();
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const getOriginTransform = (meterId: string, modal: HTMLElement) => {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-meter-id]'))
      .find((element) => element.dataset.meterId === meterId);
    if (!button) return 'translateY(18px) scale(.96)';

    const from = button.getBoundingClientRect();
    const to = modal.getBoundingClientRect();
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  };

  const closeMeterDetails = async () => {
    if (!selectedMeterId || closingRef.current) return;
    const modal = modalRef.current;
    const backdrop = backdropRef.current;
    if (!modal || !backdrop) {
      setSelectedMeterId(undefined);
      return;
    }

    closingRef.current = true;
    const duration = 440;
    const origin = getOriginTransform(selectedMeterId, modal);
    const modalAnimation = modal.animate(
      [{ transform: 'none' }, { transform: origin }],
      { duration, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'both' },
    );
    backdrop.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: duration - 40, easing: 'ease-out', fill: 'both' },
    );

    try {
      await modalAnimation.finished;
    } catch {
      // The dialog may be removed while the browser is finishing the animation.
    }
    setSelectedMeterId(undefined);
    closingRef.current = false;
  };

  useEffect(() => {
    fetchMeters(query, pagination.page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pagination.page]);

  useEffect(() => {
    if (!selectedMeterId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void closeMeterDetails();
    };
    window.addEventListener('keydown', handleKeyDown);

    closingRef.current = false;
    const modal = modalRef.current;
    const backdrop = backdropRef.current;
    if (modal && backdrop) {
      const origin = getOriginTransform(selectedMeterId, modal);
      const animation = modal.animate(
        [{ transform: origin }, { transform: 'none' }],
        { duration: 500, easing: 'cubic-bezier(.18,.8,.25,1)', fill: 'both' },
      );
      backdrop.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 420, easing: 'ease-out', fill: 'both' },
      );
      void animation.finished.then(() => animation.cancel()).catch(() => undefined);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMeterId]);

  const fetchMeters = async (searchQuery: string, page: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await meterApi.searchMeters(searchQuery, page);
      setMeters(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Unable to load meters.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));
    setQuery(searchInput);
    setSelectedMeterId(undefined);
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev: Pagination) => ({ ...prev, page: prev.page - 1 }));
      setSelectedMeterId(undefined);
    }
  };

  const handleNextPage = () => {
    const maxPages = Math.ceil(pagination.total / pagination.pageSize);
    if (pagination.page < maxPages) {
      setPagination((prev: Pagination) => ({ ...prev, page: prev.page + 1 }));
      setSelectedMeterId(undefined);
    }
  };

  const hasNextPage = pagination.page < Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">F</div>
          <div className="brand-copy"><strong>Flock Energy</strong><span>FIELD OPERATIONS</span></div>
          <span className="live-tag"><i /> READ-ONLY SERVICE</span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">URJA METER OPS · DATA EXPLORER</p>
          <h1>Know every meter.<br /><span>See the network behind it.</span></h1>
          <p>Search the meter fleet, follow its grid hierarchy, and inspect recent readings.</p>
        </div>
      </header>

      <main className="app-main">
        <section className="search-section">
          <div className="section-heading">
            <div><p className="section-label">METER DIRECTORY</p><h2>Find a meter</h2></div>
            <span className="fleet-count">{pagination.total.toLocaleString()} <span>meters</span></span>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input 
              type="text" 
              placeholder="Search by meter ID or serial number..." 
              aria-label="Search by meter ID or serial number"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
        </section>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-message">Loading meters...</div>
        ) : (
          <>
            <MeterTable 
              meters={meters} 
              onSelectMeter={(m) => setSelectedMeterId(m.meterId)} 
              selectedMeterId={selectedMeterId}
            />

            <div className="pagination">
              <button 
                onClick={handlePrevPage} 
                disabled={pagination.page <= 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.page}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={!hasNextPage}
              >
                Next
              </button>
            </div>
          </>
        )}

      </main>
      {selectedMeterId && (
        <div
          className="meter-modal-backdrop"
          ref={backdropRef}
          onMouseDown={() => void closeMeterDetails()}
        >
          <div
            className="meter-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Details for meter ${selectedMeterId}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close meter details"
              onClick={() => void closeMeterDetails()}
              autoFocus
            >
              ×
            </button>
            <MeterDetails meterId={selectedMeterId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
