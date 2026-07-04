import { useState, useEffect, useRef } from "react";

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      recognitionRef.current = rec;
    }

    // Check Speech Synthesis support
    if (window.speechSynthesis) {
      setTtsSupported(true);
    }
  }, []);

  const startListening = (onResult: (text: string) => void) => {
    if (!recognitionRef.current) return;
    
    // Stop speaking if speaking
    stopSpeaking();
    
    try {
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        onResult(resultText);
      };
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech Recognition already running or failed to start:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speaking
    window.speechSynthesis.cancel();
    
    // Clean markdown characters from text before reading for a better voice experience
    const cleanText = text
      .replace(/[*_`#\-+]/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // clean markdown links
      .substring(0, 500); // Limit to first 500 chars to avoid buffer issues

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    
    // Choose an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en-"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    isListening,
    isSpeaking,
    voiceSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
