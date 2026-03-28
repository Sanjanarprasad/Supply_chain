import React, { useState, useEffect } from 'react';
import './styles.css';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import { DEMO_BATCHES, generateBatchId } from './data';

// ── Empty form state ──────────────────────────────────────────
const EMPTY_FORM = {
  crop: '', farmer: '', village: '', district: '',
  state: '', harvestDate: '', method: 'Organic',
  quantity: '', unit: 'kg', notes: '',
};

export default function App() {
  const [tab, setTab] = useState('farmer');
  const [form, setForm] = useState(EMPTY_FORM);
  const [batches, setBatches] = useState(DEMO_BATCHES);
  const [generated, setGenerated] = useState(null);

  // Scan tab state
  const [showCamera, setShowCamera] = useState(false);
  const [manualId, setManualId] = useState('');
  const [scanned, setScanned] = useState(null);
  const [scanError, setScanError] = useState('');

  // Toast
  const [toast, setToast] = useState({ msg: '', type: 'ok' });

  // ── Check if app was opened via QR scan (URL has ?scan=...) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanParam = params.get('scan');
    if (scanParam) {
      setTab('scan');
      lookupBatch(scanParam);
    }
  }, []); // eslint-disable-line

  // ── Helpers ──────────────────────────────────────────────────
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 2800);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const lookupBatch = (id) => {
    const found = batches.find(
      b => b.id.toUpperCase() === id.toUpperCase().trim()
    );
    if (found) {
      setScanned(found);
      setScanError('');
      setShowCamera(false);
    } else {
      setScanError(`No batch found for ID "${id.toUpperCase().trim()}". Check the ID and try again.`);
      setScanned(null);
    }
  };

  // ── Farmer submit ─────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.crop || !form.farmer || !form.village || !form.harvestDate) {
      showToast('Please fill in all required fields (*)', 'error');
      return;
    }
    const id = generateBatchId();
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const harvestFormatted = new Date(form.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const batch = {
      ...form, id,
      events: [
        { event: 'Harvested at farm', date: harvestFormatted },
        { event: 'Registered on FarmTrace', date: today },
      ],
    };
    setBatches(prev => [batch, ...prev]);
    setGenerated(batch);
    showToast('Batch registered! QR code ready.');
  };

  // ── QR Camera scan success ────────────────────────────────────
  const handleCameraScan = (batchId) => {
    setShowCamera(false);
    lookupBatch(batchId);
  };

  // ── Manual ID lookup ──────────────────────────────────────────
  const handleManualLookup = () => {
    if (!manualId.trim()) { setScanError('Please enter a batch ID.'); return; }
    lookupBatch(manualId);
  };

  // ── Reset scan tab ────────────────────────────────────────────
  const resetScan = () => {
    setScanned(null);
    setScanError('');
    setManualId('');
    setShowCamera(false);
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="app">

      {/* Header */}
      <div className="header">
        <div>
          <div className="logo">Farm<span>Trace</span></div>
          <div className="header-sub">Agricultural Provenance System</div>
        </div>
        <div className="header-right">
          <div>REVA University</div>
          <div>AIDS — Sem VI</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button className={`tab ${tab === 'farmer' ? 'active' : ''}`}
          onClick={() => { setTab('farmer'); setGenerated(null); }}>
          🌾 Farmer
        </button>
        <button className={`tab ${tab === 'batches' ? 'active' : ''}`}
          onClick={() => setTab('batches')}>
          📋 Batches
        </button>
        <button className={`tab ${tab === 'scan' ? 'active' : ''}`}
          onClick={() => { setTab('scan'); resetScan(); }}>
          📱 Scan QR
        </button>
      </div>

      <div className="content">

        {/* ══════════════════════════════════════════
            TAB 1 — FARMER REGISTRATION
        ══════════════════════════════════════════ */}
        {tab === 'farmer' && !generated && (
          <>
            <div className="section-title">Register a batch</div>
            <div className="section-sub">Fill in your produce details to generate a QR code</div>
            <div className="card">
              <div className="row">
                <div className="field-group">
                  <label className="field-label">Crop name *</label>
                  <input className="field-input" placeholder="e.g. Cherry Tomato"
                    value={form.crop} onChange={e => set('crop', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Farmer name *</label>
                  <input className="field-input" placeholder="Your full name"
                    value={form.farmer} onChange={e => set('farmer', e.target.value)} />
                </div>
              </div>
              <div className="row">
                <div className="field-group">
                  <label className="field-label">Village *</label>
                  <input className="field-input" placeholder="Village name"
                    value={form.village} onChange={e => set('village', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">District</label>
                  <input className="field-input" placeholder="District"
                    value={form.district} onChange={e => set('district', e.target.value)} />
                </div>
              </div>
              <div className="row">
                <div className="field-group">
                  <label className="field-label">State</label>
                  <input className="field-input" placeholder="State"
                    value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Harvest date *</label>
                  <input className="field-input" type="date"
                    value={form.harvestDate} onChange={e => set('harvestDate', e.target.value)} />
                </div>
              </div>
              <div className="row">
                <div className="field-group">
                  <label className="field-label">Farming method</label>
                  <select className="field-input field-select"
                    value={form.method} onChange={e => set('method', e.target.value)}>
                    <option>Organic</option>
                    <option>Conventional</option>
                    <option>Natural farming</option>
                    <option>Integrated</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Quantity</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="field-input" placeholder="e.g. 200"
                      value={form.quantity} onChange={e => set('quantity', e.target.value)}
                      style={{ flex: 2 }} />
                    <select className="field-input field-select"
                      value={form.unit} onChange={e => set('unit', e.target.value)}
                      style={{ flex: 1 }}>
                      <option>kg</option>
                      <option>quintal</option>
                      <option>ton</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Notes (optional)</label>
                <input className="field-input"
                  placeholder="e.g. No pesticides, drip irrigation used"
                  value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              <button className="btn-primary" onClick={handleSubmit}>
                Generate QR Code →
              </button>
            </div>
          </>
        )}

        {/* QR Generated screen */}
        {tab === 'farmer' && generated && (
          <>
            <div className="section-title">QR Code ready! ✓</div>
            <div className="section-sub">Screenshot or print this. Attach it to your produce.</div>
            <div className="qr-result">
              <div className="qr-box">
                <QRGenerator batchId={generated.id} size={160} />
              </div>
              <br />
              <div className="qr-id">{generated.id}</div>
              <div className="qr-label">{generated.crop}</div>
              <div className="qr-sublabel">
                {generated.farmer} · {generated.village}
                {generated.district ? `, ${generated.district}` : ''}
              </div>
              <div className="btn-row">
                <button className="btn-secondary" onClick={() => {
                  setGenerated(null);
                  setForm(EMPTY_FORM);
                }}>
                  + Register another
                </button>
                <button className="btn-secondary" onClick={() => {
                  setManualId(generated.id);
                  lookupBatch(generated.id);
                  setTab('scan');
                }}>
                  Preview buyer view
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB 2 — ALL BATCHES
        ══════════════════════════════════════════ */}
        {tab === 'batches' && (
          <>
            <div className="section-title">All batches</div>
            <div className="section-sub">{batches.length} batches registered</div>
            {batches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🌾</div>
                <div>No batches yet. Register one from the Farmer tab.</div>
              </div>
            ) : batches.map(b => (
              <div className="batch-item" key={b.id} onClick={() => {
                setManualId(b.id);
                lookupBatch(b.id);
                setTab('scan');
              }}>
                <div>
                  <div className="batch-crop">{b.crop}</div>
                  <div className="batch-meta">
                    {b.farmer} · {b.village}{b.district ? `, ${b.district}` : ''} · {b.harvestDate}
                  </div>
                  <div className="batch-meta" style={{ fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
                    {b.id}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <span className={`badge ${b.method === 'Organic' || b.method === 'Natural farming' ? 'badge-organic' : 'badge-conv'}`}>
                    {b.method}
                  </span>
                  {b.quantity && (
                    <span style={{ fontSize: 11, color: '#7A5C3A' }}>{b.quantity} {b.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB 3 — SCAN / BUYER VIEW
        ══════════════════════════════════════════ */}
        {tab === 'scan' && !scanned && (
          <div className="scan-area">
            <div className="scan-icon-big">📱</div>
            <div className="scan-title">Scan a QR Code</div>
            <div className="scan-sub">Use your camera or enter the batch ID manually</div>

            {/* Camera Scanner */}
            {!showCamera ? (
              <button className="btn-primary" style={{ maxWidth: 280, margin: '0 auto 16px' }}
                onClick={() => { setShowCamera(true); setScanError(''); }}>
                📷 Open Camera Scanner
              </button>
            ) : (
              <div style={{ maxWidth: 340, margin: '0 auto' }}>
                <QRScanner
                  onScan={handleCameraScan}
                  onError={(msg) => { setScanError(msg); setShowCamera(false); }}
                />
                <button className="btn-secondary" style={{ width: '100%', marginBottom: 12 }}
                  onClick={() => setShowCamera(false)}>
                  ✕ Close Camera
                </button>
              </div>
            )}

            <div className="divider-or">OR</div>

            {/* Manual ID entry */}
            <div className="manual-input-row">
              <input
                className="field-input"
                placeholder="Enter Batch ID (e.g. FT-K9MX2A)"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
              />
              <button className="btn-primary" onClick={handleManualLookup}>
                View
              </button>
            </div>

            {scanError && (
              <p style={{ color: '#C0392B', fontSize: 12, marginTop: 10 }}>{scanError}</p>
            )}

            <p className="demo-hint">
              Try demo IDs: <code>FT-K9MX2A</code> · <code>FT-P3TZ8B</code> · <code>FT-M7RQ4C</code>
            </p>
          </div>
        )}

        {/* Product detail card — shown after scan */}
        {tab === 'scan' && scanned && (
          <>
            <button className="btn-secondary" style={{ marginBottom: 18 }} onClick={resetScan}>
              ← Scan another
            </button>
            <div className="product-card">
              <div className="product-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="product-crop">{scanned.crop}</div>
                    <div className="product-farmer">Grown by {scanned.farmer}</div>
                  </div>
                  <QRGenerator batchId={scanned.id} size={64} />
                </div>
              </div>
              <div className="product-body">
                <div className="info-grid">
                  <div className="info-tile">
                    <div className="info-tile-label">Origin</div>
                    <div className="info-tile-value">
                      {scanned.village}{scanned.district ? `, ${scanned.district}` : ''}
                    </div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Harvest date</div>
                    <div className="info-tile-value">{scanned.harvestDate}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Farming method</div>
                    <div className="info-tile-value">{scanned.method}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Batch qty</div>
                    <div className="info-tile-value">
                      {scanned.quantity ? `${scanned.quantity} ${scanned.unit}` : '—'}
                    </div>
                  </div>
                  {scanned.state && (
                    <div className="info-tile">
                      <div className="info-tile-label">State</div>
                      <div className="info-tile-value">{scanned.state}</div>
                    </div>
                  )}
                  <div className="info-tile">
                    <div className="info-tile-label">Batch ID</div>
                    <div className="info-tile-value" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {scanned.id}
                    </div>
                  </div>
                </div>

                {scanned.notes ? (
                  <div style={{
                    background: '#FAF6EF', border: '1px solid #E0D8CC',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 18,
                  }}>
                    <div className="info-tile-label">Farmer notes</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{scanned.notes}</div>
                  </div>
                ) : null}

                <div style={{ fontWeight: 500, fontSize: 12, color: '#7A5C3A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                  Product journey
                </div>
                <div className="timeline">
                  {scanned.events.map((ev, i) => (
                    <div className="timeline-item" key={i}>
                      <div className="timeline-dot" />
                      <div className="timeline-event">{ev.event}</div>
                      <div className="timeline-date">{ev.date}</div>
                    </div>
                  ))}
                </div>

                <div className="trust-bar">
                  <span style={{ fontSize: 22 }}>✓</span>
                  <div>
                    <div className="trust-text">Verified by FarmTrace</div>
                    <div className="trust-sub">Recorded at source by the farmer</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Toast notification */}
      {toast.msg && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
