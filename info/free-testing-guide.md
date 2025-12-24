# 🆓 دليل الاختبار المجاني للـ APIs العربية
## كيف تختبر تطبيقك بدون دفع أي شيء؟

---

## 🎯 خيارات مجانية 100% للاختبار

### 1. Claude API (Anthropic) - للمحادثات الذكية

#### 💰 الباقة المجانية:
- **رصيد مجاني**: $5 عند التسجيل الأول
- **المدة**: 3 أشهر من تاريخ التسجيل
- **يكفي لـ**: 150-200 محادثة تقريباً
- **الدعم العربي**: ممتاز جداً ✅

#### 📝 خطوات الحصول عليها:
```
1. اذهب إلى: https://console.anthropic.com
2. سجل حساب جديد
3. اذهب إلى "API Keys"
4. أنشئ API Key جديد
5. احتفظ به في مكان آمن

⚠️ ملاحظة: الـ $5 المجانية تنتهي بعد 3 أشهر أو عند انتهاء الرصيد
```

#### 💡 نصيحة للتوفير:
```javascript
// استخدم إعدادات مقتصدة
const response = await anthropic.messages.create({
  model: "claude-haiku-3-5-20241022", // أرخص موديل (بدلاً من Sonnet)
  max_tokens: 500, // حدد عدد كلمات أقل
  messages: [...]
});

// التكلفة تقريباً:
// Haiku: $0.001 لكل محادثة
// vs Sonnet: $0.02 لكل محادثة
```

---

### 2. OpenAI API - للصوت والنصوص

#### 💰 الباقة المجانية:
- **رصيد مجاني**: $5 عند التسجيل الأول (للحسابات الجديدة)
- **المدة**: 3 أشهر
- **يكفي لـ**: 
  - 300-400 دقيقة تحويل كلام إلى نص (Whisper)
  - 300,000 حرف تحويل نص إلى كلام (TTS)

#### 📝 خطوات الحصول عليها:
```
1. اذهب إلى: https://platform.openai.com
2. سجل حساب جديد
3. اذهب إلى "API Keys"
4. أنشئ API Key
5. استخدمه في تطبيقك

⚠️ ملاحظة: يجب إضافة بطاقة ائتمان للتأكيد (لن يتم الخصم إلا بعد انتهاء الرصيد)
```

---

### 3. بدائل مجانية بالكامل (بدون بطاقة ائتمان)

#### أ) Hugging Face Inference API ⭐ (موصى به للاختبار)

**المميزات:**
- ✅ مجاني تماماً بدون بطاقة ائتمان
- ✅ لا يوجد حد زمني
- ✅ دعم جيد للعربية
- ⚠️ أبطأ من APIs المدفوعة

**الاستخدام:**
```javascript
// 1. سجل حساب مجاني في: https://huggingface.co
// 2. احصل على API Token من: https://huggingface.co/settings/tokens

// للمحادثات الذكية (بدلاً من Claude)
const response = await fetch(
  "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct",
  {
    headers: {
      Authorization: `Bearer YOUR_HF_TOKEN`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      inputs: "مرحباً، كيف أساعدك اليوم؟",
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7
      }
    }),
  }
);

// الموديلات العربية المتاحة مجاناً:
// - meta-llama/Llama-3.2-3B-Instruct (جيد للعربية)
// - aubmindlab/bert-base-arabertv2 (للمهام البسيطة)
// - CAMeL-Lab/bert-base-arabic-camelbert-msa (فصحى)
```

---

#### ب) Google Cloud - الطبقة المجانية المستمرة

**المميزات:**
- ✅ مجاني للأبد (ليس trial)
- ✅ حدود شهرية محدودة
- ✅ دعم ممتاز للعربية

**الحدود المجانية الشهرية:**
```
Text-to-Speech (تحويل النص لكلام):
- 1 مليون حرف/شهر (WaveNet - جودة عالية)
- 4 ملايين حرف/شهر (Standard)

Speech-to-Text (تحويل الكلام لنص):
- 60 دقيقة/شهر

💡 يكفي لـ: 200-300 محادثة شهرياً
```

**خطوات التفعيل:**
```
1. اذهب إلى: https://console.cloud.google.com
2. سجل حساب جديد (يعطيك $300 رصيد لمدة 90 يوم)
3. بعد انتهاء الـ trial، الطبقة المجانية تستمر
4. فعّل Cloud Text-to-Speech API
5. فعّل Cloud Speech-to-Text API
6. أنشئ Service Account وحمّل المفتاح

⚠️ ملاحظة: يحتاج بطاقة ائتمان للتحقق فقط (لن يخصم شيء)
```

**مثال استخدام:**
```javascript
const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: './service-account-key.json'
});

const request = {
  input: { text: 'مرحباً بك في تطبيقنا' },
  voice: {
    languageCode: 'ar-XA', // العربية
    name: 'ar-XA-Wavenet-A', // صوت أنثوي
    ssmlGender: 'FEMALE'
  },
  audioConfig: { audioEncoding: 'MP3' }
};

const [response] = await client.synthesizeSpeech(request);
// استخدم response.audioContent
```

