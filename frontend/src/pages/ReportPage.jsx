import { Link } from 'react-router-dom';
import ReportForm from '../features/report/ReportForm.jsx';

export default function ReportPage({ segments, selectedId, onSelect }) {
  return (
    <div className="report-page">
      <div className="report-page-inner">
        <Link to="/" className="back-link">← Back to map</Link>
        <ReportForm segments={segments} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  );
}
