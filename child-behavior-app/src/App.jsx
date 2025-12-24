import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Star, Sparkles, Zap, Heart, Trophy, Users, ChevronRight, Play, Pause, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, speak } from './api';

const ChildBehaviorApp = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiStatus, setAiStatus] = useState(''); // 'thinking', 'speaking', 'listening'
  const [showCommunity, setShowCommunity] = useState(false);

  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);

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

  // Sound Effects using Web Audio API
  const playRingingSound = () => {
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
  };

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'ar-SA';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleAIInteraction(transcript);
      };

      recognitionRef.current.onend = () => {
        if (isCallActive && aiStatus === 'listening') {
          // Keep listening if we are still in listening mode
          try { recognitionRef.current.start(); } catch (e) { }
        }
      };
    }
  }, [isCallActive, aiStatus]);

  const startCall = () => {
    if (!selectedCharacter || !selectedBehavior) return;
    setIsRinging(true);
    playRingingSound();
    setTimeout(() => {
      setIsRinging(false);
      setIsCallActive(true);
      initialGreeting();
    }, 4000);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setAiStatus('');
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
  };

  const initialGreeting = async () => {
    setAiStatus('speaking');
    const greeting = `أهلاً يا بطل! أنا ${selectedCharacter.name}. أنا سعيد جداً بالحديث معك عن ${selectedBehavior.name}. كيف حالك اليوم؟`;
    await speak(greeting);
    startListening();
  };

  const startListening = () => {
    setAiStatus('listening');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log("Recognition already started");
    }
  };

  const handleAIInteraction = async (userText) => {
    setAiStatus('thinking');
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();

    const response = await getAIResponse(selectedCharacter, selectedBehavior, userText);
    const textToSpeak = response || "أنت رائع جداً! أخبرني المزيد!";

    setAiStatus('speaking');
    await speak(textToSpeak);

    if (isCallActive) {
      startListening();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF9F0',
      fontFamily: '"Cairo", "Vazirmatn", sans-serif',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Centered Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <header style={{
          background: 'white',
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          textAlign: 'center',
          border: '2px solid #FFE5D9'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB800 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🌟 رحلة الأبطال 🌟
          </h1>
        </header>

        {/* Parent Selection Area */}
        {!isCallActive && !isRinging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Characters */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: '#333' }}>اختر البطل:</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    style={{
                      background: selectedCharacter?.id === char.id ? `${char.color}22` : 'white',
                      border: `3px solid ${selectedCharacter?.id === char.id ? char.color : '#eee'}`,
                      borderRadius: '20px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{char.emoji}</div>
                    <div style={{ fontWeight: 800, color: char.color }}>{char.name}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Behaviors */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: '#333' }}>اختر السلوك:</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {behaviors.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBehavior(b)}
                    style={{
                      background: selectedBehavior?.id === b.id ? `${b.color}22` : 'white',
                      border: `3px solid ${selectedBehavior?.id === b.id ? b.color : '#eee'}`,
                      borderRadius: '20px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'right'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{b.emoji}</span>
                      <span style={{ fontWeight: 700 }}>{b.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Dial Button */}
            {selectedCharacter && selectedBehavior && (
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                onClick={startCall}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '24px',
                  fontSize: '24px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 12px 24px rgba(102,126,234,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '15px'
                }}
              >
                <Phone size={32} />
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
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isRinging
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : `linear-gradient(135deg, ${selectedCharacter.color} 0%, ${selectedCharacter.color}dd 100%)`,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '40px'
            }}
          >
            {/* Character Avatar */}
            <motion.div
              animate={{
                scale: aiStatus === 'speaking' ? [1, 1.1, 1] : 1,
                rotate: isRinging ? [0, -5, 5, 0] : 0
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: '200px',
                height: '200px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '100px',
                marginBottom: '30px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '8px solid rgba(255,255,255,0.3)'
              }}
            >
              {selectedCharacter.emoji}
            </motion.div>

            <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '10px' }}>
              {selectedCharacter.name}
            </h2>
            <p style={{ fontSize: '24px', opacity: 0.9, marginBottom: '40px' }}>
              {isRinging ? 'جاري الاتصال...' : `يتحدث عن: ${selectedBehavior.name}`}
            </p>

            {/* Status Indicator */}
            {!isRinging && (
              <div style={{ marginBottom: '60px', textAlign: 'center' }}>
                {aiStatus === 'listening' && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 700 }}
                  >
                    <Mic size={32} />
                    أنا أسمعك... تحدث!
                  </motion.div>
                )}
                {aiStatus === 'thinking' && (
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>مممم... دعني أفكر...</div>
                )}
                {aiStatus === 'speaking' && (
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>استمع إلي! 🌟</div>
                )}
              </div>
            )}

            {/* End Call Button */}
            <button
              onClick={endCall}
              style={{
                background: '#FF4757',
                border: 'none',
                borderRadius: '50%',
                width: '90px',
                height: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(255,71,87,0.5)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <PhoneOff size={40} color="white" strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Vazirmatn:wght@400;700;900&display=swap');
        
        body {
          margin: 0;
          overflow-x: hidden;
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
