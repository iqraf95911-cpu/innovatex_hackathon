// ===== DevIntel AI — Dashboard Scripts =====

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initNavigation();
});

// ---- Chart.js Initialization ----
function initCharts() {
    const velocityCanvas = document.getElementById('velocityChart');
    const teamCanvas = document.getElementById('teamChart');

    if (!velocityCanvas || !teamCanvas) return;

    // Global Chart.js defaults
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1a1a1a';
    Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '600' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = false;

    // Sprint Velocity — Line Chart
    new Chart(velocityCanvas, {
        type: 'line',
        data: {
            labels: ['Sprint 18', 'Sprint 19', 'Sprint 20', 'Sprint 21', 'Sprint 22', 'Sprint 23'],
            datasets: [
                {
                    label: 'Story Points',
                    data: [42, 38, 52, 48, 55, 61],
                    borderColor: '#18181b',
                    backgroundColor: 'rgba(24, 24, 27, 0.04)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#18181b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: 'Planned',
                    data: [45, 45, 50, 50, 50, 55],
                    borderColor: '#e8e5e0',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0.3,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { padding: 8 }
                },
                y: {
                    beginAtZero: false,
                    min: 30,
                    max: 70,
                    grid: {
                        color: '#f0eeea',
                        drawBorder: false,
                    },
                    border: { display: false },
                    ticks: {
                        padding: 12,
                        stepSize: 10
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} pts`
                    }
                }
            }
        }
    });

    // Team Contribution — Horizontal Bar Chart
    new Chart(teamCanvas, {
        type: 'bar',
        data: {
            labels: ['Arjun M.', 'Priya S.', 'Dev K.', 'Sara L.', 'Raj P.'],
            datasets: [{
                label: 'Commits',
                data: [87, 72, 65, 58, 43],
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
                    grid: {
                        color: '#f0eeea',
                        drawBorder: false,
                    },
                    border: { display: false },
                    ticks: { padding: 8 }
                },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        padding: 8,
                        font: { weight: '500' }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.parsed.x} commits this sprint`
                    }
                }
            }
        }
    });
}

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
