# 🚀 DevIntel AI - Autonomous Dev Productivity Assistant

> AI-powered repository intelligence for engineering teams. Multi-agent system for issue classification, PR analysis, workload balancing, and team productivity insights.

---

## ✅ SYSTEM STATUS

🟢 **FULLY OPERATIONAL** - Both servers running!

- **Frontend:** http://localhost:3000 ✅
- **Backend:** http://localhost:8000 ✅
- **API Docs:** http://localhost:8000/docs ✅

---

## 🎯 Quick Start

1. **Open the app:** http://localhost:3000
2. **Configure GitHub token:** Go to Settings → Generate token → Connect
3. **Use AI agents:** Dashboard → Select agent → Enter repo → Analyze

**Example:** Try analyzing `facebook/react` or `microsoft/vscode`

---

## 🤖 AI Agents

| Agent | Icon | Purpose | Output |
|-------|------|---------|--------|
| **Repository Analyzer** | 📦 | Analyze entire repository | Features, tech stack, architecture, recommendations |
| **Issue Classifier** | 🏷️ | Classify issues | Bug/Feature/Refactor/Question + Priority + Labels |
| **PR Intelligence** | 🔍 | Analyze PRs | Risk level + Summary + Review checklist |
| **Assignee Recommender** | 👤 | Suggest assignees | Top 3 developers per issue with reasoning |
| **Workload Analyzer** | ⚖️ | Team workload | Load scores + AI balancing recommendations |
| **Dashboard** | 📊 | Overview | Metrics, charts, activity feed |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser (Port 3000)                  │
│  Landing Page │ Dashboard │ Settings │ AI Agent Panels      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│  Express Server │            │  FastAPI Backend │
│   (Frontend)    │            │   (AI Agents)    │
│   Port 3000     │            │   Port 8000      │
└────────┬────────┘            └────────┬─────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌──────────────────┐
│   GitHub API    │            │  Google Gemini   │
│  (Repo Data)    │            │  (LLM Analysis)  │
└─────────────────┘            └──────────────────┘
```

---

## 📁 Project Structure

```
DevIntel-AI/
├── backend/                    # Python FastAPI backend
│   ├── agents/                # AI agent implementations
│   │   ├── planner_agent.py          # Orchestrator
│   │   ├── issue_classification_agent.py
│   │   ├── assignee_recommendation_agent.py
│   │   ├── pr_intelligence_agent.py
│   │   ├── reviewer_recommendation_agent.py
│   │   └── workload_analysis_agent.py
│   ├── services/              # Core services
│   │   ├── github_service.py         # GitHub API client
│   │   └── llm_service.py            # Gemini LLM integration
│   ├── routes/                # API routes
│   ├── schemas/               # Pydantic models
│   ├── utils/                 # Utilities & scoring
│   ├── main.py               # FastAPI entry point
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
│
├── js/                        # Frontend JavaScript
│   └── app.js                # Main application logic
├── css/                       # Stylesheets
│   └── styles.css            # UI styling
├── index.html                # Landing page
├── dashboard.html            # Main dashboard
├── settings.html             # Settings page
├── server.js                 # Express server
├── package.json              # Node.js dependencies
│
└── Documentation/
    ├── COMPLETE_SETUP_GUIDE.md    # Full setup guide
    ├── BACKEND_STATUS.md          # Backend details
    └── FRONTEND_STATUS.md         # Frontend details
