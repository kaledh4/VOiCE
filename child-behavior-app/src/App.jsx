import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Star, Sparkles, Zap, Heart, Trophy, Users, ChevronRight, Play, Pause, X, Loader2, AlertCircle, Volume2, Shield, Info, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, speak, validateInput, logInteraction } from './api';

const ChildBehaviorApp = () => {
  // Core States
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [aiStatus, setAiStatus] = useState(''); // 'thinking', 'speaking', 'listening'
  const [error, setError] = useState(null);
  const [showParentInfo, setShowParentInfo] = useState(false);

  // Advanced Features
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionStats, setSessionStats] = useState({ turns: 0, duration: 0, startTime: null });
  const [parentalControls, _setParentalControls] = useState({ timeLimit: 10, maxTurns: 15 }); // minutes
  const [achievements, setAchievements] = useState([]);
  const [childName, setChildName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const sessionTimerRef = useRef(null);
  const [isMicActuallyWorking, setIsMicActuallyWorking] = useState(false);
  const noSpeechTimeoutRef = useRef(null);
  const turnCountRef = useRef(0);

  // Enhanced Characters with more depth
  const characters = [
    {
      id: 'zuzu',
      name: 'زوزو القوية',
      emoji: '💪',
      color: '#FF6B9D',
      personality: 'قوية وشجاعة',
      description: 'بطلة خارقة تحب التحديات',
      traits: ['شجاعة', 'نشيطة', 'محفزة'],
      greeting: 'يا سلام! أنا زوزو وأنا هنا علشان نكون أقوى سوا!'
    },
    {
      id: 'elsa',
      name: 'إلسا',
      emoji: '❄️',
      color: '#4FACFE',
      personality: 'حكيمة وهادئة',
      description: 'ملكة الثلج الطيبة',
      traits: ['حكيمة', 'هادئة', 'صبورة'],
      greeting: 'مرحباً عزيزي، أنا إلسا وأنا سعيدة بلقائك'
    },
    {
      id: 'spiderman',
      name: 'سبايدرمان',
      emoji: '🕷️',
      color: '#E94560',
      personality: 'ذكي ومرح',
      description: 'البطل الخارق',
      traits: ['ذكي', 'سريع', 'مرح'],
      greeting: 'يو! أنا سبايدرمان، جاهز للمغامرة؟'
    },
    {
      id: 'moana',
      name: 'موانا',
      emoji: '🌊',
      color: '#00D9FF',
      personality: 'مغامرة وطموحة',
      description: 'المستكشفة الشجاعة',
      traits: ['مغامرة', 'شجاعة', 'طموحة'],
      greeting: 'أهلاً يا بطل! أنا موانا ومستعدة لمغامرة جديدة!'
    },
    {
      id: 'antar',
      name: 'عنتر',
      emoji: '🗡️',
      color: '#FFB800',
      personality: 'شجاع ونبيل',
      description: 'الفارس العربي',
      traits: ['شجاع', 'نبيل', 'قوي'],
      greeting: 'السلام عليكم يا فتى، أنا عنتر بن شداد'
    },
    {
      id: 'aisha',
      name: 'عائشة العالمة',
      emoji: '🔬',
      color: '#9B59B6',
      personality: 'ذكية وفضولية',
      description: 'العالمة الصغيرة',
      traits: ['ذكية', 'فضولية', 'مبدعة'],
      greeting: 'مرحباً! أنا عائشة وأحب اكتشاف الأشياء الجديدة'
    }
  ];

  // Enhanced Behaviors with educational content
  const behaviors = [
    {
      id: 'tidiness',
      name: 'الترتيب والنظافة',
      emoji: '🧹',
      color: '#4ECDC4',
      shortDesc: 'غرفة مرتبة، عقل صافي',
      tips: ['رتب ألعابك بعد اللعب', 'اغسل يديك قبل الأكل', 'حافظ على غرفتك نظيفة'],
      benefits: 'يساعدك على التركيز والشعور بالراحة'
    },
    {
      id: 'respect',
      name: 'احترام الوالدين',
      emoji: '❤️',
      color: '#FF6B9D',
      shortDesc: 'قلب مليء بالحب',
      tips: ['استمع لوالديك بانتباه', 'قل شكراً عندما يساعدونك', 'ساعدهم في المنزل'],
      benefits: 'يجعل العائلة سعيدة ومترابطة'
    },
    {
      id: 'homework',
      name: 'المذاكرة',
      emoji: '📚',
      color: '#A8E6CF',
      shortDesc: 'التعلم مغامرة ممتعة',
      tips: ['اختر وقتاً هادئاً للدراسة', 'خذ استراحات قصيرة', 'اسأل عما لا تفهمه'],
      benefits: 'يجعلك أذكى وأكثر ثقة'
    },
    {
      id: 'sharing',
      name: 'المشاركة',
      emoji: '🤝',
      color: '#FFD93D',
      shortDesc: 'العطاء يسعد القلب',
      tips: ['شارك ألعابك مع أصدقائك', 'ساعد من يحتاج المساعدة', 'كن كريماً'],
      benefits: 'يجعلك محبوباً وتكسب أصدقاء كثر'
    },
    {
      id: 'honesty',
      name: 'الصدق',
      emoji: '✨',
      color: '#95E1D3',
      shortDesc: 'الصدق ينير الطريق',
      tips: ['قل الحقيقة دائماً', 'لا تخف من الاعتراف بالخطأ', 'كن أميناً'],
      benefits: 'يبني الثقة ويجعل الجميع يحترمونك'
    },
    {
      id: 'sleep',
      name: 'النوم المبكر',
      emoji: '🌙',
      color: '#AA96DA',
      shortDesc: 'نم جيداً، استيقظ بطلاً',
      tips: ['اذهب للنوم في نفس الوقت كل يوم', 'ابتعد عن الشاشات قبل النوم', 'اقرأ قصة قبل النوم'],
      benefits: 'يجعلك نشيطاً ومستعداً ليوم رائع'
    },
    {
      id: 'healthy_eating',
      name: 'الأكل الصحي',
      emoji: '🥗',
      color: '#66BB6A',
      shortDesc: 'جسم قوي بالغذاء الجيد',
      tips: ['تناول الخضروات والفواكه', 'اشرب الماء بكثرة', 'قلل من الحلويات'],
      benefits: 'يجعلك قوياً وصحياً'
    },
    {
      id: 'kindness',
      name: 'اللطف مع الآخرين',
      emoji: '🌸',
      color: '#F48FB1',
      shortDesc: 'ابتسامتك تنشر السعادة',
      tips: ['ابتسم للآخرين', 'قل كلمات طيبة', 'ساعد من يحتاج'],
      benefits: 'يجعل العالم مكاناً أفضل'
    }
  ];

  // --- Function Definitions ---

  // Achievement System
  const checkAchievements = useCallback(() => {
    const newAchievements = [];

    if (turnCountRef.current >= 5 && !achievements.includes('first_conversation')) {
      newAchievements.push({ id: 'first_conversation', name: 'محادث ماهر', emoji: '🗣️' });
    }

    if (turnCountRef.current >= 10 && !achievements.includes('great_conversationalist')) {
      newAchievements.push({ id: 'great_conversationalist', name: 'محادث رائع', emoji: '💬' });
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
    }
  }, [achievements]);

  const endCall = useCallback((reason = 'user') => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    isProcessingRef.current = false;
    setAiStatus('');

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore error if already stopped */ }
    }

    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }

    window.speechSynthesis.cancel();

    // Log session data
    logInteraction({
      character: selectedCharacter?.id,
      behavior: selectedBehavior?.id,
      duration: sessionStats.duration,
      turns: turnCountRef.current,
      reason: reason,
      childName: childName
    });

    // Show completion message based on reason
    if (reason === 'time_limit') {
      setError("انتهى وقت المحادثة! أحسنت، نراك في المرة القادمة 🌟");
    } else if (reason === 'turn_limit') {
      setError("محادثة رائعة! دعنا نأخذ استراحة الآن 🎉");
    }

    checkAchievements();
  }, [selectedCharacter, selectedBehavior, sessionStats.duration, childName, checkAchievements]);

  const startListening = useCallback(() => {
    if (!isCallActiveRef.current) return;
    setAiStatus('listening');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Recognition already started or error:", e);
      }
    }
  }, []);

  const handleAIInteraction = useCallback(async (userText) => {
    if (!isCallActiveRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setAiStatus('thinking');
    turnCountRef.current += 1;

    // Stop recognition while processing and speaking
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore error if already stopped */ }
    }

    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }

    // Add to conversation history
    setConversationHistory(prev => [...prev, { speaker: 'child', text: userText }]);

    const aiTimeout = setTimeout(() => {
      if (isProcessingRef.current && aiStatus === 'thinking') {
        console.log("AI timeout, using fallback");
      }
    }, 12000);

    try {
      const response = await getAIResponse(
        selectedCharacter,
        selectedBehavior,
        userText,
        conversationHistory,
        childName
      );

      clearTimeout(aiTimeout);

      const textToSpeak = response || "أنت رائع جداً! استمر في الحديث!";

      // Add AI response to history
      setConversationHistory(prev => [...prev, { speaker: 'ai', text: textToSpeak }]);

      setAiStatus('speaking');
      await speak(textToSpeak, selectedCharacter.id);

    } catch (err) {
      console.error("AI Error:", err);
      setAiStatus('speaking');

      const fallbackResponses = [
        "أنا أسمعك يا بطل، أنت رائع!",
        "ما شاء الله عليك! أخبرني المزيد",
        "يا لك من بطل ذكي! استمر",
        "أنت تجعلني فخوراً جداً!"
      ];

      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      await speak(randomResponse, selectedCharacter.id);

    } finally {
      isProcessingRef.current = false;

      if (isCallActiveRef.current) {
        startListening();
      }
    }
  }, [selectedCharacter, selectedBehavior, conversationHistory, childName, aiStatus, startListening]);

  const initialGreeting = useCallback(async () => {
    if (!isCallActiveRef.current) return;
    setAiStatus('speaking');

    const personalGreeting = childName
      ? `أهلاً ${childName}! أنا ${selectedCharacter.name}.`
      : `أهلاً يا بطل! أنا ${selectedCharacter.name}.`;

    const greeting = `${personalGreeting} ${selectedCharacter.greeting} اليوم سنتحدث عن ${selectedBehavior.name} ${selectedBehavior.emoji}. هل أنت مستعد؟`;

    await speak(greeting, selectedCharacter.id);

    if (isCallActiveRef.current) startListening();
  }, [selectedCharacter, selectedBehavior, childName, startListening]);

  const playRingingSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const playTone = (freq, start, duration = 0.5) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    // Create a more pleasant ringing pattern
    for (let i = 0; i < 4; i++) {
      playTone(523.25, now + i * 2); // C5
      playTone(659.25, now + i * 2 + 0.3); // E5
      playTone(783.99, now + i * 2 + 0.6); // G5
    }
  }, []);

  const startCall = useCallback(() => {
    if (!selectedCharacter || !selectedBehavior) return;

    setIsRinging(true);
    isCallActiveRef.current = true;
    isProcessingRef.current = false;
    turnCountRef.current = 0;

    playRingingSound();

    setTimeout(() => {
      setIsRinging(false);
      setIsCallActive(true);
      initialGreeting();
    }, 4000);
  }, [selectedCharacter, selectedBehavior, playRingingSound, initialGreeting]);

  const initializeApp = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);
    setShowNamePrompt(true);

    // Unlock AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA';

      recognition.onstart = () => {
        setIsMicActuallyWorking(true);
        console.log("Recognition started");

        // Set timeout for no speech detected
        noSpeechTimeoutRef.current = setTimeout(() => {
          if (isCallActiveRef.current) {
            handleAIInteraction("لم أسمع شيئاً");
          }
        }, 8000);
      };

      recognition.onresult = (event) => {
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
        }

        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        console.log(`Recognized: ${transcript} (confidence: ${confidence})`);

        if (transcript && !isProcessingRef.current) {
          // Validate input before processing
          const validationResult = validateInput(transcript);
          if (validationResult.isValid) {
            handleAIInteraction(transcript);
          } else {
            handleAIInteraction("آسف، لم أفهم جيداً. هل يمكنك إعادة ما قلت؟");
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        setIsMicActuallyWorking(false);

        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
        }

        if (event.error === 'not-allowed') {
          setError("يرجى السماح بالميكروفون من إعدادات المتصفح");
        } else if (event.error === 'no-speech') {
          if (isCallActiveRef.current) {
            handleAIInteraction("لم أسمع شيئاً");
          }
        }
      };

      recognition.onend = () => {
        setIsMicActuallyWorking(false);
        console.log("Recognition ended");

        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
        }

        // Only auto-restart if we are in listening mode and NOT processing
        if (isCallActiveRef.current && window.currentAiStatus === 'listening' && !isProcessingRef.current) {
          setTimeout(() => {
            try { recognition.start(); } catch (e) { console.log("Cannot restart recognition:", e); }
          }, 500);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError("متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge.");
    }

    // Trigger a silent sound to unlock audio on iOS
    const utterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(utterance);
  }, [hasStarted, handleAIInteraction]);

  // --- Effects ---

  // Sync AI status to window for recognition.onend access
  useEffect(() => {
    window.currentAiStatus = aiStatus;
  }, [aiStatus]);

  // Session Timer
  useEffect(() => {
    if (isCallActive && !sessionStats.startTime) {
      setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
      sessionTimerRef.current = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isCallActive, sessionStats.startTime]);

  // Check time limits
  useEffect(() => {
    if (sessionStats.duration >= parentalControls.timeLimit * 60) {
      endCall('time_limit');
    }
    if (turnCountRef.current >= parentalControls.maxTurns) {
      endCall('turn_limit');
    }
  }, [sessionStats.duration, parentalControls, endCall]);


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #FFF9F0 0%, #FFE8E0 50%, #FFD5CC 100%)',
      fontFamily: '"Tajawal", "Cairo", "Vazirmatn", sans-serif',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        right: '-10%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(255,107,157,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-15%',
        left: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(74,172,254,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Start Overlay */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(102,126,234,0.95) 0%, rgba(118,75,162,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              zIndex: 3000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              style={{ fontSize: '100px', marginBottom: '30px' }}
            >
              🚀
            </motion.div>

            <h1 style={{
              fontSize: 'clamp(36px, 8vw, 56px)',
              fontWeight: 900,
              color: 'white',
              marginBottom: '15px',
              textShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              مرحباً بك في رحلة الأبطال!
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 4vw, 22px)',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '40px',
              maxWidth: '600px',
              lineHeight: 1.6
            }}>
              استعد لمغامرة تعليمية ممتعة مع أبطالك المفضلين!
              ستتعلم سلوكيات إيجابية بطريقة ممتعة وتفاعلية.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeApp}
              style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '50px',
                padding: '22px 70px',
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              <Sparkles size={32} />
              ابدأ المغامرة الآن
            </motion.button>

            <div style={{
              marginTop: '40px',
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              color: 'white',
              opacity: 0.8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} />
                <span>آمن للأطفال</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={20} />
                <span>محتوى تربوي</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} />
                <span>تفاعلي وممتع</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Input Prompt */}
      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              zIndex: 2500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: '32px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>👋</div>
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '15px', color: '#667eea' }}>
                ما هو اسمك؟
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
                (اختياري - يمكنك تخطي هذه الخطوة)
              </p>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="اكتب اسمك هنا"
                style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: '20px',
                  border: '3px solid #e0e0e0',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontFamily: 'inherit'
                }}
                maxLength={20}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowNamePrompt(false);
                    setChildName('');
                  }}
                  style={{
                    flex: 1,
                    background: '#e0e0e0',
                    color: '#666',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  تخطي
                </button>
                <button
                  onClick={() => setShowNamePrompt(false)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ابدأ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        padding: '20px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            background: 'white',
            borderRadius: '32px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(102,126,234,0.15)',
            border: '3px solid rgba(102,126,234,0.1)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #FF6B9D 0%, #FFB800 33%, #4FACFE 66%, #A8E6CF 100%)'
          }} />

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #FF6B9D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px'
          }}>
            🌟 رحلة الأبطال التفاعلية 🌟
          </h1>

          {childName && (
            <p style={{ fontSize: '20px', color: '#667eea', fontWeight: 700 }}>
              أهلاً {childName}! 👋
            </p>
          )}

          {/* Session Info */}
          {isCallActive && (
            <div style={{
              marginTop: '15px',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <MessageCircle size={18} />
                <span>المحادثات: {turnCountRef.current}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <Trophy size={18} />
                <span>الوقت: {formatTime(sessionStats.duration)}</span>
              </div>
            </div>
          )}
        </motion.header>

        {/* Error Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #FFF0F0 0%, #FFE0E0 100%)',
              color: '#D63031',
              padding: '18px 28px',
              borderRadius: '20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '3px solid #FFB8B8',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(214,48,49,0.1)',
              width: '100%'
            }}
          >
            <AlertCircle size={28} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <X size={24} color="#D63031" />
            </button>
          </motion.div>
        )}

        {/* Achievements Display */}
        {achievements.length > 0 && !isCallActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              borderRadius: '24px',
              padding: '20px',
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              boxShadow: '0 8px 24px rgba(255,215,0,0.3)'
            }}
          >
            <Trophy size={40} color="white" />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 900 }}>
                إنجازاتك! 🎉
              </h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {achievements.map(ach => (
                  <span key={ach.id} style={{
                    background: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {ach.emoji} {ach.name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!isCallActive && !isRinging && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: '100%' }}
          >
            {/* Parent Info Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE8CC 100%)',
                border: '3px solid #FFD93D',
                borderRadius: '28px',
                padding: '25px 32px',
                marginBottom: '32px',
                boxShadow: '0 6px 20px rgba(255,217,61,0.15)'
              }}
            >
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '40px' }}>👨‍👩‍👧‍👦</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <strong style={{ fontSize: '20px', color: '#D97706' }}>
                      معلومات للآباء والأمهات
                    </strong>
                    <button
                      onClick={() => setShowParentInfo(!showParentInfo)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '16px',
                        fontWeight: 700
                      }}
                    >
                      {showParentInfo ? 'إخفاء' : 'المزيد'}
                      <Info size={18} />
                    </button>
                  </div>

                  <p style={{
                    fontSize: '16px',
                    color: '#92400E',
                    margin: 0,
                    lineHeight: 1.7
                  }}>
                    هذا التطبيق مصمم لتعزيز السلوكيات الإيجابية لدى الأطفال بطريقة تفاعلية وآمنة.
                    نوصي بالمراقبة الأبوية أثناء الاستخدام.
                  </p>

                  <AnimatePresence>
                    {showParentInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ marginTop: '15px' }}
                      >
                        <div style={{
                          background: 'rgba(255,255,255,0.5)',
                          padding: '20px',
                          borderRadius: '16px',
                          fontSize: '15px',
                          color: '#92400E',
                          lineHeight: 1.7
                        }}>
                          <h4 style={{ marginTop: 0, marginBottom: '12px', fontWeight: 900 }}>
                            ميزات الأمان:
                          </h4>
                          <ul style={{ margin: 0, paddingRight: '20px' }}>
                            <li>حد زمني: {parentalControls.timeLimit} دقائق لكل جلسة</li>
                            <li>حد المحادثات: {parentalControls.maxTurns} محادثة كحد أقصى</li>
                            <li>فلترة المحتوى: يتم فحص جميع المدخلات والمخرجات</li>
                            <li>لا يتم حفظ أي بيانات شخصية</li>
                            <li>محتوى تعليمي موافق عليه تربوياً</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Character Selection */}
            <section style={{ width: '100%', marginBottom: '45px' }}>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  marginBottom: '28px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Users size={36} color="#667eea" />
                اختر بطلك المفضل
              </motion.h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px'
              }}>
                {characters.map((char, idx) => (
                  <motion.button
                    key={char.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCharacter(char)}
                    style={{
                      background: selectedCharacter?.id === char.id
                        ? `linear-gradient(135deg, ${char.color}15 0%, ${char.color}25 100%)`
                        : 'white',
                      border: `4px solid ${selectedCharacter?.id === char.id ? char.color : '#f0f0f0'}`,
                      borderRadius: '28px',
                      padding: '28px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedCharacter?.id === char.id
                        ? `0 12px 32px ${char.color}30`
                        : '0 4px 12px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {selectedCharacter?.id === char.id && (
                      <motion.div
                        layoutId="selectedCharacter"
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: char.color,
                          borderRadius: '50%',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Star size={16} color="white" fill="white" />
                      </motion.div>
                    )}

                    <motion.div
                      animate={selectedCharacter?.id === char.id ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{ fontSize: '72px', marginBottom: '16px' }}
                    >
                      {char.emoji}
                    </motion.div>

                    <div style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: selectedCharacter?.id === char.id ? char.color : '#333',
                      marginBottom: '8px'
                    }}>
                      {char.name}
                    </div>

                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '10px'
                    }}>
                      {char.description}
                    </div>

                    {selectedCharacter?.id === char.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: `2px solid ${char.color}30`,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          justifyContent: 'center'
                        }}
                      >
                        {char.traits.map(trait => (
                          <span key={trait} style={{
                            background: `${char.color}20`,
                            color: char.color,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            {trait}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Behavior Selection */}
            <section style={{ width: '100%', marginBottom: '45px' }}>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  marginBottom: '28px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Sparkles size={36} color="#FF6B9D" />
                اختر السلوك الذي تريد تعلمه
              </motion.h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px'
              }}>
                {behaviors.map((b, idx) => (
                  <motion.button
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedBehavior(b)}
                    style={{
                      background: selectedBehavior?.id === b.id
                        ? `linear-gradient(135deg, ${b.color}15 0%, ${b.color}25 100%)`
                        : 'white',
                      border: `4px solid ${selectedBehavior?.id === b.id ? b.color : '#f0f0f0'}`,
                      borderRadius: '24px',
                      padding: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '12px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedBehavior?.id === b.id
                        ? `0 12px 32px ${b.color}30`
                        : '0 4px 12px rgba(0,0,0,0.05)',
                      textAlign: 'right',
                      position: 'relative'
                    }}
                  >
                    {selectedBehavior?.id === b.id && (
                      <motion.div
                        layoutId="selectedBehavior"
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: b.color,
                          borderRadius: '50%',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Star size={16} color="white" fill="white" />
                      </motion.div>
                    )}

                    <div style={{ fontSize: '48px' }}>{b.emoji}</div>

                    <div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: selectedBehavior?.id === b.id ? b.color : '#333',
                        marginBottom: '6px'
                      }}>
                        {b.name}
                      </div>

                      <div style={{
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: 1.5
                      }}>
                        {b.shortDesc}
                      </div>
                    </div>

                    {selectedBehavior?.id === b.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          paddingTop: '16px',
                          borderTop: `2px solid ${b.color}30`
                        }}
                      >
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: b.color,
                          marginBottom: '10px'
                        }}>
                          💡 نصائح سريعة:
                        </div>
                        <ul style={{
                          margin: 0,
                          paddingRight: '20px',
                          fontSize: '13px',
                          color: '#555',
                          lineHeight: 1.6
                        }}>
                          {b.tips.slice(0, 2).map((tip, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Call Button */}
            {selectedCharacter && selectedBehavior && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                style={{ width: '100%' }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startCall}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '32px',
                    padding: '32px',
                    fontSize: '30px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    boxShadow: '0 15px 40px rgba(102,126,234,0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  >
                    <Phone size={44} strokeWidth={3} />
                  </motion.div>

                  <span>اتصل بـ {selectedCharacter.name}</span>

                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronRight size={36} strokeWidth={4} />
                  </motion.div>

                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontSize: '16px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Info size={18} />
                  تأكد من تشغيل الميكروفون والصوت
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Full Screen Call Overlay */}
      <AnimatePresence>
        {(isRinging || isCallActive) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: isRinging
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : `linear-gradient(135deg, ${selectedCharacter.color}dd 0%, ${selectedCharacter.color} 50%, ${selectedCharacter.color}dd 100%)`,
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '20px',
              overflow: 'hidden'
            }}
          >
            {/* Animated Background Circles */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.3)',
                pointerEvents: 'none'
              }}
            />

            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
              style={{
                position: 'absolute',
                width: '90%',
                height: '90%',
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.2)',
                pointerEvents: 'none'
              }}
            />

            {/* Character Avatar */}
            <motion.div
              animate={{
                scale: aiStatus === 'speaking' ? [1, 1.15, 1] : aiStatus === 'listening' ? [1, 1.05, 1] : 1,
                rotate: isRinging ? [0, 5, -5, 0] : 0
              }}
              transition={{
                repeat: aiStatus ? Infinity : isRinging ? Infinity : 0,
                duration: aiStatus === 'speaking' ? 1.5 : 2
              }}
              style={{
                width: 'min(280px, 65vw)',
                height: 'min(280px, 65vw)',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'min(140px, 35vw)',
                marginBottom: '35px',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                position: 'relative',
                border: '6px solid rgba(255,255,255,0.3)'
              }}
            >
              {selectedCharacter.emoji}

              {aiStatus === 'speaking' && (
                <motion.div
                  animate={{ scale: [0.9, 1.1, 0.9] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: '#4CAF50',
                    borderRadius: '50%',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(76,175,80,0.4)'
                  }}
                >
                  <Volume2 size={28} color="white" />
                </motion.div>
              )}

              {aiStatus === 'listening' && isMicActuallyWorking && (
                <motion.div
                  animate={{ scale: [0.9, 1.1, 0.9] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: '#E74C3C',
                    borderRadius: '50%',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(231,76,60,0.4)'
                  }}
                >
                  <Mic size={28} color="white" />
                </motion.div>
              )}
            </motion.div>

            {/* Character Name and Status */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: 'clamp(36px, 8vw, 64px)',
                fontWeight: 900,
                marginBottom: '12px',
                textShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {selectedCharacter.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: 'clamp(20px, 5vw, 32px)',
                opacity: 0.95,
                marginBottom: '50px',
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {isRinging ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  جاري الاتصال... 📞
                </motion.span>
              ) : (
                `${selectedBehavior.emoji} ${selectedBehavior.name}`
              )}
            </motion.p>

            {/* AI Status Display */}
            {!isRinging && (
              <div style={{
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '25px',
                marginBottom: '30px'
              }}>
                <AnimatePresence mode="wait">
                  {aiStatus === 'listening' && (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px'
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: isMicActuallyWorking ? [1, 1.3, 1] : 1,
                          boxShadow: isMicActuallyWorking
                            ? ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 20px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0.4)']
                            : '0 0 0 0 rgba(255,255,255,0)'
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{
                          background: isMicActuallyWorking ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
                          padding: '30px',
                          borderRadius: '50%',
                          border: '4px solid rgba(255,255,255,0.4)'
                        }}
                      >
                        <Mic size={70} strokeWidth={2.5} />
                      </motion.div>

                      <div style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        textAlign: 'center',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        {isMicActuallyWorking ? 'أنا أسمعك... تحدث! 🎤' : 'جاري تشغيل الميكروفون... ⏳'}
                      </div>

                      {isMicActuallyWorking && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                          }}
                        >
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: [20, 40, 20],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: i * 0.1
                              }}
                              style={{
                                width: '6px',
                                background: 'white',
                                borderRadius: '3px',
                                opacity: 0.8
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {aiStatus === 'thinking' && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px'
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      >
                        <Loader2 size={70} strokeWidth={2.5} />
                      </motion.div>

                      <div style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        مممم... دعني أفكر... 💭
                      </div>

                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{
                          fontSize: '18px',
                          opacity: 0.9
                        }}
                      >
                        جاري تحضير الرد المثالي...
                      </motion.div>
                    </motion.div>
                  )}

                  {aiStatus === 'speaking' && (
                    <motion.div
                      key="speaking"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px'
                      }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{
                          background: 'rgba(255,255,255,0.25)',
                          padding: '30px',
                          borderRadius: '50%',
                          border: '4px solid rgba(255,255,255,0.4)'
                        }}
                      >
                        <Volume2 size={70} strokeWidth={2.5} />
                      </motion.div>

                      <div style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        استمع إلي جيداً! 🌟
                      </div>

                      <motion.div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'flex-end'
                        }}
                      >
                        {[...Array(7)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [15, 45, 15],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay: i * 0.1
                            }}
                            style={{
                              width: '5px',
                              background: 'white',
                              borderRadius: '3px',
                              opacity: 0.9
                            }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual Retry Button */}
                {aiStatus === 'listening' && !isMicActuallyWorking && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startListening()}
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '3px solid rgba(255,255,255,0.4)',
                      borderRadius: '20px',
                      padding: '14px 28px',
                      fontSize: '18px',
                      color: 'white',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Mic size={22} />
                    اضغط هنا لتفعيل الميكروفون
                  </motion.button>
                )}
              </div>
            )}

            {/* Session Stats (only when active) */}
            {isCallActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  top: '30px',
                  display: 'flex',
                  gap: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px 24px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={20} />
                  {turnCountRef.current}
                </div>
                <div style={{ width: '2px', background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={20} />
                  {formatTime(sessionStats.duration)}
                </div>
              </motion.div>
            )}

            {/* End Call Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => endCall('user')}
              style={{
                background: 'linear-gradient(135deg, #FF4757 0%, #E63946 100%)',
                borderRadius: '50%',
                width: '110px',
                height: '110px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 20px 50px rgba(255,71,87,0.5)',
                marginTop: '30px',
                border: '4px solid rgba(255,255,255,0.3)',
                position: 'relative'
              }}
            >
              <PhoneOff size={56} color="white" strokeWidth={3} />

              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  position: 'absolute',
                  inset: -10,
                  borderRadius: '50%',
                  border: '4px solid rgba(255,71,87,0.5)'
                }}
              />
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: '20px',
                fontSize: '18px',
                opacity: 0.9,
                fontWeight: 700
              }}
            >
              اضغط لإنهاء المكالمة
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Cairo:wght@400;700;900&family=Vazirmatn:wght@400;700;900&display=swap');
        
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #FFF9F0;
          font-family: 'Tajawal', 'Cairo', 'Vazirmatn', sans-serif;
        }
        
        button {
          font-family: inherit;
        }
        
        input {
          font-family: inherit;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #667eea;
        }
      `}</style>
    </div>
  );
};

export default ChildBehaviorApp;