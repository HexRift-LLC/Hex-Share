const notifications = {
    show(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type} glass-effect`;
        
        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon} notification-icon"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 3000);
    }
};
