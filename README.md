# MAES — Modular Agent Ecology System

> Event-sourced agent runtime where player-hood is **earned**, not assigned. Part of the EVEZ ecosystem.

## Architecture

| Module | Purpose |
|---|---|
| `EventStore` | Append-only SQLite log; every agent action is immutable |
| `AgentRuntime` | Spawns/ticks agents; rate-limited; type-agnostic |
| `VerificationEngine` | Scores agency, continuity, accountability → player-hood |
| `CheckpointManager` | Snapshots state + issues PWA sync tokens |
| `maes-server` | Fastify HTTP API wrapping all modules |

## Quick Start

```bash
pnpm install
pnpm dev
```

Server runs at `http://localhost:3000`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/agents/spawn` | Spawn new agent |
| POST | `/agents/:id/tick` | Execute decision cycle |
| GET  | `/agents/:id/verify` | Get player-hood score |
| POST | `/agents/:id/checkpoint` | Snapshot + issue PWA token |
| POST | `/sync` | Resume from checkpoint token |
| GET  | `/events` | Read full event log |
| GET  | `/agents` | List all agents |
| GET  | `/health` | Health check |

## Player-hood Thresholds

| Factor | Threshold | Measurement |
|---|---|---|
| Agency | > 0.60 | Decision action variety |
| Continuity | > 0.70 | Event density over lifespan |
| Accountability | > 0.75 | Non-idle action ratio |

## Links

- [EVEZ-OS](https://github.com/EvezArt/evez-os) — Cognition layer / FIRE events
- [evez-agentnet](https://github.com/EvezArt/evez-agentnet) — Orchestrator / income loop
- [evez-autonomous-ledger](https://github.com/EvezArt/evez-autonomous-ledger) — Master build ledger
