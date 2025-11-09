# 🎓 MANEB Exam Prep AI

**AI-Powered Exam Preparation Tool for African Schools**

Transform past exam papers and textbooks into concise, intelligent revision notes. Built specifically for MANEB (Malawi National Examination Board) students with African market optimizations.

[![Production Ready](https://img.shields.io/badge/production-ready-brightgreen)]() [![Next.js](https://img.shields.io/badge/Next.js-14-black)]() [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()

---

## 🌟 Features

### Core Functionality
- **Multi-format Support**: Upload PDF, DOCX, JPG, PNG exam papers
- **AI-Powered Summarization**: OpenAI GPT-4 generates concise revision notes
- **OCR Integration**: Extract text from scanned images using Tesseract.js
- **Multiple Export Formats**: Download as PDF, Word, Markdown, or plain text
- **Real-time Processing**: Get results in 30-60 seconds

### African Market Optimizations
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Slow Connection Support**: Compressed assets, lazy loading
- **Offline Detection**: Clear indicators when connection is lost
- **Low Bandwidth Mode**: Efficient file processing
- **Progress Indicators**: Clear feedback during uploads

### Production Features
- **Rate Limiting**: Prevents abuse (20 requests per 15 minutes)
- **File Validation**: Size limits, type checking, sanitization
- **Auto Cleanup**: Files deleted after 24 hours
- **Error Handling**: User-friendly error messages
- **Security Headers**: CORS, XSS protection, CSP
- **Structured Logging**: JSON logs for monitoring
- **Health Checks**: `/api/health` endpoint

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Add your OpenAI API key to .env
# Edit .env and set OPENAI_API_KEY=your_actual_key

# 4. Run development server
npm run dev

# 5. Open browser
# Visit http://localhost:3000
```

---

## 📦 Deployment to Netlify

### One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `.next`

3. **Set Environment Variables**
   
   In Netlify dashboard → Site settings → Environment variables:
   
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
   NEXT_PUBLIC_APP_NAME=MANEB Exam Prep AI
   UPLOAD_TMP_DIR=/tmp/uploads
   MAX_FILE_SIZE=10485760
   RATE_LIMIT_MAX=20
   API_SECRET_KEY=your_secret_key_for_cleanup
   ENABLE_RATE_LIMITING=true
   ENABLE_OCR=true
   ```

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (~3-5 minutes)
   - Your site is live! 🎉

### Post-Deployment

1. **Test the health endpoint**:
   ```bash
   curl https://your-app.netlify.app/api/health
   ```

2. **Set up monitoring** (optional):
   - Add your site to [UptimeRobot](https://uptimerobot.com)
   - Monitor `/api/health` endpoint

3. **Configure cleanup** (optional):
   - Use Netlify Scheduled Functions or external cron
   - Call `/api/cleanup` with authorization header

---

## 🛠️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model to use |
| `NEXT_PUBLIC_APP_URL` | Yes | - | Your app URL |
| `MAX_FILE_SIZE` | No | `10485760` | Max file size (10MB) |
| `MAX_FILES_PER_REQUEST` | No | `10` | Max files per upload |
| `RATE_LIMIT_MAX` | No | `20` | Requests per window |
| `FILE_RETENTION_HOURS` | No | `24` | Auto-delete after hours |
| `ENABLE_OCR` | No | `true` | Enable image OCR |
| `API_SECRET_KEY` | No | - | Secret for cleanup API |

---

## 📖 API Documentation

### POST `/api/process`

Process exam papers and generate summary.

**Request**: `multipart/form-data`
- `examFiles`: One or more exam paper files
- `textbook`: (Optional) Textbook PDF

**Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "job-1234567890",
    "summary": "Your revision notes...",
    "exports": {
      "pdf": "/api/download?jobId=job-1234567890&format=pdf",
      "docx": "/api/download?jobId=job-1234567890&format=docx",
      "txt": "/api/download?jobId=job-1234567890&format=txt",
      "md": "/api/download?jobId=job-1234567890&format=md"
    }
  },
  "message": "Exam prep summary generated successfully!"
}
```

### GET `/api/download`

Download generated files.

**Parameters**:
- `jobId`: Job ID from process response
- `format`: `pdf`, `docx`, `txt`, or `md`

### GET `/api/health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "openai": "configured",
    "storage": {
      "used": 50,
      "total": 2048,
      "usagePercent": 2,
      "status": "healthy"
    }
  }
}
```

---

## 🏗️ Project Structure

```
ExamPrepWebApp/
├── pages/
│   ├── api/
│   │   ├── process.ts      # Main processing endpoint
│   │   ├── download.ts     # File download
│   │   ├── health.ts       # Health check
│   │   └── cleanup.ts      # Manual cleanup
│   ├── _app.tsx            # App wrapper
│   └── index.tsx           # Main UI
├── lib/
│   ├── ai/
│   │   └── summarizer.ts   # OpenAI integration
│   ├── extractor/
│   │   ├── pdfExtract.ts   # PDF text extraction
│   │   ├── docxExtract.ts  # Word extraction
│   │   └── ocr.ts          # Image OCR
│   ├── export/
│   │   ├── pdfExport.ts    # PDF generation
│   │   ├── docxExport.ts   # Word generation
│   │   ├── mdExport.ts     # Markdown export
│   │   └── txtExport.ts    # Text export
│   ├── middleware/
│   │   ├── rateLimit.ts    # Rate limiting
│   │   └── cors.ts         # CORS handling
│   └── utils/
│       ├── validation.ts   # Input validation
│       ├── logger.ts       # Structured logging
│       ├── errorHandler.ts # Error management
│       └── fileCleanup.ts  # File management
├── styles/
│   └── globals.css         # Global styles
├── public/                 # Static assets
├── .env.example            # Environment template
├── netlify.toml            # Netlify config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

