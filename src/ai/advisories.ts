import { Type } from '@google/genai';
import { getGenAIClient, GEMINI_MODEL, hasGeminiApiKey } from './geminiClient';
import { AdvisoryMessage } from '../types';

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  or: 'ଓଡ଼ିଆ (Odia)',
  bn: 'বাংলা (Bengali)',
  te: 'తెలుగు (Telugu)',
  ta: 'தமிழ் (Tamil)',
};

export const AUDIENCE_INFO: Record<AdvisoryMessage['audience'], { label: string; icon: string; defaultRecipients: number }> = {
  fishermen: { label: 'Fishermen & Coastal Hamlets', icon: 'Ship', defaultRecipients: 48000 },
  urban: { label: 'Urban & Peri-Urban Residents', icon: 'Home', defaultRecipients: 320000 },
  hospitals: { label: 'Hospitals & Medical Facilities', icon: 'Cross', defaultRecipients: 1250 },
  power_utility: { label: 'Power & Grid Utilities', icon: 'Zap', defaultRecipients: 850 },
  district_admin: { label: 'District Administration & Police', icon: 'Shield', defaultRecipients: 4200 },
  transport: { label: 'Transport, Highways & Ports', icon: 'Truck', defaultRecipients: 11000 },
};

export function getSampleAdvisory(
  audience: AdvisoryMessage['audience'],
  lang: string,
  regionName: string,
  vmaxKt: number,
  surgeM: number
): AdvisoryMessage {
  const warningLevel: 'Yellow' | 'Orange' | 'Red' = vmaxKt >= 64 || surgeM >= 2.0 ? 'Red' : vmaxKt >= 45 ? 'Orange' : 'Yellow';

  // Odia translations for Odisha scenario
  if (lang === 'or') {
    if (audience === 'fishermen') {
      return {
        id: `adv_or_fishermen_${Date.now()}`,
        audience: 'fishermen',
        audienceLabel: AUDIENCE_INFO.fishermen.label,
        warningLevel,
        language: 'or',
        smsText: `[ସତର୍କ ସୂଚନା - ଓଡ଼ିଶା ବିପର୍ଯ୍ୟୟ ପରିଚାଳନା]: ସମୁଦ୍ରରେ ବାତ୍ୟା ଭୀଷଣ ରୂପ ନେଉଛି। ପବନର ବେଗ ${Math.round(vmaxKt * 1.85)} କିମି/ଘଣ୍ଟା ଏବଂ ଜୁଆର ${surgeM}ମିଟର ବୃଦ୍ଧି ପାଇବ। କୌଣସି ପରିସ୍ଥିତିରେ ସମୁଦ୍ର ଭିତରକୁ ଯାଆନ୍ତୁ ନାହିଁ। ଡଙ୍ଗାଗୁଡ଼ିକୁ ସୁରକ୍ଷିତ ବାନ୍ଧି ରଖନ୍ତୁ। ସହାୟତା ପାଇଁ ୧୦୭୭ ଡାଏଲ କରନ୍ତୁ।`,
        whatsAppText: `🚨 *ବାତ୍ୟା ଜରୁରୀକାଳୀନ ସତର୍କ ସୂଚନା - ଲାଲ ସଙ୍କେତ (RED ALERT)* 🌊\n\nମତ୍ସ୍ୟଜୀବୀ ଓ ଉପକୂଳବାସୀ ଭାଇଭଉଣୀମାନଙ୍କ ପାଇଁ ସୂଚନା:\n- ଝଡ଼ର ତୀବ୍ରତା: *${Math.round(vmaxKt * 1.85)} km/h* ପବନ\n- ଉପକୂଳ ଜୁଆର: *${surgeM} ମିଟର*\n- ତୁରନ୍ତ ସମସ୍ତ ଡଙ୍ଗା ଉପକୂଳକୁ ଫେରାଇ ଆଣନ୍ତୁ। ସୁରକ୍ଷିତ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀକୁ ଯାଆନ୍ତୁ।\n\n📞 ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ: *1077*`,
        ivrVoiceScript: `ନମସ୍କାର, ଏହା ଜିଲ୍ଲା ପ୍ରଶାସନ ତରଫରୁ ଏକ ଜରୁରୀ ସତର୍କ ବାର୍ତ୍ତା। ଉପକୂଳ ଅଞ୍ଚଳରେ ପ୍ରବଳ ବାତ୍ୟା ମାଡ଼ି ଆସୁଛି। ସମସ୍ତ ମତ୍ସ୍ୟଜୀବୀ ଭାଇମାନେ ସମୁଦ୍ରକୁ ଯାଆନ୍ତୁ ନାହିଁ। ନିକଟସ୍ଥ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀକୁ ଚାଲିଆସନ୍ତୁ।`,
        capAlert: createCapAlertObject('or', 'fishermen', warningLevel, regionName, vmaxKt, surgeM),
        approvedByOfficer: false,
        recipientsEstimate: AUDIENCE_INFO.fishermen.defaultRecipients,
      };
    }
  }

  // Bengali translations for Bengal / Sundarbans
  if (lang === 'bn') {
    if (audience === 'fishermen') {
      return {
        id: `adv_bn_fishermen_${Date.now()}`,
        audience: 'fishermen',
        audienceLabel: AUDIENCE_INFO.fishermen.label,
        warningLevel,
        language: 'bn',
        smsText: `[সতর্কবার্তা - রাজ্য বিপর্যয় মোকাবিলা দপ্তর]: বঙ্গোপসাগরে তীব্র ঘূর্ণিঝড় ধেয়ে আসছে। বাতাসের গতি ${Math.round(vmaxKt * 1.85)} কিমি/ঘণ্টা এবং জলোচ্ছ্বাস ${surgeM} মিটার। সমুদ্রে যাওয়া সম্পূর্ণ নিষিদ্ধ। অবিলম্বে নিকটবর্তী বহুমুখী সাইক্লোন শেল্টারে আশ্রয় নিন। জরুরি সাহায্য: ১০৭০।`,
        whatsAppText: `🚨 *ঘূর্ণিঝড় জরুরি সতর্কতা - লাল সঙ্কেত (RED ALERT)* 🌊\n\nমৎস্যজীবী ও সুন্দরবন উপকূলবর্তী বাসিন্দাদের জন্য নির্দেশিকা:\n- বাতাসের সর্বোচ্চ গতিবেগ: *${Math.round(vmaxKt * 1.85)} কিমি/ঘণ্টা*\n- উপকূলীয় জলোচ্ছ্বাস: *${surgeM} মিটার*\n- সকল ট্রলার নিরাপদ বাঁধে বেঁধে রাখুন। অবিলম্বে পাকা শেল্টারে যান।\n\n📞 হেল্পলাইন: *1070*`,
        ivrVoiceScript: `নমস্কার, জেলা বিপর্যয় ব্যবস্থাপনা কেন্দ্রের জরুরি বিজ্ঞপ্তি। সুন্দরবন ও উপকূল এলাকায় প্রবল ঘূর্ণিঝড়ের কারণে সমুদ্রে যাওয়া সম্পূর্ণ নিষিদ্ধ। নিরাপদে সাইক্লোন সেন্টারে পৌঁছান।`,
        capAlert: createCapAlertObject('bn', 'fishermen', warningLevel, regionName, vmaxKt, surgeM),
        approvedByOfficer: false,
        recipientsEstimate: AUDIENCE_INFO.fishermen.defaultRecipients,
      };
    }
  }

  // Telugu translations for Andhra / Michaung
  if (lang === 'te') {
    return {
      id: `adv_te_${audience}_${Date.now()}`,
      audience,
      audienceLabel: AUDIENCE_INFO[audience].label,
      warningLevel,
      language: 'te',
      smsText: `[విపత్తు హెచ్చరిక - ఆంధ్రప్రదేశ్]: తీరం దాటుతున్న తీవ్ర తుఫాను. గాలి వేగం ${Math.round(vmaxKt * 1.85)} కి.మీ/గం మరియు ${surgeM} మీటర్ల సముద్రపు పోటు. మత్స్యకారులు సముద్రంలోకి వెళ్లరాదు. సురక్షిత తుఫాను పునరావాస కేంద్రాలకు తరలివెళ్లండి. హెల్ప్‌లైన్: 1070.`,
      whatsAppText: `🚨 *తీవ్ర తుఫాను అత్యవసర హెచ్చరిక (RED ALERT)* ⚠️\n\n${regionName} ప్రజలకు సూచన:\n- గాలి తీవ్రత: *${Math.round(vmaxKt * 1.85)} కి.మీ/గం*\n- సముద్ర ఆటుపోట్లు: *${surgeM} మీటర్లు*\n- విద్యుత్ స్తంభాలకు దూరంగా ఉండండి. తక్షణమే రక్షిత కేంద్రాలకు చేరుకోండి.\n\n📞 కంట్రోల్ రూమ్: *1070*`,
      ivrVoiceScript: `నమస్కారం, ఇది విపత్తు నిర్వహణ విభాగం అత్యవసర సమాచారం. తుఫాను తీరం దాటుతున్నందున ప్రజలందరూ అప్రమత్తంగా ఉండాలి. పునరావాస కేంద్రాలలో తలదాచుకోండి.`,
      capAlert: createCapAlertObject('te', audience, warningLevel, regionName, vmaxKt, surgeM),
      approvedByOfficer: false,
      recipientsEstimate: AUDIENCE_INFO[audience].defaultRecipients,
    };
  }

  // Default English / Hindi professional alerts
  const speedKmh = Math.round(vmaxKt * 1.85);
  return {
    id: `adv_${lang}_${audience}_${Date.now()}`,
    audience,
    audienceLabel: AUDIENCE_INFO[audience].label,
    warningLevel,
    language: lang,
    smsText: `[SDMA ALERT]: Severe Cyclone landfall expected near ${regionName}. Peak wind ${speedKmh} km/h, storm surge ${surgeM}m. Mandatory evacuation ordered for low-lying zones within 5km of coast. Proceed immediately to designated cyclone shelter. Emergency Helpline: 1077 / 112.`,
    whatsAppText: `🚨 *CYCLONE LANDFALL WARNING - ${warningLevel.toUpperCase()} ALERT* 🌀\n\n*Target Zone:* ${regionName}\n*Wind Speed:* Up to *${speedKmh} km/h* (${vmaxKt} kt)\n*Modeled Storm Surge:* *${surgeM} meters* above astronomical tide\n\n*Mandatory Actions:*\n• Move elderly, children & livestock to designated Multipurpose Cyclone Shelters immediately.\n• Secure corrugated tin roofs and loose objects.\n• Turn off main LPG and electrical trip-switches.\n\n📞 *State Emergency Control Room:* 1077 | Police: 112`,
    ivrVoiceScript: `Attention all residents of ${regionName}. This is an urgent broadcast from the District Emergency Operations Centre. A destructive cyclonic storm will make landfall with winds of ${speedKmh} kilometres per hour and ${surgeM} metre storm surge. Please move to your nearest cyclone shelter immediately. Follow SDMA volunteer instructions.`,
    capAlert: createCapAlertObject(lang, audience, warningLevel, regionName, vmaxKt, surgeM),
    approvedByOfficer: false,
    recipientsEstimate: AUDIENCE_INFO[audience].defaultRecipients,
  };
}

