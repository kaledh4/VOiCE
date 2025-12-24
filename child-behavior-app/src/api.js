const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

export const getAIResponse = async (character, behavior, userMessage) => {
    if (!HUGGINGFACE_TOKEN) {
        console.warn("Hugging Face token is missing. Using simulation.");
        return null;
    }

    // Dialect and personality instructions based on character
    const characterPrompts = {
        zuzu: "تحدث بلهجة مصرية مرحة ومشجعة كأنك بطلة خارقة قوية. استخدم كلمات مثل 'يا بطل'، 'يا بطل'، 'جامد جداً'.",
        elsa: "تحدث بلغة عربية فصحى هادئة وراقية كأنك ملكة حكيمة. استخدم كلمات مثل 'عزيزي'، 'بني'، 'نور المستقبل'.",
        spiderman: "تحدث بلهجة شامية أو بيضاء مرحة وسريعة كأنك مراهق بطل. استخدم كلمات مثل 'يا بطل'، 'كفو'، 'رهيب'.",
        moana: "تحدث بلهجة خليجية أو بيضاء مليئة بالحماس والمغامرة. استخدم كلمات مثل 'يا شجاع'، 'يا بطل'، 'المستقبل قدامك'.",
        antar: "تحدث بلغة عربية فصحى قوية وجزلة كأنك فارس شجاع من العصر الجاهلي. استخدم كلمات مثل 'يا فتى'، 'يا شجاع'، 'أبشر'."
    };

    const prompt = characterPrompts[character.id] || "تحدث بالعربية بأسلوب مرح ومناسب للأطفال.";

    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            {
                headers: { Authorization: `Bearer ${HUGGINGFACE_TOKEN}` },
                method: "POST",
                body: JSON.stringify({
                    inputs: `<s>[INST] You are ${character.name}. ${prompt}
          The child is talking to you about ${behavior.name}. 
          Respond in Arabic. Keep it very short (1-2 sentences).
          User Message: ${userMessage} [/INST]`,
                }),
            }
        );
        const result = await response.json();
        if (Array.isArray(result) && result[0]?.generated_text) {
            return result[0].generated_text.split('[/INST]').pop().trim();
        }
        return null;
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return null;
    }
};

// Enhanced Text-to-Speech with Voice Profiles
export const speak = (text, characterId) => {
    return new Promise((resolve) => {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';

        // Voice Profiles based on character
        const profiles = {
            zuzu: { pitch: 1.4, rate: 1.1 },      // High pitch, energetic
            elsa: { pitch: 1.0, rate: 0.85 },     // Calm, slow
            spiderman: { pitch: 1.2, rate: 1.2 }, // Fast, youthful
            moana: { pitch: 1.3, rate: 1.0 },     // Energetic
            antar: { pitch: 0.8, rate: 0.9 }      // Deep, slow
        };

        const profile = profiles[characterId] || { pitch: 1.0, rate: 1.0 };
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;

        // Try to find the best Arabic voice available on the system
        const voices = window.speechSynthesis.getVoices();
        // Prefer higher quality voices if available (like 'Maged' on Mac or 'Naayf' on iOS)
        const arabicVoice = voices.find(v => v.lang.includes('ar-SA')) ||
            voices.find(v => v.lang.includes('ar'));

        if (arabicVoice) utterance.voice = arabicVoice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
};
