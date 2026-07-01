// Sign up screen — guidHER.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Owly from '../../components/Owly.jsx';
import { signUp } from '../../lib/mockAuth.js';
import { useAuth } from '../../context/AuthContext.jsx';

const CAMPUSES = ['PUP Main Campus', 'PUP Sta. Mesa', 'Other'];
const PREFS = [
  { id:'lrt', label:'LRT Commuter' },
  { id:'jeepney', label:'Jeepney Commuter' },
  { id:'walking', label:'Walking Routes' },
  { id:'night', label:'Night Commute' },
];

export default function SignupPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1=account, 2=prefs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [campus, setCampus] = useState('PUP Main Campus');
  const [prefs, setPrefs] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function togglePref(id) {
    setPrefs(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  }

  function validateStep1() {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.includes('@')) return 'Please enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit() {
    setBusy(true); setError('');
    try {
      const user = await signUp({ name, email, password, campus, commutePrefs: prefs });
      login(user);
      nav('/app');
    } catch {
      setError('Could not create account. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <div className="gh-auth-wrap">
      <div className="gh-auth-top">
        <button className="gh-icon-btn" style={{ alignSelf:'flex-start', background:'rgba(255,255,255,0.2)', color:'#fff', marginBottom:16 }} onClick={() => step===1 ? nav('/') : setStep(1)}>
          <ArrowLeft size={18}/>
        </button>
        <Owly size={80} className="gh-owly" />
        <p className="gh-auth-tagline">Join the community. Share the knowledge.</p>
      </div>

      <div className="gh-auth-bottom gh-slide-up">
        <div className="gh-wizard-steps" style={{ marginBottom:20 }}>
          <div className={`gh-wizard-step ${step>=1?'done':''} ${step===1?'active':''}`}/>
          <div className={`gh-wizard-step ${step>=2?'done':''} ${step===2?'active':''}`}/>
        </div>

        {error && <div className="gh-auth-error gh-mt-8">{error}</div>}

        {step === 1 && (
          <>
            <h2 className="gh-auth-title">Create Account</h2>
            <p className="gh-auth-sub">Step 1 of 2 — Your details</p>
            <div className="gh-auth-form">
              <div className="gh-field">
                <label className="gh-label" htmlFor="su-name">Full Name</label>
                <input id="su-name" className="gh-input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="su-email">Email</label>
                <input id="su-email" className="gh-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="su-pw">Password</label>
                <div style={{ position:'relative' }}>
                  <input id="su-pw" className="gh-input" type={showPw?'text':'password'} placeholder="At least 6 characters" value={password} onChange={e=>setPassword(e.target.value)} style={{ paddingRight:44 }}/>
                  <button type="button" className="gh-icon-btn" style={{ position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',width:32,height:32,background:'transparent' }} onClick={()=>setShowPw(v=>!v)}>
                    {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="su-confirm">Confirm Password</label>
                <input id="su-confirm" className="gh-input" type="password" placeholder="Re-enter password" value={confirm} onChange={e=>setConfirm(e.target.value)}/>
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="su-campus">Campus</label>
                <select id="su-campus" className="gh-input gh-select" value={campus} onChange={e=>setCampus(e.target.value)}>
                  {CAMPUSES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <button id="btn-signup-next" className="gh-btn gh-btn-primary gh-mt-8" onClick={() => { const err=validateStep1(); if(err){setError(err);return;} setError(''); setStep(2); }}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="gh-auth-title">Your Commute</h2>
            <p className="gh-auth-sub">Step 2 of 2 — How do you travel?</p>
            <div className="gh-gap">
              <div className="gh-condition-grid">
                {PREFS.map(p=>(
                  <button key={p.id} id={`pref-${p.id}`} className={`gh-condition-btn ${prefs.includes(p.id)?'selected':''}`} onClick={()=>togglePref(p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button id="btn-signup-submit" className="gh-btn gh-btn-primary gh-mt-8" disabled={busy} onClick={handleSubmit}>
                {busy ? <span className="gh-spinner"/> : 'Create My Account'}
              </button>
              <button className="gh-btn gh-btn-ghost gh-btn-sm" onClick={handleSubmit}>
                Skip for now
              </button>
            </div>
          </>
        )}

        <p className="gh-auth-divider gh-mt-16">
          Already have an account?{' '}
          <span className="gh-auth-link" onClick={()=>nav('/login')}>Log in</span>
        </p>
      </div>
    </div>
  );
}
