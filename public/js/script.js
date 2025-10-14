// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mainContent = document.getElementById('main-content');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const header = document.getElementById('header');
const backToTop = document.getElementById('back-to-top');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const loadingSpinner = document.getElementById('loading-spinner');

// Upload Form Elements
const uploadForm = document.getElementById('upload-form');
const photoInput = document.getElementById('photo-input');
const fileUploadArea = document.getElementById('file-upload-area');
const previewContainer = document.getElementById('preview-container');
const uploadBtn = document.getElementById('upload-btn');
const descriptionInput = document.getElementById('description');

// Gallery Elements
const galleryGrid = document.getElementById('gallery-grid');
const refreshGallery = document.getElementById('refresh-gallery');
const recentPhotosPreview = document.getElementById('recent-photos-preview');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDate = document.getElementById('lightbox-date');
const lightboxClose = document.querySelector('.lightbox-close');

// State
let selectedFiles = [];
let isUploading = false;
let allImages = [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadGallery();
    handleStickyHeader();
    handleBackToTop();
    initializeSidebarExpandables();
});

// Event Listeners
function initializeEventListeners() {
    // Sidebar Controls
    mobileMenuToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // File Upload
    fileUploadArea.addEventListener('click', () => photoInput.click());
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('drop', handleDrop);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    photoInput.addEventListener('change', handleFileSelect);
    uploadForm.addEventListener('submit', handleUpload);
    
    // Gallery
    refreshGallery.addEventListener('click', loadGallery);
    
    // Lightbox
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    // Back to Top
    backToTop.addEventListener('click', scrollToTop);
    
    // Sidebar Links
    document.querySelectorAll('.sidebar-link:not(.expandable)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveLink(link);
            
            const target = link.getAttribute('href').substring(1);
            if (target === 'dashboard' || target === 'my-photos') {
                document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
            }
            
            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    
    // Sidebar Sublinks
    document.querySelectorAll('.sidebar-sublink').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
            
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
     // === ADD THIS NEW LOGIC AT THE END OF THE FUNCTION ===
    // Check window size on page load to open sidebar on desktop
    if (window.innerWidth > 768) {
        toggleSidebar(); // Open the sidebar by default on desktop
    }
}

// Sidebar Functions
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    mainContent.classList.toggle('sidebar-open');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    mainContent.classList.remove('sidebar-open');
}

function setActiveLink(activeLink) {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Initialize Sidebar Expandable Items
function initializeSidebarExpandables() {
    document.querySelectorAll('.sidebar-link.expandable').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const submenuId = link.getAttribute('data-toggle');
            const submenu = document.getElementById(submenuId);
            const isExpanded = link.classList.contains('expanded');
            
            // Close all other expandables
            document.querySelectorAll('.sidebar-link.expandable').forEach(otherLink => {
                if (otherLink !== link) {
                    otherLink.classList.remove('expanded');
                    const otherSubmenuId = otherLink.getAttribute('data-toggle');
                    const otherSubmenu = document.getElementById(otherSubmenuId);
                    if (otherSubmenu) {
                        otherSubmenu.classList.remove('show');
                    }
                }
            });
            
            // Toggle current expandable
            if (isExpanded) {
                link.classList.remove('expanded');
                submenu.classList.remove('show');
            } else {
                link.classList.add('expanded');
                submenu.classList.add('show');
            }
        });
    });
}

// Sticky Header
function handleStickyHeader() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
    });
}

// Back to Top
function handleBackToTop() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// File Upload Functions
function handleDragOver(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showToast('Please select only image files!', 'error');
        return;
    }
    
    selectedFiles = [...selectedFiles, ...imageFiles];
    updatePreview();
}

function updatePreview() {
    previewContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="preview-remove" onclick="removeFile(${index})">&times;</button>
            `;
            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updatePreview();
}

async function handleUpload(e) {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        showToast('Please select at least one image!', 'error');
        return;
    }
    
    if (isUploading) return;
    
    isUploading = true;
    showLoading(true);
    updateUploadButton('Uploading...', true);
    
    try {
        const uploadPromises = selectedFiles.map(file => uploadSingleFile(file));
        const results = await Promise.all(uploadPromises);
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        
        if (successCount > 0) {
            showToast(`Successfully uploaded ${successCount} photo(s)!`, 'success');
            selectedFiles = [];
            updatePreview();
            descriptionInput.value = '';
            await loadGallery(); // Refresh gallery and recent photos
        }
        
        if (failCount > 0) {
            showToast(`Failed to upload ${failCount} photo(s)`, 'error');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed! Please try again.', 'error');
    } finally {
        isUploading = false;
        showLoading(false);
        updateUploadButton('Upload Photos', false);
    }
}

async function uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('description', descriptionInput.value);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Single file upload error:', error);
        return { success: false, message: 'Network error' };
    }
}

function updateUploadButton(text, disabled) {
    uploadBtn.textContent = text;
    uploadBtn.disabled = disabled;
}

// Gallery Functions
async function loadGallery() {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        
        if (data.success) {
            allImages = data.images;
            renderGallery(allImages);
            updateRecentPhotosPreview(allImages.slice(0, 6));
        } else {
            showToast('Failed to load gallery', 'error');
        }
    } catch (error) {
        console.error('Gallery load error:', error);
        showToast('Failed to load gallery', 'error');
    }
}

function renderGallery(images) {
    galleryGrid.innerHTML = '';
    
    if (images.length === 0) {
        galleryGrid.innerHTML = `
            <div class="no-images">
                <i class="fas fa-image"></i>
                <p>No images yet. Upload one to begin! 📸</p>
            </div>
        `;
        return;
    }
    
    images.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="${image.path}" alt="${image.filename}" loading="lazy">
            <div class="gallery-item-info">
                <h4>${image.filename}</h4>
                <p>Uploaded: ${formatDate(image.uploadDate)}</p>
                <p>Size: ${formatFileSize(image.size)}</p>
            </div>
        `;
        
        galleryItem.addEventListener('click', () => {
            openLightbox(image);
        });
        
        galleryGrid.appendChild(galleryItem);
    });
}

// Update Recent Photos Preview in Sidebar
function updateRecentPhotosPreview(recentImages) {
    if (recentImages.length === 0) {
        recentPhotosPreview.innerHTML = `
            <div class="recent-photo-placeholder">
                <i class="fas fa-image"></i>
            </div>
        `;
        return;
    }
    
    recentPhotosPreview.innerHTML = '';
    recentImages.forEach((image, index) => {
        if (index < 6) { // Show max 6 recent photos
            const photoItem = document.createElement('div');
            photoItem.className = 'recent-photo-item';
            photoItem.innerHTML = `<img src="${image.path}" alt="${image.filename}">`;
            
            photoItem.addEventListener('click', () => {
                openLightbox(image);
            });
            
            recentPhotosPreview.appendChild(photoItem);
        }
    });
}

// Lightbox Functions
function openLightbox(image) {
    lightboxImage.src = image.path;
    lightboxTitle.textContent = image.filename;
    lightboxDate.textContent = `Uploaded: ${formatDate(image.uploadDate)}`;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Utility Functions
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close lightbox or sidebar
    if (e.key === 'Escape') {
        if (lightbox.style.display === 'flex') {
            closeLightbox();
        } else if (sidebar.classList.contains('active')) {
            closeSidebar();
        }
    }
    
    // Ctrl+U to focus upload
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
        photoInput.click();
    }
    
    // Ctrl+B to toggle sidebar
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
    }
});

// Window resize handler
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});
