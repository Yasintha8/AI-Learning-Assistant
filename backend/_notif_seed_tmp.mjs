import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Document from './models/Document.js';
import Flashcard from './models/Flashcard.js';
import Notification from './models/Notification.js';

await mongoose.connect(process.env.MONGODB_URI);

const email = 'notif-test@example.com';
const password = 'TestPass123!';

let user = await User.findOne({ email });
if (!user) {
    user = await User.create({ username: 'notiftester', email, password });
    console.log('Created user');
} else {
    console.log('Reusing existing user');
}

await Document.deleteMany({ userId: user._id });
await Flashcard.deleteMany({ userId: user._id });
await Notification.deleteMany({ userId: user._id });

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(10, 0, 0, 0);

await Document.create({
    userId: user._id,
    title: 'Notif Test Doc',
    fileName: 'notif-test.txt',
    filePath: 'http://localhost:8000/uploads/documents/fake.txt',
    fileType: 'pdf',
    extractedText: 'Some content.',
    chunks: [{ content: 'Some content.', chunkIndex: 0, pageNumber: 0 }],
    status: 'ready',
    lastAccessed: yesterday,
});

const staleDate = new Date();
staleDate.setDate(staleDate.getDate() - 5);

await Flashcard.create({
    userId: user._id,
    documentId: new mongoose.Types.ObjectId(),
    cards: [
        { question: 'Q1', answer: 'A1', reviewCount: 2, lastReviewed: staleDate },
        { question: 'Q2', answer: 'A2', reviewCount: 0, lastReviewed: null },
    ],
});

console.log(JSON.stringify({ email, password }));
await mongoose.disconnect();