---

## 🔒 Security

- ✅ File validation and sanitization
- ✅ Rate limiting (20 req/15min)
- ✅ CORS protection
- ✅ XSS protection headers
- ✅ Path traversal prevention
- ✅ File size limits (10MB)
- ✅ Auto file cleanup (24 hours)
- ✅ Secure file downloads

---

## 🎯 Performance

- **First Load**: < 3s on 3G
- **Processing Time**: 30-60s average
- **Compression**: Enabled (Brotli/Gzip)
- **Caching**: Static assets cached
- **Image Optimization**: Next.js Image component

---

## 📊 Monitoring

### Recommended Tools
1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Error Tracking**: Sentry (set `SENTRY_DSN`)
3. **Analytics**: Google Analytics (set `NEXT_PUBLIC_GA_ID`)
4. **Logs**: Netlify Functions logs

### Key Metrics
- `/api/health` response time
- File processing success rate
- Storage usage percentage
- API rate limit hits

---

## 🐛 Troubleshooting

### Issue: "Not enough content extracted from files"
**Solution**: 
- **Scanned/Image PDFs**: Set `ENABLE_OCR=true` in your `.env` file
- **Corrupted PDFs**: Try opening the PDF in a viewer first to verify it works
- **Password-protected PDFs**: Remove password protection before uploading
- **Complex PDF formats**: Try converting to a simpler PDF format
- Check the console logs for specific extraction errors

### Issue: "Invalid PDF structure" error
**Solution**: 
- The PDF may be corrupted or have an unusual structure
- Try re-saving the PDF using Adobe Acrobat or similar tool
- Convert the PDF to images and back to PDF
- Enable OCR for scanned documents: `ENABLE_OCR=true`

### Issue: "AI service temporarily unavailable"
**Solution**: Check OpenAI API key is set correctly

### Issue: Files not processing
**Solution**: 
- Check file size < 10MB
- Verify file format (PDF, DOCX, JPG, PNG)
- Check server logs for errors
- Ensure PDF contains selectable text (not just images)

### Issue: Rate limit exceeded
**Solution**: Wait 15 minutes or adjust `RATE_LIMIT_MAX`

### Issue: Storage full
**Solution**: Run cleanup endpoint or reduce `FILE_RETENTION_HOURS`

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

MIT License - feel free to use for your school or organization

---

## 🌍 Built for Africa

This tool is specifically designed for:
- Low bandwidth environments
- Mobile-first users
- African education systems
- MANEB exam format

**Made with ❤️ for students across Malawi 🇲🇼 and Africa 🌍**

---

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check `/api/health` endpoint
- Review Netlify function logs

---

## 🎓 Future Enhancements

- [ ] Multi-language support (Chichewa, French, Portuguese)
- [ ] Student dashboard with history
- [ ] Share notes with classmates
- [ ] Offline PWA support
- [ ] Audio revision notes
- [ ] Quiz generation from papers
- [ ] Subject-specific tuning
- [ ] Bulk processing for teachers

---

**Ready to deploy? Let's help African students excel! 🚀**
