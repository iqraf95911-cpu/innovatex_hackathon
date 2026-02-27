// ===== DevIntel AI — Dashboard Frontend =====

const AI_API = 'http://localhost:8000';  // FastAPI backend
const GH_API = '';  // Express backend (same origin)

// ========== LOAD LOGGED IN USER ==========

function loadLoggedInUser() {
    const userDataStr = localStorage.getItem('devIntelUser');
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            const sidebar = document.querySelector('.sidebar-user');
            if (sidebar) {
                // Update user name
                const nameEl = sidebar.querySelector('.name');
                if (nameEl) {
                    nameEl.textContent = userData.name || userData.userId;
                }
                
                // Update user role/email
                const roleEl = sidebar.querySelector('.role');
                if (roleEl) {
                    roleEl.textContent = userData.email || userData.userId;
                }
                
                // Update avatar with initials
                const avatarEl = sidebar.querySelector('.user-avatar');
                if (avatarEl) {
                    const initials = (userData.name || userData.userId).substring(0, 2).toUpperCase();
                    avatarEl.textContent = initials;
                }
            }
        } catch (e) {
            console.error('Error loading user data:', e);
        }
    }
}

// ========== HISTORY MANAGEMENT ==========

function saveToHistory(agentName, repository, timestamp = new Date().toISOString()) {
    try {
        console.log('=== SAVE TO HISTORY ===');
        console.log('Agent:', agentName);
        console.log('Repository:', repository);
        console.log('Timestamp:', timestamp);
        
        const history = getHistory();
        console.log('Current history length:', history.length);
        
        const entry = {
            id: Date.now(),
            agent: agentName,
            repository: repository,
            timestamp: timestamp,
            user: getUserName()
        };
        
        console.log('New entry:', entry);
        
        history.unshift(entry); // Add to beginning
        
        // Keep only last 50 entries
        if (history.length > 50) history.length = 50;
        
        const historyJson = JSON.stringify(history);
        console.log('Saving to localStorage, size:', historyJson.length, 'bytes');
        
        localStorage.setItem('devIntelHistory', historyJson);
        
        // Verify it was saved
        const saved = localStorage.getItem('devIntelHistory');
        console.log('Verification - saved successfully:', saved !== null);
        console.log('New history length:', history.length);
        console.log('======================');
    } catch (error) {
        console.error('ERROR saving to history:', error);
    }
}

function getHistory() {
    const historyStr = localStorage.getItem('devIntelHistory');
    return historyStr ? JSON.parse(historyStr) : [];
}

function clearHistory() {
    localStorage.removeItem('devIntelHistory');
    loadHistoryPanel();
}

function getUserName() {
    const userDataStr = localStorage.getItem('devIntelUser');
    if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.name || userData.userId || 'Unknown';
    }
    return 'Guest';
}

