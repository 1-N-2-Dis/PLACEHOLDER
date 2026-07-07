// Renders the GuidHer Barangay Infrastructure Brief as a calm weather-forecast report card:
// gradient sky banner, a "sky condition" read derived from the same counts as the gauges below
// it (not a separate invented signal), and cloud-density gauges for the vulnerability metrics.
// This brief gets printed and handed to barangay offices, so every gauge keeps a redundant
// text/number encoding — color is decoration on top of a value a grayscale printer won't lose.
const PALETTE = {
  primary: '#4B2E83',
  primaryLight: '#7D5CC7',
  lavender: '#B69AD9',
  ink: '#1a1a2e',
  muted: '#6b7280',
  line: '#d9d0ec',
  cloudTrack: '#EDE7F9',
  white: '#ffffff',
};

// Puffy cloud silhouette built from overlapping circles + a base — no emoji, matches the
// project-wide "vector icons only" convention (frontend uses lucide-react; this is pdfkit's
// vector equivalent).
function drawCloudGlyph(doc, cx, cy, scale, color, opacity = 1) {
  doc.save();
  doc.fillColor(color, opacity);
  doc.circle(cx - 9 * scale, cy + 2 * scale, 7 * scale).fill();
  doc.circle(cx + 3 * scale, cy - 4 * scale, 9 * scale).fill();
  doc.circle(cx + 14 * scale, cy + 2 * scale, 7 * scale).fill();
  doc.roundedRect(cx - 15 * scale, cy, 34 * scale, 10 * scale, 5 * scale).fill();
  doc.restore();
}

// Rounded gauge track + gradient fill. `value`/`max` drive the fill width; the numeric label
// printed alongside it (by the caller) is the primary encoding — the bar is reinforcement, not
// the only signal, so the brief still reads correctly off a black-and-white photocopier.
function drawGaugeBar(doc, { x, y, width, height, value, max }) {
  const radius = height / 2;
  doc.roundedRect(x, y, width, height, radius).fill(PALETTE.cloudTrack);
  if (max > 0 && value > 0) {
    const fillWidth = Math.min(Math.max((value / max) * width, height), width);
    const grad = doc.linearGradient(x, y, x + fillWidth, y);
    grad.stop(0, PALETTE.lavender).stop(1, PALETTE.primaryLight);
    doc.roundedRect(x, y, fillWidth, height, radius).fill(grad);
  }
}

// A plain count → calm forecast word. Never "storm" or anything danger-coded (BR-002, no
// rescue-promise framing) — this describes report volume, not a threat level.
function skyCondition(total) {
  if (total <= 0) return 'Clear';
  if (total <= 3) return 'Partly Cloudy';
  if (total <= 8) return 'Cloudy';
  return 'Overcast';
}

