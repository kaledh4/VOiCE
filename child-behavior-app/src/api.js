const HUGGINGFACE_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

export const getAIResponse = async (character, behavior, userMessage) => {
    if (!HUGGINGFACE_TOKEN) {
        console.warn("Hugging Face token is missing. Using simulation.");
        return null;
    }

    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            {
                headers: { Authorization: `Bearer ${HUGGINGFACE_TOKEN}` },
                method: "POST",
                body: JSON.stringify({
                    inputs: `<s>[INST] You are ${character.name}, a ${character.personality} character for children. 
          The child is talking to you about ${behavior.name}. 
          Respond in Arabic in a very friendly, encouraging, and playful way. 
          Keep it short (max 2 sentences) and engaging for a child.
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

// Simple Text-to-Speech using Web Speech API
export const speak = (text, voiceName = 'nova') => {
    return new Promise((resolve) => {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';

        // Try to find a good Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.includes('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;

        utterance.pitch = 1.2;
        utterance.rate = 0.9;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
};
