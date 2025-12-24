// ===================================
// Backend API Implementation Example
// ===================================

// backend/server.js
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ dest: 'uploads/' });

// ===================================
// 1. Endpoint: بدء محادثة جديدة
// ===================================
app.post('/api/conversations/start', async (req, res) => {
  const { characterId, behaviorId, userId } = req.body;
  
  try {
    // جلب بيانات الشخصية والسلوك من قاعدة البيانات
    const character = await getCharacter(characterId);
    const behavior = await getBehavior(behaviorId);
    
    // إنشاء System Prompt مخصص
    const systemPrompt = createSystemPrompt(character, behavior);
    
    // إرسال أول رسالة ترحيبية من Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: "ابدأ المحادثة مع الطفل وعرّف عن نفسك"
      }]
    });
    
    const welcomeText = message.content[0].text;
    
    // تحويل النص إلى صوت
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: getVoiceForCharacter(character), // "alloy", "shimmer", etc.
      input: welcomeText,
      response_format: "mp3"
    });
    
    // حفظ الملف الصوتي
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioPath = `audio/${Date.now()}.mp3`;
    fs.writeFileSync(audioPath, audioBuffer);
    
    // حفظ المحادثة في قاعدة البيانات
    const conversationId = await saveConversation({
      userId,
      characterId,
      behaviorId,
      messages: [{ role: 'assistant', content: welcomeText }]
    });
    
    res.json({
      success: true,
      conversationId,
      welcomeText,
      audioUrl: `/audio/${audioPath}`,
      duration: estimateAudioDuration(welcomeText)
    });
    
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'فشل بدء المحادثة' });
  }
});

// ===================================
// 2. Endpoint: إرسال رسالة صوتية من الطفل
// ===================================
app.post('/api/messages/voice', upload.single('audio'), async (req, res) => {
  const { conversationId } = req.body;
  const audioFile = req.file;
  
  try {
    // 1. تحويل الصوت إلى نص باستخدام Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.path),
      model: "whisper-1",
      language: "ar",
      response_format: "text"
    });
    
    const userMessage = transcription;
    console.log('Child said:', userMessage);
    
    // 2. جلب سياق المحادثة السابقة
    const conversation = await getConversation(conversationId);
    const previousMessages = conversation.messages;
    
    // 3. إرسال الرسالة إلى Claude للحصول على رد
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: conversation.systemPrompt,
      messages: [
        ...previousMessages,
        {
          role: "user",
          content: userMessage
        }
      ]
    });
    
    const aiResponse = message.content[0].text;
    console.log('AI responded:', aiResponse);
    
    // 4. تحويل رد Claude إلى صوت
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: conversation.voice,
      input: aiResponse,
      response_format: "mp3"
    });
    
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioPath = `audio/${Date.now()}.mp3`;
    fs.writeFileSync(audioPath, audioBuffer);
    
    // 5. حفظ الرسائل في قاعدة البيانات
    await updateConversation(conversationId, {
      messages: [
        ...previousMessages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ]
    });
    
    // 6. حذف الملف الصوتي المؤقت
    fs.unlinkSync(audioFile.path);
    
    res.json({
      success: true,
      userMessage,
      aiResponse,
      audioUrl: `/audio/${audioPath}`,
      duration: estimateAudioDuration(aiResponse)
    });
    
  } catch (error) {
    console.error('Error processing voice message:', error);
    res.status(500).json({ error: 'فشل معالجة الرسالة الصوتية' });
  }
});

