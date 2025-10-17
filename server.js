const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const uploadsDir = './uploads';
const metadataPath = path.join(uploadsDir, 'metadata.json');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const safeFilename = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + safeFilename);
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// --- UPDATED: /upload route to use filename as fallback description ---
app.post('/upload', upload.array('photos', 12), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files were uploaded.' });
  }

  let metadata = {};
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath));
  }

  const uploadTime = new Date().toLocaleString();
  
  req.files.forEach(file => {
    // If a description is provided, use it. Otherwise, use the original filename.
    const userDescription = req.body.description ? req.body.description.trim() : file.originalname;

    // Always append the upload time
    const fullDescription = `${userDescription} - ${uploadTime}`;
    
    metadata[file.filename] = fullDescription;
  });

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  res.json({ success: true, message: `${req.files.length} file(s) uploaded successfully!` });
});

// --- ADDED: /gallery endpoint that gallery.js expects ---
app.get('/gallery', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Unable to scan directory.' });
    }

    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath));
    }

    const imageDetails = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        const description = metadata[file] || file.originalname || 'No description';
        
        return {
          filename: file,
          description: description,
          timestamp: stats.mtime,
          originalname: file // Fallback for original name
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(imageDetails);
  });
});

// The /api/images route remains as backup
app.get('/api/images', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Unable to scan directory.' });
    }

    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath));
    }

    const imageDetails = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          filename: file,
          path: `/uploads/${file}`,
          uploadDate: stats.mtime,
          description: metadata[file] || stats.mtime.toLocaleString()
        };
      })
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    res.json({ success: true, images: imageDetails });
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});