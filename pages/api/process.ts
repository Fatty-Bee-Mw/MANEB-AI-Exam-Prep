import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { extractTextFromPDF } from '../../lib/extractor/pdfExtract';
import { extractTextFromDocx } from '../../lib/extractor/docxExtract';
import { extractTextFromImage } from '../../lib/extractor/ocr';
import { summarizeCorpus } from '../../lib/ai/summarizer';
import { exportToMD } from '../../lib/export/mdExport';
import { exportToTXT } from '../../lib/export/txtExport';
import { exportToPDF } from '../../lib/export/pdfExport';
import { exportToDOCX } from '../../lib/export/docxExport';
import { validateFileUpload, sanitizeFilename } from '../../lib/utils/validation';
import { logger } from '../../lib/utils/logger';
import { createError, ErrorCode, handleError, sendSuccess, asyncHandler } from '../../lib/utils/errorHandler';
import { rateLimitMiddleware } from '../../lib/middleware/rateLimit';
import { corsMiddleware } from '../../lib/middleware/cors';
import { ensureTempDirectories, hasAvailableSpace, deleteFile } from '../../lib/utils/fileCleanup';
import { trackUpload } from '../../lib/utils/analytics';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};

const tmpDir = process.env.UPLOAD_TMP_DIR || '/tmp/uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');

// Ensure directories exist on startup
ensureTempDirectories();

async function saveFile(file: formidable.File, fileCount: number): Promise<string> {
  // Validate file
  const validation = validateFileUpload(
    {
      size: file.size,
      name: file.originalFilename || file.newFilename,
      mimetype: file.mimetype || undefined,
    },
    fileCount
  );

  if (!validation.valid) {
    const errorMsg = validation.errors.map(e => e.message).join(', ');
    throw createError(ErrorCode.VALIDATION_ERROR, errorMsg, validation.errors);
  }

  // Check available space
  if (!hasAvailableSpace(file.size)) {
    throw createError(ErrorCode.SERVER_ERROR, 'Insufficient storage space available');
  }

  // Sanitize filename and save
  const sanitizedName = sanitizeFilename(file.originalFilename || file.newFilename);
  const data = fs.readFileSync(file.filepath);
  const dest = path.join(tmpDir, sanitizedName);
  fs.writeFileSync(dest, data);
  
  logger.debug('File saved', { originalName: file.originalFilename, savedPath: dest, size: file.size });
  return dest;
}

function makeJobId() {
  return `job-${Date.now()}`;
}

