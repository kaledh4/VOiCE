const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY; // Optional: for better AI responses

// Content Safety Filter
const FORBIDDEN_WORDS = [
    // Add any inappropriate words in Arabic that should be filtered
    // This is a basic example - expand as needed
];

const SAFE_TOPICS = [
    'الترتيب', 'النظافة', 'الاحترام', 'المذاكرة', 'المشاركة',
    'الصدق', 'النوم', 'الأكل الصحي', 'اللطف', 'الحب', 'العائلة',
    'الأصدقاء', 'المدرسة', 'اللعب', 'القراءة', 'الرياضة'
];

/**
 * Validates user input for safety
 * @param {string} input - User's spoken input
 * @returns {object} - {isValid: boolean, reason: string}
 */
export const validateInput = (input) => {
    if (!input || input.trim().length === 0) {
        return { isValid: false, reason: 'empty' };
    }

    const lowerInput = input.toLowerCase();

    // Check for forbidden words
    for (const word of FORBIDDEN_WORDS) {
        if (lowerInput.includes(word)) {
            console.warn('Inappropriate content detected:', word);
            return { isValid: false, reason: 'inappropriate' };
        }
    }

    // Check input length (prevent abuse)
    if (input.length > 500) {
        return { isValid: false, reason: 'too_long' };
    }

    // Check for excessive special characters (potential spam/abuse)
    const specialCharCount = (input.match(/[^a-zA-Z0-9\u0600-\u06FF\s]/g) || []).length;
    if (specialCharCount > input.length * 0.3) {
        return { isValid: false, reason: 'spam' };
    }

    return { isValid: true };
};

/**
 * Enhanced AI Response with multiple strategies
 * @param {object} character - Selected character
 * @param {object} behavior - Selected behavior
 * @param {string} userMessage - User's message
 * @param {array} conversationHistory - Previous conversation
 * @param {string} childName - Child's name (optional)
 * @returns {Promise<string>} - AI response
 */
export const getAIResponse = async (character, behavior, userMessage, conversationHistory = [], childName = '') => {
    // Strategy 1: Try Anthropic Claude API (best quality)
    if (ANTHROPIC_API_KEY) {
        try {
            const claudeResponse = await getClaudeResponse(character, behavior, userMessage, conversationHistory, childName);
            if (claudeResponse) {
                logInteraction({ source: 'claude', success: true });
                return claudeResponse;
            }
        } catch (error) {
            console.warn('Claude API failed, falling back:', error);
        }
    }

    // Strategy 2: Try Hugging Face API
    if (HUGGINGFACE_TOKEN) {
        try {
            const hfResponse = await getHuggingFaceResponse(character, behavior, userMessage, conversationHistory, childName);
            if (hfResponse) {
                logInteraction({ source: 'huggingface', success: true });
                return hfResponse;
            }
        } catch (error) {
            console.warn('Hugging Face API failed, falling back:', error);
        }
    }

    // Strategy 3: Smart fallback with context
    logInteraction({ source: 'fallback', success: true });
    return getSmartFallback(character, behavior, userMessage, conversationHistory, childName);
};

/**
 * Get response from Anthropic Claude API
 */
const getClaudeResponse = async (character, behavior, userMessage, conversationHistory, childName) => {
    const systemPrompt = buildSystemPrompt(character, behavior, childName);
    const messages = buildConversationMessages(conversationHistory, userMessage);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 150,
            temperature: 0.8,
            system: systemPrompt,
            messages: messages
        })
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
        const text = data.content[0].text.trim();
        // Validate response is appropriate
        const validation = validateOutput(text);
        if (validation.isValid) {
            return text;
        }
    }

    return null;
};

/**
 * Get response from Hugging Face API
 */
const getHuggingFaceResponse = async (character, behavior, userMessage, conversationHistory, childName) => {
    const prompt = buildHuggingFacePrompt(character, behavior, userMessage, conversationHistory, childName);

    const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 120,
                    temperature: 0.8,
                    top_p: 0.9,
                    return_full_text: false
                }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
        throw new Error(result.error);
    }

    if (Array.isArray(result) && result[0]?.generated_text) {
        const text = cleanAIResponse(result[0].generated_text);
        const validation = validateOutput(text);
        if (validation.isValid) {
            return text;
        }
    }

    return null;
};

/**
 * Build system prompt for Claude
 */
