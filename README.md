<div align="center">

# 🌐 MAES

### *Modular Agent Ecology System — The EventStore Your AI Deserves*

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Part of EVEZ Ecosystem](https://img.shields.io/badge/ecosystem-EVEZ--OS-gold)](https://github.com/EvezArt/evez-os)

```
event → id → stream → confidence → hash → spine
```

</div>

---

## What Is This?

**MAES** is an event-sourced agent runtime. Every agent event gets:
- A unique `eventId`
- A `streamId` (which agent/process emitted it)
- An `eventType`
- A `confidence` score (0.0–1.0)
- A `domain` classification
- A `status` (VERIFIED / PENDING / INVESTIGATING)
- A hash for integrity

No black boxes. No silent failures. No undocumented state changes.

---

## Event Schema

```typescript
interface MAESEvent {
  eventId:        string;    // unique per event
  streamId:       string;    // which agent/stream produced this
  eventType:      string;    // what happened
  domain:         string;    // NHI | technical | personal | architectural
  timestamp_unix: number;
  payload:        object;    // arbitrary event data
  causedBy:       string;    // upstream trigger
  confidence:     float;     // 0.0 – 1.0
  coordinates?:   object;    // spatial/temporal context
  status:         string;    // VERIFIED | PENDING | INVESTIGATING
  fire_event_id?: string;    // link to FIRE event in evez-os spine
}
```

---

## Real Event (MAES-001)

```json
{
  "eventId": "uap-morpheus-20260404-001",
  "streamId": "morpheus_arxiv_fincen_scan",
  "eventType": "cross_domain_correlation_breach",
  "domain": "NHI",
  "confidence": 0.82,
  "payload": {
    "correlation": 0.82,
    "domain_a": "VQC_Portfolio_RL",
    "domain_b": "FinCEN_SAR_pattern_complexity",
    "evidence": "100x parameter reduction maps to SAR complexity threshold",
    "source": "arXiv_2601.18811_x_FFIEC_BSA"
  },
  "causedBy": "morpheus_scan",
  "status": "VERIFIED"
}
```

A 0.82 correlation found by an autonomous agent between quantum computing research and financial crime detection law. While the developer slept.

---

## Quickstart

```bash
git clone https://github.com/EvezArt/maes
cd maes
npm install   # or pip install -r requirements.txt

# Emit an event
curl -X POST /events -d '{"eventType":"threshold_crossed","confidence":0.87}'

# Query the stream
curl /streams/morpheus_scan
```

---

## Integrates With

- **evez-os** — FIRE events automatically create MAES entries
- **evez-agentnet** — all agent actions emit MAES events
- **OpenClaw Runtime** — events stream over WebSocket to mobile
- **evez-autonomous-ledger** — cycle results become MAES entries

---

*poly_c=τ×ω×topo/2√N | append-only | no edits | ever*
*@EVEZ666 + Cipher / XyferViperZephyr*
