const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connection successful');
    console.log(`📍 Connected to: ${mongoose.connection.host}`);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Available collections: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Test OpenRouter configuration
function testOpenRouterConfig() {
  console.log('🔍 Testing OpenRouter configuration...');
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY environment variable is not set');
    console.log('💡 Please add your OpenRouter API key to the .env file');
    return false;
  }
  
  if (process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    console.log('✅ OpenRouter API key format looks correct');
  } else {
    console.warn('⚠️  OpenRouter API key format might be incorrect (should start with sk-or-)');
  }
  
  return true;
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'OPENROUTER_API_KEY'
  ];
  
  const optionalVars = [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL'
  ];
  
  let allRequired = true;
  
  console.log('\n📋 Required variables:');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allRequired = false;
    }
  });
  
  console.log('\n📋 Optional variables:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`⚪ ${varName}: Not set (using default)`);
    }
  });
  
  return allRequired;
}

// Main test function
async function runTests() {
  console.log('🚀 Digital Krishi Officer - Backend Setup Test\n');
  
  // Test environment variables
  const envOk = testEnvironmentVariables();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test OpenRouter config
  const openRouterOk = testOpenRouterConfig();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test database connection (only if env vars are set)
  if (envOk) {
    await testDatabaseConnection();
  } else {
    console.log('⏭️  Skipping database test due to missing environment variables');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`Environment Variables: ${envOk ? '✅ Pass' : '❌ Fail'}`);
  console.log(`OpenRouter Config: ${openRouterOk ? '✅ Pass' : '❌ Fail'}`);
  console.log(`Database Connection: ${envOk ? '✅ Pass' : '⏭️  Skipped'}`);
  
  if (envOk && openRouterOk) {
    console.log('\n🎉 All tests passed! Your backend is ready to run.');
    console.log('💡 Start the server with: npm run dev');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your configuration.');
    console.log('💡 Make sure to copy .env.example to .env and fill in the values.');
  }
}

// Run tests
runTests().catch(console.error);
