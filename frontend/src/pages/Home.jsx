import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Users, Clock, Shield, Zap, Globe } from 'lucide-react';
import { Trans, t } from '@lingui/macro';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/Footer';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: MessageCircle,
      title: t`AI-Powered Advisory`,
      description: t`Get instant expert advice on pest management, crop planning, and farming techniques using advanced AI technology.`
    },
    {
      icon: Users,
      title: t`Expert Network`,
      description: t`Connect with agricultural experts and extension officers when you need specialized guidance.`
    },
    {
      icon: Clock,
      title: t`24/7 Availability`,
      description: t`Access farming advice anytime, anywhere. Our AI assistant is always ready to help.`
    },
    {
      icon: Shield,
      title: t`Reliable Information`,
      description: t`Get accurate, verified information from trusted agricultural sources and research institutes.`
    },
    {
      icon: Zap,
      title: t`Quick Responses`,
      description: t`Receive instant answers to your farming questions with our fast AI processing.`
    },
    {
      icon: Globe,
      title: t`Malayalam Support`,
      description: t`Communicate in your native language with full Malayalam language support.`
    }
  ];

  const stats = [
    { number: '10,000+', label: t`Farmers Helped` },
    { number: '50,000+', label: t`Questions Answered` },
    { number: '24/7', label: t`Support Available` },
    { number: '99%', label: t`Satisfaction Rate` }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <Trans>Your Digital</Trans>
              <span className="text-green-600 dark:text-green-400"> <Trans>Krishi Officer</Trans></span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              <Trans>AI-powered agricultural advisory system providing expert guidance on farming, pest management, weather decisions, and government schemes.</Trans>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                  >
                    <Trans>Go to Dashboard</Trans>
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
              ) : (
                <>
                    <Link
                      to="/signup"
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                    >
                      <Trans>Get Started</Trans>
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <Trans>Sign In</Trans>
                    </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <Trans>Why Choose Digital Krishi Officer?</Trans>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <Trans>Our AI-powered platform combines cutting-edge technology with agricultural expertise to provide farmers with the best possible guidance.</Trans>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <Trans>How It Works</Trans>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              <Trans>Getting expert agricultural advice has never been easier. Follow these simple steps.</Trans>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                <Trans>Sign Up</Trans>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                <Trans>Create your account and set up your farming profile with crop types and location.</Trans>
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                <Trans>Ask Questions</Trans>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                <Trans>Ask your farming questions in text or voice, upload images of crops or pests.</Trans>
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                <Trans>Get Expert Advice</Trans>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                <Trans>Receive instant AI-powered advice or connect with agricultural experts for complex issues.</Trans>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 dark:bg-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <Trans>Ready to Transform Your Farming?</Trans>
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            <Trans>Join thousands of farmers who are already using Digital Krishi Officer to improve their farming practices and increase their yields.</Trans>
          </p>
          {!isAuthenticated && (
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <Trans>Start Your Journey</Trans>
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
