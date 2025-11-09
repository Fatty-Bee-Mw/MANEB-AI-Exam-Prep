import mammoth from 'mammoth';

export async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (err) {
    console.error('mammoth error', err);
    return '';
  }
}
