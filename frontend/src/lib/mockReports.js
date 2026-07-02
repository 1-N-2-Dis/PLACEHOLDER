// Mock reports service for guidHER prototype (replaces Firestore).
import { CONDITION_TYPES } from '../data/condition-types.js';

const KEY = 'guidher_reports';
const NOW = Date.now();
// No demo markers by default. To add one, push an entry here with a segmentId from
// SEED_SEGMENTS (see ../data/seed-segments.js), a conditionType from poor_lighting/no_crowd/
// recent_incident (see ../data/condition-types.js), and a severity of green/yellow/red.
export const DEMO = [];

const load = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const listeners = new Set();

function getReports() {
  const r = load();
  if (r) return r;
  save(DEMO); return [...DEMO];
}

function notify() { const d = getReports(); for (const fn of listeners) fn(d); }

export function subscribeReports(onChange) {
  listeners.add(onChange);
  onChange(getReports());
  return () => listeners.delete(onChange);
}

export function latestBySegment(reports) {
  const m = new Map();
  for (const r of reports) { if (!m.has(r.segmentId)) m.set(r.segmentId, r); }
  return m;
}

export async function submitMockReport({ segmentId, conditionType, note, photoFile }) {
  await delay(1200);
  if (!CONDITION_TYPES.includes(conditionType)) return { status:'rejected', reason:'Invalid condition type.' };
  if (!segmentId) return { status:'rejected', reason:'No location selected.' };
  const reports = getReports();
  const twoH = Date.now() - 2*3600*1000;
  const dup = reports.find(r => r.segmentId===segmentId && r.conditionType===conditionType && (r.lastActivityAt||r.createdAt)>twoH);
  if (dup) {
    dup.corroborationCount = (dup.corroborationCount||1)+1; dup.lastActivityAt = Date.now();
    save(reports); notify();
    return { status:'duplicate', reportId:dup.id, corroborationCount:dup.corroborationCount };
  }
  const sev = { poor_lighting:'yellow', no_crowd:'yellow', recent_incident:'red' };
  const rep = { id:`r_${Date.now()}`, segmentId, conditionType, severity:sev[conditionType]||'yellow', note:(note||'').trim()||null, uid:'current_user', corroborationCount:1, createdAt:Date.now(), lastActivityAt:Date.now(), photoPath: photoFile?`mock_${Date.now()}`:null };
  reports.unshift(rep); save(reports); notify();
  return { status:'created', reportId:rep.id, severity:rep.severity };
}