const buildSystemPrompt = (character, behavior, childName) => {
    const namePrefix = childName ? `اسم الطفل: ${childName}. ` : '';

    const characterPersonas = {
        zuzu: `أنت زوزو، البطلة الخارقة القوية والشجاعة. تتحدثين بلهجة مصرية مرحة ومشجعة. تستخدمين كلمات مثل "يا بطل"، "يا بطل"، "تمام"، "عظيم". أنتِ نشيطة ومتحمسة دائماً.`,
        elsa: `أنتِ إلسا، ملكة الثلج الحكيمة والطيبة. تتحدثين بلغة عربية فصحى هادئة وراقية. تستخدمين كلمات مثل "عزيزي"، "بني"، "يا صغيري". أنتِ صبورة ولطيفة.`,
        spiderman: `أنت سبايدرمان، البطل الخارق الذكي والمرح. تتحدث بلهجة شامية أو محايدة مليئة بالحماس. تستخدم كلمات مثل "يا بطل"، "كفو"، "روعة". أنت سريع الحركة والكلام.`,
        moana: `أنتِ موانا، المستكشفة الشجاعة المليئة بالطموح. تتحدثين بلهجة خليجية أو محايدة مليئة بالمغامرة. تستخدمين كلمات مثل "يا شجاع"، "يا بطل"، "واو". أنتِ مليئة بالحيوية.`,
        antar: `أنت عنتر بن شداد، الفارس العربي الشجاع والنبيل. تتحدث بلغة عربية فصحى قوية وجزلة. تستخدم كلمات مثل "يا فتى"، "يا شجاع"، "يا بطل". أنت قوي وحكيم.`,
        aisha: `أنتِ عائشة، العالمة الصغيرة الذكية والفضولية. تتحدثين بلغة عربية فصحى بسيطة مليئة بالفضول. تستخدمين كلمات مثل "يا ذكي"، "رائع"، "ممتاز". أنتِ تحبين التعلم.`
    };

    const behaviorContext = {
        tidiness: `الموضوع: الترتيب والنظافة. شجع الطفل على ترتيب غرفته، تنظيف أغراضه، والحفاظ على النظافة الشخصية.`,
        respect: `الموضوع: احترام الوالدين. شجع الطفل على الاستماع لوالديه، طاعتهم بمحبة، ومساعدتهم.`,
        homework: `الموضوع: المذاكرة والواجبات. شجع الطفل على حب التعلم، التركيز في الدراسة، وأهمية التعليم.`,
        sharing: `الموضوع: المشاركة والكرم. شجع الطفل على مشاركة ألعابه، مساعدة الآخرين، والكرم.`,
        honesty: `الموضوع: الصدق والأمانة. شجع الطفل على قول الحقيقة دائماً، الاعتراف بالأخطاء، والأمانة.`,
        sleep: `الموضوع: النوم المبكر. شجع الطفل على النوم في وقت مبكر، أهمية النوم الجيد للصحة.`,
        healthy_eating: `الموضوع: الأكل الصحي. شجع الطفل على تناول الخضروات والفواكه، شرب الماء، وتجنب الإفراط في الحلويات.`,
        kindness: `الموضوع: اللطف مع الآخرين. شجع الطفل على الابتسام، قول كلمات طيبة، ومساعدة الآخرين.`
    };

    return `${namePrefix}${characterPersonas[character.id] || characterPersonas.zuzu}

${behaviorContext[behavior.id] || behaviorContext.tidiness}

قواعد مهمة:
1. استخدم جملة واحدة أو جملتين فقط (20-40 كلمة)
2. كن إيجابياً ومشجعاً دائماً
3. تحدث بأسلوب مناسب للأطفال (5-10 سنوات)
4. اسأل أسئلة تفاعلية لتشجيع المحادثة
5. استخدم الإيموجي بشكل معتدل
6. لا تعطِ نصائح طبية أو قانونية
7. ركز على القيم الإيجابية والسلوكيات الجيدة
8. كن محفزاً وداعماً
9. تجنب أي محتوى غير مناسب للأطفال
10. اجعل الحوار ممتعاً وتفاعلياً`;
};

/**
 * Build conversation messages for Claude
 */
