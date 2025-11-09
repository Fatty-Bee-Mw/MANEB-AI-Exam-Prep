import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Clean summary text for PDF export - replace emojis with text labels
 */
function cleanForPDF(text: string): string {
  // Replace emojis with text equivalents
  const replacements: { [key: string]: string } = {
    '📚': '[BOOK]',
    '🎯': '[TARGET]',
    '📖': '[TOPICS]',
    '✍️': '[QUESTIONS]',
    '📝': '[STUDY]',
    '💭': '[CONTENT]',
    '📄': '[DOCUMENT]',
    '🔑': '[KEY TERMS]',
    '💡': '[STRATEGY]',
    '🎓': '[EXAM]',
    '🌟': '[MOTIVATION]',
    '✓': '[CHECK]',
    '🚀': '[SUCCESS]',
    '🇲🇼': 'Malawi',
    '⭐': '*',
    '✅': '[X]',
    '❌': '[ ]',
  };

  let cleaned = text;
  
  // Replace known emojis
  for (const [emoji, replacement] of Object.entries(replacements)) {
    cleaned = cleaned.split(emoji).join(replacement);
  }
  
  // Remove any remaining emojis (Unicode range for emojis)
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  return cleaned;
}

export function exportToPDF(summary: string, jobId: string): string {
  const dir = path.join(process.cwd(), 'tmp', 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${jobId}.pdf`);

  // Clean the summary for PDF export
  const cleanedSummary = cleanForPDF(summary);

  const doc = new PDFDocument({ 
    autoFirstPage: false,
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const lines = cleanedSummary.split('\n');
  doc.addPage();
  doc.fontSize(12);
  doc.font('Helvetica');
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      // Main heading
      doc.fontSize(20).font('Helvetica-Bold');
      doc.text(line.substring(2), { width: 500 });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
    } else if (line.startsWith('## ')) {
      // Section heading
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(line.substring(3), { width: 500 });
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica');
    } else if (line.startsWith('### ')) {
      // Subsection heading
      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(line.substring(4), { width: 500 });
      doc.moveDown(0.2);
      doc.fontSize(12).font('Helvetica');
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text
      doc.font('Helvetica-Bold');
      doc.text(line.replace(/\*\*/g, ''), { width: 500 });
      doc.font('Helvetica');
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet points
      doc.text('  • ' + line.substring(2), { width: 490, indent: 10 });
    } else if (line.trim() === '---') {
      // Horizontal line
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown(0.3);
    } else {
      // Regular text
      doc.text(line, { width: 500 });
    }
  }

  doc.end();
  return filePath;
}
