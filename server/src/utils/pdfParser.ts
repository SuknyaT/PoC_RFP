import fs from 'fs';
import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromFile(filePath: string, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return extractTextFromPdf(filePath);
    case 'txt':
      return fs.readFileSync(filePath, 'utf-8');
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