const buildConversationMessages = (history, userMessage) => {
    const messages = [];

    // Add conversation history (last 3 turns only to keep context focused)
    const recentHistory = history.slice(-6); // 3 exchanges = 6 messages
    for (const msg of recentHistory) {
        messages.push({
            role: msg.speaker === 'child' ? 'user' : 'assistant',
            content: msg.text
        });
    }

    // Add current message
    messages.push({
        role: 'user',
        content: userMessage
    });

    return messages;
};

/**
 * Build prompt for Hugging Face
 */
const buildHuggingFacePrompt = (character, behavior, userMessage, conversationHistory, childName) => {
    const systemPrompt = buildSystemPrompt(character, behavior, childName);

    let conversationContext = '';
    const recentHistory = conversationHistory.slice(-4); // Last 2 exchanges

    for (const msg of recentHistory) {
        conversationContext += `${msg.speaker === 'child' ? 'الطفل' : character.name}: ${msg.text}\n`;
    }

    return `<s>[INST] ${systemPrompt}

${conversationContext ? `المحادثة السابقة:\n${conversationContext}\n` : ''}
الطفل قال الآن: ${userMessage}

رد بجملة أو جملتين فقط كـ ${character.name}: [/INST]`;
};

/**
 * Clean AI response from artifacts
 */
const cleanAIResponse = (text) => {
    // Remove common AI artifacts
    let cleaned = text
        .replace(/\[INST\]|\[\/INST\]/g, '')
        .replace(/^(AI:|Assistant:|الرد:|الجواب:)/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

    // Take only first 1-2 sentences
    const sentences = cleaned.split(/[.!?؟।]/);
    cleaned = sentences.slice(0, 2).join('. ').trim();

    // Ensure it ends with punctuation
    if (!/[.!?؟]$/.test(cleaned)) {
        cleaned += '.';
    }

    return cleaned;
};

/**
 * Validate AI output for appropriateness
 */
const validateOutput = (text) => {
    if (!text || text.trim().length === 0) {
        return { isValid: false, reason: 'empty' };
    }

    // Check length
    if (text.length > 300) {
        return { isValid: false, reason: 'too_long' };
    }

    // Check for inappropriate content
    const lowerText = text.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
        if (lowerText.includes(word)) {
            return { isValid: false, reason: 'inappropriate' };
        }
    }

    return { isValid: true };
};

/**
 * Smart fallback responses with context awareness
 */
