import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required for collection'],
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a collection name'],
        trim: true,
        maxlength: [60, 'Collection name cannot exceed 60 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [250, 'Description cannot exceed 250 characters'],
        default: '',
    },
    color: {
        type: String,
        trim: true,
        default: '#6366f1', // Default Indigo accent
    },
    icon: {
        type: String,
        trim: true,
        default: 'folder',
    },
}, {
    timestamps: true,
});

// Index collection by user and name
collectionSchema.index({ userId: 1, name: 1 });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
