/*
 * @project: AINET (AIcuNet)
 * @version: 1.2
 * @license: MIT
 * @copyright: 2026 The AIcuNet developers
 *
 * AINET-TEST entry point.
 * Network = AINET (testnet AINET-TEST),
 * token ticker = AXNT (testnet).
 * Ports 38000 (p2p) / 8880 (HTTP), mining enabled lite (TEST_MINING=1,
 * 1 CPU, 64MB; real Terahash — отдельный case AINET_BENCH).
 * Mode: AINET_TEST (см. const-mode.js case).
 * START_NETWORK_DATE = Date.now() — не в прошлом, нода стартует "с сейчас".
 */

global.MODE_RUN = "AINET_TEST";
global.START_NETWORK_DATE = Date.now();
global.DATA_PATH = "../DATA-AINET-TEST";
global.CODE_PATH = process.cwd();

// AINET-TEST ports (не пересекаются с портами по умолчанию 30000/33000/8080/8800)
global.HTTP_PORT_NUMBER = 8880;
global.JINN_PORT = 38000;

global.TEST_JINN = 1;
global.JINN_MODE = 1;
global.LOCAL_RUN = 0;
global.TEST_NETWORK = 1;

// Параметры майнинга — testnet-friendly defaults
// (USE_MINING / COUNT_MINING_CPU / SIZE_MINING_MEMORY выставляются в const-mode.js case AINET_TEST)
// Наследуем USE_AUTO_UPDATE=0 (AINET: default off) и USE_UPNP=0 (см. constant.js)

require('./process/main-process');
