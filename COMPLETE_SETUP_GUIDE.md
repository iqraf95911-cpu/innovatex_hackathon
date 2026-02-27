# 🚀 DevIntel AI - Complete Setup Guide

## ✅ SYSTEM STATUS: FULLY OPERATIONAL

Both frontend and backend servers are running successfully!

---

## 🌐 Access Your Application

### 🎨 Frontend (User Interface)
**URL:** http://localhost:3000

**Pages:**
- Landing Page: http://localhost:3000/
- Dashboard: http://localhost:3000/dashboard.html
- Settings: http://localhost:3000/settings.html

### 🤖 Backend (AI API)
**URL:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs (Interactive Swagger UI)

---

## 📋 Quick Start Guide

### 1️⃣ First Time Setup (5 minutes)

1. **Open the application:**
   - Go to http://localhost:3000

2. **Configure GitHub Token:**
   - Click "Settings" or go to http://localhost:3000/settings.html
   - Generate a GitHub Personal Access Token:
     * Visit https://github.com/settings/tokens/new
     * Name it "DevIntel AI"
     * Select scope: `repo` (full repository access)
     * Click "Generate token" and copy it
   - Paste the token in the settings page
   - Click "Connect GitHub"
   - You should see "● Connected" status

3. **Start Using AI Agents:**
   - Go to Dashboard: http://localhost:3000/dashboard.html
   - Choose any AI agent from the sidebar
   - Enter a repository (e.g., `facebook/react`)
   - Click the analyze button

---

## 🤖 Available AI Agents

### 1. Issue Classifier 🏷️
**What it does:** Automatically classifies GitHub issues

**Features:**
- Classification: Bug, Feature, Refactor, or Question
- Priority: Low, Medium, High
- Suggested labels
- AI reasoning
- Confidence score

**How to use:**
1. Click "Issue Classifier" in sidebar
2. Enter repo: `owner/repo` (e.g., `facebook/react`)
3. Click "🚀 Analyze Issues"
4. View results in 10-30 seconds

---

### 2. PR Intelligence 🔍
**What it does:** Analyzes pull requests for risk and quality

**Features:**
- Risk level assessment (Low/Medium/High)
- AI-generated summary
- Review checklist
- File change analysis

**How to use:**
1. Click "PR Intelligence" in sidebar
2. Enter repo: `owner/repo`
3. Click "🚀 Analyze PRs"
4. View risk levels and checklists

---

### 3. Assignee Recommender 👤
**What it does:** Recommends best developers to assign to issues

**Features:**
- Developer scoring based on expertise
- Commit history analysis
- Confidence ratings
- Detailed reasoning

**How to use:**
1. Click "Assignee Recommender" in sidebar
2. Enter repo: `owner/repo`
3. Click "🚀 Find Assignees"
4. View top 3 recommendations per issue

---

### 4. Reviewer Recommender 👥
**What it does:** Suggests optimal code reviewers for PRs

**Features:**
- File ownership analysis
- Recent activity tracking
- Expertise matching
- Confidence scoring

**How to use:**
1. Click "Reviewer Recommender" in sidebar
2. Enter repo: `owner/repo`
3. Click "🚀 Find Reviewers"
4. View suggested reviewers per PR

---

### 5. Workload Analyzer ⚖️
**What it does:** Analyzes team workload and suggests balancing

**Features:**
- Per-developer load scores
- Open issues count
- Pending reviews count
- AI-powered recommendations
- Visual load bars

**How to use:**
1. Click "Workload Analyzer" in sidebar
2. Enter repo: `owner/repo`
3. Click "🚀 Analyze Workload"
4. View load distribution and AI advice

---

### 6. Dashboard Overview 📊
**What it does:** Shows repository health and team metrics

**Features:**
- Key metrics (repos, cycle time, velocity, review score)
- Merged PRs trend chart
- Top contributors chart
- Recent pull requests table
- Repository health table
- Activity feed

**Auto-loads:** When you open the dashboard

---

## 🔧 Technical Architecture

### Frontend Stack:
- **Server:** Express.js (Node.js)
- **Port:** 3000
- **UI:** Vanilla JavaScript, HTML5, CSS3
- **Charts:** Chart.js
- **Design:** Modern dark theme with responsive layout

### Backend Stack:
- **Framework:** FastAPI (Python)
- **Port:** 8000
- **AI:** Google Gemini 1.5 Flash
- **Architecture:** Multi-agent system
- **API:** RESTful with automatic OpenAPI docs

### Data Flow:
```
User Browser (3000)
    ↓
Frontend Server (Express)
    ↓
GitHub API (repo data) + Backend API (AI analysis)
    ↓
AI Agents (FastAPI)
    ↓
Google Gemini LLM
```

---

## 📊 API Endpoints Reference

