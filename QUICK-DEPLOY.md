# ⚡ QUICK DEPLOY TO NETLIFY (5 MINUTES!)

Super fast deployment guide - just follow these steps!

---

## 🎯 STEP 1: CREATE GITHUB ACCOUNT (if you don't have one)

1. Go to: https://github.com/signup
2. Enter your email
3. Create password
4. Choose username
5. Verify email

**Skip if you already have GitHub account!**

---

## 🎯 STEP 2: CREATE NETLIFY ACCOUNT

1. Go to: https://app.netlify.com/signup
2. Click "Sign up with GitHub"
3. Authorize Netlify

**This links your GitHub and Netlify accounts!**

---

## 🎯 STEP 3: PUSH TO GITHUB (Easy Way!)

1. **Double-click**: `PUSH-TO-GITHUB.bat`
2. Type **Y** when asked
3. Enter a commit message (e.g., "Initial version")
4. Enter your **GitHub username**
5. Follow login prompts in browser
6. Wait for "SUCCESS!" message

**That's it! Your code is now on GitHub!**

---

## 🎯 STEP 4: DEPLOY TO NETLIFY

1. Go to: https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"**
4. Find and select: **maneb-exam-prep-ai**
5. Click **"Deploy site"**

**Wait 2-3 minutes... Done!**

---

## 🎯 STEP 5: ADD ENVIRONMENT VARIABLES

This is IMPORTANT for AI to work!

1. In Netlify dashboard, go to: **Site configuration** → **Environment variables**
2. Click **"Add a variable"**
3. Add these variables (get values from your `.env` file):

```
OPENAI_API_KEY = (your API key)
OPENAI_MODEL = gpt-4o-mini
ADMIN_PASSWORD = Fatty@Likagwa
NOTIFICATION_EMAIL = ylikagwa@gmail.com
WHATSAPP_NUMBER = +265880646248
```

4. After adding all, click **"Trigger deploy"**

**Wait 2 minutes for redeployment!**

---

## 🎯 STEP 6: TEST YOUR LIVE SITE!

1. Click the site URL (e.g., https://random-name-123.netlify.app)
2. Test:
   - Upload a PDF
   - Generate summary
   - Download files
   - Admin panel: `/admin`

**If everything works - CONGRATULATIONS! You're live!** 🎉

---

## 🎨 BONUS: CHANGE SITE NAME

1. Go to: **Site configuration** → **Site details**
2. Click **"Change site name"**
3. Enter: `maneb-exam-prep` (or any available name)
4. Your URL becomes: `https://maneb-exam-prep.netlify.app`

---

## 🔄 FUTURE UPDATES

When you make changes:

```bash
# Option 1: Use the batch file
Double-click PUSH-TO-GITHUB.bat

# Option 2: Use git commands
git add .
git commit -m "Update description"
git push
```

**Netlify will auto-deploy!** No need to do anything else!

---

## 🆘 TROUBLESHOOTING

### Problem: Can't push to GitHub

**Solution**: 
1. Make sure you created the repository on GitHub first
2. Go to: https://github.com/new
3. Name it: `maneb-exam-prep-ai`
4. Create it (don't initialize with anything)
5. Try pushing again

### Problem: Build fails on Netlify

**Solution**:
1. Check environment variables are set
2. Make sure `OPENAI_API_KEY` is correct
3. Click "Trigger deploy" → "Clear cache and deploy"

### Problem: AI doesn't work on live site

**Solution**:
1. Check environment variables in Netlify
2. Make sure `OPENAI_API_KEY` is set correctly
3. Check function logs for errors

---

## 📞 NEED MORE HELP?

- **Full guide**: Read `DEPLOY-TO-NETLIFY.md`
- **Environment variables**: See `NETLIFY-ENV-VARIABLES.txt`
- **GitHub help**: https://docs.github.com/
- **Netlify help**: https://docs.netlify.com/

---

## ✅ CHECKLIST

Before deploying:
- [ ] GitHub account created
- [ ] Netlify account created
- [ ] Code pushed to GitHub
- [ ] Repository visible on GitHub
- [ ] Netlify connected to GitHub
- [ ] Site deployed
- [ ] Environment variables added
- [ ] Site tested and working

---

**Total Time: 5-10 minutes from start to live site!** ⚡🚀

---

## 🎉 YOU'RE DONE!

Your app is now:
- ✅ Live on the internet
- ✅ Has a professional URL
- ✅ Auto-deploys when you push to GitHub
- ✅ Has HTTPS enabled
- ✅ Hosted on fast global CDN
- ✅ Completely free (Netlify free tier)

**Share your site with students and start helping them prepare for exams!** 📚🎓
