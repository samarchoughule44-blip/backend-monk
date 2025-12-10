const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { upload, compressImage } = require('../middleware/imageCompression');

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create project with image compression
router.post('/', upload.single('image'), compressImage, async (req, res) => {
  try {
    const { title, projectName, category, style, layout, location, pricing, bhk, scope, propertyType, size, priceMin, priceMax, status } = req.body;

    if (!req.fileInfo) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const project = new Project({
      title,
      projectName,
      category,
      style,
      layout,
      location,
      pricing,
      bhk,
      scope,
      propertyType,
      size,
      status: status || 'delivered',
      priceMin: Number(priceMin),
      priceMax: Number(priceMax),
      imageUrl: req.fileInfo.path,
      originalSize: req.fileInfo.originalSize,
      compressedSize: req.fileInfo.compressedSize
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update project
router.put('/:id', upload.single('image'), async (req, res) => {
  console.log('PUT route hit for ID:', req.params.id);
  console.log('Has file:', !!req.file);
  
  try {
    const { title, projectName, category, style, layout, location, pricing, bhk, scope, propertyType, size, priceMin, priceMax, status } = req.body;
    
    const updateData = {
      title,
      projectName,
      category,
      style,
      layout,
      location,
      pricing,
      bhk,
      scope,
      propertyType,
      size,
      status: status || 'delivered',
      priceMin: Number(priceMin),
      priceMax: Number(priceMax)
    };

    // Handle new image upload with compression
    if (req.file) {
      try {
        const sharp = require('sharp');
        const path = require('path');
        const fs = require('fs');
        
        const originalSize = req.file.buffer.length;
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const filepath = path.join(__dirname, '../uploads', filename);

        // Compress image
        await sharp(req.file.buffer)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toFile(filepath);

        const stats = fs.statSync(filepath);
        const compressedSize = stats.size;

        updateData.imageUrl = `/uploads/${filename}`;
        updateData.originalSize = originalSize;
        updateData.compressedSize = compressedSize;
        
        console.log(`Image compressed: ${(originalSize/1024/1024).toFixed(2)}MB → ${(compressedSize/1024).toFixed(2)}KB`);
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        return res.status(500).json({ error: 'Image compression failed' });
      }
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log('Project updated successfully');
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug: Log when this module is loaded
console.log('Projects routes loaded');

module.exports = router;