import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Send,
  Volume2,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Radio,
  FileCode,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { generateCapXml } from '../../ai/advisories';
import { AdvisoryMessage } from '../../types';

export const AdvisoriesTab: React.FC = () => {
  const { advisories, approveAdvisory, dispatchAdvisory, dispatchedLogs, language } = useAppStore();
  const [selectedAdvisoryId, setSelectedAdvisoryId] = useState<string>(advisories[0]?.id || '');
  const [channelView, setChannelView] = useState<'sms' | 'whatsapp' | 'ivr' | 'cap'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeAdvisory = advisories.find((a) => a.id === selectedAdvisoryId) || advisories[0];

  // SpeechSynthesis read-aloud
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Attempt to set voice for language
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(activeAdvisory?.language || 'en'));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCapXml = () => {
    if (!activeAdvisory) return;
    const xml = generateCapXml(activeAdvisory);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAP_ALERT_${activeAdvisory.audience.toUpperCase()}_${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeAdvisory) {
    return (
      <div className="p-4 text-xs text-slate-400 font-mono text-center">
        No active advisories generated yet.
      </div>
    );
  }

  const capXmlContent = generateCapXml(activeAdvisory);

  return (
    <div className="p-4 space-y-4 text-xs font-sans overflow-y-auto">
      {/* Simulation Warning & Human-in-the-Loop Banner */}
      <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Mandatory Human-in-the-Loop Protocol:</strong> All alerts require officer verification before simulated transmission.
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-amber-300 font-bold">
          SIMULATED DISPATCH
        </span>
      </div>

      {/* Audience Selector Tabs */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase text-slate-400">Target Stakeholder Cohort</div>
        <div className="grid grid-cols-3 gap-1.5">
          {advisories.map((adv) => {
            const isSelected = adv.id === activeAdvisory.id;
            const isApproved = adv.approvedByOfficer;

            return (
              <button
                key={adv.id}
                onClick={() => setSelectedAdvisoryId(adv.id)}
                className={`p-2 rounded text-left transition-colors border ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold truncate">{adv.audienceLabel}</div>
                <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                  <span
                    className={
                      adv.warningLevel === 'Red'
                        ? 'text-red-400 font-bold'
                        : adv.warningLevel === 'Orange'
                        ? 'text-orange-400 font-bold'
                        : 'text-yellow-400 font-bold'
                    }
                  >
                    {adv.warningLevel.toUpperCase()}
                  </span>
                  <span>{isApproved ? '✓ APPROVED' : 'DRAFT'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Format Segmented Control */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setChannelView('whatsapp')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              channelView === 'whatsapp' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WhatsApp Alert
          </button>
          <button
            onClick={() => setChannelView('sms')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              channelView === 'sms' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SMS Broadcast
          </button>
          <button
            onClick={() => setChannelView('ivr')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              channelView === 'ivr' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            IVR Voice Script
          </button>
          <button
            onClick={() => setChannelView('cap')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              channelView === 'cap' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CAP-XML
          </button>
        </div>

        {/* Audio Speech Read Aloud Button */}
        <button
          onClick={() =>
            speakText(
              channelView === 'ivr'
                ? activeAdvisory.ivrVoiceScript
                : channelView === 'sms'
                ? activeAdvisory.smsText
                : activeAdvisory.whatsAppText
            )
          }
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
            isPlayingAudio
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Read broadcast aloud using SpeechSynthesis"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isPlayingAudio ? 'Speaking...' : 'Listen'}</span>
        </button>
      </div>

      {/* Realistic Mockup Box */}
      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
        {channelView === 'whatsapp' && (
          <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30 text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
            {activeAdvisory.whatsAppText}
          </div>
        )}

        {channelView === 'sms' && (
          <div className="space-y-1.5">
            <div className="p-3 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap">
              {activeAdvisory.smsText}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Length: {activeAdvisory.smsText.length} characters</span>
              <span>1 SMS Segment (&lt;300 chars)</span>
            </div>
          </div>
        )}

        {channelView === 'ivr' && (
          <div className="p-3 rounded bg-blue-950/20 border border-blue-500/30 font-sans text-slate-200 leading-relaxed whitespace-pre-wrap">
            <div className="text-[10px] text-blue-400 font-mono font-bold uppercase mb-1">
              Automated IVR Siren & Voice Broadcast Transcript:
            </div>
            {activeAdvisory.ivrVoiceScript}
          </div>
        )}

        {channelView === 'cap' && (
          <div className="space-y-2">
            <pre className="p-2.5 rounded bg-slate-900 font-mono text-[10px] text-cyan-300 overflow-x-auto max-h-48 border border-slate-800">
              {capXmlContent}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={downloadCapXml}
                className="flex-1 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download CAP XML
              </button>
              <button
                onClick={() => copyToClipboard(capXmlContent)}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-mono flex items-center justify-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Approval & Dispatch Controls */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!activeAdvisory.approvedByOfficer ? (
              <button
                onClick={() => approveAdvisory(activeAdvisory.id)}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Approve Draft
              </button>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-mono font-semibold">
                <Check className="w-4 h-4" /> Approved by Duty Officer
              </span>
            )}
          </div>

          <button
            onClick={() => dispatchAdvisory(activeAdvisory.id, channelView.toUpperCase())}
            disabled={!activeAdvisory.approvedByOfficer}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium font-mono flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Dispatch (Simulated)
          </button>
        </div>
      </div>

      {/* Dispatch Audit Logs */}
      {dispatchedLogs.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase text-slate-400">Simulated Dispatch Audit Trail</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {dispatchedLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{log.time}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 uppercase font-semibold">
                    {log.channel}
                  </span>
                  <span>{log.audience}</span>
                </div>
                <div className="text-slate-400">~{log.recipients.toLocaleString('en-IN')} recipients</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