function loadHistoryPanel() {
    try {
        console.log('=== LOAD HISTORY PANEL ===');
        const history = getHistory();
        console.log('History entries:', history.length);
        console.log('History data:', history);
        
        const countEl = document.getElementById('history-count');
        const resultsEl = document.getElementById('history-results');
        
        console.log('Count element found:', countEl !== null);
        console.log('Results element found:', resultsEl !== null);
        
        if (!resultsEl) {
            console.error('ERROR: history-results element not found!');
            return;
        }
        
        if (countEl) countEl.textContent = history.length;
        
        if (history.length === 0) {
            console.log('No history, showing empty state');
            resultsEl.innerHTML = `
                <div class="empty-state" style="padding:60px 20px">
                    <div style="font-size:48px;margin-bottom:16px">📭</div>
                    <div style="font-size:15px;color:var(--text-secondary);margin-bottom:8px">No history yet</div>
                    <div style="font-size:13px;color:var(--text-tertiary)">Start analyzing repositories to see your history here</div>
                </div>`;
            console.log('=========================');
            return;
        }
        
        console.log('Rendering', history.length, 'history entries');
        
        resultsEl.innerHTML = history.map(entry => {
            const date = new Date(entry.timestamp);
            const timeStr = timeAgo(entry.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            const agentIcons = {
                'Repository Analyzer': '📦',
                'Issue Classifier': '🏷️',
                'PR Intelligence': '🔍',
                'Assignee Recommender': '👤',
                'Workload Analyzer': '⚖️',
                'Test Agent': '🧪'
            };
            
            const icon = agentIcons[entry.agent] || '🤖';
            
            return `
                <div class="result-card">
                    <div style="display:flex;gap:16px;align-items:flex-start">
                        <div style="font-size:32px;line-height:1">${icon}</div>
                        <div style="flex:1;overflow:hidden">
                            <div style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text-primary)">
                                ${esc(entry.agent)}
                            </div>
                            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;overflow-wrap:break-word">
                                📁 ${esc(entry.repository)}
                            </div>
                            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-tertiary)">
                                <span>👤 ${esc(entry.user)}</span>
                                <span>🕒 ${timeStr}</span>
                                <span>📅 ${dateStr}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
        
        console.log('History rendered successfully');
        console.log('=========================');
    } catch (error) {
        console.error('ERROR loading history panel:', error);
    }
}

function initHistory() {
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all history?')) {
                clearHistory();
            }
        });
    }
    
    // Test button to manually add a history entry
    const testBtn = document.getElementById('test-history-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            console.log('Test button clicked');
            saveToHistory('Test Agent', 'facebook/react');
            alert('Test entry added! Reloading history...');
            loadHistoryPanel();
        });
    }
}

function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear user data from localStorage
            localStorage.removeItem('devIntelUser');
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadLoggedInUser();
    initLogout();
    initHistory();
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
    'workload-analyzer': ['Workload Analyzer', '/ AI Agent'],
    'repository-analyzer': ['Repository Analyzer', '/ AI Agent'],
    'history': ['Analysis History', '/ History'],
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
    
    // Load history when history panel is shown
    if (panelId === 'history') {
        loadHistoryPanel();
    }
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
    // First, load dummy data immediately
    loadDummyData();
    
    // Then try to load real data if connected
    try {
        const status = await apiGH('/api/settings/token-status');
        if (!status.connected) { 
            showTokenBanner(); 
            return; // Keep dummy data and logged-in user info
        }
        const u = status.user;
        const sidebar = document.querySelector('.sidebar-user');
        if (sidebar) {
            // Only update if we have GitHub user data AND no logged-in user from login page
            const userDataStr = localStorage.getItem('devIntelUser');
            if (!userDataStr) {
                sidebar.querySelector('.name').textContent = u.name || u.login;
                sidebar.querySelector('.role').textContent = '@' + u.login;
                sidebar.querySelector('.user-avatar').textContent = (u.login || '??').substring(0, 2).toUpperCase();
            }
        }
        
        // Load real data
        loadMetrics();
        loadPRsTable();
        loadReposTable();
        loadActivityFeed();
        loadCharts();
    } catch (e) { 
        // Keep dummy data and logged-in user info on error
        return; 
    }
}

function loadDummyData() {
    loadDummyMetrics();
    loadDummyPRsTable();
    loadDummyReposTable();
    loadDummyActivityFeed();
    loadDummyCharts();
}

function loadDummyMetrics() {
    const g = document.getElementById('metrics-grid'); if (!g) return;
    g.innerHTML = `
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">📁</span> Repos</div><div class="metric-value">24</div><div class="metric-change positive">156 PRs tracked</div></div>
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">⏱️</span> Avg Cycle</div><div class="metric-value">4.2h</div><div class="metric-change neutral">89 merged</div></div>
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">🚀</span> Velocity</div><div class="metric-value">61</div><div class="metric-change neutral">PRs in 14d</div></div>
      <div class="metric-card"><div class="metric-label"><span class="metric-icon">✅</span> Review</div><div class="metric-value">92%</div><div class="metric-change neutral">12 open</div></div>`;
}

function loadDummyPRsTable() {
    const tb = document.getElementById('prs-tbody'); if (!tb) return;
    const dummyPRs = [
        { number: 1847, title: 'Add user authentication module', author: 'sarah-dev', avatar: 'SD', status: 'merged', repo: 'backend-api', reviews: 3, time: '2h ago' },
        { number: 1846, title: 'Fix memory leak in data processor', author: 'mike-chen', avatar: 'MC', status: 'open', repo: 'data-pipeline', reviews: 1, time: '5h ago' },
        { number: 1845, title: 'Update dependencies to latest versions', author: 'alex-kim', avatar: 'AK', status: 'merged', repo: 'frontend-app', reviews: 2, time: '1d ago' },
        { number: 1844, title: 'Implement dark mode toggle', author: 'emma-wilson', avatar: 'EW', status: 'open', repo: 'ui-components', reviews: 4, time: '1d ago' },
        { number: 1843, title: 'Optimize database queries', author: 'john-smith', avatar: 'JS', status: 'merged', repo: 'backend-api', reviews: 2, time: '2d ago' },
    ];
    
    tb.innerHTML = dummyPRs.map(pr => {
        const sc = pr.status === 'merged' ? 'healthy' : 'warning';
        const st = pr.status === 'merged' ? '● Merged' : '● Open';
        return `<tr>
            <td><div class="pr-title">#${pr.number} — ${esc(pr.title)}</div><div class="pr-meta">${pr.repo}</div></td>
            <td><div class="pr-author"><div style="width:22px;height:22px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600">${pr.avatar}</div> ${esc(pr.author)}</div></td>
            <td><span class="status-badge ${sc}">${st}</span></td>
            <td>${pr.reviews} reviews</td>
            <td>${pr.time}</td>
        </tr>`;
    }).join('');
}

function loadDummyReposTable() {
    const tb = document.getElementById('repos-tbody'); if (!tb) return;
    const dummyRepos = [
        { name: 'backend-api', status: 'healthy', language: 'Python', stars: 234, forks: 45, issues: 8 },
        { name: 'frontend-app', status: 'healthy', language: 'TypeScript', stars: 189, forks: 32, issues: 12 },
        { name: 'data-pipeline', status: 'warning', language: 'Python', stars: 156, forks: 28, issues: 23 },
        { name: 'ui-components', status: 'healthy', language: 'JavaScript', stars: 312, forks: 67, issues: 5 },
        { name: 'mobile-app', status: 'healthy', language: 'Dart', stars: 445, forks: 89, issues: 15 },
        { name: 'analytics-service', status: 'warning', language: 'Go', stars: 98, forks: 19, issues: 31 },
        { name: 'auth-service', status: 'healthy', language: 'Node.js', stars: 267, forks: 54, issues: 7 },
    ];
    
    tb.innerHTML = dummyRepos.map(r => {
        const h = r.status;
        return `<tr>
            <td><span class="repo-name">📁 ${esc(r.name)}</span></td>
            <td><span class="status-badge ${h}">● ${h[0].toUpperCase() + h.slice(1)}</span></td>
            <td>${r.language}</td>
            <td>⭐ ${r.stars} 🍴 ${r.forks}</td>
            <td>${r.issues} open</td>
        </tr>`;
    }).join('');
}

function loadDummyActivityFeed() {
    const f = document.getElementById('activity-feed-body'); if (!f) return;
    const dummyActivity = [
        { actor: 'sarah-dev', avatar: 'SD', action: 'merged', detail: 'PR #1847 — auth module', time: '2m ago' },
        { actor: 'mike-chen', avatar: 'MC', action: 'opened', detail: 'PR #1846 — memory fix', time: '14m ago' },
        { actor: 'alex-kim', avatar: 'AK', action: 'reviewed', detail: 'PR #1845 — dependencies', time: '1h ago' },
        { actor: 'emma-wilson', avatar: 'EW', action: 'commented on', detail: 'issue #234', time: '2h ago' },
        { actor: 'john-smith', avatar: 'JS', action: 'pushed', detail: '3 commits to main', time: '3h ago' },
        { actor: 'lisa-park', avatar: 'LP', action: 'created', detail: 'branch feature/api-v2', time: '4h ago' },
        { actor: 'david-lee', avatar: 'DL', action: 'closed', detail: 'issue #231', time: '5h ago' },
        { actor: 'rachel-brown', avatar: 'RB', action: 'starred', detail: 'ui-components', time: '6h ago' },
    ];
    
    f.innerHTML = dummyActivity.map(e => `
        <div class="feed-item">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">${e.avatar}</div>
            <div class="feed-body">
                <div class="feed-action"><strong>${esc(e.actor)}</strong> ${esc(e.action)} <span class="highlight">${esc(e.detail)}</span></div>
                <div class="feed-time">${e.time}</div>
            </div>
        </div>
    `).join('');
}

function loadDummyCharts() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.plugins.legend.display = false;
    
    // Velocity Chart
    const velocityCtx = document.getElementById('velocityChart');
    if (velocityCtx) {
        new Chart(velocityCtx, {
            type: 'line',
            data: {
                labels: ['Feb 20', 'Feb 21', 'Feb 22', 'Feb 23', 'Feb 24', 'Feb 25', 'Feb 26', 'Feb 27'],
                datasets: [{
                    data: [8, 12, 9, 15, 11, 14, 10, 13],
                    borderColor: '#18181b',
                    backgroundColor: 'rgba(24,24,27,.04)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#18181b',
                    fill: true,
                    tension: .3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: '#f0eeea' } }
                }
            }
        });
    }
    
    // Team Chart
    const teamCtx = document.getElementById('teamChart');
    if (teamCtx) {
        new Chart(teamCtx, {
            type: 'bar',
            data: {
                labels: ['sarah-dev', 'mike-chen', 'alex-kim', 'emma-wilson', 'john-smith'],
                datasets: [{
                    data: [145, 128, 112, 98, 87],
                    backgroundColor: '#18181b',
                    borderRadius: 4,
                    barThickness: 18
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: '#f0eeea' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }
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
    // Workload Analyzer
    document.getElementById('wa-run')?.addEventListener('click', runWorkloadAnalyzer);
    // Repository Analyzer
    document.getElementById('ra-run')?.addEventListener('click', runRepositoryAnalyzer);
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
    // Clean up error message for better display
    let cleanMsg = msg;
    if (msg.includes('404')) {
        cleanMsg = 'Repository not found. Please check the owner/repo name and ensure it exists on GitHub.';
    } else if (msg.includes('403')) {
        cleanMsg = 'Access forbidden. The repository may be private or your token lacks permissions.';
    } else if (msg.includes('401')) {
        cleanMsg = 'Authentication failed. Please check your GitHub token in Settings.';
    } else if (msg.includes('500')) {
        cleanMsg = 'Server error. Please try again or check the backend logs.';
    }
    container.innerHTML = `<div class="result-card" style="border-color:var(--danger);padding:20px">
        <div class="result-body" style="color:var(--danger)">
            <strong>❌ Error</strong><br>
            <span style="font-size:14px;margin-top:8px;display:block">${esc(cleanMsg)}</span>
            ${msg.includes('404') ? '<br><span style="font-size:12px;color:var(--text-tertiary)">💡 Tip: Make sure the repository exists and is public, or that your token has access to private repos.</span>' : ''}
        </div>
    </div>`;
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
        
        // Save to history immediately after successful API call
        saveToHistory('Issue Classifier', `${repo.owner}/${repo.repo}`);
        
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
        
        // Save to history immediately after successful API call
        saveToHistory('PR Intelligence', `${repo.owner}/${repo.repo}`);
        
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
        
        // Save to history immediately after successful API call
        saveToHistory('Assignee Recommender', `${repo.owner}/${repo.repo}`);
        
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
        
        // Save to history immediately after successful API call
        saveToHistory('Workload Analyzer', `${repo.owner}/${repo.repo}`);
        
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


// ---- Repository Analyzer ----
async function runRepositoryAnalyzer() {
    const repo = parseRepo(document.getElementById('ra-repo').value);
    const results = document.getElementById('ra-results');
    if (!repo) return agentError(results, 'Please enter a valid repo: owner/repo or GitHub URL');

    const btn = document.getElementById('ra-run');
    btn.disabled = true; btn.textContent = '⏳ Analyzing…';
    agentLoading(results);

    try {
        const data = await apiAI('/api/ai/analyze-repository', repo);
        
        // Save to history immediately after successful API call
        saveToHistory('Repository Analyzer', `${repo.owner}/${repo.repo}`);
        
        const info = data.repository_info;
        const analysis = data.analysis;

        results.innerHTML = `
      <div class="result-card" style="margin-bottom:16px">
        <div class="result-card-header" style="border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:12px">
          <div>
            <div class="result-card-title" style="font-size:18px;margin-bottom:6px">
              📦 ${esc(info.name)}
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${esc(info.description || 'No description')}</div>
            <div style="display:flex;gap:12px;font-size:12px;color:var(--text-tertiary)">
              <span>⭐ ${info.stars} stars</span>
              <span>🍴 ${info.forks} forks</span>
              <span>👁️ ${info.watchers} watchers</span>
              <span>🐛 ${info.open_issues} issues</span>
            </div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-row">
            <span class="result-label">Language:</span> ${esc(info.language)}
          </div>
          <div class="result-row">
            <span class="result-label">License:</span> ${esc(info.license)}
          </div>
          <div class="result-row">
            <span class="result-label">Repository:</span> <a href="${esc(info.url)}" target="_blank" style="color:var(--primary)">${esc(info.url)}</a>
          </div>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:12px">📝 Overview</div>
        <div class="result-body">
          <p style="line-height:1.6;color:var(--text-secondary)">${esc(analysis.overview)}</p>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:12px">✨ Key Features</div>
        <div class="result-body">
          <ul class="checklist">
            ${analysis.key_features.map(f => `<li>${esc(f)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:12px">🛠️ Technology Stack</div>
        <div class="result-body">
          <div class="result-labels-list">
            ${(analysis.technology_stack && analysis.technology_stack.length > 0) 
              ? analysis.technology_stack.map(t => `<span class="result-label-tag" style="background:var(--primary);color:white">${esc(t)}</span>`).join('')
              : '<span style="color:var(--text-tertiary)">No technology stack detected</span>'}
          </div>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:12px">🏗️ Architecture Insights</div>
        <div class="result-body">
          <p style="line-height:1.6;color:var(--text-secondary)">${esc(analysis.architecture_insights)}</p>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:12px">📊 Code Quality Indicators</div>
        <div class="result-body">
          <table class="workload-table" style="width:100%">
            <tbody>
              <tr>
                <td><strong>Repository Size</strong></td>
                <td>${esc(analysis.code_quality_indicators.repository_size)}</td>
              </tr>
              <tr>
                <td><strong>Community Engagement</strong></td>
                <td><span class="status-badge ${analysis.code_quality_indicators.community_engagement.toLowerCase() === 'high' ? 'healthy' : 'warning'}">${esc(analysis.code_quality_indicators.community_engagement)}</span></td>
              </tr>
              <tr>
                <td><strong>Maintenance Status</strong></td>
                <td><span class="status-badge ${analysis.code_quality_indicators.maintenance_status.toLowerCase().includes('active') ? 'healthy' : 'warning'}">${esc(analysis.code_quality_indicators.maintenance_status)}</span></td>
              </tr>
              <tr>
                <td><strong>Documentation</strong></td>
                <td>${esc(analysis.code_quality_indicators.documentation)}</td>
              </tr>
              <tr>
                <td><strong>License</strong></td>
                <td>${esc(analysis.code_quality_indicators.license)}</td>
              </tr>
              <tr>
                <td><strong>Contributors</strong></td>
                <td>${analysis.code_quality_indicators.contributors}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="result-card">
        <div class="result-card-title" style="margin-bottom:12px">💡 Recommendations</div>
        <div class="result-body">
          <ul class="checklist">
            ${analysis.recommendations.map(r => `<li>${esc(r)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    } catch (e) {
        agentError(results, e.message);
    } finally {
        btn.disabled = false; btn.textContent = '🚀 Analyze Repository';
    }
}
