# 🚀 Deployment Guide - MANEB Exam Prep AI

Complete step-by-step guide to deploy to production on Netlify.

---

## ✅ Pre-Deployment Checklist

### 1. Install Dependencies & Test Locally

```bash
# Install all packages
npm install

# Run type checking
npm run type-check

# Run linter
npm run lint

# Test locally
npm run dev
```

Open http://localhost:3000 and test:
- Upload a PDF exam paper
- Verify file validation works
- Check error messages display correctly
- Test all export formats (PDF, DOCX, TXT, MD)

### 2. Get OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Copy the key (you won't see it again!)
4. Save it securely

### 3. Prepare Repository

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Production-ready MANEB Exam Prep AI"

# Create GitHub repo (via GitHub website)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 📦 Netlify Deployment

### Option 1: Netlify UI (Recommended for beginners)

#### Step 1: Create Netlify Account
1. Go to https://app.netlify.com/signup
2. Sign up with GitHub (recommended)
3. Authorize Netlify to access your repositories

#### Step 2: Import Your Project
1. Click "Add new site" → "Import an existing project"
2. Choose "GitHub"
3. Search and select your repository
4. Click on the repository name

#### Step 3: Configure Build Settings
```
Build command: npm run build
Publish directory: .next
```

#### Step 4: Set Environment Variables

Click "Add environment variables" and add these:

**Required Variables:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=https://YOUR_SITE.netlify.app
NEXT_PUBLIC_APP_NAME=MANEB Exam Prep AI
```

**Optional But Recommended:**
```env
UPLOAD_TMP_DIR=/tmp/uploads
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=10
ALLOWED_FILE_TYPES=pdf,docx,jpg,jpeg,png
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW=900000
FILE_RETENTION_HOURS=24
API_SECRET_KEY=generate_a_random_string_here
ENABLE_CORS=true
ALLOWED_ORIGINS=https://YOUR_SITE.netlify.app
ENABLE_OCR=true
ENABLE_RATE_LIMITING=true
```

**For Analytics (Optional):**
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

#### Step 5: Deploy
1. Click "Deploy site"
2. Wait 3-5 minutes for build
3. Once deployed, you'll get a URL like: `random-name-123.netlify.app`

#### Step 6: Customize Domain (Optional)
1. Go to "Site settings" → "Domain management"
2. Click "Add custom domain"
3. Follow instructions to configure DNS

---

### Option 2: Netlify CLI (For advanced users)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

---

## 🧪 Post-Deployment Testing

### 1. Test Health Endpoint

```bash
curl https://your-site.netlify.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "openai": "configured",
    "storage": {
      "status": "healthy"
    }
  }
}
```

### 2. Test File Upload

1. Visit your site
2. Upload a sample PDF
3. Verify summary is generated
4. Download all export formats
5. Check for any console errors

### 3. Test Error Handling

**Test rate limiting:**
- Upload 21 files within 15 minutes
- Should see "Rate limit exceeded" message

**Test file size:**
- Try uploading file > 10MB
- Should see error before upload

**Test file types:**
- Try uploading .exe or .zip file
- Should show validation error

---

## 📊 Monitoring Setup

### 1. Uptime Monitoring (Free)

**UptimeRobot Setup:**
1. Go to https://uptimerobot.com
2. Sign up (free account)
3. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-site.netlify.app/api/health`
   - Interval: 5 minutes
4. Add alert contacts (email/SMS)

### 2. Error Tracking (Optional)

**Sentry Setup:**
1. Go to https://sentry.io
2. Create free account
3. Create new project (Next.js)
4. Copy DSN
5. Add to Netlify environment: `SENTRY_DSN=your_dsn_here`
6. Redeploy site

### 3. Analytics (Optional)

**Google Analytics:**
1. Create GA4 property
2. Get measurement ID (G-XXXXXXXXXX)
3. Add to Netlify: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
4. Redeploy

---

## 🔧 Maintenance

### Automated File Cleanup

**Option 1: Netlify Scheduled Functions**

Create `netlify/functions/scheduled-cleanup.ts`:
```typescript
import { schedule } from '@netlify/functions';
import { cleanupOldFiles } from '../../lib/utils/fileCleanup';

export const handler = schedule('0 * * * *', async () => {
  await cleanupOldFiles();
  return {
    statusCode: 200,
  };
});
```

**Option 2: External Cron (EasyCron)**

