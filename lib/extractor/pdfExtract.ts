import fs from 'fs';
import pdfParse from 'pdf-parse';
import { extractTextFromImage } from './ocr';
import { logger } from '../utils/logger';

// Dynamic imports for alternative PDF parsers
let PDFExtract: any;
let PDFParser: any;

try {
  PDFExtract = require('pdf.js-extract').PDFExtract;
} catch (e) {
  logger.debug('pdf.js-extract not available');
}

try {
  PDFParser = require('pdf2json');
} catch (e) {
  logger.debug('pdf2json not available');
}

/**
 * Multi-layered PDF extraction with fallback strategies:
 * 1. Try pdf-parse (fastest for text-based PDFs)
 * 2. Try extracting as images and use OCR (for scanned PDFs)
 * 3. Return empty string if all methods fail
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  
  // Strategy 1: Standard text extraction
  try {
    logger.debug('Attempting standard PDF text extraction', { file: filePath });
    const data = await pdfParse(dataBuffer, {
      max: 0, // Parse all pages
      version: 'v1.10.100',
    });
    
    if (data.text && data.text.trim().length > 50) {
      logger.debug('Successfully extracted text from PDF', { 
        file: filePath, 
        length: data.text.length,
        pages: data.numpages 
      });
      return data.text;
    }
    
    logger.warn('PDF parsed but insufficient text found', { 
      file: filePath, 
      textLength: data.text?.length || 0 
    });
  } catch (err: any) {
    logger.warn('Standard PDF extraction failed', { 
      file: filePath, 
      error: err.message 
    });
  }
  
  // Strategy 2: Try OCR if PDF is likely scanned/image-based
  if (process.env.ENABLE_OCR === 'true') {
    try {
      logger.debug('Attempting OCR extraction on PDF', { file: filePath });
      
      // Convert PDF to images and OCR them
      // For now, we'll use pdf-parse to get image data if available
      const ocrText = await extractTextFromPDFWithOCR(filePath);
      
      if (ocrText && ocrText.trim().length > 50) {
        logger.info('Successfully extracted text via OCR', { 
          file: filePath, 
          length: ocrText.length 
        });
        return ocrText;
      }
    } catch (err: any) {
      logger.warn('OCR extraction failed', { 
        file: filePath, 
        error: err.message 
      });
    }
  }
  
  // Strategy 3: Try pdf.js-extract (more robust for complex PDFs)
  if (PDFExtract) {
    try {
      logger.debug('Attempting PDF extraction with pdf.js-extract', { file: filePath });
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extract(filePath, {});
      
      let text = '';
      data.pages.forEach((page: any) => {
        page.content.forEach((item: any) => {
          if (item.str) {
            text += item.str + ' ';
          }
        });
        text += '\n';
      });
      
      if (text.trim().length > 50) {
        logger.info('Successfully extracted text with pdf.js-extract', { 
          file: filePath, 
          length: text.length 
        });
        return text;
      }
    } catch (err: any) {
      logger.warn('pdf.js-extract failed', { 
        file: filePath, 
        error: err.message 
      });
    }
  }
  
  // Strategy 4: Try pdf2json (handles some edge cases)
  if (PDFParser) {
    try {
      logger.debug('Attempting PDF extraction with pdf2json', { file: filePath });
      const pdfParser = new PDFParser();
      
      const text = await new Promise<string>((resolve, reject) => {
        let extractedText = '';
        
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          reject(new Error(errData.parserError));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            // Extract text from Pages
            if (pdfData.Pages) {
              pdfData.Pages.forEach((page: any) => {
                if (page.Texts) {
                  page.Texts.forEach((text: any) => {
                    if (text.R) {
                      text.R.forEach((r: any) => {
                        if (r.T) {
                          extractedText += decodeURIComponent(r.T) + ' ';
                        }
                      });
                    }
                  });
                  extractedText += '\n';
                }
              });
            }
            resolve(extractedText);
          } catch (e: any) {
            reject(e);
          }
        });
        
        pdfParser.loadPDF(filePath);
      });
      
      if (text.trim().length > 50) {
        logger.info('Successfully extracted text with pdf2json', { 
          file: filePath, 
          length: text.length 
        });
        return text;
      }
    } catch (err: any) {
      logger.warn('pdf2json extraction failed', { 
        file: filePath, 
        error: err.message 
      });
    }
  }
  
  // Strategy 5: Try with different pdf-parse options
  try {
    logger.debug('Attempting PDF extraction with alternative pdf-parse options', { file: filePath });
    const data = await pdfParse(dataBuffer, {
      max: 0,
      version: 'default',
    });
    
    if (data.text && data.text.trim().length > 0) {
      logger.debug('Extracted text with alternative method', { 
        file: filePath, 
        length: data.text.length 
      });
      return data.text;
    }
  } catch (err: any) {
    logger.warn('Alternative PDF extraction failed', { 
      file: filePath, 
      error: err.message 
    });
  }
  
  logger.error('All PDF extraction methods failed');
  return '';
}

/**
 * Extract text from PDF using OCR
 * This is a placeholder for more advanced OCR processing
 */
async function extractTextFromPDFWithOCR(filePath: string): Promise<string> {
  try {
    // For image-based PDFs, we would need to:
    // 1. Convert PDF pages to images using pdf2pic or similar
    // 2. Run OCR on each image
    // 3. Combine the results
    
    // Simplified approach: Check if we can read any text at all
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, { 
      max: 1, // Just first page for testing
    });
    
    // If we got some text, even if minimal, return it
    if (data.text && data.text.trim().length > 0) {
      // Try to get all pages with more lenient settings
      const fullData = await pdfParse(dataBuffer, {
        max: 0,
        pagerender: (pageData: any) => {
          // Custom page rendering to extract more content
          return pageData.getTextContent().then((textContent: any) => {
            let text = '';
            textContent.items.forEach((item: any) => {
              text += item.str + ' ';
            });
            return text;
          });
        }
      });
      return fullData.text || data.text;
    }
    
    return '';
  } catch (err: any) {
    logger.error('OCR PDF extraction error', err);
    return '';
  }
}
