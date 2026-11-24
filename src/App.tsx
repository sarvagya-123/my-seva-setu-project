import { useEffect, useMemo, useRef, useState } from "react";

type Language = "hi" | "en";
type Status =
  | "submitted"
  | "documents"
  | "field"
  | "decision"
  | "returned"
  | "approved"
  | "rejected";
type Page = "overview" | "applications" | "insights";
type CaseRecord = {
  id: string;
  citizen: string;
  phone: string;
  ward: string;
  category: "water" | "road" | "waste" | "streetlight";
  subject: string;
  subjectHi: string;
  description: string;
  descriptionHi: string;
  status: Status;
  resumeStatus?: Status;
  resolvedAt?: string;
  received: string;
  due: string;
  priority: "high" | "normal";
  wardHi: string;
  documents: { name: string; present: boolean }[];
  history: { at: string; actor: string; action: string; note?: string }[];
};

const STORAGE_KEY = "seva-setu-cases-v2";
const AUTH_KEY = "seva-setu-demo-auth";

const copy = {
  en: {
    product: "Seva Setu",
    tagline: "Local services, moving forward",
    overview: "Overview",
    applications: "Applications",
    insights: "Insights",
    localOffice: "Bengaluru Urban · Ward office",
    officer: "Field officer",
    signOut: "Sign out",
    greeting: "Namaskara, Officer",
    subtitle: "Here’s what needs your attention today.",
    totalOpen: "Open applications",
    dueSoon: "Due in 2 days",
    waitingDecision: "Awaiting decision",
    resolved: "Resolved this month",
    queue: "Your work queue",
    seeAll: "View all",
    needsAttention: "Needs attention",
    allCases: "All",
    activeCases: "In progress",
    completedCases: "Completed",
    search: "Search by name, ID, or issue...",
    caseId: "Application",
    applicant: "Applicant",
    issue: "Issue",
    stage: "Current step",
    received: "Received",
    due: "Due",
    noCases: "No applications match this view.",
    caseDetails: "Application details",
    citizen: "Resident",
    ward: "Ward",
    phone: "Contact",
    process: "Workflow",
    documents: "Evidence & documents",
    activity: "Case history",
    aiTitle: "Field guide",
    aiDemo: "AI guide · optional",
    aiIntro: "A quick, evidence-based guide for this step.",
    getGuidance: "Get step guidance",
    guidanceReady: "Guidance for this step",
    aiDisclaimer:
      "Demo guidance only. Verify against local rules; you make every decision.",
    aiFallbackNotice: "Connected AI is unavailable; showing the built-in local guide instead.",
    localGuide: "Built-in guide · no case data sent",
    connectedGuide: "Gemini guidance · stage and category only",
    loadingGuidance: "Preparing guidance...",
    nextAction: "Move to next step",
    markFieldDone: "Complete field verification",
    approve: "Approve resolution",
    returnCase: "Return for more information",
    reject: "Reject application",
    reopen: "Resume review",
    notePlaceholder: "Add a short reason or field note...",
    noteRequired: "Add a note before returning or rejecting this application.",
    fieldNoteRequired: "Record the field observation before completing verification.",
    decisionNoteRequired: "Record the reason for the final approval before closing this case.",
    missingEvidenceNoteRequired: "Explain why the missing evidence is not needed before moving on.",
    confirmReject: "Reject this application? This will be recorded in the history.",
    confirmApprove: "Approve and close this application?",
    confirmReturn: "Return this application for more information?",
    decisionHelp: "The final decision belongs to the officer.",
    status: {
      submitted: "Received",
      documents: "Document review",
      field: "Field verification",
      decision: "Decision review",
      returned: "More information needed",
      approved: "Resolved",
      rejected: "Rejected",
    },
    categories: {
      water: "Water supply",
      road: "Road repair",
      waste: "Waste collection",
      streetlight: "Streetlight",
    },
    steps: ["Received", "Documents", "Field check", "Decision"],
    stepGuidance: [
      "Triage: confirm the resident’s location and issue category. Check whether the description includes a usable landmark. No documents are required to log a civic grievance.",
      "Document check: compare the submitted evidence with the issue. If something is missing, return the case with a specific request instead of guessing. Do not request identity documents unless local policy requires them.",
      "Field verification: visit the reported location, confirm the issue independently, and record a dated observation. Capture only the minimum evidence needed; do not include bystanders or sensitive personal details.",
      "Decision review: weigh the resident’s report against the field note. The suggested next step is not a decision. Approve only if the issue and responsible service are verified; otherwise return it with a clear reason.",
    ],
    reportsTitle: "Service insights",
    reportsSubtitle: "A simple view of the current ward queue.",
    categoryBreakdown: "Open cases by service",
    turnaround: "Resolution overview",
    resolvedCount: "Resolved",
    pendingCount: "Still open",
    completionRate: "Resolution rate",
    emptyNote: "Updates appear here as applications move through the workflow.",
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to your ward work queue.",
    email: "Work email",
    password: "Password",
    loginButton: "Sign in",
    fillDemo: "Use demo account",
    demoCredentials: "Demo access · officer@sevasetu.demo / Seva@123",
    loginError: "Use the demo credentials shown below to sign in.",
    language: "हिन्दी",
    menu: "Menu",
    resetDemo: "Reset demo data",
    resetConfirm: "Reset all cases to the original sample data?",
    storageError: "Saved case data could not be read. Showing the original demo cases.",
    saveError: "Changes could not be saved in this browser. Check storage availability and try again.",
    startReview: "Start document review",
    verifyDocuments: "Verify documents & continue",
    closeDetails: "Close details",
    highPriority: "Urgent",
    loginStorageError: "Browser storage is unavailable, so the demo session could not be saved.",
    residentUpdate: "Resident status update",
    residentUpdatePrivacy: "Shareable message · no name, phone, or complaint details",
    copyUpdate: "Copy update",
    copiedUpdate: "Copied",
    copyFailed: "Could not copy automatically. Select and copy the message above.",
    citizenNext: {
      submitted: "The ward team will review your application.",
      documents: "The ward team is reviewing the submitted information.",
      field: "The ward team is verifying the reported issue at the location.",
      decision: "The ward officer is reviewing the verification and will record a decision.",
      returned: "Please contact your ward office to confirm what information is needed.",
      approved: "The issue has been verified as resolved and your application is closed.",
      rejected: "Your application was not approved. Please contact your ward office for further information.",
    } as Record<Status, string>,
    citizenUpdateTemplate: (id: string, status: string, next: string, due: string) =>
      `Ward service application ${id}\nStatus: ${status}\n${next}\nRecorded service deadline: ${due}\nThis is a demo status update, not an automated notification.`,
    documentNames: {
      "Location photo": "Location photo",
      "Neighbourhood reference": "Neighbourhood reference",
      "Night-time location photo": "Night-time location photo",
      "Collection point photo": "Collection point photo",
      "Collection day details": "Collection day details",
      "Road condition photo": "Road condition photo",
      "Tap and location photo": "Tap and location photo",
      "Footpath photo": "Footpath photo",
    } as Record<string, string>,
    sample: "Sample data",
    privacyNote: "Resident data shown is fictional.",
    emptyHistory: "No activity recorded yet.",
    justNow: "Just now",
    daysLeft: (days: number) => days === 0 ? "Due today" : days === 1 ? "1 day left" : `${days} days left`,
    older: "Overdue",
  },
  hi: {
    product: "सेवा सेतु",
    tagline: "स्थानीय सेवाएँ, सही दिशा में",
    overview: "सारांश",
    applications: "आवेदन",
    insights: "रिपोर्ट",
    localOffice: "बेंगलुरु शहरी · वार्ड कार्यालय",
    officer: "फील्ड अधिकारी",
    signOut: "साइन आउट",
    greeting: "नमस्कार, अधिकारी",
    subtitle: "आज जिन मामलों पर आपका ध्यान ज़रूरी है, वे यहाँ हैं।",
    totalOpen: "लंबित आवेदन",
    dueSoon: "2 दिन में समय-सीमा",
    waitingDecision: "निर्णय लंबित",
    resolved: "इस महीने निपटाए गए",
    queue: "आपकी कार्यसूची",
    seeAll: "सभी देखें",
    needsAttention: "तत्काल ध्यान दें",
    allCases: "सभी",
    activeCases: "प्रगति में",
    completedCases: "पूरे हुए",
    search: "नाम, आईडी या समस्या खोजें...",
    caseId: "आवेदन",
    applicant: "आवेदक",
    issue: "समस्या",
    stage: "वर्तमान चरण",
    received: "प्राप्ति तिथि",
    due: "समय-सीमा",
    noCases: "इस दृश्य में कोई आवेदन नहीं मिला।",
    caseDetails: "आवेदन का विवरण",
    citizen: "निवासी",
    ward: "वार्ड",
    phone: "संपर्क",
    process: "कार्यप्रवाह",
    documents: "साक्ष्य और दस्तावेज़",
    activity: "आवेदन का इतिहास",
    aiTitle: "फील्ड मार्गदर्शिका",
    aiDemo: "AI मार्गदर्शिका · वैकल्पिक",
    aiIntro: "इस चरण के लिए साक्ष्य-आधारित त्वरित मार्गदर्शन।",
    getGuidance: "चरण का मार्गदर्शन देखें",
    guidanceReady: "इस चरण के लिए मार्गदर्शन",
    aiDisclaimer: "यह केवल डेमो मार्गदर्शन है। स्थानीय नियम जाँचें; अंतिम निर्णय आपका है।",
    aiFallbackNotice: "AI सेवा उपलब्ध नहीं है; स्थानीय मार्गदर्शिका दिखाई जा रही है।",
    localGuide: "अंतर्निर्मित मार्गदर्शिका · आवेदन का डेटा साझा नहीं हुआ",
    connectedGuide: "Gemini मार्गदर्शन · केवल चरण और सेवा",
    loadingGuidance: "मार्गदर्शन तैयार हो रहा है...",
    nextAction: "अगले चरण पर जाएँ",
    startReview: "दस्तावेज़ जाँच शुरू करें",
    verifyDocuments: "दस्तावेज़ जाँचकर आगे बढ़ें",
    markFieldDone: "स्थल सत्यापन पूरा करें",
    approve: "समाधान मंज़ूर करें",
    returnCase: "अधिक जानकारी के लिए लौटाएँ",
    reject: "आवेदन अस्वीकार करें",
    reopen: "समीक्षा फिर शुरू करें",
    notePlaceholder: "कारण या स्थल-जाँच का संक्षिप्त नोट लिखें...",
    noteRequired: "आवेदन लौटाने या अस्वीकार करने से पहले कारण लिखें।",
    fieldNoteRequired: "सत्यापन पूरा करने से पहले स्थल-जाँच का निष्कर्ष दर्ज करें।",
    decisionNoteRequired: "मामला बंद करने से पहले अंतिम मंज़ूरी का कारण दर्ज करें।",
    missingEvidenceNoteRequired: "आगे बढ़ने से पहले बताएँ कि अनुपलब्ध साक्ष्य क्यों आवश्यक नहीं है।",
    confirmReject: "क्या यह आवेदन अस्वीकार करें? यह इतिहास में दर्ज होगा।",
    confirmApprove: "क्या इस आवेदन को मंज़ूर करके बंद करें?",
    confirmReturn: "क्या अधिक जानकारी के लिए यह आवेदन लौटाएँ?",
    decisionHelp: "अंतिम निर्णय अधिकारी का होगा।",
    status: {
      submitted: "प्राप्त",
      documents: "दस्तावेज़ जाँच",
      field: "स्थल सत्यापन",
      decision: "निर्णय समीक्षा",
      returned: "अधिक जानकारी चाहिए",
      approved: "निपटाया गया",
      rejected: "अस्वीकृत",
    },
    categories: {
      water: "जलापूर्ति",
      road: "सड़क मरम्मत",
      waste: "कचरा संग्रह",
      streetlight: "स्ट्रीट लाइट",
    },
    steps: ["प्राप्ति", "दस्तावेज़", "स्थल जाँच", "निर्णय"],
    stepGuidance: [
      "प्रारंभिक जाँच: निवासी का स्थान और समस्या की श्रेणी सुनिश्चित करें। देखें कि विवरण में पहचानने योग्य स्थल-चिह्न है या नहीं। नागरिक शिकायत दर्ज करने के लिए दस्तावेज़ अनिवार्य नहीं हैं।",
      "दस्तावेज़ जाँच: जमा किए गए साक्ष्य की समस्या से तुलना करें। कोई जानकारी छूटी हो तो अनुमान लगाने के बजाय स्पष्ट अनुरोध के साथ आवेदन लौटाएँ। स्थानीय नियमों में आवश्यक न हो तो पहचान-पत्र न माँगें।",
      "स्थल सत्यापन: बताए गए स्थान पर जाकर समस्या की स्वतंत्र पुष्टि करें और तारीख़ सहित निरीक्षण दर्ज करें। केवल ज़रूरी साक्ष्य लें; राहगीरों या संवेदनशील निजी जानकारी को शामिल न करें।",
      "निर्णय समीक्षा: निवासी की शिकायत और स्थल-जाँच नोट का मिलान करें। सुझाव अंतिम निर्णय नहीं है। समस्या और ज़िम्मेदार सेवा की पुष्टि होने पर ही मंज़ूरी दें; अन्यथा स्पष्ट कारण के साथ लौटाएँ।",
    ],
    reportsTitle: "सेवा रिपोर्ट",
    reportsSubtitle: "वार्ड की मौजूदा कार्यसूची का सरल दृश्य।",
    categoryBreakdown: "सेवा के अनुसार लंबित मामले",
    turnaround: "निपटान का सारांश",
    resolvedCount: "निपटाए गए",
    pendingCount: "अब भी लंबित",
    completionRate: "निपटान दर",
    emptyNote: "आवेदन आगे बढ़ने पर यहाँ जानकारी अपडेट होगी।",
    loginTitle: "वापसी पर स्वागत है",
    loginSubtitle: "अपनी वार्ड कार्यसूची में साइन इन करें।",
    email: "कार्यालय ईमेल",
    password: "पासवर्ड",
    loginButton: "साइन इन",
    fillDemo: "डेमो खाते का उपयोग करें",
    demoCredentials: "डेमो लॉगिन · officer@sevasetu.demo / Seva@123",
    loginError: "साइन इन करने के लिए नीचे दिए गए डेमो लॉगिन का उपयोग करें।",
    language: "English",
    menu: "मेन्यू",
    resetDemo: "डेमो डेटा रीसेट करें",
    resetConfirm: "क्या सभी मामले मूल नमूना डेटा पर रीसेट करें?",
    storageError: "सहेजा गया आवेदन डेटा पढ़ा नहीं जा सका। मूल नमूना आवेदन दिखाए जा रहे हैं।",
    saveError: "इस ब्राउज़र में बदलाव सहेजे नहीं जा सके। संग्रहण जाँचकर फिर कोशिश करें।",
    closeDetails: "विवरण बंद करें",
    highPriority: "तत्काल",
    loginStorageError: "ब्राउज़र संग्रहण उपलब्ध नहीं है, इसलिए डेमो सत्र सहेजा नहीं जा सका।",
    residentUpdate: "निवासी के लिए स्थिति संदेश",
    residentUpdatePrivacy: "साझा करने योग्य संदेश · नाम, फ़ोन या शिकायत का विवरण नहीं",
    copyUpdate: "संदेश कॉपी करें",
    copiedUpdate: "कॉपी हो गया",
    copyFailed: "संदेश अपने-आप कॉपी नहीं हुआ। ऊपर दिए संदेश को चुनकर कॉपी करें।",
    citizenNext: {
      submitted: "वार्ड टीम आपके आवेदन की समीक्षा करेगी।",
      documents: "वार्ड टीम जमा की गई जानकारी की जाँच कर रही है।",
      field: "वार्ड टीम बताए गए स्थान पर समस्या का सत्यापन कर रही है।",
      decision: "वार्ड अधिकारी सत्यापन की समीक्षा करके निर्णय दर्ज करेंगे।",
      returned: "आवश्यक जानकारी की पुष्टि के लिए कृपया वार्ड कार्यालय से संपर्क करें।",
      approved: "समस्या के समाधान की पुष्टि के बाद आपका आवेदन बंद कर दिया गया है।",
      rejected: "आपका आवेदन मंज़ूर नहीं हुआ। अधिक जानकारी के लिए वार्ड कार्यालय से संपर्क करें।",
    } as Record<Status, string>,
    citizenUpdateTemplate: (id: string, status: string, next: string, due: string) =>
      `वार्ड सेवा आवेदन ${id}\nस्थिति: ${status}\n${next}\nदर्ज सेवा-समय-सीमा: ${due}\nयह डेमो स्थिति संदेश है, स्वचालित सूचना नहीं।`,
    documentNames: {
      "Location photo": "स्थान की फ़ोटो",
      "Neighbourhood reference": "पड़ोस का संदर्भ",
      "Night-time location photo": "रात के समय स्थान की फ़ोटो",
      "Collection point photo": "संग्रह स्थल की फ़ोटो",
      "Collection day details": "संग्रह के दिन का विवरण",
      "Road condition photo": "सड़क की स्थिति की फ़ोटो",
      "Tap and location photo": "नल और स्थान की फ़ोटो",
      "Footpath photo": "फुटपाथ की फ़ोटो",
    } as Record<string, string>,
    sample: "नमूना डेटा",
    privacyNote: "दिखाया गया निवासी डेटा काल्पनिक है।",
    emptyHistory: "अभी तक कोई गतिविधि दर्ज नहीं है।",
    justNow: "अभी-अभी",
    daysLeft: (days: number) => days === 0 ? "आज अंतिम दिन" : days === 1 ? "1 दिन शेष" : `${days} दिन शेष`,
    older: "समय-सीमा बीत गई",
  },
} as const;

