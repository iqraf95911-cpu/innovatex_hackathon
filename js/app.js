// ===== DevIntel AI — Dashboard Frontend =====

const AI_API = 'http://localhost:8000';  // FastAPI backend
const GH_API = '';  // Express backend (same origin)

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAgentButtons();
    initDashboard();
});

// ========== PANEL SWITCHING ==========

const panelTitles = {
    'dashboard': ['Dashboard', '/ Overview'],
    'issue-classifier': ['Issue Classifier', '/ AI Agent'],
    'pr-intelligence': ['PR Intelligence', '/ AI Agent'],
    'assignee-recommender': ['Assignee Recommender', '/ AI Agent'],
    'reviewer-recommender': ['Reviewer Recommender', '/ AI Agent'],
    'workload-analyzer': ['Workload Analyzer', '/ AI Agent'],
};

function switchPanel(panelId) {
    // Hide all panels
    document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
    // Show target
    const target = document.getElementById('panel-' + panelId);
    if (target) target.style.display = '';
    // Update topbar
    const titles = panelTitles[panelId] || ['Dashboard', '/ Overview'];
    document.getElementById('page-title').textContent = titles[0];
    document.getElementById('page-breadcrumb').textContent = titles[1];
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-panel]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            switchPanel(item.dataset.panel);
        });
    });
}

// ========== API HELPERS ==========

async function apiGH(endpoint) {
    const res = await fetch(endpoint);
    if (res.status === 401) { showTokenBanner(); throw new Error('NO_TOKEN'); }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function apiAI(endpoint, body) {
    const res = await fetch(AI_API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `API error: ${res.status}`);
    }
    return res.json();
}

