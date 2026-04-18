const LIMIT = 10000;

function toFormUrlEncoded(obj) {
  return Object.keys(obj)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
    .join("&");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class Translator {
  constructor(delay = 100) {
    this.delay = delay;
    this.requestCounter = 0;
    this.IID = null;
    this.IG = null;
    this.token = null;
    this.key = null;

    this.nextTokenUpdate = null;
    this.refreshPromise = null;

    this.IIDRegex = /data-iid="([^"]+)"/;
    this.IGRegex = /"ig":"([^"]+)"/;
    this.keyTokenAndIntervalRegex = /var params_AbusePreventionHelper = \[(\d+),"([^"\[\],]+)",(\d+)/;
  }
  
  async refreshTokens() {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      const res = await fetch("https://www.bing.com/translator");
      if (!res.ok) throw new Error("Failed to load Bing translator");

      const html = await res.text();

      const iidMatch = html.match(this.IIDRegex);
      const igMatch = html.match(this.IGRegex);
      const ktMatch = html.match(this.keyTokenAndIntervalRegex);

      if (!iidMatch || !igMatch || !ktMatch) {
        throw new Error("Token extraction failed");
      }

      this.IID = iidMatch[1];
      this.IG = igMatch[1];

      this.token = ktMatch[2];
      this.key = ktMatch[1];

      const interval = parseInt(ktMatch[3], 10);
      this.nextTokenUpdate = Date.now() + interval - 1000;

      this._refreshPromise = null;
    })();

    return this._refreshPromise;
  }


  async translatePart(text, from, to) {
    try {
      const now = Date.now();

      if (!this.nextTokenUpdate || now > this.nextTokenUpdate) {
        await this.refreshTokens();
      }

      await sleep(this.delay);

      const url =
        `https://www.bing.com/ttranslatev3?isVertical=1&=&IG=${this.IG}` +
        `&IID=${this.IID}.${++this.requestCounter}`;

      console.log(url);
      
      const body = toFormUrlEncoded({
        key: this.key,
        token: this.token,
        fromLang: from,
        to: to,
        text,
      });

      let res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
      });

      if (!res.ok) return null;

      const json = await res.json();

      return json?.[0]?.translations?.[0]?.text ?? null;
    } catch (e) {
      console.error("Bing error:", e);
      return null;
    }
  }

  async translate(text, from, to) {
    if (!text?.trim()) return null;

    if (!from || !to) return null;

    // Best case when text length is small enough to fit limit
    if (text.length <= LIMIT) {
      return this.translatePart(text, from, to);
    }

    let result = "";
    let i = 0;

    while (i < text.length) {
      let part = text.slice(i, i + LIMIT);

      const cut = Math.max(
        part.lastIndexOf(" "),
        part.lastIndexOf("\t")
      );

      if (cut > 0 && cut < part.length) {
        i -= part.length - cut - 1;
        part = part.slice(0, cut);
      }

      const translated = await this.translatePart(part, from, to);
      if (translated) result += translated;

      i += LIMIT;
    }

    return result;
  }
}