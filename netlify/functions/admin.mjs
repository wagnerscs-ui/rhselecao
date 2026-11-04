import { store, json, erro, codigoValido, novoCodigo, lerCand, lerEnvio, lerRascunho, temFoto, statusDe, senhaConfere, limparTexto, DURACAO_MIN } from "../lib/base.mjs";
import { GABARITO_HTML, VAGA_PADRAO } from "../lib/conteudo.mjs";

// /api/admin?acao=...   (cabeçalho x-admin-key = ADMIN_PASSWORD)
//   GET  listar                     lista de candidatos com situação
//   POST criar   {nome, vaga, obs}  cria o link de um candidato
//   GET  ver&c=                     respostas, rascunho, sinais e gabarito
//   GET  foto&c=                    imagem do desenho A1
//   POST avaliar {c, a1Pontos, b1Erros, resultado, observacao}
//   POST reiniciar {c}              libera o link de novo (apaga respostas e foto)
//   POST excluir {c}                apaga o candidato e tudo dele
export default async (req) => {
  if (!process.env.ADMIN_PASSWORD) return erro("Defina a variável ADMIN_PASSWORD na Netlify.", 500);
  if (!senhaConfere(req)) return erro("Senha incorreta.", 401);

  const url = new URL(req.url);
  const acao = url.searchParams.get("acao");
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const c = String(url.searchParams.get("c") || body.c || "").toUpperCase();

  if (acao === "listar" && req.method === "GET") {
    const { blobs } = await store().list({ prefix: "cand/" });
    const itens = [];
    for (const b of blobs) {
      const cod = b.key.slice(5);
      const cand = await lerCand(cod);
      if (!cand) continue;
      const envio = await lerEnvio(cod);
      itens.push({
        codigo: cod,
        nome: cand.nome,
        vaga: cand.vaga,
        criadoEm: cand.criadoEm,
        iniciadoEm: cand.iniciadoEm || null,
        status: envio ? "enviado" : cand.iniciadoEm ? "iniciado" : "novo",
        enviadoEm: envio?.enviadoEm || null,
        tempoSegundos: envio?.tempoSegundos ?? null,
        foraDoPrazo: envio?.foraDoPrazo || false,
        saidasAba: envio?.saidasAba ?? null,
        resultado: cand.avaliacao?.resultado || "",
      });
    }
    itens.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    return json({ itens, duracaoMin: DURACAO_MIN });
  }

  if (acao === "criar" && req.method === "POST") {
    const nome = limparTexto(body.nome).trim().slice(0, 120);
    if (!nome) return erro("Informe o nome do candidato.", 400);
    let cod = novoCodigo();
    for (let i = 0; i < 5 && (await lerCand(cod)); i++) cod = novoCodigo();
    const cand = {
      nome,
      vaga: limparTexto(body.vaga).trim().slice(0, 120) || VAGA_PADRAO,
      obs: limparTexto(body.obs).trim().slice(0, 500),
      duracaoMin: DURACAO_MIN,
      criadoEm: Date.now(),
    };
    await store().setJSON(`cand/${cod}`, cand, { onlyIfNew: true });
    return json({ codigo: cod, cand });
  }

  if (!codigoValido(c)) return erro("Código inválido.", 400);
  const cand = await lerCand(c);
  if (!cand) return erro("Candidato não encontrado.", 404);

  if (acao === "ver" && req.method === "GET") {
    const [envio, rascunho, foto, status] = await Promise.all([lerEnvio(c), lerRascunho(c), temFoto(c), statusDe(c, cand)]);
    return json({ codigo: c, cand, status, envio, rascunho, fotoRecebida: Boolean(foto), gabarito: GABARITO_HTML });
  }

  if (acao === "foto" && req.method === "GET") {
    const foto = await store().getWithMetadata(`foto/${c}`, { type: "arrayBuffer" });
    if (!foto) return erro("Sem foto.", 404);
    return new Response(foto.data, {
      headers: { "content-type": foto.metadata?.contentType || "image/jpeg", "cache-control": "no-store" },
    });
  }

  if (acao === "avaliar" && req.method === "POST") {
    const resultados = ["", "Passa", "Limítrofe", "Não passa"];
    const n = (v, max) => (v === "" || v == null ? null : Math.max(0, Math.min(max, Number(v) || 0)));
    cand.avaliacao = {
      a1Pontos: n(body.a1Pontos, 4),
      b1Erros: n(body.b1Erros, 3),
      resultado: resultados.includes(body.resultado) ? body.resultado : "",
      observacao: limparTexto(body.observacao).slice(0, 2000),
      avaliadoEm: Date.now(),
    };
    await store().setJSON(`cand/${c}`, cand);
    return json({ ok: true, avaliacao: cand.avaliacao });
  }

  if (acao === "reiniciar" && req.method === "POST") {
    await Promise.all([store().delete(`envio/${c}`), store().delete(`rasc/${c}`), store().delete(`foto/${c}`)]);
    delete cand.iniciadoEm;
    delete cand.prazo;
    delete cand.aberturas;
    cand.reiniciadoEm = Date.now();
    await store().setJSON(`cand/${c}`, cand);
    return json({ ok: true });
  }

  if (acao === "excluir" && req.method === "POST") {
    await Promise.all(["envio", "rasc", "foto", "cand"].map((p) => store().delete(`${p}/${c}`)));
    return json({ ok: true });
  }

  return erro("Ação desconhecida.", 400);
};

export const config = { path: "/api/admin" };
