import { store, json, erro, codigoValido, lerCand, lerRascunho, statusDe, limparRespostas, TOLERANCIA_MS } from "../lib/base.mjs";
import { avisarEnvio } from "../lib/email.mjs";

// POST /api/enviar {c, respostas, saidasAba, colagens}
// Grava as respostas finais uma única vez. Depois disso o link fica travado.
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

  const agora = Date.now();
  const rascunho = (await lerRascunho(c)) || {};
  const respostas = limparRespostas(body.respostas);
  const salvas = limparRespostas(rascunho.respostas);
  for (const k of Object.keys(respostas)) if (!respostas[k].trim() && salvas[k].trim()) respostas[k] = salvas[k];
  const envio = {
    respostas,
    enviadoEm: agora,
    tempoSegundos: Math.round((agora - cand.iniciadoEm) / 1000),
    foraDoPrazo: agora > cand.prazo + TOLERANCIA_MS,
    envioAutomatico: Boolean(body.automatico),
    saidasAba: Math.max(Number(rascunho.saidasAba || 0), Number(body.saidasAba || 0)),
    colagens: Math.max(Number(rascunho.colagens || 0), Number(body.colagens || 0)),
    aberturas: cand.aberturas || 1,
  };

  const res = await store().setJSON(`envio/${c}`, envio, { onlyIfNew: true });
  if (res && res.modified === false) return json({ status: "enviado" }, 409);

  try {
    const foto = await store().getWithMetadata(`foto/${c}`, { type: "arrayBuffer" });
    envio.email = await avisarEnvio({ ...cand, codigo: c }, envio, foto);
  } catch (e) {
    envio.email = { enviado: false, motivo: String(e?.message || e).slice(0, 200) };
  }
  await store().setJSON(`envio/${c}`, envio);
  return json({ ok: true, status: "enviado" });
};

export const config = { path: "/api/enviar" };
