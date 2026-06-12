const { EdgeTTS } = require('edge-tts-universal');

async function testVoice(text, voice, options = {}) {
  try {
    console.log(`Testing voice: ${voice} with text: "${text}"...`);
    const tts = new EdgeTTS(text, voice, options);
    const result = await tts.synthesize();
    const arrayBuffer = await result.audio.arrayBuffer();
    console.log(`Success! ArrayBuffer length: ${arrayBuffer.byteLength}`);
  } catch (err) {
    console.error(`Failed voice: ${voice} - Error:`, err);
  }
}

async function main() {
  // Test Piseth
  await testVoice('សួស្តី', 'km-KH-PisethNeural');
  // Test Sreymom
  await testVoice('សួស្តី', 'km-KH-SreymomNeural');
  // Test Chingchang (options)
  await testVoice('សួស្តី', 'km-KH-PisethNeural', {
    pitch: '+50Hz',
    rate: '+25%',
    volume: '+100%'
  });
}
main();