const initialCases: CaseRecord[] = [
  {
    id: "BBMP-26-1042",
    citizen: "Lakshmi Narayan",
    phone: "•••• •• 4821",
    ward: "Jayanagar 4th Block",
    category: "water",
    subject: "Irregular water supply for 5 days",
    subjectHi: "पिछले 5 दिनों से पानी की आपूर्ति अनियमित",
    description:
      "Water supply has been stopping by 7:00 AM for the last five days on 11th Main Road, near the community park. Three nearby homes report the same issue.",
    descriptionHi:
      "11वीं मुख्य सड़क पर सामुदायिक पार्क के पास पिछले पाँच दिनों से सुबह 7 बजे तक पानी की आपूर्ति बंद हो जाती है। आसपास के तीन घरों ने भी यही समस्या बताई है।",
    status: "decision",
    received: "2026-11-21",
    due: "2026-11-25",
    priority: "high",
    wardHi: "जयनगर, चौथा ब्लॉक",
    documents: [
      { name: "Location photo", present: true },
      { name: "Neighbourhood reference", present: true },
    ],
    history: [
      { at: "2026-11-21T09:15:00+05:30", actor: "System", action: "Application received" },
      { at: "2026-11-21T11:40:00+05:30", actor: "Ravi K.", action: "Documents verified" },
      { at: "2026-11-23T14:10:00+05:30", actor: "Meena S.", action: "Field visit completed", note: "Supply interruption confirmed at 11th Main Road." },
    ],
  },
  {
    id: "BBMP-26-1038",
    citizen: "Mohammed Irfan",
    phone: "•••• •• 1973",
    ward: "Basavanagudi",
    category: "streetlight",
    subject: "Streetlight out near the bus stop",
    subjectHi: "बस स्टॉप के पास स्ट्रीट लाइट बंद",
    description:
      "The streetlight beside the Gandhi Bazaar bus stop has not worked for a week. The road is dark after 8 PM and pedestrians are having difficulty crossing.",
    descriptionHi:
      "गांधी बाज़ार बस स्टॉप के पास की स्ट्रीट लाइट एक सप्ताह से बंद है। रात 8 बजे के बाद सड़क अँधेरी रहती है और पैदल यात्रियों को सड़क पार करने में कठिनाई होती है।",
    status: "field",
    received: "2026-11-20",
    due: "2026-11-26",
    priority: "high",
    wardHi: "बसवनगुड़ी",
    documents: [{ name: "Night-time location photo", present: true }],
    history: [
      { at: "2026-11-20T18:20:00+05:30", actor: "System", action: "Application received" },
      { at: "2026-11-21T10:05:00+05:30", actor: "Ravi K.", action: "Location evidence reviewed" },
    ],
  },
  {
    id: "BBMP-26-1035",
    citizen: "Anitha Ramesh",
    phone: "•••• •• 6504",
    ward: "Vijayanagar",
    category: "waste",
    subject: "Missed waste collection on 2nd Cross",
    subjectHi: "दूसरी क्रॉस रोड पर कचरा नहीं उठाया गया",
    description:
      "Waste has not been collected from 2nd Cross for three scheduled collection days. Residents have kept bags at the usual collection point.",
    descriptionHi:
      "दूसरी क्रॉस रोड पर निर्धारित तीन दिनों से कचरा नहीं उठाया गया है। निवासियों ने कचरे के थैले सामान्य संग्रह स्थल पर रखे हैं।",
    status: "documents",
    received: "2026-11-19",
    due: "2026-11-27",
    priority: "normal",
    wardHi: "विजयनगर",
    documents: [
      { name: "Collection point photo", present: true },
      { name: "Collection day details", present: false },
    ],
    history: [{ at: "2026-11-19T08:42:00+05:30", actor: "System", action: "Application received" }],
  },
  {
    id: "BBMP-26-1029",
    citizen: "Suresh Gowda",
    phone: "•••• •• 9042",
    ward: "Malleshwaram",
    category: "road",
    subject: "Pothole near the primary health centre",
    subjectHi: "प्राथमिक स्वास्थ्य केंद्र के पास सड़क में गड्ढा",
    description:
      "A large pothole has formed at the junction near the primary health centre on 8th Cross. Two-wheelers are swerving into traffic to avoid it.",
    descriptionHi:
      "8वीं क्रॉस रोड पर प्राथमिक स्वास्थ्य केंद्र के पास चौराहे में बड़ा गड्ढा हो गया है। इससे बचने के लिए दोपहिया वाहन यातायात के बीच मुड़ रहे हैं।",
    status: "submitted",
    received: "2026-11-18",
    due: "2026-11-25",
    priority: "normal",
    wardHi: "मल्लेश्वरम",
    documents: [{ name: "Road condition photo", present: true }],
    history: [{ at: "2026-11-18T15:30:00+05:30", actor: "System", action: "Application received" }],
  },
  {
    id: "BBMP-26-1016",
    citizen: "Priya Shetty",
    phone: "•••• •• 2280",
    ward: "Rajajinagar",
    category: "water",
    subject: "Leaking public tap at the market",
    subjectHi: "बाज़ार के सार्वजनिक नल में रिसाव",
    description:
      "The public tap outside the vegetable market has been leaking continuously since Monday. Water is pooling near the entrance.",
    descriptionHi:
      "सब्ज़ी बाज़ार के बाहर लगे सार्वजनिक नल से सोमवार से लगातार पानी रिस रहा है। प्रवेश द्वार के पास पानी जमा हो रहा है।",
    status: "approved",
    received: "2026-11-10",
    due: "2026-11-18",
    priority: "normal",
    wardHi: "राजाजीनगर",
    resolvedAt: "2026-11-14T16:05:00+05:30",
    documents: [{ name: "Tap and location photo", present: true }],
    history: [
      { at: "2026-11-10T10:00:00+05:30", actor: "System", action: "Application received" },
      { at: "2026-11-12T13:15:00+05:30", actor: "Ravi K.", action: "Field visit completed" },
      { at: "2026-11-14T16:05:00+05:30", actor: "Meena S.", action: "Repair verified and resolved" },
    ],
  },
  {
    id: "BBMP-26-1008",
    citizen: "Kavitha M.",
    phone: "•••• •• 7306",
    ward: "Chamarajpet",
    category: "road",
    subject: "Damaged footpath outside the library",
    subjectHi: "पुस्तकालय के बाहर क्षतिग्रस्त फुटपाथ",
    description:
      "Several footpath slabs are broken outside the public library on 5th Main. The uneven surface is difficult for older residents to use.",
    descriptionHi:
      "5वीं मुख्य सड़क पर सार्वजनिक पुस्तकालय के बाहर फुटपाथ की कई पट्टियाँ टूटी हुई हैं। असमतल रास्ते पर बुज़ुर्ग निवासियों को चलने में कठिनाई होती है।",
    status: "returned",
    received: "2026-11-09",
    due: "2026-11-24",
    priority: "normal",
    wardHi: "चामराजपेट",
    documents: [{ name: "Footpath photo", present: false }],
    history: [
      { at: "2026-11-09T11:20:00+05:30", actor: "System", action: "Application received" },
      { at: "2026-11-11T09:10:00+05:30", actor: "Ravi K.", action: "More information requested", note: "Please add a clear photo of the damaged slabs and nearest building number." },
    ],
  },
];

