// Conteudo do teste. As perguntas so saem do servidor para um link valido,
// e o gabarito so sai para o painel do RH (com senha).

export const TITULO = "Teste técnico: instalações elétricas";
export const VAGA_PADRAO = "Projetista de instalações elétricas";

const SVG_E2 = `<svg viewBox="0 0 760 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lâmpada com interruptor simples" font-family="Arial, Inter, sans-serif" font-size="13">
  <text x="24" y="30" font-size="15" font-weight="700" fill="#294851">Lâmpada com interruptor simples</text>
  <path d="M40 90H650V128" stroke="#1f6fd1" stroke-width="2.5" fill="none"/>
  <text x="40" y="80" font-size="12" fill="#294851">Fase</text>
  <path d="M40 190H300" stroke="#8a8f93" stroke-width="2.5" fill="none"/>
  <text x="40" y="180" font-size="12" fill="#294851">Neutro</text>
  <path d="M400 190H650V172" stroke="#009E81" stroke-width="2.5" fill="none"/>
  <text x="520" y="180" text-anchor="middle" font-size="12" fill="#294851">Retorno</text>
  <rect x="300" y="155" width="100" height="70" rx="8" fill="none" stroke="#8a8f93" stroke-width="1.25"/>
  <circle cx="300" cy="190" r="4" fill="#294851"/><circle cx="400" cy="190" r="4" fill="#294851"/>
  <path d="M318 190L378 174" stroke="#294851" stroke-width="1.8"/>
  <text x="350" y="145" text-anchor="middle" font-weight="700" fill="#294851">Interruptor simples</text>
  <circle cx="650" cy="150" r="22" fill="none" stroke="#294851" stroke-width="1.6"/>
  <path d="M634 134L666 166M634 166L666 134" stroke="#294851" stroke-width="1.3"/>
  <text x="682" y="154" font-size="12" fill="#294851">Lâmpada</text>
</svg>`;

const SVG_THREE_WAY = `<svg viewBox="0 0 760 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Referência do three-way" font-family="Arial, Inter, sans-serif" font-size="13">
  <text x="24" y="28" font-size="15" font-weight="700" fill="#294851">Referência: fase no comum do 1º, retorno no comum do 2º</text>
  <text x="24" y="48" font-size="11.5" fill="#4a6870">C = borne do meio (comum); L1 e L2 = bornes laterais. Os números são os itens acima.</text>
  <path d="M40 150H180" stroke="#1f6fd1" stroke-width="2.5" fill="none"/>
  <text x="40" y="140" font-size="12" fill="#294851">Fase</text>
  <path d="M40 250H670V172" stroke="#8a8f93" stroke-width="2.5" fill="none"/>
  <text x="40" y="240" font-size="12" fill="#294851">Neutro</text>
  <path d="M300 120H440M300 180H440" stroke="#E07A2E" stroke-width="2.5" fill="none"/>
  <text x="370" y="110" text-anchor="middle" font-size="12" fill="#294851">fios paralelos</text>
  <path d="M560 150H648" stroke="#009E81" stroke-width="2.5" fill="none"/>
  <text x="604" y="140" text-anchor="middle" font-size="12" fill="#294851">Retorno</text>
  <rect x="180" y="100" width="120" height="100" rx="8" fill="none" stroke="#8a8f93" stroke-width="1.25"/>
  <circle cx="180" cy="150" r="4" fill="#294851"/><circle cx="300" cy="120" r="4" fill="#294851"/><circle cx="300" cy="180" r="4" fill="#294851"/>
  <text x="240" y="90" text-anchor="middle" font-weight="700" fill="#294851">Interruptor 1</text>
  <text x="194" y="154" font-size="11.5" fill="#4a6870">C</text>
  <text x="286" y="124" text-anchor="end" font-size="11.5" fill="#4a6870">L1</text>
  <text x="286" y="184" text-anchor="end" font-size="11.5" fill="#4a6870">L2</text>
  <rect x="440" y="100" width="120" height="100" rx="8" fill="none" stroke="#8a8f93" stroke-width="1.25"/>
  <circle cx="440" cy="120" r="4" fill="#294851"/><circle cx="440" cy="180" r="4" fill="#294851"/><circle cx="560" cy="150" r="4" fill="#294851"/>
  <text x="500" y="90" text-anchor="middle" font-weight="700" fill="#294851">Interruptor 2</text>
  <text x="454" y="124" font-size="11.5" fill="#4a6870">L1</text>
  <text x="454" y="184" font-size="11.5" fill="#4a6870">L2</text>
  <text x="546" y="154" text-anchor="end" font-size="11.5" fill="#4a6870">C</text>
  <circle cx="670" cy="150" r="22" fill="none" stroke="#294851" stroke-width="1.6"/>
  <path d="M654 134L686 166M654 166L686 134" stroke="#294851" stroke-width="1.3"/>
  <text x="670" y="118" text-anchor="middle" font-size="12" fill="#294851">Lâmpada</text>
  <g fill="#fff" stroke="#048B9C" stroke-width="1.5"><circle cx="360" cy="228" r="11"/><circle cx="130" cy="128" r="11"/><circle cx="370" cy="150" r="11"/><circle cx="604" cy="172" r="11"/></g>
  <g font-size="12" font-weight="700" fill="#048B9C" text-anchor="middle"><text x="360" y="232">1</text><text x="130" y="132">2</text><text x="370" y="154">3</text><text x="604" y="176">4</text></g>
</svg>`;