const getSmartFallback = (character, behavior, userMessage, conversationHistory, childName) => {
    const namePrefix = childName ? `${childName}، ` : '';

    // Analyze user message sentiment
    const isPositive = /جيد|رائع|ممتاز|حلو|نعم|موافق|أحب|سعيد/i.test(userMessage);
    const isNegative = /لا|صعب|مش|ما|لن|ليس/i.test(userMessage);
    const isQuestion = /كيف|ماذا|لماذا|متى|أين|هل|؟/i.test(userMessage);

    // Character-specific responses
    const characterResponses = {
        zuzu: {
            positive: [
                `${namePrefix}يا بطل! أنت رائع جداً! 💪`,
                `${namePrefix}ما شاء الله عليك يا بطل! استمر كده! 🌟`,
                `${namePrefix}أنت تجعلني فخورة جداً! 🎉`,
                `${namePrefix}يا سلام! أنت بطل حقيقي! ⭐`
            ],
            negative: [
                `${namePrefix}لا تقلق يا بطل، نقدر نعملها سوا! 💪`,
                `${namePrefix}الأبطال ما بيستسلموش أبداً! 🌟`,
                `${namePrefix}أنا واثقة فيك، أنت قوي! 💫`,
                `${namePrefix}كلنا بنغلط، المهم نتعلم! 🎯`
            ],
            question: [
                `${namePrefix}سؤال حلو! خليني أفكر معاك... 🤔`,
                `${namePrefix}دي نقطة مهمة! تعال نفكر فيها! 💭`,
                `${namePrefix}سؤالك ذكي جداً! 🧠`
            ],
            general: [
                `${namePrefix}أخبرني المزيد عن يومك! 😊`,
                `${namePrefix}أنت دائماً تبهرني! ❤️`,
                `${namePrefix}يا له من شيء رائع! 🎨`
            ]
        },
        elsa: {
            positive: [
                `${namePrefix}عزيزي، أنت تملأ قلبي فرحاً! ❄️`,
                `${namePrefix}بارك الله فيك يا صغيري! ✨`,
                `${namePrefix}أنت طفل مميز حقاً! 💙`,
                `${namePrefix}ما أجمل ما فعلت! 🌟`
            ],
            negative: [
                `${namePrefix}لا تحزن عزيزي، كل شيء سيكون بخير! 💙`,
                `${namePrefix}الصعوبات تجعلنا أقوى يا بني! 🌨️`,
                `${namePrefix}ثق بنفسك، أنت قادر! ✨`,
                `${namePrefix}معاً سننجح إن شاء الله! 💫`
            ],
            question: [
                `${namePrefix}سؤال جميل، دعني أساعدك! 🤔`,
                `${namePrefix}أنا سعيدة بفضولك! 💭`,
                `${namePrefix}التفكير بداية الحكمة! 🌟`
            ],
            general: [
                `${namePrefix}أخبرني عن مشاعرك! 💙`,
                `${namePrefix}أنا أستمع إليك بحب! ❄️`,
                `${namePrefix}قصتك جميلة! ✨`
            ]
        },
        spiderman: {
            positive: [
                `${namePrefix}يا بطل! كفو عليك! 🕷️`,
                `${namePrefix}روعة! أنت سوبر! 🎯`,
                `${namePrefix}ما شاء الله! قوة! 💪`,
                `${namePrefix}يا نجم! استمر! ⭐`
            ],
            negative: [
                `${namePrefix}لا تيأس! الأبطال يتعلمون! 🕸️`,
                `${namePrefix}كل بطل بيواجه تحديات! 💪`,
                `${namePrefix}أنا معاك، نقدر نحلها! 🎯`,
                `${namePrefix}الفشل طريق النجاح! ⚡`
            ],
            question: [
                `${namePrefix}سؤال ذكي! تعال نفكر! 🧠`,
                `${namePrefix}يا ذكي! دي نقطة مهمة! 💭`,
                `${namePrefix}أسئلتك تثبت ذكاءك! 🤔`
            ],
            general: [
                `${namePrefix}شو رأيك نلعب؟ 🎮`,
                `${namePrefix}قصة حلوة! 🕷️`,
                `${namePrefix}أنت مميز! 🌟`
            ]
        },
        moana: {
            positive: [
                `${namePrefix}يا شجاع! فخورة فيك! 🌊`,
                `${namePrefix}واو! أنت بطل المحيط! 🏝️`,
                `${namePrefix}ما شاء الله عليك! 🌺`,
                `${namePrefix}استكشافك رائع! 🚣`
            ],
            negative: [
                `${namePrefix}الأمواج صعبة بس نقدر! 🌊`,
                `${namePrefix}المغامرون لا يستسلمون! 🏝️`,
                `${namePrefix}أنت أقوى مما تظن! 💪`,
                `${namePrefix}البحر يعلمنا الصبر! 🌺`
            ],
            question: [
                `${namePrefix}سؤال مغامر! تعال نكتشف! 🧭`,
                `${namePrefix}فضولك يقودك للنجاح! 🌟`,
                `${namePrefix}الأسئلة بداية الاكتشاف! 🔍`
            ],
            general: [
                `${namePrefix}أخبرني عن مغامرتك! 🌊`,
                `${namePrefix}رحلتك ملهمة! 🏝️`,
                `${namePrefix}استمر في الاستكشاف! 🚣`
            ]
        },
        antar: {
            positive: [
                `${namePrefix}يا فتى، أحسنت! 🗡️`,
                `${namePrefix}بارك الله في شجاعتك! ⚔️`,
                `${namePrefix}أنت فارس حقيقي! 🏇`,
                `${namePrefix}النبل يسكن قلبك! 💫`
            ],
            negative: [
                `${namePrefix}الفرسان لا يعرفون اليأس! ⚔️`,
                `${namePrefix}الشجاعة في المثابرة! 🗡️`,
                `${namePrefix}أنت أقوى مما تعتقد! 💪`,
                `${namePrefix}الصبر من شيم الكرام! 🏇`
            ],
            question: [
                `${namePrefix}سؤال حكيم يا بني! 🤔`,
                `${namePrefix}الفضول علامة الذكاء! 💭`,
                `${namePrefix}العلم نور! 📚`
            ],
            general: [
                `${namePrefix}حدثني عن بطولتك! 🗡️`,
                `${namePrefix}قصتك نبيلة! ⚔️`,
                `${namePrefix}أنت مثال يحتذى! 🏇`
            ]
        },
        aisha: {
            positive: [
                `${namePrefix}يا ذكي! ممتاز! 🔬`,
                `${namePrefix}ما شاء الله! عقلك رائع! 🧪`,
                `${namePrefix}اكتشاف مذهل! 🔍`,
                `${namePrefix}أنت عالم صغير! 🌟`
            ],
            negative: [
                `${namePrefix}العلماء يجربون كثيراً! 🔬`,
                `${namePrefix}الأخطاء جزء من التعلم! 🧪`,
                `${namePrefix}كل تجربة درس جديد! 📚`,
                `${namePrefix}الفضول يقود للنجاح! 🔍`
            ],
            question: [
                `${namePrefix}سؤال علمي رائع! 🤔`,
                `${namePrefix}دعنا نكتشف الإجابة! 🔬`,
                `${namePrefix}فضولك العلمي مميز! 💡`
            ],
            general: [
                `${namePrefix}ماذا تعلمت اليوم؟ 📚`,
                `${namePrefix}أخبرني عن تجربتك! 🧪`,
                `${namePrefix}اكتشافاتك مثيرة! 🔍`
            ]
        }
    };

    const responses = characterResponses[character.id] || characterResponses.zuzu;

    let responseArray;
    if (isPositive) {
        responseArray = responses.positive;
    } else if (isNegative) {
        responseArray = responses.negative;
    } else if (isQuestion) {
        responseArray = responses.question;
    } else {
        responseArray = responses.general;
    }

    // Add behavior-specific encouragement
    const behaviorEncouragement = {
        tidiness: 'الترتيب يجعلك تشعر بالراحة!',
        respect: 'احترام الوالدين شيء عظيم!',
        homework: 'التعلم مغامرة رائعة!',
        sharing: 'المشاركة تجلب السعادة!',
        honesty: 'الصدق يبني الثقة!',
        sleep: 'النوم الجيد يجعلك قوياً!',
        healthy_eating: 'الأكل الصحي يجعلك بطلاً!',
        kindness: 'اللطف ينشر السعادة!'
    };

    const randomResponse = responseArray[Math.floor(Math.random() * responseArray.length)];
    const encouragement = behaviorEncouragement[behavior.id] || 'أنت رائع!';

    // Randomly decide to add encouragement (50% chance)
    if (Math.random() > 0.5) {
        return `${randomResponse} ${encouragement}`;
    }

    return randomResponse;
};

