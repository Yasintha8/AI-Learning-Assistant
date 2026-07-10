import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../.././components/common/PageHeader";
import Button from "../.././components/common/Button";
import Spinner from "../.././components/common/Spinner";
import authService from "../.././services/authService";
import { useAuth } from "../.././context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Shield, Save, KeyRound } from "lucide-react";

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


  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">

      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information and keep your account secure."
      />

      {/* Personal Information */}
      <div className="rounded-3xl border border-border-light bg-linear-to-br from-bg-card to-bg-main shadow-lg shadow-primary-shadow/10 overflow-hidden transition-all duration-300 hover:shadow-xl">

        <div className="flex items-center gap-4 px-8 py-6 border-b border-border-light">

          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center">
            <User className="w-6 h-6 text-primary" strokeWidth={2} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-heading">
              Personal Information
            </h2>
            <p className="text-sm text-text-muted">
              Update your username and email address.
            </p>
          </div>

        </div>

        <form
          onSubmit={handleProfileUpdate}
          className="p-8 space-y-6"
        >

          <div className="grid md:grid-cols-2 gap-6">

            {/* Username */}
            <div>

              <label className="block mb-2 text-sm font-semibold text-text-heading">
                Username
              </label>

              <div className="relative">

                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                  strokeWidth={2}
                />

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border-medium bg-bg-main/70 backdrop-blur text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary hover:border-primary transition-all duration-200"
                />

              </div>

            </div>

            {/* Email */}
            <div>

              <label className="block mb-2 text-sm font-semibold text-text-heading">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                  strokeWidth={2}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border-medium bg-bg-main/70 backdrop-blur text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary hover:border-primary transition-all duration-200"
                />

              </div>

            </div>

          </div>

          <div className="flex justify-end pt-2">

            <button
              type="submit"
              disabled={profileLoading}
              className="h-12 px-6 rounded-2xl bg-linear-to-r from-primary to-cyan-500 hover:from-primary-hover hover:to-cyan-400 text-white font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary-shadow/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >

              {profileLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}

            </button>

          </div>

        </form>

      </div>

      {/* Password */}

      <div className="rounded-3xl border border-border-light bg-linear-to-br from-bg-card to-bg-main shadow-lg shadow-primary-shadow/10 overflow-hidden transition-all duration-300 hover:shadow-xl">

        <div className="flex items-center gap-4 px-8 py-6 border-b border-border-light">

          <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-600" strokeWidth={2} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-heading">
              Security
            </h2>

            <p className="text-sm text-text-muted">
              Change your password to protect your account.
            </p>
          </div>

        </div>

        <form
          onSubmit={handlePasswordChange}
          className="p-8 space-y-6"
        >

          {/* Current */}

          <div>

            <label className="block mb-2 text-sm font-semibold text-text-heading">
              Current Password
            </label>

            <div className="relative">

              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                strokeWidth={2}
              />

              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Current password"
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border-medium bg-bg-main/70 backdrop-blur text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary hover:border-primary transition-all duration-200"
              />

            </div>

          </div>

          {/* New */}

          <div>

            <label className="block mb-2 text-sm font-semibold text-text-heading">
              New Password
            </label>

            <div className="relative">

              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                strokeWidth={2}
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="New password"
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border-medium bg-bg-main/70 backdrop-blur text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary hover:border-primary transition-all duration-200"
              />

            </div>

          </div>

          {/* Confirm */}

          <div>

            <label className="block mb-2 text-sm font-semibold text-text-heading">
              Confirm Password
            </label>

            <div className="relative">

              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                strokeWidth={2}
              />

              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border-medium bg-bg-main/70 backdrop-blur text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary hover:border-primary transition-all duration-200"
              />

            </div>

          </div>

          <div className="flex justify-end pt-2">

            <button
              type="submit"
              disabled={passwordLoading}
              className="h-12 px-6 rounded-2xl bg-linear-to-r from-primary to-cyan-500 hover:from-primary-hover hover:to-cyan-400 text-white font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary-shadow/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >

              {passwordLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  Update Password
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default ProfilePage;