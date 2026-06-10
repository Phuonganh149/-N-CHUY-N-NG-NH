/* ═══════════════════════════════════════
   reports.js
═══════════════════════════════════════ */
const MONTHS     = ['T1','T2','T3','T4','T5','T6'];
const TREND_DATA = [45, 62, 58, 81, 95, 87];

const SOURCE_LABELS = ['Referral','LinkedIn','Website','TopCV','Facebook'];
const SOURCE_DATA   = [90, 78, 55, 42, 30];
const SOURCE_COLORS = ['#1d9e75','#4f8ef7','#8b5cf6','#ba7517','#e24b4a'];

document.addEventListener('DOMContentLoaded', () => {
  makeBarChart('reportBarChart', MONTHS, TREND_DATA);
  makeDoughnutChart('sourceChart', SOURCE_LABELS, SOURCE_DATA, SOURCE_COLORS);
});
