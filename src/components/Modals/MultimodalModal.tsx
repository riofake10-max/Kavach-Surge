import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Upload, Camera, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { assessImageVulnerability, ImageVulnerabilityAssessment } from '../../ai/vulnerabilityImage';
import { triageStormDamage, DamageTriageResult } from '../../ai/damageTriage';

// Sample pre-bundled image scenes (base64 svg illustrations of coastal infrastructure)
const SAMPLE_PRE_IMAGES = [
  {
    id: 'sample_tin_roofs',
    name: 'Coastal Settlement (Puri Polders)',
    description: 'Semi-pucca structures with unbraced corrugated tin roofs near tidal inlet',
    svgData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><path d="M50 220 L150 120 L250 220 Z" fill="%2364748b"/><polygon points="150,120 280,100 360,200 250,220" fill="%23475569"/><rect x="70" y="220" width="160" height="70" fill="%23334155"/><rect x="100" y="240" width="30" height="50" fill="%231e293b"/><path d="M0 270 C100 250 300 290 400 270 L400 300 L0 300 Z" fill="%230891b2"/><text x="20" y="40" fill="%2338bdf8" font-family="monospace" font-size="14">DRONE SURVEY: PURI LITTORAL POLDER</text></svg>',
  },
  {
    id: 'sample_substation_embankment',
    name: '33kV Substation Embankment',
    description: 'Electrical step-down substation adjacent to agricultural drainage canal',
    svgData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><rect x="60" y="160" width="80" height="110" fill="%23475569" stroke="%2394a3b8"/><rect x="180" y="140" width="90" height="130" fill="%23334155" stroke="%2394a3b8"/><line x1="100" y1="160" x2="220" y2="140" stroke="%23eab308" stroke-width="3"/><path d="M0 260 L400 260 L400 300 L0 300 Z" fill="%230284c7"/><text x="20" y="40" fill="%23eab308" font-family="monospace" font-size="14">SITE RECON: 33/11kV SUBSTATION PERIMETER</text></svg>',
  },
];

const SAMPLE_POST_IMAGES = [
  {
    id: 'sample_post_breached_road',
    name: 'Breached Coastal Causeway (Post-Landfall)',
    description: 'Submerged arterial highway with downed power poles and debris blockage',
    svgData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><rect x="0" y="120" width="400" height="180" fill="%231e3a8a"/><line x1="80" y1="200" x2="160" y2="280" stroke="%23713f12" stroke-width="12"/><line x1="220" y1="140" x2="310" y2="220" stroke="%2364748b" stroke-width="6"/><text x="20" y="40" fill="%23f87171" font-family="monospace" font-size="14">RAPID DAMAGE TRIAGE: ARTERIAL SUBMERGENCE</text></svg>',
  },
];