### Backend AI Endpoints (Port 8000):

#### Health & Config:
- `GET /api/ai/health` - Health check
- `GET /api/ai/config/status` - Check GitHub/LLM connection
- `POST /api/ai/config/token` - Update tokens

#### AI Analysis:
- `POST /api/ai/analyze-issues` - Issue classification + assignee recommendations
- `POST /api/ai/analyze-prs` - PR intelligence + reviewer recommendations
- `POST /api/ai/analyze-workload` - Team workload analysis

### Frontend API Endpoints (Port 3000):

#### Settings:
- `POST /api/settings/token` - Save GitHub token
- `GET /api/settings/token-status` - Check connection status

#### GitHub Data:
- `GET /api/repos` - List user repositories
- `GET /api/repos/:owner/:repo/pulls` - Get PRs for a repo
- `GET /api/repos/:owner/:repo/contributors` - Get contributors
- `GET /api/stats` - Aggregated statistics
- `GET /api/activity` - Recent activity feed
- `GET /api/pulls` - All PRs across repos

---

## 🎯 Example Workflows

### Workflow 1: Analyze a New Repository
1. Go to Dashboard
2. Click "Issue Classifier"
3. Enter: `microsoft/vscode`
4. Review issue classifications
5. Click "Assignee Recommender"
6. Enter same repo
7. See who should work on each issue

### Workflow 2: PR Review Optimization
1. Click "PR Intelligence"
2. Enter: `vercel/next.js`
3. Review risk levels and checklists
4. Click "Reviewer Recommender"
5. Enter same repo
6. Assign optimal reviewers

### Workflow 3: Team Management
1. Click "Workload Analyzer"
2. Enter your team's repo
3. View load distribution
4. Read AI recommendations
5. Redistribute tasks accordingly

---

## 🔐 Security & Privacy

- GitHub tokens stored in server memory only (not persisted to disk)
- Tokens never sent to external services except GitHub API
- All API calls use HTTPS
- No data stored permanently
- Session-based authentication

---

## 🐛 Troubleshooting

### Issue: "GitHub token not configured"
**Solution:** Go to Settings and configure your GitHub token

### Issue: "Failed to load"
**Solution:** 
1. Check if backend is running (http://localhost:8000/api/ai/health)
2. Check if frontend is running (http://localhost:3000)
3. Verify GitHub token is valid

### Issue: Agent takes too long
**Solution:** 
- Large repos (1000+ issues/PRs) may take 30-60 seconds
- Try with a smaller repo first
- Check backend logs for errors

### Issue: Charts not showing
**Solution:**
- Ensure Chart.js is loaded (check browser console)
- Refresh the page
- Check if data is available

---

## 📝 Configuration Files

### Backend Configuration:
- **File:** `backend/.env`
- **Contains:** 
  - `GITHUB_TOKEN` - Your GitHub Personal Access Token
  - `GEMINI_API_KEY` - Google Gemini API key

### Frontend Configuration:
- **File:** `package.json`
- **Port:** Defined in `server.js` (default: 3000)

### API Configuration:
- **Frontend API URL:** Defined in `js/app.js` (line 3)
- **Backend API URL:** http://localhost:8000

---

## 🚀 Running the Servers

### Both servers are currently running!

**Backend (Python/FastAPI):**
```bash
python backend/main.py
# Running on http://localhost:8000
```

**Frontend (Node.js/Express):**
```bash
npm start
# Running on http://localhost:3000
```

### To stop servers:
- Press `Ctrl+C` in the terminal where they're running
- Or close the terminal windows

### To restart:
```bash
# Backend
cd backend
python main.py

# Frontend (in new terminal)
npm start
```

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs
- **Backend Status:** See `BACKEND_STATUS.md`
- **Frontend Status:** See `FRONTEND_STATUS.md`
- **GitHub API Docs:** https://docs.github.com/en/rest
- **Gemini API Docs:** https://ai.google.dev/docs

---

## ✨ Features Summary

✅ 6 AI-powered agents
✅ Real-time GitHub data integration
✅ Interactive dashboard with charts
✅ Multi-agent orchestration
✅ LLM-powered insights with rule-based fallbacks
✅ Modern, responsive UI
✅ RESTful API with OpenAPI documentation
✅ Session-based token management
✅ Activity feed and metrics
✅ Repository health monitoring

---

## 🎉 You're All Set!

Your DevIntel AI application is fully operational. Open http://localhost:3000 and start exploring!

**Pro Tips:**
- Try analyzing popular repos like `facebook/react` or `microsoft/vscode`
- Use the search box (⌘K) for quick navigation
- Check the API docs at http://localhost:8000/docs
- All agents work with any public GitHub repository
- Private repos require appropriate token permissions

Enjoy your AI-powered development intelligence platform! 🚀
