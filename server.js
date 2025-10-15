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
    return res.status(400).send('No files were uploaded.');
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

  res.send(`${req.files.length} file(s) uploaded successfully!`);
});

// The /api/images route remains the same as it correctly reads from metadata.json
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
