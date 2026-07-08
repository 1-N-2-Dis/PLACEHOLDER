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
    description: 'Prepare before leaving home. Learn how to plan safer routes, check reports, and avoid risky areas.',
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
    description: 'Stay alert while commuting. Discover habits that help you stay aware and react quickly.',
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
    description: 'Know what to do during emergencies. Step-by-step guidance for harassment, theft, and unsafe encounters.',
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
    description: 'Safety advice for every commute. Learn best practices for LRT, MRT, jeepneys, buses, tricycles, and ride-hailing.',
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
  const [isAnimating, setIsAnimating] = useState(false);

  function nextTip() {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setTipIdx(i => (i + 1) % OWLY_TIPS.length);
      setIsAnimating(false);
    }, 500); // Wait for CSS animation to finish
  }

  const currentTip = OWLY_TIPS[tipIdx];
  const nextTipText = OWLY_TIPS[(tipIdx + 1) % OWLY_TIPS.length];

  return (
    <div className="page-scroll">
      {/* Background decorations */}
      <GradientBlobs opacity={0.4} variant="tips" />

      <div className="page-scroll-inner">

        {/* Featured Owly Tip Card Deck */}
        <div className={`featured-tip-deck-container mb-32 ${isAnimating ? 'is-animating' : ''}`}>
          
          {/* Bottom Card (Next Tip Preview) */}
          <div className="featured-tip-card card-bottom" aria-hidden="true">
            <GradientBlobs opacity={0.6} variant="tips" />
            <TriangleMesh />
            <div className="featured-tip-content">
              <div className="featured-tip-header">
                <span className="featured-tip-badge">Tip {((tipIdx + 1) % OWLY_TIPS.length) + 1} of {OWLY_TIPS.length}</span>
              </div>
              <h2 className="featured-tip-title">GuidHer Safety Tip</h2>
              <p className="featured-tip-text">{nextTipText}</p>
              <button className="btn featured-tip-btn mt-16" disabled tabIndex="-1">
                Next Tip <ChevronRight size={16} />
              </button>
            </div>
            <div className="featured-tip-owly">
              <Owly size={160} pose="protect" className="owly-shadow" />
            </div>
          </div>

          {/* Top Card (Current Tip) */}
          <div className="featured-tip-card card-top">
            <GradientBlobs opacity={0.6} variant="tips" />
            <TriangleMesh />
            <div className="featured-tip-content">
              <div className="featured-tip-header">
                <span className="featured-tip-badge">Tip {tipIdx + 1} of {OWLY_TIPS.length}</span>
              </div>
              <h2 className="featured-tip-title">GuidHer Safety Tip</h2>
              <p className="featured-tip-text">{currentTip}</p>
              <button className="btn featured-tip-btn mt-16" onClick={nextTip} disabled={isAnimating}>
                Next Tip <ChevronRight size={16} />
              </button>
            </div>
            <div className="featured-tip-owly">
              <Owly size={160} pose="protect" className="owly-shadow" />
            </div>
          </div>

        </div>

        {/* Tip Categories Cards */}
        <div className="tip-categories-grid mb-32">
          {CATEGORIES.map(({ id, label, description, Icon, iconClass, iconColor, tips }) => {
            const isOpen = activeCategory === id;
            return (
              <div key={id} className={`tip-category-card ${isOpen ? 'open' : ''}`} style={{ '--cat-color': iconColor }}>
                <div 
                  className="tip-category-header" 
                  onClick={() => setActiveCategory(isOpen ? null : id)}
                  role="button"
                  aria-expanded={isOpen}
                >
                  <div className="tip-category-header-top">
                    <span className={`tip-cat-icon ${iconClass}`}>
                      <Icon size={24} color={iconColor} />
                    </span>
                    <span className="tip-cat-badge">{tips.length} Tips</span>
                  </div>
                  <h3 className="tip-cat-title">{label}</h3>
                  <p className="tip-cat-desc">{description}</p>
                  <div className="tip-cat-cta">
                    {isOpen ? 'Close Guide' : 'Read Guide'} <ChevronRight size={16} className="tip-cat-chevron" />
                  </div>
                </div>

                <div className="tip-category-content-wrapper" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="tip-category-content-inner">
                    <div className="tips-list">
                      {tips.map(tip => (
                        <div key={tip.title} className="tip-item-modern">
                          <div className="tip-item-icon">
                            <CheckCircle2 size={18} color={iconColor} />
                          </div>
                          <div>
                            <div className="tip-title">{tip.title}</div>
                            <div className="tip-body">{tip.body}</div>
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