1. Sign up at https://www.easycron.com
2. Create new cron job:
   - URL: `https://your-site.netlify.app/api/cleanup`
   - Schedule: Every hour
   - Add header: `Authorization: Bearer YOUR_API_SECRET_KEY`

### Regular Maintenance Tasks

**Weekly:**
- Check `/api/health` endpoint
- Review Netlify function logs
- Monitor storage usage
- Check error rates in Sentry

**Monthly:**
- Review and rotate API keys
- Update dependencies: `npm update`
- Test all features end-to-end
- Review analytics data

---

## 🚨 Troubleshooting Production Issues

### Issue: Build Fails

**Check build logs in Netlify:**
```bash
# Or view in Netlify UI
netlify logs
```

**Common causes:**
- Missing environment variables
- TypeScript errors
- Dependency conflicts

**Solution:**
```bash
# Clear cache and rebuild
# In Netlify UI: Deploys → Trigger deploy → Clear cache and deploy site
```

### Issue: API Endpoints Return 500

**Check Netlify function logs:**
1. Netlify UI → Functions
2. Click on function name
3. View logs

**Common causes:**
- Missing OPENAI_API_KEY
- Rate limit exceeded on OpenAI
- File system permissions

### Issue: Files Not Processing

**Check:**
1. OpenAI API key is valid
2. OpenAI account has credits
3. File size < 10MB
4. File format is supported

### Issue: Slow Performance

**Solutions:**
1. Reduce `OPENAI_MAX_TOKENS` (default 1500)
2. Use faster model (gpt-3.5-turbo instead of gpt-4)
3. Enable caching
4. Optimize images in UI

---

## 💰 Cost Estimation

### Netlify (Free Tier)
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS
- ✅ Serverless functions

Upgrade needed if:
- More than ~10,000 requests/month
- Need more build minutes

### OpenAI API Costs

**GPT-4o-mini (Recommended):**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Estimated per request:**
- Average input: ~2,000 tokens = $0.0003
- Average output: ~500 tokens = $0.0003
- **Total: ~$0.0006 per summary**

**Monthly estimates:**
- 100 summaries: $0.06
- 1,000 summaries: $0.60
- 10,000 summaries: $6.00

### Total Cost

**For 1,000 students/month:**
- Netlify: $0 (free tier)
- OpenAI: ~$0.60
- **Total: ~$0.60/month** 🎉

---

## 🎯 Scaling for African Schools

### Handling High Traffic

**If you expect 10,000+ students:**

1. **Upgrade Netlify Plan**
   - Pro: $19/month
   - Better bandwidth
   - Priority support

2. **Optimize OpenAI Usage**
   - Cache common summaries
   - Use cheaper models for shorter papers
   - Implement queueing system

3. **Add CDN**
   - Cloudflare (free)
   - Speeds up global access

### Multi-School Deployment

**Option 1: Single Instance**
- Deploy once
- Share URL with all schools
- Monitor usage carefully

**Option 2: Per-School Instances**
- Fork repository for each school
- Separate Netlify sites
- Isolated costs and usage

---

## 📱 Marketing Your Deployment

### Promote to Students

1. **Create QR Code**
   - Use https://qr-code-generator.com
   - Print on posters around school

2. **Social Media**
   - WhatsApp groups
   - Facebook pages
   - Twitter/X

3. **Demo Videos**
   - Record screen demo
   - Upload to YouTube
   - Share on all platforms

### Measure Success

**Track these metrics:**
- Daily active users
- Average papers processed
- Popular export formats
- Peak usage times
- User feedback

---

## ✅ Launch Checklist

Before announcing to students:

- [ ] Site is live and accessible
- [ ] Health check returns "healthy"
- [ ] Test upload with real exam paper
- [ ] All export formats work
- [ ] Error messages are clear
- [ ] Mobile UI looks good
- [ ] Monitoring is set up
- [ ] Have budget for OpenAI costs
- [ ] Support plan ready (email/WhatsApp)
- [ ] Backup admin contact set

---

## 🎉 You're Ready!

Your production-ready MANEB Exam Prep AI is now live and helping African students succeed! 

**Share your deployment:**
- URL: ___________________
- Admin email: ___________________
- Support contact: ___________________

**Monitor daily for the first week to catch any issues early!**

---

**Questions? Check README.md or open a GitHub issue.**

🚀 **Happy deploying! Let's transform African education together!** 🌍
