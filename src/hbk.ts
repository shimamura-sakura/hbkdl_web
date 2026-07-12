export type Auth = {
  account: string;
  app_version: string;
  device_token: string;
  login_token: string;
};
export async function makeHbk(host = '') {
  const Te = new TextEncoder(), Td = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  const Sb = crypto.subtle, Mk = 'a90f3731745f1c30ee77cb13fc00005a', Ms = `&signatures=${Mk}CkMxWNB666`;
  const Hk = await Sb.importKey('raw', Te.encode(Mk), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
  const K0 = await Sb.importKey('raw', await Sb.digest('sha-256', Te.encode('sD6doAOcW7hm7iaeK6UlcdtAIWlZGlBr')), 'AES-CBC', true, ['decrypt']);
  const K1 = await Sb.importKey('raw', await Sb.digest('sha-256', Te.encode('zG2nSeEfSHfvTCHy5LCcqtBbQehKNLXn')), 'AES-CBC', true, ['decrypt']);
  const Al = { name: 'AES-CBC', iv: new Uint8Array(16) };
  return {
    host,
    async decHbk(db: string) {
      const data = Uint8Array.from(atob(db), c => c.charCodeAt(0));
      try { return JSON.parse(Td.decode(await Sb.decrypt(Al, K0, data))); }
      catch { return JSON.parse(Td.decode(await Sb.decrypt(Al, K1, data))); }
    },
    async decKsy(db: string, k: string) {
      const h = await Sb.digest('sha-256', Te.encode(k));
      const d = Uint8Array.from(atob(db), c => c.charCodeAt(0));
      return Sb.decrypt(Al, await Sb.importKey('raw', h, 'AES-CBC', true, ['decrypt']), d);
    },
    async sign(a: Auth, rand_str?: string) {
      rand_str ??= crypto.getRandomValues(new Uint8Array(8)).toHex();
      const s = encodeURI(`account=${a.account}&app_version=${a.app_version}&rand_str=${rand_str}${Ms}`);
      return { ...a, rand_str, p: new Uint8Array(await Sb.sign('HMAC', Hk, Te.encode(s))).toBase64() };
    },
    async req(a: Auth, api: string, args: Record<string, string>) {
      const body = new URLSearchParams({ ...await this.sign(a), ...args });
      const headers = { 'user-agent': 'Android com.kuangxiangciweimao.novel.c ' + a.app_version };
      const resp = await fetch(this.host + api, { method: 'POST', body, headers });
      if (!resp.ok) throw Error(`HTTP Error: ${resp.status} ${resp.statusText}`);
      const json = await this.decHbk(await resp.text());
      if (parseInt(json.code) !== 100000) throw Error(`CWM Error: ${JSON.stringify(json)}`);
      return json;
    }
  };
};