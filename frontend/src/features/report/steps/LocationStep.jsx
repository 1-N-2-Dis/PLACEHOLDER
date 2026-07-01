// Report form section: location (required) — pick from the segment list, or pin on the map.
// Both paths resolve to the same segmentId (see segmentSnap.js — a pin snaps to the nearest known
// segment; segments are point geometry, not roads, so this is the enforcement for "only on roads,
// not places/houses"). Traces to: docs/superpowers/specs/2026-07-01-report-wizard-frontend-design.md.
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import PinMap from '../PinMap.jsx';

function CustomDropdown({ segments, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSegment = segments.find(s => s.segmentId === value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button 
        type="button" 
        className="form-input" 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', width: '100%', background: 'var(--card)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: selectedSegment ? 'inherit' : 'var(--muted)' }}>
          <MapPin size={16} />
          {selectedSegment ? selectedSegment.name : "— choose a segment —"}
        </span>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: 220,
          overflowY: 'auto',
          zIndex: 50
        }}>
          {segments.map((s) => (
            <div 
              key={s.segmentId}
              onClick={() => {
                onChange(s.segmentId);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: value === s.segmentId ? 'var(--secondary)' : 'transparent',
                color: value === s.segmentId ? '#fff' : 'inherit',
                borderBottom: '1px solid var(--border)'
              }}
              onMouseEnter={(e) => { if(value !== s.segmentId) e.currentTarget.style.background = 'rgba(75, 46, 131, 0.08)' }}
              onMouseLeave={(e) => { if(value !== s.segmentId) e.currentTarget.style.background = 'transparent' }}
            >
              <MapPin size={14} style={{ opacity: value === s.segmentId ? 1 : 0.5 }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationStep({ segments, segmentId, onSelect }) {
  const [mode, setMode] = useState('list'); // 'list' | 'pin'

  return (
    <section className="report-step">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Where is this?</h2>

        <div className="location-mode-toggle" style={{ margin: 0, gap: 12 }}>
          <button type="button" className={`condition-btn${mode === 'list' ? ' condition-btn--selected' : ''}`} onClick={() => setMode('list')}>
            Choose from list
          </button>
          <button type="button" className={`condition-btn${mode === 'pin' ? ' condition-btn--selected' : ''}`} onClick={() => setMode('pin')}>
            Pin on map
          </button>
        </div>
      </div>

      {mode === 'list' ? (
        <div className="form-group">
          <label className="form-label">Segment</label>
          <CustomDropdown segments={segments} value={segmentId} onChange={onSelect} />
        </div>
      ) : (
        <>
          <div className="pin-map-wrap">
            <PinMap segments={segments} onSnap={(segment) => onSelect(segment.segmentId)} />
          </div>
          <p className="muted">Tap a spot near a mapped street to place your pin.</p>
        </>
      )}

      {segmentId && mode === 'pin' && (
        <p className="status-ok">Selected: {segments.find((s) => s.segmentId === segmentId)?.name}</p>
      )}
    </section>
  );
}
