import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OnboardingModal from '../components/onboarding/OnboardingModal';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  // Redirect if already authenticated (but not if showing onboarding)
  useEffect(() => {
    if (isAuthenticated && !isLoading && !showOnboarding) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, showOnboarding]);

  const onSubmit = async (data) => {
    try {
      const result = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName
        }
      });

      if (result.success) {
        // Show onboarding modal instead of navigating directly
        setShowOnboarding(true);
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Registration failed'
        });
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred'
      });
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate('/dashboard', { replace: true });
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    navigate('/dashboard', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-green-900/20 dark:to-gray-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl dark:shadow-green-500/10 border border-white/20 dark:border-gray-700/50">
            <div>
              <div className="flex justify-center mb-6">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 tracking-tight">
                    Digital Krishi Officer
                  </h1>
                </div>
              </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    maxLength: {
                      value: 50,
                      message: 'First name cannot exceed 50 characters'
                    }
                  })}
                  type="text"
                  autoComplete="given-name"
                  className="w-full h-11 px-3 py-2 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 text-sm"
                  placeholder="First name"
                  id="firstName"
                  aria-invalid={!!errors.firstName}
                  aria-describedBy={errors.firstName ? 'firstName-error' : undefined}
                />
                {errors.firstName && (
                  <p id="firstName-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="relative group">
                <input
                  {...register('lastName', {
                    maxLength: {
                      value: 50,
                      message: 'Last name cannot exceed 50 characters'
                    }
                  })}
                  type="text"
                  autoComplete="family-name"
                  className="w-full h-11 px-3 py-2 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 text-sm"
                  placeholder="Last name"
                  id="lastName"
                  aria-invalid={!!errors.lastName}
                  aria-describedBy={errors.lastName ? 'lastName-error' : undefined}
                />
                {errors.lastName && (
                  <p id="lastName-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Username Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <User className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" aria-hidden="true" />
              </div>
              <input
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  maxLength: {
                    value: 30,
                    message: 'Username cannot exceed 30 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers, and underscores'
                  }
                })}
                type="text"
                autoComplete="username"
                className="w-full h-11 px-3 py-2 pl-10 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 text-sm"
                placeholder="Username"
                id="username"
                aria-invalid={!!errors.username}
                aria-describedBy={errors.username ? 'username-error' : undefined}
              />
              {errors.username && (
                <p id="username-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" aria-hidden="true" />
              </div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                type="email"
                autoComplete="email"
                className="w-full h-11 px-3 py-2 pl-10 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 text-sm"
                placeholder="Email address"
                id="email"
                aria-invalid={!!errors.email}
                aria-describedBy={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" aria-hidden="true" />
              </div>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full h-11 px-3 py-2 pl-10 pr-10 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 text-sm"
                placeholder="Password"
                id="password"
                aria-invalid={!!errors.password}
                aria-describedBy={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" aria-hidden="true" />
              </div>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full h-11 px-3 py-2 pl-10 pr-10 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 text-sm"
                placeholder="Confirm password"
                id="confirmPassword"
                aria-invalid={!!errors.confirmPassword}
                aria-describedBy={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Terms and conditions */}
          <div className="flex items-start">
            <input
              {...register('acceptTerms', {
                required: 'You must accept the terms and conditions'
              })}
              id="accept-terms"
              name="acceptTerms"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded mt-0.5"
            />
            <label htmlFor="accept-terms" className="ml-2 block text-xs text-gray-900 dark:text-gray-300">
              I agree to the{' '}
              <Link to="/terms" className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-600 dark:text-red-400" aria-live="polite">
              {errors.acceptTerms.message}
            </p>
          )}

          {/* Error message */}
          {errors.root && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-800 dark:text-red-400" aria-live="polite">
                {errors.root.message}
              </p>
            </div>
          )}

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};

export default Signup;
