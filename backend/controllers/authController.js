import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import User from "../models/User.js";

//Generate jwt token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });
};

let googleClient;
const getGoogleClient = () => {
    if (!googleClient) {
        googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
    }
    return googleClient;
};

//@desc Register new user
//@route POST /api/auth/register
//@access Public

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            return res.status(400).json({
                success: false,
                error:
                    userExists.email === email
                        ? "Email already exists"
                        : "Username already exists",
                statusCode: 400,
            });
        }

        //Create user
        const user = await User.create({
            username,
            email,
            password,
        });

        //Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    createdAt: user.createdAt,
                },
                token,
            },
            message: "User registered successfully",
        });
    } catch (error) {
        next(error);
    }
};

//@desc Login user
//@route POST /api/auth/login
//@access Public

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Please provide email and password",
                statusCode: 400,
            });
        }

        //Check for user (include password for comparrsion)
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
                statusCode: 401,
            });
        }

        //Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
                statusCode: 401,
            })
        }

        //Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            token,
            message: "Login successfull",
        });

    } catch (error) {
        next(error);
    }
};

//@desc Login or register a user via Google Identity Services
//@route POST /api/auth/google
//@access Public

export const googleAuth = async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: "Google authorization code is required",
                statusCode: 400,
            });
        }

        const client = getGoogleClient();

        const { tokens } = await client.getToken({
            code,
            redirect_uri: "postmessage",
        });

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                if (!user.profileImage && picture) user.profileImage = picture;
                await user.save();
            }
        } else {
            let username = (name || email.split('@')[0]).replace(/\s+/g, '').toLowerCase();
            if (username.length < 3) username = `user_${username}`;

            const usernameTaken = await User.findOne({ username });
            if (usernameTaken) {
                username = `${username}_${googleId.slice(-5)}`;
            }

            user = await User.create({
                username,
                email,
                googleId,
                authProvider: 'google',
                profileImage: picture || null,
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            token,
            message: "Google login successful",
        });
    } catch (error) {
        console.error('Google auth error:', error.response?.data || error.message);
        if (
            error.message?.includes('invalid_grant') ||
            error.message?.includes('invalid_request') ||
            error.message?.includes('Token used too late') ||
            error.message?.includes('Wrong number of segments')
        ) {
            return res.status(401).json({
                success: false,
                error: "Invalid or expired Google authorization code",
                statusCode: 401,
            });
        }
        next(error);
    }
};

//@desc Get user profile
//@route GET /api/auth/profile
//@access Private

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
        });
    } catch (error) {
        next(error);
    }
};

//@desc Update user profile
//@route PUT /api/auth/profile
//@access Private

export const updateProfile = async (req, res, next) => {
    try {
        const { username, email, profileImage } = req.body;

        const user = await User.findById(req.user._id);

        if (username) user.username = username;
        if (email) user.email = email;
        if (profileImage) user.profileImage = profileImage;

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            message: "Profile updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

//@desc Upload/replace profile avatar
//@route POST /api/auth/avatar
//@access Private

export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please provide an image file",
                statusCode: 400,
            });
        }

        // Convert uploaded file to base64 data URL for 100% persistence on ephemeral platforms (Render free tier)
        let avatarUrl;
        if (req.file.buffer) {
            avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        } else if (req.file.path) {
            const fileBuffer = await fs.promises.readFile(req.file.path);
            avatarUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
            // Clean up the temporary file from the ephemeral disk
            await fs.promises.unlink(req.file.path).catch(() => {});
        } else {
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const host = req.get('host');
            const baseUrl = process.env.BACKEND_URL || (host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 8000}`);
            avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
        }

        const user = await User.findById(req.user._id);
        user.profileImage = avatarUrl;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            message: "Avatar updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

//@desc Change password
//@route PUT /api/auth/change-password
//@access Private

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: "Please provide current and new password",
                statusCode: 400,
            });
        }

        const user = await User.findById(req.user._id).select("+password");

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Current password is incorrect",
                statusCode: 401,
            })
        }

        //Change password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });

    } catch (error) {
        next(error);
    }
};

