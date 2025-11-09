import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    // Basic pre-processing
    const buffer = await sharp(filePath).grayscale().normalize().toBuffer();
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    return text || '';
  } catch (err) {
    console.error('ocr error', err);
    return '';
  }
}