const TABELA_B1 = `<div class="tabela-rolagem"><table class="quadro">
  <thead><tr><th class="num">Circuito</th><th>Descrição</th><th class="num">Tensão</th><th class="num">Potência</th><th class="num">Corrente</th><th class="num">Cabo</th><th class="num">Disjuntor</th><th>DR</th></tr></thead>
  <tbody>
    <tr><td class="num">1</td><td>Iluminação</td><td class="num">127 V</td><td class="num">800 W</td><td class="num">6,3 A</td><td class="num">1,5 mm²</td><td class="num">10 A</td><td>Não</td></tr>
    <tr><td class="num">2</td><td>Tomadas sala e quartos</td><td class="num">127 V</td><td class="num">1.500 W</td><td class="num">11,8 A</td><td class="num">2,5 mm²</td><td class="num">16 A</td><td>Não</td></tr>
    <tr><td class="num">3</td><td>Tomadas cozinha</td><td class="num">127 V</td><td class="num">2.400 W</td><td class="num">18,9 A</td><td class="num">1,5 mm²</td><td class="num">20 A</td><td>Não</td></tr>
    <tr><td class="num">4</td><td>Chuveiro e tomadas do banheiro</td><td class="num">220 V</td><td class="num">6.100 W</td><td class="num">27,7 A</td><td class="num">4 mm²</td><td class="num">32 A</td><td>Sim</td></tr>
    <tr><td class="num">5</td><td>Ar-condicionado</td><td class="num">220 V</td><td class="num">1.400 W</td><td class="num">6,4 A</td><td class="num">2,5 mm²</td><td class="num">16 A</td><td>Sim</td></tr>
  </tbody>
</table></div>`;

export const PERGUNTAS_HTML = `
<section class="parte">
  <h2>Parte A · Ligações</h2>
  <div class="q" id="q-a1">
    <div class="q-cod">A1</div>
    <div class="q-corpo">
      <p>Desenhe à mão, numa folha de papel, a ligação de uma lâmpada comandada de dois lugares diferentes, por exemplo no início e no fim de um corredor, com interruptores paralelos (three-way). Mostre fase, neutro e os fios entre os interruptores.</p>
      <p>Depois, envie uma foto do desenho.</p>
      <div id="foto-area"></div>
    </div>
  </div>
  <div class="q">
    <div class="q-cod">A2</div>
    <div class="q-corpo">
      <p>O que está errado nesta ligação e qual o risco?</p>
      <figure class="figura">${SVG_E2}</figure>
      <textarea data-campo="a2" rows="5" placeholder="Sua resposta"></textarea>
    </div>
  </div>
  <div class="q">
    <div class="q-cod">A3</div>
    <div class="q-corpo">
      <p>Quais fios vão do quadro até uma tomada de uso geral?</p>
      <textarea data-campo="a3" rows="3" placeholder="Sua resposta"></textarea>
    </div>
  </div>
</section>
<section class="parte">
  <h2>Parte B · Circuitos e dimensionamento</h2>
  <div class="q">
    <div class="q-cod">B1</div>
    <div class="q-corpo">
      <p>Este quadro de cargas tem três erros. Quais são e como você corrigiria?</p>
      ${TABELA_B1}
      <textarea data-campo="b1" rows="8" placeholder="Sua resposta"></textarea>
    </div>
  </div>
</section>`;

export const GABARITO_HTML = `
<h3>A1 · os 4 pontos precisam estar certos</h3>
<p>Vale qualquer desenho com a mesma lógica, mesmo em outra disposição.</p>
<ol>
  <li>O neutro vai direto à lâmpada, sem passar por interruptor.</li>
  <li>A fase chega no borne do meio (comum) do primeiro interruptor.</li>
  <li>Dois fios ligam os bornes laterais do primeiro interruptor aos bornes laterais do segundo.</li>
  <li>Do borne do meio do segundo interruptor sai o retorno para a lâmpada.</li>
</ol>
<figure class="figura">${SVG_THREE_WAY}</figure>
<h3>A2</h3>
<p>O interruptor está cortando o neutro; o certo é ele interromper a fase. Do jeito desenhado, a lâmpada continua energizada mesmo apagada e dá choque na troca. Vale como certo quem disser "interruptor no neutro" ou "fase direto na lâmpada".</p>
<h3>A3</h3>
<p>3 fios: fase, neutro e terra. Em 220 V entre fases: duas fases e terra.</p>
<h3>B1 · os três erros do quadro</h3>
<ol>
  <li>Circuito 3: cabo de 1,5 mm² em tomadas. O mínimo para tomadas é 2,5 mm², e o 1,5 mm² não aguenta os 20 A do disjuntor.</li>
  <li>Circuito 3: tomadas da cozinha sem DR. Na cozinha o DR é obrigatório.</li>
  <li>Circuito 4: chuveiro junto com as tomadas do banheiro. O chuveiro precisa de circuito só dele.</li>
</ol>
<p class="nota">Se o candidato apontar falta de DR nos circuitos 1 ou 2, não conta como erro, porque a norma não exige, mas também não desconta.</p>
<h3>Critério</h3>
<table class="criterio">
  <tr><td>Passa</td><td>A1 com os 4 pontos e pelo menos 2 dos 3 erros de B1, com a correção.</td></tr>
  <tr><td>Limítrofe</td><td>Ficou a um ponto ou a um acerto disso. Enviar à Complementare para decisão.</td></tr>
  <tr><td>Não passa</td><td>Abaixo disso. Dar o retorno sem revelar as respostas.</td></tr>
</table>`;
