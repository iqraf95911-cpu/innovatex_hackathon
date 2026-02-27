"""Repository Analyzer Agent — analyzes repository structure, features, and codebase insights."""

from services import llm_service


async def analyze(repo_data: dict, languages: dict, topics: list[str], 
                  readme_content: str = "", contributors_count: int = 0) -> dict:
    """Analyze a repository for structure, features, and insights.

    Returns:
        {
            "overview": "...",
            "key_features": ["...", "..."],
            "technology_stack": ["...", "..."],
            "architecture_insights": "...",
            "code_quality_indicators": {...},
            "recommendations": ["...", "..."]
        }
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Extract basic info
    repo_name = repo_data.get("name", "")
    description = repo_data.get("description", "") or "No description provided"
    stars = repo_data.get("stargazers_count", 0)
    forks = repo_data.get("forks_count", 0)
    open_issues = repo_data.get("open_issues_count", 0)
    size_kb = repo_data.get("size", 0)
    created_at = repo_data.get("created_at", "")
    updated_at = repo_data.get("updated_at", "")
    default_branch = repo_data.get("default_branch", "main")
    has_wiki = repo_data.get("has_wiki", False)
    has_pages = repo_data.get("has_pages", False)
    license_info = repo_data.get("license", {}).get("name", "No license") if repo_data.get("license") else "No license"

    # Primary language
    primary_language = repo_data.get("language", "Unknown")
    logger.info(f"Primary language: {primary_language}")

    # Build technology stack from languages
    tech_stack = []
    if languages:
        sorted_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)
        tech_stack = [lang for lang, _ in sorted_langs[:10]]  # Get top 10 languages
        logger.info(f"Tech stack from languages API: {tech_stack}")
    
    # If no languages from API, use primary language
    if not tech_stack and primary_language and primary_language != "Unknown":
        tech_stack = [primary_language]
        logger.info(f"Tech stack from primary language: {tech_stack}")
    
    # If still empty, try to infer from topics or repo name
    if not tech_stack:
        for topic in topics:
            topic_lower = topic.lower()
            if any(lang in topic_lower for lang in ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'ruby', 'php', 'c++', 'c#']):
                tech_stack.append(topic.title())
        if tech_stack:
            logger.info(f"Tech stack from topics: {tech_stack}")
    
    # Last resort: mark as unknown
    if not tech_stack:
        tech_stack = ["Language not detected"]
        logger.warning("No tech stack detected, using fallback")
    
    logger.info(f"Final tech stack before LLM: {tech_stack}")

    # Topics as features/tags
    feature_tags = topics[:10] if topics else []

    # Code quality indicators
    code_quality = {
        "repository_size": f"{size_kb} KB",
        "community_engagement": "High" if stars > 100 else "Medium" if stars > 10 else "Low",
        "maintenance_status": "Active" if open_issues < 50 else "Needs attention",
        "documentation": "Yes" if has_wiki or readme_content else "Limited",
        "license": license_info,
        "contributors": contributors_count
    }

    # Try LLM for intelligent analysis
    if llm_service.is_available() and readme_content:
        readme_snippet = readme_content[:2000]  # First 2000 chars
        langs_text = ", ".join(tech_stack) if tech_stack else "Unknown"
        topics_text = ", ".join(feature_tags) if feature_tags else "None"
        
        prompt = f"""You are a senior software architect analyzing a GitHub repository.

Repository: {repo_name}
Description: {description}
Primary Language: {primary_language}
Technology Stack: {langs_text}
Topics/Tags: {topics_text}
Stars: {stars} | Forks: {forks} | Open Issues: {open_issues}
Contributors: {contributors_count}
README Preview: {readme_snippet}

Analyze this repository and provide insights in JSON format:
{{
    "overview": "<2-3 sentence summary of what this repository does>",
    "key_features": [
        "<feature 1>",
        "<feature 2>",
        "<feature 3>",
        "<feature 4>"
    ],
    "technology_stack": [
        "<tech 1>",
        "<tech 2>",
        "<tech 3>"
    ],
    "architecture_insights": "<1-2 sentences about the architecture/design patterns>",
    "recommendations": [
        "<recommendation 1>",
        "<recommendation 2>",
        "<recommendation 3>"
    ]
}}

