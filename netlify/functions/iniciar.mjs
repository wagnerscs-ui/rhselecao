import { store, json, erro, codigoValido, lerCand, lerRascunho, statusDe, temFoto, DURACAO_MIN } from "../lib/base.mjs";
import { PERGUNTAS_HTML, TITULO } from "../lib/conteudo.mjs";
import QRCode from "qrcode";

// GET  /api/iniciar?c=CODIGO  -> situação do link (sem mostrar perguntas)
// POST /api/iniciar {c}       -> inicia ou retoma o teste e devolve as perguntas
export default async (req) => {
  const url = new URL(req.url);
  let c = url.searchParams.get("c");
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    c = body.c;
  }
  c = String(c || "").toUpperCase();
  if (!codigoValido(c)) return erro("Link inválido.", 404);

  const cand = await lerCand(c);
  if (!cand) return erro("Link inválido.", 404);
  const status = await statusDe(c, cand);

  if (req.method === "GET") {
    return json({ status, nome: cand.nome, vaga: cand.vaga, titulo: TITULO, duracaoMin: cand.duracaoMin || DURACAO_MIN });
  }
  if (req.method !== "POST") return erro("Método não permitido.", 405);

  if (status === "enviado") return json({ status }, 409);

  const agora = Date.now();
  if (status === "novo") {
    const dur = cand.duracaoMin || DURACAO_MIN;
    cand.iniciadoEm = agora;
    cand.prazo = agora + dur * 60 * 1000;
    cand.aberturas = 1;
    cand.agenteNavegador = String(req.headers.get("user-agent") || "").slice(0, 300);
  } else {
    cand.aberturas = (cand.aberturas || 1) + 1;
  }
  await store().setJSON(`cand/${c}`, cand);

  const rascunho = await lerRascunho(c);
  const linkFoto = `${url.origin}/f/${c}`;
  const qrFoto = await QRCode.toString(linkFoto, { type: "svg", margin: 1, width: 160 });
  return json({
    linkFoto,
    qrFoto,
    status: "iniciado",
    nome: cand.nome,
    titulo: TITULO,
    agora,
    prazo: cand.prazo,
    perguntas: PERGUNTAS_HTML,
    rascunho: rascunho?.respostas || null,
    saidasAba: rascunho?.saidasAba || 0,
    colagens: rascunho?.colagens || 0,
    fotoRecebida: Boolean(await temFoto(c)),
  });
};

export const config = { path: "/api/iniciar" };
