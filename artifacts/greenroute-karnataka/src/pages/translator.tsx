import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, ArrowRight, Check, Copy, Languages, 
  Mic, MicOff, RefreshCw, Sparkles, Volume2, 
  MessageSquare, Trash2, HelpCircle, MapPin
} from 'lucide-react';
import { useTranslateSpeech } from '@workspace/api-client-react';

export interface LanguageOption {
  code: string;
  name: string;
  localName: string;
  region: string;
  isKarnataka: boolean;
  voiceCode: string;
}

export const KARNATAKA_LANGUAGES: LanguageOption[] = [
  { code: 'kn', name: 'Kannada', localName: 'ಕನ್ನಡ', region: 'Statewide · Bengaluru & Mysuru', isKarnataka: true, voiceCode: 'kn-IN' },
  { code: 'tcy', name: 'Tulu', localName: 'ತುಳು', region: 'Coastal · Mangaluru, Udupi & Tulunadu', isKarnataka: true, voiceCode: 'kn-IN' },
  { code: 'kok', name: 'Konkani', localName: 'ಕೊಂಕಣಿ', region: 'Coastal · Karwar, Honnavar & Bhatkal', isKarnataka: true, voiceCode: 'mr-IN' },
  { code: 'kfa', name: 'Kodava Takk', localName: 'ಕೊಡವ ತಕ್ಕ್', region: 'Highlands · Madikeri & Coorg', isKarnataka: true, voiceCode: 'kn-IN' },
  { code: 'ur-ka', name: 'Daccani Urdu', localName: 'ದಖ್ಖನಿ / دکنی', region: 'North/Central · Hubballi, Bidar & Vijayapura', isKarnataka: true, voiceCode: 'ur-IN' },
];

export const TOURIST_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', localName: 'English', region: 'Global', isKarnataka: false, voiceCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', localName: 'हिन्दी', region: 'India', isKarnataka: false, voiceCode: 'hi-IN' },
  { code: 'ta', name: 'Tamil', localName: 'தமிழ்', region: 'South India', isKarnataka: false, voiceCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', localName: 'తెలుగు', region: 'South India', isKarnataka: false, voiceCode: 'te-IN' },
  { code: 'ml', name: 'Malayalam', localName: 'മലയാളം', region: 'South India', isKarnataka: false, voiceCode: 'ml-IN' },
  { code: 'mr', name: 'Marathi', localName: 'मराठी', region: 'Western India', isKarnataka: false, voiceCode: 'mr-IN' },
  { code: 'bn', name: 'Bengali', localName: 'বাংলা', region: 'Eastern India', isKarnataka: false, voiceCode: 'bn-IN' },
  { code: 'es', name: 'Spanish', localName: 'Español', region: 'International', isKarnataka: false, voiceCode: 'es-ES' },
  { code: 'fr', name: 'French', localName: 'Français', region: 'International', isKarnataka: false, voiceCode: 'fr-FR' },
  { code: 'de', name: 'German', localName: 'Deutsch', region: 'International', isKarnataka: false, voiceCode: 'de-DE' },
];

interface QuickPhrase {
  category: string;
  phrase: string;
  icon: string;
}

