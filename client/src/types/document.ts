export interface DocumentSection {
  id: string;
  title: string;
  content: string;
}

export interface DocumentTerm {
  label: string;
  value: string;
}

export interface GeneratedDocument {
  title: string;
  document_type: string;
  sections: DocumentSection[];
  terms: DocumentTerm[];
  warnings: string[];
}
