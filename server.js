const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

// Create uploads directory on Desktop
const desktopPath = path.join(os.homedir(), 'Desktop', 'website', 'uploads');
if (!fs.existsSync(desktopPath)) {
    fs.mkdirSync(desktopPath, { recursive: true });
    console.log(`📁 Created uploads directory: ${desktopPath}`);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, desktopPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static(desktopPath));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload route
app.post('/upload', upload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const fileInfo = {
            success: true,
            message: 'File uploaded successfully!',
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: `/uploads/${req.file.filename}`,
            uploadDate: new Date().toISOString()
        };

        console.log(`✅ File uploaded: ${req.file.originalname} -> ${req.file.filename}`);
        res.json(fileInfo);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Upload failed: ' + error.message 
        });
    }
});

// Get all uploaded images
app.get('/api/images', (req, res) => {
    try {
        const files = fs.readdirSync(desktopPath);
        const imageFiles = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => {
                const filePath = path.join(desktopPath, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    path: `/uploads/${file}`,
                    size: stats.size,
                    uploadDate: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        res.json({ success: true, images: imageFiles });
    } catch (error) {
        console.error('Error reading images:', error);
        res.status(500).json({ success: false, message: 'Failed to load images' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    res.status(500).json({
        success: false,
        message: error.message || 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📸 Images will be saved to: ${desktopPath}`);
});
