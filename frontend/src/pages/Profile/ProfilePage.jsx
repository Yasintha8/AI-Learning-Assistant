import React, { useState, useEffect } from "react";
import PageHeader from "../.././components/common/PageHeader";
import Button from "../.././components/common/Button";
import Spinner from "../.././components/common/Spinner";
import authService from "../.././services/authService";
import { useAuth } from "../.././context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Shield } from "lucide-react";

const ProfilePage = () => {

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setUsername(data.username || "");
        setEmail(data.email || "");
      } catch (error) {
        toast.error("Failed to load profile.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in">
      <PageHeader
        title="Profile Setting"
        subtitle="Manage your account information and password"
      />

      {/* Avatar + name banner */}
      <div className="bg-bg-card border border-border-light rounded-2xl p-6 flex items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow shrink-0">
          <span className="text-2xl font-bold text-white">
            {userInitial}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-text-heading truncate">{username}</h2>
          <p className="text-sm text-text-muted truncate">{email}</p>
        </div>
      </div>

      {/* Profile Info */}
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