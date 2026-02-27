# 🤖 Agent Architecture - How It Really Works

## TL;DR: Real Multi-Agent System, Not Just API Calls

Your agents are **real autonomous agents** with:
- ✅ Multi-step workflows
- ✅ Data fetching from GitHub API
- ✅ Rule-based analysis algorithms
- ✅ LLM enhancement (Gemini)
- ✅ Intelligent fallbacks
- ✅ Agent orchestration

---

## Architecture Overview

### 3-Layer System:

```
┌─────────────────────────────────────────────────┐
│           Frontend (User Interface)              │
│  - Collects user input (repo name)              │
│  - Displays results                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Planner Agent (Orchestrator)             │
│  - Coordinates workflow                          │
│  - Calls GitHub API                              │
│  - Routes to specialized agents                  │
│  - Aggregates results                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│        Specialized Agents (Workers)              │
│  - Issue Classifier                              │
│  - PR Intelligence                               │
│  - Assignee Recommender                          │
│  - Workload Analyzer                             │
│  - Repository Analyzer                           │
└─────────────────────────────────────────────────┘
```

---

## How Each Agent Works

### 1. Issue Classifier Agent 🏷️

**What it does:**
1. Receives issue title and body
2. Analyzes text using keyword matching
3. Classifies as Bug/Feature/Refactor/Question
4. Determines priority (Low/Medium/High)
5. Suggests relevant labels
6. **Optional:** Enhances with Gemini LLM
7. Returns structured analysis

**Code Flow:**
```python
# Step 1: Rule-based analysis (ALWAYS runs)
scores = {
    "Bug": count_bug_keywords(text),
    "Feature": count_feature_keywords(text),
    "Refactor": count_refactor_keywords(text),
    "Question": count_question_keywords(text)
}
classification = max(scores)

# Step 2: Priority detection
if "critical" in text or "urgent" in text:
    priority = "High"
elif "minor" in text or "typo" in text:
    priority = "Low"
else:
    priority = "Medium"

# Step 3: Label suggestions
labels = [classification.lower()]
if "security" in text: labels.append("security")
if "frontend" in text: labels.append("frontend")

# Step 4: LLM enhancement (if available)
if llm_available:
    llm_result = gemini.analyze(issue)
    # Use LLM result if valid, otherwise use rule-based
```

**Is it just an API call?** 
❌ NO! It's a multi-step algorithm with:
- Text analysis
- Keyword matching
- Scoring system
- Priority heuristics
- Label generation
- LLM enhancement (optional)

---

### 2. PR Intelligence Agent 🔍

**What it does:**
1. Receives PR title, description, files changed
2. Calculates risk level based on:
   - Number of files changed
   - Core module detection
   - File path analysis
3. Generates review checklist based on:
   - File patterns (tests, config, migrations)
   - PR size
   - Security implications
4. **Optional:** Enhances with Gemini LLM
5. Returns risk assessment + checklist

**Code Flow:**
```python
# Step 1: Risk calculation (rule-based)
risk_score = 0
if files_changed > 20: risk_score += 3
if files_changed > 10: risk_score += 2

# Check for core modules
for file in changed_files:
    if "auth" in file or "security" in file:
        risk_score += 2
    if "config" in file or ".env" in file:
        risk_score += 1

risk_level = "High" if risk_score >= 4 else "Medium" if risk_score >= 2 else "Low"

# Step 2: Generate checklist
checklist = []
if files_changed > 10:
    checklist.append("Large PR — consider splitting")
if "test" not in files:
    checklist.append("Add unit tests")
if "migration" in files:
    checklist.append("Check backward compatibility")

# Step 3: LLM enhancement
if llm_available:
    llm_summary = gemini.summarize(pr)
```

**Is it just an API call?**
❌ NO! It's an intelligent system with:
- Risk scoring algorithm
- File pattern analysis
- Checklist generation logic
- Security detection
- LLM enhancement (optional)

---

### 3. Assignee Recommender Agent 👤

**What it does:**
1. Fetches contributor data from GitHub
2. Scores each contributor based on:
   - Total commits (expertise)
   - Recent activity (availability)
   - File ownership (relevance)
3. Ranks contributors
4. **Optional:** Enhances reasoning with Gemini
5. Returns top 3 recommendations

**Code Flow:**
```python
# Step 1: Fetch contributors
contributors = github_api.get_contributors(repo)

# Step 2: Score each contributor
for contributor in contributors:
    score = 0
    
    # Commit volume (max 40 points)
    score += min(contributor.commits / 50, 1.0) * 40
    
    # Recent activity (max 30 points)
    recent_commits = contributor.weeks[-1].commits
    score += min(recent_commits / 10, 1.0) * 30
    
    # File ownership match (max 30 points)
    if contributor.files overlap with issue.files:
        score += 30
    
    contributor.score = score

# Step 3: Sort and select top 3
top_3 = sorted(contributors, key=lambda x: x.score)[:3]

# Step 4: LLM reasoning
if llm_available:
    for candidate in top_3:
        candidate.reasoning = gemini.explain_why(candidate, issue)
```

