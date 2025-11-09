@echo off
cls
echo ============================================================
echo   PUSH TO GITHUB - MANEB Exam Prep AI
echo ============================================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
)

echo Current Git Status:
echo.
git status
echo.
echo ============================================================
echo.

set /p confirm="Add all files and commit? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo Adding all files...
git add .
echo.

set /p message="Enter commit message: "
if "%message%"=="" set message="Update code"

echo.
echo Committing with message: %message%
git commit -m "%message%"
echo.

echo ============================================================
echo.
echo IMPORTANT: Have you created a GitHub repository?
echo.
echo If NOT:
echo 1. Go to: https://github.com/new
echo 2. Repository name: maneb-exam-prep-ai
echo 3. Choose Private or Public
echo 4. Click "Create repository"
echo.
echo If YES, continue below...
echo.
echo ============================================================
echo.

set /p username="Enter your GitHub username: "
if "%username%"=="" (
    echo Error: GitHub username is required!
    pause
    exit /b
)

set repo_url=https://github.com/%username%/maneb-exam-prep-ai.git

echo.
echo Adding remote: %repo_url%
git remote remove origin 2>nul
git remote add origin %repo_url%
echo.

echo Renaming branch to main...
git branch -M main
echo.

echo ============================================================
echo   PUSHING TO GITHUB...
echo ============================================================
echo.
echo You may be asked to login to GitHub.
echo Follow the prompts in your browser.
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! Code pushed to GitHub!
    echo ============================================================
    echo.
    echo Your repository: https://github.com/%username%/maneb-exam-prep-ai
    echo.
    echo NEXT STEPS:
    echo 1. Go to: https://app.netlify.com/
    echo 2. Click "Add new site"
    echo 3. Import from GitHub
    echo 4. Select your repository
    echo 5. Add environment variables
    echo 6. Deploy!
    echo.
    echo See DEPLOY-TO-NETLIFY.md for detailed instructions.
    echo.
) else (
    echo.
    echo ============================================================
    echo   ERROR: Failed to push to GitHub
    echo ============================================================
    echo.
    echo Possible issues:
    echo 1. Repository doesn't exist on GitHub
    echo 2. Wrong username
    echo 3. Authentication failed
    echo 4. No internet connection
    echo.
    echo Please check and try again.
    echo.
)

echo ============================================================
pause
