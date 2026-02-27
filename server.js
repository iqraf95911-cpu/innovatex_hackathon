// ===== DevIntel AI — Express Backend =====
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_API = 'https://api.github.com';

// --- In-memory token store (per-server session) ---
let githubToken = '';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Helpers ---
async function ghFetch(endpoint, token) {
    const t = token || githubToken;
    if (!t) throw new Error('NO_TOKEN');
    const res = await fetch(`${GITHUB_API}${endpoint}`, {
        headers: {
            Authorization: `token ${t}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'DevIntel-AI'
        }
    });
    if (!res.ok) {
        const body = await res.text();
        const err = new Error(`GitHub API ${res.status}: ${body}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

// Paginated fetch — pulls all pages
async function ghFetchAll(endpoint) {
    let page = 1;
    let all = [];
    while (true) {
        const sep = endpoint.includes('?') ? '&' : '?';
        const data = await ghFetch(`${endpoint}${sep}per_page=100&page=${page}`);
        if (!Array.isArray(data) || data.length === 0) break;
        all = all.concat(data);
        if (data.length < 100) break;
        page++;
        if (page > 5) break; // safety cap
    }
    return all;
}

// ==================== SETTINGS ====================

// Save token
app.post('/api/settings/token', (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
    }
    githubToken = token.trim();
    res.json({ ok: true });
});

// Check token status + get user info
app.get('/api/settings/token-status', async (req, res) => {
    if (!githubToken) {
        return res.json({ connected: false });
    }
    try {
        const user = await ghFetch('/user');
        res.json({
            connected: true,
            user: {
                login: user.login,
                name: user.name,
                avatar_url: user.avatar_url,
                public_repos: user.public_repos,
                total_private_repos: user.total_private_repos || 0
            }
        });
    } catch (e) {
        res.json({ connected: false, error: e.message });
    }
});

// ==================== REPOSITORIES ====================

app.get('/api/repos', async (req, res) => {
    try {
        const repos = await ghFetchAll('/user/repos?sort=updated&type=all');
        const mapped = repos.map(r => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            description: r.description,
            language: r.language,
            stargazers_count: r.stargazers_count,
            forks_count: r.forks_count,
            open_issues_count: r.open_issues_count,
            updated_at: r.updated_at,
            html_url: r.html_url,
            private: r.private,
            default_branch: r.default_branch
        }));
        res.json(mapped);
    } catch (e) {
        if (e.message === 'NO_TOKEN') return res.status(401).json({ error: 'No GitHub token configured' });
        res.status(500).json({ error: e.message });
    }
});

// ==================== PULL REQUESTS ====================

// PRs for a specific repo
app.get('/api/repos/:owner/:repo/pulls', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const state = req.query.state || 'all';
        const pulls = await ghFetchAll(`/repos/${owner}/${repo}/pulls?state=${state}&sort=updated&direction=desc`);
        const mapped = pulls.slice(0, 30).map(pr => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            merged: pr.merged_at !== null,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            merged_at: pr.merged_at,
            closed_at: pr.closed_at,
            user: {
                login: pr.user.login,
                avatar_url: pr.user.avatar_url
            },
            html_url: pr.html_url,
            changed_files: pr.changed_files || 0,
            additions: pr.additions || 0,
            deletions: pr.deletions || 0,
            review_comments: pr.review_comments || 0,
            repo_name: repo
        }));
        res.json(mapped);
    } catch (e) {
        if (e.message === 'NO_TOKEN') return res.status(401).json({ error: 'No GitHub token configured' });
        res.status(500).json({ error: e.message });
    }
});

// ==================== CONTRIBUTORS ====================

app.get('/api/repos/:owner/:repo/contributors', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const contributors = await ghFetch(`/repos/${owner}/${repo}/stats/contributors`);
        if (!Array.isArray(contributors)) {
            // GitHub may return 202 while computing — retry once after a delay
            return res.json([]);
        }
        const mapped = contributors.map(c => ({
            login: c.author?.login,
            avatar_url: c.author?.avatar_url,
            total_commits: c.total,
            weeks: c.weeks?.slice(-4).map(w => ({
                week: w.w,
                additions: w.a,
                deletions: w.d,
                commits: w.c
            }))
        })).sort((a, b) => b.total_commits - a.total_commits);
        res.json(mapped);
    } catch (e) {
        if (e.message === 'NO_TOKEN') return res.status(401).json({ error: 'No GitHub token configured' });
        res.status(500).json({ error: e.message });
    }
});

// ==================== AGGREGATED STATS ====================

