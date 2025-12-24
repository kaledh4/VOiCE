const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

export const getAIResponse = async (character, behavior, userMessage) => {
    if (!HUGGINGFACE_TOKEN) {
        console.warn("Hugging Face token is missing. Using simulation.");
        return null;
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

        // Character Profiles: Gender, Pitch, Rate
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

        // Logic to find the best matching voice
        let selectedVoice = null;

        // 1. Try to find an Arabic voice that matches the gender in its name (OS dependent)
        if (profile.gender === 'female') {
            selectedVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Zira') || v.name.includes('Laila') || v.name.includes('Maged') === false));
        } else {
            selectedVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Maged') || v.name.includes('Naayf') || v.name.includes('Tarik')));
        }

        // 2. Fallback to any Arabic voice
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('ar-SA')) || voices.find(v => v.lang.includes('ar'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            // If we found a male voice for a female character (or vice versa) due to system limits, 
            // we adjust the pitch even more to compensate.
            const isVoiceActuallyMale = selectedVoice.name.includes('Maged') || selectedVoice.name.includes('Naayf');
            if (profile.gender === 'female' && isVoiceActuallyMale) {
                utterance.pitch = 1.6; // Force higher pitch
            } else if (profile.gender === 'male' && !isVoiceActuallyMale) {
                utterance.pitch = 0.7; // Force lower pitch
            }
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
};
