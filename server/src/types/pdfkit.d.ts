declare module 'pdfkit' {
  import { Writable } from 'stream';

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margins?: { top: number; bottom: number; left: number; right: number };
    info?: Record<string, string>;
    bufferPages?: boolean;
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFDocumentOptions);
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, options?: Record<string, unknown>): this;
    text(text: string, x: number, y: number, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    addPage(options?: Record<string, unknown>): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color: string): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    end(): void;
    bufferedPageRange(): { start: number; count: number };
    switchToPage(pageNumber: number): this;
    x: number;
    y: number;
    page: { width: number; height: number; margins: { left: number; right: number; top: number; bottom: number } };
  }

  export = PDFDocument;
}