const formatDate = (date: string, language: Language) =>
  new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));

const formatHistoryTime = (timestamp: string, language: Language) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function localizeHistory(value: string, language: Language) {
  const translations: Record<string, { hi: string; en: string }> = {
    "Application received": { hi: "आवेदन प्राप्त हुआ", en: "Application received" },
    "Documents verified": { hi: "दस्तावेज़ सत्यापित किए गए", en: "Documents verified" },
    "Field visit completed": { hi: "स्थल निरीक्षण पूरा हुआ", en: "Field visit completed" },
    "Location evidence reviewed": { hi: "स्थान संबंधी साक्ष्य की जाँच हुई", en: "Location evidence reviewed" },
    "Repair verified and resolved": { hi: "मरम्मत की पुष्टि हुई और मामला निपटाया गया", en: "Repair verified and resolved" },
    "More information requested": { hi: "अधिक जानकारी माँगी गई", en: "More information requested" },
    "Document review started": { hi: "दस्तावेज़ों की जाँच शुरू की गई", en: "Document review started" },
    "दस्तावेज़ों की जाँच शुरू की गई": { hi: "दस्तावेज़ों की जाँच शुरू की गई", en: "Document review started" },
    "Documents reviewed": { hi: "दस्तावेज़ों की जाँच पूरी हुई", en: "Documents reviewed" },
    "Field verification completed": { hi: "स्थल सत्यापन पूरा हुआ", en: "Field verification completed" },
    "Application approved and closed": { hi: "आवेदन मंज़ूर करके बंद किया गया", en: "Application approved and closed" },
    "Returned for more information": { hi: "अधिक जानकारी के लिए लौटाया गया", en: "Returned for more information" },
    "Application rejected": { hi: "आवेदन अस्वीकार किया गया", en: "Application rejected" },
    "Review resumed": { hi: "समीक्षा फिर शुरू की गई", en: "Review resumed" },
    "System": { hi: "सिस्टम", en: "System" },
    "You · Field officer": { hi: "आप · फील्ड अधिकारी", en: "You · Field officer" },
    "Supply interruption confirmed at 11th Main Road.": {
      hi: "11वीं मुख्य सड़क पर जलापूर्ति में रुकावट की पुष्टि हुई।",
      en: "Supply interruption confirmed at 11th Main Road.",
    },
    "Please add a clear photo of the damaged slabs and nearest building number.": {
      hi: "कृपया टूटी हुई पट्टियों की साफ़ फ़ोटो और पास की इमारत का नंबर जोड़ें।",
      en: "Please add a clear photo of the damaged slabs and nearest building number.",
    },
  };
  return translations[value]?.[language] ?? value;
}

