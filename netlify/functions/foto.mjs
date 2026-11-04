import { store, json, erro, codigoValido, lerCand, statusDe, temFoto, TOLERANCIA_MS, MAX_FOTO_BYTES } from "../lib/base.mjs";

// GET  /api/foto?c=CODIGO  -> {status, recebida}
// POST /api/foto?c=CODIGO  -> corpo = imagem (image/jpeg ou image/png)
export default async (req) => {
  const url = new URL(req.url);
  const c = String(url.searchParams.get("c") || "").toUpperCase();
  if (!codigoValido(c)) return erro("Link inválido.", 404);
  const cand = await lerCand(c);
  if (!cand) return erro("Link inválido.", 404);
  const status = await statusDe(c, cand);

  if (req.method === "GET") {
    const recebida = await temFoto(c);
    return json({ status, nome: cand.nome, recebida: Boolean(recebida), recebidaEm: typeof recebida === "number" ? recebida : null });
  }
  if (req.method !== "POST") return erro("Método não permitido.", 405);
  if (status === "enviado") return json({ status }, 409);
  if (status !== "iniciado") return erro("Comece o teste no computador antes de enviar a foto.", 400);
  if (Date.now() > cand.prazo + TOLERANCIA_MS) return json({ status: "prazo-esgotado" }, 410);

  const tipo = String(req.headers.get("content-type") || "");
  if (!/^image\/(jpeg|png|webp)$/.test(tipo)) return erro("Envie uma imagem JPG ou PNG.", 415);
  const dados = await req.arrayBuffer();
  if (!dados.byteLength) return erro("Imagem vazia.", 400);
  if (dados.byteLength > MAX_FOTO_BYTES) return erro("Imagem muito grande.", 413);

  const recebidaEm = Date.now();
  await store().set(`foto/${c}`, dados, { metadata: { contentType: tipo, recebidaEm, bytes: dados.byteLength } });
  return json({ ok: true, recebidaEm });
};

export const config = { path: "/api/foto" };