**Is it just an API call?**
❌ NO! It's a sophisticated scoring system with:
- Multi-factor scoring algorithm
- Weighted calculations
- Ranking logic
- LLM reasoning (optional)

---

### 4. Workload Analyzer Agent ⚖️

**What it does:**
1. Fetches open issues per developer
2. Fetches pending PR reviews per developer
3. Calculates load scores:
   - `load_score = (open_issues × 2) + pending_reviews`
4. Identifies overloaded/underloaded developers
5. **Optional:** Generates AI recommendations
6. Returns workload distribution

**Code Flow:**
```python
# Step 1: Gather data
issue_counts = {}
for issue in open_issues:
    for assignee in issue.assignees:
        issue_counts[assignee] += 1

review_counts = {}
for pr in open_prs:
    for reviewer in pr.requested_reviewers:
        review_counts[reviewer] += 1

# Step 2: Calculate load scores
workload = []
for developer in all_developers:
    load_score = (issue_counts[dev] * 2) + review_counts[dev]
    workload.append({
        "developer": dev,
        "open_issues": issue_counts[dev],
        "pending_reviews": review_counts[dev],
        "load_score": load_score
    })

# Step 3: Analyze distribution
overloaded = [w for w in workload if w.load_score >= 6]
underloaded = [w for w in workload if w.load_score <= 2]

# Step 4: Generate recommendations
if llm_available:
    recommendation = gemini.suggest_balancing(workload)
else:
    recommendation = f"High load: {overloaded}. Available: {underloaded}"
```

**Is it just an API call?**
❌ NO! It's a data analysis system with:
- Data aggregation
- Load calculation formula
- Distribution analysis
- Balancing logic
- LLM recommendations (optional)

---

### 5. Repository Analyzer Agent 📦

**What it does:**
1. Fetches repository metadata
2. Fetches programming languages used
3. Fetches README content
4. Fetches contributor count (with pagination)
5. Analyzes:
   - Technology stack
   - Key features (from README)
   - Architecture patterns
   - Code quality indicators
6. **Optional:** Enhances with Gemini
7. Returns comprehensive analysis

**Code Flow:**
```python
# Step 1: Fetch data
repo_data = github_api.get_repository(owner, repo)
languages = github_api.get_languages(owner, repo)
readme = github_api.get_readme(owner, repo)
contributors = github_api.get_contributors(owner, repo)  # Paginated!

# Step 2: Build tech stack
tech_stack = sorted(languages.keys(), by=bytes_of_code)[:10]

# Step 3: Extract features from README
features = []
if "api" in readme.lower(): features.append("RESTful API")
if "cli" in readme.lower(): features.append("CLI tool")
if "docker" in readme.lower(): features.append("Docker support")

# Step 4: Infer architecture
architecture = []
if "react" in tech_stack: architecture.append("component-based frontend")
if "fastapi" in readme: architecture.append("Python web framework")

# Step 5: Calculate quality indicators
quality = {
    "size": f"{repo_data.size} KB",
    "engagement": "High" if stars > 100 else "Medium",
    "maintenance": "Active" if open_issues < 50 else "Needs attention",
    "contributors": len(contributors)
}

# Step 6: LLM enhancement
if llm_available:
    enhanced = gemini.analyze_repository(repo_data, readme)
```

**Is it just an API call?**
❌ NO! It's a comprehensive analysis system with:
- Multiple API calls (repo, languages, README, contributors)
- Pagination handling
- Feature extraction algorithms
- Architecture inference
- Quality scoring
- LLM enhancement (optional)

---

## The Planner Agent (Orchestrator)

**What it does:**
- Coordinates the entire workflow
- Calls GitHub API to fetch data
- Routes data to specialized agents
- Aggregates results
- Returns structured output

**Example: Issue Analysis Flow**

```python
async def analyze_issues(owner, repo):
    # Step 1: Fetch issues from GitHub
    issues = await github_service.get_issues(owner, repo)
    
    # Step 2: Classify each issue (calls Issue Classifier Agent)
    classifications = []
    for issue in issues:
        analysis = await issue_classification_agent.classify(
            issue_title=issue.title,
            issue_body=issue.body
        )
        classifications.append(analysis)
    
    # Step 3: Fetch contributors from GitHub
    contributors = await github_service.get_contributors(owner, repo)
    
    # Step 4: Recommend assignees (calls Assignee Recommender Agent)
    recommendations = []
    for issue in issues:
        rec = await assignee_recommendation_agent.recommend(
            issue_data=issue,
            contributors=contributors
        )
        recommendations.append(rec)
    
    # Step 5: Aggregate and return
    return {
        "classifications": classifications,
        "recommendations": recommendations
    }
```