---

#### ج) Azure Cognitive Services - Trial مجاني

**المميزات:**
- ✅ 12 شهر مجاني للحسابات الجديدة
- ✅ دعم ممتاز للعربية السعودية والمصرية
- ✅ أصوات طبيعية جداً

**الحدود المجانية:**
```
Speech Services:
- 5 ساعات تحويل كلام لنص/شهر
- 5 ساعات تحويل نص لكلام/شهر (Neural)

💡 يكفي لـ: 600+ محادثة شهرياً
```

**خطوات التفعيل:**
```
1. اذهب إلى: https://azure.microsoft.com/free
2. سجل حساب مجاني (يحتاج بطاقة للتحقق)
3. أنشئ Speech Service Resource
4. احصل على API Key
```

---

### 4. خيارات Open Source (مجانية تماماً)

#### أ) Whisper.cpp - تحويل الكلام لنص محلياً

**المميزات:**
- ✅ مجاني 100% ولا يحتاج إنترنت
- ✅ دقة عالية للعربية
- ✅ يعمل على جهازك (أسرع)

**التثبيت:**
```bash
# 1. نزّل الأداة
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# 2. نزّل الموديل العربي
bash ./models/download-ggml-model.sh base

# 3. استخدمه
./main -m models/ggml-base.bin -f audio.wav -l ar
```

**استخدام في Node.js:**
```javascript
const { exec } = require('child_process');

function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    exec(
      `./whisper.cpp/main -m models/ggml-base.bin -f ${audioPath} -l ar`,
      (error, stdout, stderr) => {
        if (error) reject(error);
        resolve(stdout);
      }
    );
  });
}
```

---

#### ب) Piper TTS - تحويل النص لكلام محلياً

**المميزات:**
- ✅ مجاني ويعمل بدون إنترنت
- ✅ دعم جيد للعربية
- ✅ سريع جداً

**التثبيت:**
```bash
# 1. نزّل Piper
wget https://github.com/rhasspy/piper/releases/download/latest/piper_linux_x86_64.tar.gz
tar -xvf piper_linux_x86_64.tar.gz

# 2. نزّل موديل عربي
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx.json

# 3. استخدمه
echo "مرحباً بكم" | ./piper --model ar_JO-kareem-medium.onnx --output_file welcome.wav
```

---

## 📊 جدول المقارنة السريعة

| الخيار | مجاني؟ | بطاقة ائتمان؟ | الدعم العربي | الجودة | السرعة |
|--------|---------|---------------|--------------|---------|---------|
| **Anthropic Claude** | $5 لمدة 3 شهور | نعم | ⭐⭐⭐⭐⭐ | عالية جداً | سريع |
| **OpenAI** | $5 لمدة 3 شهور | نعم | ⭐⭐⭐⭐⭐ | عالية جداً | سريع |
| **Hugging Face** | مجاني للأبد | لا | ⭐⭐⭐⭐ | جيدة | متوسط |
| **Google Cloud** | حدود شهرية | نعم | ⭐⭐⭐⭐⭐ | عالية | سريع |
| **Azure** | 12 شهر | نعم | ⭐⭐⭐⭐⭐ | عالية | سريع |
| **Whisper.cpp** | مجاني للأبد | لا | ⭐⭐⭐⭐ | جيدة | سريع جداً |
| **Piper TTS** | مجاني للأبد | لا | ⭐⭐⭐ | متوسطة | سريع |

---

## 🎯 الاستراتيجية الموصى بها للاختبار

### المرحلة 1: اختبار أولي (شهر واحد)
```
استخدم:
- Hugging Face (للمحادثات) - مجاني تماماً
- Google Cloud Free Tier (للصوت) - مجاني شهرياً

💰 التكلفة: $0
📊 عدد المحادثات: 200-300 محادثة
```

### المرحلة 2: اختبار موسّع (شهرين)
```
استخدم:
- Claude API ($5 مجاني) - للمحادثات
- OpenAI ($5 مجاني) - للصوت

💰 التكلفة: $0 (رصيد مجاني)
📊 عدد المحادثات: 500-700 محادثة
```

### المرحلة 3: MVP (3 أشهر)
```
استخدم:
- Azure Free Tier - 12 شهر مجاني
- Google Cloud Free Tier - مجاني شهرياً

💰 التكلفة: $0
📊 عدد المحادثات: 1000+ محادثة شهرياً
```

---

## 💡 نصائح للاقتصاد في الـ API

### 1. Caching (التخزين المؤقت)
```javascript
const cache = new Map();

async function getCachedResponse(prompt) {
  const cacheKey = hash(prompt);
  
  // تحقق من الـ cache أولاً
  if (cache.has(cacheKey)) {
    console.log('استخدام الرد المخزّن');
    return cache.get(cacheKey);
  }
  
  // إذا لم يوجد، اطلب من API
  const response = await callAPI(prompt);
  cache.set(cacheKey, response);
  
  return response;
}
```

