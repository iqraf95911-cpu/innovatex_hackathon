# Issue classifications
ISSUE_TYPES = ["Bug", "Feature", "Refactor", "Question"]

# Priority levels
PRIORITY_LEVELS = ["Low", "Medium", "High"]

# Risk levels
RISK_LEVELS = ["Low", "Medium", "High"]

# Load score weights
LOAD_WEIGHT_ISSUES = 2
LOAD_WEIGHT_REVIEWS = 1

# GitHub API base
GITHUB_API_BASE = "https://api.github.com"

# Core module paths that increase PR risk
CORE_MODULE_PATHS = [
    "src/core/",
    "src/auth/",
    "lib/",
    "config/",
    "database/",
    "security/",
    "middleware/",
    ".github/workflows/",
    "Dockerfile",
    "docker-compose",
    ".env",
    "requirements.txt",
    "package.json",
]

# Bug indicator keywords
BUG_KEYWORDS = [
    "bug", "fix", "error", "crash", "broken", "fail", "issue",
    "exception", "null", "undefined", "incorrect", "wrong", "defect",
]

# Feature indicator keywords
FEATURE_KEYWORDS = [
    "feature", "add", "new", "implement", "create", "build",
    "support", "enable", "introduce", "enhance",
]

# Refactor indicator keywords
REFACTOR_KEYWORDS = [
    "refactor", "clean", "optimize", "improve", "restructure",
    "migrate", "upgrade", "deprecate", "remove", "simplify",
]

# Question indicator keywords
QUESTION_KEYWORDS = [
    "question", "how", "why", "help", "docs", "documentation",
    "clarify", "explain", "understand", "?",
]
