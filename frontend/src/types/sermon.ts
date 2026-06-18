
export interface Sermon {
  id: string;
  title: string;
  bible_refs: string;
  introduction: string;
  development: string[];
  conclusion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SermonDevelopment {
  title: string;
  text: string; 
}

export interface SermonFormData {
  title: string;
  bible_refs: string;
  introduction: string;
  development: SermonDevelopment[];
  conclusion: string;
}

export interface SermonDevelopmentType {
  id: string | null;        // id do ponto de desenvolvimento, pode ser null se não houver
  title: string;
  text: string;
  order_index: number | null;
}

export interface SermonType {
  id: string;
  title: string;
  bible_refs: string;
  introduction: string;
  conclusion: string;
  updated_at: string;                    
  developments: SermonDevelopmentType[]; 
}

export interface BiblicalVerse {
  reference: string;
  text: string;
  version: string;
}
