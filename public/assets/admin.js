(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  let chave = "";
  try { chave = sessionStorage.getItem("chave-rh") || ""; } catch (_) {}
  const VAGA_PADRAO = "Projetista de instalações elétricas";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const dataHora = (ms) => (ms ? new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
  const minutos = (s) => (s == null ? "" : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`);
  const linkDe = (c) => `${location.origin}/t/${c}`;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 3000);
  }

  async function api(acao, { metodo = "GET", corpo, c, bruto = false } = {}) {
    const q = new URLSearchParams({ acao });
    if (c) q.set("c", c);
    try {
      const r = await fetch(`/api/admin?${q}`, {
        method: metodo,
        headers: { "x-admin-key": chave, "content-type": "application/json" },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      if (r.status === 401) { sair(); toast("Senha incorreta."); return { ok: false, status: 401, dados: {} }; }
      if (bruto) return { ok: r.ok, status: r.status, resposta: r };
      let dados = {};
      try { dados = await r.json(); } catch (_) {}
      return { ok: r.ok, status: r.status, dados };
    } catch (_) {
      return { ok: false, status: 0, dados: { erro: "Sem conexão." } };
    }
  }

  function confirmar(titulo, texto, rotulo = "Confirmar") {
    return new Promise((ok) => {
      const d = $("#dlg");
      $("#dlg-titulo").textContent = titulo;
      $("#dlg-texto").innerHTML = `<p>${esc(texto)}</p>`;
      $("#dlg-sim").textContent = rotulo;
      $("#dlg-sim").onclick = () => { d.close(); ok(true); };
      $("#dlg-nao").onclick = () => { d.close(); ok(false); };
      d.showModal();
    });
  }

  function sair() {
    chave = "";
    try { sessionStorage.removeItem("chave-rh"); } catch (_) {}
    $("#sair").hidden = true;
    telaLogin();
  }
  $("#sair").addEventListener("click", sair);

  function telaLogin() {
    app.innerHTML = `<div class="cartao" style="max-width:420px;margin:40px auto">
      <h1>Painel do RH</h1>
      <p class="muted">Teste técnico da Complementare. Entre com a senha combinada.</p>
      <form id="f-login">
        <input type="password" id="senha" placeholder="Senha" autocomplete="current-password" required>
        <p><button class="botao" type="submit" style="width:100%">Entrar</button></p>
      </form>
    </div>`;
    $("#f-login").addEventListener("submit", async (e) => {
      e.preventDefault();
      chave = $("#senha").value;
      const r = await api("listar");
      if (!r.ok) return;
      try { sessionStorage.setItem("chave-rh", chave); } catch (_) {}
      telaLista(r.dados.itens);
    });
  }

  function selo(item) {
    if (item.status === "enviado") return `<span class="selo enviado">Enviado</span>${item.foraDoPrazo ? ` <span class="selo alerta">Fora do prazo</span>` : ""}`;
    if (item.status === "iniciado") return `<span class="selo iniciado">Em andamento</span>`;
    return `<span class="selo">Não iniciado</span>`;
  }

  function telaLista(itens) {
    $("#sair").hidden = false;
    app.innerHTML = `<div class="cartao">
      <h1>Novo candidato</h1>
      <form id="f-novo" class="grade">
        <div><label for="n-nome">Nome</label><input type="text" id="n-nome" required maxlength="120"></div>
        <div><label for="n-vaga">Vaga</label><input type="text" id="n-vaga" value="${esc(VAGA_PADRAO)}" maxlength="120"></div>
        <div><label for="n-obs">Observação (opcional)</label><input type="text" id="n-obs" maxlength="500"></div>
        <div><button class="botao" type="submit">Gerar link</button></div>
      </form>
      <div id="novo-link"></div>
    </div>
    <div class="cartao">
      <h1>Candidatos</h1>
      ${itens.length ? `<div class="tabela-rolagem"><table id="tabela">
        <thead><tr><th>Nome</th><th>Situação</th><th>Criado</th><th>Enviado</th><th class="num">Tempo</th><th class="num">Saídas da página</th><th>Resultado</th></tr></thead>
        <tbody>${itens.map((i) => `<tr class="linha-acao" data-c="${esc(i.codigo)}">
          <td><strong>${esc(i.nome)}</strong><br><span class="muted">${esc(i.vaga)}</span></td>
          <td>${selo(i)}</td>
          <td>${dataHora(i.criadoEm)}</td>
          <td>${dataHora(i.enviadoEm)}</td>
          <td class="num">${minutos(i.tempoSegundos)}</td>
          <td class="num">${i.saidasAba ?? ""}</td>
          <td>${esc(i.resultado)}</td>
        </tr>`).join("")}</tbody></table></div>
        <p class="muted">Clique numa linha para ver as respostas, a foto, o gabarito e registrar a avaliação.</p>`
        : `<p class="muted">Nenhum candidato ainda. Gere o primeiro link acima.</p>`}
    </div>`;

    $("#f-novo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const r = await api("criar", { metodo: "POST", corpo: { nome: $("#n-nome").value, vaga: $("#n-vaga").value, obs: $("#n-obs").value } });
      if (!r.ok) return toast(r.dados.erro || "Não foi possível criar.");
      const nome = $("#n-nome").value;
      const lista = await api("listar");
      if (lista.ok) telaLista(lista.dados.itens);
      mostrarLinkNovo(r.dados.codigo, nome, lista.dados?.duracaoMin);
    });

    for (const tr of app.querySelectorAll(".linha-acao")) tr.addEventListener("click", () => telaDetalhe(tr.dataset.c));
  }

  function mensagemWhats(nome, codigo, duracao) {
    return `Olá, ${nome}! Segue o link do teste técnico da Complementare: ${linkDe(codigo)}\n\n`
      + `O teste leva ${duracao || 25} minutos e começa quando você clicar em "Começar o teste". Tenha papel, caneta e o celular à mão. O link vale para um único envio.`;
  }

  function mostrarLinkNovo(codigo, nome, duracao) {
    const el = $("#novo-link");
    if (!el) return;
    const msg = mensagemWhats(nome, codigo, duracao);
    el.innerHTML = `<div class="ok">Link criado para <strong>${esc(nome)}</strong>.</div>
      <div class="link-novo"><code>${esc(linkDe(codigo))}</code>
        <button class="botao sec" id="copiar" type="button">Copiar link</button>
        <a class="botao" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Enviar pelo WhatsApp</a>
      </div>`;
    $("#copiar").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(linkDe(codigo)); toast("Link copiado."); } catch (_) { toast("Copie o link manualmente."); }
    });
  }

  async function telaDetalhe(c) {
    app.innerHTML = `<div class="cartao centro muted">Carregando…</div>`;
    const r = await api("ver", { c });
    if (!r.ok) { toast(r.dados.erro || "Não foi possível abrir."); return voltar(); }
    const { cand, status, envio, rascunho, fotoRecebida, gabarito } = r.dados;
    const resp = envio?.respostas || rascunho?.respostas || {};
    const origem = envio ? "Respostas enviadas" : rascunho ? "Rascunho salvo (ainda não enviado)" : "Sem respostas ainda";
    const av = cand.avaliacao || {};
    const opt = (vals, atual) => vals.map((v) => `<option value="${esc(v)}" ${String(atual ?? "") === String(v) ? "selected" : ""}>${v === "" ? "Escolha" : esc(v)}</option>`).join("");
    const sinais = envio ? [
      `Tempo gasto: ${minutos(envio.tempoSegundos)}${envio.foraDoPrazo ? " (enviado depois do prazo)" : ""}${envio.envioAutomatico ? " · envio automático no fim do tempo" : ""}`,
      `Saídas da página: ${envio.saidasAba}`,
      `Tentativas de colar texto: ${envio.colagens}`,
      `Vezes que abriu o teste: ${envio.aberturas}`,
      envio.email ? `Aviso por e-mail: ${envio.email.enviado ? "enviado" : esc(envio.email.motivo || "não enviado")}` : "",
    ].filter(Boolean) : [];

    app.innerHTML = `<p><button class="botao sec" id="voltar" type="button">Voltar à lista</button></p>
    <div class="cartao">
      <h1>${esc(cand.nome)}</h1>
      <p class="sub">${esc(cand.vaga)}${cand.obs ? ` · ${esc(cand.obs)}` : ""}</p>
      <p>${selo({ status, foraDoPrazo: envio?.foraDoPrazo })} <span class="muted">Criado em ${dataHora(cand.criadoEm)}${cand.iniciadoEm ? ` · iniciado em ${dataHora(cand.iniciadoEm)}` : ""}${envio ? ` · enviado em ${dataHora(envio.enviadoEm)}` : ""}</span></p>
      ${sinais.length ? `<ul class="lista">${sinais.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
      <div class="link-novo"><code>${esc(linkDe(c))}</code><button class="botao sec" id="copiar" type="button">Copiar link</button></div>
    </div>
    <div class="det-grade">
      <div class="cartao">
        <h2>${origem}</h2>
        <h3>A1 · foto do desenho</h3>
        <div id="foto">${fotoRecebida ? `<p class="muted">Carregando foto…</p>` : `<p class="muted">Nenhuma foto enviada.</p>`}</div>
        <h3>A2 · o que está errado e qual o risco</h3><div class="resposta">${esc(resp.a2 || "")}</div>
        <h3>A3 · fios do quadro até a tomada</h3><div class="resposta">${esc(resp.a3 || "")}</div>
        <h3>B1 · erros do quadro de cargas</h3><div class="resposta">${esc(resp.b1 || "")}</div>
      </div>
      <div class="cartao">
        <h2>Gabarito</h2>
        <div class="gabarito">${gabarito}</div>
      </div>
    </div>
    <div class="cartao">
      <h2>Avaliação</h2>
      <form id="f-aval">
        <div class="aval">
          <div><label for="a1">A1: pontos certos (de 4)</label><select id="a1">${opt(["", 0, 1, 2, 3, 4], av.a1Pontos)}</select></div>
          <div><label for="b1">B1: erros achados com correção (de 3)</label><select id="b1">${opt(["", 0, 1, 2, 3], av.b1Erros)}</select></div>
          <div><label for="res">Resultado</label><select id="res">${opt(["", "Passa", "Limítrofe", "Não passa"], av.resultado)}</select></div>
        </div>
        <p><label for="obs" class="muted">Observação</label><textarea id="obs" rows="3">${esc(av.observacao || "")}</textarea></p>
        <p class="muted" id="sugestao"></p>
        <button class="botao" type="submit">Salvar avaliação</button>
        ${av.avaliadoEm ? `<span class="muted" style="margin-left:8px">Última avaliação: ${dataHora(av.avaliadoEm)}</span>` : ""}
      </form>
      <div class="acoes-linha">
        <button class="botao sec" id="reiniciar" type="button">Liberar o link de novo</button>
        <button class="botao perigo" id="excluir" type="button">Excluir candidato</button>
      </div>
    </div>`;

    $("#voltar").addEventListener("click", voltar);
    $("#copiar").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(linkDe(c)); toast("Link copiado."); } catch (_) { toast("Copie o link manualmente."); }
    });

    if (fotoRecebida) {
      const f = await api("foto", { c, bruto: true });
      const el = $("#foto");
      if (f.ok && el) {
        const url = URL.createObjectURL(await f.resposta.blob());
        el.innerHTML = `<a href="${url}" target="_blank" rel="noopener"><img class="foto-grande" src="${url}" alt="Desenho A1 de ${esc(cand.nome)}"></a>`;
      } else if (el) el.innerHTML = `<p class="muted">Não foi possível carregar a foto.</p>`;
    }

    const sugerir = () => {
      const a1 = $("#a1").value, b1 = $("#b1").value;
      if (a1 === "" || b1 === "") { $("#sugestao").textContent = ""; return; }
      const A = Number(a1), B = Number(b1);
      let s = "Não passa";
      if (A === 4 && B >= 2) s = "Passa";
      else if ((A === 3 && B >= 2) || (A === 4 && B === 1)) s = "Limítrofe";
      $("#sugestao").textContent = `Pelo critério do gabarito, o resultado seria: ${s}.`;
    };
    $("#a1").addEventListener("change", sugerir);
    $("#b1").addEventListener("change", sugerir);
    sugerir();

    $("#f-aval").addEventListener("submit", async (e) => {
      e.preventDefault();
      const s = await api("avaliar", { metodo: "POST", corpo: { c, a1Pontos: $("#a1").value, b1Erros: $("#b1").value, resultado: $("#res").value, observacao: $("#obs").value } });
      toast(s.ok ? "Avaliação salva." : s.dados.erro || "Não foi possível salvar.");
    });
    $("#reiniciar").addEventListener("click", async () => {
      if (!(await confirmar("Liberar o link de novo?", "As respostas, o rascunho e a foto deste candidato serão apagados e o link volta a abrir o teste do zero. Use só se houve problema técnico.", "Liberar"))) return;
      const s = await api("reiniciar", { metodo: "POST", corpo: { c } });
      toast(s.ok ? "Link liberado." : "Não foi possível liberar.");
      telaDetalhe(c);
    });
    $("#excluir").addEventListener("click", async () => {
      if (!(await confirmar("Excluir candidato?", "Apaga o cadastro, as respostas e a foto. Não dá para desfazer.", "Excluir"))) return;
      const s = await api("excluir", { metodo: "POST", corpo: { c } });
      toast(s.ok ? "Candidato excluído." : "Não foi possível excluir.");
      voltar();
    });
  }

  async function voltar() {
    const r = await api("listar");
    if (r.ok) telaLista(r.dados.itens);
  }

  if (chave) voltar(); else telaLogin();
})();
