const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors()); // Allows requests from the frontend
app.use(express.json()); // Parses incoming JSON requests

// --- MongoDB Configuration ---
// IMPORTANT: Replace this with your own MongoDB connection string
const mongoURI = 'mongodb://localhost:27017'; 
const dbName = 'attendanceSystem';
const collectionName = 'subjects';

let db;
let subjectsCollection;

// --- Connect to MongoDB ---
MongoClient.connect(mongoURI, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB Database');
        db = client.db(dbName);
        subjectsCollection = db.collection(collectionName);
    })
    .catch(error => console.error('Failed to connect to MongoDB:', error));


// --- API Routes ---

// GET /subjects - Fetch all subjects
app.get('/subjects', async (req, res) => {
    if (!subjectsCollection) {
        return res.status(500).json({ message: 'Database not initialized' });
    }
    try {
        const subjects = await subjectsCollection.find().toArray();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects', error });
    }
});

// POST /subjects - Add a new subject
app.post('/subjects', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Subject name is required' });
    }

    try {
        const newSubject = {
            name: name,
            attended: 0,
            absent: 0,
        };
        const result = await subjectsCollection.insertOne(newSubject);
        res.status(201).json(result.ops[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error adding subject', error });
    }
});

// POST /subjects/:id/present - Mark as present
app.post('/subjects/:id/present', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await subjectsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { attended: 1 } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Marked as present' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating attendance', error });
    }
});

// POST /subjects/:id/absent - Mark as absent
app.post('/subjects/:id/absent', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await subjectsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { absent: 1 } }
        );
         if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Marked as absent' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating attendance', error });
    }
});

// DELETE /subjects/:id - Delete a subject
app.delete('/subjects/:id', async (req, res) => {
    const { id } = req.params;
     try {
        const result = await subjectsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subject', error });
    }
});


// --- Start the server ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
