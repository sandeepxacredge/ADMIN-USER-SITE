const Series = require('../../models/admin/SeriesModel');
const { db } = require('../../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../../utils/admin/FilesUpload');

exports.createSeries = async (req, res) => {
  try {
    const seriesData = req.body;
    const files = req.files;

    const docRef = await db.collection(Series.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    if (files.insideImagesUrls && Array.isArray(files.insideImagesUrls)) {
      try {
        seriesData.insideImagesUrls = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', docRef.id);
      } catch (error) {
        console.error('Error uploading inside images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside images. ' + error.message });
      }
    }

    if (files.insideVideosUrls && Array.isArray(files.insideVideosUrls)) {
      try {
        seriesData.insideVideosUrls = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', docRef.id);
      } catch (error) {
        console.error('Error uploading inside videos:', error);
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside videos. ' + error.message });
      }
    }

    if (files.layoutPlanUrl) {
      try {
        const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', docRef.id);
        seriesData.layoutPlanUrl = layoutPlanUrl;
      } catch (error) {
        console.error('Error uploading layout plan:', error);
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading layout plan. ' + error.message });
      }
    }

    const errors = Series.validate(seriesData);
    if (errors.length > 0) {
      if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
      if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
      if (seriesData.layoutPlanUrl) await deleteFromFirebase(seriesData.layoutPlanUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    seriesData.createdBy = req.user.email;
    seriesData.createdOn = new Date();

    const series = new Series(seriesData);
    await docRef.update(series.toFirestore());

    res.status(201).json({ id: docRef.id, ...series.toFirestore() });
  } catch (error) {
    console.error('Error in Create Series:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSeries = async (req, res) => {
  try {
    const snapshot = await db.collection(Series.collectionName).get();
    const seriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSeriesById = async (req, res) => {
  try {
    const docRef = await db.collection(Series.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;

    const seriesDoc = await db.collection(Series.collectionName).doc(id).get();
    if (!seriesDoc.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    const existingData = seriesDoc.data();

    if (files) {
      if (files.insideImagesUrls) {
        if (req.body.deleteInsideImages) {
          try {
            const deleteImages = JSON.parse(req.body.deleteInsideImages);
            await deleteMultipleFiles(deleteImages);
            updatedData.insideImagesUrls = (existingData.insideImagesUrls || []).filter(url => !deleteImages.includes(url));
          } catch (error) {
            console.error('Error deleting inside images:', error);
            return res.status(400).json({ error: 'Error deleting inside images. ' + error.message });
          }
        }

        try {
          const newImages = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', id);
          updatedData.insideImagesUrls = [...(updatedData.insideImagesUrls || existingData.insideImagesUrls || []), ...newImages];
        } catch (error) {
          console.error('Error uploading new inside images:', error);
          return res.status(400).json({ error: 'Error uploading new inside images. ' + error.message });
        }
      }

      if (files.insideVideosUrls) {
        if (req.body.deleteInsideVideos) {
          try {
            const deleteVideos = JSON.parse(req.body.deleteInsideVideos);
            await deleteMultipleFiles(deleteVideos);
            updatedData.insideVideosUrls = (existingData.insideVideosUrls || []).filter(url => !deleteVideos.includes(url));
          } catch (error) {
            console.error('Error deleting inside videos:', error);
            return res.status(400).json({ error: 'Error deleting inside videos. ' + error.message });
          }
        }

        try {
          const newVideos = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', id);
          updatedData.insideVideosUrls = [...(updatedData.insideVideosUrls || existingData.insideVideosUrls || []), ...newVideos];
        } catch (error) {
          console.error('Error uploading new inside videos:', error);
          return res.status(400).json({ error: 'Error uploading new inside videos. ' + error.message });
        }
      }

      if (files.layoutPlanUrl) {
        try {
          if (existingData.layoutPlanUrl) {
            await deleteFromFirebase(existingData.layoutPlanUrl);
          }
          const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', id);
          updatedData.layoutPlanUrl = layoutPlanUrl;
        } catch (error) {
          console.error('Error handling layout plan:', error);
          return res.status(400).json({ error: 'Error handling layout plan. ' + error.message });
        }
      }
    }

    const errors = Series.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    await db.collection(Series.collectionName).doc(id).update(updatedData);
    res.status(200).json({ id, ...updatedData });
  } catch (error) {
    console.error('Error updating series:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
};