const QUICK_PHRASES: QuickPhrase[] = [
  // Transport & Auto
  { category: 'Auto & Travel', phrase: 'How much to the railway station?', icon: '🛺' },
  { category: 'Auto & Travel', phrase: 'Please put on the meter', icon: '🛺' },
  { category: 'Auto & Travel', phrase: 'Please stop here', icon: '🛺' },
  { category: 'Auto & Travel', phrase: 'Which bus goes to the main bus stand?', icon: '🚌' },

  // Food & Dining
  { category: 'Food & Chai', phrase: 'One plate Masala Dosa please', icon: '🍛' },
  { category: 'Food & Chai', phrase: 'Is this food very spicy?', icon: '🌶️' },
  { category: 'Food & Chai', phrase: 'Can I have drinking water?', icon: '💧' },
  { category: 'Food & Chai', phrase: 'Please bring the bill', icon: '🧾' },

  // Directions
  { category: 'Directions', phrase: 'Where is the temple / beach entrance?', icon: '📍' },
  { category: 'Directions', phrase: 'Is it nearby or far away?', icon: '🚶' },
  { category: 'Directions', phrase: 'Which way is the main market?', icon: '🧭' },

  // Shopping
  { category: 'Shopping', phrase: 'How much is this? Any discount?', icon: '🛍️' },
  { category: 'Shopping', phrase: 'Do you accept Google Pay / PhonePe / UPI?', icon: '📱' },

  // Emergency & Courtesies
  { category: 'Courtesies', phrase: 'Hello / Greetings', icon: '🙏' },
  { category: 'Courtesies', phrase: 'Thank you very much', icon: '✨' },
  { category: 'Courtesies', phrase: 'How are you? / Have you eaten?', icon: '☕' },
  { category: 'Emergency', phrase: 'Please help me, I am lost', icon: '🆘' },
  { category: 'Emergency', phrase: 'Where is the nearest hospital or medical shop?', icon: '🏥' },
];

interface HistoryItem {
  id: string;
  timestamp: string;
  sourceText: string;
  translatedText: string;
  romanized: string;
  fromLang: LanguageOption;
  toLang: LanguageOption;
  speaker: 'tourist' | 'local';
}

