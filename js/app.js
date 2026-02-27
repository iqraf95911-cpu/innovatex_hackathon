// ===== DevIntel AI — Dashboard Frontend =====

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initNavigation();
});

// ---- API Helpers ----
async function api(endpoint) {
    const res = await fetch(endpoint);
    if (res.status === 401) {
        showTokenBanner();
        throw new Error('NO_TOKEN');
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

function showTokenBanner() {
    const content = document.querySelector('.dashboard-content');
    if (!content || document.getElementById('token-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'token-banner';
    banner.className = 'token-banner';
    banner.innerHTML = '⚠️ GitHub token not configured. <a href="settings.html">Go to Settings</a> to connect your account.';
    content.prepend(banner);
}

function showLoading(container) {
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><br>Loading from GitHub…</div>';
}

function showEmpty(container, msg) {
    if (!container) return;
    container.innerHTML = `<div class="empty-state">${msg}</div>`;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function initials(login) {
    return (login || '??').substring(0, 2).toUpperCase();
}

// ---- Dashboard Init ----
async function initDashboard() {
    // Check token status first
    try {
        const status = await api('/api/settings/token-status');
        if (!status.connected) {
            showTokenBanner();
            return;
        }
        // Update sidebar user
        const sidebarName = document.querySelector('.sidebar-user .user-info .name');
        const sidebarRole = document.querySelector('.sidebar-user .user-info .role');
        const sidebarAvatar = document.querySelector('.sidebar-user .user-avatar');
        if (sidebarName) sidebarName.textContent = status.user.name || status.user.login;
        if (sidebarRole) sidebarRole.textContent = '@' + status.user.login;
        if (sidebarAvatar) sidebarAvatar.textContent = initials(status.user.login);
    } catch (e) {
        return;
    }

    // Load all sections in parallel
    loadMetrics();
    loadPRsTable();
    loadReposTable();
    loadActivityFeed();
    loadCharts();
}

// ---- Metrics ----
async function loadMetrics() {
    const grid = document.getElementById('metrics-grid');
    if (!grid) return;
    showLoading(grid);
    try {
        const stats = await api('/api/stats');
        grid.innerHTML = `
      <div class="metric-card">
        <div class="metric-label"><span class="metric-icon">📁</span> Repos Analyzed</div>
        <div class="metric-value">${stats.repoCount}</div>
        <div class="metric-change positive">${stats.totalPRs} total PRs tracked</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span class="metric-icon">⏱️</span> Avg PR Cycle Time</div>
        <div class="metric-value">${stats.avgCycleHours}h</div>
        <div class="metric-change neutral">${stats.mergedPRs} merged PRs</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span class="metric-icon">🚀</span> Sprint Velocity</div>
        <div class="metric-value">${stats.velocity} PRs</div>
        <div class="metric-change neutral">Merged in last 14 days</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span class="metric-icon">✅</span> Review Score</div>
        <div class="metric-value">${stats.reviewScore}%</div>
        <div class="metric-change neutral">${stats.openPRs} currently open</div>
      </div>
    `;
    } catch (e) {
        if (e.message !== 'NO_TOKEN') showEmpty(grid, 'Failed to load metrics');
    }
}

// ---- PRs Table ----
async function loadPRsTable() {
    const tbody = document.getElementById('prs-tbody');
    if (!tbody) return;
    showLoading(tbody.parentElement);
    try {
        const prs = await api('/api/pulls');
        if (prs.length === 0) {
            showEmpty(tbody.parentElement, 'No pull requests found');
            return;
        }
        tbody.innerHTML = prs.map(pr => {
            const statusClass = pr.merged ? 'healthy' : pr.state === 'open' ? 'warning' : 'critical';
            const statusText = pr.merged ? '● Merged' : pr.state === 'open' ? '● Open' : '● Closed';
            const cycleMs = pr.merged_at
                ? new Date(pr.merged_at) - new Date(pr.created_at)
                : pr.closed_at
                    ? new Date(pr.closed_at) - new Date(pr.created_at)
                    : Date.now() - new Date(pr.created_at);
            const cycleHours = Math.round(cycleMs / 3600000 * 10) / 10;
            return `
        <tr>
          <td>
            <div class="pr-title"><a href="${pr.html_url}" target="_blank" style="color:inherit">#${pr.number} — ${escapeHtml(pr.title)}</a></div>
            <div class="pr-meta">${pr.repo_name} · ${pr.changed_files} files changed</div>
          </td>
          <td>
            <div class="pr-author">
              <img src="${pr.user.avatar_url}" style="width:22px;height:22px;border-radius:50%;" alt="">
              ${escapeHtml(pr.user.login)}
            </div>
          </td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${cycleHours}h</td>
          <td>${pr.review_comments} reviews</td>
        </tr>
      `;
        }).join('');
    } catch (e) {
        if (e.message !== 'NO_TOKEN') showEmpty(tbody.parentElement, 'Failed to load PRs');
    }
}

// ---- Repos Table ----
async function loadReposTable() {
    const tbody = document.getElementById('repos-tbody');
    if (!tbody) return;
    showLoading(tbody.parentElement);
    try {
        const repos = await api('/api/repos');
        if (repos.length === 0) {
            showEmpty(tbody.parentElement, 'No repositories found');
            return;
        }
        tbody.innerHTML = repos.slice(0, 10).map(repo => {
            const health = repo.open_issues_count > 20 ? 'critical' : repo.open_issues_count > 5 ? 'warning' : 'healthy';
            const healthText = health === 'critical' ? 'Critical' : health === 'warning' ? 'Warning' : 'Healthy';
            return `
        <tr>
          <td><span class="repo-name"><span class="repo-icon">📁</span> <a href="${repo.html_url}" target="_blank" style="color:inherit">${escapeHtml(repo.name)}</a></span></td>
          <td><span class="status-badge ${health}">● ${healthText}</span></td>
          <td>${repo.language || '—'}</td>
          <td>⭐ ${repo.stargazers_count}  🍴 ${repo.forks_count}</td>
          <td>${repo.open_issues_count} open</td>
        </tr>
      `;
        }).join('');
    } catch (e) {
        if (e.message !== 'NO_TOKEN') showEmpty(tbody.parentElement, 'Failed to load repos');
    }
}

// ---- Activity Feed ----
async function loadActivityFeed() {
    const feed = document.getElementById('activity-feed-body');
    if (!feed) return;
    showLoading(feed);
    try {
        const events = await api('/api/activity');
        if (events.length === 0) {
            showEmpty(feed, 'No recent activity');
            return;
        }
        feed.innerHTML = events.slice(0, 8).map(ev => `
      <div class="feed-item">
        <img src="${ev.actor.avatar_url}" style="width:32px;height:32px;border-radius:50%;flex-shrink:0;" alt="">
        <div class="feed-body">
          <div class="feed-action"><strong>${escapeHtml(ev.actor.login)}</strong> ${escapeHtml(ev.action)} <span class="highlight">${escapeHtml(ev.detail)}</span></div>
          <div class="feed-time">${timeAgo(ev.created_at)}</div>
        </div>
      </div>
    `).join('');
    } catch (e) {
        if (e.message !== 'NO_TOKEN') showEmpty(feed, 'Failed to load activity');
    }
}

// ---- Charts ----
let velocityChart = null;
let teamChart = null;

async function loadCharts() {
    if (typeof Chart === 'undefined') return;

    // Chart.js global defaults
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1a1a1a';
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = false;

    await loadVelocityChart();
    await loadTeamChart();
}

async function loadVelocityChart() {
    const canvas = document.getElementById('velocityChart');
    if (!canvas) return;

    try {
        const prs = await api('/api/pulls');
        // Group merged PRs by week
        const weeks = {};
        prs.filter(p => p.merged).forEach(pr => {
            const d = new Date(pr.merged_at);
            const weekKey = `${d.getMonth() + 1}/${d.getDate()}`;
            weeks[weekKey] = (weeks[weekKey] || 0) + 1;
        });

        const labels = Object.keys(weeks).slice(-6);
        const data = labels.map(l => weeks[l]);

        if (labels.length === 0) {
            labels.push('No data');
            data.push(0);
        }

        if (velocityChart) velocityChart.destroy();
        velocityChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Merged PRs',
                    data,
                    borderColor: '#18181b',
                    backgroundColor: 'rgba(24, 24, 27, 0.04)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#18181b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0eeea', drawBorder: false },
                        border: { display: false },
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    } catch (e) { /* fail silently — metrics will show the error */ }
}

async function loadTeamChart() {
    const canvas = document.getElementById('teamChart');
    if (!canvas) return;

    try {
        // Get top repo and fetch its contributors
        const repos = await api('/api/repos');
        if (repos.length === 0) return;
        const topRepo = repos[0];
        const contributors = await api(`/api/repos/${topRepo.full_name}/contributors`);
        if (contributors.length === 0) return;

        const top5 = contributors.slice(0, 5);
        const labels = top5.map(c => c.login);
        const data = top5.map(c => c.total_commits);

        if (teamChart) teamChart.destroy();
        teamChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Commits',
                    data,
                    backgroundColor: '#18181b',
                    borderRadius: 4,
                    barThickness: 18,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: '#f0eeea', drawBorder: false },
                        border: { display: false },
                    },
                    y: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { font: { weight: '500' } }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: { label: ctx => `${ctx.parsed.x} commits` }
                    }
                }
            }
        });
    } catch (e) { /* fail silently */ }
}

// ---- Filter buttons for PRs ----
document.addEventListener('click', (e) => {
    if (e.target.matches('.filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        // Re-filter visible rows (client-side)
        const filter = e.target.textContent.trim().toLowerCase();
        const rows = document.querySelectorAll('#prs-tbody tr');
        rows.forEach(row => {
            const badge = row.querySelector('.status-badge');
            if (!badge) return;
            const text = badge.textContent.toLowerCase();
            if (filter === 'all') {
                row.style.display = '';
            } else if (filter === 'open' && text.includes('open')) {
                row.style.display = '';
            } else if (filter === 'merged' && text.includes('merged')) {
                row.style.display = '';
            } else if (filter === 'all') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
});

// ---- Sidebar Navigation ----
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// ---- Utility ----
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
