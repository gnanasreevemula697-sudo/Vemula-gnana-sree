export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ScanResult {
  id: string;
  originalUrl: string;
  processedUrl: string;
  timestamp: number;
  userId: string;
  fileName: string;
  subjectName?: string;
  subjectEmail?: string;
  subjectMobile?: string;
  notes?: string;
}

export interface ProcessingOptions {
  threshold: number;
  contrast: number;
  invert: boolean;
}