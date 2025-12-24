import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Star, Sparkles, Zap, Heart, Trophy, Users, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse } from './api';

const ChildBehaviorApp = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Characters with unique visual identities
  const characters = [
    {
      id: 'zuzu',
      name: 'زوزو القوية',
      emoji: '💪',
      color: '#FF6B9D',
      gradient: 'from-pink-400 via-rose-400 to-red-400',
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,107,157,0.2) 0%, transparent 50%)',
      personality: 'قوية وشجاعة',
      description: 'بطلة خارقة تحب التحديات',
      voice: 'nova'
    },
    {
      id: 'elsa',
      name: 'إلسا',
      emoji: '❄️',
      color: '#4FACFE',
      gradient: 'from-cyan-300 via-blue-400 to-indigo-400',
      bgPattern: 'radial-gradient(circle at 80% 20%, rgba(79,172,254,0.2) 0%, transparent 50%)',
      personality: 'حكيمة وهادئة',
      description: 'ملكة الثلج الطيبة',
      voice: 'shimmer'
    },
    {
      id: 'spiderman',
      name: 'سبايدرمان',
      emoji: '🕷️',
      color: '#E94560',
      gradient: 'from-red-500 via-rose-500 to-pink-500',
      bgPattern: 'radial-gradient(circle at 50% 50%, rgba(233,69,96,0.2) 0%, transparent 50%)',
      personality: 'ذكي ومرح',
      description: 'البطل الخارق',
      voice: 'onyx'
    },
    {
      id: 'moana',
      name: 'موانا',
      emoji: '🌊',
      color: '#00D9FF',
      gradient: 'from-teal-400 via-cyan-400 to-blue-400',
      bgPattern: 'radial-gradient(circle at 30% 70%, rgba(0,217,255,0.2) 0%, transparent 50%)',
      personality: 'مغامرة وطموحة',
      description: 'المستكشفة الشجاعة',
      voice: 'nova'
    },
    {
      id: 'antar',
      name: 'عنتر',
      emoji: '🗡️',
      color: '#FFB800',
      gradient: 'from-amber-400 via-yellow-500 to-orange-400',
      bgPattern: 'radial-gradient(circle at 70% 30%, rgba(255,184,0,0.2) 0%, transparent 50%)',
      personality: 'شجاع ونبيل',
      description: 'الفارس العربي',
      voice: 'fable'
    }
  ];

  // Behaviors with visual hierarchy
  const behaviors = [
    {
      id: 'tidiness',
      name: 'الترتيب والنظافة',
      emoji: '🧹',
      color: '#4ECDC4',
      shortDesc: 'غرفة مرتبة، عقل صافي'
    },
    {
      id: 'respect',
      name: 'احترام الوالدين',
      emoji: '❤️',
      color: '#FF6B9D',
      shortDesc: 'قلب مليء بالحب'
    },
    {
      id: 'homework',
      name: 'المذاكرة',
      emoji: '📚',
      color: '#A8E6CF',
      shortDesc: 'التعلم مغامرة ممتعة'
    },
    {
      id: 'sharing',
      name: 'المشاركة',
      emoji: '🤝',
      color: '#FFD93D',
      shortDesc: 'العطاء يسعد القلب'
    },
    {
      id: 'honesty',
      name: 'الصدق',
      emoji: '✨',
      color: '#95E1D3',
      shortDesc: 'الصدق ينير الطريق'
    },
    {
      id: 'sleep',
      name: 'النوم المبكر',
      emoji: '🌙',
      color: '#AA96DA',
      shortDesc: 'نم جيداً، استيقظ بطلاً'
    },
    {
      id: 'courage',
      name: 'الشجاعة',
      emoji: '🦁',
      color: '#FFBE76',
      shortDesc: 'واجه مخاوفك ببسالة'
    },
    {
      id: 'patience',
      name: 'الصبر',
      emoji: '⏳',
      color: '#B4A0E5',
      shortDesc: 'الصبر مفتاح الفرج'
    }
  ];

  // Community templates
  const communityTemplates = [
    {
      id: 'comm1',
      characterId: 'zuzu',
      behaviorId: 'courage',
      title: 'زوزو وتحدي الشجاعة',
      creator: 'أم سارة',
      rating: 4.9,
      uses: 892,
      featured: true
    },
    {
      id: 'comm2',
      characterId: 'elsa',
      behaviorId: 'tidiness',
      title: 'إلسا ومملكة النظافة',
      creator: 'معلمة نور',
      rating: 4.8,
      uses: 743
    },
    {
      id: 'comm3',
      characterId: 'spiderman',
      behaviorId: 'homework',
      title: 'سبايدرمان والمهمة الدراسية',
      creator: 'أبو عمر',
      rating: 4.7,
      uses: 621
    }
  ];

  const startCall = () => {
    if (!selectedCharacter || !selectedBehavior) return;
    setIsRinging(true);
    setTimeout(() => {
      setIsRinging(false);
      setIsCallActive(true);
      setMessages([{
        from: 'character',
        text: `يالله! أهلاً وسهلاً! أنا ${selectedCharacter.name}! 🌟 متحمس جداً للحديث معك اليوم! هل أنت مستعد لمغامرة رائعة عن ${selectedBehavior.name}؟`,
        timestamp: new Date()
      }]);
    }, 3000);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setMessages([]);
  };

  const handleUserMessage = async (userMsg) => {
    setMessages(prev => [...prev, { from: 'user', text: userMsg, timestamp: new Date() }]);

    const aiResponse = await getAIResponse(selectedCharacter, selectedBehavior, userMsg);

    if (aiResponse) {
      setMessages(prev => [...prev, {
        from: 'character',
        text: aiResponse,
        timestamp: new Date()
      }]);
    } else {
      // Fallback to simulation if API fails or token is missing
      setTimeout(() => {
        const responses = [
          'واااو! رائع جداً! أنا فخور بك! 🌟',
          'هذا صحيح تماماً! تعلم، أنا أيضاً أحب أن أفعل ذلك!',
          'يا للروعة! هل تعرف ماذا أفعل أنا في هذه الحالة؟',
          'مذهل! استمر هكذا يا بطلي الصغير! 💪'
        ];
        setMessages(prev => [...prev, {
          from: 'character',
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date()
        }]);
      }, 1500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF9F0',
      fontFamily: '"Vazirmatn", "Cairo", "Noto Sans Arabic", system-ui, sans-serif',
      direction: 'rtl',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Playful Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {/* Floating shapes */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              borderRadius: i % 2 === 0 ? '50%' : '30%',
              background: ['#FFE5D9', '#D4F1F4', '#FFD1DC', '#E0BBE4', '#FFDAB9', '#B0E0E6'][i],
              top: `${10 + i * 15}%`,
              left: `${5 + i * 15}%`,
              opacity: 0.15,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '20px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Playful Header */}
        <header style={{
          background: 'white',
          borderRadius: '32px',
          padding: '28px 36px',
          marginBottom: '28px',
          boxShadow: '0 8px 24px rgba(255,107,157,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: '3px solid #FFE5D9',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative corner elements */}
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD93D 0%, #FFB800 100%)',
            opacity: 0.15
          }} />

          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 900,
                margin: 0,
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB800 50%, #4FACFE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                🌟 رحلة الأبطال 🌟
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#666',
                margin: 0,
                fontWeight: 500
              }}>
                تعلم وامرح مع أبطالك المفضلين في مغامرات مذهلة!
              </p>
            </div>

            <button
              onClick={() => setShowCommunity(!showCommunity)}
              style={{
                background: showCommunity
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: showCommunity ? 'white' : '#667eea',
                border: showCommunity ? 'none' : '3px solid #667eea',
                borderRadius: '20px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: showCommunity
                  ? '0 8px 20px rgba(102,126,234,0.3)'
                  : '0 4px 12px rgba(102,126,234,0.2)',
                transform: 'translateY(0)'
              }}
            >
              <Users size={24} />
              <span>اكتشف قوالب المجتمع</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* Disclaimer */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE5D9 100%)',
          border: '3px solid #FFD93D',
          borderRadius: '24px',
          padding: '20px 28px',
          marginBottom: '28px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          boxShadow: '0 4px 12px rgba(255,217,61,0.2)'
        }}>
          <div style={{
            fontSize: '32px',
            flexShrink: 0,
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            👨‍👩‍👧‍👦
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '16px', color: '#D97706', display: 'block', marginBottom: '8px' }}>
              للآباء والأمهات الأعزاء
            </strong>
            <p style={{
              fontSize: '14px',
              color: '#92400E',
              margin: 0,
              lineHeight: 1.6
            }}>
              هذا التطبيق مصمم لتعزيز السلوكيات الإيجابية بطريقة ممتعة. نوصي بالمراقبة الأبوية أثناء الاستخدام.
              المحادثات مدعومة بالذكاء الاصطناعي ويجب استخدامها كأداة مساعدة تحت إشرافكم.
            </p>
          </div>
        </div>

        {!showCommunity ? (
          <>
            {/* Characters Section */}
            <section style={{
              background: 'white',
              borderRadius: '32px',
              padding: '32px',
              marginBottom: '28px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '3px solid #FFE5D9'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '28px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #FFD93D 0%, #FFB800 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 6px 16px rgba(255,184,0,0.3)'
                }}>
                  ⭐
                </div>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    margin: 0,
                    color: '#1a1a1a',
                    letterSpacing: '-0.02em'
                  }}>
                    اختر بطلك المفضل
                  </h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                    كل بطل له قصة وطريقة فريدة!
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}>
                {characters.map((char, idx) => {
                  const isSelected = selectedCharacter?.id === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSelectedCharacter(char)}
                      style={{
                        background: isSelected
                          ? `linear-gradient(135deg, ${char.color}22 0%, ${char.color}44 100%)`
                          : 'white',
                        border: isSelected
                          ? `4px solid ${char.color}`
                          : '3px solid #F0F0F0',
                        borderRadius: '24px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: isSelected ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
                        boxShadow: isSelected
                          ? `0 16px 32px ${char.color}40, 0 0 0 4px ${char.color}20`
                          : '0 4px 12px rgba(0,0,0,0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Background pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100%',
                        height: '100%',
                        background: char.bgPattern,
                        opacity: isSelected ? 1 : 0,
                        transition: 'opacity 0.3s',
                        pointerEvents: 'none'
                      }} />

                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                          fontSize: '72px',
                          marginBottom: '16px',
                          textAlign: 'center',
                          filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.3s'
                        }}>
                          {char.emoji}
                        </div>

                        <h3 style={{
                          fontSize: '22px',
                          fontWeight: 900,
                          margin: '0 0 8px 0',
                          textAlign: 'center',
                          color: isSelected ? char.color : '#1a1a1a'
                        }}>
                          {char.name}
                        </h3>

                        <p style={{
                          fontSize: '14px',
                          color: '#666',
                          margin: '0 0 8px 0',
                          textAlign: 'center',
                          fontWeight: 600
                        }}>
                          {char.personality}
                        </p>

                        <p style={{
                          fontSize: '13px',
                          color: '#999',
                          margin: 0,
                          textAlign: 'center'
                        }}>
                          {char.description}
                        </p>

                        {isSelected && (
                          <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: char.color,
                            borderRadius: '12px',
                            textAlign: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '14px',
                            animation: 'fadeIn 0.3s ease-out'
                          }}>
                            ✓ تم الاختيار!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Behaviors Section */}
            <section style={{
              background: 'white',
              borderRadius: '32px',
              padding: '32px',
              marginBottom: '28px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '3px solid #E0BBE4'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '28px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #AA96DA 0%, #B4A0E5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 6px 16px rgba(170,150,218,0.3)'
                }}>
                  ✨
                </div>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    margin: 0,
                    color: '#1a1a1a',
                    letterSpacing: '-0.02em'
                  }}>
                    اختر السلوك
                  </h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                    ماذا تريد أن تتعلم اليوم؟
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px'
              }}>
                {behaviors.map((behavior, idx) => {
                  const isSelected = selectedBehavior?.id === behavior.id;
                  return (
                    <div
                      key={behavior.id}
                      onClick={() => setSelectedBehavior(behavior)}
                      style={{
                        background: isSelected
                          ? `linear-gradient(135deg, ${behavior.color}22 0%, ${behavior.color}44 100%)`
                          : 'white',
                        border: isSelected
                          ? `4px solid ${behavior.color}`
                          : '3px solid #F0F0F0',
                        borderRadius: '20px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected
                          ? `0 12px 24px ${behavior.color}40`
                          : '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          fontSize: '40px',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isSelected ? `${behavior.color}22` : '#F9F9F9',
                          borderRadius: '16px',
                          flexShrink: 0
                        }}>
                          {behavior.emoji}
                        </div>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          margin: 0,
                          color: isSelected ? behavior.color : '#1a1a1a',
                          flex: 1
                        }}>
                          {behavior.name}
                        </h3>
                      </div>

                      <p style={{
                        fontSize: '14px',
                        color: '#666',
                        margin: 0,
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        {behavior.shortDesc}
                      </p>

                      {isSelected && (
                        <div style={{
                          marginTop: '16px',
                          padding: '10px',
                          background: behavior.color,
                          borderRadius: '10px',
                          textAlign: 'center',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '13px',
                          animation: 'fadeIn 0.3s ease-out'
                        }}>
                          ✓ جاهز!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Call Interface */}
            {!isCallActive && !isRinging && (
              <section style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '32px',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 16px 48px rgba(102,126,234,0.4)',
                border: '4px solid white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {selectedCharacter && selectedBehavior ? (
                    <>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        padding: '12px 24px',
                        marginBottom: '24px',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 700
                        }}>
                          {selectedCharacter.emoji} {selectedCharacter.name} × {selectedBehavior.emoji} {selectedBehavior.name}
                        </span>
                      </div>

                      <h2 style={{
                        fontSize: '40px',
                        fontWeight: 900,
                        color: 'white',
                        margin: '0 0 16px 0',
                        letterSpacing: '-0.02em'
                      }}>
                        جاهز للمغامرة؟
                      </h2>

                      <p style={{
                        fontSize: '20px',
                        color: 'rgba(255,255,255,0.9)',
                        margin: '0 0 40px 0',
                        fontWeight: 500
                      }}>
                        اضغط الزر للاتصال ببطلك المفضل!
                      </p>

                      <button
                        onClick={startCall}
                        style={{
                          background: 'white',
                          color: '#667eea',
                          border: 'none',
                          borderRadius: '50%',
                          width: '140px',
                          height: '140px',
                          fontSize: '28px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.2), 0 0 0 0 rgba(255,255,255,0.5)',
                          animation: 'pulse-ring 2s infinite'
                        }}
                      >
                        <Phone size={52} strokeWidth={3} />
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>اتصل</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎯</div>
                      <h2 style={{
                        fontSize: '32px',
                        fontWeight: 900,
                        color: 'white',
                        margin: '0 0 16px 0'
                      }}>
                        خطوة أخيرة!
                      </h2>
                      <p style={{
                        fontSize: '20px',
                        color: 'rgba(255,255,255,0.9)',
                        margin: 0,
                        fontWeight: 500
                      }}>
                        اختر البطل والسلوك أولاً لبدء المغامرة
                      </p>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Ringing State */}
            {isRinging && (
              <section style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                borderRadius: '32px',
                padding: '64px 32px',
                textAlign: 'center',
                boxShadow: '0 16px 48px rgba(17,153,142,0.4)',
                border: '4px solid white',
                animation: 'fadeIn 0.5s ease-out'
              }}>
                <div style={{
                  fontSize: '100px',
                  marginBottom: '24px',
                  animation: 'bounce 1s ease-in-out infinite'
                }}>
                  📞
                </div>
                <h2 style={{
                  fontSize: '40px',
                  fontWeight: 900,
                  color: 'white',
                  margin: '0 0 16px 0'
                }}>
                  جاري الاتصال...
                </h2>
                <p style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.9)',
                  margin: '0 0 32px 0',
                  fontWeight: 700
                }}>
                  {selectedCharacter.emoji} {selectedCharacter.name} سيرد عليك في ثانية!
                </p>
                <div style={{
                  fontSize: '48px',
                  color: 'white',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  animation: 'blink 1.5s ease-in-out infinite'
                }}>
                  طووط... طووط...
                </div>
              </section>
            )}

            {/* Active Call */}
            {isCallActive && (
              <section style={{
                background: 'white',
                borderRadius: '32px',
                padding: '32px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                border: `4px solid ${selectedCharacter.color}`,
                animation: 'fadeIn 0.5s ease-out'
              }}>
                {/* Call Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${selectedCharacter.color} 0%, ${selectedCharacter.color}dd 100%)`,
                  borderRadius: '24px',
                  padding: '24px 28px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: `0 8px 24px ${selectedCharacter.color}40`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      fontSize: '64px',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }}>
                      {selectedCharacter.emoji}
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        margin: '0 0 4px 0',
                        color: 'white'
                      }}>
                        {selectedCharacter.name}
                      </h3>
                      <p style={{
                        fontSize: '16px',
                        margin: 0,
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 600
                      }}>
                        {selectedBehavior.emoji} يتحدث عن: {selectedBehavior.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={endCall}
                    style={{
                      background: '#FF4757',
                      border: 'none',
                      borderRadius: '50%',
                      width: '68px',
                      height: '68px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 6px 20px rgba(255,71,87,0.4)'
                    }}
                  >
                    <PhoneOff size={32} color="white" strokeWidth={3} />
                  </button>
                </div>

                {/* Messages Area */}
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: '20px',
                  padding: '24px',
                  minHeight: '350px',
                  maxHeight: '450px',
                  overflowY: 'auto',
                  marginBottom: '24px',
                  border: '2px solid #E5E7EB'
                }}>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: msg.from === 'character' ? 'flex-start' : 'flex-end',
                        marginBottom: '20px'
                      }}
                    >
                      <div style={{
                        background: msg.from === 'character'
                          ? `linear-gradient(135deg, ${selectedCharacter.color} 0%, ${selectedCharacter.color}dd 100%)`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: msg.from === 'character' ? '24px 24px 24px 4px' : '24px 24px 4px 24px',
                        padding: '16px 24px',
                        maxWidth: '75%',
                        fontSize: '17px',
                        lineHeight: 1.6,
                        fontWeight: 600,
                        boxShadow: msg.from === 'character'
                          ? `0 6px 20px ${selectedCharacter.color}30`
                          : '0 6px 20px rgba(102,126,234,0.3)',
                        position: 'relative'
                      }}>
                        {msg.from === 'character' && (
                          <div style={{
                            position: 'absolute',
                            top: -12,
                            right: -12,
                            fontSize: '32px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                          }}>
                            {selectedCharacter.emoji}
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voice Controls */}
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => {
                      setIsListening(!isListening);
                      if (!isListening) {
                        // In a real app, this would use Speech Recognition
                        setTimeout(() => {
                          handleUserMessage('أنا أحب أن أرتب غرفتي كل يوم!');
                          setIsListening(false);
                        }, 3000);
                      }
                    }}
                    style={{
                      background: isListening
                        ? 'linear-gradient(135deg, #FF4757 0%, #FF6348 100%)'
                        : `linear-gradient(135deg, ${selectedCharacter.color} 0%, ${selectedCharacter.color}dd 100%)`,
                      border: 'none',
                      borderRadius: '50%',
                      width: '100px',
                      height: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.4s',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 900,
                      gap: '6px',
                      boxShadow: isListening
                        ? '0 8px 28px rgba(255,71,87,0.5), 0 0 0 0 rgba(255,71,87,0.7)'
                        : `0 8px 28px ${selectedCharacter.color}40`,
                      animation: isListening ? 'pulse-mic 1s infinite' : 'none'
                    }}
                  >
                    {isListening ? <MicOff size={40} strokeWidth={3} /> : <Mic size={40} strokeWidth={3} />}
                    <span>{isListening ? 'استمع...' : 'تحدث'}</span>
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Community Templates Section */
          <section style={{
            background: 'white',
            borderRadius: '32px',
            padding: '32px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '3px solid #FFE5D9',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 6px 16px rgba(102,126,234,0.3)'
                }}>
                  🌍
                </div>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    margin: 0,
                    color: '#1a1a1a'
                  }}>
                    قوالب المجتمع المميزة
                  </h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                    قوالب مجربة ومعتمدة من آباء وأمهات آخرين
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCommunity(false)}
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: '3px solid #667eea',
                  borderRadius: '16px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                ← العودة للرئيسية
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px'
            }}>
              {communityTemplates.map((template, idx) => {
                const char = characters.find(c => c.id === template.characterId);
                const behavior = behaviors.find(b => b.id === template.behaviorId);

                return (
                  <div
                    key={template.id}
                    style={{
                      background: template.featured
                        ? `linear-gradient(135deg, ${char.color}15 0%, ${char.color}25 100%)`
                        : 'white',
                      border: template.featured
                        ? `3px solid ${char.color}`
                        : '3px solid #F0F0F0',
                      borderRadius: '24px',
                      padding: '28px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {template.featured && (
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        background: 'linear-gradient(135deg, #FFD93D 0%, #FFB800 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(255,184,0,0.3)'
                      }}>
                        <Trophy size={16} />
                        <span>الأكثر شعبية</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '20px',
                      marginTop: template.featured ? '40px' : '0'
                    }}>
                      <div style={{
                        fontSize: '56px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                      }}>
                        {char.emoji}
                      </div>
                      <div style={{
                        fontSize: '40px',
                        opacity: 0.6
                      }}>
                        {behavior.emoji}
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      margin: '0 0 12px 0',
                      color: char.color
                    }}>
                      {template.title}
                    </h3>

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '16px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: '#F0F0F0',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#666'
                      }}>
                        {char.name}
                      </span>
                      <span style={{
                        background: `${behavior.color}22`,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: behavior.color
                      }}>
                        {behavior.name}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '16px',
                      borderTop: '2px solid #F0F0F0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={18} color="#FFB800" fill="#FFB800" />
                        <span style={{ fontWeight: 900, fontSize: '16px' }}>{template.rating}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#999',
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        <Users size={16} />
                        <span>{template.uses} استخدام</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-ring {
          0% { box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 0 0 0 rgba(255,255,255,0.7); }
          50% { box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 0 0 20px rgba(255,255,255,0); }
          100% { box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 0 0 0 rgba(255,255,255,0); }
        }
        
        @keyframes pulse-mic {
          0%, 100% { 
            box-shadow: 0 8px 28px rgba(255,71,87,0.5), 0 0 0 0 rgba(255,71,87,0.7);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 8px 28px rgba(255,71,87,0.5), 0 0 0 15px rgba(255,71,87,0);
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default ChildBehaviorApp;
