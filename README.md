# AIcuNet

**AIcuNet** is a decentralized network with a built-in AI layer that is designed to run on the network's own
compute — a DePIN approach: participants contribute CPU / RAM / storage / GPU to the network.

- **Network:** AINET — an L1 blockchain
- **Coin:** Axinit (ticker **AXNT**, symbol ∀)
- **Compute credits (planned):** **CuJoule (CuJ)** — for paying for resources and AI

## Idea
A blockchain you can run on almost any device, with no central operator — the decentralization
of public blockchains, extended to AI and applications:
- unstoppable apps (e.g. a messenger nobody can block, usable in any country);
- a relatively free AI chat that becomes more capable as the network's compute grows;
- data storage and compute spread across the network, not on one company's servers.

## Status — early stage
- **Phase 1 (L1 consensus): working** — time-slot blocks (3 s), single chain, public node onboarding
  without a shared key.
- **Phase 2 (resource layer):** decentralized storage + proof-of-resource — roadmap.
- **Phase 3 (GPU + AI chat on network compute):** roadmap.

This is an early network — expect rough edges.

## How it works (short)
- **Time-driven PoW:** time is split into 3-second slots; each slot = one block. In a slot the
  heaviest-PoW candidate wins; losers are dropped before the chain is written → a single chain.
- **Memory-hard mining:** the mining algorithm is RAM-bound, which makes renting specialised hardware
  for an attack less practical.
- **Feeless transactions:** a priority mechanism is used instead of fees.
- **Smart contracts and dApps (Web3):** a JavaScript smart-contract engine, dApp interfaces stored
  in the chain and custom tokens are already part of the network code; opening them to developers
  is the next roadmap step. The first network application, Miner's Hour, has been running on the
  network since 30 September 2026 in trial mode.

## Run a node
Install Node.js 22 (64-bit), get the code, run `npm ci` in the `Source` folder and start a node from it with `node run-ainet.js`.
Two environment variables are required:
- `AINET_START_DATE=1783867255035` — the genesis time of the AINET network (the start-up guard in
  `Source/core/ainet-guard.js` refuses any other value);
- `AINET_SEEDS=ip:port,ip:port` — seed nodes to connect to; the current list is sent with the invitation
  (see aicunet.com).
Mining is memory-hard (CPU + RAM). A step-by-step node setup guide is in preparation.
Mining is off by default. Before enabling it, set the reward account to an account you own
(the mining panel of the wallet).

## License
MIT License (as published upstream, including the author's "Not for evil" note) — see LICENSE.
AIcuNet is based on Tera (https://github.com/terablockchain/tera, commit 8d65eb4) and is not
affiliated with the Tera project; attribution, upstream notices and the list of changes are in NOTICE.

## Geo database
The optional IP-geolocation database used by `map.html` (`Source/SITE/DB/iplocation.db`,
`locationnames.csv`) is not included in this repository because of its size. If you generate it
yourself from the public DB-IP Lite dataset, its CC BY 4.0 attribution applies:
IP geolocation data by DB-IP.com, <https://db-ip.com>.
