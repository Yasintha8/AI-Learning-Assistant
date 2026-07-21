import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { BrainCircuit, Mail, Lock, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const RegisterPage = () => {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
        {/* Register Card */}
        <div className="w-full bg-bg-card rounded-3xl border border-border-light shadow-2xl shadow-slate-200/30 dark:shadow-none p-8 sm:p-12 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/40 dark:hover:shadow-none">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 self-start">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex items-center justify-center shadow-sm">
                <BrainCircuit className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-1 mt-4">
              <h1 className="text-3xl font-bold tracking-tight text-text-heading font-display">
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

            {/* Input Fields */}
            <div className="flex flex-col gap-5 mt-2">
              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Username
                </label>
                <div className="flex items-center border-b border-border-medium focus-within:border-primary transition-colors duration-300 py-2.5">
                  <User className="text-text-muted w-5 h-5 mr-3 shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-transparent focus:outline-none w-full text-text-heading font-medium placeholder-text-placeholder"
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
                <div className="flex items-center border-b border-border-medium focus-within:border-primary transition-colors duration-300 py-2.5">
                  <Mail className="text-text-muted w-5 h-5 mr-3 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent focus:outline-none w-full text-text-heading font-medium placeholder-text-placeholder"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Password
                </label>
                <div className="flex items-center border-b border-border-medium focus-within:border-primary transition-colors duration-300 py-2.5">
                  <Lock className="text-text-muted w-5 h-5 mr-3 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent focus:outline-none w-full text-text-heading font-medium placeholder-text-placeholder tracking-wide"
                    placeholder="Create a password (min. 6 chars)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-muted hover:text-text-body transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-shadow/20 hover:shadow-primary-shadow/30 transition-all duration-300 cursor-pointer disabled:opacity-50 active:scale-[0.98] group"
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

            {/* Sign in Redirect */}
            <p className="text-sm text-text-body mt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-text-muted leading-normal text-center">
          By continuing, you agree to our{' '}
          <a href="#" className="hover:underline text-text-body font-medium">Terms</a>
          {' '}&{' '}
          <a href="#" className="hover:underline text-text-body font-medium">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;