window.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('preview');
  const uploadBtn = document.getElementById('uploadBtn');
  const status = document.getElementById('status');
  const description = document.getElementById('description');
  const refreshBtn = document.getElementById('refreshBtn');
  const gallery = document.getElementById('gallery');
  const scrollTopBtn = document.getElementById('scrollTop');

  let filesToUpload = [];

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
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  function handleFiles(fileList) {
    preview.innerHTML = '';
    filesToUpload = Array.from(fileList);
    filesToUpload.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    });
  }

  uploadBtn.addEventListener('click', async () => {
    if (filesToUpload.length === 0) {
      status.textContent = 'Please select one or more photos to upload.';
      return;
    }

    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append('photos', file);
    });
    formData.append('description', description.value);

    status.textContent = 'Uploading...';

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.text();
      status.textContent = data;
      filesToUpload = [];
      preview.innerHTML = '';
      description.value = '';
      loadGallery();
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
    }
  });

  refreshBtn.addEventListener('click', loadGallery);

  async function loadGallery() {
    try {
      const response = await fetch('/api/images');
      const result = await response.json();

      gallery.innerHTML = '';

      if (result.success && result.images.length > 0) {
        result.images.forEach(img => {
          const galleryItem = document.createElement('div');
          galleryItem.className = 'gallery-item';
          galleryItem.innerHTML = `
            <img src="${img.path}" alt="${img.description}">
            <div class="gallery-item-info">${img.description}</div>
          `;
          gallery.appendChild(galleryItem);
        });
      } else {
        gallery.innerHTML = '<p>Your gallery is empty. Upload some photos!</p>';
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
      gallery.innerHTML = '<p>Could not load the gallery. Please try again.</p>';
    }
  }

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      scrollTopBtn.style.display = 'flex';
    } else {
      scrollTopBtn.style.display = 'none';
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadGallery();
});
