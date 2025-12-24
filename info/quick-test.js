// ============================================
// اختبار سريع - Hugging Face
// ============================================
// نسخ هذا الملف واختبره مباشرة!

require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_TOKEN);

// ============================================
// 1. اختبار المحادثة (Chat)
// ============================================
async function testChat() {
  console.log('\n🧠 اختبار المحادثة...');
  
  try {
    const response = await hf.textGeneration({
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      inputs: `أنت زوزو القوية، البطلة الخارقة الشجاعة.
قل مرحباً للطفل بجملة قصيرة ومرحة.

زوزو:`,
      parameters: {
        max_new_tokens: 80,
        temperature: 0.9,
        return_full_text: false
      }
    });
    
    console.log('✅ الرد:', response.generated_text.trim());
    return true;
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
}

// ============================================
// 2. اختبار تحويل النص إلى كلام (TTS)
// ============================================
async function testTTS() {
  console.log('\n🔊 اختبار تحويل النص إلى كلام...');
  
  try {
    const fs = require('fs');
    
    const response = await hf.textToSpeech({
      model: 'facebook/mms-tts-ara',
      inputs: 'مرحباً! أنا زوزو القوية'
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync('test-output.wav', buffer);
    
    console.log('✅ تم إنشاء الملف: test-output.wav');
    console.log('   حجم الملف:', (buffer.length / 1024).toFixed(2), 'KB');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
}

// ============================================
// 3. اختبار تحويل الكلام إلى نص (STT)
// ============================================
async function testSTT() {
  console.log('\n🎤 اختبار تحويل الكلام إلى نص...');
  
  try {
    const fs = require('fs');
    
    // استخدم الملف الذي أنشأناه للتو
    if (!fs.existsSync('test-output.wav')) {
      console.log('⚠️  لا يوجد ملف صوتي للاختبار. سيتم تخطي هذا الاختبار.');
      return true;
    }
    
    const audioBuffer = fs.readFileSync('test-output.wav');
    
    const response = await hf.automaticSpeechRecognition({
      model: 'openai/whisper-base',
      data: audioBuffer
    });
    
    console.log('✅ النص المستخرج:', response.text);
    return true;
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
}

// ============================================
// 4. اختبار محادثة كاملة
// ============================================
async function testFullConversation() {
  console.log('\n💬 اختبار محادثة كاملة...');
  
  try {
    // 1. رسالة ترحيبية
    console.log('\n1️⃣ إنشاء رسالة ترحيبية...');
    const welcome = await hf.textGeneration({
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      inputs: `أنت زوزو القوية. رحب بالطفل بجملة قصيرة.

زوزو:`,
      parameters: {
        max_new_tokens: 60,
        temperature: 0.9
      }
    });
    
    const welcomeText = welcome.generated_text.trim();
    console.log('   زوزو:', welcomeText);
    
    // 2. تحويل لصوت
    console.log('\n2️⃣ تحويل إلى صوت...');
    const welcomeAudio = await hf.textToSpeech({
      model: 'facebook/mms-tts-ara',
      inputs: welcomeText
    });
    console.log('   ✅ تم إنشاء الصوت');
    
    // 3. رد الطفل (محاكاة)
    const childMessage = "أنا أحب أن أرتب غرفتي!";
    console.log('\n3️⃣ الطفل يقول:', childMessage);
    
    // 4. رد الشخصية
    console.log('\n4️⃣ زوزو ترد...');
    const reply = await hf.textGeneration({
      model: 'meta-llama/Llama-3.2-3B-Instruct',
      inputs: `أنت زوزو القوية. رد على الطفل بجملة مشجعة.

الطفل: ${childMessage}
زوزو:`,
      parameters: {
        max_new_tokens: 60,
        temperature: 0.8
      }
    });
    
    const replyText = reply.generated_text.trim();
    console.log('   زوزو:', replyText);
    
    // 5. تحويل الرد لصوت
    console.log('\n5️⃣ تحويل الرد إلى صوت...');
    const replyAudio = await hf.textToSpeech({
      model: 'facebook/mms-tts-ara',
      inputs: replyText
    });
    console.log('   ✅ تم إنشاء الصوت');
    
    console.log('\n✅ المحادثة الكاملة نجحت!');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return false;
  }
}

// ============================================
// 5. اختبار السرعة
// ============================================
async function testSpeed() {
  console.log('\n⚡ اختبار السرعة...');
  
  const tests = [
    { name: 'Chat (نص قصير)', fn: async () => {
      const start = Date.now();
      await hf.textGeneration({
        model: 'meta-llama/Llama-3.2-3B-Instruct',
        inputs: 'قل مرحباً',
        parameters: { max_new_tokens: 20 }
      });
      return Date.now() - start;
    }},
    { name: 'TTS (نص قصير)', fn: async () => {
      const start = Date.now();
      await hf.textToSpeech({
        model: 'facebook/mms-tts-ara',
        inputs: 'مرحباً'
      });
      return Date.now() - start;
    }}
  ];
  
  for (const test of tests) {
    try {
      const duration = await test.fn();
      console.log(`   ${test.name}: ${(duration / 1000).toFixed(2)} ثانية`);
    } catch (error) {
      console.log(`   ${test.name}: فشل`);
    }
  }
}

// ============================================
// تشغيل جميع الاختبارات
// ============================================
async function runAllTests() {
  console.log('════════════════════════════════════════');
  console.log('🚀 اختبارات Hugging Face');
  console.log('════════════════════════════════════════');
  
  // التحقق من الـ Token
  if (!process.env.HF_TOKEN) {
    console.error('\n❌ خطأ: HF_TOKEN غير موجود في ملف .env');
    console.log('\nالخطوات:');
    console.log('1. اذهب إلى https://huggingface.co/settings/tokens');
    console.log('2. أنشئ token جديد');
    console.log('3. أضفه في ملف .env:');
    console.log('   HF_TOKEN=your_token_here');
    process.exit(1);
  }
  
  console.log('✅ Token موجود:', process.env.HF_TOKEN.substring(0, 10) + '...');
  
  const results = {
    chat: await testChat(),
    tts: await testTTS(),
    stt: await testSTT(),
    fullConversation: await testFullConversation(),
  };
  
  await testSpeed();
  
  // النتائج النهائية
  console.log('\n════════════════════════════════════════');
  console.log('📊 النتائج النهائية:');
  console.log('════════════════════════════════════════');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const status = result ? 'نجح' : 'فشل';
    console.log(`${icon} ${test}: ${status}`);
  });
  
  console.log(`\n🎯 النتيجة: ${passed}/${total} اختبارات نجحت`);
  
  if (passed === total) {
    console.log('\n🎉 ممتاز! جميع الاختبارات نجحت!');
    console.log('🚀 يمكنك الآن بدء تطوير التطبيق!');
  } else {
    console.log('\n⚠️  بعض الاختبارات فشلت. راجع الأخطاء أعلاه.');
  }
  
  console.log('\n════════════════════════════════════════');
}

// تشغيل
runAllTests().catch(console.error);

// ============================================
// معلومات إضافية
// ============================================
console.log('\n📝 ملاحظات:');
console.log('- الاختبار الأول قد يأخذ وقتاً (تحميل الموديلات)');
console.log('- الاختبارات اللاحقة ستكون أسرع');
console.log('- إذا فشل اختبار، حاول مرة أخرى بعد دقيقة');
console.log('- السرعة تعتمد على حمل سيرفرات Hugging Face');
console.log('');