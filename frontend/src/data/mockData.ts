
import { Sermon, BiblicalVerse } from '@/types/sermon';

export const mockSermons: Sermon[] = [
  {
    id: '1',
    title: 'O Amor de Deus Revelado',
    bible_refs: 'João 3:16',
    introduction: 'O amor de Deus é o fundamento de toda nossa fé e esperança.',
    development: [
      'Deus amou o mundo de tal maneira',
      'Que deu o seu Filho unigênito',
      'Para que todo aquele que nele crê não pereça'
    ],
    conclusion: 'O amor de Deus é eterno e transformador, mudando nossa vida para sempre.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'A Fé que Move Montanhas',
    bible_refs: 'Mateus 17:20',
    introduction: 'Jesus nos ensina sobre o poder extraordinário da fé genuína.',
    development: [
      'A fé como grão de mostarda',
      'O poder da oração com fé',
      'Impossível se torna possível'
    ],
    conclusion: 'Com fé, podemos superar qualquer obstáculo em nossa jornada cristã.',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '3',
    title: 'Paz em Meio à Tempestade',
    bible_refs: 'Marcos 4:35-41',
    introduction: 'Jesus demonstra seu poder sobre as circunstâncias da vida.',
    development: [
      'Jesus estava no barco conosco',
      'Ele tem poder sobre a natureza',
      'Nossa fé é testada nas tempestades'
    ],
    conclusion: 'Com Jesus no barco da nossa vida, podemos ter paz em qualquer tempestade.',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  }
];

export const mockVerses: BiblicalVerse[] = [
  {
    reference: 'João 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    version: 'ARA'
  },
  {
    reference: 'Mateus 17:20',
    text: 'E Jesus lhes disse: Por causa da vossa pouca fé; porque em verdade vos digo que, se tiverdes fé como um grão de mostarda, direis a este monte: Passa daqui para acolá, e há de passar; e nada vos será impossível.',
    version: 'ARA'
  },
  {
    reference: 'Filipenses 4:13',
    text: 'Tudo posso naquele que me fortalece.',
    version: 'ARA'
  },
  {
    reference: 'Salmos 23:1',
    text: 'O Senhor é o meu pastor; nada me faltará.',
    version: 'ARA'
  },
  {
    reference: 'Romanos 8:28',
    text: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados por seu decreto.',
    version: 'ARA'
  }
];
