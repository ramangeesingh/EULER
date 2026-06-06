# Quick Start - Git Clone Feature

## Start the Server

```bash
cd EULER
npm run dev
```

## Test the Feature

1. Open browser: http://localhost:5173
2. Click "Repo Intelligence" from sidebar
3. Enter GitHub URL: `https://github.com/vercel/next.js`
4. Click "Clone & Analyze"
5. Wait for analysis to complete

## Supported URLs

- `https://github.com/username/repo`
- `https://github.com/username/repo.git`
- `git@github.com:username/repo.git`

## Test Repositories

Small repos for quick testing:
- https://github.com/sindresorhus/is
- https://github.com/chalk/chalk
- https://github.com/axios/axios

Medium repos:
- https://github.com/expressjs/express
- https://github.com/facebook/create-react-app

## Features to Test

✅ Clone public repository
✅ View AI analysis
✅ Browse file tree
✅ Chat with repo context
✅ Search code
✅ Generate docs
✅ Bug detection
✅ Dependency analysis

## Troubleshooting

**"Git is not installed"**
- Install Git from https://git-scm.com

**"Repository too large"**
- Use a smaller repo (<100MB)

**"Repository not found or private"**
- Use a public repository
- Check URL spelling

**API Timeout**
- Repository may be too large
- Try a smaller repository
