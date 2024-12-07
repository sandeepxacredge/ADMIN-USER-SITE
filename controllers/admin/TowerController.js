const Tower = require('../../models/admin/TowerModel');
const { db } = require('../../config/firebase');

exports.createTower = async (req, res) => {
  try {
    const towerData = req.body;

    const errors = Tower.validate(towerData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    towerData.createdBy = req.user.email;
    towerData.createdOn = new Date();
    towerData.updatedBy = null;
    towerData.updatedOn = null;

    const tower = new Tower(towerData);
    const docRef = await db.collection(Tower.collectionName).add(tower.toFirestore());

    res.status(201).json({ id: docRef.id, ...tower });
  } catch (error) {
    console.error('Error in Create Tower:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTowers = async (req, res) => {
  try {
    const snapshot = await db.collection(Tower.collectionName).get();
    const towers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(towers);
  } catch (error) {
    console.error('Error in Get All Towers:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTowerById = async (req, res) => {
  try {
    const docRef = await db.collection(Tower.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Tower not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    console.error('Error in Get Tower By ID:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTower = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const errors = Tower.validate(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const towerDoc = await db.collection(Tower.collectionName).doc(id).get();
    if (!towerDoc.exists) {
      return res.status(404).json({ message: 'Tower not found' });
    }

    const existingData = towerDoc.data();
    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    const tower = new Tower(updatedData);
    await db.collection(Tower.collectionName).doc(id).update(tower.toFirestore());

    res.status(200).json({ message: 'Tower updated successfully' });
  } catch (error) {
    console.error('Error in Update Tower:', error);
    res.status(500).json({ error: error.message });
  }
};