// ===================================
// 3. Endpoint: إنهاء المحادثة
// ===================================
app.post('/api/conversations/end', async (req, res) => {
  const { conversationId } = req.body;
  
  try {
    const conversation = await getConversation(conversationId);
    
    // إنشاء رسالة ختامية من الشخصية
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: conversation.systemPrompt,
      messages: [
        ...conversation.messages,
        {
          role: "user",
          content: "قل للطفل وداعاً وشجعه على تطبيق ما تعلمه"
        }
      ]
    });
    
    const farewellText = message.content[0].text;
    
    // تحويل إلى صوت
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: conversation.voice,
      input: farewellText,
      response_format: "mp3"
    });
    
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioPath = `audio/${Date.now()}.mp3`;
    fs.writeFileSync(audioPath, audioBuffer);
    
    // تحديث حالة المحادثة
    await updateConversation(conversationId, {
      status: 'ended',
      endedAt: new Date(),
      messages: [
        ...conversation.messages,
        { role: 'assistant', content: farewellText }
      ]
    });
    
    // إنشاء ملخص للآباء
    const summary = await generateConversationSummary(conversation);
    
    res.json({
      success: true,
      farewellText,
      audioUrl: `/audio/${audioPath}`,
      summary
    });
    
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({ error: 'فشل إنهاء المحادثة' });
  }
});

// ===================================
// Helper Functions
// ===================================

function createSystemPrompt(character, behavior) {
  return `أنت ${character.name}، ${character.description}.

المهمة: مساعدة الطفل على تعلم وتطبيق "${behavior.name}".

القواعد الأساسية:
1. استخدم لغة بسيطة وواضحة مناسبة للأطفال (5-12 سنة)
2. كن إيجابياً ومشجعاً دائماً
3. اطرح أسئلة تفاعلية لإشراك الطفل
4. شارك قصصاً قصيرة من تجاربك كشخصية ${character.name}
5. لا تتجاوز 3-4 جمل في كل رد
6. استخدم الإيموجي بشكل معتدل (1-2 إيموجي في كل رد)
7. شجع الطفل على التفكير والمشاركة
8. احتفل بالإنجازات الصغيرة

الشخصية:
${character.personality}

السلوك المستهدف:
${behavior.prompt}

أمثلة على كيفية تشجيع هذا السلوك:
${behavior.examples}

قواعد الأمان (مهم جداً):
- لا تطلب أي معلومات شخصية من الطفل
- لا تعط نصائح طبية أو نفسية متخصصة
- ركز فقط على السلوك المحدد
- إذا شعرت أن الطفل يحتاج مساعدة متخصصة، اقترح التحدث مع الوالدين
- توقف عن المحادثة إذا كان المحتوى غير مناسب

تذكر: أنت ${character.name}، وهدفك هو إلهام الطفل وتشجيعه بطريقة ممتعة!`;
}

function getVoiceForCharacter(character) {
  // اختيار الصوت المناسب للشخصية
  const voiceMapping = {
    'elsa': 'shimmer',     // صوت أنثوي ناعم
    'spiderman': 'onyx',   // صوت ذكوري شاب
    'moana': 'nova',       // صوت أنثوي حيوي
    'antar': 'fable'       // صوت ذكوري قوي
  };
  
  return voiceMapping[character.id] || 'alloy';
}

function estimateAudioDuration(text) {
  // تقدير مدة الصوت بناءً على عدد الكلمات
  // معدل تقريبي: 150 كلمة في الدقيقة للعربية
  const words = text.split(' ').length;
  const duration = (words / 150) * 60; // بالثواني
  return Math.ceil(duration);
}

async function generateConversationSummary(conversation) {
  // استخدام Claude لإنشاء ملخص للآباء
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `اكتب ملخصاً قصيراً للآباء عن هذه المحادثة:

الشخصية: ${conversation.character.name}
السلوك: ${conversation.behavior.name}
عدد الرسائل: ${conversation.messages.length}

المحادثة:
${conversation.messages.map(m => `${m.role === 'user' ? 'الطفل' : conversation.character.name}: ${m.content}`).join('\n')}

الملخص يجب أن يتضمن:
1. ما الذي تعلمه الطفل
2. مدى تفاعل الطفل
3. اقتراحات للآباء لتعزيز هذا السلوك`
    }]
  });
  
  return message.content[0].text;
}

