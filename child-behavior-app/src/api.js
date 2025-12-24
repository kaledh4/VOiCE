const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

export const getAIResponse = async (character, behavior, userMessage) => {
    if (!HUGGINGFACE_TOKEN) {
        console.warn("Hugging Face token is missing. Using simulation.");
        return simulateResponse(character, behavior);
    }

    const characterPrompts = {
        zuzu: "تحدثي بلهجة مصرية مرحة ومشجعة كأنك بطلة خارقة قوية. استخدمي كلمات مثل 'يا بطل'، 'يا وحش'.",
        elsa: "تحدثي بلغة عربية فصحى هادئة وراقية كأنك ملكة حكيمة. استخدمي كلمات مثل 'عزيزي'، 'بني'.",
        spiderman: "تحدث بلهجة شامية أو بيضاء مرحة وسريعة كأنك مراهق بطل. استخدم كلمات مثل 'يا بطل'، 'كفو'.",
        moana: "تحدثي بلهجة خليجية أو بيضاء مليئة بالحماس والمغامرة. استخدمي كلمات مثل 'يا شجاع'، 'يا بطل'.",
        antar: "تحدث بلغة عربية فصحى قوية وجزلة كأنك فارس شجاع. استخدم كلمات مثل 'يا فتى'، 'يا شجاع'."
    };

    const prompt = characterPrompts[character.id] || "تحدث بالعربية بأسلوب مرح ومناسب للأطفال.";

    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            {
                headers: {
                    "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: `<s>[INST] You are ${character.name}. ${prompt}
          The child is talking to you about ${behavior.name}. 
          Respond in Arabic. Keep it very short (1-2 sentences).
          User Message: ${userMessage} [/INST]`,
                    parameters: {
                        max_new_tokens: 100,
                        return_full_text: false
                    }
                }),
            }
        );

        const result = await response.json();

        if (result.error) {
            console.error("HF Error:", result.error);
            return simulateResponse(character, behavior);
        }

        if (Array.isArray(result) && result[0]?.generated_text) {
            return result[0].generated_text.trim();
        }

        return simulateResponse(character, behavior);
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return simulateResponse(character, behavior);
    }
};

const simulateResponse = (character, behavior) => {
    const fallbacks = [
        "أنت رائع جداً! أخبرني المزيد عن مغامراتك اليوم؟",
        "يا لك من بطل شجاع! أنا فخور بك جداً.",
        "هذا مذهل! هل تحب أن نفعل شيئاً ممتعاً معاً؟",
        "كلامك جميل جداً، استمر في كونك طفلاً رائعاً!",
        "أنا أسمعك يا بطل، أنت دائماً تبهرني بأفعالك الجميلة."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

// Enhanced Text-to-Speech with Gender and Character Profiles
export const speak = (text, characterId) => {
    return new Promise((resolve) => {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';

        const profiles = {
            zuzu: { gender: 'female', pitch: 1.4, rate: 1.1 },
            elsa: { gender: 'female', pitch: 1.0, rate: 0.85 },
            spiderman: { gender: 'male', pitch: 1.2, rate: 1.1 },
            moana: { gender: 'female', pitch: 1.3, rate: 1.0 },
            antar: { gender: 'male', pitch: 0.7, rate: 0.9 }
        };

        const profile = profiles[characterId] || { gender: 'female', pitch: 1.0, rate: 1.0 };
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;

        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (profile.gender === 'female') {
            selectedVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Laila') || v.name.includes('Zira') || v.name.includes('Hoda') || v.name.includes('Naayf') === false));
        } else {
            selectedVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Maged') || v.name.includes('Naayf') || v.name.includes('Tarik')));
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('ar-SA')) || voices.find(v => v.lang.includes('ar'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            const isVoiceActuallyMale = selectedVoice.name.includes('Maged') || selectedVoice.name.includes('Naayf') || selectedVoice.name.includes('Tarik');
            if (profile.gender === 'female' && isVoiceActuallyMale) {
                utterance.pitch = 1.6;
            } else if (profile.gender === 'male' && !isVoiceActuallyMale) {
                utterance.pitch = 0.7;
            }
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        // Timeout fallback to ensure the promise resolves even if TTS fails
        const timeout = setTimeout(() => {
            window.speechSynthesis.cancel();
            resolve();
        }, 10000);

        utterance.onend = () => {
            clearTimeout(timeout);
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
};