/**
 * Enhanced Text-to-Speech with better voice selection
 */
export const speak = (text, characterId) => {
    return new Promise((resolve) => {
        if (!window.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            resolve();
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';

        // Character voice profiles
        const profiles = {
            zuzu: { gender: 'female', pitch: 1.5, rate: 1.15, volume: 1.0 },
            elsa: { gender: 'female', pitch: 1.1, rate: 0.9, volume: 0.95 },
            spiderman: { gender: 'male', pitch: 1.3, rate: 1.15, volume: 1.0 },
            moana: { gender: 'female', pitch: 1.35, rate: 1.05, volume: 1.0 },
            antar: { gender: 'male', pitch: 0.75, rate: 0.9, volume: 1.0 },
            aisha: { gender: 'female', pitch: 1.25, rate: 1.0, volume: 0.95 }
        };

        const profile = profiles[characterId] || profiles.zuzu;

        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = profile.volume;

        // Get available voices
        let voices = window.speechSynthesis.getVoices();

        // If voices not loaded yet, wait for them
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                selectVoiceAndSpeak(utterance, voices, profile, resolve);
            };
        } else {
            selectVoiceAndSpeak(utterance, voices, profile, resolve);
        }
    });
};

/**
 * Helper function to select voice and speak
 */
const selectVoiceAndSpeak = (utterance, voices, profile, resolve) => {
    let selectedVoice = null;

    // Try to find Arabic voices
    const arabicVoices = voices.filter(v => v.lang.includes('ar'));

    if (profile.gender === 'female') {
        // Prefer female Arabic voices
        selectedVoice = arabicVoices.find(v =>
            v.name.includes('Laila') ||
            v.name.includes('Zira') ||
            v.name.includes('Hoda') ||
            v.name.includes('Female') ||
            (!v.name.includes('Maged') && !v.name.includes('Naayf') && !v.name.includes('Tarik'))
        );
    } else {
        // Prefer male Arabic voices
        selectedVoice = arabicVoices.find(v =>
            v.name.includes('Maged') ||
            v.name.includes('Naayf') ||
            v.name.includes('Tarik') ||
            v.name.includes('Male')
        );
    }

    // Fallback to any Arabic voice
    if (!selectedVoice) {
        selectedVoice = arabicVoices[0];
    }

    // Final fallback to default voice
    if (!selectedVoice) {
        selectedVoice = voices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;

        // Adjust pitch based on actual voice gender
        const isVoiceActuallyMale = selectedVoice.name.includes('Maged') ||
            selectedVoice.name.includes('Naayf') ||
            selectedVoice.name.includes('Tarik') ||
            selectedVoice.name.includes('Male');

        if (profile.gender === 'female' && isVoiceActuallyMale) {
            utterance.pitch = Math.min(2.0, profile.pitch + 0.3);
        } else if (profile.gender === 'male' && !isVoiceActuallyMale) {
            utterance.pitch = Math.max(0.5, profile.pitch - 0.2);
        }
    }

    // Set up event handlers
    utterance.onend = () => {
        console.log('Speech finished');
        resolve();
    };

    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        resolve();
    };

    // Safety timeout
    const timeout = setTimeout(() => {
        console.warn('Speech timeout');
        window.speechSynthesis.cancel();
        resolve();
    }, 15000); // 15 seconds max

    utterance.onend = () => {
        clearTimeout(timeout);
        resolve();
    };

    utterance.onerror = () => {
        clearTimeout(timeout);
        resolve();
    };

    // Start speaking
    try {
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Failed to speak:', error);
        clearTimeout(timeout);
        resolve();
    }
};

