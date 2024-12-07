const Project = require('../../models/admin/ProjectModel');
const { db } = require('../../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../../utils/admin/FilesUpload');

exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const files = req.files;

    const docRef = await db.collection(Project.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    if (files.images && Array.isArray(files.images)) {
      try {
        projectData.images = await uploadMultipleFiles(files.images, 'images', docRef.id);
      } catch (error) {
        console.error('Error uploading images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading images. ' + error.message });
      }
    }

    if (files.videos && Array.isArray(files.videos)) {
      try {
        projectData.videos = await uploadMultipleFiles(files.videos, 'videos', docRef.id);
      } catch (error) {
        console.error('Error uploading videos:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading videos. ' + error.message });
      }
    }

    if (files.brochureUrl) {
      try {
        const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl', docRef.id);
        projectData.brochureUrl = brochureUrl;
      } catch (error) {
        console.error('Error uploading brochure:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading brochure. ' + error.message });
      }
    }

    if (files.reraCertificateUrl) {
      try {
        const [reraCertificateUrl] = await uploadMultipleFiles(files.reraCertificateUrl, 'reraCertificateUrl', docRef.id);
        projectData.reraCertificateUrl = reraCertificateUrl;
      } catch (error) {
        console.error('Error uploading reraCertificate:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading reraCertificate. ' + error.message });
      }
    }

    const errors = Project.validate(projectData);
    if (errors.length > 0) {
      await deleteMultipleFiles(projectData.images);
      await deleteMultipleFiles(projectData.videos);
      if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    projectData.createdBy = req.user.email;
    projectData.createdOn = new Date();

    const project = new Project(projectData);
    await docRef.update(project.toFirestore());

    res.status(201).json({ id: docRef.id, ...project.toFirestore() });
  } catch (error) {
    console.error('Error in Create Project:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const snapshot = await db.collection(Project.collectionName).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const docRef = await db.collection(Project.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };
    const files = req.files || {};

    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const existingData = projectDoc.data();

    updatedData.images = Array.isArray(updatedData.images) ? updatedData.images : [];
    updatedData.videos = Array.isArray(updatedData.videos) ? updatedData.videos : [];

    let filesToDelete = {
      images: [],
      videos: [],
      brochure: existingData.brochureUrl || null,
      reraCertificateUrl : existingData.reraCertificateUrl || null,
    };

    try {
      if (files.images) {
        if (updatedData.deleteImages) {
          const deleteImages = Array.isArray(updatedData.deleteImages)
            ? updatedData.deleteImages
            : JSON.parse(updatedData.deleteImages);
          filesToDelete.images = [...filesToDelete.images, ...deleteImages];
          updatedData.images = (existingData.images || []).filter(
            url => !deleteImages.includes(url)
          );
        } else {
          updatedData.images = Array.isArray(existingData.images) ? existingData.images : [];
        }

        const newImages = await uploadMultipleFiles(
          Array.isArray(files.images) ? files.images : [files.images],
          'images',
          id
        );
        updatedData.images = [...updatedData.images, ...newImages];
      } else {
        updatedData.images = Array.isArray(existingData.images) ? existingData.images : [];
      }

      if (files.videos) {
        if (updatedData.deleteVideos) {
          const deleteVideos = Array.isArray(updatedData.deleteVideos)
            ? updatedData.deleteVideos
            : JSON.parse(updatedData.deleteVideos);
          filesToDelete.videos = [...filesToDelete.videos, ...deleteVideos];
          updatedData.videos = (existingData.videos || []).filter(
            url => !deleteVideos.includes(url)
          );
        } else {
          updatedData.videos = Array.isArray(existingData.videos) ? existingData.videos : [];
        }

        const newVideos = await uploadMultipleFiles(
          Array.isArray(files.videos) ? files.videos : [files.videos],
          'videos',
          id
        );
        updatedData.videos = [...updatedData.videos, ...newVideos];
      } else {
        updatedData.videos = Array.isArray(existingData.videos) ? existingData.videos : [];
      }

      if (files.brochureUrl) {
        if (existingData.brochureUrl) {
          filesToDelete.brochure = existingData.brochureUrl;
        }
        const [brochureUrl] = await uploadMultipleFiles(
          Array.isArray(files.brochureUrl) ? files.brochureUrl : [files.brochureUrl],
          'brochureUrl',
          id
        );
        updatedData.brochureUrl = brochureUrl;
      } else {
        updatedData.brochureUrl = existingData.brochureUrl || null;
      }

    if (files.reraCertificateUrl) {
      if (existingData.reraCertificateUrl) {
        filesToDelete.reraCertificateUrl = existingData.reraCertificateUrl;
      }
      const [reraCertificateUrl] = await uploadMultipleFiles(
        Array.isArray(files.reraCertificateUrl) ? files.reraCertificateUrl : [files.reraCertificateUrl],
        'reraCertificateUrl',
        id
      );
      updatedData.reraCertificateUrl = reraCertificateUrl;
    } else {
      updatedData.reraCertificateUrl = existingData.reraCertificateUrl || null;
    }
    
    } catch (error) {
      console.error('Error handling files:', error);
      return res.status(400).json({ error: 'Error handling files. ' + error.message });
    }

    const mergedData = {
      ...existingData,
      ...updatedData,
      images: Array.isArray(updatedData.images) ? updatedData.images : (Array.isArray(existingData.images) ? existingData.images : []),
      videos: Array.isArray(updatedData.videos) ? updatedData.videos : (Array.isArray(existingData.videos) ? existingData.videos : [])
    };

    const errors = Project.validate(mergedData);
    if (errors.length > 0) {
      await cleanupFiles(filesToDelete);
      return res.status(400).json({ errors });
    }

    if (!req.user?.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const finalData = {
      ...mergedData,
      createdBy: existingData.createdBy,
      createdOn: existingData.createdOn,
      updatedBy: req.user.email,
      updatedOn: new Date(),
    };

    const project = new Project(finalData);
    await db.collection(Project.collectionName).doc(id).update(project.toFirestore());

    await cleanupFiles(filesToDelete);

    res.status(200).json({
      message: 'Project updated successfully',
      data: project.toFirestore()
    });
  } catch (error) {
    console.error('Error in Update Project:', error);
    res.status(500).json({ 
      error: 'Failed to update project',
      details: error.message 
    });
  }
};

async function cleanupFiles(filesToDelete) {
  try {
    if (Array.isArray(filesToDelete.images) && filesToDelete.images.length > 0) {
      await deleteMultipleFiles(filesToDelete.images);
    }

    if (Array.isArray(filesToDelete.videos) && filesToDelete.videos.length > 0) {
      await deleteMultipleFiles(filesToDelete.videos);
    }

    if (filesToDelete.brochure) {
      await deleteFromFirebase(filesToDelete.brochure);
    }

    if (filesToDelete.reraCertificateUrl) {
      await deleteFromFirebase(filesToDelete.reraCertificateUrl);
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
}