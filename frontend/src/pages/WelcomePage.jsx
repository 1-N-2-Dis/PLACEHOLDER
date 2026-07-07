// guidHER — public landing page + auth gate.
// Views: 'landing' | 'login' | 'signup'
// Safety Map removed. BR-001/002 compliant copy throughout.
import { useState, useEffect, useRef, useMemo } from 'react';
import { Users, User, Train, Footprints, ChevronRight, Moon, Sun, ArrowRight, Map, Route, Bot, Flag, ShieldAlert, Layers, BookOpen, Fingerprint, PhoneCall, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/authContext.jsx';
import { useTheme } from '../lib/theme.jsx';
import { initGoogleSignIn, cancelGoogleOneTap } from '../lib/googleOneTap.js';
import { subscribeReports } from '../lib/reports.js';
import { computeLandingStats } from '../lib/stats.js';
import Owly from '../components/Owly.jsx';
import BrandMark from '../components/BrandMark.jsx';
import CursorTrail from '../components/CursorTrail.jsx';
import useRevealOnScroll from '../lib/useRevealOnScroll.js';

// ── Static data ───────────────────────────────────────────────────────────────
const CAMPUSES = ['PUP Main Campus', 'PUP Sta. Mesa', 'Other'];
const COMMUTE_PREFS = [
  { id: 'lrt',     label: 'LRT commuter',    Icon: Train },
  { id: 'jeepney', label: 'Jeepney commuter', Icon: ChevronRight },
  { id: 'walking', label: 'Walking routes',   Icon: Footprints },
  { id: 'night',   label: 'Night commute',    Icon: Moon },
];

const FEATURES = [
  { icon: Map,         title: 'Zone Safety Map',       body: 'See every flagged road of the Sta. Mesa zone live. You can tap any flag for its condition, severity, and exact report time.' },
  { icon: Route,       title: 'Route Recommendations', body: 'Get a recommended route plus an alternative to your destination, scored by tonight\'s real reported conditions.' },
  { icon: Bot,         title: 'AI Route Check',        body: 'Ask "Is my route okay tonight?" and get a Gemini-written verdict grounded only in real reports near your path.' },
  { icon: Flag,        title: 'Community Reporting',   body: 'Flag poor lighting, thin crowds, or a recent incident, with a required note and an optional photo.' },
  { icon: ShieldAlert, title: 'Risk Summary',          body: 'A road with several reports gets a clean, deduplicated AI summary instead of a wall of raw notes.' },
  { icon: Layers,      title: 'Incident Heatmap',      body: 'Toggle glowing incident markers for validated reports to see where risk clusters across the zone at a glance.' },
  { icon: BookOpen,    title: 'Safety Tips',           body: 'Zone-specific guidance for before, during, and after your commute, including transport-specific advice.' },
  { icon: Fingerprint, title: 'Conditions-Only Data',  body: 'We describe observable states like lighting, crowds, and incidents. We never use crime labels or place ratings.' },
  { icon: PhoneCall,   title: 'Emergency Contacts',    body: 'Save trusted contacts on your profile so they\'re one tap away if you ever need them.' },
];

const ZONE_PREVIEW = [
  ['Teresa Street',    'red',    'Low light'],
  ['Pureza Station',   'yellow', 'Moderate'],
  ['Legarda approach', 'red',    'Low light'],
  ['Magsaysay Blvd',  'yellow', 'Half-empty units'],
  ['SM Sta. Mesa',     'green',  'Well-lit'],
];

// ── Brand wordmark ────────────────────────────────────────────────────────────
function BrandWordmark() {
  return <span className="brand-wordmark">Guid<span className="accent">Her</span></span>;
}

// ── Landing nav ───────────────────────────────────────────────────────────────
function LandingNav({ onLogin, onSignup, onProfile, loggedIn }) {
  const [hidden, setHidden] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let lastScroll = window.scrollY;
    
    function handleScroll() {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 80) {
        setHidden(true); // scrolling down
      } else {
        setHidden(false); // scrolling up
      }
      lastScroll = currentScroll;
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`landing-nav ${hidden ? 'nav-hidden' : ''}`}>
      <div className="landing-nav-inner">
        <div className="landing-nav-left">
          <div className="landing-nav-brand">
            <BrandMark size={34} />
            <BrandWordmark />
          </div>
          <nav className="desktop-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#community">Community</a>
          </nav>
        </div>
        <div className="landing-nav-actions">
          <button
            className="btn btn-ghost btn-sm nav-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {loggedIn ? (
            <button className="btn btn-primary btn-sm" onClick={onProfile}>
              <User size={16} /> My Profile
            </button>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onLogin}>Log In</button>
              <button className="btn btn-primary btn-sm" onClick={onSignup}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Google One Tap + button (shared by login/signup) ─────────────────────────
