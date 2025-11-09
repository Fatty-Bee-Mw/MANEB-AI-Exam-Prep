import fs from 'fs';
import path from 'path';

export function exportToMD(summary: string, jobId: string): string {
  const dir = path.join(process.cwd(), 'tmp', 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${jobId}.md`);
  fs.writeFileSync(filePath, summary, 'utf8');
  return filePath;
}
