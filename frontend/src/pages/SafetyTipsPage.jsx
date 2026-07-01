// guidHER Safety Tips — categorised tips + Owly tip of the day.
import { useState } from 'react';
import { Eye, Lightbulb, MapPin, RefreshCw, Train, Clock } from 'lucide-react';

function OwlySVG({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="36" cy="40" rx="24" ry="26" fill="#7D5CC7"/>
      <ellipse cx="36" cy="38" rx="20" ry="22" fill="#B69AD9"/>
      <circle cx="27" cy="34" r="9" fill="white"/><circle cx="45" cy="34" r="9" fill="white"/>
      <circle cx="27" cy="34" r="6" fill="#4B2E83"/><circle cx="45" cy="34" r="6" fill="#4B2E83"/>
      <circle cx="29" cy="32" r="2" fill="white"/><circle cx="47" cy="32" r="2" fill="white"/>
      <ellipse cx="36" cy="43" rx="6" ry="4" fill="#FFC857"/>
      <path d="M23 20 Q20 12 15 14 Q18 20 23 22Z" fill="#7D5CC7"/>
      <path d="M49 20 Q52 12 57 14 Q54 20 49 22Z" fill="#7D5CC7"/>
    </svg>
  );
}

const OWLY_TIPS = [
  'Two minutes with the zone map before you leave can change how the whole commute feels.',
  'Walking in the same direction as traffic keeps you visible and makes it easier for others to see you.',
  'A well-lit detour that adds three minutes is almost always worth it.',
  'If something feels off about a route, your instinct is data — trust it and flag it.',
  'Time your LRT trips: Pureza and Legarda stations are safest between 6–9 PM.',
  'Board full jeepneys when you can — especially late at night on Magsaysay.',
];

const CATEGORIES = [
  {
    id: 'before',
    label: 'Before you travel',
    Icon: Clock,
    color: '#EFE7F8',
    iconColor: '#4B2E83',
    tips: [
      { title: 'Check tonight\'s zone conditions', body: 'Open the Safety Map before you leave. Segment conditions can change hour to hour.' },
      { title: 'Plan your route in advance', body: 'Know which stops and streets you\'ll use. Having a plan means fewer decisions under pressure.' },
      { title: 'Inform someone you trust', body: 'Share your route and estimated arrival time. A 10-second text can matter a lot.' },
      { title: 'Choose your departure time wisely', body: 'Some segments are safer between 6–9 PM. The map shows freshness timestamps for every report.' },
    ],
  },
  {
    id: 'during',
    label: 'During travel',
    Icon: Eye,
    color: '#E4F5EC',
    iconColor: '#2e7d32',
    tips: [
      { title: 'Stay in well-lit areas', body: 'A two-minute detour through a lit street almost always beats the shortcut through a dark one.' },
      { title: 'Keep one ear free', body: 'Stay aware of your surroundings — headphones at one ear, phone in a front pocket.' },
      { title: 'Avoid isolated paths', body: 'If a route feels empty and unlit, it probably is. Trust the discomfort and take another way.' },
      { title: 'Board full jeepneys', body: 'Especially at night on Magsaysay — wait an extra few minutes for a fuller unit.' },
    ],
  },
  {
    id: 'situations',
    label: 'Handling situations',
    Icon: Lightbulb,
    color: '#FFF3D9',
    iconColor: '#f57f17',
    tips: [
      { title: 'Move toward crowded areas', body: 'If something feels wrong, head toward people — a market, a bus stop, a 24-hour store.' },
      { title: 'Make noise if needed', body: 'Loud, clear words like "Stop" or "I need help" draw attention quickly in crowded areas.' },
      { title: 'Use what\'s around you', body: 'Barangay tanods, security guards, and lit commercial entrances are all safe anchors.' },
      { title: 'Flag it on the map', body: 'Even after the fact, filing a report helps the next rider know what you experienced.' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport-specific',
    Icon: Train,
    color: '#FDEBF2',
    iconColor: '#c2185b',
    tips: [
      { title: 'Time your LRT trips', body: 'Pureza and Legarda stations are safest between 6–9 PM. The last few trains get quiet.' },
      { title: 'Use the main station exits', body: 'Side exits and underpasses around Pureza have had reports of poor lighting. Stick to the main flow.' },
      { title: 'SM Sta. Mesa is a safe transfer', body: 'The SM area near V. Mapa has good lighting and foot traffic — a reliable waiting spot.' },
      { title: 'P. Campa detour is a known safer path', body: 'Locals use this as a quieter but well-lit route around the main Recto drag.' },
    ],
  },
];

export default function SafetyTipsPage() {
  const [tipIdx, setTipIdx] = useState(0);

  function nextTip() {
    setTipIdx(i => (i + 1) % OWLY_TIPS.length);
  }

  return (
    <div className="page-scroll">
      <div className="page-scroll-inner">

        {/* Owly tip of the day */}
        <div className="owly-tip-card" style={{ marginBottom: 28 }}>
          <OwlySVG size={56} />
          <div className="owly-tip-text">
            <div className="label">Owly's tip of the day</div>
            <div className="tip">{OWLY_TIPS[tipIdx]}</div>
            <button
              className="btn btn-sm"
              style={{ marginTop: 12, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={nextTip}
            >
              <RefreshCw size={13} /> Next tip
            </button>
          </div>
        </div>

        {/* Tip categories */}
        {CATEGORIES.map(({ id, label, Icon, color, iconColor, tips }) => (
          <div key={id} className="tip-category">
            <div className="tip-category-title">
              <span style={{ width: 32, height: 32, borderRadius: 10, background: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={iconColor} />
              </span>
              {label}
            </div>
            <div className="tips-grid-v2">
              {tips.map(tip => (
                <div key={tip.title} className="tip-card-v2">
                  <div className="tip-title">{tip.title}</div>
                  <div className="tip-body">{tip.body}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer note — BR-002 compliant: no SOS/rescue copy */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '16px 18px', marginBottom: 32, fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          These tips are based on what riders in the Sta. Mesa zone actually share with each other.
          They describe observable conditions — lighting, crowds, routes — not crime labels.
          guidHER is a community awareness tool, not an emergency service.
        </div>

      </div>
    </div>
  );
}
