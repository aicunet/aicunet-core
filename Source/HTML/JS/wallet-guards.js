/* ============================================================================
   AIcuNet wallet-guards.js — ОБЩИЕ предохранители write-путей для обоих
   кошельков: aicunet-wallet.html (node-wallet) и web-wallet.html (лёгкий).
   Закрывает: создание счёта с нулевым ключом, смену ключа, мёртвого получателя,
   расхождение парсеров суммы, нормализацию ключей счетов.
   Зависимости: только window.GetData / window.GetHexFromArr из client.js
   (берутся в момент вызова; сам файл при загрузке ничего не трогает).
   ========================================================================= */
(function () {
  var SECP_N = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";

  // Валидный compressed secp256k1 pubkey: 66 hex, префикс 02/03, тело не нулевое.
  function isValidPubKey(pk) {
    if (typeof pk !== "string") return false;
    var s = pk.toLowerCase();
    if (!/^0[23][0-9a-f]{64}$/.test(s)) return false;
    if (/^0[23]0{64}$/.test(s)) return false; // мёртвый ключ (нулевое тело)
    return true;
  }

  // Валидный приватный ключ: 64-hex скаляр, 0 < d < n. Watch-only 66-hex НЕ принимается.
  function isValidPrivKey(hex) {
    if (typeof hex !== "string") return false;
    var s = hex.toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(s)) return false;
    if (/^0{64}$/.test(s)) return false;
    try { if (BigInt("0x" + s) === BigInt(0) || BigInt("0x" + s) >= BigInt("0x" + SECP_N)) return false; } catch (e) {}
    return true;
  }

  // ЕДИНЫЙ парсер суммы. Подтверждение шло через COIN_FROM_FLOAT ("1e3"->1000),
  // сериализация — через ParseNum/parseInt ("1e3"->1). Канон разбирается одинаково обоими.
  function parseAmount(str) {
    var s = String(str || "").trim().replace(",", ".");
    if (!/^\d{1,12}(\.\d{1,9})?$/.test(s)) return null;
    var p = s.split(".");
    var coin = parseInt(p[0], 10);
    var cent = parseInt(((p[1] || "") + "000000000").substr(0, 9), 10);
    if (!coin && !cent) return null; // amount > 0
    var frac = (p[1] || "").replace(/0+$/, "");
    return { SumCOIN: coin, SumCENT: cent, canon: String(coin) + (frac ? "." + frac : "") };
  }

  // PubKey счёта бывает МАССИВОМ байт — нормализация в 66-hex строку.
  function accPubHex(a) {
    if (a && typeof a.PubKeyStr === "string" && a.PubKeyStr) return a.PubKeyStr.toLowerCase();
    if (a && a.PubKey && typeof window.GetHexFromArr === "function") {
      try { return String(GetHexFromArr(a.PubKey)).toLowerCase(); } catch (e) {}
    }
    return "";
  }

  // Общий барьер: никакой write при неинициализированном состоянии.
  function writesAllowed() {
    if (window.CONFIG_DATA && window.CONFIG_DATA.NotInit) return false;
    if (typeof window.GetCurrentBlockNumByTime === "function" && GetCurrentBlockNumByTime() <= 0) return false;
    return true;
  }

  // Свежий preflight получателя перед подтверждением. cb(errStr|null, Item, pkHex).
  function checkRecipient(ToID, cb) {
    if (typeof window.GetData !== "function") return cb("GetData is not available");
    window.GetData("GetAccountList", { StartNum: +ToID }, function (RD) {
      var It = RD && RD.result === 1 && RD.arr && RD.arr[0];
      if (!It || +It.Num !== +ToID) return cb("Account " + ToID + " was not found in the chain — transfer cancelled");
      var pkHex = accPubHex(It);
      if (!isValidPubKey(pkHex))
        return cb("Account " + ToID + " has a zero or invalid key — nobody can spend from it. Transfer blocked: the coins would be frozen forever.");
      cb(null, It, pkHex);
    });
  }

  window.WalletGuards = { SECP_N: SECP_N, isValidPubKey: isValidPubKey, isValidPrivKey: isValidPrivKey,
    parseAmount: parseAmount, accPubHex: accPubHex, writesAllowed: writesAllowed, checkRecipient: checkRecipient };
})();
