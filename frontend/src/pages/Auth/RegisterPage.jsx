import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { BrainCircuit, Mail, Lock, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import GoogleIcon from '../../components/common/GoogleIcon';
import AuthLayout from '../../components/auth/AuthLayout';

const RegisterPage = () => {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.register(username, email, password);
      toast.success('Registration successful! Please Login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
      toast.error(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setError('');
      setLoading(true);
      try {
        const { token, user } = await authService.googleAuth(codeResponse.code);
        login(user, token);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } catch (err) {
        setError(err.message || 'Google sign-up failed. Please try again.');
        toast.error(err.message || 'Google sign-up failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google sign-up failed. Please try again.'),
  });

  return (
    <AuthLayout
      eyebrow="Get started"
      headline="Your AI-powered learning journey starts here"
      subheadline="Create a free account to upload documents, generate flashcards, and track your progress."
    >
      <div className="flex flex-col gap-7 animate-fade-in-up">
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 self-start">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-6 h-6" />
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-heading font-display">
            Create account
          </h1>
          <p className="text-text-body text-sm">
            Start your AI-powered learning journey
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="text-xs font-medium text-error bg-error-bg border border-error-border rounded-xl p-3 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border-medium bg-bg-main/60 focus:bg-bg-card focus:border-primary focus:ring-4 focus:ring-primary-light outline-none transition-all duration-200 text-text-heading font-medium placeholder-text-placeholder"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border-medium bg-bg-main/60 focus:bg-bg-card focus:border-primary focus:ring-4 focus:ring-primary-light outline-none transition-all duration-200 text-text-heading font-medium placeholder-text-placeholder"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-border-medium bg-bg-main/60 focus:bg-bg-card focus:border-primary focus:ring-4 focus:ring-primary-light outline-none transition-all duration-200 text-text-heading font-medium placeholder-text-placeholder tracking-wide"
                placeholder="Create a password (min. 6 chars)"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-shadow/20 hover:shadow-primary-shadow/30 transition-all duration-300 cursor-pointer disabled:opacity-50 active:scale-[0.98] group"
          >
            {loading ? (
              <Spinner size="sm" tone="white" inline />
            ) : (
              <>
                <span>Sign up</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border-medium" />
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-border-medium" />
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-bg-card border border-border-medium text-text-heading font-semibold flex items-center justify-center gap-2.5 hover:bg-bg-main transition-all duration-300 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          <GoogleIcon className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        {/* Sign in Redirect */}
        <p className="text-sm text-text-body text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
            Sign in
          </Link>
        </p>

        {/* Disclaimer */}
        <p className="text-[11px] text-text-muted leading-normal text-center">
          By continuing, you agree to our{' '}
          <a href="#" className="hover:underline text-text-body font-medium">Terms</a>
          {' '}&{' '}
          <a href="#" className="hover:underline text-text-body font-medium">Privacy Policy</a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;