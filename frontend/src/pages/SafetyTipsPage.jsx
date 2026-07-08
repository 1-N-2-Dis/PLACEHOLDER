// guidHER Safety Tips - categorised tips + Owly tip of the day.
import { useState } from 'react';
import { Eye, Lightbulb, MapPin, RefreshCw, Train, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import Owly from '../components/Owly.jsx';
import { TriangleMesh, GradientBlobs } from '../components/BackgroundDecorations.jsx';

const OWLY_TIPS = [
  'Two minutes with the zone map before you leave can change how the whole commute feels.',
  'Walking in the same direction as traffic keeps you visible and makes it easier for others to see you.',
  'A well-lit detour that adds three minutes is almost always worth it.',
  'If something feels off about a route, your instinct is data, so trust it and flag it.',
  'Time your LRT trips: Pureza and Legarda stations are safest between 6 to 9 PM.',
  'Board full jeepneys when you can, especially late at night on Magsaysay.',
];

const CATEGORIES = [
  {
    id: 'before',
    label: 'Before you travel',
    Icon: Clock,
    iconClass: 'tip-cat-icon-before',
    iconColor: 'var(--primary)',
    tips: [
      { title: 'Check tonight\'s zone conditions', body: 'Open the Safety Map before you leave. Road conditions can change hour to hour.' },
      { title: 'Plan your route in advance', body: 'Know which stops and streets you\'ll use. Having a plan means fewer decisions under pressure.' },
      { title: 'Inform someone you trust', body: 'Share your route and estimated arrival time. A 10-second text can matter a lot.' },
      { title: 'Choose your departure time wisely', body: 'Some roads are safer between 6 to 9 PM. The map shows freshness timestamps for every report.' },
    ],
  },
  {
    id: 'during',
    label: 'During travel',
    Icon: Eye,
    iconClass: 'tip-cat-icon-during',
    iconColor: 'var(--sev-green-fg)',
    tips: [
      { title: 'Stay in well-lit areas', body: 'A two-minute detour through a lit street almost always beats the shortcut through a dark one.' },
      { title: 'Keep one ear free', body: 'Stay aware of your surroundings by keeping headphones at one ear and your phone in a front pocket.' },
      { title: 'Avoid isolated paths', body: 'If a route feels empty and unlit, it probably is. Trust the discomfort and take another way.' },
      { title: 'Board full jeepneys', body: 'Wait an extra few minutes for a fuller unit, especially at night on Magsaysay.' },
    ],
  },
  {
    id: 'situations',
    label: 'Handling situations',
    Icon: Lightbulb,
    iconClass: 'tip-cat-icon-situations',
    iconColor: 'var(--sev-yellow-fg)',
    tips: [
      { title: 'Move toward crowded areas', body: 'If something feels wrong, head toward people at a market, a bus stop, or a 24-hour store.' },
      { title: 'Make noise if needed', body: 'Loud, clear words like "Stop" or "I need help" draw attention quickly in crowded areas.' },
      { title: 'Use what\'s around you', body: 'Barangay tanods, security guards, and lit commercial entrances are all safe anchors.' },
      { title: 'Flag it on the map', body: 'Even after the fact, filing a report helps the next rider know what you experienced.' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport-specific',
    Icon: Train,
    iconClass: 'tip-cat-icon-transport',
    iconColor: 'var(--pink)',
    tips: [
      { title: 'Time your LRT trips', body: 'Pureza and Legarda stations are safest between 6 to 9 PM. The last few trains get quiet.' },
      { title: 'Use the main station exits', body: 'Side exits and underpasses around Pureza have had reports of poor lighting. Stick to the main flow.' },
      { title: 'SM Sta. Mesa is a safe transfer', body: 'The SM area near V. Mapa has good lighting and foot traffic, making it a reliable waiting spot.' },
      { title: 'P. Campa detour is a known safer path', body: 'Locals use this as a quieter but well-lit route around the main Recto drag.' },
    ],
  },
];

export default function SafetyTipsPage() {
  const [tipIdx, setTipIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

  function nextTip() {
    setTipIdx(i => (i + 1) % OWLY_TIPS.length);
  }

  return (
    <div className="page-scroll">
      {/* Background decorations */}
      <GradientBlobs opacity={0.4} variant="tips" />

      <div className="page-scroll-inner">

        {/* Tip categories */}
        <div className="tip-categories-accordion mb-24">
          {CATEGORIES.map(({ id, label, Icon, iconClass, iconColor, tips }) => {
            const isOpen = activeCategory === id;
            return (
              <div key={id} className="card" style={{ 
                padding: 0, 
                marginBottom: 12, 
                overflow: 'hidden',
                borderColor: isOpen ? iconColor : 'var(--line)',
                transition: 'all 0.3s ease'
              }}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setActiveCategory(isOpen ? null : id)}
                  style={{
                    width: '100%', border: 'none', font: 'inherit', textAlign: 'left',
                    padding: '16px',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    background: isOpen ? `color-mix(in srgb, ${iconColor} 8%, transparent)` : 'transparent',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <span className={`tip-cat-icon ${iconClass}`} style={{ margin: 0 }}>
                    <Icon size={18} color={iconColor} />
                  </span>
                  <span style={{ flex: 1, fontWeight: 700, color: isOpen ? iconColor : 'var(--ink)', transition: 'color 0.2s' }}>{label}</span>
                  <ChevronRight size={20} color={isOpen ? iconColor : 'var(--muted)'} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'all 0.3s ease' }} />
                </button>
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateRows: isOpen ? '1fr' : '0fr', 
                    transition: 'grid-template-rows 0.3s ease-out' 
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div className="tips-list" style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s ease-out', transitionDelay: isOpen ? '0.1s' : '0s' }}>
                      {tips.map(tip => (
                        <div
                          key={tip.title}
                          className="tip-item-modern"
                          style={{
                            '--tip-accent': iconColor,
                            display: 'flex',
                            gap: '14px',
                            alignItems: 'flex-start',
                            background: 'var(--bg)',
                            padding: '16px',
                            borderRadius: '16px',
                            border: '1px solid var(--line)',
                          }}
                        >
                          <div style={{ padding: '6px', background: 'var(--surface)', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
                            <CheckCircle2 size={18} color={iconColor} />
                          </div>
                          <div>
                            <div className="tip-title" style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px', letterSpacing: '-0.01em' }}>{tip.title}</div>
                            <div className="tip-body" style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.55 }}>{tip.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Owly tip of the day */}
        <div className="owly-tip-card" style={{ marginBottom: 28 }}>
          <div className="owly-tip-text">
            <div className="label">Owly's tip of the day</div>
            <div className="tip">{OWLY_TIPS[tipIdx]}</div>
            <button className="btn btn-sm btn-glass mt-12" onClick={nextTip}>
              <RefreshCw size={13} /> Next tip
            </button>
          </div>
          <div style={{ marginTop: -30, marginBottom: -30, marginRight: -10 }}>
            <Owly size={140} pose="protect" className="owly-shadow" />
          </div>
        </div>

        {/* Footer note */}
        <div className="tips-footnote mb-32">
          These tips are based on what riders in the Sta. Mesa zone actually share with each other.
          They describe observable conditions like lighting, crowds, and routes, not crime labels.
          GuidHer is a community awareness tool, not an emergency service.
        </div>

      </div>
    </div>
  );
}
