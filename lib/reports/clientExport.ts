// Exports rendered pages straight from the browser, without a server round trip. Server exports
// (Reports.render) give vector PDFs and work for automations; these capture exactly what is on screen.

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before releasing the blob
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function exportFileName(name: string, extension: string): string {
  const clean = name.replace(/[\\/:*?"<>|#%&\s]+/g, "-").replace(/^-+|-+$/g, "") || "report";
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${clean}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.${extension}`;
}

async function pageToPng(node: HTMLElement, pixelRatio: number): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(node, { pixelRatio, cacheBust: true });
}

/** One PNG of a single page, or of all pages stacked when several nodes are given. */
export async function exportPng(nodes: HTMLElement[], fileName: string, pixelRatio = 2): Promise<void> {
  if (nodes.length === 1) {
    const dataUrl = await pageToPng(nodes[0], pixelRatio);
    downloadBlob(await (await fetch(dataUrl)).blob(), fileName);
    return;
  }
  const gap = 24;
  const images = await Promise.all(nodes.map((n) => pageToPng(n, pixelRatio)));
  const loaded = await Promise.all(
    images.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Could not load page image"));
          img.src = src;
        }),
    ),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(...loaded.map((i) => i.width));
  canvas.height = loaded.reduce((a, i) => a + i.height, 0) + gap * pixelRatio * (loaded.length - 1);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available");
  }
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let y = 0;
  for (const img of loaded) {
    ctx.drawImage(img, 0, y);
    y += img.height + gap * pixelRatio;
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Could not create the image");
  }
  downloadBlob(blob, fileName);
}

/** A PDF with one image per page (CSS px to points is 0.75). */
export async function exportPdf(nodes: HTMLElement[], width: number, height: number, fileName: string, title: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const w = width * 0.75;
  const h = height * 0.75;
  const pdf = new jsPDF({
    orientation: w > h ? "landscape" : "portrait",
    unit: "pt",
    format: [w, h],
    compress: true,
  });
  pdf.setProperties({ title, creator: "Jellystat" });
  for (let i = 0; i < nodes.length; i++) {
    if (i > 0) {
      pdf.addPage([w, h], w > h ? "landscape" : "portrait");
    }
    pdf.addImage(await pageToPng(nodes[i], 2), "PNG", 0, 0, w, h, undefined, "FAST");
  }
  downloadBlob(pdf.output("blob"), fileName);
}
