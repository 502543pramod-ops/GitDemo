window.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    const gallery = document.getElementById('gallery');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
  
    // Fetch and display gallery images
    async function fetchGallery() {
      try {
        gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading gallery...</div>';
        
        const response = await fetch('/gallery');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const images = await response.json();
        
        gallery.innerHTML = '';
        
        if (images.length === 0) {
          gallery.innerHTML = `
            <div class="empty-gallery">
              <span class="material-icons">photo_library</span>
              <h3>No photos yet</h3>
              <p>Upload some photos to get started!</p>
            </div>
          `;
          return;
        }
        
        images.forEach(image => {
          const item = document.createElement('div');
          item.className = 'gallery-item';
          item.innerHTML = `
            <img src="/uploads/${image.filename}" alt="${image.description || ''}" loading="lazy">
            <div class="gallery-item-info">
              <p class="description">${image.description || image.originalname}</p>
              <p class="timestamp">${new Date(image.timestamp).toLocaleString()}</p>
            </div>`;
          gallery.appendChild(item);
        });
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
        gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Failed to load gallery. Please try again.</div>';
      }
    }
  
    // Refresh and scroll-to-top button functionality
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('loading');
      refreshBtn.innerHTML = '<span class="material-icons">refresh</span> Loading...';
      
      fetchGallery().finally(() => {
        setTimeout(() => {
          refreshBtn.classList.remove('loading');
          refreshBtn.innerHTML = '<span class="material-icons">refresh</span> Refresh';
        }, 1000);
      });
    });
    
    window.onscroll = () => { 
      scrollTopBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none"; 
    };
    
    scrollTopBtn.addEventListener('click', () => { 
      document.documentElement.scrollTop = 0; 
    });
  
    // Initial gallery load
    fetchGallery();
});