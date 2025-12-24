import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Star, Sparkles, Zap, Heart, Trophy, Users, ChevronRight, Play, Pause, X, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, speak } from './api';

const ChildBehaviorApp = () => {
  const [hasStarted, setHasStarted] = useState(false);
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

  // Initialize Audio and Speech
  const initializeApp = () => {
    setHasStarted(true);

    // Unlock AudioContext for iOS/PC
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

      recognition.onstart = () => setIsMicActuallyWorking(true);
      recognition.onresult = (event) => handleAIInteraction(event.results[0][0].transcript);
      recognition.onerror = (event) => {
        setIsMicActuallyWorking(false);
        if (event.error === 'not-allowed') setError("يرجى السماح بالميكروفون من إعدادات المتصفح");
      };
      recognition.onend = () => {
        setIsMicActuallyWorking(false);
        if (isCallActiveRef.current && window.currentAiStatus === 'listening') {
          setTimeout(() => { try { recognition.start(); } catch (e) { } }, 300);
        }
      };
      recognitionRef.current = recognition;
    } else {
      setError("متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome.");
    }

    // Trigger a silent sound to unlock audio on iOS
    const utterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    window.currentAiStatus = aiStatus;
  }, [aiStatus]);

  const playRingingSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const playTone = (freq, start) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.05, start);
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
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    window.speechSynthesis.cancel();
  };

  const initialGreeting = async () => {
    setAiStatus('speaking');
    const greeting = `أهلاً يا بطل! أنا ${selectedCharacter.name}. أنا سعيد جداً بالحديث معك عن ${selectedBehavior.name}. كيف حالك اليوم؟`;
    await speak(greeting, selectedCharacter.id);
    if (isCallActiveRef.current) startListening();
  };

  const startListening = () => {
    setAiStatus('listening');
    if (recognitionRef.current) {
      setTimeout(() => {
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 100);
        } catch (e) {
          try { recognitionRef.current.start(); } catch (err) { }
        }
      }, 500);
    }
  };

  const handleAIInteraction = async (userText) => {
    if (!isCallActiveRef.current) return;
    setAiStatus('thinking');
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    const response = await getAIResponse(selectedCharacter, selectedBehavior, userText);
    const textToSpeak = response || "أنت رائع جداً! أخبرني المزيد!";
    setAiStatus('speaking');
    await speak(textToSpeak, selectedCharacter.id);
    if (isCallActiveRef.current) startListening();
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#FFF9F0',
      fontFamily: '"Cairo", "Vazirmatn", sans-serif',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Start Overlay for iOS/PC Audio Unlock */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(255,255,255,0.95)',
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
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: '80px', marginBottom: '20px' }}
            >
              🚀
            </motion.div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#FF6B9D', marginBottom: '10px' }}>مرحباً بك في رحلة الأبطال!</h1>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>اضغط على الزر أدناه لتفعيل الصوت والميكروفون والبدء في المغامرة</p>
            <button
              onClick={initializeApp}
              style={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB800 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '20px 60px',
                fontSize: '24px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(255,107,157,0.3)'
              }}
            >
              ابدأ المغامرة الآن 🌟
            </button>
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
            WebkitTextFillColor: 'transparent'
          }}>
            🌟 رحلة الأبطال 🌟
          </h1>
        </header>

        {error && (
          <div style={{ background: '#FFF0F0', color: '#D63031', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid #FFDADA', fontWeight: 700 }}>
            <AlertCircle size={24} />
            {error}
          </div>
        )}

        {!isCallActive && !isRinging && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%' }}>
            {/* Disclaimer */}
            <div style={{
              background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE5D9 100%)',
              border: '3px solid #FFD93D',
              borderRadius: '24px',
              padding: '20px 28px',
              marginBottom: '28px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '32px' }}>👨‍👩‍👧‍👦</div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '16px', color: '#D97706', display: 'block', marginBottom: '8px' }}>للآباء والأمهات الأعزاء</strong>
                <p style={{ fontSize: '14px', color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                  هذا التطبيق مصمم لتعزيز السلوكيات الإيجابية. نوصي بالمراقبة الأبوية أثناء الاستخدام.
                </p>
              </div>
            </div>

            {/* Character Selection */}
            <section style={{ width: '100%', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '25px' }}>اختر بطلك المفضل</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
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
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ fontSize: '64px', marginBottom: '15px' }}>{char.emoji}</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: selectedCharacter?.id === char.id ? char.color : '#333' }}>{char.name}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Behavior Selection */}
            <section style={{ width: '100%', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '25px' }}>اختر السلوك</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                  >
                    <div style={{ fontSize: '40px' }}>{b.emoji}</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: selectedBehavior?.id === b.id ? b.color : '#333' }}>{b.name}</div>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px'
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <motion.div
              animate={{ scale: aiStatus === 'speaking' ? [1, 1.1, 1] : 1 }}
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
                boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
              }}
            >
              {selectedCharacter.emoji}
            </motion.div>

            <h2 style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 900, marginBottom: '10px' }}>{selectedCharacter.name}</h2>
            <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', opacity: 0.9, marginBottom: '50px' }}>
              {isRinging ? 'جاري الاتصال...' : `${selectedBehavior.emoji} ${selectedBehavior.name}`}
            </p>

            {!isRinging && (
              <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {aiStatus === 'listening' && (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: isMicActuallyWorking ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '50%' }}>
                      <Mic size={60} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{isMicActuallyWorking ? 'أنا أسمعك... تحدث!' : 'جاري تشغيل الميكروفون...'}</div>
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
                    <Volume2 size={60} />
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>استمع إلي! 🌟</div>
                  </div>
                )}

                {aiStatus === 'listening' && (
                  <button
                    onClick={() => startListening()}
                    style={{ background: 'white', border: 'none', borderRadius: '20px', padding: '10px 20px', fontSize: '16px', color: selectedCharacter.color, fontWeight: 900 }}
                  >
                    اضغط هنا إذا لم أسمعك 🎤
                  </button>
                )}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
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
                boxShadow: '0 15px 40px rgba(255,71,87,0.5)',
                marginTop: '30px'
              }}
            >
              <PhoneOff size={50} color="white" strokeWidth={3} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Vazirmatn:wght@400;700;900&display=swap');
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { margin: 0; padding: 0; overflow-x: hidden; background-color: #FFF9F0; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default ChildBehaviorApp;
