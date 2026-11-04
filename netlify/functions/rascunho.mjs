import { store, json, erro, codigoValido, lerCand, statusDe, limparRespostas, TOLERANCIA_MS } from "../lib/base.mjs";

// POST /api/rascunho {c, respostas, saidasAba, colagens}
// Salva o que o candidato já escreveu, para não perder nada se a página fechar.
export default async (req) => {
  if (req.method !== "POST") return erro("Método não permitido.", 405);
  const body = await req.json().catch(() => ({}));
  const c = String(body.c || "").toUpperCase();
  if (!codigoValido(c)) return erro("Link inválido.", 404);
  const cand = await lerCand(c);
  if (!cand) return erro("Link inválido.", 404);
  const status = await statusDe(c, cand);
  if (status === "enviado") return json({ status }, 409);
  if (status !== "iniciado") return erro("Teste não iniciado.", 400);
  if (Date.now() > cand.prazo + TOLERANCIA_MS) return json({ status: "prazo-esgotado" }, 410);

  const anterior = (await store().get(`rasc/${c}`, { type: "json" })) || {};
  await store().setJSON(`rasc/${c}`, {
    respostas: limparRespostas(body.respostas),
    saidasAba: Math.max(Number(anterior.saidasAba || 0), Number(body.saidasAba || 0)),
    colagens: Math.max(Number(anterior.colagens || 0), Number(body.colagens || 0)),
    salvoEm: Date.now(),
  });
  return json({ ok: true, restanteMs: cand.prazo - Date.now() });
};

export const config = { path: "/api/rascunho" };