### 2. استخدم الموديلات الأرخص للمهام البسيطة
```javascript
// بدلاً من استخدام Sonnet دائماً
function chooseModel(taskComplexity) {
  if (taskComplexity === 'simple') {
    return 'claude-haiku-3-5'; // أرخص 10x
  } else if (taskComplexity === 'medium') {
    return 'claude-sonnet-4';
  } else {
    return 'claude-opus-4'; // للمهام المعقدة فقط
  }
}
```

### 3. حدد max_tokens بذكاء
```javascript
const response = await anthropic.messages.create({
  model: "claude-haiku-3-5-20241022",
  max_tokens: 300, // بدلاً من 1000
  messages: [
    {
      role: "user",
      content: "رد بجملتين فقط: " + userMessage
    }
  ]
});
```

### 4. استخدم Stream للتوفير
```javascript
// Streaming يوفر التكلفة لأنك تدفع فقط لما تستخدمه
const stream = await anthropic.messages.stream({
  model: "claude-haiku-3-5-20241022",
  max_tokens: 500,
  messages: [...]
});

for await (const chunk of stream) {
  // استخدم الـ chunks
  if (shouldStop()) {
    stream.abort(); // أوقف مبكراً = توفير
    break;
  }
}
```

---

## 🚀 مثال عملي: Setup كامل بدون تكلفة

### الخيار 1: بدون بطاقة ائتمان نهائياً

```javascript
// server.js - Setup مجاني 100%

const express = require('express');
const { HfInference } = require('@huggingface/inference');

const app = express();
const hf = new HfInference(process.env.HF_TOKEN); // مجاني من huggingface.co

// المحادثات (بدلاً من Claude)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  const response = await hf.textGeneration({
    model: 'meta-llama/Llama-3.2-3B-Instruct',
    inputs: `أنت مساعد ودود. السؤال: ${message}. الإجابة:`,
    parameters: {
      max_new_tokens: 300,
      temperature: 0.7
    }
  });
  
  res.json({ reply: response.generated_text });
});

// تحويل الكلام لنص (محلياً باستخدام Whisper.cpp)
app.post('/api/transcribe', async (req, res) => {
  // استخدم whisper.cpp محلياً (مجاني تماماً)
  const result = await transcribeLocally(req.file.path);
  res.json({ text: result });
});

// تحويل النص لكلام (محلياً باستخدام Piper)
app.post('/api/speak', async (req, res) => {
  const { text } = req.body;
  // استخدم Piper محلياً (مجاني تماماً)
  const audioPath = await generateSpeechLocally(text);
  res.sendFile(audioPath);
});

app.listen(3000);
```

### الخيار 2: مع بطاقة ائتمان (للتحقق فقط)

```javascript
// server.js - استخدام Google Cloud Free Tier

const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { SpeechClient } = require('@google-cloud/speech');
const Anthropic = require('@anthropic-ai/sdk');

const ttsClient = new TextToSpeechClient();
const speechClient = new SpeechClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // $5 مجاني
});

// استخدم نفس الكود من المثال السابق
// ولكن مع APIs المجانية
```

---

## 📋 Checklist: هل أنت مستعد للاختبار؟

### ✅ للاختبار بدون بطاقة ائتمان:
- [ ] سجلت حساب Hugging Face
- [ ] حصلت على HF Token
- [ ] نزّلت Whisper.cpp
- [ ] نزّلت Piper TTS
- [ ] اختبرت الموديلات محلياً

### ✅ للاختبار مع رصيد مجاني:
- [ ] سجلت حساب Anthropic ($5)
- [ ] سجلت حساب OpenAI ($5)
- [ ] سجلت حساب Google Cloud ($300)
- [ ] سجلت حساب Azure (12 شهر)
- [ ] أضفت بطاقة للتحقق

### ✅ للتوفير:
- [ ] طبّقت نظام Caching
- [ ] حدّدت max_tokens بذكاء
- [ ] استخدمت الموديلات الأرخص
- [ ] فعّلت monitoring للاستخدام

---

## 🎉 ملخص سريع

**أفضل خيار للبداية:**
1. ابدأ بـ Hugging Face (مجاني تماماً)
2. إذا احتجت جودة أعلى، استخدم Google Cloud Free Tier
3. للإنتاج، انتقل لـ Claude + OpenAI

**إجمالي الاختبار المجاني:**
- بدون بطاقة: مجاني للأبد (مع قيود)
- مع بطاقة: 3-12 شهر مجاني ($318 رصيد مجاني)

**عدد المحادثات:**
- يمكنك اختبار 1000-2000 محادثة مجاناً! 🎉

---

تم تحديث الدليل: ديسمبر 2025
جميع المعلومات محدّثة وصحيحة ✅