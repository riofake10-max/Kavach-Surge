import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { askSituationAnalyst, GroundedContext } from '../../ai/situationAnalyst';
import { executeWhatIfCommand } from '../../ai/functionCalling';
import { MessageSquare, Mic, MicOff, Send, Sparkles, Bot, User, Check, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AiAnalystTab: React.FC = () => {
  const {
    activeScenario,
    timeHours,
    vmaxKt,
    tidePhase,
    floodSimResult,
    cascadeSimResult,
    readinessPct,
    parametricState,
    setIntensity,
    setLandfallOffset,
    setTidePhase,
    toggleBackupPower,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Tactical Situation Analyst initialized for **${activeScenario.name}** at stage **T${timeHours >= 0 ? '+' : ''}${timeHours}h**.\n\nAll responses are strictly grounded in your active simulation telemetry (${floodSimResult.maxFloodDepthM}m peak surge, ${cascadeSimResult.cascadeSummary.failedSubstations} failed substations, ₹${parametricState.estimatedPayoutCrores} Cr estimated liquidity). How can I assist the Incident Commander?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build grounded context
  const buildContext = (): GroundedContext => ({
    scenarioName: activeScenario.name,
    region: activeScenario.region,
    stageName: `T${timeHours >= 0 ? '+' : ''}${timeHours}h`,
    timeHours,
    vmaxKt,
    centralPressureHpa: activeScenario.centralPressureHpa,
    shelfSlopeFactor: activeScenario.shelfSlopeFactor,
    tidePhase,
    peakSurgeCoastM: floodSimResult.maxFloodDepthM,
    maxFloodDepthM: floodSimResult.maxFloodDepthM,
    inundatedAreaKm2: floodSimResult.totalInundatedAreaKm2,
    exposedPopulation: floodSimResult.totalExposedPopulation,
    cascadeSummary: cascadeSimResult.cascadeSummary,
    topVulnerableAssets: cascadeSimResult.assets
      .slice()
      .sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex)
      .slice(0, 5)
      .map((a) => ({
        name: a.name,
        type: a.type,
        vulnerabilityIndex: a.vulnerabilityIndex,
        floodDepthM: a.floodDepthM,
        windExposureKt: a.windExposureKt,
        status: a.status,
        hasBackupPower: a.hasBackupPower,
      })),
    readinessPercentage: readinessPct,
    parametricTriggerStatus: parametricState.overallStatus,
    estimatedInsurancePayoutCrores: parametricState.estimatedPayoutCrores,
  });

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Check if query is a What-If action tool invocation
    const isWhatIf =
      textToSend.toLowerCase().includes('set intensity') ||
      textToSend.toLowerCase().includes('tide') ||
      textToSend.toLowerCase().includes('backup');

    if (isWhatIf) {
      const toolResult = await executeWhatIfCommand(textToSend, {
        setIntensity,
        setLandfallOffset,
        setTide: setTidePhase,
        toggleBackupPower,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `model_${Date.now()}`,
          role: 'model',
          text: `⚡ **What-If Tool Action Executed:**\n\n${toolResult.summary}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setLoading(false);
      return;
    }

    // Grounded Analyst response
    const context = buildContext();
    const chatHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    const answer = await askSituationAnalyst(textToSend, context, chatHistory);

    setMessages((prev) => [
      ...prev,
      {
        id: `model_${Date.now()}`,
        role: 'model',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLoading(false);
  };

  // Web Speech API Voice Recognition
  const toggleSpeechRecognition = () => {
    const windowWithSpeech = window as any;
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      handleSend(speechToText);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full text-xs font-sans">
      {/* Suggested Prompts Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 space-y-1.5 shrink-0">
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Grounded Suggested Inquiries</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Which hospital should we protect first and why?',
            'What if the storm intensifies by 20 kt?',
            'Which shelters run out of capacity?',
            'Set intensity to 125 kt',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSend(promptText)}
              className="text-[11px] px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg p-3 text-[11px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="text-[9px] text-slate-400/80 mt-1 text-right font-mono">{m.timestamp}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing active simulation telemetry & citing numbers...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-2 rounded-md border transition-colors ${
            isListening
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={isListening ? 'Listening...' : 'Voice Input (Web Speech API)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask tactical question or type: 'Set intensity to 130 kt'..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 font-sans"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
