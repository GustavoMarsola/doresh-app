import * as fs from "fs";


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


export const handleLogout = () => {
  try {
    fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
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