export const MultimodalModal: React.FC = () => {
  const {
    isMultimodalOpen,
    setIsMultimodalOpen,
    selectedAssetForImage,
    applyAiImageAssessment,
    vmaxKt,
    floodSimResult,
    activeScenario,
  } = useAppStore();

  const [mode, setMode] = useState<'vulnerability' | 'damage_triage'>('vulnerability');
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_PRE_IMAGES[0].svgData);
  const [loading, setLoading] = useState(false);
  const [vulnResult, setVulnResult] = useState<ImageVulnerabilityAssessment | null>(null);
  const [triageResult, setTriageResult] = useState<DamageTriageResult | null>(null);

  if (!isMultimodalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAssessment = async () => {
    setLoading(true);
    // Extract base64 without prefix
    const base64 = selectedImage.split(',')[1] || selectedImage;
    const mime = selectedImage.includes('image/png')
      ? 'image/png'
      : selectedImage.includes('image/jpeg')
      ? 'image/jpeg'
      : 'image/svg+xml';

    if (mode === 'vulnerability') {
      const result = await assessImageVulnerability(base64, mime, {
        assetName: selectedAssetForImage?.name || 'Selected Coastal Facility',
        windExposureKt: selectedAssetForImage?.windExposureKt || vmaxKt,
        floodDepthM: selectedAssetForImage?.floodDepthM || floodSimResult.maxFloodDepthM,
        locationName: activeScenario.region,
      });
      setVulnResult(result);
      if (selectedAssetForImage) {
        applyAiImageAssessment(selectedAssetForImage.id, result);
      }
    } else {
      const result = await triageStormDamage(base64, mime);
      setTriageResult(result);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex flex-col text-xs font-sans overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Gemini Multimodal Coastal Infrastructure Assessor
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Computer Vision Engineering Triage for Bay of Bengal Structures
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMultimodalOpen(false)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setMode('vulnerability');
              setSelectedImage(SAMPLE_PRE_IMAGES[0].svgData);
              setVulnResult(null);
            }}
            className={`px-3 py-1.5 rounded font-mono font-medium text-xs transition-colors ${
              mode === 'vulnerability'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A) Pre-Landfall Vulnerability Assessment
          </button>
          <button
            onClick={() => {
              setMode('damage_triage');
              setSelectedImage(SAMPLE_POST_IMAGES[0].svgData);
              setTriageResult(null);
            }}
            className={`px-3 py-1.5 rounded font-mono font-medium text-xs transition-colors ${
              mode === 'damage_triage'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            B) Post-Event Damage Triage
          </button>
        </div>

        {/* Main Content Split (Left: Image & Samples, Right: AI Result) */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Image Selection & Preview */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Source Aerial / Drone / Street Photograph
            </div>

            {/* Image Preview Box */}
            <div className="h-56 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center relative">
              <img
                src={selectedImage}
                alt="Infrastructure inspection target"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur">
                Target: {selectedAssetForImage?.name || 'Coastal Zone Asset'}
              </div>
            </div>

            {/* Bundled Samples Picker */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400">Select Bundled Sample or Upload Photo:</div>
              <div className="grid grid-cols-2 gap-2">
                {(mode === 'vulnerability' ? SAMPLE_PRE_IMAGES : SAMPLE_POST_IMAGES).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedImage(s.svgData);
                      setVulnResult(null);
                      setTriageResult(null);
                    }}
                    className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-200 truncate">{s.name}</div>
                    <div className="text-[9px] text-slate-400 line-clamp-1">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom File Upload */}
            <label className="w-full py-2 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Custom Drone / Street JPG or PNG</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Run Button */}
            <button
              onClick={handleRunAssessment}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini Analyzing Structural Cues...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Execute Gemini Multimodal Assessment</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: AI Analysis Result */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Structured Engineering Findings
            </div>

            {/* Pre-Landfall Vulnerability Results */}
            {mode === 'vulnerability' && vulnResult && (
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
                {/* Score Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">AI VULNERABILITY SCORE</div>
                    <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                      {vulnResult.vulnerability_score_0_100}/100
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <div className="text-slate-400">Confidence: {(vulnResult.confidence * 100).toFixed(0)}%</div>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 uppercase font-bold">
                      Roof Risk: {vulnResult.roof_type_risk}
                    </span>
                  </div>
                </div>

                {/* Structure Types */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">IDENTIFIED STRUCTURE TYPES:</div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-cyan-300">
                    {vulnResult.structure_types.map((st, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Elevation & Drainage */}
                <div className="p-2.5 rounded bg-slate-950 text-[11px] text-slate-300 space-y-1">
                  <div><strong>Elevation Cues:</strong> {vulnResult.elevation_cues}</div>
                  <div><strong>Drainage Bottlenecks:</strong> {vulnResult.drainage_condition}</div>
                </div>

                {/* Key Aerodynamic / Water Risks */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">PRIMARY VULNERABILITY MECHANISMS:</div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {vulnResult.key_risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Hardening */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">RECOMMENDED HARDENING DIRECTIVES:</div>
                  <ul className="space-y-1 text-[11px] text-emerald-300">
                    {vulnResult.recommended_hardening.map((hard, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{hard}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
                  Score injected back into facility Vulnerability Index as "AI-Assessed".
                </div>
              </div>
            )}

            {/* Post-Event Damage Triage Results */}
            {mode === 'damage_triage' && triageResult && (
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">DAMAGE SEVERITY CLASSIFICATION</div>
                    <div className="text-xl font-bold font-mono text-rose-400">{triageResult.damage_level}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-red-950 text-red-300 border border-red-500/30 uppercase font-mono font-bold">
                    PRIORITY: {triageResult.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">IDENTIFIED LIFE-SAFETY HAZARDS:</div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {triageResult.visible_hazards.map((haz, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{haz}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded bg-slate-950 text-[11px] text-slate-300 leading-relaxed">
                  <strong>Engineering Observations:</strong> {triageResult.observations}
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">URGENT TACTICAL ACTIONS:</div>
                  <ul className="space-y-1 text-[11px] text-emerald-300">
                    {triageResult.urgent_actions.map((act, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!vulnResult && !triageResult && (
              <div className="p-6 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-center text-slate-500 space-y-2">
                <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Select a pre-bundled sample or upload a photo, then click "Execute Gemini Multimodal Assessment".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
