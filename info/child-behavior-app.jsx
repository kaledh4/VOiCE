import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PlayCircle, Settings, Users, Star, Sparkles, Phone, PhoneOff } from 'lucide-react';

const ChildBehaviorApp = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showCommunityTemplates, setShowCommunityTemplates] = useState(false);
  const audioRef = useRef(null);

  // Default characters with Arabic names
  const characters = [
    { 
      id: 'elsa', 
      name: 'إلسا', 
      nameEn: 'Elsa',
      image: '❄️', 
      category: 'ديزني',
      description: 'ملكة الثلج الشجاعة'
    },
    { 
      id: 'spiderman', 
      name: 'سبايدرمان', 
      nameEn: 'Spider-Man',
      image: '🕷️', 
      category: 'أبطال خارقون',
      description: 'البطل الخارق الشجاع'
    },
    { 
      id: 'moana', 
      name: 'موانا', 
      nameEn: 'Moana',
      image: '🌊', 
      category: 'ديزني',
      description: 'المستكشفة الشجاعة'
    },
    { 
      id: 'local_hero', 
      name: 'عنتر', 
      nameEn: 'Antar',
      image: '🗡️', 
      category: 'أبطال محليون',
      description: 'الفارس الشجاع'
    }
  ];

  // Default behaviors in Arabic
  const behaviors = [
    { 
      id: 'tidiness', 
      name: 'الترتيب والنظافة', 
      icon: '🧹',
      prompt: 'تشجيع الطفل على ترتيب غرفته والحفاظ على نظافته الشخصية'
    },
    { 
      id: 'respect', 
      name: 'احترام الوالدين', 
      icon: '❤️',
      prompt: 'تعليم الطفل أهمية احترام الوالدين والاستماع لهم'
    },
    { 
      id: 'homework', 
      name: 'المذاكرة والواجبات', 
      icon: '📚',
      prompt: 'تحفيز الطفل على إنجاز واجباته المدرسية وحب التعلم'
    },
    { 
      id: 'sharing', 
      name: 'المشاركة مع الآخرين', 
      icon: '🤝',
      prompt: 'تعليم الطفل قيمة المشاركة والعطاء'
    },
    { 
      id: 'honesty', 
      name: 'الصدق والأمانة', 
      icon: '✨',
      prompt: 'تعزيز قيم الصدق والأمانة لدى الطفل'
    },
    { 
      id: 'sleep', 
      name: 'النوم المبكر', 
      icon: '🌙',
      prompt: 'تشجيع الطفل على النوم مبكراً والحصول على راحة كافية'
    }
  ];

  // Community templates (mock data)
  const communityTemplates = [
    { id: 'comm1', character: 'إلسا', behavior: 'الترتيب', rating: 4.8, uses: 234, approved: true },
    { id: 'comm2', character: 'سبايدرمان', behavior: 'الشجاعة', rating: 4.9, uses: 189, approved: true },
    { id: 'comm3', character: 'موانا', behavior: 'المثابرة', rating: 4.7, uses: 156, approved: true }
  ];

  // Simulate phone ringing and call start
  const startCall = async () => {
    if (!selectedCharacter || !selectedBehavior) {
      alert('الرجاء اختيار الشخصية والسلوك أولاً');
      return;
    }

    setIsRinging(true);
    
    // Simulate ringing for 3 seconds
    setTimeout(() => {
      setIsRinging(false);
      setIsCallActive(true);
      
      // Initial greeting from character
      const greeting = {
        from: 'character',
        text: `مرحباً! أنا ${selectedCharacter.name}! سعيد جداً بالتحدث معك اليوم. سمعت أنك تريد أن تتعلم عن ${selectedBehavior.name}، أليس كذلك؟`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }, 3000);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setMessages([]);
  };

  // Simulate AI response (in production, this would call the Anthropic API)
  const simulateAIResponse = async (userMessage) => {
    // Add user message
    const userMsg = {
      from: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // Simulate processing delay
    setTimeout(() => {
      const responses = [
        'هذا رائع! أنا فخور بك جداً! 🌟',
        'تعلم أنني أيضاً كنت أحب المساعدة في الترتيب؟',
        'هل تعلم أن الأبطال الحقيقيين يهتمون بالنظافة؟',
        'أنت تقوم بعمل رائع! استمر هكذا!'
      ];
      
      const aiMsg = {
        from: 'character',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: '"Noto Sans Arabic", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      direction: 'rtl',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Sparkles size={32} color="#667eea" />
            أبطالي المفضلون
          </h1>
          <button
            onClick={() => setShowCommunityTemplates(!showCommunityTemplates)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Users size={20} />
            قوالب المجتمع
          </button>
        </div>
        <p style={{
          color: '#666',
          fontSize: '16px',
          margin: 0
        }}>
          تحدث مع أبطالك المفضلين وتعلم سلوكيات جديدة بطريقة ممتعة!
        </p>
      </div>

      {/* Legal Disclaimer */}
      <div style={{
        background: 'rgba(255, 243, 205, 0.95)',
        border: '2px solid #ffd700',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#856404'
      }}>
        ⚠️ <strong>إخلاء مسؤولية:</strong> هذا التطبيق مصمم للترفيه والتعليم. يرجى مراقبة الأطفال أثناء الاستخدام. المحادثات مدعومة بالذكاء الاصطناعي ويجب استخدامها تحت إشراف الوالدين.
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Characters Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Star size={24} color="#ffd700" fill="#ffd700" />
            اختر البطل المفضل
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {characters.map(char => (
              <div
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                style={{
                  background: selectedCharacter?.id === char.id 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  color: selectedCharacter?.id === char.id ? 'white' : '#333',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: selectedCharacter?.id === char.id ? '3px solid #ffd700' : '3px solid transparent',
                  transform: selectedCharacter?.id === char.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedCharacter?.id === char.id 
                    ? '0 8px 24px rgba(102, 126, 234, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={e => {
                  if (selectedCharacter?.id !== char.id) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCharacter?.id !== char.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>{char.image}</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>
                  {char.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.8,
                  marginBottom: '8px'
                }}>
                  {char.category}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  {char.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behaviors Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Sparkles size={24} color="#667eea" />
            اختر السلوك المراد تعزيزه
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {behaviors.map(behavior => (
              <div
                key={behavior.id}
                onClick={() => setSelectedBehavior(behavior)}
                style={{
                  background: selectedBehavior?.id === behavior.id
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'white',
                  color: selectedBehavior?.id === behavior.id ? 'white' : '#333',
                  border: selectedBehavior?.id === behavior.id 
                    ? '3px solid #ffd700' 
                    : '2px solid #e0e0e0',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  transform: selectedBehavior?.id === behavior.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedBehavior?.id === behavior.id
                    ? '0 8px 24px rgba(240, 147, 251, 0.4)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={e => {
                  if (selectedBehavior?.id !== behavior.id) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedBehavior?.id !== behavior.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '36px' }}>{behavior.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                    {behavior.name}
                  </div>
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
                  {behavior.prompt}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Templates (conditional) */}
        {showCommunityTemplates && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Users size={24} color="#667eea" />
              قوالب المجتمع المعتمدة
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {communityTemplates.map(template => (
                <div
                  key={template.id}
                  style={{
                    background: 'white',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateX(-4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {template.character} - {template.behavior}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      استخدمه {template.uses} مستخدم
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={16} color="#ffd700" fill="#ffd700" />
                    <span style={{ fontWeight: 'bold' }}>{template.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call Interface */}
        {!isCallActive && !isRinging && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <button
              onClick={startCall}
              disabled={!selectedCharacter || !selectedBehavior}
              style={{
                background: selectedCharacter && selectedBehavior
                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                  : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '120px',
                height: '120px',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: selectedCharacter && selectedBehavior ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto',
                transition: 'all 0.3s',
                boxShadow: selectedCharacter && selectedBehavior
                  ? '0 8px 24px rgba(17, 153, 142, 0.4)'
                  : 'none'
              }}
              onMouseEnter={e => {
                if (selectedCharacter && selectedBehavior) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Phone size={48} />
              <span style={{ fontSize: '14px' }}>اتصل الآن</span>
            </button>
            {(!selectedCharacter || !selectedBehavior) && (
              <p style={{
                marginTop: '20px',
                color: '#666',
                fontSize: '16px'
              }}>
                الرجاء اختيار الشخصية والسلوك أولاً
              </p>
            )}
          </div>
        )}

        {/* Ringing Animation */}
        {isRinging && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '20px',
              animation: 'pulse 1s infinite'
            }}>
              📞
            </div>
            <h2 style={{ fontSize: '28px', color: '#333', marginBottom: '12px' }}>
              جاري الاتصال...
            </h2>
            <p style={{ fontSize: '18px', color: '#667eea' }}>
              {selectedCharacter.name} سيرد عليك قريباً!
            </p>
            <div style={{
              marginTop: '24px',
              fontSize: '32px',
              color: '#667eea',
              letterSpacing: '8px'
            }}>
              طوووط... طوووط...
            </div>
          </div>
        )}

        {/* Active Call */}
        {isCallActive && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Call Header */}
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>{selectedCharacter.image}</div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {selectedCharacter.name}
                  </h3>
                  <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
                    يتحدث عن: {selectedBehavior.name}
                  </p>
                </div>
              </div>
              <button
                onClick={endCall}
                style={{
                  background: '#ff4757',
                  border: 'none',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <PhoneOff size={28} color="white" />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              background: '#f5f7fa',
              borderRadius: '12px',
              padding: '20px',
              minHeight: '300px',
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.from === 'character' ? 'flex-start' : 'flex-end',
                    marginBottom: '16px',
                    animation: 'slideIn 0.3s ease-out'
                  }}
                >
                  <div style={{
                    background: msg.from === 'character'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    maxWidth: '70%',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Voice Controls */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setIsListening(!isListening);
                  if (!isListening) {
                    // Simulate voice input
                    setTimeout(() => {
                      simulateAIResponse('أنا أحب أن أرتب غرفتي!');
                      setIsListening(false);
                    }, 3000);
                  }
                }}
                style={{
                  background: isListening
                    ? 'linear-gradient(135deg, #ff4757 0%, #ff6348 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  gap: '4px',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                {isListening ? 'جاري الاستماع...' : 'اضغط للتحدث'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChildBehaviorApp;