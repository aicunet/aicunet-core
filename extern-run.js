/*
  * @project: AIcuNet (AINET)
  * @copyright: 2026 The AIcuNet developers
  * @license: MIT
  *
  * SHARD_PARAMS.SeedServerArr activation.
  * Self-IP filter.
  *
  * Зачем: jinn/tera/index.js:174-180 ждёт SHARD_PARAMS.SeedServerArr
  * и вызывает Engine.AddNodeAddr для каждого entry (AddrBook, System:1).
  * Это BYPASS ограничения NodeRoot 30-tick cap (jinn-connect.js:46):
  * Engine.DoConnectLevels() каждый tick сканирует AddrBook и диалит
  * disconnected peers с rate-limit. SeedServerArr — designed full-mesh bootstrap.
  *
  * Гейт: только MODE_RUN === "AINET_NET". Другие режимы (DEV_JINN, TEST_JINN,
  * AINET_TEST, BENCH, mainnet) не затрагиваются. Если AINET_SEEDS env пуст —
  * no-op (backward compat).
  *
  * Self-IP filter: каждая нода раньше добавляла СВОЙ IP в AddrBook
  * (наблюдалось в multi-node тестах). Engine.AddNodeAddr
  * помечает AddrItem.Self=1 (jinn-connect-addr.js:189-190), и CanConnect
  * отбивает self-dial с "Cannt self connect" (jinn-connect.js:188-195) — НО
  * self-присутствие в AddrBook всё равно шумит: AddrItem.Blocks score накапливается
  * на self (Score 10M+), NodeSyncStatus шумит, лог-спам. Корректнее —
  * не добавлять self в список с самого начала. Engine потом сам определит self
  * через AUTODETECT_IP=1 и Engine.SetOwnIP — self-detect сохраняется.
  *
  * Определение self-IP (3 fallback):
  *   1. process.env.AINET_SELF_IP (per-node, точный публичный IP — рекомендуется)
  *   2. process.env.JINN_IP (per-node override, см. run-ainet.js)
  *   3. os.networkInterfaces() external IPv4 (на VPS = private IP; fallback best-effort)
  *
  * Если selfIp не определён (все 3 fallback пусты) — фильтр no-op, поведение как
  * без фильтра (self попадает в AddrBook). Безопасно, но лучше задать AINET_SELF_IP в env.
  */
'use strict';

if(global.MODE_RUN !== "AINET_NET")
    return;
if(!process.env.AINET_SEEDS)
    return;

// Resolve self-IP для фильтрации SeedServerArr.
var selfIp = "";
if(process.env.AINET_SELF_IP)
    selfIp = process.env.AINET_SELF_IP.trim();
else
    if(process.env.JINN_IP)
        selfIp = process.env.JINN_IP.trim();
    else
    {
        // Fallback: external IPv4 из networkInterfaces.
        // На VPS это private IP (10.x/172.16.x/192.168.x) — SeedServerArr содержит
        // public IP, фильтр не сработает. Поэтому AINET_SELF_IP рекомендуется.
        try
        {
            var os = require("os");
            var ifaces = os.networkInterfaces();
            for(var name in ifaces)
            {
                for(var i = 0; i < ifaces[name].length; i++)
                {
                    var iface = ifaces[name][i];
                    if(iface.family === "IPv4" && !iface.internal)
                    {
                        selfIp = iface.address;
                        break;
                    }
                }
                if(selfIp) break;
            }
        }
        catch(e)
        {
            // os/networkInterfaces unavailable — no-op filter
        }
    }

if(selfIp)
{
    ToLog("SEED-SELF-FILTER: filtering self-ip=" + selfIp + " from SeedServerArr");
}

global.SHARD_PARAMS = global.SHARD_PARAMS || {};
global.SHARD_PARAMS.SeedServerArr = process.env.AINET_SEEDS
    .split(",")
    .map(function (entry)
    {
        var parts = entry.trim().split(":");
        return {
            ip: parts[0],
            port: parseInt(parts[1] || "38000", 10),
            Score: 10000000,
            System: 1
        };
    })
    .filter(function (entry)
    {
        // Filter out self-IP: skip entry where ip matches our self.
        // Engine self-detect (AUTODETECT_IP=1) handles Engine.SetOwnIP separately.
        return !selfIp || entry.ip !== selfIp;
    });