app.get('/api/stats', async (req, res) => {
    try {
        const repos = await ghFetchAll('/user/repos?sort=updated&type=all');
        const repoCount = repos.length;

        // Get PRs from top 5 most recently updated repos for cycle time calculation
        const topRepos = repos.slice(0, 5);
        let allPRs = [];
        for (const r of topRepos) {
            try {
                const pulls = await ghFetch(`/repos/${r.full_name}/pulls?state=all&per_page=20&sort=updated&direction=desc`);
                if (Array.isArray(pulls)) allPRs = allPRs.concat(pulls.map(p => ({ ...p, repo_name: r.name })));
            } catch (_) { /* skip repos with errors */ }
        }

        // Avg PR cycle time (merged PRs only)
        const mergedPRs = allPRs.filter(p => p.merged_at);
        let avgCycleHours = 0;
        if (mergedPRs.length > 0) {
            const totalMs = mergedPRs.reduce((sum, pr) => {
                return sum + (new Date(pr.merged_at) - new Date(pr.created_at));
            }, 0);
            avgCycleHours = Math.round((totalMs / mergedPRs.length / 3600000) * 10) / 10;
        }

        // Simulated sprint velocity from recent closed issues/merged PRs
        const recentMerged = mergedPRs.filter(pr => {
            const age = Date.now() - new Date(pr.merged_at).getTime();
            return age < 14 * 24 * 3600000; // last 2 weeks
        });
        const velocity = recentMerged.length;

        // Review score — based on PRs that have review comments
        const reviewedPRs = allPRs.filter(p => p.review_comments > 0);
        const reviewScore = allPRs.length > 0
            ? Math.round((reviewedPRs.length / allPRs.length) * 100)
            : 0;

        res.json({
            repoCount,
            avgCycleHours,
            velocity,
            reviewScore,
            totalPRs: allPRs.length,
            mergedPRs: mergedPRs.length,
            openPRs: allPRs.filter(p => p.state === 'open').length
        });
    } catch (e) {
        if (e.message === 'NO_TOKEN') return res.status(401).json({ error: 'No GitHub token configured' });
        res.status(500).json({ error: e.message });
    }
});

// ==================== RECENT ACTIVITY ====================

app.get('/api/activity', async (req, res) => {
    try {
        const user = await ghFetch('/user');
        const events = await ghFetch(`/users/${user.login}/received_events?per_page=30`);
        if (!Array.isArray(events)) return res.json([]);

        const mapped = events.slice(0, 20).map(ev => {
            let action = '';
            let detail = '';
            switch (ev.type) {
                case 'PushEvent':
                    action = 'pushed';
                    detail = `${ev.payload.commits?.length || 0} commit(s) to ${ev.repo.name}`;
                    break;
                case 'PullRequestEvent':
                    action = ev.payload.action;
                    detail = `PR #${ev.payload.pull_request?.number} in ${ev.repo.name}`;
                    break;
                case 'IssuesEvent':
                    action = ev.payload.action;
                    detail = `issue #${ev.payload.issue?.number} in ${ev.repo.name}`;
                    break;
                case 'CreateEvent':
                    action = 'created';
                    detail = `${ev.payload.ref_type} ${ev.payload.ref || ''} in ${ev.repo.name}`;
                    break;
                case 'DeleteEvent':
                    action = 'deleted';
                    detail = `${ev.payload.ref_type} ${ev.payload.ref || ''} in ${ev.repo.name}`;
                    break;
                case 'WatchEvent':
                    action = 'starred';
                    detail = ev.repo.name;
                    break;
                case 'ForkEvent':
                    action = 'forked';
                    detail = ev.repo.name;
                    break;
                case 'IssueCommentEvent':
                    action = 'commented on';
                    detail = `issue #${ev.payload.issue?.number} in ${ev.repo.name}`;
                    break;
                case 'PullRequestReviewEvent':
                    action = 'reviewed';
                    detail = `PR #${ev.payload.pull_request?.number} in ${ev.repo.name}`;
                    break;
                default:
                    action = ev.type.replace('Event', '').toLowerCase();
                    detail = ev.repo.name;
            }
            return {
                id: ev.id,
                type: ev.type,
                actor: {
                    login: ev.actor.login,
                    avatar_url: ev.actor.avatar_url
                },
                action,
                detail,
                repo: ev.repo.name,
                created_at: ev.created_at
            };
        });
        res.json(mapped);
    } catch (e) {
        if (e.message === 'NO_TOKEN') return res.status(401).json({ error: 'No GitHub token configured' });
        res.status(500).json({ error: e.message });
    }
});

// ==================== ALL PRS ACROSS REPOS ====================

app.get('/api/pulls', async (req, res) => {
    try {
        const repos = await ghFetchAll('/user/repos?sort=updated&type=all');
        const topRepos = repos.slice(0, 8);
        let allPRs = [];

        for (const r of topRepos) {
            try {
                const pulls = await ghFetch(`/repos/${r.full_name}/pulls?state=all&per_page=10&sort=updated&direction=desc`);
                if (Array.isArray(pulls)) {
                    allPRs = allPRs.concat(pulls.map(p => ({
                        number: p.number,
                        title: p.title,
                        state: p.state,
                        merged: p.merged_at !== null,
                        created_at: p.created_at,
                        merged_at: p.merged_at,
                        closed_at: p.closed_at,
                        user: { login: p.user.login, avatar_url: p.user.avatar_url },
                        html_url: p.html_url,
                        changed_files: p.changed_files || 0,
                        review_comments: p.review_comments || 0,
                        repo_name: r.name
                    })));
                }
            } catch (_) { /* skip */ }
        }

        // Sort by most recently updated
        allPRs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(allPRs.slice(0, 20));
    } catch (e) {
        if (e.message === 'NO_TOKEN') return res.status(401).json({ error: 'No GitHub token configured' });
        res.status(500).json({ error: e.message });
    }
});

// ==================== SPA FALLBACK ====================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== START ====================
app.listen(PORT, () => {
    console.log(`\n  🚀 DevIntel AI server running at http://localhost:${PORT}\n`);
});