async function processHandler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const savedFiles: string[] = [];

  if (req.method !== 'POST') {
    throw createError(ErrorCode.VALIDATION_ERROR, 'Method not allowed');
  }

  logger.info('Processing request started');

  try {
    const form = formidable({ 
      multiples: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: 10,
    });

    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      }
    );

    const examFiles = files.examFiles ? (Array.isArray(files.examFiles) ? files.examFiles : [files.examFiles]) : [];
    const textbook = files.textbook ? (Array.isArray(files.textbook) ? files.textbook[0] : files.textbook) : null;

    if (examFiles.length === 0) {
      throw createError(ErrorCode.VALIDATION_ERROR, 'At least one exam paper file is required');
    }

    const totalFiles = examFiles.length + (textbook ? 1 : 0);
    const savedExamPaths: string[] = [];
    
    for (const f of examFiles) {
      const p = await saveFile(f, totalFiles);
      savedExamPaths.push(p);
      savedFiles.push(p);
    }
    
    let savedTextbookPath: string | null = null;
    if (textbook) {
      savedTextbookPath = await saveFile(textbook, totalFiles);
      savedFiles.push(savedTextbookPath);
    }

    logger.info('Files uploaded successfully', { 
      examFiles: savedExamPaths.length, 
      hasTextbook: !!savedTextbookPath 
    });
    
    // Track upload analytics
    const totalSize = savedExamPaths.reduce((sum, p) => sum + fs.statSync(p).size, 0);
    trackUpload(req, savedExamPaths.length, totalSize);

    // Extraction with error handling
    const extractedPieces: string[] = [];
    for (const p of savedExamPaths) {
      try {
        const ext = path.extname(p).toLowerCase();
        let text = '';
        
        if (ext === '.pdf') {
          text = await extractTextFromPDF(p);
        } else if (ext === '.docx') {
          text = await extractTextFromDocx(p);
        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          if (process.env.ENABLE_OCR === 'true') {
            text = await extractTextFromImage(p);
          } else {
            text = 'OCR is disabled. Enable it in settings to process images.';
          }
        } else {
          throw createError(ErrorCode.UNSUPPORTED_FILE_TYPE, `File type ${ext} is not supported`);
        }
        
        if (text.trim().length === 0) {
          logger.warn('No text extracted from file', { file: path.basename(p) });
        }
        
        extractedPieces.push(`--- Source: ${path.basename(p)} ---\n${text}`);
        logger.debug('Text extracted', { file: path.basename(p), length: text.length });
      } catch (error) {
        logger.error('Failed to extract text', error as Error, { file: p });
        throw createError(ErrorCode.PROCESSING_ERROR, `Failed to process file: ${path.basename(p)}`);
      }
    }

    let textbookText = '';
    if (savedTextbookPath) {
      try {
        const ext = path.extname(savedTextbookPath).toLowerCase();
        if (ext === '.pdf') {
          textbookText = await extractTextFromPDF(savedTextbookPath);
          logger.debug('Textbook processed', { length: textbookText.length });
        } else {
          throw createError(ErrorCode.UNSUPPORTED_FILE_TYPE, 'Textbook must be a PDF file');
        }
      } catch (error) {
        logger.error('Failed to process textbook', error as Error);
        throw createError(ErrorCode.PROCESSING_ERROR, 'Failed to process textbook file');
      }
    }

    const corpus = extractedPieces.join('\n\n');

    if (corpus.trim().length < 50) {
      logger.error('Insufficient content extracted', undefined, { 
        corpusLength: corpus.trim().length,
        filesProcessed: savedExamPaths.length,
        extractedLengths: extractedPieces.map((p, i) => ({ 
          file: path.basename(savedExamPaths[i]), 
          length: p.length 
        }))
      });
      
      throw createError(
        ErrorCode.VALIDATION_ERROR, 
        'Unable to extract readable text from the uploaded files. This may be due to:\n' +
        '1. Scanned/image-based PDFs (enable OCR in .env: ENABLE_OCR=true)\n' +
        '2. Corrupted or password-protected PDFs\n' +
        '3. Unsupported PDF format\n' +
        'Please try a different file or ensure the PDF contains selectable text.'
      );
    }
    
    if (corpus.trim().length < 100) {
      logger.warn('Low content extracted but proceeding', { corpusLength: corpus.trim().length });
    }

    // Summarize with AI
    logger.info('Starting AI summarization', { corpusLength: corpus.length });
    let summary: string;
    
    try {
      summary = await summarizeCorpus(corpus, textbookText || null);
      logger.info('AI summarization completed', { summaryLength: summary.length });
    } catch (error) {
      logger.error('AI summarization failed', error as Error);
      throw createError(ErrorCode.AI_SERVICE_ERROR, 'Failed to generate summary. Please try again later.');
    }

    // Save exports
    const jobId = makeJobId();
    try {
      const mdPath = exportToMD(summary, jobId);
      const txtPath = exportToTXT(summary, jobId);
      const pdfPath = exportToPDF(summary, jobId);
      const docxPath = await exportToDOCX(summary, jobId);

      const duration = Date.now() - startTime;
      logger.apiCall('/api/process', duration, 200);
      logger.metric('files_processed', savedExamPaths.length);

      return sendSuccess(res, {
        jobId,
        summary,
        exports: {
          md: `/api/download?jobId=${jobId}&format=md`,
          txt: `/api/download?jobId=${jobId}&format=txt`,
          pdf: `/api/download?jobId=${jobId}&format=pdf`,
          docx: `/api/download?jobId=${jobId}&format=docx`,
        },
      }, 'Exam prep summary generated successfully!');
    } catch (error) {
      logger.error('Failed to export files', error as Error);
      throw createError(ErrorCode.PROCESSING_ERROR, 'Failed to export summary files');
    }
  } catch (error) {
    // Clean up uploaded files on error
    savedFiles.forEach(file => deleteFile(file));
    throw error;
  }
}

// Apply middleware
export default corsMiddleware(
  rateLimitMiddleware(
    asyncHandler(processHandler)
  )
);
