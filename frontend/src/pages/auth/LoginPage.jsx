// Login screen — guidHER.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Owly from '../../components/Owly.jsx';
import { signIn } from '../../lib/mockAuth.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setBusy(true); setError('');
    try {
      const user = await signIn({ email, password });
      login(user);
      nav('/app');
    } catch (err) {
      setError('Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gh-auth-wrap">
      <div className="gh-auth-top">
        <button className="gh-icon-btn" style={{ alignSelf:'flex-start', background:'rgba(255,255,255,0.2)', color:'#fff', marginBottom:16 }} onClick={() => nav('/')}>
          <ArrowLeft size={18}/>
        </button>
        <Owly size={90} className="gh-owly" />
        <p className="gh-auth-tagline">Welcome back. Your route is waiting.</p>
      </div>

      <div className="gh-auth-bottom gh-slide-up">
        <h2 className="gh-auth-title">Log In</h2>
        <p className="gh-auth-sub">Sign in to your guidHER account</p>

        {error && <div className="gh-auth-error gh-mt-8">{error}</div>}

        <form className="gh-auth-form" onSubmit={handleSubmit}>
          <div className="gh-field">
            <label className="gh-label" htmlFor="login-email">Email</label>
            <input id="login-email" className="gh-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="gh-field">
            <label className="gh-label" htmlFor="login-password">Password</label>
            <div style={{ position:'relative' }}>
              <input id="login-password" className="gh-input" type={showPw?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={{ paddingRight:44 }} />
              <button type="button" className="gh-icon-btn" style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', width:32, height:32, background:'transparent' }} onClick={() => setShowPw(v=>!v)}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div className="gh-row" style={{ justifyContent:'space-between' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember me
            </label>
            <span className="gh-auth-link gh-text-sm">Forgot password?</span>
          </div>
          <button id="btn-login-submit" className="gh-btn gh-btn-primary gh-mt-8" type="submit" disabled={busy}>
            {busy ? <span className="gh-spinner"/> : 'Log In'}
          </button>
        </form>

        <p className="gh-auth-divider gh-mt-16">
          Don't have an account?{' '}
          <span className="gh-auth-link" onClick={() => nav('/signup')}>Sign up</span>
        </p>
      </div>
    </div>
  );
}
