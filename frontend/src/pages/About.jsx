import { Users, Target, Award, Heart } from 'lucide-react';
import Footer from '../components/layout/Footer';

const About = () => {
  const team = [
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Agricultural Expert',
      image: '/api/placeholder/150/150',
      description: 'PhD in Agricultural Sciences with 15+ years of experience in crop management and pest control.'
    },
    {
      name: 'Priya Nair',
      role: 'AI/ML Engineer',
      image: '/api/placeholder/150/150',
      description: 'Specializes in natural language processing and machine learning for agricultural applications.'
    },
    {
      name: 'Arjun Menon',
      role: 'Full Stack Developer',
      image: '/api/placeholder/150/150',
      description: 'Expert in building scalable web applications with focus on user experience and performance.'
    },
    {
      name: 'Dr. Lakshmi Pillai',
      role: 'Extension Officer',
      image: '/api/placeholder/150/150',
      description: 'Former Krishibhavan officer with deep understanding of farmer needs and government schemes.'
    }
  ];

  const values = [
    {
      icon: Target,
      title: 'Mission',
      description: 'To democratize access to agricultural expertise through AI-powered advisory services, making expert farming knowledge available to every farmer, anytime, anywhere.'
    },
    {
      icon: Award,
      title: 'Vision',
      description: 'To become the most trusted digital agricultural advisor in India, empowering farmers with knowledge and technology for sustainable and profitable farming.'
    },
    {
      icon: Heart,
      title: 'Values',
      description: 'Farmer-first approach, accuracy in advice, cultural sensitivity, continuous learning, and bridging the gap between traditional wisdom and modern technology.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              About Digital Krishi Officer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're on a mission to revolutionize agricultural advisory services through 
              AI technology, making expert farming knowledge accessible to every farmer in India.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  Digital Krishi Officer was born from a simple observation: farmers across India, 
                  particularly in Kerala, face significant challenges in accessing timely expert 
                  agricultural advice. Traditional extension services, while valuable, are often 
                  overburdened and cannot provide 24/7 support.
                </p>
                <p>
                  Our team of agricultural experts, AI engineers, and developers came together 
                  to create an intelligent system that combines the power of artificial intelligence 
                  with deep agricultural knowledge. We believe that every farmer deserves access 
                  to expert advice, regardless of their location or the time of day.
                </p>
                <p>
                  By leveraging advanced language models and comprehensive agricultural databases, 
                  we've created a digital assistant that can provide instant, accurate, and 
                  contextually relevant advice on everything from pest management to government schemes.
                </p>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    10,000+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Farmers Helped
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    50,000+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Questions Answered
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Support Available
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    99%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Satisfaction Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Mission, Vision & Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're driven by a clear purpose and guided by strong values in everything we do.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our diverse team combines agricultural expertise with cutting-edge technology 
              to serve farmers better.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Users className="w-16 h-16 text-gray-400" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Technology
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We leverage cutting-edge AI and machine learning technologies to provide 
              accurate and contextual agricultural advice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Advanced Language Models
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Powered by state-of-the-art language models that understand context 
                and provide human-like responses in multiple languages.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Agricultural Knowledge Base
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive database of agricultural information from trusted sources, 
                research institutes, and expert knowledge.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Real-time Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fast, real-time processing ensures farmers get instant responses 
                to their queries without delays.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default About;