/**
 * Log interaction for analytics (privacy-safe)
 */
export const logInteraction = (data) => {
    try {
        // Only log non-personal data for analytics
        const logData = {
            timestamp: new Date().toISOString(),
            character: data.character,
            behavior: data.behavior,
            source: data.source,
            success: data.success,
            duration: data.duration,
            turns: data.turns,
            reason: data.reason
        };

        // In production, send to analytics service
        console.log('Interaction logged:', logData);

        // Store locally for session stats (optional)
        const sessionLogs = JSON.parse(localStorage.getItem('sessionLogs') || '[]');
        sessionLogs.push(logData);

        // Keep only last 10 sessions
        if (sessionLogs.length > 10) {
            sessionLogs.shift();
        }

        localStorage.setItem('sessionLogs', JSON.stringify(sessionLogs));
    } catch (error) {
        console.error('Failed to log interaction:', error);
    }
};

/**
 * Get session statistics
 */
export const getSessionStats = () => {
    try {
        const sessionLogs = JSON.parse(localStorage.getItem('sessionLogs') || '[]');

        const stats = {
            totalSessions: sessionLogs.length,
            totalDuration: sessionLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
            totalTurns: sessionLogs.reduce((sum, log) => sum + (log.turns || 0), 0),
            favoriteCharacter: null,
            favoriteBehavior: null,
            successRate: 0
        };

        // Calculate favorites
        const characterCounts = {};
        const behaviorCounts = {};
        let successCount = 0;

        sessionLogs.forEach(log => {
            characterCounts[log.character] = (characterCounts[log.character] || 0) + 1;
            behaviorCounts[log.behavior] = (behaviorCounts[log.behavior] || 0) + 1;
            if (log.success) successCount++;
        });

        stats.favoriteCharacter = Object.keys(characterCounts).reduce((a, b) =>
            characterCounts[a] > characterCounts[b] ? a : b, null
        );

        stats.favoriteBehavior = Object.keys(behaviorCounts).reduce((a, b) =>
            behaviorCounts[a] > behaviorCounts[b] ? a : b, null
        );

        stats.successRate = sessionLogs.length > 0 ? (successCount / sessionLogs.length) * 100 : 0;

        return stats;
    } catch (error) {
        console.error('Failed to get session stats:', error);
        return null;
    }
};

/**
 * Clear session data (for privacy)
 */
export const clearSessionData = () => {
    try {
        localStorage.removeItem('sessionLogs');
        console.log('Session data cleared');
    } catch (error) {
        console.error('Failed to clear session data:', error);
    }
};