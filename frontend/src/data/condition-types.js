// The closed condition vocabulary for SaferRoute.
// Role: the ONLY values a report's conditionType may take.
// Traces to: docs/09-data-model.md, docs/03-prd.md BR-001.
//
// Serves: F-002 report form options; mirrored by Firestore rules (closed enum + field allowlist).
//
// HARD RULE (BR-001): conditions describe fixable/observable states only — never a crime label,
// neighborhood "danger" rating, or any classification of people. This list is the whole vocabulary.

export const CONDITION_TYPES = ['poor_lighting', 'no_crowd', 'recent_incident'];

// UI display metadata, keyed by the enum value. Labels stay condition-focused (BR-001).
export const CONDITION_META = {
  poor_lighting: { label: 'Poor lighting', icon: '💡', hint: 'Streetlights out or very dim.' },
  no_crowd: { label: 'No crowd', icon: '🚶', hint: 'Empty / thin foot traffic right now.' },
  recent_incident: { label: 'Recent incident', icon: '⚠️', hint: 'Something happened here recently.' },
};

export function isValidConditionType(value) {
  return CONDITION_TYPES.includes(value);
}
