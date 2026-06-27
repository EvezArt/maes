import { EventStore } from './event-store';

export interface AgencyScore {
  agency: number;
  continuity: number;
  accountability: number;
  isPlayer: boolean;
  confidence: number;
  lastEvaluated: number;
}

export class VerificationEngine {
  private store: EventStore;
  private cache = new Map<string, AgencyScore>();

  constructor(store: EventStore) { this.store = store; }

  evaluate(agentId: string): AgencyScore {
    const events = this.store.readStream(`agent:${agentId}`);
    if (!events.length) return this.zero();

    const actionEvents = events.filter(e => e.eventType === 'agent.action.submitted');
    const actionTypes = new Set(
      actionEvents.map(e => {
        const p = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
        return (p as any)?.action;
      }).filter(Boolean)
    );
    const rawAgency = Math.min(actionTypes.size / 10, 1.0);
    const lifespan = (Date.now() - events[0].timestamp) / 3_600_000 + 0.01;
    const rawContinuity = Math.min(events.length / (lifespan * 50), 1.0);
    const nonIdle = actionEvents.filter(e => {
      const p = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
      return (p as any)?.action !== 'idle';
    }).length;
    const rawAccountability = actionEvents.length > 0 ? nonIdle / actionEvents.length : 0;

    const score: AgencyScore = {
      agency: rawAgency,
      continuity: rawContinuity,
      accountability: rawAccountability,
      isPlayer: rawAgency > 0.6 && rawContinuity > 0.7 && rawAccountability > 0.75,
      confidence: (rawAgency + rawContinuity + rawAccountability) / 3,
      lastEvaluated: Date.now(),
    };
    this.cache.set(agentId, score);
    return score;
  }

  private zero(): AgencyScore {
    return { agency: 0, continuity: 0, accountability: 0, isPlayer: false, confidence: 0, lastEvaluated: Date.now() };
  }

  getCached(agentId: string): AgencyScore | undefined { return this.cache.get(agentId); }
}
