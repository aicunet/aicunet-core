/*
 * @project: TERA, @copyright: Yuriy Ivanov (Vtools) 2017-2021 [progr76@gmail.com]
 * Modifications (c) 2026 AIcuNet
 * Base: Tera commit 8d65eb4 (LICENSE: MIT). Upstream notice above kept unchanged. See LICENSE and NOTICE.
*/

"use strict";

//example run in dev mode:  start-node MODE:DEV_JINN PATH:<BlockchainDataPath>


switch(global.MODE_RUN)
{
    case "DEV_JINN":
        global.JINN_MODE = 1;
        global.NETWORK = "LOCAL-JINN";
        global.SHARD_NAME = "TERA";
        global.LOCAL_RUN = 1;
        //global.START_NETWORK_DATE = 0; - auto search last block number from the database

        //small mining for creating blocks:
        global.CREATE_BLOCK_ON_RECEIVE=1;
        global.USE_MINING = 1;
        global.POW_MAX_PERCENT=5;
        global.COUNT_MINING_CPU = 1;
        global.SIZE_MINING_MEMORY = 65000;
        global.MINING_ACCOUNT=9;
        break;

    case "TEST_JINN":
        global.JINN_MODE = 1;
        global.NETWORK = "TEST-JINN";
        global.SHARD_NAME = "TEST";
        global.TEST_JINN = 1;
        global.TEST_NETWORK=1;

        global.START_NETWORK_DATE = 1593818071532;
        global.CONSENSUS_PERIOD_TIME = 3000;
        
        global.PERIOD_ACCOUNT_HASH = 10;
        global.START_BLOCK_ACCOUNT_HASH = 0;
        global.START_BLOCK_ACCOUNT_HASH3 = 1;
        
        global.SMART_BLOCKNUM_START = 0;
        global.START_MINING = 30;
        global.REF_PERIOD_END = 0;
        global.REF_PERIOD_MINING = 10;
        
        global.MIN_POWER_POW_ACC_CREATE = 8;
        
        global.NEW_ACCOUNT_INCREMENT = 1;
        global.NEW_BLOCK_REWARD1 = 1;
        global.NEW_FORMULA_START = 1;
        global.NEW_FORMULA_KTERA = 3 * 3;
        global.NEW_FORMULA_TARGET1 = 0;
        global.NEW_FORMULA_TARGET2 = 1;
        
        global.NEW_SIGN_TIME = 0;
        
        global.START_BAD_ACCOUNT_CONTROL = 500000;
        global.BLOCKNUM_TICKET_ALGO = 0;
        
        global.UPDATE_CODE_JINN = 0;
        
        global.UPDATE_CODE_1 = 0;
        global.UPDATE_CODE_2 = 0;
        global.UPDATE_CODE_3 = 0;
        global.UPDATE_CODE_4 = 0;
        global.UPDATE_CODE_5 = 0;
        global.UPDATE_CODE_6 = 0;
        global.UPDATE_CODE_7 = 0;

        global.UPDATE_CODE_NEW_ACCHASH = 1;
        
        global.STAT_MODE = 1;
        
        global.UPDATE_CODE_SHARDING = 3160000;
        
        global.TEST_MINING = 1;

        global.COIN_STORE_NUM=975;
        global.COIN_SMART_NUM=298;

        break;
        
    case "AINET_TEST":
        global.JINN_MODE = 1;
        global.NETWORK = "AINET-TEST";
        global.SHARD_NAME = "AINET";
        global.TEST_JINN = 1;
        global.TEST_NETWORK=1;
        // START_NETWORK_DATE не зашиваем — задаётся при запуске через run-ainet-test.js (Date.now())
        global.CONSENSUS_PERIOD_TIME = 3000;

        // AINET-TEST ports (override constant.js defaults: 30000/8800)
        // Не пересекаются с портами по умолчанию 30000/33000/8080/8800
        global.JINN_PORT = 38000;
        global.HTTP_PORT_NUMBER = 8880;
        global.STANDART_PORT_NUMBER = 38000;

        global.PERIOD_ACCOUNT_HASH = 10;
        global.START_BLOCK_ACCOUNT_HASH = 0;
        global.START_BLOCK_ACCOUNT_HASH3 = 1;

        global.SMART_BLOCKNUM_START = 0;
        global.START_MINING = 30;          // AINET: майнинг стартует с блока 30 (дать genesis устаканиться)
        global.REF_PERIOD_END = 0;
        global.REF_PERIOD_MINING = 10;

        global.MIN_POWER_POW_ACC_CREATE = 8;

        // AINET: формула награды теперь через EMISSION_YEAR_RATE/BLOCKS_PER_YEAR (см. constant.js)
        // NEW_FORMULA_START=1 значит новая формула с блока 1; TARGET1=0 — ramp-up отключён
        global.NEW_FORMULA_START = 1;
        global.NEW_FORMULA_TARGET1 = 0;
        global.NEW_FORMULA_TARGET2 = 1;
        global.NEW_FORMULA_KTERA = 3;     // legacy, больше не используется (см. accounts.js DoCoinBaseTR)

        global.NEW_SIGN_TIME = 0;
        global.START_BAD_ACCOUNT_CONTROL = 500000;
        global.BLOCKNUM_TICKET_ALGO = 0;

        global.UPDATE_CODE_JINN = 0;
        global.UPDATE_CODE_1 = 0;
        global.UPDATE_CODE_2 = 0;
        global.UPDATE_CODE_3 = 0;
        global.UPDATE_CODE_4 = 0;
        global.UPDATE_CODE_5 = 0;
        global.UPDATE_CODE_6 = 0;
        global.UPDATE_CODE_7 = 0;

        global.UPDATE_CODE_NEW_ACCHASH = 1;
        global.UPDATE_CODE_SHARDING = 3160000;  // same value as AINET_NET

        // AINET: testnet mining — use CREATE_BLOCK_ON_RECEIVE + lite miner workers
        // (реальный Terahash — см. отдельный case AINET_BENCH)
        global.TEST_MINING = 1;
        global.USE_MINING = 1;
        global.POW_MAX_PERCENT = 5;
        global.COUNT_MINING_CPU = 1;
        global.SIZE_MINING_MEMORY = 65000;
        // TEST_JINN mining: the actual miner is Engine.ID % 256 (jinn-block-mining.js:283,
        // modeling path). With Engine.ID=9 the reward is credited to account 9.
        // Account 16 is created by TRCreateAccount (genesis, block 48).
        // MINING_ACCOUNT stays 16 as the nominal miner account; a non-zero value enables mining.
        global.MINING_ACCOUNT = 16;
        global.CREATE_BLOCK_ON_RECEIVE = 1;  // blocks create on tx — testnet-friendly, не нужно ждать PoW
        break;

    // AINET_NET — main network mode (MAIN_JINN-based, real P2P)
    // TEST_JINN=TEST_NETWORK=0 → без simulation → реальный dial-out.
    // AINET_SEEDS (or SEED_NODES) даёт cold-start bootstrap через JINN_EXTERN.NodeRoot
    //   (jinn-connect.js:34-50). AINET_COMMON_KEY env (общий для кластера) —
    //   доверенный кластер, ноды не банят друг друга.
    // TEST_MINING=1 + MIN_POWER_POW_ACC_CREATE=8 сохраняют низкую сложность
    //   PoW для слабых узлов. AUTODETECT_IP=1 — нода авто-определяет свой IP
    //   (или JINN_IP env). LISTEN_IP=127.0.0.1 — HTTP 8880 не открыт наружу.
    // USE_MINING=0 + CREATE_BLOCK_ON_RECEIVE=0 — только dial-out /
    //   связность, майнинг включается отдельно. Параметры эмиссии —
    //   см. constant.js и accounts.js DoCoinBaseTR.
    case "AINET_NET":
        global.JINN_MODE = 1;                  // MAIN_JINN (не simulation)
        global.NETWORK = "AINET";
        global.SHARD_NAME = "AINET";
        // РЕАЛЬНЫЙ P2P (НЕ simulation): TEST_* выключены
        global.TEST_JINN = 0;
        global.TEST_NETWORK = 0;
        // START_NETWORK_DATE задаётся в run-ainet.js из env AINET_START_DATE (обязательно)
        global.CONSENSUS_PERIOD_TIME = 3000;
        // AINET ports (override constant.js defaults: 30000/8800)
        global.JINN_PORT = 38000;
        global.HTTP_PORT_NUMBER = 8880;
        global.STANDART_PORT_NUMBER = 38000;
        // LISTEN_IP=127.0.0.1 (HTTP 8880 не наружу) — Hard constraint
        global.LISTEN_IP = "127.0.0.1";
        // AUTODETECT_IP=1 (авто-определение внешнего IP) — JINN_IP env переопределяет (run-ainet.js)
        global.AUTODETECT_IP = process.env.JINN_IP ? 0 : 1;
        // CLUSTER trust path: NODES_NAME per-node + CLUSTER_HOT_ONLY=1
        // activates the built-in common-key cluster trust. NODES_NAME is sent
        // (encrypted as "CLUSTER:<name>") in HANDSHAKE; the peer decodes via the
        // shared ArrCommonSecret (sha3(COMMON_KEY+":"+RndHash)) and sets
        // Child.IsCluster=1, Child.Name=<name>, AddrItem.Score=10*1e6 (tera-link.js
        // SetChildName). With CLUSTER_HOT_ONLY=1, only cluster peers can be Hot
        // (CanSetHot); the IsStartingTime 20s gate (in CanSetHot /
        // DoConnectHotLevels) is bypassed for Child.IsCluster=1 / Item.IsCluster=1.
        // NODES_NAME per-node via AINET_NODES_NAME env.
        global.NODES_NAME = process.env.AINET_NODES_NAME || "";
        global.CLUSTER_HOT_ONLY = 0;     // CanSetHot не режет ноды без Name → штатный trust-путь (speed-test/CheckHotItem/20с IsStartingTime окно)
        global.CLUSTER_LEVEL_START = 0;
        // Cold-start seed bootstrap for public nodes.
        // AINET_SEEDS="ip1:port,ip2:port,..." → SHARD_PARAMS.SeedServerArr.
        // Consumed by jinn/tera/index.js:174-178 → Engine.AddNodeAddr per entry.
        // Uses the existing seed mechanism, no new P2P code. SYSTEM_SCORE (5000000) and
        // System:1 match the existing seed convention (jinn/tera/index.js:146,
        // jinn-connect-addr.js:122 — anti-ban immunity + MIN_POW_ADDRES boost).
        // Engine.AddNodeAddr marks the node's own address as Self (jinn-connect-addr.js:137-144);
        // extern-run.js, when used, rebuilds this list without the own IP (Score 10000000).
        if(process.env.AINET_SEEDS)
        {
            global.SHARD_PARAMS.SeedServerArr = process.env.AINET_SEEDS
                .split(',')
                .map(function(s){return s.trim();})
                .filter(Boolean)
                .map(function(spec){
                    var parts = spec.split(':');
                    return {ip: parts[0], port: parseInt(parts[1] || "38000", 10), Score: 5000000, System: 1};
                });
        }
        // COMMON_KEY must be set HERE (not in run-ainet.js) — LOAD_CONST
        // (core/library.js:643) reads DATA-AINET-NET/const.lst and overwrites
        // global.* for every key in CONST_NAME_ARR. If we set COMMON_KEY in
        // run-ainet.js (which runs AFTER LOAD_CONST), const.lst from the
        // previous run will silently overwrite it back to "". Setting it here
        // (case runs before LOAD_CONST) means SAVE_CONST (called later) writes
        // the correct value to const.lst, and LOAD_CONST on next start sees
        // the right value.
        global.COMMON_KEY = process.env.AINET_COMMON_KEY || "";
        // Genesis params (как AINET_TEST для консистентности тестнета)
        global.PERIOD_ACCOUNT_HASH = 10;
        global.START_BLOCK_ACCOUNT_HASH = 0;
        global.START_BLOCK_ACCOUNT_HASH3 = 1;
        global.SMART_BLOCKNUM_START = 0;
        global.START_MINING = 30;              // AINET: майнинг с блока 30
        global.REF_PERIOD_END = 0;
        global.REF_PERIOD_MINING = 10;
        // Low PoW difficulty for account creation in a small network (8 bits vs 16 in MAIN_JINN)
        global.MIN_POWER_POW_ACC_CREATE = 8;
        // Эмиссия + M_boot как в AINET_TEST (см. accounts.js DoCoinBaseTR)
        global.NEW_FORMULA_START = 1;
        global.NEW_FORMULA_TARGET1 = 0;
        global.NEW_FORMULA_TARGET2 = 1;
        global.NEW_FORMULA_KTERA = 3;
        global.NEW_SIGN_TIME = 0;
        global.START_BAD_ACCOUNT_CONTROL = 500000;
        global.BLOCKNUM_TICKET_ALGO = 0;
        // Update gates
        global.UPDATE_CODE_JINN = 0;
        global.UPDATE_CODE_1 = 0; global.UPDATE_CODE_2 = 0; global.UPDATE_CODE_3 = 0;
        global.UPDATE_CODE_4 = 0; global.UPDATE_CODE_5 = 0; global.UPDATE_CODE_6 = 0;
        global.UPDATE_CODE_7 = 0;
        global.UPDATE_CODE_NEW_ACCHASH = 1;
        global.UPDATE_CODE_SHARDING = 3160000;  // network update height (see RELEASE-NOTES). Must be the same on every node.
        // Mining: TEST_MINING=1 (lite, 90MB heap + 1 CPU) — не нагружает слабые узлы.
        // Per-node override: AINET_USE_MINING=1 enables block production on seed-anchor
        // node so passive-sync nodes have active traffic
        // to keep connections hot. Without this, MAX_CONNECT_TIMEOUT (30s) drops idle
        // connections (activity-based hold).
        // Default 0 (no mining) for passive nodes.
        global.USE_MINING = (process.env.AINET_USE_MINING === "1" ? 1 : 0);
        // Mining parameters (per-node config, not consensus).
        // 5% duty cycle слишком мало для малой сети; SIZE_MINING_MEMORY per-node
        // (Terahash memory-hard; heap подбирается под RAM узла, например 4ГБ RAM → 1ГБ heap, 2ГБ → 512МБ).
        // Не консенсус — config. AINET_MINING_MEM env override; дефолт 1ГБ.
        global.POW_MAX_PERCENT = parseInt(process.env.AINET_POW_PERCENT || "30", 10);  // 5→30: 30% × 3сек = 900мс активного майнинга за период; env AINET_POW_PERCENT (стартовое значение до первого Patch-Const в const.lst)
        global.COUNT_MINING_CPU = (process.env.AINET_USE_MINING === "1" ? 1 : 0);
        global.SIZE_MINING_MEMORY = parseInt(process.env.AINET_MINING_MEM || "1073741824", 10);  // 1 ГБ default, per-node AINET_MINING_MEM env
        ToLog("AINET_NET MINING: env=" + (process.env.AINET_USE_MINING || "unset") + " USE_MINING=" + global.USE_MINING + " COUNT_MINING_CPU=" + global.COUNT_MINING_CPU + " SIZE_MINING_MEMORY=" + global.SIZE_MINING_MEMORY);
        global.MINING_ACCOUNT = 0;             // reward account of this node; 0 = not set (set it in the wallet mining panel). Saved to const.lst.
        global.CREATE_BLOCK_ON_RECEIVE = 0;    // блоки только от PoW
        // Hard constraints
        global.USE_AUTO_UPDATE = 0;            // нет авто-апдейта
        break;

    // AINET benchmark mode: real Terahash PoW (НЕ TEST_MINING, НЕ TEST_JINN modeling),
    // lite params для замера хешрейта одного узла. Не для прод-демона.
    // TEST_JINN=0 + LOCAL_RUN=1 → реальный sha3-перебор (jinn-block-mining.js:267 AddToMiningInner),
    // а не modeling (jinn-block-mining.js:283 Engine.AddToMiningInner lite).
    case "AINET_BENCH":
        global.JINN_MODE = 1;
        global.NETWORK = "AINET-BENCH";
        global.SHARD_NAME = "AINET";
        global.TEST_JINN = 0;             // OFF: реальный PoW, не modeling
        global.LOCAL_RUN = 1;             // solo node, фильтр peers на 127.0.0.1
        global.TEST_NETWORK = 1;
        global.START_NETWORK_DATE = Date.now();
        global.CONSENSUS_PERIOD_TIME = 3000;
        global.JINN_PORT = 38001;          // другой порт чтобы не конфликтовать с AINET_TEST
        global.HTTP_PORT_NUMBER = 8881;
        global.STANDART_PORT_NUMBER = 38001;
        global.PERIOD_ACCOUNT_HASH = 10;
        global.START_BLOCK_ACCOUNT_HASH = 0;
        global.START_BLOCK_ACCOUNT_HASH3 = 1;
        global.SMART_BLOCKNUM_START = 0;
        global.START_MINING = 5;           // быстрее — замер хешрейта
        global.REF_PERIOD_END = 0;
        global.REF_PERIOD_MINING = 10;
        global.MIN_POWER_POW_ACC_CREATE = 1;   // низкая сложность acc-create для быстрого tx
        global.NEW_FORMULA_START = 1;
        global.NEW_FORMULA_TARGET1 = 0;
        global.NEW_FORMULA_TARGET2 = 1;
        global.NEW_FORMULA_KTERA = 3;
        global.NEW_SIGN_TIME = 0;
        global.START_BAD_ACCOUNT_CONTROL = 500000;
        global.BLOCKNUM_TICKET_ALGO = 0;
        global.UPDATE_CODE_JINN = 0;
        global.UPDATE_CODE_1 = 0; global.UPDATE_CODE_2 = 0; global.UPDATE_CODE_3 = 0;
        global.UPDATE_CODE_4 = 0; global.UPDATE_CODE_5 = 0; global.UPDATE_CODE_6 = 0;
        global.UPDATE_CODE_7 = 0;
        global.UPDATE_CODE_NEW_ACCHASH = 1;
        global.UPDATE_CODE_SHARDING = 3160000;  // same value as AINET_NET
        // Реальный PoW: TEST_MINING=0 → настоящий sha3-перебор, не lite
        global.TEST_MINING = 0;
        global.USE_MINING = 1;
        global.POW_MAX_PERCENT = 5;
        global.COUNT_MINING_CPU = 1;
        global.SIZE_MINING_MEMORY = 33554432;     // 32 MB heap per worker (bench — реальный PoW)
        global.MINING_ACCOUNT = 9;             // acc 9 (совпадает с Engine.ID=9 в этом режиме)
        global.CREATE_BLOCK_ON_RECEIVE = 1;    // lite: блоки создаются на tx (эмиссия), PoW только на пустые слоты
        break;

    case "MAIN_JINN":
        global.JINN_MODE = 1;
        global.NETWORK = "MAIN-JINN";
        global.SHARD_NAME = "TERA";
        var NewStartNum = 63510000;
        global.UPDATE_CODE_JINN = NewStartNum;
        global.UPDATE_CODE_JINN_KTERA = NewStartNum;
        global.NEW_FORMULA_JINN_KTERA = 3 * 3;
        
        global.CONSENSUS_PERIOD_TIME = 3000;
        var StartSec = 1530446400;
        global.START_NETWORK_DATE = 1000 * (StartSec - NewStartNum * 2);
        
        global.PERIOD_ACCOUNT_HASH = 50;
        global.START_BLOCK_ACCOUNT_HASH = 14500000;
        global.START_BLOCK_ACCOUNT_HASH3 = 24015000;
        global.SMART_BLOCKNUM_START = 10000000;
        
        global.START_MINING = 2 * 1000 * 1000;
        global.REF_PERIOD_END = 30 * 1000 * 1000;
        global.REF_PERIOD_MINING = 1 * 1000 * 1000;
        global.MIN_POWER_POW_ACC_CREATE = 16;
        global.NEW_ACCOUNT_INCREMENT = 22305000;
        global.NEW_BLOCK_REWARD1 = 22500000;
        global.NEW_FORMULA_START = 32000000;
        global.NEW_FORMULA_KTERA = 3;
        global.NEW_FORMULA_TARGET1 = 43000000;
        global.NEW_FORMULA_TARGET2 = 45000000;
        global.NEW_SIGN_TIME = 25500000;
        global.START_BAD_ACCOUNT_CONTROL = 200000;
        global.BLOCKNUM_TICKET_ALGO = 16070000;
        
        global.UPDATE_CODE_1 = 36000000;
        global.UPDATE_CODE_2 = 40000000;
        global.UPDATE_CODE_3 = 43000000;
        global.UPDATE_CODE_4 = 57000000;
        global.UPDATE_CODE_5 = 60000000;
        global.UPDATE_CODE_6 = global.UPDATE_CODE_JINN;
        global.UPDATE_CODE_7 = 64000000;

        
        global.UPDATE_CODE_NEW_ACCHASH = 0;
        
        global.UPDATE_CODE_SHARDING = 68600000;

        global.COIN_STORE_NUM=231941;
        global.COIN_SMART_NUM=136;
        
        break;
        
    default:
        break;
}