export function renderBarangayBriefPdf(doc, { location, lastUpdated, summary, metrics, mitigations }) {
  const pageWidth = doc.page.width;
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;

  const metricRows = [
    ['Poor Lighting Incidents', metrics.poor_lighting_count ?? 0],
    ['Unsafe Infrastructure Reports', metrics.unsafe_infrastructure_count ?? 0],
    ['Low Foot Traffic / Isolation', metrics.low_foot_traffic_count ?? 0],
    ['Other Environmental Concerns', metrics.other_scams_count ?? 0],
  ];
  const maxCount = Math.max(...metricRows.map(([, c]) => c), 1);
  const totalCount = metricRows.reduce((sum, [, c]) => sum + c, 0);
  const condition = skyCondition(totalCount);

  // ── Header banner (full bleed) ──────────────────────────────────────────────
  const bannerHeight = 112;
  const bannerGrad = doc.linearGradient(0, 0, pageWidth, bannerHeight);
  bannerGrad.stop(0, PALETTE.primary).stop(1, PALETTE.primaryLight);
  doc.rect(0, 0, pageWidth, bannerHeight).fill(bannerGrad);

  // Faint atmospheric clouds drifting through the banner — decorative only.
  drawCloudGlyph(doc, pageWidth - 96, 34, 1.3, PALETTE.white, 0.12);
  drawCloudGlyph(doc, pageWidth - 190, 70, 0.9, PALETTE.white, 0.08);

  doc
    .fillColor(PALETTE.white, 1)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('GuidHer', marginX, 26, { lineBreak: false });
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(PALETTE.white, 0.85)
    .text('Community Safety Infrastructure Brief', marginX, 52, { lineBreak: false })
    .text(`Zone: ${location}`, marginX, 68, { lineBreak: false })
    .text(`Compiled: ${lastUpdated}`, marginX, 82, { lineBreak: false });

  // Sky-condition pill — read directly off the same totals as the gauges below, not a
  // separately invented metric.
  const pillLabel = condition;
  doc.font('Helvetica-Bold').fontSize(10);
  const pillTextWidth = doc.widthOfString(pillLabel);
  const pillWidth = pillTextWidth + 54;
  const pillHeight = 26;
  const pillX = pageWidth - marginX - pillWidth;
  const pillY = 26;
  doc.roundedRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2).fill(PALETTE.white, 0.92);
  drawCloudGlyph(doc, pillX + 20, pillY + 13, 0.5, PALETTE.primary, 1);
  doc
    .fillColor(PALETTE.primary, 1)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(pillLabel, pillX + 34, pillY + 8, { lineBreak: false });

  doc.fillColor(PALETTE.ink, 1);
  doc.y = bannerHeight + 26;
  doc.x = marginX;

  // ── Executive Summary ─────────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(PALETTE.ink)
    .text('Executive Summary', marginX, doc.y);
  doc.rect(marginX, doc.y + 3, 28, 3).fill(PALETTE.lavender);
  doc.moveDown(0.9);
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(PALETTE.ink)
    .text(summary || 'No summary available. Run compile-analytics.mjs to generate AI analysis.', {
      align: 'justify',
      lineGap: 2,
      width: contentWidth,
    })
    .moveDown(1);

  // ── Vulnerability Metrics, as cloud-density gauges ─────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(PALETTE.ink)
    .text('Reported Infrastructure Vulnerability Counts', marginX, doc.y);
  doc.rect(marginX, doc.y + 3, 28, 3).fill(PALETTE.lavender);
  doc.moveDown(1);

  const gaugeHeight = 8;
  const glyphColumnWidth = 30;
  const gaugeX = marginX + glyphColumnWidth;
  const gaugeWidth = contentWidth - glyphColumnWidth;

  for (const [label, count] of metricRows) {
    const rowTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(PALETTE.ink)
      .text(label, marginX, rowTop, { continued: true, width: contentWidth - glyphColumnWidth })
      .font('Helvetica-Bold')
      .text(`${count}`, { align: 'right' });

    const barY = doc.y + 5;
    // Cloud glyph scaled by this row's share of the largest count — decorative reinforcement
    // of the bar length directly beside it, never the only signal.
    const cloudScale = 0.45 + 0.35 * (count / maxCount);
    drawCloudGlyph(doc, marginX + 10, barY + gaugeHeight / 2 - 1, cloudScale, PALETTE.primaryLight, count > 0 ? 1 : 0.35);
    drawGaugeBar(doc, { x: gaugeX, y: barY, width: gaugeWidth, height: gaugeHeight, value: count, max: maxCount });

    doc.y = barY + gaugeHeight + 14;
  }

  doc.moveDown(0.4);

  // ── Actionable Mitigations ────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(PALETTE.ink)
    .text('Recommended Barangay Actions', marginX, doc.y);
  doc.rect(marginX, doc.y + 3, 28, 3).fill(PALETTE.lavender);
  doc.moveDown(1);

  if (mitigations.length === 0) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(PALETTE.ink)
      .text('No mitigations available. Run compile-analytics.mjs with a valid GEMINI_API_KEY.');
  } else {
    const badgeSize = 16;
    mitigations.forEach((mitigation, i) => {
      const rowTop = doc.y;
      doc.circle(marginX + badgeSize / 2, rowTop + badgeSize / 2, badgeSize / 2).fill(PALETTE.primary);
      doc
        .fillColor(PALETTE.white)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`${i + 1}`, marginX, rowTop + 4, { width: badgeSize, align: 'center' });

      doc
        .fillColor(PALETTE.ink)
        .font('Helvetica')
        .fontSize(10)
        .text(mitigation, marginX + badgeSize + 10, rowTop, {
          align: 'justify',
          lineGap: 2,
          width: contentWidth - badgeSize - 10,
        });
      doc.moveDown(0.7);
    });
  }

  doc.moveDown(0.5);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc
    .moveTo(marginX, doc.y)
    .lineTo(pageWidth - marginX, doc.y)
    .strokeColor(PALETTE.line)
    .lineWidth(1)
    .stroke()
    .moveDown(0.5)
    .fontSize(8)
    .fillColor(PALETTE.muted)
    .font('Helvetica')
    .text(
      'This brief was generated from anonymised community-sourced infrastructure reports. It describes observable, fixable conditions — not crime classifications. ' +
      'For use in local Barangay coordination and public-service improvement requests only.',
      { align: 'justify', lineGap: 1, width: contentWidth },
    );
}
