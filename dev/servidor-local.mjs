// Servidor para testar no computador, sem Netlify.
// Uso: npm install && npm run local   ->   http://localhost:8888/admin  (senha: teste)
// Os dados ficam na pasta dev/.dados (apague para zerar).
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pastaDados = process.env.PASTA_DADOS || path.join(raiz, "dev", ".dados");
process.env.ADMIN_PASSWORD ||= "teste";

// Armazenamento simples em arquivos, com a mesma interface usada do Netlify Blobs.
class ArmazemLocal {
  arq(chave) { return path.join(pastaDados, encodeURIComponent(chave)); }
  async get(chave, opts = {}) {
    try {
      const buf = await fs.readFile(this.arq(chave));
      if (opts.type === "json") return JSON.parse(buf.toString("utf8"));
      if (opts.type === "arrayBuffer") return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      return buf.toString("utf8");
    } catch { return null; }
  }
  async getMetadata(chave) {
    try { await fs.access(this.arq(chave)); } catch { return null; }
    try { return { metadata: JSON.parse(await fs.readFile(this.arq(chave) + ".meta", "utf8")) }; } catch { return { metadata: {} }; }
  }
  async getWithMetadata(chave, opts = {}) {
    const data = await this.get(chave, opts);
    if (data == null) return null;
    const m = await this.getMetadata(chave);
    return { data, metadata: m?.metadata || {} };
  }
  async set(chave, dados, opts = {}) {
    await fs.mkdir(pastaDados, { recursive: true });
    if (opts.onlyIfNew && (await this.getMetadata(chave))) return { modified: false };
    const buf = typeof dados === "string" ? Buffer.from(dados) : Buffer.from(dados);
    await fs.writeFile(this.arq(chave), buf);
    await fs.writeFile(this.arq(chave) + ".meta", JSON.stringify(opts.metadata || {}));
    return { modified: true };
  }
  async setJSON(chave, obj, opts = {}) { return this.set(chave, JSON.stringify(obj), opts); }
  async delete(chave) { await fs.rm(this.arq(chave), { force: true }); await fs.rm(this.arq(chave) + ".meta", { force: true }); }
  async list({ prefix = "" } = {}) {
    await fs.mkdir(pastaDados, { recursive: true });
    const nomes = await fs.readdir(pastaDados);
    return { blobs: nomes.filter((n) => !n.endsWith(".meta")).map((n) => decodeURIComponent(n)).filter((k) => k.startsWith(prefix)).map((key) => ({ key })) };
  }
}
globalThis.__STORE_LOCAL__ = new ArmazemLocal();

const funcoes = {};
for (const nome of await fs.readdir(path.join(raiz, "netlify/functions"))) {
  const mod = await import(path.join(raiz, "netlify/functions", nome));
  funcoes[mod.config.path] = mod.default;
}

const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
const porta = Number(process.env.PORTA || 8888);

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${porta}`);
    const fn = funcoes[url.pathname];
    if (fn) {
      const partes = [];
      for await (const p of req) partes.push(p);
      const corpo = partes.length ? Buffer.concat(partes) : undefined;
      const resp = await fn(new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : corpo }), {});
      res.writeHead(resp.status, Object.fromEntries(resp.headers));
      res.end(Buffer.from(await resp.arrayBuffer()));
      return;
    }
    let arquivo = url.pathname;
    if (arquivo.startsWith("/t/")) arquivo = "/teste.html";
    else if (arquivo.startsWith("/f/")) arquivo = "/foto.html";
    else if (arquivo === "/admin") arquivo = "/admin.html";
    else if (arquivo === "/") arquivo = "/index.html";
    const caminho = path.join(raiz, "public", path.normalize(arquivo).replace(/^(\.\.[/\\])+/, ""));
    const dados = await fs.readFile(caminho);
    res.writeHead(200, { "content-type": tipos[path.extname(caminho)] || "application/octet-stream" });
    res.end(dados);
  } catch (e) {
    res.writeHead(e.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain; charset=utf-8" });
    res.end(e.code === "ENOENT" ? "Não encontrado" : String(e));
  }
}).listen(porta, () => console.log(`Teste técnico local: http://localhost:${porta}/admin  (senha: ${process.env.ADMIN_PASSWORD})`));
