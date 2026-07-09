import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../.././components/common/PageHeader";
import Button from "../.././components/common/Button";
import Spinner from "../.././components/common/Spinner";
import authService from "../.././services/authService";
import { useAuth } from "../.././context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Shield, Camera, X } from "lucide-react";

const ProfilePage = () => {

  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setUsername(data.username || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatarUrl || null);
      } catch (error) {
        toast.error("Failed to load profile.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const data = await authService.uploadAvatar(formData);
      setAvatarUrl(data.avatarUrl);
      setAvatarPreview(null);
      setAvatarFile(null);
      toast.success("Profile picture updated.");
    } catch (error) {
      toast.error(error.message || "Failed to upload picture.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await authService.updateProfile({ username, email });
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information and password"
      />

      {/* Avatar + name banner */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm shadow-primary-shadow">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-primary to-blue-400 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{userInitial}</span>
                </div>
              )}
            </div>

            {/* Camera overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" strokeWidth={2} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Upload / Cancel buttons — only show when a new image is selected */}
          {avatarFile && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={avatarUploading}
                className="h-8 px-3 rounded-lg bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {avatarUploading ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelAvatar}
                disabled={avatarUploading}
                className="h-8 w-8 rounded-lg border border-border-medium bg-bg-main flex items-center justify-center text-text-muted hover:text-error hover:bg-error-bg transition-colors duration-150 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          )}

          {!avatarFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
            >
              Change photo
            </button>
          )}
        </div>

        {/* Name + email */}
        <div className="flex flex-col justify-center gap-1 min-w-0 text-center sm:text-left">
          <h2 className="text-lg font-bold text-text-heading truncate">{username}</h2>
          <p className="text-sm text-text-muted truncate">{email}</p>
          {avatarPreview && (
            <p className="text-xs text-amber-500 font-medium mt-1">
              Preview — click Upload to save
            </p>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
            <User className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-text-heading tracking-tight">Personal Information</h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                placeholder="Your username"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileLoading}
              className="h-10 px-5 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {profileLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-text-heading tracking-tight">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="h-10 px-5 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {passwordLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;