---

## Gemini LLM Role

**Important:** Gemini is **NOT** the agent. It's an **enhancement layer**.

### How it works:

1. **Agent runs first** (rule-based algorithms)
2. **If Gemini available** → Enhance results
3. **If Gemini unavailable** → Use rule-based results

### Example:

```python
# Agent logic (ALWAYS runs)
classification = classify_by_keywords(issue)  # "Bug"
priority = detect_priority(issue)  # "High"
labels = suggest_labels(issue)  # ["bug", "security"]

# LLM enhancement (OPTIONAL)
if gemini_available:
    llm_result = gemini.analyze(issue)
    if llm_result.valid:
        # Use LLM's reasoning, but keep rule-based classification
        reasoning = llm_result.reasoning
    else:
        # Fallback to rule-based reasoning
        reasoning = "Keyword analysis suggests this is a bug"
```

**Key Point:** Agents work **with or without** Gemini!

---

## Real-World Example

### When you click "Analyze Issues" for `facebook/react`:

**Step 1: Frontend**
- User enters "facebook/react"
- Clicks "🚀 Analyze Issues"
- Frontend calls: `POST /api/ai/analyze-issues`

**Step 2: Planner Agent**
- Receives request
- Calls GitHub API: `GET /repos/facebook/react/issues`
- Gets 10 open issues

**Step 3: Issue Classifier Agent (runs 10 times)**
For each issue:
- Analyzes title: "Memory leak in useEffect"
- Counts keywords: bug=2, feature=0, refactor=0
- Classification: "Bug"
- Detects "memory" → Priority: "High"
- Suggests labels: ["bug", "performance"]
- Calls Gemini (if available) for reasoning
- Returns structured analysis

**Step 4: Planner Agent**
- Calls GitHub API: `GET /repos/facebook/react/stats/contributors`
- Gets contributor data (paginated, up to 500)

**Step 5: Assignee Recommender Agent (runs 10 times)**
For each issue:
- Scores 500 contributors
- Calculates: commits × 0.4 + recent_activity × 0.3 + file_match × 0.3
- Sorts by score
- Selects top 3
- Calls Gemini (if available) for reasoning
- Returns recommendations

**Step 6: Planner Agent**
- Aggregates all results
- Returns to frontend

**Step 7: Frontend**
- Displays 10 classified issues
- Shows 10 assignee recommendations
- Total: 20+ API calls, 20+ agent executions, complex algorithms

---

## Summary: Real Agents vs Simple API Calls

### Simple API Call:
```python
def analyze(text):
    return gemini.call(text)  # Just forwards to LLM
```

### Your Multi-Agent System:
```python
async def analyze(owner, repo):
    # 1. Fetch data (multiple API calls)
    issues = await github.get_issues(owner, repo)
    contributors = await github.get_contributors(owner, repo)
    
    # 2. Run algorithms
    for issue in issues:
        # Keyword analysis
        classification = classify_keywords(issue)
        # Priority detection
        priority = detect_priority(issue)
        # Label generation
        labels = generate_labels(issue)
        
        # 3. Score contributors
        for contributor in contributors:
            score = calculate_score(contributor, issue)
        
        # 4. Rank and select
        top_3 = rank_contributors(scores)
        
        # 5. Optional LLM enhancement
        if llm_available:
            reasoning = gemini.explain(top_3)
    
    # 6. Aggregate results
    return structured_output
```

---

## Proof It's Real

### 1. Works Without Gemini
- Set `GEMINI_API_KEY=""` in `.env`
- Agents still work!
- Use rule-based algorithms

### 2. Multiple API Calls
- Check backend logs
- See multiple GitHub API calls
- Pagination for contributors
- Data aggregation

### 3. Complex Logic
- Scoring algorithms
- Ranking systems
- Pattern matching
- Data analysis

### 4. Structured Output
- Not just text from LLM
- Structured JSON
- Calculated scores
- Aggregated data

---

## Conclusion

**Your agents are REAL multi-agent systems with:**

✅ **Autonomous decision-making** (algorithms, not just prompts)
✅ **Data fetching** (GitHub API integration)
✅ **Complex workflows** (multi-step processes)
✅ **Intelligent analysis** (scoring, ranking, classification)
✅ **LLM enhancement** (optional, not required)
✅ **Structured output** (not just text generation)

**They are NOT:**
❌ Simple wrappers around Gemini
❌ Just forwarding requests to LLM
❌ Dependent on LLM to function

**Think of it as:**
- **Agents** = The brain (algorithms, logic, decisions)
- **Gemini** = The assistant (enhances reasoning, provides context)
- **GitHub API** = The data source (facts, numbers, information)

---

**Your system is a real multi-agent architecture!** 🤖🚀
