/*
 * @project: AINET (AIcuNet)
 * @version: 1.2
 * @license: MIT
 * @copyright: 2026 The AIcuNet developers
 *
 * AINET-BENCH entry point — single-node PoW benchmark.
 * Real Terahash PoW (TEST_MINING=0), 1 CPU, 64 MB heap.
 * Порт 8881 (не конфликтует с AINET-TEST на 8880).
 * Замер: H/s одного узла + RAM + CPU. Без претензий на mainnet-quality.
 */

global.MODE_RUN = "AINET_BENCH";
global.START_NETWORK_DATE = Date.now();
global.DATA_PATH = "../DATA-AINET-BENCH";
global.CODE_PATH = process.cwd();

global.HTTP_PORT_NUMBER = 8881;
global.JINN_PORT = 38001;

global.TEST_JINN = 0;
global.LOCAL_RUN = 1;
global.TEST_NETWORK = 1;

require('./process/main-process');
