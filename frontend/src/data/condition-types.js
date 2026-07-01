// The closed condition vocabulary for SaferRoute.
// Role: the ONLY values a report's conditionType may take.
// Traces to: docs/09-data-model.md, docs/03-prd.md BR-001.
//
// Serves: F-002 report form options; mirrored by Firestore rules (closed enum + field allowlist).
//
// HARD RULE (BR-001): conditions describe fixable/observable states only — never a crime label,
// neighborhood "danger" rating, or any classification of people. This list is the whole vocabulary.

import { LightbulbOff, UserX, Siren } from 'lucide-react';

export const CONDITION_TYPES = ['poor_lighting', 'no_crowd', 'recent_incident'];

// UI display metadata, keyed by the enum value. Labels stay condition-focused (BR-001).
// Icons are lucide-react components (project-wide: no emoji, lucide-react only).
export const CONDITION_META = {
  poor_lighting: { label: 'Poor lighting', Icon: LightbulbOff, hint: 'Streetlights out or very dim.' },
  no_crowd: { label: 'No crowd', Icon: UserX, hint: 'Empty / thin foot traffic right now.' },
  recent_incident: { label: 'Recent incident', Icon: Siren, hint: 'Something happened here recently.' },
};

export function isValidConditionType(value) {
  return CONDITION_TYPES.includes(value);
}
