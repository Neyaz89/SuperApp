// Test script for multi-extractor system
const { extractWithCobalt } = require('./extractors/cobalt-extractor');
const { smartExtract } = require('./extractors/smart-extractor');

// Test URLs
const TEST_URLS = {
  youtube: 'https://youtu.be/dQw4w9WgXcQ',
  instagram: 'https://www.instagram.com/p/C1234567890/',
  tiktok: 'https://www.tiktok.com/@user/video/1234567890',
  twitter: 'https://twitter.com/user/status/1234567890'
};

async function testExtractor(name, url, platform) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing ${name}`);
  console.log('URL:', url);
  console.log('Platform:', platform);
  console.log('='.repeat(80));
  
  try {
    const startTime = Date.now();
    const result = await smartExtract(url, platform);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ SUCCESS!');
    console.log('Extracted by:', result.extractedBy);
    console.log('Title:', result.title);
    console.log('Duration:', result.duration);
    console.log('Video qualities:', result.qualities.length);
    console.log('Audio formats:', result.audioFormats.length);
    console.log('Extraction time:', duration + 's');
    
    if (result.qualities.length > 0) {
      console.log('\nTop quality:', result.qualities[0].quality, result.qualities[0].format);
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log('Error:', error.message);
    return false;
  }
}

async function testCobaltOnly(url) {
  console.log('\n' + '='.repeat(80));
  console.log('Testing Cobalt Extractor Only');
  console.log('URL:', url);
  console.log('='.repeat(80));
  
  try {
    const startTime = Date.now();
    const result = await extractWithCobalt(url);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ COBALT SUCCESS!');
    console.log('Title:', result.title);
    console.log('Video qualities:', result.qualities.length);
    console.log('Audio formats:', result.audioFormats.length);
    console.log('Extraction time:', duration + 's');
    
    return true;
  } catch (error) {
    console.log('\n❌ COBALT FAILED!');
    console.log('Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting Multi-Extractor Tests\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Test Cobalt first
  console.log('\n📍 Testing Cobalt Community Instances...');
  const cobaltResult = await testCobaltOnly(TEST_URLS.youtube);
  results.total++;
  if (cobaltResult) results.passed++;
  else results.failed++;
  
  // Test each platform with smart extractor
  for (const [platform, url] of Object.entries(TEST_URLS)) {
    const success = await testExtractor(platform.toUpperCase(), url, platform);
    results.total++;
    if (success) results.passed++;
    else results.failed++;
    
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Ready for production!');
  } else {
    console.log('\n⚠️ Some tests failed. Check logs above for details.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
