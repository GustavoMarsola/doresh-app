import * as fs from "fs";
import jsPDF from "jspdf";
import { SermonType } from "@/types/sermon";


export const BEARER_TOKEN = localStorage.getItem("token")
export const API_BASE_URL = import.meta.env.VITE_API_HOST

export function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
    'TO'
];

export const textIntroduction = 'Olá! Sou o Ruach AI, assistente virtual criado para te auxiliar com dúvidas sobre a Palavra de Deus! Como posso te ajudar?';
export const quickSuggestions = [
    'Quem foi Jesus de Nazaré?',
    `Festas bíblicas do ano de ${new Date().getFullYear()}`,
    'Principais linhas escatológicas',
    'O que a Bíblia diz sobre fé?',
];

export const exportSermonToPDF = async (sermon: SermonType) => {
  const doc = new jsPDF();

  try {
    const logoUrl = "/logo.svg";
    const response = await fetch(logoUrl);
    const svgText = await response.text();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgText)));
    await new Promise((resolve) => (img.onload = resolve));
    canvas.width = 60;
    canvas.height = 60;
    ctx?.drawImage(img, 0, 0, 60, 60);
    const logoBase64 = canvas.toDataURL("image/png");

    doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
  } catch (e) {
    console.warn("Erro ao carregar logo para PDF:", e);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(sermon.title, 40, 20);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(`Referências Bíblicas: ${sermon.bible_refs}`, 40, 28);

  doc.setDrawColor(180);
  doc.line(10, 35, 200, 35);

  let y = 45;
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Introdução", 10, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const introLines = doc.splitTextToSize(sermon.introduction, 180);
  doc.text(introLines, 10, y);
  y += introLines.length * 6 + 10;

  sermon.developments.forEach((dev, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${idx + 1}. ${dev.title}`, 10, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60);
    const textLines = doc.splitTextToSize(dev.text, 180);
    doc.text(textLines, 15, y);
    y += textLines.length * 6 + 10;
    doc.setTextColor(0);
  });

  if (sermon.conclusion) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Conclusão", 10, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60);
    const concLines = doc.splitTextToSize(sermon.conclusion, 180);
    doc.text(concLines, 10, y);
    doc.setTextColor(0);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Gerado por Doresh - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${sermon.title}.pdf`);
};

export const handleLogout = () => {
  try {
    fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` },
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  } finally {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

export function readJSON<T>(path: string): T {
  try {
    const data = fs.readFileSync(path, { encoding: "utf-8" });
    return JSON.parse(data) as T;
  } catch (err) {
    throw new Error(`Erro ao ler o arquivo JSON em ${path}: ${(err as Error).message}`);
  }
}
