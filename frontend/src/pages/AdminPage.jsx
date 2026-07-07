import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuthUser } from '../lib/useAuthUser.js';
import AdminReports from '../features/admin/AdminReports.jsx';
import { GradientBlobs } from '../components/BackgroundDecorations.jsx';

export default function AdminPage({ reports, segments }) {
  const { role } = useAuthUser();
  const navigate = useNavigate();

  return (
    <div className="page-scroll">
      <GradientBlobs opacity={0.4} />
      <div className="page-scroll-inner">
        <button className="btn btn-ghost btn-sm back-link mb-20" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-h1 mb-20" style={{ fontSize: '2.2rem', color: 'var(--ink)' }}>Admin: all reports</div>
        {role === 'admin' ? (
          <AdminReports reports={reports} segments={segments} />
        ) : (
          <div className="card empty-state">
            <ShieldAlert size={32} className="empty-state-icon" style={{ color: 'var(--muted)' }} />
            <div>You need an admin account to view this page.</div>
          </div>
        )}
      </div>
    </div>
  );
}
