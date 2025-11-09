import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';

/**
 * Clean summary text for DOCX export - replace emojis with text labels
 */
function cleanForDOCX(text: string): string {
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

export async function exportToDOCX(summary: string, jobId: string): Promise<string> {
  // Clean the summary for DOCX export
  const cleanedSummary = cleanForDOCX(summary);
  
  const paragraphs = cleanedSummary.split('\n').map((line) => {
    if (line.startsWith('# ')) {
      // Main heading
      return new Paragraph({ 
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1,
      });
    } else if (line.startsWith('## ')) {
      // Section heading
      return new Paragraph({ 
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2,
      });
    } else if (line.startsWith('### ')) {
      // Subsection heading
      return new Paragraph({ 
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3,
      });
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text
      return new Paragraph({ 
        children: [new TextRun({ 
          text: line.replace(/\*\*/g, ''),
          bold: true 
        })] 
      });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet points
      return new Paragraph({ 
        text: line.substring(2),
        bullet: {
          level: 0
        }
      });
    } else {
      // Regular text
      return new Paragraph({ 
        children: [new TextRun(line)] 
      });
    }
  });

  const doc = new Document({
    creator: "MANEB Exam Prep AI - Powered by Fatty AI Ed-Tech",
    title: "Exam Revision Notes",
    description: "AI-generated exam preparation notes for Malawian students",
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const dir = path.join(process.cwd(), 'tmp', 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${jobId}.docx`);
  fs.writeFileSync(filePath, buffer as any);
  return filePath;
}
