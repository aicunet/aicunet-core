/*
 * @project: AIcuNet (AINET)
 * @license: MIT
 * @copyright: 2026 The AIcuNet developers
 *
 * AINET INVARIANT GATE.
 *
 * Запускается из process/main-process.js СРАЗУ после require("../core/library"),
 * т.е. когда отработали все слои конфига:
 *   run-ainet.js (globals) -> constant.js (defaults) -> InitParamsArg() [argv]
 *   -> shard.js | const-mode.js -> extern-run.js -> LOAD_CONST(const.lst)
 *   -> AINET_NET env-backstop (library.js:641-658).
 * Гейт видит ИТОГОВЫЕ значения — обойти его конфигом нельзя.
 *
 * Почему гейт отдельно: fail-fast в самом
 * run-ainet.js — не замок, потому что constant.js:243 вызывает InitParamsArg()
 * ПОСЛЕ него, а там генерический сеттер KEY=VALUE (constant.js:306-317)
 * плюс явные STARTNETWORK: / MODE: / PATH: / LISTEN: / IP: / PORT: / FROM:.
 *
 * ДВА КЛЮЧЕВЫХ РЕШЕНИЯ:
 *
 * 1) Якорь — process.argv[1], а НЕ global.MODE_RUN.
 *    argv "MODE:AINET_TEST" переопределяет MODE_RUN в InitParamsArg (constant.js:365),
 *    и гейт с условием (MODE_RUN === "AINET_NET") просто НЕ СРАБОТАЛ БЫ — тихо
 *    пропустив запуск на другой цепи. argv[1] = путь запущенного скрипта,
 *    подделать его из конфига невозможно.
 *
 * 2) argv — БЕЛЫЙ список, а не чёрный.
 *    Чёрный список пропускал бы LISTEN:, IP:, PORT:, HOSTING:, HTTPPORT:,
 *    FROM: (грузит SHARD_PARAMS ПО СЕТИ), TESTJINN, LOCALRUN, TESTRUN, NOPARAMJS.
 *    Перечислять запрещённое — гонка, которую мы проиграем. Разрешаем ровно то,
 *    что реально шлёт штатный скрипт запуска ноды, остальное — стоп.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const AINET_GENESIS = 1783867255035;   // genesis-время сети AIcuNet (FIRST_TIME_BLOCK); фиксировано.

// --- Якорь: гейт обязателен для всего, что стартовало через run-ainet.js ---
var EntryScript = path.basename(String(process.argv[1] || "")).toLowerCase();
var IsAinetEntry = (EntryScript === "run-ainet.js");

// Escape hatch — ТОЛЬКО для отладки на throwaway DATA. В прод-скриптах не ставить.
var Bypass = (process.env.AINET_ALLOW_ANY_GENESIS === "1");

if(IsAinetEntry && !Bypass)
{
    var Err = [];

    // --- 1. Режим не подменён через argv "MODE:" ---
    if(global.MODE_RUN !== "AINET_NET")
        Err.push("MODE_RUN=" + global.MODE_RUN + ", expected AINET_NET (mode overridden via argv MODE:)");

    // --- 2. Та же цепь ---
    if(+global.FIRST_TIME_BLOCK !== AINET_GENESIS)
        Err.push("FIRST_TIME_BLOCK=" + global.FIRST_TIME_BLOCK + ", expected " + AINET_GENESIS + " — THIS IS A DIFFERENT CHAIN");
    if(global.NETWORK !== "AINET" || global.SHARD_NAME !== "AINET")
        Err.push("NETWORK/SHARD_NAME=" + global.NETWORK + "/" + global.SHARD_NAME + ", expected AINET/AINET");

    // --- 3. Та же эмиссия ---
    if(+global.AINET_BLOCK_REWARD !== 3.3)
        Err.push("AINET_BLOCK_REWARD=" + global.AINET_BLOCK_REWARD + ", expected 3.3 — EMISSION MISMATCH");
    if(+global.CONSENSUS_PERIOD_TIME !== 3000)
        Err.push("CONSENSUS_PERIOD_TIME=" + global.CONSENSUS_PERIOD_TIME + ", expected 3000");

    // --- 4. Контрол-API не наружу, авто-апдейт выключен ---
    if(global.LISTEN_IP !== "127.0.0.1")
        Err.push("LISTEN_IP=" + global.LISTEN_IP + " — control API 8880 is exposed to the network");
    if(+global.USE_AUTO_UPDATE !== 0)
        Err.push("USE_AUTO_UPDATE=" + global.USE_AUTO_UPDATE + " — remote code auto-update must be off (0)");

    // --- 5. shard.js в DATA ПОЛНОСТЬЮ обходит const-mode.js (constant.js:250-253) ---
    try
    {
        if(fs.existsSync(global.DATA_PATH + "/shard.js"))
            Err.push("shard.js found in DATA — it replaces const-mode.js entirely. Remove the file.");
    }
    catch(e)
    {
    }

    // --- 6. argv: белый список. Всё, чего тут нет, — стоп ---
    // Разрешено ровно то, что шлёт штатный скрипт запуска ноды.
    for(var i = 2; i < process.argv.length; i++)
    {
        var A = String(process.argv[i]);
        var U = A.toUpperCase();
        var Allowed = (/^HTTP_HOSTING_PORT=\d+$/.test(U) || U.indexOf("PASSWORD:") === 0);
        if(!Allowed)
            Err.push("Forbidden argv: \"" + A + "\". In AINET_NET the configuration comes ONLY from env and const.lst. "
                   + "Start the node only with the standard start script");
    }

    if(Err.length)
    {
        console.error("");
        console.error("=============== AINET GUARD: START REFUSED ===============");
        for(var j = 0; j < Err.length; j++)
            console.error("  x " + Err[j]);
        console.error("==========================================================");
        console.error("");
        process.exit(1);
    }

    ToLog("AINET GUARD OK: genesis=" + global.FIRST_TIME_BLOCK
        + " reward=" + global.AINET_BLOCK_REWARD
        + " listen=" + global.LISTEN_IP
        + " mining=" + global.USE_MINING);
}
