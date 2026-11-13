// AstroDB ATLAS registry: pure helpers, no network or storage side effects.
export const ENGINES = Object.freeze(['ORIGEN','ENNOIA','REVOLUCION_SOLAR','SINTESIS']);
export const STATUSES = Object.freeze(['imported_unverified','pending','validated','failed','cancelled']);
export function normalizeExecution(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('Execution must be an object');
  const engine = String(raw.engine || '').toUpperCase();
  if (!ENGINES.includes(engine)) throw new Error('Unknown engine');
  const personLabel = String(raw.person_label || '').trim();
  if (!personLabel) throw new Error('Person label required');
  const executionId = raw.execution_id == null ? null : String(raw.execution_id).trim() || null;
  const sha = raw.input_sha256 == null ? null : String(raw.input_sha256);
  if (sha !== null && !/^[a-f0-9]{64}$/i.test(sha)) throw new Error('Invalid SHA-256');
  return {
    person_label: personLabel,
    person_local_id: raw.person_local_id == null ? null : String(raw.person_local_id),
    engine, engine_version: raw.engine_version == null ? null : String(raw.engine_version),
    execution_id: executionId, cycle_label: raw.cycle_label == null ? null : String(raw.cycle_label),
    input_sha256: sha, status: 'imported_unverified', source: 'manual'
  };
}
export function correlateByIdentity(executions) {
  const groups = new Map();
  for (const item of executions) {
    // Never group solely on a name: only a stable person ID is suitable.
    const id = item.person_local_id;
    if (!id) continue;
    const group = groups.get(id) || [];
    group.push(item);
    groups.set(id, group);
  }
  return [...groups].map(([personId, items]) => ({ personId, items }));
}
export function downloadState(events) {
  if (events.some(e => e.event_type === 'download_confirmed' && e.evidence_level === 'verified')) return 'confirmed';
  if (events.some(e => e.event_type === 'download_requested')) return 'requested_only';
  return 'not_recorded';
}