export function LocalTranslatorPage({ defaultHub }: { defaultHub?: string }) {
  const [direction, setDirection] = useState<'tourist-to-local' | 'local-to-tourist'>('tourist-to-local');
  const [touristLang, setTouristLang] = useState<LanguageOption>(TOURIST_LANGUAGES[0]);
  
  // Choose default Karnataka language based on hub
  const getInitialKarnatakaLang = () => {
    if (defaultHub === 'Mangaluru' || defaultHub === 'Udupi') return KARNATAKA_LANGUAGES[1]; // Tulu
    if (defaultHub === 'Madikeri') return KARNATAKA_LANGUAGES[3]; // Kodava
    if (defaultHub === 'Bidar' || defaultHub === 'Vijayapura' || defaultHub === 'Hubballi') return KARNATAKA_LANGUAGES[4]; // Daccani
    return KARNATAKA_LANGUAGES[0]; // Kannada
  };

  const [karnatakaLang, setKarnatakaLang] = useState<LanguageOption>(getInitialKarnatakaLang);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.9);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<{
    translatedText: string;
    romanized: string;
    pronunciation?: string;
    notes?: string;
  } | null>(null);

  const translateMutation = useTranslateSpeech();
  const recognitionRef = useRef<any>(null);

  const fromLang = direction === 'tourist-to-local' ? touristLang : karnatakaLang;
  const toLang = direction === 'tourist-to-local' ? karnatakaLang : touristLang;

  // Setup Web Speech API for voice recording
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = null;
    setVoiceError('');
    if (!SpeechRecognition) {
      setVoiceError('Voice recording is unavailable in this browser. You can still type and play translations aloud.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = fromLang.voiceCode || 'en-IN';
    recognition.onstart = () => {
      setVoiceError('');
      setIsListening(true);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError('Microphone access was blocked. Allow microphone access in your browser settings and try again.');
      } else if (event.error !== 'aborted') {
        setVoiceError('We could not hear that. Please try again or type the phrase instead.');
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputText(transcript);
      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal && transcript.trim()) {
        triggerTranslation(transcript, fromLang, toLang);
      }
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [fromLang, toLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setVoiceError('Voice recording is supported in Google Chrome, Microsoft Edge, and Safari on desktop and mobile.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setVoiceError('');
        recognitionRef.current.lang = fromLang.voiceCode || 'en-IN';
        recognitionRef.current.start();
      } catch {
        setVoiceError('The microphone is already active. Tap the button again to stop listening.');
      }
    }
  };

  const speakText = (text: string, voiceCode: string, romanizedFallback?: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceCode;
    utterance.rate = speechSpeed;

    const voices = window.speechSynthesis.getVoices();
    // Try to find matching voice
    const matchedVoice = voices.find(v => v.lang.toLowerCase() === voiceCode.toLowerCase() || v.lang.startsWith(voiceCode.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    } else if (romanizedFallback && voiceCode.startsWith('kn') === false) {
      // Use romanized text if native voice is unavailable
      utterance.text = romanizedFallback;
      utterance.lang = 'en-IN';
    }

    window.speechSynthesis.speak(utterance);
  };

  const triggerTranslation = (textToTranslate: string, from: LanguageOption, to: LanguageOption) => {
    if (!textToTranslate.trim()) return;

    translateMutation.mutate(
      {
        data: {
          text: textToTranslate.trim(),
          from: from.code,
          to: to.code,
          context: `Karnataka travel conversation at ${defaultHub ?? 'Bengaluru'}`,
        },
      },
      {
        onSuccess: (data) => {
          setCurrentResult(data);
          const historyEntry: HistoryItem = {
            id: `${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sourceText: textToTranslate.trim(),
            translatedText: data.translatedText,
            romanized: data.romanized,
            fromLang: from,
            toLang: to,
            speaker: direction === 'tourist-to-local' ? 'tourist' : 'local',
          };
          setHistory(prev => [historyEntry, ...prev.slice(0, 19)]);

          if (autoSpeak && data.translatedText) {
            // Speak it aloud for the listener!
            speakText(data.translatedText, to.voiceCode, data.romanized);
          }
        },
      }
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerTranslation(inputText, fromLang, toLang);
  };

  const flipDirection = () => {
    setDirection(prev => (prev === 'tourist-to-local' ? 'local-to-tourist' : 'tourist-to-local'));
    setInputText('');
    setCurrentResult(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = ['All', 'Auto & Travel', 'Food & Chai', 'Directions', 'Shopping', 'Courtesies', 'Emergency'];
  const filteredPhrases = activeCategory === 'All' 
    ? QUICK_PHRASES 
    : QUICK_PHRASES.filter(p => p.category === activeCategory);

  return (
    <main className="page-wrap translator-page">
      {/* Top Header */}
      <div className="translator-header">
        <div>
          <Link href="/" className="backlink">
            <ArrowLeft size={14} /> Back to GreenRoute
          </Link>
          <div className="eyebrow">
            <Languages size={14} style={{ display: 'inline', marginRight: 5 }} />
            KARNATAKA MULTI-LANGUAGE VOICE ASSISTANT
          </div>
          <h1 className="display translator-title">
            Speak with locals.<br />
            <span className="translator-subtitle-kannada">ಸ್ಥಳೀಯರೊಂದಿಗೆ ಸುಲಭವಾಗಿ ಮಾತನಾಡಿ</span>
          </h1>
          <p className="translator-desc">
            Talk in your language, and hear it spoken aloud in <strong>Kannada</strong>, <strong>Tulu</strong>, <strong>Konkani</strong>, <strong>Kodava</strong>, or <strong>Daccani Urdu</strong>. Then listen to their reply!
          </p>
        </div>

        {defaultHub && (
          <div className="translator-hub-pill">
            <MapPin size={15} />
            <span>Regional hub: <strong>{defaultHub}</strong></span>
          </div>
        )}
      </div>

      {/* Main Conversation Box */}
      <div className="translator-card soft-card">
        {/* Direction Switcher & Language Pickers */}
        <div className="translator-lang-bar">
          <div className="lang-box">
            <span className="lang-role-tag">{direction === 'tourist-to-local' ? 'Tourist Speaks' : 'Local Speaks'}</span>
            {direction === 'tourist-to-local' ? (
              <select 
                className="lang-select" 
                value={touristLang.code} 
                onChange={e => setTouristLang(TOURIST_LANGUAGES.find(l => l.code === e.target.value) || TOURIST_LANGUAGES[0])}
                aria-label="Select your language"
              >
                {TOURIST_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name} ({l.localName})</option>
                ))}
              </select>
            ) : (
              <select 
                className="lang-select" 
                value={karnatakaLang.code} 
                onChange={e => setKarnatakaLang(KARNATAKA_LANGUAGES.find(l => l.code === e.target.value) || KARNATAKA_LANGUAGES[0])}
                aria-label="Select local Karnataka language"
              >
                {KARNATAKA_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name} · {l.localName} ({l.region.split('·')[0].trim()})</option>
                ))}
              </select>
            )}
          </div>

          <button 
            type="button" 
            className="lang-flip-btn" 
            onClick={flipDirection}
            title="Swap speaking roles (Tourist ⇄ Local)"
            aria-label="Swap speaker roles"
          >
            <RefreshCw size={18} />
          </button>

          <div className="lang-box">
            <span className="lang-role-tag">{direction === 'tourist-to-local' ? 'Local Hears' : 'Tourist Hears'}</span>
            {direction === 'tourist-to-local' ? (
              <select 
                className="lang-select" 
                value={karnatakaLang.code} 
                onChange={e => setKarnatakaLang(KARNATAKA_LANGUAGES.find(l => l.code === e.target.value) || KARNATAKA_LANGUAGES[0])}
                aria-label="Select local Karnataka language"
              >
                {KARNATAKA_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name} · {l.localName} ({l.region.split('·')[0].trim()})</option>
                ))}
              </select>
            ) : (
              <select 
                className="lang-select" 
                value={touristLang.code} 
                onChange={e => setTouristLang(TOURIST_LANGUAGES.find(l => l.code === e.target.value) || TOURIST_LANGUAGES[0])}
                aria-label="Select your language"
              >
                {TOURIST_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name} ({l.localName})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Input & Microphone Area */}
        <form onSubmit={handleSubmit} className="translator-input-area">
          <div className="input-field-wrap">
            <textarea
              className="translator-textarea"
              rows={3}
              placeholder={direction === 'tourist-to-local' ? 'Speak or type what you want to say to the local...' : 'Speak or type what the local replied...'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
            {inputText && (
              <button 
                type="button" 
                className="clear-input-btn" 
                onClick={() => setInputText('')} 
                aria-label="Clear input text"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Row */}
          <div className="translator-actions-bar">
            <div className="audio-controls-left">
              <button
                type="button"
                className={`voice-record-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Record voice in your language'}
                aria-label={isListening ? 'Stop recording voice' : 'Start recording voice'}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                <span>{isListening ? 'Listening… Tap to finish' : 'Tap to speak'}</span>
              </button>

              <label className="auto-speak-toggle" title="Automatically speak translated audio aloud">
                <input 
                  type="checkbox" 
                  checked={autoSpeak} 
                  onChange={e => setAutoSpeak(e.target.checked)} 
                />
                <span>Auto-speak aloud</span>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn-main translate-submit-btn" 
              disabled={translateMutation.isPending || !inputText.trim()}
            >
              {translateMutation.isPending ? 'Translating…' : 'Translate & Speak'} 
              <ArrowRight size={16} />
            </button>
          </div>
          {voiceError && <p className="translator-voice-error" role="status">{voiceError}</p>}
        </form>

        {/* Active Live Result Card */}
        {currentResult && (
          <div className="translator-result-card reveal">
            <div className="result-card-top">
              <div className="result-lang-badge">
                <span className="dot" />
                <span>{toLang.name} ({toLang.localName})</span>
              </div>
              <div className="result-tools">
                <button 
                  type="button"
                  className="btn-quiet icon-btn"
                  onClick={() => speakText(currentResult.translatedText, toLang.voiceCode, currentResult.romanized)}
                  title="Speak aloud"
                  aria-label="Speak translation aloud"
                >
                  <Volume2 size={18} />
                  <span>Speak Aloud</span>
                </button>
                <button 
                  type="button"
                  className="btn-quiet icon-btn"
                  onClick={() => copyToClipboard(currentResult.translatedText, 'current')}
                  title="Copy translation"
                  aria-label="Copy translated text"
                >
                  {copiedId === 'current' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Native Script Display */}
            <div className="result-native-text">
              {currentResult.translatedText}
            </div>

            {/* Phonetic Pronunciation for Tourist */}
            {currentResult.romanized && currentResult.romanized !== currentResult.translatedText && (
              <div className="result-romanized">
                <span className="roman-label">Phonetic pronunciation:</span>
                <strong>"{currentResult.romanized}"</strong>
              </div>
            )}

            {/* Cultural Tip or Context Note */}
            {currentResult.notes && (
              <div className="result-notes">
                <Sparkles size={14} />
                <span>{currentResult.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instant Essential Travel Phrases */}
      <section className="quick-phrases-section soft-card">
        <div className="phrases-header">
          <div>
            <div className="eyebrow">ONE-TAP TRAVEL PHRASES</div>
            <h2 className="display phrases-title">Quick Karnataka Phrasebook</h2>
            <p>Tap any phrase to instantly translate and speak it aloud in <strong>{karnatakaLang.name}</strong>.</p>
          </div>
          <div className="phrase-categories">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="phrases-grid">
          {filteredPhrases.map((item, idx) => (
            <button
              key={idx}
              className="phrase-card"
              onClick={() => {
                setInputText(item.phrase);
                setDirection('tourist-to-local');
                triggerTranslation(item.phrase, touristLang, karnatakaLang);
              }}
            >
              <span className="phrase-icon">{item.icon}</span>
              <div className="phrase-texts">
                <b>{item.phrase}</b>
                <small>Tap to translate & speak in {karnatakaLang.name}</small>
              </div>
              <Volume2 size={16} className="phrase-speak-icon" />
            </button>
          ))}
        </div>
      </section>

      {/* Live Conversation Transcript */}
      {history.length > 0 && (
        <section className="conversation-history soft-card">
          <div className="history-header">
            <div>
              <div className="eyebrow">DIALOGUE TRANSCRIPT</div>
              <h2 className="display history-title">Recent Conversation</h2>
            </div>
            <button className="btn-quiet" onClick={() => setHistory([])} title="Clear history">
              <Trash2 size={15} /> Clear history
            </button>
          </div>

          <div className="chat-stream">
            {history.map(item => (
              <div key={item.id} className={`chat-bubble ${item.speaker}`}>
                <div className="bubble-meta">
                  <span className="speaker-tag">{item.speaker === 'tourist' ? 'Tourist' : 'Local'} ({item.fromLang.name} → {item.toLang.name})</span>
                  <span className="bubble-time">{item.timestamp}</span>
                </div>
                <div className="bubble-source">"{item.sourceText}"</div>
                <div className="bubble-translated">
                  <b>{item.translatedText}</b>
                  {item.romanized && item.romanized !== item.translatedText && (
                    <span className="bubble-romanized">({item.romanized})</span>
                  )}
                  <button 
                    className="bubble-audio-btn" 
                    onClick={() => speakText(item.translatedText, item.toLang.voiceCode, item.romanized)}
                    aria-label="Replay audio"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regional Language Guide for Tourists */}
      <section className="karnataka-languages-guide soft-card">
        <div className="eyebrow">LINGUISTIC HERITAGE OF KARNATAKA</div>
        <h2 className="display">Languages Across the State</h2>
        <div className="languages-info-grid">
          {KARNATAKA_LANGUAGES.map(lang => (
            <div key={lang.code} className="lang-info-card">
              <div className="lang-badge-tag">{lang.localName}</div>
              <h3>{lang.name}</h3>
              <p className="lang-region">{lang.region}</p>
              <button 
                className="btn-quiet select-lang-btn" 
                onClick={() => {
                  setKarnatakaLang(lang);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Practice in {lang.name} <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
