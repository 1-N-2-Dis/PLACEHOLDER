// Welcome screen — guidHER entry point.
import { useNavigate } from 'react-router-dom';
import Owly from '../../components/Owly.jsx';

export default function WelcomePage() {
  const nav = useNavigate();
  return (
    <div className="gh-auth-wrap">
      <div className="gh-auth-top">
        <div className="gh-welcome-logo">
          guid<span>HER</span>
        </div>
        <p className="gh-welcome-wise">Wise · Watchful · With you</p>
        <Owly size={120} className="gh-owly" />
        <p className="gh-auth-tagline">Your trusted companion for safer journeys around Sta. Mesa.</p>
      </div>

      <div className="gh-auth-bottom gh-slide-up">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <button id="btn-create-account" className="gh-btn gh-btn-primary" onClick={() => nav('/signup')}>
            Create Account
          </button>
          <button id="btn-login" className="gh-btn gh-btn-secondary" onClick={() => nav('/login')}>
            Log In
          </button>
          <button id="btn-guest" className="gh-btn gh-btn-ghost" onClick={() => nav('/app')}>
            Continue as Guest
          </button>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:20, lineHeight:1.5 }}>
          Built for women commuters in the PUP Sta. Mesa zone.<br/>
          Conditions only. No crime labels. No rescue promises.
        </p>
      </div>
    </div>
  );
}
