import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

const tmpDir = process.env.UPLOAD_TMP_DIR || './tmp/uploads';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

async function saveFile(file: formidable.File) {
  const data = fs.readFileSync(file.filepath);
  const dest = path.join(tmpDir, file.originalFilename || file.newFilename);
  fs.writeFileSync(dest, data);
  return dest;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload error' });
    const saved: string[] = [];
    const allFiles = Object.values(files || {});
    for (const f of allFiles) {
      // @ts-ignore
      if (Array.isArray(f)) {
        for (const fi of f) {
          // @ts-ignore
          saved.push(await saveFile(fi));
        }
      } else {
        // @ts-ignore
        saved.push(await saveFile(f));
      }
    }
    res.status(200).json({ files: saved });
  });
}
