export interface ApiErrorBody {
  code: string;
  message: string;
  requestId?: string;
}

export interface GenerateDocumentRequest {
  documentType: string;
  documentId?: string; // omit to create a new document
  input: Record<string, unknown>;
}

export interface GenerateDocumentResponse {
  documentId: string;
  versionId: string;
  title: string;
  sections: { id: string; title: string; content: string }[];
  terms: { label: string; value: string }[];
  warnings: string[];
}