```

---

## 🔧 Tech Stack

### Frontend
- **Server:** Express.js (Node.js)
- **UI:** Vanilla JavaScript, HTML5, CSS3
- **Charts:** Chart.js
- **Design:** Modern dark theme, responsive

### Backend
- **Framework:** FastAPI (Python 3.13)
- **AI:** Google Gemini 1.5 Flash
- **HTTP Client:** httpx (async)
- **Validation:** Pydantic
- **Architecture:** Multi-agent system

### APIs
- **GitHub REST API v3** - Repository data
- **Google Gemini API** - LLM analysis

---

## 📊 Features

### Dashboard Overview
- ✅ Key metrics (repos, cycle time, velocity, review score)
- ✅ Merged PRs trend chart
- ✅ Top contributors visualization
- ✅ Recent pull requests table
- ✅ Repository health monitoring
- ✅ Real-time activity feed

### AI-Powered Analysis
- ✅ Issue classification with confidence scoring
- ✅ PR risk assessment and review checklists
- ✅ Smart assignee recommendations
- ✅ Intelligent reviewer suggestions
- ✅ Team workload balancing
- ✅ LLM-powered insights with rule-based fallbacks

### Developer Experience
- ✅ Interactive API documentation (Swagger UI)
- ✅ Real-time data updates
- ✅ Responsive design
- ✅ Error handling with user-friendly messages
- ✅ Loading states and animations
- ✅ Session-based token management

---

## 🚀 API Endpoints

### Backend (Port 8000)

**Health & Config:**
- `GET /api/ai/health` - Health check
- `GET /api/ai/config/status` - Connection status
- `POST /api/ai/config/token` - Update tokens

**AI Analysis:**
- `POST /api/ai/analyze-issues` - Issue classification + assignee recommendations
- `POST /api/ai/analyze-prs` - PR intelligence + reviewer recommendations
- `POST /api/ai/analyze-workload` - Team workload analysis

### Frontend (Port 3000)

**Settings:**
- `POST /api/settings/token` - Save GitHub token
- `GET /api/settings/token-status` - Check connection

**GitHub Data:**
- `GET /api/repos` - List repositories
- `GET /api/pulls` - All PRs across repos
- `GET /api/stats` - Aggregated statistics
- `GET /api/activity` - Recent activity

---

## 🔐 Configuration

### Environment Variables (backend/.env)
```env
GITHUB_TOKEN=your_github_personal_access_token
GEMINI_API_KEY=your_gemini_api_key
```

### Generate GitHub Token
1. Go to https://github.com/settings/tokens/new
2. Name: "DevIntel AI"
3. Scope: `repo` (full repository access)
4. Generate and copy token
5. Add to `.env` or configure via Settings page

---

## 📖 Documentation

- **Complete Setup Guide:** [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)
- **Backend Details:** [BACKEND_STATUS.md](BACKEND_STATUS.md)
- **Frontend Details:** [FRONTEND_STATUS.md](FRONTEND_STATUS.md)
- **API Documentation:** http://localhost:8000/docs

---

## 🎯 Example Usage

### Analyze Issues
```bash
curl -X POST http://localhost:8000/api/ai/analyze-issues \
  -H "Content-Type: application/json" \
  -d '{"owner": "facebook", "repo": "react"}'
```

### Analyze PRs
```bash
curl -X POST http://localhost:8000/api/ai/analyze-prs \
  -H "Content-Type: application/json" \
  -d '{"owner": "vercel", "repo": "next.js"}'
```

### Analyze Workload
```bash
curl -X POST http://localhost:8000/api/ai/analyze-workload \
  -H "Content-Type: application/json" \
  -d '{"owner": "microsoft", "repo": "vscode"}'
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GitHub token not configured" | Go to Settings and add your token |
| Backend not responding | Check http://localhost:8000/api/ai/health |
| Frontend not loading | Verify http://localhost:3000 is accessible |
| Agent takes too long | Large repos may take 30-60 seconds |
| Charts not showing | Refresh page, check browser console |

---

## 🎉 Getting Started

1. **Open the application:**
   ```
   http://localhost:3000
   ```

2. **Configure GitHub token:**
   - Click "Settings" in the sidebar
   - Follow the token generation guide
   - Paste and connect

3. **Start analyzing:**
   - Go to Dashboard
   - Select any AI agent
   - Enter a repository (e.g., `facebook/react`)
   - Click analyze

4. **Explore features:**
   - View metrics and charts
   - Check team workload
   - Get PR insights
   - Monitor repository health

---

## 📝 Notes

- All AI agents work with any public GitHub repository
- Private repos require appropriate token permissions
- LLM analysis uses Google Gemini 1.5 Flash
- Rule-based fallbacks ensure functionality without LLM
- Tokens stored in memory only (not persisted)
- Auto-reload enabled for development

---

### 🌟 Key Highlights

✨ **6 specialized AI agents** working together
✨ **Multi-agent orchestration** for complex workflows
✨ **Real-time GitHub integration** with live data
✨ **LLM-powered insights** with intelligent fallbacks
✨ **Modern, responsive UI** with interactive charts
✨ **RESTful API** with automatic documentation
✨ **Production-ready** with error handling and validation

---

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review API docs at http://localhost:8000/docs
3. Check browser console for errors
4. Verify both servers are running

---

**Built with ❤️ using FastAPI, Express.js, and Google Gemini**

🚀 **Ready to boost your team's productivity!**
