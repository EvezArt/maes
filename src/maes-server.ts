import Fastify from 'fastify';
import { EventStore }         from './event-store';
import { AgentRuntime }       from './agent-runtime';
import { VerificationEngine } from './verification-engine';
import { CheckpointManager }  from './checkpoint-manager';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';

const app     = Fastify({ logger: true });
const store   = new EventStore();
const runtime = new AgentRuntime(store);
const vEngine = new VerificationEngine(store);
const cpMgr   = new CheckpointManager(store);

app.post('/agents/spawn', async (req) => {
  const body = req.body as { type?: string } | undefined;
  const type = (body?.type as string) ?? 'npc';
  if (!['interface', 'ai', 'npc'].includes(type)) {
    throw { statusCode: 400, message: `Invalid agent type: ${type}` };
  }
  const agent = runtime.spawn({ type: type as any });
  return { agentId: agent.id, type: agent.type };
});

app.post<{ Params: { id: string } }>('/agents/:id/tick', async (req) => {
  const { id } = req.params;
  const body = req.body as { observations?: any[] } | undefined;
  if (!runtime.getAgent(id)) {
    throw { statusCode: 404, message: `Agent ${id} not found` };
  }
  return { decisions: runtime.tick(id, body?.observations ?? []) };
});

app.get<{ Params: { id: string } }>('/agents/:id/verify', async (req) => {
  return vEngine.evaluate(req.params.id);
});

app.post<{ Params: { id: string } }>('/agents/:id/checkpoint', async (req) => {
  const agent = runtime.getAgent(req.params.id);
  if (!agent) throw { statusCode: 404, message: `Agent ${req.params.id} not found` };
  const cp = cpMgr.create(`agent:${req.params.id}`, agent.state);
  return { checkpoint: cp, token: cpMgr.issueToken(req.params.id) };
});

app.post('/sync', async (req) => {
  const body = req.body as { agentId?: string; position?: number } | undefined;
  if (!body?.agentId) throw { statusCode: 400, message: 'agentId is required' };
  const position = body.position ?? 0;
  const events = store.readStream(`agent:${body.agentId}`, position + 1);
  return { events, count: events.length };
});

app.get('/events', async (req) => {
  const { from = 0 } = req.query as { from?: number };
  return { events: store.readAll(Number(from)) };
});

app.get('/agents', async () => ({
  agents: runtime.listAgents().map(a => ({
    id: a.id, type: a.type, eventCount: a.eventCount,
    playerStatus: vEngine.getCached(a.id) ?? null,
  })),
  count: runtime.listAgents().length,
}));

app.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down…`);
  await app.close();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`MAES running at ${address}`);
});
