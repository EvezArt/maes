# MAES — Modular Agent Ecology System

A TypeScript event-sourced runtime for autonomous agent ecosystems. MAES provides an append-only event spine, agent lifecycle management, agency verification, and state checkpointing — all backed by SQLite.

## Architecture

```
┌─────────────┐   ┌───────────────┐   ┌──────────────────┐
│ AgentRuntime │──▶│  EventStore   │──▶│ VerificationEngine│
│  (spawn/tick)│   │ (append-only) │   │  (agency scores) │
└─────────────┘   └───────┬───────┘   └──────────────────┘
                          │
              ┌───────────┴──────────┐
              │  CheckpointManager    │
              │ (state snapshots/tokens)│
              └──────────────────────┘
```

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| **EventStore** | `src/event-store.ts` | SQLite-backed append-only event log with stream reading |
| **AgentRuntime** | `src/agent-runtime.ts` | Agent lifecycle: spawn, tick (observe→decide), despawn |
| **VerificationEngine** | `src/verification-engine.ts` | Scores agent agency/continuity/accountability to verify human players |
| **CheckpointManager** | `src/checkpoint-manager.ts` | State snapshots with SHA-256 checksums and expiring tokens |
| **OracleBridge** | `src/oracle-bridge.ts` | EVEZ-OS FIRE event ingestion into agent observations |
| **OSINT Bridge** | `src/osint-bridge.ts` | Visitor observation → MAES event converter |
| **HTTP Server** | `src/maes-server.ts` | Fastify REST API for all operations |

## Quick Start

```bash
# Install
npm install

# Development (tsx hot-reload)
npm run dev

# Build
npm run build

# Production
npm start

# Run tests
npm test
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `127.0.0.1` | HTTP server bind address |

> **Note:** The default bind address is `127.0.0.1` (localhost only). Set `HOST=0.0.0.0` to expose to network, but ensure authentication is in place.

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agents/spawn` | Create a new agent (`{type: "npc"|"ai"|"interface"}`) |
| `POST` | `/agents/:id/tick` | Tick agent with observations, returns decisions |
| `GET`  | `/agents/:id/verify` | Get agency verification score |
| `POST` | `/agents/:id/checkpoint` | Create checkpoint + issue token |
| `POST` | `/sync` | Sync events since position (`{agentId, position}`) |
| `GET`  | `/events?from=N` | Read all events from position |
| `GET`  | `/agents` | List all active agents |
| `GET`  | `/health` | Health check |

## Event Sourcing

All state changes are captured as immutable events in SQLite:

```typescript
interface GameEvent {
  eventId: string;
  streamId: string;       // e.g. "agent:<uuid>"
  eventType: string;      // e.g. "agent.spawned", "agent.action.submitted"
  timestamp: number;
  payload: unknown;
  metadata: {
    causedBy: string;     // agent ID or "runtime"
    position: number;     // global sequence number
  };
}
```

## Verification (Player Detection)

The `VerificationEngine` scores each agent on:
- **Agency** (0–1): diversity of action types
- **Continuity** (0–1): event density over lifespan
- **Accountability** (0–1): ratio of non-idle actions

An agent is classified as a **player** when agency > 0.6, continuity > 0.7, and accountability > 0.75.

## Building Native Dependencies

This project uses `better-sqlite3` which requires native compilation:

```bash
# Ensure build tools are available
# Ubuntu/Debian:
sudo apt install build-essential python3

# Then install normally
npm install
```

## License

MIT

---

*Part of [EVEZ-OS](https://github.com/EvezArt/evez-os)*