function showTokenBanner() {
    const content = document.getElementById('panel-dashboard');
    if (!content || document.getElementById('token-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'token-banner';
    banner.className = 'token-banner';
    banner.innerHTML = '⚠️ GitHub token not configured. <a href="settings.html">Go to Settings</a> to connect your account.';
    content.prepend(banner);
}

function showLoading(el) {
    if (!el) return;
    el.innerHTML = '<div class="loading-state"><div class="spinner"></div><br>Loading from GitHub…</div>';
}

function showEmpty(el, msg) {
    if (!el) return;
    el.innerHTML = `<div class="empty-state">${msg}</div>`;
}

function timeAgo(str) {
    const d = Date.now() - new Date(str).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
}

function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseRepo(input) {
    let val = input.trim();
    // Handle full URLs like https://github.com/owner/repo
    const urlMatch = val.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
    if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
    // Handle owner/repo format
    const parts = val.split('/');
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    return null;
}

// ========== DASHBOARD (Overview) ==========

async function initDashboard() {
    try {
        const status = await apiGH('/api/settings/token-status');
        if (!status.connected) { showTokenBanner(); return; }
        const u = status.user;
        const sidebar = document.querySelector('.sidebar-user');
        if (sidebar) {
            sidebar.querySelector('.name').textContent = u.name || u.login;
            sidebar.querySelector('.role').textContent = '@' + u.login;
            sidebar.querySelector('.user-avatar').textContent = (u.login || '??').substring(0, 2).toUpperCase();
        }
    } catch (e) { return; }

    loadMetrics();
    loadPRsTable();
    loadReposTable();
    loadActivityFeed();
    loadCharts();
}

async function loadMetrics() {
    const g = document.getElementById('metrics-grid'); if (!g) return;
    showLoading(g);
    try {
        const s = await apiGH('/api/stats');
        g.innerHTML = `
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">📁</span> Repos</div><div class="metric-value">${s.repoCount}</div><div class="metric-change positive">${s.totalPRs} PRs tracked</div></div>
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">⏱️</span> Avg Cycle</div><div class="metric-value">${s.avgCycleHours}h</div><div class="metric-change neutral">${s.mergedPRs} merged</div></div>
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">🚀</span> Velocity</div><div class="metric-value">${s.velocity}</div><div class="metric-change neutral">PRs in 14d</div></div>
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">✅</span> Review</div><div class="metric-value">${s.reviewScore}%</div><div class="metric-change neutral">${s.openPRs} open</div></div>`;
    } catch (e) { if (e.message !== 'NO_TOKEN') showEmpty(g, 'Failed to load'); }
}

async function loadPRsTable() {
    const tb = document.getElementById('prs-tbody'); if (!tb) return;
    try {
        const prs = await apiGH('/api/pulls');
        if (!prs.length) { showEmpty(tb.parentElement, 'No PRs found'); return; }
        tb.innerHTML = prs.map(pr => {
            const sc = pr.merged ? 'healthy' : pr.state === 'open' ? 'warning' : 'critical';
            const st = pr.merged ? '● Merged' : pr.state === 'open' ? '● Open' : '● Closed';
            return `<tr><td><div class="pr-title"><a href="${pr.html_url}" target="_blank" style="color:inherit">#${pr.number} — ${esc(pr.title)}</a></div><div class="pr-meta">${pr.repo_name}</div></td><td><div class="pr-author"><img src="${pr.user.avatar_url}" style="width:22px;height:22px;border-radius:50%"> ${esc(pr.user.login)}</div></td><td><span class="status-badge ${sc}">${st}</span></td><td>${pr.review_comments || 0} reviews</td><td>${timeAgo(pr.updated_at)}</td></tr>`;
        }).join('');
    } catch (e) { }
}

async function loadReposTable() {
    const tb = document.getElementById('repos-tbody'); if (!tb) return;
    try {
        const repos = await apiGH('/api/repos');
        if (!repos.length) { showEmpty(tb.parentElement, 'No repos'); return; }
        tb.innerHTML = repos.slice(0, 10).map(r => {
            const h = r.open_issues_count > 20 ? 'critical' : r.open_issues_count > 5 ? 'warning' : 'healthy';
            return `<tr><td><span class="repo-name">📁 <a href="${r.html_url}" target="_blank" style="color:inherit">${esc(r.name)}</a></span></td><td><span class="status-badge ${h}">● ${h[0].toUpperCase() + h.slice(1)}</span></td><td>${r.language || '—'}</td><td>⭐ ${r.stargazers_count} 🍴 ${r.forks_count}</td><td>${r.open_issues_count} open</td></tr>`;
        }).join('');
    } catch (e) { }
}

async function loadActivityFeed() {
    const f = document.getElementById('activity-feed-body'); if (!f) return;
    try {
        const evs = await apiGH('/api/activity');
        if (!evs.length) { showEmpty(f, 'No activity'); return; }
        f.innerHTML = evs.slice(0, 8).map(e => `<div class="feed-item"><img src="${e.actor.avatar_url}" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"><div class="feed-body"><div class="feed-action"><strong>${esc(e.actor.login)}</strong> ${esc(e.action)} <span class="highlight">${esc(e.detail)}</span></div><div class="feed-time">${timeAgo(e.created_at)}</div></div></div>`).join('');
    } catch (e) { }
}

async function loadCharts() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.plugins.legend.display = false;
    try {
        const prs = await apiGH('/api/pulls');
        const weeks = {};
        prs.filter(p => p.merged).forEach(p => {
            const d = new Date(p.merged_at);
            const k = `${d.getMonth() + 1}/${d.getDate()}`;
            weeks[k] = (weeks[k] || 0) + 1;
        });
        const labels = Object.keys(weeks).slice(-6);
        const data = labels.map(l => weeks[l]);
        if (!labels.length) { labels.push('No data'); data.push(0); }
        new Chart(document.getElementById('velocityChart'), {
            type: 'line',
            data: { labels, datasets: [{ data, borderColor: '#18181b', backgroundColor: 'rgba(24,24,27,.04)', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#18181b', fill: true, tension: .3 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f0eeea' } } } }
        });
    } catch (e) { }
    try {
        const repos = await apiGH('/api/repos');
        if (repos.length) {
            const contribs = await apiGH(`/api/repos/${repos[0].full_name}/contributors`);
            const top5 = contribs.slice(0, 5);
            new Chart(document.getElementById('teamChart'), {
                type: 'bar',
                data: { labels: top5.map(c => c.login), datasets: [{ data: top5.map(c => c.total_commits), backgroundColor: '#18181b', borderRadius: 4, barThickness: 18 }] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: '#f0eeea' } }, y: { grid: { display: false } } } }
            });
        }
    } catch (e) { }
}

// ========== AGENT BUTTONS ==========

function initAgentButtons() {
    // Issue Classifier
    document.getElementById('ic-run')?.addEventListener('click', runIssueClassifier);
    // PR Intelligence
    document.getElementById('pri-run')?.addEventListener('click', runPRIntelligence);
    // Assignee Recommender
    document.getElementById('ar-run')?.addEventListener('click', runAssigneeRecommender);
    // Reviewer Recommender
    document.getElementById('rr-run')?.addEventListener('click', runReviewerRecommender);
    // Workload Analyzer
    document.getElementById('wa-run')?.addEventListener('click', runWorkloadAnalyzer);
}

function agentLoading(container) {
    container.innerHTML = `
    <div class="loading-state" style="padding:60px 20px">
      <div class="spinner"></div><br>
      <strong>Agent is analyzing your repository…</strong><br>
      <span style="font-size:12px;color:var(--text-tertiary)">This may take 10–30 seconds depending on repo size</span>
    </div>`;
}

function agentError(container, msg) {
    container.innerHTML = `<div class="result-card" style="border-color:var(--danger)"><div class="result-body" style="color:var(--danger)">❌ ${esc(msg)}</div></div>`;
}

// ---- Issue Classifier ----
async function runIssueClassifier() {
    const repo = parseRepo(document.getElementById('ic-repo').value);
    const results = document.getElementById('ic-results');
    if (!repo) return agentError(results, 'Please enter a valid repo: owner/repo or GitHub URL');

    const btn = document.getElementById('ic-run');
    btn.disabled = true; btn.textContent = '⏳ Analyzing…';
    agentLoading(results);

    try {
        const data = await apiAI('/api/ai/analyze-issues', repo);
        if (!data.classifications?.length) {
            showEmpty(results, 'No open issues found in this repository.');
            return;
        }
        results.innerHTML = `<div style="font-size:13px;color:var(--text-tertiary);margin-bottom:4px">Analyzed <strong>${data.issues_analyzed}</strong> issues from <strong>${esc(data.repo)}</strong></div>` +
            data.classifications.map(c => {
                const a = c.analysis;
                const cls = a.classification.toLowerCase();
                const pri = a.priority.toLowerCase();
                return `
          <div class="result-card">
            <div class="result-card-header">
              <div class="result-card-title"><span class="issue-num">#${c.issue_number}</span> ${esc(c.issue_title)}</div>
              <div class="result-badges">
                <span class="badge-classification ${cls}">${a.classification}</span>
                <span class="badge-priority ${pri}">${a.priority} Priority</span>
              </div>
            </div>
            <div class="result-body">
              <div class="result-row"><span class="result-label">Reasoning:</span> ${esc(a.reasoning)}</div>
              <div class="result-row"><span class="result-label">Confidence:</span> ${Math.round(a.confidence_score * 100)}%</div>
              <div class="result-labels-list">${a.suggested_labels.map(l => `<span class="result-label-tag">${esc(l)}</span>`).join('')}</div>
            </div>
          </div>`;
            }).join('');
    } catch (e) {
        agentError(results, e.message);
    } finally {
        btn.disabled = false; btn.textContent = '🚀 Analyze Issues';
    }
}

// ---- PR Intelligence ----
async function runPRIntelligence() {
    const repo = parseRepo(document.getElementById('pri-repo').value);
    const results = document.getElementById('pri-results');
    if (!repo) return agentError(results, 'Please enter a valid repo: owner/repo or GitHub URL');

    const btn = document.getElementById('pri-run');
    btn.disabled = true; btn.textContent = '⏳ Analyzing…';
    agentLoading(results);

    try {
        const data = await apiAI('/api/ai/analyze-prs', repo);
        if (!data.pr_intelligence?.length) {
            showEmpty(results, 'No pull requests found.');
            return;
        }
        results.innerHTML = `<div style="font-size:13px;color:var(--text-tertiary);margin-bottom:4px">Analyzed <strong>${data.prs_analyzed}</strong> PRs from <strong>${esc(data.repo)}</strong></div>` +
            data.pr_intelligence.map(p => {
                const a = p.analysis;
                const risk = a.risk_level.toLowerCase();
                return `
          <div class="result-card">
            <div class="result-card-header">
              <div class="result-card-title"><span class="issue-num">#${p.pr_number}</span> ${esc(p.pr_title)}</div>
              <div class="result-badges"><span class="badge-risk ${risk}">Risk: ${a.risk_level}</span></div>
            </div>
            <div class="result-body">
              <div class="result-row"><span class="result-label">Summary:</span> ${esc(a.summary)}</div>
              <ul class="checklist">${a.review_checklist.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
            </div>
          </div>`;
            }).join('');
    } catch (e) {
        agentError(results, e.message);
    } finally {
        btn.disabled = false; btn.textContent = '🚀 Analyze PRs';
    }
}

// ---- Assignee Recommender ----
async function runAssigneeRecommender() {
    const repo = parseRepo(document.getElementById('ar-repo').value);
    const results = document.getElementById('ar-results');
    if (!repo) return agentError(results, 'Please enter a valid repo: owner/repo or GitHub URL');

    const btn = document.getElementById('ar-run');
    btn.disabled = true; btn.textContent = '⏳ Analyzing…';
    agentLoading(results);

    try {
        const data = await apiAI('/api/ai/analyze-issues', repo);
        if (!data.assignee_recommendations?.length) {
            showEmpty(results, 'No issues to recommend assignees for.');
            return;
        }
        results.innerHTML = `<div style="font-size:13px;color:var(--text-tertiary);margin-bottom:4px">Assignee recommendations for <strong>${esc(data.repo)}</strong></div>` +
            data.assignee_recommendations.map(rec => `
        <div class="result-card">
          <div class="result-card-title" style="margin-bottom:10px"><span class="issue-num">#${rec.issue_number}</span> ${esc(rec.issue_title)}</div>
          <div class="candidate-list">
            ${rec.recommended_assignees.map(a => `
              <div class="candidate-item">
                <div class="candidate-avatar">${(a.developer_name || '??').substring(0, 2).toUpperCase()}</div>
                <div class="candidate-info">
                  <div class="candidate-name">${esc(a.developer_name)}</div>
                  <div class="candidate-reasoning">${esc(a.reasoning)}</div>
                </div>
                <div class="candidate-score">${Math.round(a.score)}</div>
              </div>`).join('')}
          </div>
        </div>`).join('');
    } catch (e) {
        agentError(results, e.message);
    } finally {
        btn.disabled = false; btn.textContent = '🚀 Find Assignees';
    }
}

// ---- Reviewer Recommender ----
async function runReviewerRecommender() {
    const repo = parseRepo(document.getElementById('rr-repo').value);
    const results = document.getElementById('rr-results');
    if (!repo) return agentError(results, 'Please enter a valid repo: owner/repo or GitHub URL');

    const btn = document.getElementById('rr-run');
    btn.disabled = true; btn.textContent = '⏳ Analyzing…';
    agentLoading(results);

    try {
        const data = await apiAI('/api/ai/analyze-prs', repo);
        if (!data.reviewer_recommendations?.length) {
            showEmpty(results, 'No PRs to recommend reviewers for.');
            return;
        }
        results.innerHTML = `<div style="font-size:13px;color:var(--text-tertiary);margin-bottom:4px">Reviewer recommendations for <strong>${esc(data.repo)}</strong></div>` +
            data.reviewer_recommendations.map(rec => `
        <div class="result-card">
          <div class="result-card-title" style="margin-bottom:10px"><span class="issue-num">#${rec.pr_number}</span> ${esc(rec.pr_title)}</div>
          <div class="candidate-list">
            ${rec.suggested_reviewers.map(r => `
              <div class="candidate-item">
                <div class="candidate-avatar">${(r.developer_name || '??').substring(0, 2).toUpperCase()}</div>
                <div class="candidate-info">
                  <div class="candidate-name">${esc(r.developer_name)}</div>
                  <div class="candidate-reasoning">${esc(r.reasoning)}</div>
                </div>
                <div class="candidate-score">${Math.round(r.confidence_score)}</div>
              </div>`).join('')}
          </div>
        </div>`).join('');
    } catch (e) {
        agentError(results, e.message);
    } finally {
        btn.disabled = false; btn.textContent = '🚀 Find Reviewers';
    }
}

// ---- Workload Analyzer ----
async function runWorkloadAnalyzer() {
    const repo = parseRepo(document.getElementById('wa-repo').value);
    const results = document.getElementById('wa-results');
    if (!repo) return agentError(results, 'Please enter a valid repo: owner/repo or GitHub URL');

    const btn = document.getElementById('wa-run');
    btn.disabled = true; btn.textContent = '⏳ Analyzing…';
    agentLoading(results);

    try {
        const data = await apiAI('/api/ai/analyze-workload', repo);
        const wl = data.analysis;
        if (!wl.developer_workload?.length) {
            showEmpty(results, 'No workload data found.');
            return;
        }
        const maxLoad = Math.max(...wl.developer_workload.map(d => d.load_score), 10);
        results.innerHTML = `
      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:14px">Developer Workload — ${esc(data.repo)}</div>
        <table class="workload-table">
          <thead><tr><th>Developer</th><th>Open Issues</th><th>Pending Reviews</th><th>Load Score</th><th>Load</th></tr></thead>
          <tbody>
            ${wl.developer_workload.map(d => {
            const pct = Math.round((d.load_score / maxLoad) * 100);
            const color = d.load_score >= 6 ? 'var(--danger)' : d.load_score >= 3 ? 'var(--warning)' : 'var(--success)';
            return `<tr>
                <td><strong>${esc(d.developer_name)}</strong></td>
                <td>${d.open_issues}</td>
                <td>${d.pending_reviews}</td>
                <td><strong>${d.load_score}</strong></td>
                <td><div class="load-bar"><div class="load-bar-fill" style="width:${pct}%;background:${color}"></div></div></td>
              </tr>`;
        }).join('')}
          </tbody>
        </table>
        <div class="ai-recommendation-box">
          <strong>💡 AI Recommendation:</strong><br>${esc(wl.ai_recommendation)}
        </div>
      </div>`;
    } catch (e) {
        agentError(results, e.message);
    } finally {
        btn.disabled = false; btn.textContent = '🚀 Analyze Workload';
    }
}

// ---- PR filter buttons ----
document.addEventListener('click', e => {
    if (!e.target.matches('.filter-btn')) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const f = e.target.textContent.trim().toLowerCase();
    document.querySelectorAll('#prs-tbody tr').forEach(r => {
        const b = r.querySelector('.status-badge');
        if (!b) return;
        const t = b.textContent.toLowerCase();
        r.style.display = (f === 'all' || t.includes(f)) ? '' : 'none';
    });
});
