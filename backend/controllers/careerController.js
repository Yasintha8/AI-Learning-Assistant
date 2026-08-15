import UserCareerProfile from '../models/UserCareerProfile.js';
import CareerPath from '../models/CareerPath.js';
import { generateCareerRoadmap, chatWithCareerCounselor } from '../utils/geminiService.js';

// Helper to convert title to slug ID
const slugify = (title) => {
    return (title || 'item')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
};

// Calculate job readiness score based on milestone and topic completion
const calculateReadinessScore = (milestones = []) => {
    if (!milestones || milestones.length === 0) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    milestones.forEach(m => {
        // Milestone status contribution (weight = 2)
        totalPoints += 2;
        if (m.status === 'completed') earnedPoints += 2;
        else if (m.status === 'in-progress') earnedPoints += 1;

        // Topics contribution (weight = 1 per topic)
        (m.topics || []).forEach(t => {
            totalPoints += 1;
            if (t.isCompleted) earnedPoints += 1;
        });
    });

    if (totalPoints === 0) return 0;
    return Math.round((earnedPoints / totalPoints) * 100);
};

// @desc    Create or update user career profile & generate career roadmap
// @route   POST /api/career/profile
// @access  Private
export const saveProfileAndGenerateRoadmap = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const {
            currentRole,
            educationLevel,
            currentSkills,
            targetRole,
            timelineMonths,
            weeklyHours,
            preferredLearningStyle
        } = req.body;

        if (!currentRole || !targetRole) {
            return res.status(400).json({
                success: false,
                error: 'Please provide both your current role/background and your target career goal.',
                statusCode: 400
            });
        }

        // Upsert UserCareerProfile
        let profile = await UserCareerProfile.findOne({ userId });
        if (profile) {
            profile.currentRole = currentRole;
            profile.educationLevel = educationLevel || profile.educationLevel;
            profile.currentSkills = Array.isArray(currentSkills) ? currentSkills : profile.currentSkills;
            profile.targetRole = targetRole;
            profile.timelineMonths = timelineMonths || profile.timelineMonths;
            profile.weeklyHours = weeklyHours || profile.weeklyHours;
            profile.preferredLearningStyle = preferredLearningStyle || profile.preferredLearningStyle;
            await profile.save();
        } else {
            profile = await UserCareerProfile.create({
                userId,
                currentRole,
                educationLevel: educationLevel || 'Other',
                currentSkills: Array.isArray(currentSkills) ? currentSkills : [],
                targetRole,
                timelineMonths: timelineMonths || 6,
                weeklyHours: weeklyHours || 10,
                preferredLearningStyle: preferredLearningStyle || 'hands-on'
            });
        }

        // Call Gemini API to generate structured career roadmap
        const roadmapData = await generateCareerRoadmap(profile);

        // Format milestones with unique IDs
        const formattedMilestones = (roadmapData.milestones || []).map((m, idx) => ({
            milestoneId: `${slugify(m.title)}-${idx + 1}`,
            title: m.title,
            description: m.description || '',
            estimatedWeeks: m.estimatedWeeks || 2,
            status: idx === 0 ? 'in-progress' : 'not-started',
            topics: (m.topics || []).map(topicTitle => ({
                title: topicTitle,
                isCompleted: false
            })),
            suggestedProjects: m.suggestedProjects || []
        }));

        const readinessScore = calculateReadinessScore(formattedMilestones);

        // Upsert CareerPath
        let careerPath = await CareerPath.findOne({ userId });
        if (careerPath) {
            careerPath.profileId = profile._id;
            careerPath.targetRole = targetRole;
            careerPath.summary = roadmapData.summary || '';
            careerPath.skillGaps = roadmapData.skillGaps || [];
            careerPath.milestones = formattedMilestones;
            careerPath.readinessScore = readinessScore;
            await careerPath.save();
        } else {
            careerPath = await CareerPath.create({
                userId,
                profileId: profile._id,
                targetRole,
                summary: roadmapData.summary || '',
                skillGaps: roadmapData.skillGaps || [],
                milestones: formattedMilestones,
                readinessScore,
                chatHistory: [{
                    role: 'assistant',
                    content: `Hello! I'm your AI Career Counselor. I've built your roadmap for transitioning to **${targetRole}**. How can I help you get started today?`,
                    timestamp: new Date()
                }]
            });
        }

        res.status(200).json({
            success: true,
            data: {
                profile,
                careerPath
            },
            message: 'Career path & roadmap generated successfully!'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's career profile, roadmap, and chat history
// @route   GET /api/career/data
// @access  Private
export const getCareerData = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [profile, careerPath] = await Promise.all([
            UserCareerProfile.findOne({ userId }),
            CareerPath.findOne({ userId }).populate('milestones.linkedDocumentId', 'title fileType')
        ]);

        res.status(200).json({
            success: true,
            data: {
                profile: profile || null,
                careerPath: careerPath || null
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update milestone topic completion or milestone status
// @route   PUT /api/career/milestone
// @access  Private
export const updateMilestoneProgress = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { milestoneId, topicIndex, isCompleted, status } = req.body;

        if (!milestoneId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide milestoneId',
                statusCode: 400
            });
        }

        const careerPath = await CareerPath.findOne({ userId });
        if (!careerPath) {
            return res.status(404).json({
                success: false,
                error: 'Career path not found. Please create a career profile first.',
                statusCode: 404
            });
        }

        const milestone = careerPath.milestones.find(m => m.milestoneId === milestoneId);
        if (!milestone) {
            return res.status(404).json({
                success: false,
                error: 'Milestone not found in your career path',
                statusCode: 404
            });
        }

        // Case 1: Direct status update from milestone dropdown ('completed', 'not-started', 'in-progress')
        if (status && ['not-started', 'in-progress', 'completed'].includes(status)) {
            milestone.status = status;

            // When user selects 'completed', automatically check all key topics
            if (status === 'completed') {
                milestone.topics.forEach(t => { t.isCompleted = true; });
            }
            // When user selects 'not-started', automatically uncheck all key topics
            else if (status === 'not-started') {
                milestone.topics.forEach(t => { t.isCompleted = false; });
            }
        }
        // Case 2: Individual topic checkbox toggle
        else if (typeof topicIndex === 'number' && milestone.topics[topicIndex]) {
            milestone.topics[topicIndex].isCompleted = typeof isCompleted === 'boolean'
                ? isCompleted
                : !milestone.topics[topicIndex].isCompleted;

            // Auto-sync milestone status based on topics state
            const allCompleted = milestone.topics.length > 0 && milestone.topics.every(t => t.isCompleted);
            const anyCompleted = milestone.topics.some(t => t.isCompleted);

            if (allCompleted) {
                milestone.status = 'completed';
            } else if (anyCompleted) {
                milestone.status = 'in-progress';
            } else {
                milestone.status = 'not-started';
            }
        }

        // Recalculate overall readiness score
        careerPath.readinessScore = calculateReadinessScore(careerPath.milestones);
        await careerPath.save();

        res.status(200).json({
            success: true,
            data: careerPath,
            message: 'Milestone progress updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Chat with AI Career Counselor
// @route   POST /api/career/chat
// @access  Private
export const sendCounselorMessage = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a message to send to your AI Career Counselor',
                statusCode: 400
            });
        }

        const [profile, careerPath] = await Promise.all([
            UserCareerProfile.findOne({ userId }),
            CareerPath.findOne({ userId })
        ]);

        if (!careerPath) {
            return res.status(400).json({
                success: false,
                error: 'Please create your career profile before chatting with the AI Counselor.',
                statusCode: 400
            });
        }

        // Push user message
        careerPath.chatHistory.push({
            role: 'user',
            content: message.trim(),
            timestamp: new Date()
        });

        // Call Gemini AI Career Counselor Chat
        const aiResponse = await chatWithCareerCounselor(
            message,
            careerPath.chatHistory,
            profile,
            careerPath
        );

        // Push AI response
        careerPath.chatHistory.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });

        await careerPath.save();

        res.status(200).json({
            success: true,
            data: {
                message: aiResponse,
                chatHistory: careerPath.chatHistory
            }
        });
    } catch (error) {
        next(error);
    }
};
