import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-100 dark:from-gray-900 dark:via-green-900/10 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
       <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Digital Krishi Officer
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">AI Farm Assistant</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md leading-relaxed">
              AI-powered agricultural advisory system helping farmers with expert advice on 
              pest management, crop planning, weather guidance, and government schemes.
            </p>
            {/* Social links with enhanced styling */}
            <div className="flex space-x-3">
              <a
                href={import.meta.env.VITE_GITHUB_URL || '#'}
                className="group p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-900 dark:hover:bg-white hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white dark:group-hover:text-gray-900 transition-colors duration-300" />
              </a>
              <a
                href={import.meta.env.VITE_TWITTER_URL || '#'}
                className="group p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-blue-500 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
              </a>
              <a
                href={import.meta.env.VITE_LINKEDIN_URL || '#'}
                className="group p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center border-l-4 border-green-500 pl-3">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Quick Links
            </h3>
            <ul className="space-y-2 pl-3">
              <li>
                <Link
                  to="/"
                  className="group flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 py-1"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 group-hover:bg-green-500 rounded-full transition-colors duration-200"></span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="group flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 py-1"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 group-hover:bg-green-500 rounded-full transition-colors duration-200"></span>
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="group flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 py-1"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 group-hover:bg-green-500 rounded-full transition-colors duration-200"></span>
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="group flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 py-1"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 group-hover:bg-green-500 rounded-full transition-colors duration-200"></span>
                  <span>Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center border-l-4 border-blue-500 pl-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Contact
            </h3>
            <ul className="space-y-3 pl-3">
              <li className="group">
                <div className="flex items-center space-x-3 py-1 hover:bg-green-50/50 dark:hover:bg-green-900/10 rounded-lg transition-all duration-200">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors duration-200">
                    <Mail className="w-3 h-3 text-green-600 dark:text-green-400 group-hover:text-white" />
                  </div>
                  <a
                    href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@dko.com'}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 text-sm"
                  >
                    {import.meta.env.VITE_SUPPORT_EMAIL || 'support@dko.com'}
                  </a>
                </div>
              </li>
              <li className="group">
                <div className="flex items-center space-x-3 py-1 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-lg transition-all duration-200">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-200">
                    <Phone className="w-3 h-3 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                  </div>
                  <a
                    href={`tel:${import.meta.env.VITE_SUPPORT_PHONE || '+91-1234567890'}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 text-sm"
                  >
                    {import.meta.env.VITE_SUPPORT_PHONE || '+91-1234567890'}
                  </a>
                </div>
              </li>
              <li className="group">
                <div className="flex items-start space-x-3 py-1 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 rounded-lg transition-all duration-200">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors duration-200 mt-0.5">
                    <MapPin className="w-3 h-3 text-purple-600 dark:text-purple-400 group-hover:text-white" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Kerala, India
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-6 border-t border-gray-200/70 dark:border-gray-700/70">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                © {currentYear} Digital Krishi Officer. All rights reserved.
              </p>
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-400">
                <span>•</span>
                <span>Made with ❤️ for farmers</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                to="/privacy"
                className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors duration-200 hover:underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors duration-200 hover:underline underline-offset-4"
              >
                Terms of Service
              </Link>
              <Link
                to="/help"
                className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm transition-colors duration-200 hover:underline underline-offset-4"
              >
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
