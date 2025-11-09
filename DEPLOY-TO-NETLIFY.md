# 🚀 DEPLOY TO NETLIFY VIA GITHUB

Complete step-by-step guide to deploy your MANEB Exam Prep AI to Netlify.

---

## ✅ PREREQUISITES

Before starting, make sure you have:
- [ ] GitHub account (create at https://github.com/signup)
- [ ] Netlify account (create at https://app.netlify.com/signup)
- [ ] Git installed on your computer
- [ ] All environment variables ready

---

## 📋 STEP 1: PREPARE YOUR ENVIRONMENT VARIABLES

You need to set these in Netlify later:

```
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini
ADMIN_PASSWORD=Fatty@Likagwa
NOTIFICATION_EMAIL=ylikagwa@gmail.com
WHATSAPP_NUMBER=+265880646248
```

**IMPORTANT**: Copy these values from your `.env` file now!

---

## 🎯 STEP 2: INITIALIZE GIT REPOSITORY

Open your terminal in the project folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - MANEB Exam Prep AI"
```

---

## 📦 STEP 3: CREATE GITHUB REPOSITORY

### Option A: Via GitHub Website (Recommended)

1. Go to: https://github.com/new
2. **Repository name**: `maneb-exam-prep-ai`
3. **Description**: `AI-Powered MANEB Exam Prep Generator for Malawian Students`
4. **Visibility**: Choose **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### Option B: Via GitHub CLI

```bash
# Install GitHub CLI first: https://cli.github.com/
gh repo create maneb-exam-prep-ai --private --source=. --remote=origin
```

---

## 🔗 STEP 4: CONNECT LOCAL REPO TO GITHUB

After creating the GitHub repo, run these commands:

```bash
# Add GitHub as remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/maneb-exam-prep-ai.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/maneb-exam-prep-ai.git
git branch -M main
git push -u origin main
```

You'll be asked to login to GitHub - follow the prompts.

---

## 🌐 STEP 5: DEPLOY TO NETLIFY

### 5.1: Connect GitHub to Netlify

1. Go to: https://app.netlify.com/
2. Click **"Add new site"**
3. Select **"Import an existing project"**
4. Click **"GitHub"**
5. Authorize Netlify to access your GitHub
6. Select your repository: **maneb-exam-prep-ai**

### 5.2: Configure Build Settings

Netlify will auto-detect Next.js. Verify these settings:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `.next`

Click **"Show advanced"** and add:

**Environment Variables** (Click "New variable" for each):

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `ADMIN_PASSWORD` | `Fatty@Likagwa` |
| `NOTIFICATION_EMAIL` | `ylikagwa@gmail.com` |
| `WHATSAPP_NUMBER` | `+265880646248` |
| `NODE_VERSION` | `18` |

### 5.3: Deploy!

1. Click **"Deploy site"**
2. Wait 2-5 minutes for build
3. Your site will be live at: `https://random-name-123.netlify.app`

---

## 🎨 STEP 6: CUSTOMIZE YOUR DOMAIN

### Option A: Change Netlify Subdomain (Free)

1. Go to: Site settings → Domain management
2. Click **"Options"** → **"Edit site name"**
3. Change to: `maneb-exam-prep` or `fatty-exam-prep`
4. Your URL becomes: `https://maneb-exam-prep.netlify.app`

### Option B: Use Custom Domain (Optional)

1. Buy domain (e.g., manebexamprep.com)
2. In Netlify: Add custom domain
3. Update DNS records as shown

---

## 🔄 STEP 7: AUTOMATIC DEPLOYMENTS

Now whenever you make changes:

```bash
# Make your changes to code

# Stage all changes
git add .

# Commit with message
git commit -m "Update: description of changes"

# Push to GitHub
git push

# Netlify will automatically deploy!
```

**That's it!** Netlify detects the push and deploys automatically.

---

## ✅ VERIFY DEPLOYMENT

After deployment, test these:

### Test Basic Functionality:
- [ ] Homepage loads with neon glass UI
- [ ] Can upload PDF files
- [ ] AI generates summaries
- [ ] Can download PDF/Word/Text
- [ ] Feedback form works
- [ ] Admin panel accessible at `/admin`
- [ ] Admin login works with password

### Test on Mobile:
- [ ] Responsive design works
- [ ] Touch-friendly buttons
- [ ] Fast loading
- [ ] Upload works on mobile

---

## 🐛 TROUBLESHOOTING

### Build Fails: "Module not found"

**Solution**: Make sure all dependencies are in `package.json`
```bash
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Environment Variables Not Working

**Solution**: 
1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add missing variables
4. Click "Trigger deploy" → "Clear cache and deploy"

### Functions Timeout

**Solution**: Increase timeout in `netlify.toml`
```toml
[functions]
  timeout = 60
```

### Upload Size Limit

**Solution**: Netlify has 50MB limit for functions. Your PDF uploads should work fine, but if issues occur:
1. Check file size limits in your code
2. Consider using Netlify's Large Media addon

---

## 🔐 SECURITY CHECKLIST

Before going live:

- [ ] All API keys in environment variables (NOT in code)
- [ ] `.env` file in `.gitignore`
- [ ] Admin password is strong
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] No console.logs with sensitive data

---

## 📊 MONITORING

### View Logs:

1. Netlify Dashboard → Your site
2. Click "Functions" tab
3. View function logs for errors

### Analytics:

1. Netlify Dashboard → Analytics
2. See visitor stats
3. Monitor performance

---

## 🔄 UPDATE CHECKLIST

When making updates:

```bash
# 1. Make changes to code
# 2. Test locally first!
npm run dev

# 3. If working, commit and push
git add .
git commit -m "Add: new feature description"
git push

# 4. Watch Netlify deploy automatically
# 5. Test live site after deployment
```

---

## 💰 COST

**Netlify Free Tier Includes:**
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ 125k serverless function requests/month
- ✅ Enough for 1000+ students per month!

**If you exceed limits**, upgrade to Pro ($19/month).

---

## 🎯 QUICK REFERENCE

### Your URLs After Deployment:

```
Production Site: https://your-site-name.netlify.app
Admin Panel: https://your-site-name.netlify.app/admin
GitHub Repo: https://github.com/YOUR-USERNAME/maneb-exam-prep-ai
Netlify Dashboard: https://app.netlify.com/sites/your-site-name
```

### Common Commands:

```bash
# Check git status
git status

# See commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Pull latest changes
git pull

# View remotes
git remote -v
```

---

## 📚 NEXT STEPS AFTER DEPLOYMENT

1. **Share the Link**
   - Test with students
   - Get feedback
   - Share on social media

2. **Monitor Performance**
   - Check Netlify analytics
   - Review function logs
   - Monitor error rates

3. **Iterate Based on Feedback**
   - Fix bugs quickly
   - Add requested features
   - Improve UI/UX

4. **Scale as Needed**
   - Upgrade Netlify plan if needed
   - Optimize performance
   - Add caching

---

## 🎉 CONGRATULATIONS!

Once deployed, you'll have:
- ✅ Live production website
- ✅ Automatic deployments from GitHub
- ✅ HTTPS enabled by default
- ✅ Global CDN for fast loading
- ✅ Serverless functions for API
- ✅ Professional domain
- ✅ Analytics and monitoring

**Your MANEB Exam Prep AI is now helping students across Malawi!** 🇲🇼🎓

---

## 🆘 NEED HELP?

- Netlify Docs: https://docs.netlify.com/
- Next.js Docs: https://nextjs.org/docs
- GitHub Docs: https://docs.github.com/

---

**Ready to deploy? Follow the steps above in order!** 🚀
