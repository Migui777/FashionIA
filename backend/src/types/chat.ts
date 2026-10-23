export interface DressContext {
  name: string;
  designer: string | null;
  materials: string | null;
  description: string | null;
  collection: string | null;
  category: string | null;
  color: string | null;
  story: string | null;
}

export interface ChatRequestBody {
  dressId: string;
  message: string;
}

export interface ChatResponseBody {
  message: string;
}
