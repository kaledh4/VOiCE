import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Star, Sparkles, Zap, Heart, Trophy, Users, ChevronRight, Play, Pause, X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, speak } from './api';

const ChildBehaviorApp = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [aiStatus, setAiStatus] = useState(''); // 'thinking', 'speaking', 'listening'
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const [isMicActuallyWorking, setIsMicActuallyWorking] = useState(false);

  // Characters
  const characters = [
    { id: 'zuzu', name: 'زوزو القوية', emoji: '💪', color: '#FF6B9D', personality: 'قوية وشجاعة', description: 'بطلة خارقة تحب التحديات' },
    { id: 'elsa', name: 'إلسا', emoji: '❄️', color: '#4FACFE', personality: 'حكيمة وهادئة', description: 'ملكة الثلج الطيبة' },
    { id: 'spiderman', name: 'سبايدرمان', emoji: '🕷️', color: '#E94560', personality: 'ذكي ومرح', description: 'البطل الخارق' },
    { id: 'moana', name: 'موانا', emoji: '🌊', color: '#00D9FF', personality: 'مغامرة وطموحة', description: 'المستكشفة الشجاعة' },
    { id: 'antar', name: 'عنتر', emoji: '🗡️', color: '#FFB800', personality: 'شجاع ونبيل', description: 'الفارس العربي' }
  ];

  // Behaviors
  const behaviors = [
    { id: 'tidiness', name: 'الترتيب والنظافة', emoji: '🧹', color: '#4ECDC4', shortDesc: 'غرفة مرتبة، عقل صافي' },
    { id: 'respect', name: 'احترام الوالدين', emoji: '❤️', color: '#FF6B9D', shortDesc: 'قلب مليء بالحب' },
    { id: 'homework', name: 'المذاكرة', emoji: '📚', color: '#A8E6CF', shortDesc: 'التعلم مغامرة ممتعة' },
    { id: 'sharing', name: 'المشاركة', emoji: '🤝', color: '#FFD93D', shortDesc: 'العطاء يسعد القلب' },
    { id: 'honesty', name: 'الصدق', emoji: '✨', color: '#95E1D3', shortDesc: 'الصدق ينير الطريق' },
    { id: 'sleep', name: 'النوم المبكر', emoji: '🌙', color: '#AA96DA', shortDesc: 'نم جيداً، استيقظ بطلاً' }
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("متصفحك لا يدعم خاصية التعرف على الصوت. يرجى استخدام Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ar-SA';

    recognition.onstart = () => {
      console.log("Recognition started");
      setIsMicActuallyWorking(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Heard:", transcript);
      handleAIInteraction(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsMicActuallyWorking(false);
      if (event.error === 'not-allowed') {
        setError("يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.");
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      setIsMicActuallyWorking(false);
      // Auto-restart if we're still supposed to be listening
      if (isCallActiveRef.current && window.currentAiStatus === 'listening') {
        setTimeout(() => {
          try { recognition.start(); } catch (e) { }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    window.currentAiStatus = aiStatus;
  }, [aiStatus]);

  const playRingingSound = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const playTone = (freq, start) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      };
      const now = ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        playTone(440, now + i * 1.5);
        playTone(440, now + i * 1.5 + 0.2);
      }
    } catch (e) { console.error(e); }
  };

  const startCall = () => {
    if (!selectedCharacter || !selectedBehavior) return;
    setIsRinging(true);
    isCallActiveRef.current = true;
    playRingingSound();
    setTimeout(() => {
      setIsRinging(false);
      setIsCallActive(true);
      initialGreeting();
    }, 4000);
  };

  const endCall = () => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setAiStatus('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    window.speechSynthesis.cancel();
  };

  const initialGreeting = async () => {
    setAiStatus('speaking');
    const greeting = `أهلاً يا بطل! أنا ${selectedCharacter.name}. أنا سعيد جداً بالحديث معك عن ${selectedBehavior.name}. كيف حالك اليوم؟`;
    await speak(greeting);
    if (isCallActiveRef.current) startListening();
  };

  const startListening = () => {
    setAiStatus('listening');
    if (recognitionRef.current) {
      // Small delay to ensure TTS has fully finished and released the audio channel
      setTimeout(() => {
        try {
          recognitionRef.current.stop(); // Stop any existing instance first
          setTimeout(() => {
            recognitionRef.current.start();
          }, 100);
        } catch (e) {
          try { recognitionRef.current.start(); } catch (err) { }
        }
      }, 500);
    }
  };

  const handleAIInteraction = async (userText) => {
    if (!isCallActiveRef.current) return;

    setAiStatus('thinking');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    const response = await getAIResponse(selectedCharacter, selectedBehavior, userText);
    const textToSpeak = response || "أنت رائع جداً! أخبرني المزيد!";

    setAiStatus('speaking');
    await speak(textToSpeak);

    if (isCallActiveRef.current) {
      startListening();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#FFF9F0',
      fontFamily: '"Cairo", "Vazirmatn", sans-serif',
      direction: 'rtl',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Background Decorations */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            borderRadius: '50%',
            background: ['#FFE5D9', '#D4F1F4', '#FFD1DC', '#E0BBE4', '#FFDAB9', '#B0E0E6'][i],
            top: `${10 + i * 15}%`,
            left: `${5 + i * 15}%`,
            opacity: 0.1,
            animation: `float ${10 + i * 2}s ease-in-out infinite`
          }} />
        ))}
      </div>

      {/* Main Content Wrapper */}
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
        {/* Premium Header */}
        <header style={{
          width: '100%',
          background: 'white',
          borderRadius: '32px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(255,107,157,0.1)',
          border: '3px solid #FFE5D9',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB800 50%, #4FACFE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            🌟 رحلة الأبطال 🌟
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginTop: '10px', fontWeight: 600 }}>
            تعلم وامرح مع أبطالك المفضلين في مغامرات مذهلة!
          </p>
        </header>

        {error && (
          <div style={{ background: '#FFF0F0', color: '#D63031', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid #FFDADA', fontWeight: 700 }}>
            <AlertCircle size={24} />
            {error}
          </div>
        )}

        {!isCallActive && !isRinging && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%' }}>
            {/* Character Selection */}
            <section style={{ width: '100%', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <div style={{ width: '50px', height: '50px', background: '#FFD93D', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⭐</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>اختر بطلك المفضل</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    style={{
                      background: selectedCharacter?.id === char.id ? `${char.color}15` : 'white',
                      border: `4px solid ${selectedCharacter?.id === char.id ? char.color : '#f0f0f0'}`,
                      borderRadius: '24px',
                      padding: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: selectedCharacter?.id === char.id ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
                      boxShadow: selectedCharacter?.id === char.id ? `0 15px 30px ${char.color}25` : '0 5px 15px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontSize: '64px', marginBottom: '15px' }}>{char.emoji}</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: selectedCharacter?.id === char.id ? char.color : '#333' }}>{char.name}</div>
                    <div style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>{char.personality}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Behavior Selection */}
            <section style={{ width: '100%', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <div style={{ width: '50px', height: '50px', background: '#AA96DA', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✨</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>اختر السلوك</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {behaviors.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBehavior(b)}
                    style={{
                      background: selectedBehavior?.id === b.id ? `${b.color}15` : 'white',
                      border: `4px solid ${selectedBehavior?.id === b.id ? b.color : '#f0f0f0'}`,
                      borderRadius: '24px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      textAlign: 'right',
                      transform: selectedBehavior?.id === b.id ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: selectedBehavior?.id === b.id ? `0 10px 20px ${b.color}20` : '0 5px 15px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontSize: '40px', background: '#f9f9f9', width: '70px', height: '70px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.emoji}</div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: selectedBehavior?.id === b.id ? b.color : '#333' }}>{b.name}</div>
                      <div style={{ fontSize: '13px', color: '#888' }}>{b.shortDesc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Dial Button */}
            {selectedCharacter && selectedBehavior && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCall}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '30px',
                  fontSize: '28px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(102,126,234,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  marginTop: '20px'
                }}
              >
                <Phone size={40} strokeWidth={3} />
                اتصل بـ {selectedCharacter.name}
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Full Screen Call Overlay */}
      <AnimatePresence>
        {(isRinging || isCallActive) && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: isRinging
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : `linear-gradient(135deg, ${selectedCharacter.color} 0%, ${selectedCharacter.color}dd 100%)`,
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '20px'
            }}
          >
            {/* Animated Avatar */}
            <motion.div
              animate={{
                scale: aiStatus === 'speaking' ? [1, 1.1, 1] : 1,
                rotate: isRinging ? [0, -5, 5, 0] : 0
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: 'min(250px, 60vw)',
                height: 'min(250px, 60vw)',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'min(120px, 30vw)',
                marginBottom: '30px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                border: '10px solid rgba(255,255,255,0.3)'
              }}
            >
              {selectedCharacter.emoji}
            </motion.div>

            <h2 style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 900, marginBottom: '10px', textAlign: 'center' }}>
              {selectedCharacter.name}
            </h2>
            <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', opacity: 0.9, marginBottom: '50px', textAlign: 'center', fontWeight: 600 }}>
              {isRinging ? 'جاري الاتصال...' : `${selectedBehavior.emoji} ${selectedBehavior.name}`}
            </p>

            {/* Status Indicator */}
            {!isRinging && (
              <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '50px', gap: '20px' }}>
                {aiStatus === 'listening' && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
                  >
                    <div style={{
                      background: isMicActuallyWorking ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                      padding: '25px',
                      borderRadius: '50%',
                      boxShadow: isMicActuallyWorking ? '0 0 30px white' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      <Mic size={60} />
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900 }}>
                      {isMicActuallyWorking ? 'أنا أسمعك الآن... تحدث!' : 'جاري تشغيل الميكروفون...'}
                    </div>
                  </motion.div>
                )}
                {aiStatus === 'thinking' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <Loader2 size={60} className="animate-spin" />
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>مممم... دعني أفكر... 💭</div>
                  </div>
                )}
                {aiStatus === 'speaking' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>📢</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>استمع إلي! 🌟</div>
                  </div>
                )}

                {/* Manual Trigger with more force */}
                {aiStatus === 'listening' && (
                  <button
                    onClick={() => {
                      setIsMicActuallyWorking(false);
                      startListening();
                    }}
                    style={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '12px 25px',
                      fontSize: '16px',
                      color: selectedCharacter.color,
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    اضغط هنا إذا لم أسمعك 🎤
                  </button>
                )}
              </div>
            )}

            {/* End Call Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              style={{
                background: '#FF4757',
                border: 'none',
                borderRadius: '50%',
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 15px 40px rgba(255,71,87,0.5)'
              }}
            >
              <PhoneOff size={50} color="white" strokeWidth={3} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Vazirmatn:wght@400;700;900&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background-color: #FFF9F0;
        }
        
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default ChildBehaviorApp;
