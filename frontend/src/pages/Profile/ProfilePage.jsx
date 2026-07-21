import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../.././components/common/PageHeader";
import Spinner from "../.././components/common/Spinner";
import authService from "../.././services/authService";
import progressService from "../.././services/progressService";
import { useAuth } from "../.././context/AuthContext";
import toast from "react-hot-toast";
import moment from "moment";
import {
  User, Mail, Lock, Shield, Save, KeyRound, Camera, FileText, BookOpen, BrainCircuit
} from "lucide-react";

const inputClassName = "w-full h-11 pl-11 pr-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150";

const ProfilePage = () => {

  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [memberSince, setMemberSince] = useState(null);

  const [stats, setStats] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setUsername(data.data.username || "");
        setEmail(data.data.email || "");
        setAvatarUrl(data.data.profileImage || null);
        setMemberSince(data.data.createdAt || null);
      } catch (error) {
        toast.error("Failed to load profile.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await progressService.getDashboardData();
        setStats(res.data?.overview || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await authService.uploadAvatar(formData);
      setAvatarUrl(res.data.profileImage);
      updateUser({ profileImage: res.data.profileImage });
      toast.success("Avatar updated successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to upload avatar.");
      setAvatarUrl(user?.profileImage || null);
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await authService.updateProfile({ username, email });
      updateUser({ username, email });
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

  const statTiles = stats ? [
    { label: "Documents", value: stats.totalDocuments ?? 0, icon: FileText, gradient: "from-blue-400 to-cyan-500" },
    { label: "Flashcards", value: stats.totalFlashcards ?? 0, icon: BookOpen, gradient: "from-violet-400 to-purple-500" },
    { label: "Quizzes", value: stats.totalQuizzes ?? 0, icon: BrainCircuit, gradient: "from-emerald-400 to-teal-500" },
  ] : [];

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="max-w-5xl mx-auto px-6 py-5 space-y-8">

        <PageHeader
          title="Profile Settings"
          subtitle="Manage your account information and keep your account secure."
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-100">
            <Spinner label="Loading your profile..." />
          </div>
        ) : (
          <>

        {/* Profile Hero Card */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username || "User"}
                className="w-20 h-20 rounded-2xl object-cover border border-border-medium"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-primary to-primary-hover flex items-center justify-center shadow-md shadow-primary-shadow/15">
                <User className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            )}

            {avatarUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <Spinner size="sm" tone="white" inline />
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover border-2 border-bg-card flex items-center justify-center text-white shadow-sm transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              aria-label="Change avatar"
            >
              <Camera className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-text-heading truncate">{username || "Guest"}</h2>
            <p className="text-sm text-text-muted truncate">{email}</p>
            {memberSince && (
              <p className="text-xs text-text-muted mt-1">
                Member since {moment(memberSince).format("MMMM YYYY")}
              </p>
            )}
          </div>
        </div>

        {/* Account Stats */}
        {statTiles.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {statTiles.map((stat, index) => (
              <div
                key={index}
                className="bg-bg-card border border-border-light rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                  <stat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-text-heading tabular-nums">{stat.value}</div>
                  <p className="text-xs text-text-muted truncate">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">

          <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <User className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-heading">Personal Information</h3>
              <p className="text-xs text-text-muted">Update your username and email address.</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-text-body uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter username"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-text-body uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="example@email.com"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={profileLoading}
                className="h-11 px-5 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {profileLoading ? (
                  <>
                    <Spinner size="sm" tone="white" inline />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security */}
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">

          <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-heading">Security</h3>
              <p className="text-xs text-text-muted">Change your password to protect your account.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-text-body uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Current password"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-text-body uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="New password"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-text-body uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={2} />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={passwordLoading}
                className="h-11 px-5 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {passwordLoading ? (
                  <>
                    <Spinner size="sm" tone="white" inline />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" strokeWidth={2} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

          </>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;