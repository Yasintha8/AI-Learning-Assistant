import mongoose from 'mongoose';
import Collection from '../models/Collection.js';
import Document from '../models/Document.js';

// @desc Get all collections with document counts
// @route GET /api/collections
// @access Private
export const getCollections = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        // Fetch user's collections
        const collections = await Collection.find({ userId: req.user._id }).sort({ createdAt: -1 });

        // Aggregate document counts per collection
        const docCounts = await Document.aggregate([
            {
                $match: {
                    userId,
                    collectionId: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$collectionId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap = {};
        docCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        // Count uncategorized documents
        const uncategorizedCount = await Document.countDocuments({
            userId: req.user._id,
            $or: [
                { collectionId: null },
                { collectionId: { $exists: false } }
            ]
        });

        const collectionsWithCounts = collections.map(col => {
            const colObj = col.toObject();
            colObj.documentCount = countMap[col._id.toString()] || 0;
            return colObj;
        });

        res.status(200).json({
            success: true,
            data: collectionsWithCounts,
            uncategorizedCount,
            totalCollections: collections.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc Create a new collection
// @route POST /api/collections
// @access Private
export const createCollection = async (req, res, next) => {
    try {
        const { name, description, color, icon } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Collection name is required',
                statusCode: 400
            });
        }

        const trimmedName = name.trim();

        // Check if collection with same name exists for this user
        const existing = await Collection.findOne({
            userId: req.user._id,
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'A collection with this name already exists',
                statusCode: 400
            });
        }

        const collection = await Collection.create({
            userId: req.user._id,
            name: trimmedName,
            description: (description || '').trim(),
            color: color || '#6366f1',
            icon: icon || 'folder'
        });

        const result = collection.toObject();
        result.documentCount = 0;

        res.status(201).json({
            success: true,
            data: result,
            message: 'Collection created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update collection details
// @route PUT /api/collections/:id
// @access Private
export const updateCollection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon } = req.body;

        const collection = await Collection.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found',
                statusCode: 404
            });
        }

        if (name && name.trim()) {
            const trimmedName = name.trim();
            // Check uniqueness if name changed
            if (trimmedName.toLowerCase() !== collection.name.toLowerCase()) {
                const existing = await Collection.findOne({
                    userId: req.user._id,
                    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
                    _id: { $ne: collection._id }
                });

                if (existing) {
                    return res.status(400).json({
                        success: false,
                        error: 'A collection with this name already exists',
                        statusCode: 400
                    });
                }
            }
            collection.name = trimmedName;
        }

        if (description !== undefined) {
            collection.description = (description || '').trim();
        }

        if (color) {
            collection.color = color;
        }

        if (icon) {
            collection.icon = icon;
        }

        await collection.save();

        const count = await Document.countDocuments({
            userId: req.user._id,
            collectionId: collection._id
        });

        const result = collection.toObject();
        result.documentCount = count;

        res.status(200).json({
            success: true,
            data: result,
            message: 'Collection updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc Delete collection
// @route DELETE /api/collections/:id
// @access Private
export const deleteCollection = async (req, res, next) => {
    try {
        const { id } = req.params;

        const collection = await Collection.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found',
                statusCode: 404
            });
        }

        // Safely detach documents from this collection so they remain accessible under Uncategorized
        await Document.updateMany(
            { userId: req.user._id, collectionId: collection._id },
            { $set: { collectionId: null } }
        );

        await collection.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Collection deleted successfully. Documents were safely moved to Uncategorized.'
        });
    } catch (error) {
        next(error);
    }
};
