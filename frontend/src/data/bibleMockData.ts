
export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export const mockBibleChapter: BibleChapter = {
  book: "João",
  chapter: 3,
  verses: [
    {
      id: "joão-3-1",
      book: "João",
      chapter: 3,
      verse: 1,
      text: "Havia entre os fariseus um homem chamado Nicodemos, um dos principais dos judeus.",
      reference: "João 3:1"
    },
    {
      id: "joão-3-2",
      book: "João",
      chapter: 3,
      verse: 2,
      text: "Este foi ter com Jesus, de noite, e disse-lhe: Rabi, bem sabemos que és Mestre, vindo de Deus; porque ninguém pode fazer estes sinais que tu fazes, se Deus não for com ele.",
      reference: "João 3:2"
    },
    {
      id: "joão-3-3",
      book: "João",
      chapter: 3,
      verse: 3,
      text: "Jesus respondeu, e disse-lhe: Na verdade, na verdade te digo que aquele que não nascer de novo, não pode ver o reino de Deus.",
      reference: "João 3:3"
    },
    {
      id: "joão-3-4",
      book: "João",
      chapter: 3,
      verse: 4,
      text: "Disse-lhe Nicodemos: Como pode um homem nascer, sendo velho? Pode, porventura, tornar a entrar no ventre de sua mãe, e nascer?",
      reference: "João 3:4"
    },
    {
      id: "joão-3-5",
      book: "João",
      chapter: 3,
      verse: 5,
      text: "Jesus respondeu: Na verdade, na verdade te digo que aquele que não nascer da água e do Espírito, não pode entrar no reino de Deus.",
      reference: "João 3:5"
    },
    {
      id: "joão-3-6",
      book: "João",
      chapter: 3,
      verse: 6,
      text: "O que é nascido da carne é carne, e o que é nascido do Espírito é espírito.",
      reference: "João 3:6"
    },
    {
      id: "joão-3-7",
      book: "João",
      chapter: 3,
      verse: 7,
      text: "Não te maravilhes de te ter dito: Necessário vos é nascer de novo.",
      reference: "João 3:7"
    },
    {
      id: "joão-3-8",
      book: "João",
      chapter: 3,
      verse: 8,
      text: "O vento assopra onde quer, e ouves a sua voz, mas não sabes de onde vem, nem para onde vai; assim é todo aquele que é nascido do Espírito.",
      reference: "João 3:8"
    },
    {
      id: "joão-3-16",
      book: "João",
      chapter: 3,
      verse: 16,
      text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
      reference: "João 3:16"
    },
    {
      id: "joão-3-17",
      book: "João",
      chapter: 3,
      verse: 17,
      text: "Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.",
      reference: "João 3:17"
    }
  ]
};

export const bibleBooks = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
  "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel",
  "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras",
  "Neemias", "Ester", "Jó", "Salmos", "Provérbios",
  "Eclesiastes", "Cantares", "Isaías", "Jeremias", "Lamentações",
  "Ezequiel", "Daniel", "Oséias", "Joel", "Amós",
  "Obadias", "Jonas", "Miqueias", "Naum", "Habacuque",
  "Sofonias", "Ageu", "Zacarias", "Malaquias",
  "Mateus", "Marcos", "Lucas", "João", "Atos",
  "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios",
  "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses",
  "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus",
  "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João",
  "3 João", "Judas", "Apocalipse"
];

export const bibleVersions = [
  "ARA", 
  "NVI", 
  // "ARC", 
  // "NAA", 
  // "NTLH"
];