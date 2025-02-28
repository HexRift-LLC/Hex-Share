// Make functions globally available first
window.downloadFile = async (fileId) => {
    try {
        notifications.show('Download Started', 'Your file download will begin shortly', 'info');
        window.location.href = `/files/download/${fileId}`;
    } catch (err) {
        notifications.show('Download Failed', 'Unable to download file', 'error');
    }
};

window.shareFile = async (fileId) => {
    try {
        const response = await fetch(`/files/share/${fileId}`, {
            method: 'POST'
        });

        const result = await response.json();
        if (result.success) {
            const input = document.createElement('input');
            input.value = result.shareLink;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            
            notifications.show('Link Copied', 'Share link has been copied to clipboard', 'success');
        }
    } catch (err) {
        notifications.show('Share Failed', 'Unable to generate share link', 'error');
    }
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

// DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-input');
    const sortSelect = document.querySelector('.select-styled');
    const fileGrid = document.querySelector('.files-grid');

    if (searchInput) {
        searchInput.addEventListener('input', filterFiles);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    function filterFiles() {
        const searchTerm = searchInput.value.toLowerCase();
        const fileCards = document.querySelectorAll('.file-card');

        fileCards.forEach(card => {
            const fileName = card.querySelector('.file-info h4').textContent.toLowerCase();
            card.style.display = fileName.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    function handleSort(e) {
        const fileCards = Array.from(document.querySelectorAll('.file-card'));
        const sortBy = e.target.value;

        fileCards.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = a.querySelector('.file-info h4').textContent;
                const nameB = b.querySelector('.file-info h4').textContent;
                return nameA.localeCompare(nameB);
            } else if (sortBy === 'size') {
                const sizeA = parseInt(a.dataset.size);
                const sizeB = parseInt(b.dataset.size);
                return sizeB - sizeA;
            } else {
                const dateA = new Date(a.dataset.date);
                const dateB = new Date(b.dataset.date);
                return dateB - dateA;
            }
        });

        fileGrid.innerHTML = '';
        fileCards.forEach(card => fileGrid.appendChild(card));
    }
});
