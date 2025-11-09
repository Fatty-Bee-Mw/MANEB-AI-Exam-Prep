# 🚀 Quick Setup Guide

## Issues Fixed

### 1. ✅ Next.js Configuration Warning
**Fixed**: Removed invalid `api` property from `next.config.js` that was causing the warning.

### 2. ✅ PDF Extraction Errors
**Fixed**: Enhanced PDF extraction with multi-layered fallback strategies:
- Primary: Standard text extraction (fast)
- Fallback 1: Alternative parsing methods for complex PDFs
- Fallback 2: OCR for scanned/image-based PDFs
- Better error messages explaining the issue

## Required Setup Steps

### Step 1: Create Environment File

You need to create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Or create it manually with these essential settings:

```env
# REQUIRED: Your OpenAI API Key
OPENAI_API_KEY=your_actual_api_key_here

# PDF Processing Settings
ENABLE_OCR=true

# Other defaults (can keep as is)
OPENAI_MODEL=gpt-4o-mini
UPLOAD_TMP_DIR=/tmp/uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_MAX=20
ENABLE_RATE_LIMITING=true
```

### Step 2: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and paste it into your `.env` file

### Step 3: Start the Development Server

```bash
# Install dependencies (if not already done)
npm install

# Start the server
npm run dev
```

The server will start at: http://localhost:3000

## Understanding the PDF Extraction

Your PDF failed because it had an "Invalid PDF structure". This can happen with:

1. **Scanned PDFs** - PDFs created by scanning physical documents
2. **Image-based PDFs** - PDFs that contain images instead of text
3. **Corrupted PDFs** - PDFs with structural issues
4. **Password-protected PDFs** - Encrypted files

### The New Solution

The enhanced extraction now:

1. **Tries multiple parsing methods** - If one fails, it tries another
2. **Uses OCR for scanned PDFs** - When `ENABLE_OCR=true`, it can read text from images
3. **Provides detailed error messages** - Tells you exactly why extraction failed
4. **Logs everything** - Check your console for detailed extraction info

### Testing Your PDF

To test if your PDF will work:

1. Open the PDF in a viewer (Adobe Reader, Chrome, etc.)
2. Try to select and copy some text
3. If you can copy text → Standard extraction should work
4. If you can't copy text (it's like an image) → You need OCR enabled

## OCR Configuration

OCR (Optical Character Recognition) extracts text from images and scanned documents.

**When to enable**: 
- Your PDFs are scanned documents
- PDFs show images instead of selectable text
- You get "no text extracted" errors

**How to enable**:
Set in your `.env` file:
```env
ENABLE_OCR=true
```

**Note**: OCR is slower (adds 10-30 seconds per file) but works with scanned documents.

## Verifying the Fixes

### 1. No More Config Warning

Start the dev server - you should see:
```
✓ Ready in 5.8s
```

Without the warning:
```
⚠ Invalid next.config.js options detected
```

### 2. Better PDF Processing

Upload a PDF - you'll now see detailed logs:
```
[DEBUG] Attempting standard PDF text extraction
[DEBUG] Successfully extracted text from PDF
```

Or if it fails:
```
[WARN] Standard PDF extraction failed
[DEBUG] Attempting PDF extraction with alternative options
```

## Common Issues After Setup

### "OPENAI_API_KEY is not set"
→ Make sure you created the `.env` file and added your API key

### "Not enough content extracted"
→ Set `ENABLE_OCR=true` if your PDF is scanned
→ Check that your PDF isn't corrupted
→ Try a different PDF file

### Files not uploading
→ Check file size is under 10MB
→ Ensure file format is .pdf, .docx, .jpg, or .png
→ Check your console for specific errors

## Next Steps

1. ✅ Create `.env` file with your OpenAI API key
2. ✅ Run `npm run dev`
3. ✅ Test with a simple text-based PDF first
4. ✅ If it fails, enable OCR and try again
5. ✅ Check the detailed logs in your terminal

## Need Help?

Check the troubleshooting section in `README.md` or review the console logs for specific error messages.

---

**Your app is now production-ready with robust PDF handling! 🎉**
