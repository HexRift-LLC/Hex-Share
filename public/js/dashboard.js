document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        await handleFiles(files);
    });

    fileInput.addEventListener('change', async (e) => {
        await handleFiles(e.target.files);
    });

    async function handleFiles(files) {
        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        try {
            notifications.show('Upload Started', 'Processing your files...', 'info');
            
            const response = await fetch('/dashboard/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                notifications.show('Upload Complete', 'Files have been successfully uploaded', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                notifications.show('Upload Failed', result.error || 'Unable to upload files', 'error');
            }
        } catch (err) {
            notifications.show('Error', 'Failed to upload files', 'error');
        }
    }
});
