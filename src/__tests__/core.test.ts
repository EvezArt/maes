import { describe, it, expect, beforeEach } from 'vitest';
import { EventStore } from '../event-store';
import { AgentRuntime } from '../agent-runtime';
import { VerificationEngine } from '../verification-engine';
import { CheckpointManager } from '../checkpoint-manager';
import { mkdirSync, rmSync } from 'fs';

const TEST_DB = 'data/test-events.db';
const TEST_CP_DIR = 'data/test-checkpoints';

let store: EventStore;

beforeEach(() => {
  rmSync(TEST_DB, { force: true });
  rmSync(TEST_CP_DIR, { recursive: true, force: true });
  mkdirSync('data', { recursive: true });
  store = new EventStore(TEST_DB);
});

describe('EventStore', () => {
  it('appends and reads events', () => {
    const pos = store.append('s1', 'test.event', { foo: 1 }, 'tester');
    expect(pos).toBeGreaterThan(0);
    const events = store.readStream('s1');
    expect(events).toHaveLength(1);
    expect(events[0].payload).toEqual({ foo: 1 });
    expect(events[0].metadata.position).toBe(pos);
  });

  it('reads from position', () => {
    store.append('s1', 'a', {}, 't');
    store.append('s1', 'b', {}, 't');
    const all = store.readStream('s1', 0);
    expect(all).toHaveLength(2);
    // Positions are 1-based autoincrement, so position > 2 means no results
    const lastPos = all[1].metadata.position;
    const partial = store.readStream('s1', lastPos + 1);
    expect(partial).toHaveLength(0);
  });

  it('readAll returns events across streams', () => {
    store.append('s1', 'a', {}, 't');
    store.append('s2', 'b', {}, 't');
    const all = store.readAll();
    expect(all).toHaveLength(2);
  });
});

describe('AgentRuntime', () => {
  it('spawns agents', () => {
    const rt = new AgentRuntime(store);
    const agent = rt.spawn({ type: 'npc' });
    expect(agent.id).toBeTruthy();
    expect(agent.type).toBe('npc');
  });

  it('tick returns decisions', () => {
    const rt = new AgentRuntime(store);
    const agent = rt.spawn({ type: 'npc' });
    const decisions = rt.tick(agent.id, [{ key: 'test', value: 1 }]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].action).toBe('idle');
  });

  it('tick returns empty for unknown agent', () => {
    const rt = new AgentRuntime(store);
    expect(rt.tick('no-such-id', [])).toEqual([]);
  });
});

describe('VerificationEngine', () => {
  it('returns zero score for unknown agent', () => {
    const ve = new VerificationEngine(store);
    const score = ve.evaluate('no-such-id');
    expect(score.agency).toBe(0);
    expect(score.isPlayer).toBe(false);
  });

  it('evaluates agent with events', () => {
    const rt = new AgentRuntime(store);
    const agent = rt.spawn({ type: 'npc' });
    rt.tick(agent.id, []);
    const ve = new VerificationEngine(store);
    const score = ve.evaluate(agent.id);
    expect(score.confidence).toBeGreaterThanOrEqual(0);
  });
});

describe('CheckpointManager', () => {
  it('creates and retrieves checkpoint', () => {
    const cpMgr = new CheckpointManager(store, TEST_CP_DIR);
    store.append('agent:test', 'test', {}, 't');
    const cp = cpMgr.create('agent:test', { hp: 100 });
    expect(cp.checkpointId).toBeTruthy();
    expect(cp.checksum).toBeTruthy();

    const latest = cpMgr.getLatest('agent:test');
    expect(latest).not.toBeNull();
    expect(latest!.checkpointId).toBe(cp.checkpointId);
  });

  it('issueToken returns null for unknown agent', () => {
    const cpMgr = new CheckpointManager(store, TEST_CP_DIR);
    expect(cpMgr.issueToken('no-such')).toBeNull();
  });
});
