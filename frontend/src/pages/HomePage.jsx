// guidHER Map page — full-screen zone safety map with guidHER brand overlay.
// Wraps the existing ZoneMap feature with guidHER UI chrome.
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import ZoneMap from '../features/map/ZoneMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FILTERS = ['Safety View', 'Transport View', 'Lighting View'];

export default function MapPage({ segments, latest, reports, selectedId, onSelect }) {
  const [activeFilter, setActiveFilter] = useState('Safety View');
  const { theme, toggleTheme } = useAuth();

  return (
    <div className="gh-map-wrap">
      {/* Map fills full area */}
      <ZoneMap
        segments={segments}
        latest={latest}
        reports={reports}
        selectedId={selectedId}
        onSelect={onSelect}
      />

      {/* guidHER branded overlay on top-left */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:500, pointerEvents:'none' }}>
        {/* Top brand bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', pointerEvents:'auto' }}>
          <div style={{
            background:'rgba(75,46,131,0.92)', backdropFilter:'blur(12px)',
            borderRadius:12, padding:'7px 14px',
            fontFamily:'Outfit, sans-serif', fontWeight:800, fontSize:18, color:'#fff',
            letterSpacing:'-0.3px', boxShadow:'0 2px 12px rgba(0,0,0,0.25)'
          }}>
            guid<span style={{ color:'#F28DBB' }}>HER</span>
          </div>

          <button
            id="btn-map-theme"
            onClick={toggleTheme}
            style={{
              pointerEvents:'auto', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)',
              border:'none', borderRadius:20, width:36, height:36, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)'
            }}
            aria-label="Toggle dark mode"
          >
            {theme==='dark' ? <Sun size={16} color="#4B2E83"/> : <Moon size={16} color="#4B2E83"/>}
          </button>
        </div>

        {/* Filter chips */}
        <div className="gh-map-filter-row" style={{ padding:'0 14px', pointerEvents:'auto' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              id={`filter-${f.toLowerCase().replace(/ /g,'-')}`}
              className={`gh-filter-chip ${activeFilter===f?'active':''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Zone label overlay — bottom right */}
      <div style={{
        position:'absolute', bottom:80, right:12, zIndex:500,
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(10px)',
        border:'1px solid rgba(75,46,131,0.15)', borderRadius:10, padding:'8px 12px',
        fontSize:11, color:'#4B2E83', fontWeight:600, fontFamily:'Outfit,sans-serif',
        boxShadow:'0 2px 10px rgba(0,0,0,0.12)', maxWidth:140
      }}>
        PUP Sta. Mesa Zone<br/>
        <span style={{ color:'#6B5F8A', fontWeight:400, fontSize:10 }}>Demo content only</span>
      </div>
    </div>
  );
}