function guidanceStage(status: Status): "triage" | "documents" | "field" | "decision" {
  if (status === "submitted") return "triage";
  if (status === "documents") return "documents";
  if (status === "field") return "field";
  return "decision";
}

function isCaseRecord(value: unknown): value is CaseRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const validStatuses: Status[] = [
    "submitted",
    "documents",
    "field",
    "decision",
    "returned",
    "approved",
    "rejected",
  ];
  const validCategories = ["water", "road", "waste", "streetlight"];
  return (
    typeof record.id === "string" &&
    typeof record.citizen === "string" &&
    typeof record.phone === "string" &&
    typeof record.ward === "string" &&
    typeof record.wardHi === "string" &&
    typeof record.subject === "string" &&
    typeof record.subjectHi === "string" &&
    typeof record.description === "string" &&
    typeof record.descriptionHi === "string" &&
    isValidDate(record.received) &&
    isValidDate(record.due) &&
    (record.resolvedAt === undefined ||
      (typeof record.resolvedAt === "string" && !Number.isNaN(Date.parse(record.resolvedAt)))) &&
    (record.priority === "high" || record.priority === "normal") &&
    (record.resumeStatus === undefined ||
      validStatuses.includes(record.resumeStatus as Status)) &&
    validStatuses.includes(record.status as Status) &&
    validCategories.includes(record.category as string) &&
    Array.isArray(record.documents) &&
    record.documents.every(
      (document: unknown) =>
        typeof document === "object" &&
        document !== null &&
        typeof (document as Record<string, unknown>).name === "string" &&
        typeof (document as Record<string, unknown>).present === "boolean",
    ) &&
    Array.isArray(record.history) &&
    record.history.every(
      (entry: unknown) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as Record<string, unknown>).at === "string" &&
        typeof (entry as Record<string, unknown>).actor === "string" &&
        typeof (entry as Record<string, unknown>).action === "string" &&
        ((entry as Record<string, unknown>).note === undefined ||
          typeof (entry as Record<string, unknown>).note === "string"),
    )
  );
}

