(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $("#app");
  const relogio = $("#relogio");

  const doCaminho = location.pathname.match(/\/t\/([A-Za-z0-9]{8})/);
  const codigo = ((doCaminho && doCaminho[1]) || new URLSearchParams(location.search).get("c") || "").toUpperCase();

  const est = { prazo: 0, defasagem: 0, saidas: 0, colagens: 0, enviando: false, enviado: false, fotoOk: false, ultimoSalvo: 0, timer: null, autosave: null, poll: null };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  async function api(caminho, opcoes = {}) {
    try {
      const r = await fetch(caminho, { ...opcoes, headers: { "content-type": "application/json", ...(opcoes.headers || {}) } });
      let dados = {};
      try { dados = await r.json(); } catch (_) {}
      return { ok: r.ok, status: r.status, dados };
    } catch (e) {
      return { ok: false, status: 0, dados: { erro: "Sem conexão. Verifique a internet." } };
    }
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 3200);
  }

  function tela(html) { app.innerHTML = html; window.scrollTo(0, 0); }

  function telaInvalido() {
    tela(`<div class="cartao centro"><h1>Link inválido</h1><p class="muted">Confira o link enviado pelo RH. Se o problema continuar, fale com quem enviou o teste.</p></div>`);
  }

  function telaEnviado(agora) {
    pararTudo();
    relogio.hidden = true;
    tela(`<div class="cartao centro">
      <h1>${agora ? "Teste enviado" : "Este teste já foi enviado"}</h1>
      <p class="grande">Obrigado pela participação.</p>
      <p class="muted">${agora ? "Suas respostas foram registradas. O RH vai entrar em contato com o retorno." : "Este link só pode ser usado uma vez e já não abre o teste."}</p>
    </div>`);
  }

  function telaInicio(d) {
    const retomar = d.status === "iniciado";
    tela(`<div class="cartao">
      <h1>${esc(d.titulo)}</h1>
      <p class="sub">${esc(d.vaga)}</p>
      <p>Olá, ${esc(d.nome)}.</p>
      ${retomar
        ? `<div class="aviso">Seu teste já foi iniciado e o tempo continua contando. As respostas que você já escreveu foram guardadas.</div>`
        : `<p>Antes de começar:</p>
      <ul class="lista">
        <li>O teste tem <strong>${d.duracaoMin} minutos</strong>, contados a partir do botão abaixo. Quando o tempo acabar, as respostas são enviadas automaticamente.</li>
        <li>Tenha à mão <strong>papel, caneta e o celular</strong>: uma das questões pede um desenho à mão e a foto dele.</li>
        <li>Responda sem consultar internet, colegas ou outras ferramentas. Colar texto não é permitido.</li>
        <li>Fique nesta página até o fim. As saídas da página ficam registradas.</li>
        <li>As respostas são salvas sozinhas enquanto você escreve. Se a conexão cair, abra o mesmo link para continuar.</li>
        <li>O link vale para um único envio.</li>
      </ul>
      <p class="muted">Suas respostas serão usadas só neste processo seletivo da Complementare.</p>`}
      <p><button class="botao" id="comecar" type="button">${retomar ? "Continuar o teste" : "Começar o teste"}</button></p>
    </div>`);
    $("#comecar").addEventListener("click", iniciar);
  }

  async function iniciar() {
    const b = $("#comecar");
    if (b) { b.disabled = true; b.textContent = "Abrindo…"; }
    const r = await api("/api/iniciar", { method: "POST", body: JSON.stringify({ c: codigo, origem: location.origin }) });
    if (r.status === 409) return telaEnviado(false);
    if (!r.ok) {
      if (r.status === 404) return telaInvalido();
      toast(r.dados.erro || "Não foi possível abrir o teste. Tente de novo.");
      if (b) { b.disabled = false; b.textContent = "Tentar de novo"; }
      return;
    }
    montarTeste(r.dados);
  }

  function montarTeste(d) {
    est.prazo = d.prazo;
    est.defasagem = Date.now() - d.agora;
    est.saidas = d.saidasAba || 0;
    est.colagens = d.colagens || 0;
    est.fotoOk = Boolean(d.fotoRecebida);

    tela(`<div class="cartao"><h1>${esc(d.titulo)}</h1><p class="sub">${esc(d.nome)}</p>${d.perguntas}</div>`);
    document.body.insertAdjacentHTML("beforeend", `<div class="rodape-fixo" id="rodape"><div class="dentro">
      <span class="salvo" id="salvo">As respostas são salvas automaticamente.</span>
      <button class="botao" id="enviar" type="button">Enviar respostas</button>
    </div></div>`);

    if (d.rascunho) for (const ta of $$("textarea[data-campo]")) ta.value = d.rascunho[ta.dataset.campo] || "";

    montarFoto(d);

    for (const ta of $$("textarea[data-campo]")) {
      ta.addEventListener("input", () => { est.sujo = true; });
      ta.addEventListener("drop", (e) => { e.preventDefault(); est.colagens++; toast("Arrastar texto não é permitido neste teste."); });
    }
    document.addEventListener("paste", (e) => {
      if (e.target && e.target.matches && e.target.matches("textarea")) {
        e.preventDefault();
        est.colagens++;
        est.sujo = true;
        toast("Colar texto não é permitido neste teste.");
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (est.enviado) return;
      if (document.hidden) { est.saidas++; salvar(true); }
    });
    window.addEventListener("beforeunload", (e) => {
      if (est.enviado) return;
      salvar(true);
      e.preventDefault();
      e.returnValue = "";
    });

    $("#enviar").addEventListener("click", confirmarEnvio);

    relogio.hidden = false;
    tic();
    est.timer = setInterval(tic, 1000);
    est.autosave = setInterval(() => { if (est.sujo) salvar(false); }, 15000);
  }

  function restanteMs() { return est.prazo - (Date.now() - est.defasagem); }

  function tic() {
    const ms = Math.max(0, restanteMs());
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    relogio.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    relogio.classList.toggle("pouco", ms > 0 && ms <= 5 * 60000);
    relogio.classList.toggle("fim", ms <= 0);
    if (ms <= 0 && !est.enviando && !est.enviado) {
      toast("Tempo esgotado. Enviando suas respostas…");
      enviar(true);
    }
  }

  function respostas() {
    const o = {};
    for (const ta of $$("textarea[data-campo]")) o[ta.dataset.campo] = ta.value;
    return o;
  }

  async function salvar(saindo) {
    if (est.enviado || est.enviando) return;
    const corpo = JSON.stringify({ c: codigo, respostas: respostas(), saidasAba: est.saidas, colagens: est.colagens });
    if (saindo && navigator.sendBeacon) {
      navigator.sendBeacon("/api/rascunho", new Blob([corpo], { type: "application/json" }));
      return;
    }
    const r = await api("/api/rascunho", { method: "POST", body: corpo, keepalive: true });
    if (r.status === 409) return telaEnviado(false);
    if (r.ok) {
      est.sujo = false;
      const h = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const el = $("#salvo");
      if (el) el.textContent = `Respostas salvas às ${h}.`;
    }
  }

  function montarFoto(d) {
    const area = $("#foto-area");
    if (!area) return;
    const linkCurto = String(d.linkFoto || "").replace(/^https?:\/\//, "");
    area.innerHTML = `<div class="foto-caixa">
      <div class="qr" aria-hidden="true">${d.qrFoto}</div>
      <div>
        <p style="margin:0 0 6px"><strong>Pelo celular:</strong> abra a câmera, aponte para o QR code e toque no link que aparecer.</p>
        <p class="muted" style="margin:0 0 6px">Se o celular não ler o código, digite este endereço no navegador dele:</p>
        <p class="link-foto"><code>${esc(linkCurto)}</code> <button class="botao sec" id="copiar-link-foto" type="button" style="padding:6px 10px">Copiar</button></p>
        <p class="muted" style="margin:10px 0">Ou envie um arquivo daqui: <label class="botao sec" style="padding:8px 12px;margin-left:4px">Escolher foto<input id="foto-arquivo" type="file" accept="image/*" capture="environment" hidden></label></p>
        <div id="foto-status" class="foto-status">${est.fotoOk ? "Foto recebida." : "Aguardando a foto do desenho."}</div>
        <img id="foto-previa" class="previa" alt="" hidden>
      </div>
    </div>`;
    if (est.fotoOk) $("#foto-status").classList.add("recebida");
    const svg = $(".qr svg", area);
    if (svg) { svg.setAttribute("width", "220"); svg.setAttribute("height", "220"); }
    $("#copiar-link-foto").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(d.linkFoto); toast("Endereço copiado."); } catch (_) { toast("Copie o endereço manualmente."); }
    });

    $("#foto-arquivo").addEventListener("change", async (e) => {
      const arq = e.target.files && e.target.files[0];
      if (!arq) return;
      const st = $("#foto-status");
      st.textContent = "Enviando a foto…";
      st.classList.remove("recebida");
      const r = await enviarFoto(codigo, arq);
      if (r.ok) {
        est.fotoOk = true;
        st.textContent = "Foto recebida.";
        st.classList.add("recebida");
        const img = $("#foto-previa");
        img.src = URL.createObjectURL(r.blob);
        img.hidden = false;
      } else if (r.status === 409) {
        telaEnviado(false);
      } else {
        st.textContent = r.dados.erro || "Não foi possível enviar a foto. Tente de novo.";
      }
      e.target.value = "";
    });

    est.poll = setInterval(async () => {
      if (est.enviado) return;
      const r = await api(`/api/foto?c=${codigo}`);
      if (r.ok && r.dados.recebida && !est.fotoOk) {
        est.fotoOk = true;
        const st = $("#foto-status");
        if (st) { st.textContent = "Foto recebida pelo celular."; st.classList.add("recebida"); }
        toast("Foto do desenho recebida.");
      }
    }, 5000);
  }

  function confirmarEnvio() {
    const pend = [];
    if (!est.fotoOk) pend.push("A foto do desenho (A1) ainda não foi recebida.");
    const r = respostas();
    const nomes = { a2: "A2", a3: "A3", b1: "B1" };
    for (const k of Object.keys(nomes)) if (!String(r[k] || "").trim()) pend.push(`A questão ${nomes[k]} está em branco.`);
    const dlg = $("#dlg");
    $("#dlg-titulo").textContent = "Enviar respostas?";
    $("#dlg-texto").innerHTML = (pend.length ? `<div class="aviso"><ul class="lista">${pend.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>` : "")
      + `<p>Depois do envio não é possível alterar as respostas, e este link deixa de abrir o teste.</p>`;
    dlg.showModal();
    $("#dlg-nao").onclick = () => dlg.close();
    $("#dlg-sim").onclick = () => { dlg.close(); enviar(false); };
  }

  async function enviar(automatico) {
    if (est.enviando || est.enviado) return;
    est.enviando = true;
    const b = $("#enviar");
    if (b) { b.disabled = true; b.textContent = "Enviando…"; }
    const corpo = JSON.stringify({ c: codigo, respostas: respostas(), saidasAba: est.saidas, colagens: est.colagens, automatico });
    let r;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      r = await api("/api/enviar", { method: "POST", body: corpo });
      if (r.ok || r.status === 409) break;
      await new Promise((ok) => setTimeout(ok, 1500));
    }
    if (r.ok || r.status === 409) {
      est.enviado = true;
      const rod = $("#rodape");
      if (rod) rod.remove();
      return telaEnviado(r.ok);
    }
    est.enviando = false;
    if (b) { b.disabled = false; b.textContent = "Tentar enviar de novo"; }
    toast(r.dados.erro || "Não foi possível enviar. Verifique a internet e tente de novo.");
  }

  function pararTudo() {
    clearInterval(est.timer);
    clearInterval(est.autosave);
    clearInterval(est.poll);
    est.enviado = true;
    const rod = $("#rodape");
    if (rod) rod.remove();
  }

  async function abrir() {
    if (!/^[A-Z0-9]{8}$/.test(codigo)) return telaInvalido();
    const r = await api(`/api/iniciar?c=${codigo}`);
    if (!r.ok) return r.status === 404 ? telaInvalido() : tela(`<div class="cartao centro"><h1>Não foi possível abrir</h1><p class="muted">${esc(r.dados.erro || "Tente de novo em instantes.")}</p></div>`);
    if (r.dados.status === "enviado") return telaEnviado(false);
    telaInicio(r.dados);
  }

  abrir();
})();
