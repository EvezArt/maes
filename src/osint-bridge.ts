/**
 * MAES-OSINT Bridge — Every visitor observation becomes a MAES event.
 * The reality sensor feeds the agent ecology.
 * Cross-domain: OSINT → Agent → Cognition → Revenue.
 */
export interface OSINTEvent {
  eventId: string;
  streamId: string;
  eventType: 'VISITOR_DETECTED' | 'FINGERPRINT_MATCHED' | 'IDENTITY_INFERRED' | 'SPECTRAL_SHIFT';
  domain: 'security' | 'research' | 'agent';
  timestamp_unix: number;
  payload: {
    ip: string;
    fingerprint_hash: string;
    inferred_identity: string;
    confidence: number;
    country: string;
    org: string;
    paths_visited: string[];
    behavioral_vector: number[];
  };
  causedBy: string;
  confidence: number;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    network_asn?: string;
  };
  status: 'PENDING' | 'VERIFIED' | 'ALERT';
  fire_event_id?: string;
}

export function osintToMAES(visitor: Record<string, any>): OSINTEvent {
  const payload = visitor?.payload ?? visitor;
  return {
    eventId: `osint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    streamId: 'osint-sensor',
    eventType: 'VISITOR_DETECTED',
    domain: String(payload.inferred_identity ?? '').includes('attack') ? 'security' : 'research',
    timestamp_unix: Math.floor(Date.now() / 1000),
    payload: {
      ip: String(payload.ip ?? ''),
      fingerprint_hash: String(payload.fingerprint_hash ?? ''),
      inferred_identity: String(payload.inferred_identity ?? ''),
      confidence: Number(payload.confidence ?? 0.5),
      country: String(payload.country ?? ''),
      org: String(payload.org ?? ''),
      paths_visited: Array.isArray(payload.paths_visited) ? payload.paths_visited : [],
      behavioral_vector: Array.isArray(payload.behavioral_vector) ? payload.behavioral_vector : [],
    },
    causedBy: 'evez-osint-engine',
    confidence: Number(payload.confidence ?? 0.5),
    coordinates: { network_asn: String(payload.org ?? '') },
    status: String(payload.inferred_identity ?? '').includes('attack') ? 'ALERT' : 'PENDING',
  };
}

export function processVisitor(visitor: Record<string, any>): OSINTEvent[] {
  const events: OSINTEvent[] = [];
  const identity = String(visitor?.inferred_identity ?? visitor?.payload?.inferred_identity ?? '');
  const confidence = Number(visitor?.confidence ?? visitor?.payload?.confidence ?? 0.5);

  events.push(osintToMAES(visitor));

  if (confidence > 0.6) {
    events.push({
      ...osintToMAES(visitor),
      eventType: 'IDENTITY_INFERRED',
      eventId: `osint-id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
  }

  if (identity.includes('attack') || identity.includes('scanner')) {
    events.push({
      ...osintToMAES(visitor),
      eventType: 'SPECTRAL_SHIFT',
      eventId: `osint-shift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      domain: 'security',
      status: 'ALERT',
    });
  }

  return events;
}