// ===================================
// Database Helper Functions (مثال)
// ===================================

async function getCharacter(characterId) {
  // في الواقع، هذا سيأتي من قاعدة البيانات
  return {
    id: characterId,
    name: 'إلسا',
    description: 'ملكة الثلج الشجاعة والحكيمة',
    personality: 'حنونة، صبورة، تشجع على التحدي والتغلب على المخاوف',
    category: 'ديزني'
  };
}

async function getBehavior(behaviorId) {
  return {
    id: behaviorId,
    name: 'الترتيب والنظافة',
    prompt: 'تشجيع الطفل على ترتيب غرفته والحفاظ على نظافته الشخصية',
    examples: [
      'ترتيب الألعاب بعد اللعب',
      'وضع الملابس في مكانها',
      'تنظيف الأسنان يومياً'
    ]
  };
}

async function saveConversation(data) {
  // حفظ في MongoDB أو PostgreSQL
  // return conversationId
  return 'conv_' + Date.now();
}

async function getConversation(conversationId) {
  // جلب من قاعدة البيانات
  return {
    id: conversationId,
    systemPrompt: '...',
    voice: 'shimmer',
    messages: [],
    character: {},
    behavior: {}
  };
}

async function updateConversation(conversationId, updates) {
  // تحديث في قاعدة البيانات
  return true;
}

// ===================================
// Frontend Implementation Example
// ===================================

// frontend/src/hooks/useVoiceChat.js
import { useState, useRef } from 'react';

export function useVoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        
        // إيقاف المايكروفون
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('فشل الوصول إلى المايكروفون');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };
  
  const sendVoiceMessage = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('conversationId', conversationId);
      
      const response = await fetch('/api/messages/voice', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // عرض رسالة المستخدم
        addMessage({
          from: 'user',
          text: data.userMessage
        });
        
        // تشغيل رد الشخصية
        await playAudio(data.audioUrl);
        
        // عرض رسالة الشخصية
        addMessage({
          from: 'character',
          text: data.aiResponse
        });
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const playAudio = async (audioUrl) => {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onended = resolve;
      audio.play();
    });
  };
  
  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording
  };
}

// ===================================
// Content Moderation (مهم للأمان)
// ===================================

async function moderateContent(text) {
  const moderation = await openai.moderations.create({
    input: text
  });
  
  const result = moderation.results[0];
  
  if (result.flagged) {
    console.warn('Inappropriate content detected:', result.categories);
    return {
      safe: false,
      categories: result.categories
    };
  }
  
  return { safe: true };
}

// ===================================
// WebSocket للمحادثات الفورية (اختياري)
// ===================================

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('start-conversation', async (data) => {
    const { characterId, behaviorId, userId } = data;
    // ... بدء المحادثة
    socket.emit('conversation-started', { conversationId, welcomeMessage });
  });
  
  socket.on('voice-message', async (audioBlob) => {
    // معالجة الرسالة الصوتية
    socket.emit('processing');
    
    // ... معالجة وإرسال الرد
    
    socket.emit('ai-response', { text, audioUrl });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ===================================
// Rate Limiting (للحماية)
// ===================================

const rateLimit = require('express-rate-limit');

const voiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 50, // حد أقصى 50 رسالة
  message: 'الكثير من الطلبات. يرجى المحاولة مرة أخرى لاحقاً.'
});

app.use('/api/messages/voice', voiceLimiter);

// ===================================
// Caching للأداء
// ===================================

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // ساعة واحدة

async function getCachedCharacter(characterId) {
  const cacheKey = `character_${characterId}`;
  let character = cache.get(cacheKey);
  
  if (!character) {
    character = await getCharacter(characterId);
    cache.set(cacheKey, character);
  }
  
  return character;
}

// ===================================
// Error Handling Middleware
// ===================================

app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'حدث خطأ في الخادم',
      code: error.code || 'INTERNAL_ERROR'
    }
  });
});

// ===================================
// Start Server
// ===================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});