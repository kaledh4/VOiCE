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
          Keep it short and engaging for a child.
          User Message: ${userMessage} [/INST]`,
                }),
            }
        );
        const result = await response.json();
        return result[0].generated_text.split('[/INST]').pop().trim();
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return null;
    }
};
