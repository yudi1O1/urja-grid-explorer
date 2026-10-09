import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { meterApi } from './api/meterApi';
import { MeterDetails } from './components/MeterDetails';
import { MeterTable } from './components/MeterTable';
import type { Meter, Pagination } from './types/meter';
import './index.css';

const emptyPage: Pagination = { total: 0, page: 1, pageSize: 20 };

function App() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPage);
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMeterId, setSelectedMeterId] = useState<string>();
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isClosing = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    meterApi.searchMeters(query, pagination.page)
      .then((response) => {
        if (!active) return;
        setMeters(response.data);
        setPagination(response.pagination);
      })
      .catch(() => {
        if (active) setError('The meter directory could not be loaded. Check the API and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [query, pagination.page]);

  const getButtonOrigin = (meterId: string, modal: HTMLElement) => {
    const trigger = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-meter-id]'))
      .find((button) => button.dataset.meterId === meterId);
    if (!trigger) return 'translateY(20px) scale(.96)';

    const from = trigger.getBoundingClientRect();
    const to = modal.getBoundingClientRect();
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  };

  const closeDetails = async () => {
    if (!selectedMeterId || isClosing.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSelectedMeterId(undefined);
      return;
    }

    const modal = modalRef.current;
    const backdrop = backdropRef.current;
    if (!modal || !backdrop) {
      setSelectedMeterId(undefined);
      return;
    }

    isClosing.current = true;
    const duration = 380;
    const animation = modal.animate(
      [{ transform: 'none' }, { transform: getButtonOrigin(selectedMeterId, modal) }],
      { duration, easing: 'cubic-bezier(.2,.72,.22,1)', fill: 'both' },
    );
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'both' });
    try {
      await animation.finished;
    } catch {
      // The dialog can be unmounted while the browser finishes an animation.
    }
    setSelectedMeterId(undefined);
    isClosing.current = false;
  };

  useEffect(() => {
    if (!selectedMeterId) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void closeDetails();
    };
    window.addEventListener('keydown', onKeyDown);

    const modal = modalRef.current;
    const backdrop = backdropRef.current;
    if (modal && backdrop && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animation = modal.animate(
        [{ transform: getButtonOrigin(selectedMeterId, modal) }, { transform: 'none' }],
        { duration: 440, easing: 'cubic-bezier(.16,.78,.23,1)', fill: 'both' },
      );
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, fill: 'both' });
      void animation.finished.then(() => animation.cancel()).catch(() => undefined);
    }

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedMeterId]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setQuery(searchText.trim());
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <div className="workspace">
      <main className="main-panel" id="main-content">
        <header className="topbar">
          <a className="brand-lockup" href="#main-content" aria-label="Urja Grid Explorer home">
            <span className="brand-symbol" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none"><path d="M16 5 26 10.5v11L16 27 6 21.5v-11L16 5Z" /><path d="m6.5 10.8 9.5 5.4 9.5-5.4M16 16.2V27M11 8l10 5.6v5.8l-5 2.8-5-2.8v-5.8L21 8" /></svg>
            </span>
            <span><strong>Urja Grid</strong><small>FIELD DATA EXPLORER</small></span>
          </a>
          <div className="topbar-meta">
            <span className={`connection-status ${error ? 'connection-error' : ''}`}>
              <i aria-hidden="true" />
              {error ? 'Connection issue' : loading ? 'Loading data' : 'API connected'}
            </span>
            <span className="access-tag"><i aria-hidden="true" /> READ ONLY</span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-intro" id="directory">
            <div>
              <p className="overline">URJA METER OPERATIONS</p>
              <h1>Meter directory</h1>
              <p className="intro-copy">Find a meter, then follow its place in the distribution network.</p>
            </div>
            <div className="fleet-total" aria-label={`${pagination.total.toLocaleString()} meters in directory`}>
              <span className="fleet-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21" /></svg>
              </span>
              <span><strong>{pagination.total.toLocaleString()}</strong><small>meters in fleet</small></span>
            </div>
          </section>

          <form className="search-panel" onSubmit={submitSearch} role="search">
            <label className="search-field">
              <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.7" /><path d="m13 13 4 4" /></svg>
              <input
                type="search"
                aria-label="Search meter ID or serial number"
                placeholder="Search by meter ID or serial number"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <kbd>ENTER</kbd>
            </label>
            <button className="search-submit" type="submit">Search meters <span aria-hidden="true">↗</span></button>
          </form>

          <section className="directory-section" aria-labelledby="results-title">
            <div className="directory-heading">
              <div>
                <div className="title-row"><h2 id="results-title">Fleet records</h2><span className="record-chip">{loading ? 'Updating' : `${meters.length} shown`}</span></div>
                <p>{query ? <>Matching <strong>“{query}”</strong></> : 'Search and inspect individual meter records.'}</p>
              </div>
              <div className="page-indicator"><span>PAGE</span><strong>{pagination.page.toString().padStart(2, '0')}</strong><span>OF {totalPages.toString().padStart(2, '0')}</span></div>
            </div>

            {error && <div className="inline-alert" role="alert">{error}</div>}
            {loading ? (
              <div className="table-state" role="status"><span className="spinner" /> Loading meter records…</div>
            ) : (
              <MeterTable meters={meters} selectedMeterId={selectedMeterId} onSelectMeter={(meter) => setSelectedMeterId(meter.meterId)} />
            )}

            <footer className="table-footer">
              <span>Showing <strong>{meters.length ? ((pagination.page - 1) * pagination.pageSize) + 1 : 0}–{Math.min(pagination.page * pagination.pageSize, pagination.total)}</strong> of <strong>{pagination.total.toLocaleString()}</strong></span>
              <div className="pagination-controls" aria-label="Directory pages">
                <button type="button" onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} disabled={pagination.page <= 1 || loading} aria-label="Previous page">←</button>
                <span>{pagination.page} / {totalPages}</span>
                <button type="button" onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} disabled={pagination.page >= totalPages || loading} aria-label="Next page">→</button>
              </div>
            </footer>
          </section>

          <p className="data-caption"><span className="caption-dot" /> Results come from the Urja Meter Ops API. Detail views include the network path, coordinates, and recent readings.</p>
        </div>
      </main>

      {selectedMeterId && (
        <div className="modal-backdrop" ref={backdropRef} onMouseDown={() => void closeDetails()}>
          <div
            className="meter-dialog"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Meter ${selectedMeterId} details`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="dialog-close" type="button" onClick={() => void closeDetails()} aria-label="Close meter details" autoFocus>×</button>
            <MeterDetails meterId={selectedMeterId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
