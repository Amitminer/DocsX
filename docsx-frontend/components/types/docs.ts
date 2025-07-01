export interface Doc {
    id: string;
    title: string;
    description: string;
    author_id: string;
    author_name?: string;
    created_at: string;
    likes: number;
  }
  
  export interface DocsResponse {
    docs: Doc[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }