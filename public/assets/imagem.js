// Reduz a foto no próprio aparelho antes de enviar (lado maior até 1600 px, JPEG).
async function comprimirImagem(arquivo, ladoMax = 1600, qualidade = 0.82) {
  let fonte;
  try {
    fonte = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch (_) {
    fonte = await new Promise((ok, falha) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = falha;
      img.src = URL.createObjectURL(arquivo);
    });
  }
  const escala = Math.min(1, ladoMax / Math.max(fonte.width, fonte.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(fonte.width * escala);
  canvas.height = Math.round(fonte.height * escala);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(fonte, 0, 0, canvas.width, canvas.height);
  return await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", qualidade));
}

async function enviarFoto(codigo, arquivo) {
  const blob = await comprimirImagem(arquivo);
  const r = await fetch(`/api/foto?c=${encodeURIComponent(codigo)}`, {
    method: "POST",
    headers: { "content-type": "image/jpeg" },
    body: blob,
  });
  let dados = {};
  try { dados = await r.json(); } catch (_) {}
  return { ok: r.ok, status: r.status, dados, blob };
}
