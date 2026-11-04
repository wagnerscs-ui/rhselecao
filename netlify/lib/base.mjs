import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

// Chaves usadas no armazenamento (Netlify Blobs, store "teste-tecnico"):
//   cand/<codigo>   cadastro do candidato, criado pelo RH (nome, vaga, inicio, prazo, avaliacao)
//   rasc/<codigo>   rascunho salvo automaticamente durante o teste
//   foto/<codigo>   foto do desenho A1
//   envio/<codigo>  respostas finais; se existe, o link esta travado

export function store() {
  return globalThis.__STORE_LOCAL__ || getStore({ name: "teste-tecnico", consistency: "strong" });
}

export const DURACAO_MIN = Number(process.env.DURACAO_MIN || 25);
export const TOLERANCIA_MS = 3 * 60 * 1000;
export const MAX_TEXTO = 5000;
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const erro = (msg, status) => json({ erro: msg }, status);

export function codigoValido(c) {
  return typeof c === "string" && /^[A-HJ-NP-Z2-9]{8}$/.test(c);
}

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function novoCodigo() {
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (const b of bytes) s += ALFABETO[b % ALFABETO.length];
  return s;
}

export async function lerCand(c) {
  return await store().get(`cand/${c}`, { type: "json" });
}

export async function lerEnvio(c) {
  return await store().get(`envio/${c}`, { type: "json" });
}

export async function lerRascunho(c) {
  return await store().get(`rasc/${c}`, { type: "json" });
}

export async function temFoto(c) {
  const m = await store().getMetadata(`foto/${c}`);
  return m ? (m.metadata?.recebidaEm || true) : false;
}

export async function statusDe(c, cand) {
  if (!cand) return null;
  if (await store().getMetadata(`envio/${c}`)) return "enviado";
  if (cand.iniciadoEm) return "iniciado";
  return "novo";
}

export function limparTexto(v) {
  return String(v ?? "").slice(0, MAX_TEXTO);
}

export function limparRespostas(r) {
  const o = {};
  for (const k of ["a2", "a3", "b1"]) o[k] = limparTexto(r?.[k]);
  return o;
}

export function senhaConfere(req) {
  const esperada = process.env.ADMIN_PASSWORD || "";
  if (!esperada) return false;
  const recebida = req.headers.get("x-admin-key") || "";
  const a = crypto.createHash("sha256").update(esperada).digest();
  const b = crypto.createHash("sha256").update(recebida).digest();
  return crypto.timingSafeEqual(a, b);
}