function loadCasesFromStorage(): { cases: CaseRecord[]; error: boolean } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { cases: initialCases, error: false };
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every(isCaseRecord)) {
      return { cases: parsed, error: false };
    }
    throw new Error("Saved case data does not match the application schema.");
  } catch (error) {
    console.error("Could not load saved Seva Setu cases.", error);
    return { cases: initialCases, error: true };
  }
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></>,
    alert: <><path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    drop: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 18v3h14v-3" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.file}
    </svg>
  );
}

function getDaysLeft(date: string) {
  const due = new Date(`${date}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today.getTime()) / 86_400_000);
}

function App() {
  const [language, setLanguage] = useState<Language>("hi");
  const [authenticated, setAuthenticated] = useState(
    () => {
      try {
        return localStorage.getItem(AUTH_KEY) === "true";
      } catch (error) {
        console.error("Could not read the Seva Setu demo session.", error);
        return false;
      }
    },
  );
  const [page, setPage] = useState<Page>("overview");
  const [caseState] = useState(loadCasesFromStorage);
  const [cases, setCases] = useState<CaseRecord[]>(caseState.cases);
  const [selectedId, setSelectedId] = useState("BBMP-26-1042");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");
  const [guidance, setGuidance] = useState(false);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [generatedGuidance, setGeneratedGuidance] = useState("");
  const [guidanceSource, setGuidanceSource] = useState<"local" | "gemini">("local");
  const [copiedUpdate, setCopiedUpdate] = useState(false);
  const guidanceRequestId = useRef(0);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState(caseState.error ? copy.hi.storageError : "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const t = copy[language];
  const selected = cases.find((item) => item.id === selectedId) ?? cases[0];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function toggleLanguage() {
    guidanceRequestId.current += 1;
    setGuidanceLoading(false);
    setGuidance(false);
    setGeneratedGuidance("");
    setCopiedUpdate(false);
    setLanguage(language === "hi" ? "en" : "hi");
  }

  const openCases = useMemo(
    () => cases.filter((item) => !["approved", "rejected"].includes(item.status)),
    [cases],
  );
  const dueSoon = openCases.filter((item) => {
    const days = getDaysLeft(item.due);
    return days >= 0 && days <= 2;
  }).length;
  const waitingDecision = cases.filter((item) => item.status === "decision").length;
  const now = new Date();
  const completedThisMonth = cases.filter((item) => {
    if (item.status !== "approved" || !item.resolvedAt) return false;
    const resolved = new Date(item.resolvedAt);
    return resolved.getMonth() === now.getMonth() && resolved.getFullYear() === now.getFullYear();
  }).length;
  const totalResolved = cases.filter((item) => item.status === "approved").length;
  const fieldChecksPending = cases.filter((item) => item.status === "field").length;

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !["approved", "rejected"].includes(item.status)) ||
        (filter === "completed" && ["approved", "rejected"].includes(item.status));
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [item.id, item.citizen, item.subject, item.subjectHi, item.ward, item.wardHi]
          .some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [cases, filter, search]);

  function persist(updated: CaseRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Could not save Seva Setu cases.", error);
      setNotice(t.saveError);
      return false;
    }
    setCases(updated);
    return true;
  }

  function updateCase(
    caseId: string,
    status: Status,
    action: string,
    extraNote?: string,
    resumeStatus?: Status,
  ) {
    const updated = cases.map((item) =>
      item.id === caseId
        ? {
            ...item,
            status,
            resumeStatus: status === "returned" ? resumeStatus : undefined,
            resolvedAt: status === "approved" ? new Date().toISOString() : undefined,
            history: [
              ...item.history,
              {
                at: new Date().toISOString(),
                actor: "You · Field officer",
                action,
                ...(extraNote ? { note: extraNote } : {}),
              },
            ],
          }
        : item,
    );
    if (!persist(updated)) return;
    setNote("");
    setGuidance(false);
    setGeneratedGuidance("");
    guidanceRequestId.current += 1;
    setGuidanceLoading(false);
    setNotice(action);
    window.setTimeout(() => setNotice(""), 3000);
  }

  function handleAction(action: "start" | "documents" | "field" | "approve" | "return" | "reject" | "reopen") {
    if (!selected) return;
    if (action === "field" && !note.trim()) {
      setNotice(t.fieldNoteRequired);
      return;
    }
    if (action === "approve" && !note.trim()) {
      setNotice(t.decisionNoteRequired);
      return;
    }
    if (
      action === "documents" &&
      selected.documents.some((document) => !document.present) &&
      !note.trim()
    ) {
      setNotice(t.missingEvidenceNoteRequired);
      return;
    }
    if (action === "return" || action === "reject") {
      if (!note.trim()) {
        setNotice(t.noteRequired);
        return;
      }
      if (action === "return" && !window.confirm(t.confirmReturn)) return;
      if (action === "reject" && !window.confirm(t.confirmReject)) return;
    }
    if (action === "approve" && !window.confirm(t.confirmApprove)) return;
    const labels = {
      start: language === "hi" ? "दस्तावेज़ों की जाँच शुरू की गई" : "Document review started",
      documents: language === "hi" ? "दस्तावेज़ों की जाँच पूरी हुई" : "Documents reviewed",
      field: language === "hi" ? "स्थल सत्यापन पूरा हुआ" : "Field verification completed",
      approve: language === "hi" ? "आवेदन मंज़ूर करके बंद किया गया" : "Application approved and closed",
      return: language === "hi" ? "अधिक जानकारी के लिए लौटाया गया" : "Returned for more information",
      reject: language === "hi" ? "आवेदन अस्वीकार किया गया" : "Application rejected",
      reopen: language === "hi" ? "समीक्षा फिर शुरू की गई" : "Review resumed",
    };
    const nextStatus: Status =
      action === "start" ? "documents" :
      action === "documents" ? "field" :
      action === "field" ? "decision" :
      action === "approve" ? "approved" :
      action === "return" ? "returned" :
      action === "reject" ? "rejected" :
      selected.resumeStatus ?? "documents";
    updateCase(
      selected.id,
      nextStatus,
      labels[action],
      note.trim() || undefined,
      action === "return" ? selected.status : undefined,
    );
  }

  function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== "officer@sevasetu.demo" || password !== "Seva@123") {
      setLoginError(t.loginError);
      return;
    }
    try {
      localStorage.setItem(AUTH_KEY, "true");
    } catch (error) {
      console.error("Could not save the Seva Setu demo session.", error);
      setLoginError(t.loginStorageError);
      return;
    }
    setAuthenticated(true);
    setLoginError("");
  }

  function resetDemo() {
    if (!window.confirm(t.resetConfirm)) return;
    if (!persist(initialCases)) return;
    guidanceRequestId.current += 1;
    setGuidance(false);
    setGuidanceLoading(false);
    setGeneratedGuidance("");
    setCopiedUpdate(false);
    setSelectedId(initialCases[0].id);
    setNotice(language === "hi" ? "नमूना डेटा रीसेट कर दिया गया" : "Sample data restored");
    window.setTimeout(() => setNotice(""), 3000);
  }

  async function requestGuidance() {
    if (!selected) return;
    const requestId = ++guidanceRequestId.current;
    const reviewStatus = selected.status === "returned"
      ? selected.resumeStatus ?? "documents"
      : selected.status;
    const step = Math.max(0, ["submitted", "documents", "field", "decision"].indexOf(reviewStatus));
    if (import.meta.env.VITE_AI_ENABLED !== "true") {
      setGuidanceSource("local");
      setGeneratedGuidance(t.stepGuidance[step]);
      setGuidance(true);
      return;
    }
    setGuidanceLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: guidanceStage(reviewStatus), category: selected.category, language }),
      });
      if (requestId !== guidanceRequestId.current) return;
      if (response.ok) {
        const result: unknown = await response.json();
        if (
          typeof result === "object" &&
          result !== null &&
          "guidance" in result &&
          typeof result.guidance === "string" &&
          "source" in result &&
          result.source === "gemini"
        ) {
          if (requestId !== guidanceRequestId.current) return;
          setGeneratedGuidance(result.guidance);
          setGuidanceSource("gemini");
        } else {
          throw new Error("The guidance endpoint returned an unexpected response.");
        }
      } else {
        console.error("Guidance endpoint returned status", response.status);
        setNotice(t.aiFallbackNotice);
        window.setTimeout(() => setNotice(""), 3500);
        setGeneratedGuidance(t.stepGuidance[step]);
        setGuidanceSource("local");
      }
    } catch (error) {
      if (requestId !== guidanceRequestId.current) return;
      console.error("Could not retrieve connected guidance.", error);
      setNotice(t.aiFallbackNotice);
      window.setTimeout(() => setNotice(""), 3500);
      setGeneratedGuidance(t.stepGuidance[step]);
      setGuidanceSource("local");
    } finally {
      if (requestId === guidanceRequestId.current) {
        setGuidance(true);
        setGuidanceLoading(false);
      }
    }
  }

  function dueLabel(date: string) {
    const days = getDaysLeft(date);
    if (days < 0) return t.older;
    return t.daysLeft(days);
  }

  function residentUpdateMessage(item: CaseRecord) {
    return t.citizenUpdateTemplate(
      item.id,
      t.status[item.status],
      t.citizenNext[item.status],
      formatDate(item.due, language),
    );
  }

  async function copyResidentUpdate(item: CaseRecord) {
    try {
      await navigator.clipboard.writeText(residentUpdateMessage(item));
      setCopiedUpdate(true);
      setNotice("");
      window.setTimeout(() => setCopiedUpdate(false), 2500);
    } catch (error) {
      console.error("Could not copy the resident status update.", error);
      setCopiedUpdate(false);
      setNotice(t.copyFailed);
      window.setTimeout(() => setNotice(""), 5000);
    }
  }

  function renderStatus(status: Status) {
    return <span className={`status-pill status-${status}`}>{t.status[status]}</span>;
  }

  function renderCaseList(items: CaseRecord[], compact = false) {
    return (
      <div className={`case-list ${compact ? "case-list-compact" : ""}`}>
        {items.length === 0 && <div className="empty-state">{t.noCases}</div>}
        {items.map((item) => (
          <button
            type="button"
            className={`case-row ${selectedId === item.id && page === "applications" ? "selected" : ""}`}
            key={item.id}
            onClick={() => {
              guidanceRequestId.current += 1;
              setSelectedId(item.id);
              setPage("applications");
              setGuidance(false);
              setGuidanceLoading(false);
              setGeneratedGuidance("");
              setCopiedUpdate(false);
            }}
          >
            <span className={`category-icon category-${item.category}`}>
              <Icon name={item.category === "water" ? "drop" : item.category === "road" ? "alert" : item.category === "waste" ? "file" : "clock"} size={18} />
            </span>
            <span className="case-summary">
              <span className="case-name">{item.citizen}</span>
              <span className="case-subject">{language === "hi" ? item.subjectHi : item.subject}</span>
              <span className="case-id">{item.id} <span aria-hidden="true">·</span> {language === "hi" ? item.wardHi : item.ward}</span>
            </span>
            <span className="case-row-meta">
              {renderStatus(item.status)}
              {item.priority === "high" && <span className="priority-label">{t.highPriority}</span>}
              <span className={`due-label ${getDaysLeft(item.due) <= 1 && !["approved", "rejected"].includes(item.status) ? "due-soon" : ""}`}>
                {dueLabel(item.due)}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  function renderDetails() {
    if (!selected) return null;
    const reviewStatus = selected.status === "returned" ? selected.resumeStatus ?? "documents" : selected.status;
    const statusIndex = ["submitted", "documents", "field", "decision"].indexOf(reviewStatus);
    const activeStep = Math.max(0, statusIndex);
    const guidanceIndex = Math.max(0, statusIndex);
    const actionDisabled = ["approved", "rejected"].includes(selected.status);
    return (
      <aside className="detail-panel" aria-label={t.caseDetails}>
        <div className="detail-header">
          <div>
            <div className="eyebrow">{selected.id}</div>
            <h2>{t.caseDetails}</h2>
          </div>
          <button className="icon-button close-detail" onClick={() => setSelectedId("")} aria-label={t.closeDetails}>
            <Icon name="close" />
          </button>
        </div>
        <div className="detail-scroll">
          <div className="detail-case-title">
            <div className="detail-category">{t.categories[selected.category]}</div>
            <h3>{language === "hi" ? selected.subjectHi : selected.subject}</h3>
            <div className="detail-status-line">{renderStatus(selected.status)} <span className="due-label">{dueLabel(selected.due)}</span></div>
          </div>
          <p className="description">{language === "hi" ? selected.descriptionHi : selected.description}</p>
          <section className="resident-update-card" aria-label={t.residentUpdate}>
            <div className="resident-update-heading">
              <div><h4>{t.residentUpdate}</h4><span>{t.residentUpdatePrivacy}</span></div>
              <button
                type="button"
                className="button button-outline copy-update-button"
                onClick={() => void copyResidentUpdate(selected)}
              >
                <Icon name={copiedUpdate ? "check" : "file"} size={15} />
                {copiedUpdate ? t.copiedUpdate : t.copyUpdate}
              </button>
            </div>
            <p className="resident-update-message">{residentUpdateMessage(selected)}</p>
          </section>
          <div className="resident-grid">
            <div><span>{t.citizen}</span><strong>{selected.citizen}</strong></div>
            <div><span>{t.ward}</span><strong>{language === "hi" ? selected.wardHi : selected.ward}</strong></div>
            <div><span>{t.phone}</span><strong>{selected.phone}</strong></div>
            <div><span>{t.received}</span><strong>{formatDate(selected.received, language)}</strong></div>
          </div>

          <section className="detail-section">
            <h4>{t.process}</h4>
            <div className="workflow">
              {t.steps.map((step, index) => {
                const done = ["approved", "rejected"].includes(selected.status) || index < activeStep;
                const current = !["approved", "rejected"].includes(selected.status) && index === activeStep;
                return (
                  <div className={`workflow-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={step}>
                    <span className="step-marker">{done ? <Icon name="check" size={13} /> : index + 1}</span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="detail-section">
            <h4>{t.documents}</h4>
            <div className="document-list">
              {selected.documents.map((document) => (
                <div className="document-item" key={document.name}>
                  <span className={`document-mark ${document.present ? "present" : "missing"}`}>
                    <Icon name={document.present ? "check" : "alert"} size={15} />
                  </span>
                  <span>{language === "hi" ? t.documentNames[document.name] ?? document.name : document.name}</span>
                  <span className={`document-state ${document.present ? "present" : "missing"}`}>
                    {document.present ? (language === "hi" ? "उपलब्ध" : "Available") : (language === "hi" ? "लंबित" : "Missing")}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="ai-card">
            <div className="ai-card-heading">
              <span className="ai-icon"><Icon name="spark" size={18} /></span>
              <div><h4>{t.aiTitle}</h4><span>{t.aiDemo}</span></div>
            </div>
            {!guidance ? (
              <>
                <p>{t.aiIntro}</p>
                <button className="button button-ai" onClick={requestGuidance} disabled={actionDisabled || guidanceLoading}>
                  <Icon name="spark" size={16} />{guidanceLoading ? t.loadingGuidance : t.getGuidance}
                </button>
              </>
            ) : (
              <div className="guidance-result">
                <strong>{t.guidanceReady}</strong>
                <span className="guidance-source-tag">{guidanceSource === "gemini" ? t.connectedGuide : t.localGuide}</span>
                <p>{generatedGuidance || t.stepGuidance[guidanceIndex]}</p>
                <span>{t.aiDisclaimer}</span>
              </div>
            )}
          </section>

          <section className="detail-section history-section">
            <h4>{t.activity}</h4>
            {selected.history.length ? (
              <div className="history-list">
                {[...selected.history].reverse().map((entry, index) => (
                  <div className="history-item" key={`${entry.at}-${index}`}>
                    <span className="history-dot" />
                    <div><strong>{localizeHistory(entry.action, language)}</strong><span>{localizeHistory(entry.actor, language)} · {formatHistoryTime(entry.at, language)}</span>{entry.note && <p>{localizeHistory(entry.note, language)}</p>}</div>
                  </div>
                ))}
              </div>
            ) : <p className="muted">{t.emptyHistory}</p>}
          </section>

          {!actionDisabled && (
            <section className="action-area">
              {selected.status === "decision" || selected.status === "field" || selected.status === "documents" || selected.status === "returned" ? (
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.notePlaceholder} rows={2} aria-label={t.notePlaceholder} />
              ) : null}
              {selected.status === "submitted" && (
                <button className="button button-primary full-button" onClick={() => handleAction("start")}>{t.startReview}<Icon name="arrow" size={16} /></button>
              )}
              {selected.status === "documents" && (
                <>
                  <button className="button button-primary full-button" onClick={() => handleAction("documents")}>{t.verifyDocuments}<Icon name="arrow" size={16} /></button>
                  <button className="button button-quiet full-button" onClick={() => handleAction("return")}>{t.returnCase}</button>
                </>
              )}
              {selected.status === "field" && (
                <>
                  <button className="button button-primary full-button" onClick={() => handleAction("field")}>{t.markFieldDone}<Icon name="arrow" size={16} /></button>
                  <button className="button button-quiet full-button" onClick={() => handleAction("return")}>{t.returnCase}</button>
                </>
              )}
              {selected.status === "decision" && (
                <>
                  <p className="decision-help"><Icon name="alert" size={15} />{t.decisionHelp}</p>
                  <button className="button button-primary full-button" onClick={() => handleAction("approve")}><Icon name="check" size={16} />{t.approve}</button>
                  <button className="button button-quiet full-button" onClick={() => handleAction("return")}>{t.returnCase}</button>
                  <button className="button button-danger full-button" onClick={() => handleAction("reject")}>{t.reject}</button>
                </>
              )}
              {selected.status === "returned" && (
                <button className="button button-primary full-button" onClick={() => handleAction("reopen")}>{t.reopen}<Icon name="arrow" size={16} /></button>
              )}
            </section>
          )}
        </div>
      </aside>
    );
  }

  function renderLogin() {
    return (
      <main className="login-page">
        <div className="login-brand">
          <span className="brand-mark"><span /></span>
          <span><strong>{t.product}</strong><small>{t.tagline}</small></span>
        </div>
        <button className="language-toggle login-language" onClick={toggleLanguage}>{t.language}</button>
        <section className="login-card">
          <div className="login-illustration"><span className="illustration-sun" /><span className="illustration-house">⌂</span><span className="illustration-line" /></div>
          <span className="eyebrow">{t.localOffice}</span>
          <h1>{t.loginTitle}</h1>
          <p>{t.loginSubtitle}</p>
          <form onSubmit={signIn}>
            <label>{t.email}<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>{t.password}<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="button button-primary full-button">{t.loginButton}<Icon name="arrow" size={16} /></button>
          </form>
          <button className="button button-quiet full-button demo-fill" onClick={() => { setEmail("officer@sevasetu.demo"); setPassword("Seva@123"); }}>{t.fillDemo}</button>
          <div className="demo-hint">{t.demoCredentials}</div>
        </section>
        <div className="login-footer">© 2026 {t.product} · {t.privacyNote}</div>
      </main>
    );
  }

  if (!authenticated) return renderLogin();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><span /></span>
          <span><strong>{t.product}</strong><small>{t.tagline}</small></span>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><Icon name="close" /></button>
        </div>
        <div className="office-switch">
          <span className="office-avatar">बें</span>
          <span><strong>{t.localOffice.split(" · ")[0]}</strong><small>{t.localOffice.split(" · ")[1]}</small></span>
        </div>
        <span className="nav-label">{t.menu}</span>
        <nav className="main-nav">
          {([
            ["overview", "grid", t.overview],
            ["applications", "file", t.applications],
            ["insights", "chart", t.insights],
          ] as [Page, string, string][]).map(([id, icon, label]) => (
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} aria-label={label} title={label} onClick={() => { setPage(id); setMobileNav(false); }}>
              <Icon name={icon} size={19} /><span>{label}</span>
              {id === "applications" && <span className="nav-count">{openCases.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="officer-card">
            <div className="officer-avatar">RS</div>
            <div className="officer-info"><strong>Ravi Shankar</strong><span>{t.officer}</span></div>
            <button className="icon-button signout-button" title={t.signOut} onClick={() => { localStorage.removeItem(AUTH_KEY); setAuthenticated(false); }}><Icon name="logout" size={17} /></button>
          </div>
          <div className="sidebar-footer">{t.localOffice} · {t.sample}</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label={t.menu}><Icon name="menu" /></button>
          <div className="breadcrumb">{t.localOffice.split(" · ")[0]} <span>/</span> {page === "overview" ? t.overview : page === "applications" ? t.applications : t.insights}</div>
          <div className="top-actions">
            <span className="today-label">{new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date())}</span>
            <button className="language-toggle" onClick={toggleLanguage}>{t.language}</button>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className="toast" role="status">{notice}</div>}
          {page === "overview" && (
            <>
              <section className="page-heading">
                <div><div className="eyebrow">{t.localOffice}</div><h1>{t.greeting}</h1><p>{t.subtitle}</p></div>
                <button className="button button-outline" onClick={resetDemo}><Icon name="reset" size={16} />{t.resetDemo}</button>
              </section>
              <section className="metrics-grid">
                {[
                  [t.totalOpen, String(openCases.length), `${cases.filter((item) => item.status === "submitted").length} ${language === "hi" ? (cases.filter((item) => item.status === "submitted").length === 1 ? "नया" : "नए") : "new"}`, "metric-blue", "file"],
                  [t.dueSoon, String(dueSoon), language === "hi" ? "समय-सीमा नज़दीक वाले आवेदन" : "applications nearing deadline", "metric-amber", "clock"],
                  [t.waitingDecision, String(waitingDecision), language === "hi" ? "आपकी समीक्षा के लिए" : "ready for your review", "metric-green", "check"],
                  [t.resolved, String(completedThisMonth), language === "hi" ? "नमूना डेटा में" : "in sample data", "metric-purple", "chart"],
                ].map(([label, value, noteText, color, icon]) => (
                  <div className="metric-card" key={label}>
                    <div className={`metric-icon ${color}`}><Icon name={icon} size={19} /></div>
                    <span className="metric-label">{label}</span>
                    <strong className="metric-value">{value}</strong>
                    <span className="metric-note">{noteText}</span>
                  </div>
                ))}
              </section>
              <section className="overview-workspace">
                <div className="queue-card">
                  <div className="section-heading">
                    <div><h2>{t.needsAttention}</h2><p>{language === "hi" ? "समय-सीमा और कार्यचरण के अनुसार प्राथमिकता" : "Prioritised by deadline and workflow step"}</p></div>
                    <button className="text-button" onClick={() => setPage("applications")}>{t.seeAll}<Icon name="arrow" size={15} /></button>
                  </div>
                  {renderCaseList([...openCases].sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high") || getDaysLeft(a.due) - getDaysLeft(b.due)).slice(0, 4), true)}
                </div>
                <div className="overview-side">
                  <div className="today-card">
                    <span className="today-card-icon"><Icon name="pin" size={18} /></span>
                    <div className="eyebrow">{language === "hi" ? "आज की प्राथमिकता" : "TODAY’S FOCUS"}</div>
                    <h3>{language === "hi" ? "पहले स्थल-जाँच" : "Field checks first"}</h3>
                    <p>{language === "hi"
                      ? `${fieldChecksPending} आवेदन${fieldChecksPending === 1 ? " का" : "ों का"} स्थल सत्यापन बाकी है।`
                      : `${fieldChecksPending} application${fieldChecksPending === 1 ? "" : "s"} ${fieldChecksPending === 1 ? "is" : "are"} waiting for field verification.`}</p>
                    <button className="text-button" onClick={() => { setFilter("active"); setPage("applications"); }}>{language === "hi" ? "कार्यसूची खोलें" : "Open work queue"}<Icon name="arrow" size={15} /></button>
                  </div>
                  <div className="workflow-note"><Icon name="spark" size={17} /><span>{language === "hi" ? "हर चरण पर मार्गदर्शन उपलब्ध है। अंतिम निर्णय हमेशा आपका होगा।" : "Step-by-step guidance is available. The final decision is always yours."}</span></div>
                </div>
              </section>
            </>
          )}

          {page === "applications" && (
            <>
              <section className="page-heading page-heading-apps">
                <div><div className="eyebrow">{t.localOffice}</div><h1>{t.applications}</h1><p>{t.subtitle}</p></div>
                <button className="button button-outline" onClick={resetDemo}><Icon name="reset" size={16} />{t.resetDemo}</button>
              </section>
              <div className="applications-layout">
                <section className={`applications-card ${!selectedId ? "no-detail" : ""}`}>
                  <div className="application-toolbar">
                    <div className="filter-tabs">
                      {([
                        ["all", t.allCases, cases.length],
                        ["active", t.activeCases, openCases.length],
                        ["completed", t.completedCases, cases.length - openCases.length],
                      ] as const).map(([id, label, count]) => (
                        <button key={id} className={`filter-tab ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{label}<span>{count}</span></button>
                      ))}
                    </div>
                    <label className="search-box"><Icon name="search" size={17} /><input aria-label={t.search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} /></label>
                  </div>
                  {renderCaseList(filteredCases)}
                </section>
                {selectedId && renderDetails()}
              </div>
            </>
          )}

          {page === "insights" && (
            <>
              <section className="page-heading"><div><div className="eyebrow">{t.localOffice}</div><h1>{t.reportsTitle}</h1><p>{t.reportsSubtitle}</p></div><button className="button button-outline" onClick={resetDemo}><Icon name="reset" size={16} />{t.resetDemo}</button></section>
              <section className="insights-grid">
                <div className="insight-card"><h2>{t.categoryBreakdown}</h2><p>{t.emptyNote}</p>
                  <div className="bar-list">
                    {(["water", "road", "waste", "streetlight"] as const).map((category) => {
                      const count = openCases.filter((item) => item.category === category).length;
                      return <div className="bar-row" key={category}><span>{t.categories[category]}</span><div className="bar-track"><i style={{ width: `${openCases.length ? Math.max(count / openCases.length * 100, count ? 8 : 0) : 0}%` }} /></div><strong>{count}</strong></div>;
                    })}
                  </div>
                </div>
                <div className="insight-card resolution-card"><h2>{t.turnaround}</h2><p>{t.emptyNote}</p>
                  <div className="resolution-number"><strong>{cases.length ? Math.round(totalResolved / cases.length * 100) : 0}%</strong><span>{t.completionRate}</span></div>
                  <div className="resolution-stats"><div><span className="resolution-dot resolved-dot" />{t.resolvedCount}<strong>{totalResolved}</strong></div><div><span className="resolution-dot open-dot" />{t.pendingCount}<strong>{openCases.length}</strong></div></div>
                </div>
              </section>
              <div className="privacy-banner"><Icon name="alert" size={17} /><span>{t.privacyNote} {language === "hi" ? "यह रिपोर्ट इसी ब्राउज़र में रखे नमूना डेटा पर आधारित है।" : "These insights use sample data stored in this browser."}</span></div>
            </>
          )}
        </div>
      </main>
      {mobileNav && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    </div>
  );
}

export default App;
