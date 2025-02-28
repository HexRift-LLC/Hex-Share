document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    initializeCharts();
    
    // Handle search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput?.addEventListener('input', filterActivities);

    // Handle tab switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', switchTab);
    });

    // Handle user management
    setupUserManagement();

    // Handle file management
    setupFileManagement();
});

function initializeCharts() {
    // User growth chart
    const userCtx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(userCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'User Growth',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#7289da',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Storage usage chart
    const storageCtx = document.getElementById('storageChart').getContext('2d');
    new Chart(storageCtx, {
        type: 'doughnut',
        data: {
            labels: ['Used', 'Available'],
            datasets: [{
                data: [70, 30],
                backgroundColor: ['#7289da', '#36393f']
            }]
        }
    });
}

function filterActivities() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('.activity-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function switchTab(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    
    // Update active states
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    this.classList.add('active');
    
    // Show correct content
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = section.id === targetId ? 'block' : 'none';
    });
}

async function setupUserManagement() {
    const userTable = document.querySelector('#userTableBody');
    if (!userTable) return; // Exit if table doesn't exist yet
    
    const response = await fetch('/admin/users');
    const users = await response.json();
    users.forEach(user => {
        const row = createUserRow(user);
        userTable.appendChild(row);
    });
}

async function setupFileManagement() {
    const fileTable = document.querySelector('#fileTableBody');
    if (!fileTable) return; // Exit if table doesn't exist yet
    
    const response = await fetch('/admin/files');
    const files = await response.json();
    files.forEach(file => {
        const row = createFileRow(file);
        fileTable.appendChild(row);
    });
}
function createUserRow(user) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <div class="user-info">
                <img src="${user.avatar}" alt="" class="user-avatar">
                <span>${user.username}</span>
            </div>
        </td>
        <td><span class="badge badge-${user.tier}">${user.tier}</span></td>
        <td>${formatBytes(user.storageUsed)}</td>
        <td>${user.totalFiles}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
    `;
    return row;
}

function createFileRow(file) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <div class="file-info">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <span>${file.name}</span>
            </div>
        </td>
        <td>${file.owner.username}</td>
        <td>${formatBytes(file.size)}</td>
        <td>${new Date(file.uploadedAt).toLocaleDateString()}</td>
        <td><span class="badge badge-success">Active</span></td>
        <td>
            <div class="action-buttons">
                <button onclick="downloadFile('${file._id}')" class="action-btn">
                    <i class="fas fa-download"></i>
                </button>
                <button onclick="deleteFile('${file._id}')" class="action-btn danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function getFileIcon(type) {
    const icons = {
        'image': 'fa-image',
        'video': 'fa-video',
        'audio': 'fa-music',
        'application/pdf': 'fa-file-pdf',
        'text': 'fa-file-alt',
        'default': 'fa-file'
    };
    return icons[type] || icons.default;
}

// File Management Functions
window.downloadFile = async (fileId) => {
    notifications.show('Download Started', 'Your file download will begin shortly', 'info');
    window.location.href = `/files/download/${fileId}`;
};

window.deleteFile = async (fileId) => {

    try {
        const response = await fetch(`/files/${fileId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            notifications.show('File Deleted', 'File has been successfully removed', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            notifications.show('Delete Failed', result.error || 'Unable to delete file', 'error');
        }
    } catch (err) {
        notifications.show('Error', 'Failed to delete file', 'error');
    }
};

// Settings Management
async function saveSettings() {
    const settings = {
        storage: {
            free: Number(document.getElementById('freeTierStorage').value) * 1024 * 1024 * 1024,
            standard: Number(document.getElementById('standardTierStorage').value) * 1024 * 1024 * 1024,
            premium: Number(document.getElementById('premiumTierStorage').value) * 1024 * 1024 * 1024
        },
        files: {
            maxSize: Number(document.getElementById('maxFileSize').value) * 1024 * 1024,
            allowedTypes: document.getElementById('allowedTypes').value.split(',').map(type => type.trim())
        },
        security: {
            shareLinkExpiry: Number(document.getElementById('shareLinkExpiry').value),
            maxLoginAttempts: Number(document.getElementById('maxLoginAttempts').value)
        }
    };

    try {
        const response = await fetch('/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        const result = await response.json();
        if (result.success) {
            notifications.show('Settings Saved', 'System settings have been updated', 'success');
        } else {
            notifications.show('Save Failed', result.error || 'Unable to save settings', 'error');
        }
    } catch (err) {
        notifications.show('Error', 'Failed to save settings', 'error');
    }
}

// Load current settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/admin/settings');
        const settings = await response.json();
        
        // Populate form fields
        document.getElementById('freeTierStorage').value = Math.floor(settings.storage.free / (1024 * 1024 * 1024));
        document.getElementById('standardTierStorage').value = Math.floor(settings.storage.standard / (1024 * 1024 * 1024));
        document.getElementById('premiumTierStorage').value = Math.floor(settings.storage.premium / (1024 * 1024 * 1024));
        document.getElementById('maxFileSize').value = Math.floor(settings.files.maxSize / (1024 * 1024));
        document.getElementById('allowedTypes').value = settings.files.allowedTypes.join(', ');
        document.getElementById('shareLinkExpiry').value = settings.security.shareLinkExpiry;
        document.getElementById('maxLoginAttempts').value = settings.security.maxLoginAttempts;
    } catch (err) {
        notifications.show('Error', 'Failed to load settings', 'error');
    }
});
