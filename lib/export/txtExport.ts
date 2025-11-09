import fs from 'fs';
import path from 'path';

/**
 * Clean summary text for TXT export - replace emojis with text labels
 */
function cleanForTXT(text: string): string {
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

export function exportToTXT(summary: string, jobId: string): string {
  // Clean the summary for TXT export
  const cleanedSummary = cleanForTXT(summary);
  
  const dir = path.join(process.cwd(), 'tmp', 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${jobId}.txt`);
  fs.writeFileSync(filePath, cleanedSummary, 'utf8');
  return filePath;
}
