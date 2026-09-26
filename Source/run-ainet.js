/*
 * @project: AINET (AIcuNet) — main network entry point (MAIN_JINN-based, real P2P)
 * @version: 1.2
 * @license: MIT
 * @copyright: 2026 The AIcuNet developers
 *
 * AINET_NET entry point.
 * TEST_JINN=TEST_NETWORK=0 → без simulation → реальный dial-out.
 * AINET_SEEDS env (or SEED_NODES) gives cold-start bootstrap.
 * AINET_COMMON_KEY env (per cluster) — доверенный кластер узлов.
 * TEST_MINING=1 + MIN_POWER_POW_ACC_CREATE=8 (в const-mode.js case) сохраняют
 *   низкую сложность для слабых узлов.
 * AUTODETECT_IP=1 — авто-определение публичного IP ноды.
 *   Если JINN_IP env задан — переопределяет (для тестов / приватных адресов).
 * LISTEN_IP=127.0.0.1 — Hard constraint (HTTP 8880 не наружу).
 * USE_AUTO_UPDATE=0 — удалённое авто-обновление кода отключено (security).
 * Ports 38000 (p2p) / 8880 (HTTP).
 */

global.MODE_RUN = "AINET_NET";
// AINET_NET (multi-node): all nodes must share the same START_NETWORK_DATE
// for chain-ID compatibility (each Date.now() per process → different genesis
// → silent drop after TCP handshake).
// Set AINET_START_DATE in env (one fixed value for whole cluster).
// guard: Date.now()-fallback УБРАН. Без AINET_START_DATE каждый процесс
// порождал СВОЙ genesis -> своя цепь -> тихий дроп после TCP handshake.
// Genesis нельзя угадывать. Только явное значение из env.
if(!process.env.AINET_START_DATE)
{
    console.error("FATAL: AINET_START_DATE is not set. The genesis time must be given explicitly.");
    console.error("       Set AINET_START_DATE in the environment of the node (same value on every node of the network).");
    process.exit(1);
}
global.START_NETWORK_DATE = parseInt(process.env.AINET_START_DATE, 10);
if(!Number.isInteger(global.START_NETWORK_DATE) || global.START_NETWORK_DATE < 1e12)
{
    console.error("FATAL: AINET_START_DATE is invalid: " + process.env.AINET_START_DATE);
    process.exit(1);
}
global.DATA_PATH = "../DATA-AINET-NET";
global.CODE_PATH = process.cwd();

// AINET ports
global.HTTP_PORT_NUMBER = 8880;
global.JINN_PORT = 38000;

// AUTODETECT_IP=1 — нода авто-определяет свой публичный IP.
// JINN_IP env — override (для тестов / приватных адресов).
global.AUTODETECT_IP = 1;
if (process.env.JINN_IP) {
    global.JINN_IP = process.env.JINN_IP;
    global.AUTODETECT_IP = 0;
}

// COMMON_KEY — общий ключ кластера узлов.
// Семантика COMMON_KEY: ноды с одинаковым ключом
// не банят друг друга, приоритетные коннекты (cluster trust).
// Fallback: пустая строка (ноды работают, но без cluster boost).
if (process.env.AINET_COMMON_KEY) {
    global.COMMON_KEY = process.env.AINET_COMMON_KEY;
} else {
    global.COMMON_KEY = "";
}

// LISTEN_IP=127.0.0.1 — Hard constraint (HTTP 8880 только на loopback, не наружу)
global.LISTEN_IP = "127.0.0.1";

// Real P2P, не simulation
global.TEST_JINN = 0;
global.TEST_NETWORK = 0;
global.TEST_MINING = 1;  // lite mining (90MB heap + 1 CPU), не давит слабые узлы

global.JINN_MODE = 1;     // MAIN_JINN mode
global.LOCAL_RUN = 0;     // мульти-node через TCP, не loopback only

// Hard constraint: авто-апдейт выключен
global.USE_AUTO_UPDATE = 0;

// const-mode.js case AINET_NET делает всю остальную инициализацию
// (genesis, эмиссия, M_boot, mining params, update gates).

require('./process/main-process');
