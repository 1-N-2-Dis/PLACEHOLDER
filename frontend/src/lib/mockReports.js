// Mock reports service for guidHER prototype (replaces Firestore).
import { CONDITION_TYPES } from '../data/condition-types.js';

const KEY = 'guidher_reports';
const NOW = Date.now();
const DEMO = [
  { id:'d1', segmentId:'seg_legarda_estero', conditionType:'poor_lighting', severity:'yellow', note:'Street lighting along the estero walkway is very dim after 8 PM.', uid:'demo', corroborationCount:3, createdAt: NOW-2*3600*1000, lastActivityAt: NOW-1800*1000, photoPath:null },
  { id:'d2', segmentId:'seg_pureza_approaches', conditionType:'no_crowd', severity:'yellow', note:'Station underpass very empty tonight, feels uncomfortable alone.', uid:'demo', corroborationCount:2, createdAt: NOW-3600*1000, lastActivityAt: NOW-2700*1000, photoPath:null },
  { id:'d3', segmentId:'seg_recto_legarda', conditionType:'recent_incident', severity:'red', note:'Witnessed suspicious activity near the corner store.', uid:'demo', corroborationCount:5, createdAt: NOW-3*3600*1000, lastActivityAt: NOW-1200*1000, photoPath:null },
];

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