Focus on:
- What problems this repository solves
- Key technical features and capabilities
- Architecture and design patterns used
- Actionable recommendations for improvement"""

        result = await llm_service.generate(prompt, expect_json=True)
        if result and isinstance(result, dict):
            # Ensure tech stack is not empty - use our detected one if LLM's is empty
            if not result.get("technology_stack") or len(result.get("technology_stack", [])) == 0:
                result["technology_stack"] = tech_stack
            # Add code quality indicators
            result["code_quality_indicators"] = code_quality
            return result

    # Fallback — rule-based analysis
    overview = _generate_overview(repo_name, description, primary_language, stars, forks)
    key_features = _extract_features(description, feature_tags, readme_content)
    architecture = _infer_architecture(tech_stack, feature_tags, repo_name.lower())
    recommendations = _generate_recommendations(open_issues, stars, has_wiki, license_info, contributors_count)

    return {
        "overview": overview,
        "key_features": key_features,
        "technology_stack": tech_stack if tech_stack else ["Unknown"],
        "architecture_insights": architecture,
        "code_quality_indicators": code_quality,
        "recommendations": recommendations
    }


def _generate_overview(name: str, desc: str, lang: str, stars: int, forks: int) -> str:
    """Generate a basic overview."""
    popularity = "popular" if stars > 100 else "emerging" if stars > 10 else "new"
    return f"{name} is a {popularity} {lang} project. {desc} The repository has {stars} stars and {forks} forks, indicating {'strong' if stars > 100 else 'growing'} community interest."


def _extract_features(description: str, topics: list[str], readme: str) -> list[str]:
    """Extract key features from available data."""
    features = []
    
    # From topics
    feature_keywords = {
        "api": "RESTful API",
        "rest": "REST API",
        "graphql": "GraphQL API",
        "cli": "Command-line interface",
        "web": "Web application",
        "mobile": "Mobile support",
        "desktop": "Desktop application",
        "database": "Database integration",
        "authentication": "User authentication",
        "authorization": "Access control",
        "testing": "Automated testing",
        "ci-cd": "CI/CD pipeline",
        "docker": "Docker containerization",
        "kubernetes": "Kubernetes orchestration",
        "microservices": "Microservices architecture",
        "serverless": "Serverless functions",
        "machine-learning": "Machine learning capabilities",
        "ai": "AI-powered features",
        "real-time": "Real-time updates",
        "websocket": "WebSocket support"
    }
    
    text = f"{description} {' '.join(topics)} {readme[:500]}".lower()
    
    for keyword, feature in feature_keywords.items():
        if keyword in text and feature not in features:
            features.append(feature)
    
    # Generic features if none found
    if not features:
        features = [
            "Core functionality as described in repository",
            "Open-source codebase",
            "Community-driven development",
            "Version-controlled source code"
        ]
    
    return features[:6]


def _infer_architecture(tech_stack: list[str], topics: list[str], repo_name: str) -> str:
    """Infer architecture patterns from tech stack and topics."""
    patterns = []
    
    combined = " ".join(tech_stack + topics + [repo_name]).lower()
    
    if "react" in combined or "vue" in combined or "angular" in combined:
        patterns.append("component-based frontend")
    if "node" in combined or "express" in combined:
        patterns.append("Node.js backend")
    if "django" in combined or "flask" in combined or "fastapi" in combined:
        patterns.append("Python web framework")
    if "microservices" in combined:
        patterns.append("microservices architecture")
    if "monorepo" in combined:
        patterns.append("monorepo structure")
    if "api" in combined:
        patterns.append("API-first design")
    if "docker" in combined:
        patterns.append("containerized deployment")
    
    if patterns:
        return f"The project follows a {', '.join(patterns[:3])} approach."
    
    return "Standard software architecture with modular design principles."


def _generate_recommendations(open_issues: int, stars: int, has_wiki: bool, 
                               license_info: str, contributors: int) -> list[str]:
    """Generate actionable recommendations."""
    recs = []
    
    if open_issues > 50:
        recs.append(f"Address the {open_issues} open issues to improve project health")
    
    if not has_wiki:
        recs.append("Add a wiki for comprehensive documentation")
    
    if license_info == "No license":
        recs.append("Add an open-source license to clarify usage rights")
    
    if stars < 10:
        recs.append("Increase visibility through social media and developer communities")
    
    if contributors < 5:
        recs.append("Encourage community contributions with a CONTRIBUTING.md file")
    
    # Always include some general recommendations
    if len(recs) < 3:
        recs.extend([
            "Maintain regular commit activity to show active development",
            "Add comprehensive test coverage for reliability",
            "Keep dependencies up to date for security"
        ])
    
    return recs[:5]
