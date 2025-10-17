window.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');
    const description = document.getElementById('description');
  
    let filesToUpload = [];
  
    // Event listeners for drag & drop and click
    dropzone.addEventListener('dragover', (e) => { 
      e.preventDefault(); 
      dropzone.classList.add('dragover'); 
    });
    
    dropzone.addEventListener('dragleave', () => { 
      dropzone.classList.remove('dragover'); 
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
  
    function handleFiles(files) {
      for (const file of files) {
        if (!filesToUpload.some(f => f.name === file.name && f.size === file.size)) {
          filesToUpload.push(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
              <img src="${e.target.result}" alt="${file.name}">
              <button class="remove-btn" type="button">&times;</button>
            `;
            previewItem.querySelector('.remove-btn').onclick = () => {
              filesToUpload = filesToUpload.filter(f => f.name !== file.name || f.size !== file.size);
              preview.removeChild(previewItem);
            };
            preview.appendChild(previewItem);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  
    // Upload files to the server
    uploadBtn.addEventListener('click', async () => {
      if (filesToUpload.length === 0) {
        status.textContent = 'Please select files to upload.';
        status.className = 'error';
        return;
      }
      
      const formData = new FormData();
      filesToUpload.forEach(file => formData.append('photos', file));
      formData.append('description', description.value);
  
      status.textContent = 'Uploading... Please wait.';
      status.className = '';
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';
      
      try {
        const response = await fetch('/upload', { 
          method: 'POST', 
          body: formData 
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'An unknown error occurred.');
        }

        status.textContent = result.message + ' Photos are now in your gallery!';
        status.className = 'success';
        filesToUpload = [];
        preview.innerHTML = '';
        description.value = '';
        
        // Refresh recent gallery after upload to show new photos
        loadRecentGallery();
        
        // REMOVED: Auto-redirect to gallery
        // User stays on home page to see the success message and updated gallery

      } catch (error) {
        status.textContent = 'Upload failed: ' + error.message;
        status.className = 'error';
        console.error('Client-side upload error:', error);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Photos';
      }
    });

    // Load recent gallery on home page
    async function loadRecentGallery() {
      const recentGallery = document.getElementById('recent-gallery');
      if (!recentGallery) return;
      
      try {
        const response = await fetch('/gallery');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const images = await response.json();
        
        recentGallery.innerHTML = '';
        
        if (images.length === 0) {
          recentGallery.innerHTML = `
            <div class="recent-empty-gallery">
              <span class="material-icons">photo_library</span>
              <h3>No photos yet</h3>
              <p>Upload your first photo to get started!</p>
              <button class="upload-now-btn" onclick="document.getElementById('dropzone').click()">Upload Now</button>
            </div>
          `;
          return;
        }
        
        // Show only the 6 most recent photos
        const recentImages = images.slice(0, 6);
        
        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'recent-gallery-grid';
        
        recentImages.forEach(image => {
          const item = document.createElement('div');
          item.className = 'recent-gallery-item';
          item.onclick = () => window.location.href = 'gallery.html';
          item.innerHTML = `
            <img src="/uploads/${image.filename}" alt="${image.description || ''}" loading="lazy">
            <div class="recent-gallery-item-info">
              <p class="description">${image.description || image.originalname}</p>
              <p class="timestamp">${new Date(image.timestamp).toLocaleDateString()}</p>
            </div>`;
          galleryGrid.appendChild(item);
        });
        
        recentGallery.appendChild(galleryGrid);
        
      } catch (error) {
        console.error('Failed to load recent gallery:', error);
        recentGallery.innerHTML = `
          <div class="recent-empty-gallery">
            <span class="material-icons">error</span>
            <h3>Failed to load photos</h3>
            <p>Please try refreshing the page.</p>
            <button class="upload-now-btn" onclick="loadRecentGallery()">Try Again</button>
          </div>
        `;
      }
    }

    // Scroll to top button functionality
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    window.onscroll = () => { 
      scrollTopBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none"; 
    };
    
    scrollTopBtn.addEventListener('click', () => { 
      document.documentElement.scrollTop = 0; 
    });
  
    // Load recent gallery when page loads
    loadRecentGallery();
});