function createCapAlertObject(
  lang: string,
  audience: string,
  level: string,
  region: string,
  vmaxKt: number,
  surgeM: number
) {
  return {
    identifier: `IN-NDMA-CAP-${Date.now()}-${audience.toUpperCase()}`,
    sender: 'state-disaster-management-authority@nic.in',
    sent: new Date().toISOString(),
    status: 'Exercise' as const,
    msgType: 'Alert' as const,
    scope: 'Public' as const,
    event: 'Tropical Cyclone Storm Surge Warning',
    urgency: 'Immediate',
    severity: level === 'Red' ? 'Extreme' : 'Severe',
    certainty: 'Observed',
    area: `Bay of Bengal Littoral Zone: ${region}`,
    instruction: `Evacuate all temporary and kutchha dwellings within modeled ${surgeM}m surge zone. Maintain emergency power at hospital triage centers.`,
  };
}

export function generateCapXml(advisory: AdvisoryMessage): string {
  const { capAlert } = advisory;
  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${capAlert.identifier}</identifier>
  <sender>${capAlert.sender}</sender>
  <sent>${capAlert.sent}</sent>
  <status>${capAlert.status}</status>
  <msgType>${capAlert.msgType}</msgType>
  <scope>${capAlert.scope}</scope>
  <info>
    <category>Met</category>
    <event>${capAlert.event}</event>
    <urgency>${capAlert.urgency}</urgency>
    <severity>${capAlert.severity}</severity>
    <certainty>${capAlert.certainty}</certainty>
    <area>
      <areaDesc>${capAlert.area}</areaDesc>
    </area>
    <headline>${advisory.warningLevel} Cyclone Warning for ${capAlert.area}</headline>
    <description>${advisory.smsText}</description>
    <instruction>${capAlert.instruction}</instruction>
  </info>
</alert>`;
}

export async function generateAiAdvisories(
  scenarioName: string,
  regionName: string,
  vmaxKt: number,
  surgeM: number,
  languages: string[]
): Promise<AdvisoryMessage[]> {
  const client = getGenAIClient();
  const audiences: AdvisoryMessage['audience'][] = [
    'fishermen',
    'urban',
    'hospitals',
    'power_utility',
    'district_admin',
    'transport',
  ];

  if (!client || !hasGeminiApiKey()) {
    // Generate full fallback messages across audiences and requested languages
    const list: AdvisoryMessage[] = [];
    for (const aud of audiences) {
      const primaryLang = languages[0] || 'en';
      list.push(getSampleAdvisory(aud, primaryLang, regionName, vmaxKt, surgeM));
    }
    return list;
  }

  const systemInstruction = `You are the Lead Warning Communications Officer for the Indian State Disaster Management Authority (SDMA).
Draft tiered, calm, strictly actionable, and professional cyclone early-warning advisories in structured JSON based on simulated storm parameters.
Do NOT invent facts beyond the provided hazard state.`;

  const prompt = `Draft warning advisories for:
Scenario: ${scenarioName}
Region: ${regionName}
Sustained Wind: ${vmaxKt} kt (${Math.round(vmaxKt * 1.85)} km/h)
Peak Storm Surge: ${surgeM} meters
Target Languages: ${languages.join(', ')}

Provide messages for Fishermen, Urban Residents, Hospitals, Power Utility, and District Administration.`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              audience: {
                type: Type.STRING,
                enum: ['fishermen', 'urban', 'hospitals', 'power_utility', 'district_admin', 'transport'],
              },
              warningLevel: {
                type: Type.STRING,
                enum: ['Yellow', 'Orange', 'Red'],
              },
              language: { type: Type.STRING },
              smsText: { type: Type.STRING },
              whatsAppText: { type: Type.STRING },
              ivrVoiceScript: { type: Type.STRING },
            },
            required: ['audience', 'warningLevel', 'language', 'smsText', 'whatsAppText', 'ivrVoiceScript'],
          },
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty Gemini advisory output');
    const parsed: any[] = JSON.parse(text);

    return parsed.map((item, idx) => ({
      id: `adv_ai_${idx}_${Date.now()}`,
      audience: item.audience,
      audienceLabel: AUDIENCE_INFO[item.audience as AdvisoryMessage['audience']]?.label || item.audience,
      warningLevel: item.warningLevel,
      language: item.language || languages[0],
      smsText: item.smsText,
      whatsAppText: item.whatsAppText,
      ivrVoiceScript: item.ivrVoiceScript,
      capAlert: createCapAlertObject(item.language || languages[0], item.audience, item.warningLevel, regionName, vmaxKt, surgeM),
      approvedByOfficer: false,
      recipientsEstimate: AUDIENCE_INFO[item.audience as AdvisoryMessage['audience']]?.defaultRecipients || 50000,
    }));
  } catch (err) {
    console.warn('Failed to draft AI advisories, using curated samples:', err);
    return audiences.map((aud) => getSampleAdvisory(aud, languages[0] || 'en', regionName, vmaxKt, surgeM));
  }
}
