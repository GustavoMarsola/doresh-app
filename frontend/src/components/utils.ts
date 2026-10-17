import * as fs from "fs";


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
  const token = localStorage.getItem('token');
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
