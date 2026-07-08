import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AccountPanel from '../features/auth/AccountPage.jsx';
import { GradientBlobs } from '../components/BackgroundDecorations.jsx';

export default function AccountPage() {
  const navigate = useNavigate();

  return (
    <div className="page-scroll">
      <GradientBlobs opacity={0.4} />
      <div className="page-scroll-inner">
        <button className="btn btn-ghost btn-sm back-link mb-20" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <AccountPanel />
      </div>
    </div>
  );
}
