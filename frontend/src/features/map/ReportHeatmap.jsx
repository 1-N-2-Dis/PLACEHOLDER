// Community heatmap layer of validated (yellow/red severity) reports (F-010).
// Renders one glowing lucide severity icon per flagged segment — AlertTriangle for yellow,
// AlertOctagon for red — with a pulsing halo in the severity color. Purely visual: markers are
// pointer-events:none so the clickable SegmentFlag dots at the same coordinates keep working.
import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { SEVERITY_META } from '../../data/severity-types.js';
import { buildIncidentMarkers, HEAT_COUNT_CAP } from '../../lib/heatmap.js';

export default function ReportHeatmap({ reports, segments, visible }) {
  const markers = useMemo(
    () => buildIncidentMarkers(reports, segments),
    [reports, segments],
  );

  if (!visible || !markers.length) return null;

  return markers.map((m) => {
    const { Icon } = SEVERITY_META[m.severity];
    // More corroborating reports -> bigger chip (capped): 26px solo up to 38px at the cap.
    const size = 26 + (Math.min(m.count, HEAT_COUNT_CAP) - 1) * 3;
    return (
      <Marker key={m.segmentId} longitude={m.lng} latitude={m.lat} anchor="center">
        <div
          className={`heat-marker heat-marker--${m.severity}`}
          style={{ width: size, height: size }}
        >
          <Icon size={size * 0.58} strokeWidth={2.4} />
        </div>
      </Marker>
    );
  });
}
