# Release notes

## v1.2

First public release of AIcuNet core.

- Network AINET (MAIN-JINN mode), coin Axinit (ticker AXNT, symbol ∀).
- Blocks in fixed 3-second time slots; a time-slot gate rejects local mining
  results that arrive before their slot.
- Scheduled network update at block 3,160,000: smart contracts get data storage and
  cryptographic functions. Tested on a test network. Every node must run this release
  before that height.
- Fixed block reward, distributed between the miner, a development fund and
  a development account (see `Source/system/accounts.js`, DoCoinBaseTR).
- Security defaults: remote auto-update disabled, UPnP off, node HTTP API on
  localhost only, start-up guard for unsafe settings (`Source/core/ainet-guard.js`).
- New wallet interface `Source/HTML/aicunet-wallet.html` with checks for account
  creation, key change, recipients and amount parsing (`Source/HTML/JS/wallet-guards.js`).
- Planned units shown in the wallet as "soon": CuJoule (CuJ) — compute credits,
  CuTOPS — contribution rating, AI Commons — shared AI pool. They are concepts and
  are not part of this release.