// Shows the One Tap prompt on mount and renders the official "Continue with Google" button.
// Renders nothing when VITE_GOOGLE_CLIENT_ID is unset or the GIS script is blocked.
function GoogleSignIn({ onDone, onError, onBusy, dividerPosition = 'before' }) {
  const { loginWithGoogle } = useAuth();
  const btnRef = useRef(null);
  const [available, setAvailable] = useState(false);
  // Keep latest callbacks without re-running the GIS init effect.
  const cbRef = useRef({ onDone, onError, onBusy });
  cbRef.current = { onDone, onError, onBusy };

  useEffect(() => {
    let active = true;
    initGoogleSignIn({
      buttonEl: btnRef.current,
      onIdToken: async (idToken) => {
        cbRef.current.onBusy(true);
        try {
          await loginWithGoogle(idToken);
          cbRef.current.onDone();
        } catch {
          cbRef.current.onError('Google sign-in did not complete. Please try again.');
        } finally {
          cbRef.current.onBusy(false);
        }
      },
    }).then((ok) => { if (active && ok) setAvailable(true); });
    return () => { active = false; cancelGoogleOneTap(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={available ? undefined : { display: 'none' }}>
      {dividerPosition === 'before' && <div className="auth-divider">or</div>}
      <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center' }} />
      {dividerPosition === 'after' && <div className="auth-divider">or</div>}
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginView({ onBack, onDone, onSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [typedMsg, setTypedMsg] = useState('');

  useEffect(() => {
    const msg = "Your route is waiting.";
    let typeTimer;

    const startTyping = () => {
      let i = 0;
      setTypedMsg('');
      clearInterval(typeTimer);
      typeTimer = setInterval(() => {
        setTypedMsg(msg.slice(0, i + 1));
        i++;
        if (i >= msg.length) clearInterval(typeTimer);
      }, 60);
    };

    startTyping();
    const resetTimer = setInterval(startTyping, 8000);

    return () => {
      clearInterval(typeTimer);
      clearInterval(resetTimer);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) { setErr('Please enter your email.'); return; }
    setBusy(true); setErr('');
    try { await login({ email, password }); onDone(); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-12px', marginBottom: '4px' }}>
          <BrandMark size={44} />
          <h2 className="auth-title" style={{ margin: 0, fontSize: '1.2rem' }}>Log in</h2>
        </div>
        <div className="auth-logo" style={{ marginTop: '-12px' }}>
          <div className="auth-logo-text">
            Guid<span className="text-pink">Her</span>
          </div>
          <div className="auth-logo-tagline">Wise. Watchful. With you.</div>
        </div>
        <div className="owly-wrap" style={{ marginTop: '-24px', marginBottom: '16px' }}>
          <Owly size={150} pose="welcome" className="owly-shadow" />
          <p className="owly-msg">
            Welcome back! {typedMsg}<span className="cursor-blink">|</span>
          </p>
        </div>
        <GoogleSignIn onDone={onDone} onError={setErr} onBusy={setBusy} dividerPosition="after" />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="l-email">Email</label>
            <input id="l-email" type="email" className="form-input" placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="l-pw">Password</label>
            <input id="l-pw" type={showPassword ? "text" : "password"} className="form-input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
              style={{ paddingRight: '40px' }} />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <span className="auth-link">Forgot password?</span>
          </div>
          {err && <p className="status-err" style={{ marginBottom: 12 }}>{err}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Log In'}
          </button>
        </form>
        <p className="auth-footer">No account? <span className="auth-link" onClick={onSignup}>Sign up</span></p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <span className="auth-link" style={{ fontSize: '0.8rem' }} onClick={onBack}>← Back to home</span>
        </p>
      </div>
    </div>
  );
}

// ── Signup form ───────────────────────────────────────────────────────────────
function SignupView({ onBack, onDone, onLogin }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', campus: 'PUP Main Campus', commutePrefs: [] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [typedMsg, setTypedMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const msg = "Let's get you set up for safer commutes.";
    let typeTimer;

    const startTyping = () => {
      let i = 0;
      setTypedMsg('');
      clearInterval(typeTimer);
      typeTimer = setInterval(() => {
        setTypedMsg(msg.slice(0, i + 1));
        i++;
        if (i >= msg.length) clearInterval(typeTimer);
      }, 60);
    };

    startTyping();
    const resetTimer = setInterval(startTyping, 15000);

    return () => {
      clearInterval(typeTimer);
      clearInterval(resetTimer);
    };
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function togglePref(id) {
    set('commutePrefs', form.commutePrefs.includes(id)
      ? form.commutePrefs.filter(p => p !== id)
      : [...form.commutePrefs, id]);
  }

  function nextStep(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    if (!form.email.trim()) { setErr('Email is required.'); return; }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match.'); return; }
    setErr(''); setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await register({ name: form.name, email: form.email, campus: form.campus, commutePrefs: form.commutePrefs }); onDone(); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-12px', marginBottom: '4px' }}>
          <BrandMark size={44} />
          {step === 1 && <h2 className="auth-title" style={{ margin: 0, fontSize: '1.2rem' }}>Create account</h2>}
        </div>
        <div className="auth-logo" style={{ marginTop: '-12px' }}>
          <div className="auth-logo-text">
            Guid<span className="text-pink">Her</span>
          </div>
          <div className="auth-logo-tagline">Wise. Watchful. With you.</div>
        </div>
        {step === 1 ? (
          <>
            <div className="owly-wrap" style={{ marginTop: '-24px', marginBottom: '16px' }}>
              <Owly size={150} pose="cheering" className="owly-shadow" />
              <p className="owly-msg" style={{ marginTop: '-8px' }}>
                {typedMsg}<span className="cursor-blink">|</span>
              </p>
            </div>
            <GoogleSignIn onDone={onDone} onError={setErr} onBusy={setBusy} dividerPosition="after" />
            <form onSubmit={nextStep}>
              <div className="form-group">
                <label className="form-label" htmlFor="su-name">Full name</label>
                <input id="su-name" type="text" className="form-input" placeholder="Maria Santos"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-email">Email</label>
                <input id="su-email" type="email" className="form-input" placeholder="santos@gmail.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="su-password" type={showPassword ? "text" : "password"} className="form-input" placeholder="Create password"
                    value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="su-confirm">Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input id="su-confirm" type={showConfirm ? "text" : "password"} className="form-input" placeholder="Repeat password"
                    value={form.confirm} onChange={e => set('confirm', e.target.value)} style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {err && <p className="status-err" style={{ marginBottom: 12 }}>{err}</p>}
              <button type="submit" className="btn btn-primary btn-full">
                Next: Commute preferences <ArrowRight size={16} />
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-title">How do you commute?</h2>
            <p className="auth-subtitle">Choose all that apply. We'll personalise your route view.</p>
            <form onSubmit={handleSubmit}>
              <div className="pref-chips" style={{ marginBottom: 24 }}>
                {COMMUTE_PREFS.map(({ id, label, Icon }) => (
                  <button type="button" key={id}
                    className={`pref-chip${form.commutePrefs.includes(id) ? ' selected' : ''}`}
                    onClick={() => togglePref(id)}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              {err && <p className="status-err" style={{ marginBottom: 12 }}>{err}</p>}
              <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Create Account'}
              </button>
              <button type="button" className="btn btn-ghost btn-full mt-12" onClick={() => setStep(1)}>Back</button>
            </form>
          </>
        )}
        <p className="auth-footer">
          Already have an account? <span className="auth-link" onClick={onLogin}>Log in</span>
        </p>
        <p style={{ textAlign: 'center', marginTop: 6 }}>
          <span className="auth-link" style={{ fontSize: '0.8rem' }} onClick={onBack}>← Back to home</span>
        </p>
      </div>
    </div>
  );
}

// ── Full landing page ─────────────────────────────────────────────────────────
function LandingPage({ onLogin, onSignup, onProfile, loggedIn, onGuest, guestBusy }) {
  const heroRef = useRevealOnScroll();
  const featuresRef = useRevealOnScroll();
  const howItWorksRef = useRevealOnScroll();
  const zonePreviewRef = useRevealOnScroll();
  const communityRef = useRevealOnScroll();

  const [reports, setReports] = useState([]);
  useEffect(() => subscribeReports(setReports), []);
  const stats = useMemo(() => computeLandingStats(reports), [reports]);

  return (
    <div className="landing">
      <CursorTrail />
      <div className="landing-bg-abstracts">
        <div className="landing-bg-grid" />
        <div className="landing-blob blob-1" />
        <div className="landing-blob blob-2" />
        <div className="landing-blob blob-3" />
      </div>
      <LandingNav onLogin={onLogin} onSignup={onSignup} onProfile={onProfile} loggedIn={loggedIn} />

      {/* ── Hero ── */}
      <section className="hero-section" id="home" ref={heroRef}>
        <div className="hero-text-center fade-up">
          <span className="eyebrow">Sta. Mesa commute zone · PUP</span>
          <h1 className="hero-h1">
            Know your route.<br /><span className="accent">Own</span> your night.
          </h1>
          <p className="hero-lead">
            PUP women already share safety knowledge about which street, which exit, and which hour to use. 
            GuidHer structures those insights into a tool you can check before you even leave.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={onSignup}>
              <Users size={18} /> Join GuidHer
            </button>
            <button className="btn btn-secondary btn-lg" onClick={onGuest} disabled={guestBusy}>
              {guestBusy ? <span className="spinner" /> : <><Map size={18} /> View Safety Map</>}
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><b>{stats.reportsThisMonth.toLocaleString()}</b><span>reports this month</span></div>
            <div className="hero-stat"><b>{stats.segmentsTracked.toLocaleString()}</b><span>zone roads tracked</span></div>
            <div className="hero-stat"><b>{stats.communityMembers.toLocaleString()}</b><span>community members</span></div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-section land-band-tint" id="features" ref={featuresRef}>
        <div className="land-section-inner">
          <div className="land-section-head">
            <span className="land-tag">What GuidHer does</span>
            <h2 className="land-h2">Everything you need for a safer commute</h2>
            <p className="land-lead">Built around what riders actually need. This is not a crime dashboard or an emergency hotline, but a tool for clear, actionable commute conditions.</p>
          </div>
          <div className="feature-carousel-container">
            <div className="feature-carousel-track">
              {FEATURES.map(({ title, body, icon: Icon }) => (
                <div key={title} className="feature-card-v2">
                  <div className="feature-card-v2-icon">
                    <Icon size={24} />
                  </div>
                  <div className="feature-card-v2-title">{title}</div>
                  <p className="feature-card-v2-body">{body}</p>
                </div>
              ))}
            </div>
            <div className="feature-carousel-track" aria-hidden="true">
              {FEATURES.map(({ title, body, icon: Icon }) => (
                <div key={title} className="feature-card-v2">
                  <div className="feature-card-v2-icon">
                    <Icon size={24} />
                  </div>
                  <div className="feature-card-v2-title">{title}</div>
                  <p className="feature-card-v2-body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="land-section" id="how-it-works" ref={howItWorksRef}>
        <div className="land-section-inner">
          <div className="land-section-head">
            <h2 className="land-h2">Three steps to a safer commute</h2>
            <p className="land-lead">GuidHer is built around the commute decision moment. It is not a realtime tracker or an SOS tool, but a way to check clear conditions before you leave.</p>
          </div>
          <div className="how-it-works-grid">
            {[
              { n: '01', title: 'Check tonight\'s conditions', body: 'See what riders flagged on each road of the Sta. Mesa zone, including lighting, crowd levels, and recent incidents.' },
              { n: '02', title: 'Pick your safest route',       body: 'Routes are ranked by condition scores. Choose the one that avoids flagged roads, or the most direct if all is clear.' },
              { n: '03', title: 'Share what you notice',        body: 'See something off on your commute? Flag it in 20 seconds. Your report helps the next rider make a better call.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="feature-card step-card">
                <div className="step-number">{n}</div>
                <div className="feature-title">{title}</div>
                <p className="feature-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Zone overview preview (no interactive map — just static data) ── */}
      <section className="land-section land-band-tint" id="zone-preview" ref={zonePreviewRef}>
        <div className="land-section-inner">
          <div className="zone-preview-grid">
            <div>
              <h2 className="land-h2">See what riders are saying right now</h2>
              <p className="land-lead" style={{ marginBottom: 20 }}>
                Conditions are submitted by commuters in the zone. Every flag describes an observable state like lighting, crowd level, or a recent incident, but never a crime label.
              </p>
              <button className="btn btn-primary" onClick={onSignup}>
                <ArrowRight size={16} /> Sign up to see full conditions
              </button>
            </div>
            <div className="card zone-preview-card">
              <div className="zone-preview-head">
                <div className="zone-preview-title-row">
                  <span className="live-pulse-dot" aria-hidden="true" />
                  <div className="zone-preview-title">Zone overview tonight</div>
                </div>
                <div className="zone-preview-head-sub">Sta. Mesa commute zone</div>
              </div>
              {ZONE_PREVIEW.map(([loc, level, label]) => (
                <div key={loc} className="zone-preview-row">
                  <span>{loc}</span>
                  <span className={`status-badge badge-${level}`}>{label}</span>
                </div>
              ))}
              <div className="zone-preview-foot">
                Conditions only. No crime labels (BR-001)
              </div>
            </div>
          </div>
        </div>
        
        {/* ── Community CTA ── */}
        <div className="land-section-inner" id="community" ref={communityRef} style={{ marginTop: 160 }}>
          <div className="cta-banner">
            <div>
              <h3>Built by students navigating this exact commute, for the next one behind them.</h3>
              <p>Join GuidHer. Your reports become someone else's peace of mind on the walk home.</p>
              <div className="cta-actions">
                <button className="btn btn-gold" onClick={onSignup}>
                  <Users size={16} /> Join the community
                </button>
                <button className="btn btn-cta-ghost" onClick={onLogin}>
                  Already a member? Log in
                </button>
              </div>
            </div>
            <div className="cta-owly">
              <Owly size={320} pose="shareandhelp" className="owly-flipped" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-foot-grid">
            <div className="land-foot-brand">
              <div className="land-foot-brand-row">
                <BrandMark size={30} />
                <BrandWordmark />
              </div>
              <p>Wise. Watchful. With you. A safer-commute guide for women navigating the Sta. Mesa zone.</p>
            </div>
            <div className="land-foot-cols">
              <div className="land-foot-col">
                <h5>Platform</h5>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#community">Community</a>
              </div>
              <div className="land-foot-col">
                <h5>Legal</h5>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact us</a>
              </div>
            </div>
          </div>
          <div className="land-foot-bottom">
            <span>© 2026 GuidHer prototype for the Sta. Mesa commute zone</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function WelcomePage({ onEnter, onEnterProfile }) {
  const [view, setView] = useState('landing');
  const [guestBusy, setGuestBusy] = useState(false);
  const { login, user } = useAuth();

  useEffect(() => {
    function handleMouseMove(e) {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${-x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${-y}px`);
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function handleGuest() {
    setGuestBusy(true);
    try {
      await login({ email: 'guest@guidher.app' });
      onEnter('/map');
    } finally {
      setGuestBusy(false);
    }
  }

  if (view === 'login')  return <LoginView  onBack={() => setView('landing')} onDone={onEnter} onSignup={() => setView('signup')} />;
  if (view === 'signup') return <SignupView onBack={() => setView('landing')} onDone={onEnter} onLogin={() => setView('login')} />;
  return (
    <LandingPage
      onLogin={() => setView('login')}
      onSignup={() => setView('signup')}
      onProfile={onEnterProfile}
      loggedIn={!!user}
      onGuest={handleGuest}
      guestBusy={guestBusy}
    />
  );
}
