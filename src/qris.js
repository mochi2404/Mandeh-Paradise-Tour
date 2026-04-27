export function toCRC16(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  let hex = (crc & 0xffff).toString(16).toUpperCase();
  if (hex.length === 3) hex = `0${hex}`;
  return hex;
}

export function buildDynamicQrisString(baseQris, amount) {
  const qris = String(baseQris || "").trim();
  if (!qris) throw new Error("QRIS string belum diisi");
  const nominal = String(amount || "").replace(/[^0-9]/g, "");
  if (!nominal) throw new Error("Nominal QRIS tidak valid");

  const qris2 = qris.slice(0, -4);
  const replaceQris = qris2.replace("010211", "010212");
  const pecahQris = replaceQris.split("5802ID");
  const uang = `54${`0${nominal.length}`.slice(-2)}${nominal}5802ID`;
  const payload = `${pecahQris[0]}${uang}${pecahQris[1]}`;
  return payload + toCRC16(payload);
}
