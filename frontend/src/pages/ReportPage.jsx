// guidHER Report page — condition selector + existing F-002/F-006 wizard.
// The quick-tap type selector shown here feeds into the existing ReportForm wizard.
import ReportForm from '../features/report/ReportForm.jsx';
import { GradientBlobs } from '../components/BackgroundDecorations.jsx';

export default function ReportPage({ segments, selectedId, onSelect }) {

  return (
    <div className="page-scroll">
      <GradientBlobs opacity={0.4} variant="report" />
      <div className="page-scroll-inner">

        {/* Header */}
        <div className="mb-20">
          <div className="text-h1" style={{ margin: 0, fontSize: '2.2rem', color: 'var(--ink)' }}>
            Community Reporting
          </div>
          <div className="text-body" style={{ color: 'var(--muted)', marginTop: 8, fontSize: '1.05rem', lineHeight: 1.4 }}>
            Share &amp; protect — your experience can help another commuter.
          </div>
        </div>

        {/* Report wizard (F-002 / F-006) */}
        <div className="card mb-20">
          <ReportForm segments={segments} selectedId={selectedId} onSelect={onSelect} />
        </div>

      </div>
    </div>
  );
}
