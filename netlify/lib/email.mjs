import nodemailer from "nodemailer";

// Envia o aviso de teste concluído. Só funciona se as variáveis SMTP_* e MAIL_TO
// estiverem configuradas na Netlify; sem elas, o envio é ignorado.
export async function avisarEnvio(cand, envio, foto) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, MAIL_TO, URL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    return { enviado: false, motivo: "e-mail não configurado" };
  }
  const porta = Number(SMTP_PORT || 465);
  const transporte = nodemailer.createTransport({
    host: SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const min = Math.round((envio.tempoSegundos || 0) / 60);
  const linhas = [
    `Candidato(a): ${cand.nome}`,
    `Vaga: ${cand.vaga}`,
    `Enviado em: ${new Date(envio.enviadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    `Tempo gasto: ${min} min${envio.foraDoPrazo ? " (enviado depois do prazo)" : ""}`,
    `Saídas da página: ${envio.saidasAba}   Tentativas de colar texto: ${envio.colagens}`,
    `Foto do desenho A1: ${foto ? "anexada" : "não enviada"}`,
    "",
    "A2. O que está errado nesta ligação e qual o risco?",
    envio.respostas.a2 || "(em branco)",
    "",
    "A3. Quais fios vão do quadro até uma tomada de uso geral?",
    envio.respostas.a3 || "(em branco)",
    "",
    "B1. Três erros do quadro de cargas e correção:",
    envio.respostas.b1 || "(em branco)",
    "",
    URL ? `Painel com gabarito e avaliação: ${URL}/admin` : "",
  ];
  const anexos = foto
    ? [{ filename: `desenho-a1-${cand.codigo}.jpg`, content: Buffer.from(foto.data), contentType: foto.metadata?.contentType || "image/jpeg" }]
    : [];
  await transporte.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: MAIL_TO,
    subject: `Teste técnico enviado: ${cand.nome}`,
    text: linhas.join("\n"),
    attachments: anexos,
  });
  return { enviado: true };
}
