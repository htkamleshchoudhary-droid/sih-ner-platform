import { useState } from 'react';
import { MapContainerComponent } from './components/MapContainer.tsx';
import { ReportIncidentModal } from './components/ReportIncidentModal.tsx';
import { DriverView } from './components/DriverView.tsx';
import { INITIAL_VEHICLES, INITIAL_INCIDENTS, INITIAL_SHELTERS, MAIN_CORRIDOR } from './data/mockData.ts';
import type { Vehicle, IncidentReport, RoadCorridor } from './types/logistics.ts';
import { fetchCorridorRisk } from './services/api.ts';
import { saveIncidentOffline } from './services/db.ts';
import jsPDF from 'jspdf';

// Regional Language Translation Strings (Simplified English)
const TRANSLATIONS = {
  EN: {
    title: "NORTH EAST EMERGENCY ROAD & SUPPLY TRACKER",
    sub: "Emergency Relief Operations • Highway NH-6 Corridor",
    activeVehicles: "Active Trucks",
    corridorRisk: "Road Risk Level",
    simLandslide: "⚡ Simulate Landslide",
    rerouteNotice: "Smart Reroute: Truck redirected through Jowai Bypass to avoid the blocked Sonapur landslide area.",
    reportIncident: "+ Report Road Damage",
    trackedVehicles: "Supply Trucks on the Road",
    cargo: "Carrying",
    eta: "Est. Arrival",
    driverContact: "Phone Number",
    fuel: "Fuel Left",
    speed: "Current Speed",
  },
  AS: {
    title: "উত্তৰ-পূব প্ৰতিষ্ঠানিক পৰিবহণ আৰু সুগমতা প্লেটফৰ্ম",
    sub: "দূৰ্যোগ ব্যৱস্থাপনা কোষ্ঠ • ৰাষ্ট্ৰীয় ঘাইপথ-৬",
    activeVehicles: "সক্ৰিয় সাহায্য বাহন",
    corridorRisk: "এন.এইচ-৬ বিপদেৰ সম্ভাৱনা",
    simLandslide: "⚡ ভূমিস্খলন ৰিপৰ্ট প্ৰদৰ্শন কৰক",
    rerouteNotice: "স্বয়ংক্ৰিয় পথ নিৰ্বাচন: সোণাপুৰ ভূমিস্খলন এলেকা এৰাই চলিবলৈ বিকল্প পথেৰে যান-বাহন প্ৰেৰণ কৰা হৈছে।",
    reportIncident: "+ পথৰ সমস্যা ৰিপৰ্ট কৰক",
    trackedVehicles: "নিৰীক্ষণত থকা অত্যাৱশ্যকীয় সামগ্ৰীৰ যান-বাহন",
    cargo: "সামগ্ৰী",
    eta: "আনুমানিক সময়",
    driverContact: "চালকৰ যোগাযোগ",
    fuel: "ইন্ধনৰ পৰিমাণ",
    speed: "গতি",
  },
  BN: {
    title: "উত্তর-পূর্ব স্মার্ট লজিস্টিকস ও অ্যাক্সেসিবিলিটি প্ল্যাটফর্ম",
    sub: "দুর্যোগ ব্যবস্থাপনা কক্ষ • জাতীয় সড়ক-৬ এলাকা",
    activeVehicles: "সক্রিয় ত্রাণ যানবাহন",
    corridorRisk: "এন.এইচ-৬ ঝুঁকির মাত্রা",
    simLandslide: "⚡ ধস নামার সতর্কবার্তা সিমুলেট করুন",
    rerouteNotice: "এআই রুট নির্দেশিকা: সোনাপুর ধস এলাকা এড়িয়ে নিরাপদ বিকল্প সড়ক নির্ধারণ করা হয়েছে।",
    reportIncident: "+ ক্ষয়ক্ষতির রিপোর্ট জানান",
    trackedVehicles: "জরুরি সামগ্রী পরিবহনকারী যানবাহন তালিকা",
    cargo: "পণ্য",
    eta: "পৌঁছানোর সময়",
    driverContact: "চালকের নম্বর",
    fuel: "জ্বালানির পরিমাণ",
    speed: "গতিবেগ",
  },
  HI: {
    title: "उत्तर-पूर्व स्मार्ट लॉजिस्टिक्स एवं सुगम आपदा मंच",
    sub: "पूर्वोत्तर विकास मंत्रालय • राष्ट्रीय राजमार्ग-6",
    activeVehicles: "सक्रिय राहत वाहन",
    corridorRisk: "NH-6 व्यवधान जोखिम",
    simLandslide: "⚡ भूस्खलन चेतावनी दर्ज करें",
    rerouteNotice: "मार्ग पुननिर्धारण: सोनापुर भूस्खलन क्षेत्र से बचने के लिए वैकल्पिक सुरक्षित मार्ग चुना गया है।",
    reportIncident: "+ मार्ग क्षति रिपोर्ट दर्ज करें",
    trackedVehicles: "ट्रैक किए जा रहे आवश्यक आपूर्ति वाहन",
    cargo: "सामग्री",
    eta: "अनुमानित समय",
    driverContact: "चालक संपर्क",
    fuel: "ईंधन मात्रा",
    speed: "गति",
  }
};

export function App() {
  const [lang, setLang] = useState<'EN' | 'AS' | 'BN' | 'HI'>('EN');
  const [userMode, setUserMode] = useState<'command' | 'driver'>('command');
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'shelters'>('map');
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [corridor, setCorridor] = useState<RoadCorridor>(MAIN_CORRIDOR);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(INITIAL_VEHICLES[0]);
  const [isRerouted, setIsRerouted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  // Interactive Rerouting Simulation Trigger via FastAPI AI
  const handleSimulateDisruption = async () => {
    try {
      const data = await fetchCorridorRisk(35.0, 45.0, 88.0);
      
      setIsRerouted(true);
      setCorridor((prev) => ({
        ...prev,
        status: data.assessment.risk_status === 'Critical' ? 'Blocked' : 'Restricted',
        riskLevel: 'critical',
        disruptionProbability: data.assessment.disruption_probability_percent,
      }));

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === 'VEH-104'
            ? {
                ...v,
                riskLevel: 'warning',
                etaHours: 6.4,
                currentLocation: { lat: 25.3000, lng: 92.5000, name: 'Rerouted via Jowai Bypass' },
              }
            : v
        )
      );
    } catch (error) {
      console.error("FastAPI backend error, falling back to offline logic:", error);
      setIsRerouted(true);
      setCorridor((prev) => ({
        ...prev,
        status: 'Blocked',
        riskLevel: 'critical',
        disruptionProbability: 98,
      }));

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === 'VEH-104'
            ? {
                ...v,
                riskLevel: 'warning',
                etaHours: 6.4,
                currentLocation: { lat: 25.3000, lng: 92.5000, name: 'Rerouted via Jowai Bypass' },
              }
            : v
        )
      );
    }
  };

  // 1-Tap Quick Hazard Reporter Handler for Drivers
  const handleQuickDriverReport = async (type: 'Landslide' | 'Flash Flood' | 'Road Blockage') => {
    const report: IncidentReport = {
      id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      location: { lat: 25.3341, lng: 92.2890, name: 'Driver Spot Incident (NH-6)' },
      type,
      severity: 'critical',
      description: 'Logged via Driver 1-Tap Rapid Reporter.',
      reportedAt: 'Just now',
      verified: navigator.onLine,
      confidenceScore: 88,
    };

    if (!navigator.onLine) {
      await saveIncidentOffline(report);
      alert(`Network connection unavailable. Quick Hazard report (${type}) saved locally in IndexedDB.`);
    } else {
      alert(`[Report Sent] Hazard alert (${type}) transmitted to MDoNER Command Center.`);
    }

    setIncidents((prev) => [report, ...prev]);
  };

  // Generate Downloadable PDF Manifest
  const handleDownloadPDF = () => {
    if (!selectedVehicle) return;

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MDoNER EMERGENCY RELIEF FLEET MANIFEST", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Corridor: Highway NH-6 (Guwahati - Shillong - Silchar)`, 14, 34);

    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    doc.setFont("helvetica", "bold");
    doc.text("VEHICLE & DRIVER TELEMETRY", 14, 46);
    doc.setFont("helvetica", "normal");
    doc.text(`Vehicle ID: ${selectedVehicle.id}`, 14, 54);
    doc.text(`Plate Number: ${selectedVehicle.vehicleNumber}`, 14, 60);
    doc.text(`Driver Name: ${selectedVehicle.driverName}`, 14, 66);
    doc.text(`Emergency Phone: ${selectedVehicle.contactNumber}`, 14, 72);

    doc.setFont("helvetica", "bold");
    doc.text("CARGO & ROUTE DETAILS", 14, 82);
    doc.setFont("helvetica", "normal");
    doc.text(`Cargo Type: ${selectedVehicle.cargoType} (${selectedVehicle.cargoPriority} Priority)`, 14, 90);
    doc.text(`Origin: Guwahati Depot`, 14, 96);
    doc.text(`Destination: ${selectedVehicle.destination.name}`, 14, 102);
    doc.text(`Est. Travel Time: ${selectedVehicle.etaHours} Hours`, 14, 108);

    doc.setFont("helvetica", "bold");
    doc.text("DISASTER SAFETY & ROUTING INSTRUCTIONS", 14, 118);
    doc.setFont("helvetica", "normal");
    if (isRerouted) {
      doc.text("ALERT: Primary Sonapur Tunnel Sector BLOCKED due to landslide.", 14, 126);
      doc.text("REROUTE INSTRUCTION: Detour via Jowai Regional Bypass Road.", 14, 132);
      doc.text("Emergency Medical Shelter: Jowai High School Relief Camp (Lat: 25.45, Lng: 92.20)", 14, 138);
    } else {
      doc.text("Primary Highway NH-6 OPEN. Maintain cautious speed across hill sectors.", 14, 126);
    }

    doc.line(14, 150, 196, 150);
    doc.setFontSize(8);
    doc.text("Official Document • Ministry of Development of North Eastern Region (MDoNER) Logistics Control", 14, 156);

    doc.save(`MANIFEST_${selectedVehicle.id}.pdf`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg font-black text-lg tracking-wider shadow-lg shadow-blue-500/20">
            NER-SHIELD
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-100 uppercase">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400">{t.sub}</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setUserMode('command')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              userMode === 'command' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🖥️ Command Center
          </button>
          <button
            onClick={() => setUserMode('driver')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              userMode === 'driver' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📱 Driver Mode
          </button>
        </div>

        {/* View Switcher Tabs (Shown in Command Mode) */}
        {userMode === 'command' && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'map' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🗺️ Live Map
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Road Conditions
            </button>
            <button
              onClick={() => setActiveTab('shelters')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'shelters' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛖 Emergency Shelters
            </button>
          </div>
        )}

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {userMode === 'command' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              {t.reportIncident}
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {(['EN', 'AS', 'BN', 'HI'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded-md transition-all ${
                  lang === l ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {userMode === 'driver' ? (
        <DriverView
          vehicle={selectedVehicle}
          corridor={corridor}
          isRerouted={isRerouted}
          lang={lang}
          onQuickReport={handleQuickDriverReport}
          onDownloadPDF={handleDownloadPDF}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          {activeTab === 'map' && (
            <>
              {/* Left Side Control Panel */}
              <aside className="w-96 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col shrink-0 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">{t.activeVehicles}</span>
                    <span className="text-xl font-bold text-blue-400">{vehicles.length} Trucks</span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">{t.corridorRisk}</span>
                    <span className={`text-xl font-bold ${isRerouted ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                      {corridor.disruptionProbability}% Risk
                    </span>
                  </div>
                </div>

                <div className="p-3 border-b border-slate-800">
                  {!isRerouted ? (
                    <button
                      onClick={handleSimulateDisruption}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {t.simLandslide}
                    </button>
                  ) : (
                    <div className="bg-orange-950/80 border border-orange-800/80 p-2.5 rounded-lg text-xs text-orange-300 flex items-center gap-2">
                      <span>🚨</span>
                      <p className="leading-tight font-medium">{t.rerouteNotice}</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t.trackedVehicles}
                  </h2>
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedVehicle?.id === v.id
                          ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-blue-400">{v.id}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                          {v.cargoPriority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold">{v.driverName} ({v.vehicleNumber})</p>
                      <p className="text-xs text-slate-400 mt-1">{t.cargo}: <strong>{v.cargoType}</strong></p>
                      <div className="mt-2 flex justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                        <span>Dest: {v.destination.name.split(' ')[0]}</span>
                        <span>{t.eta}: {v.etaHours} hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              {/* Center GIS Map */}
              <main className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-900 flex flex-col shadow-2xl">
                <MapContainerComponent
                  vehicles={vehicles}
                  incidents={incidents}
                  shelters={INITIAL_SHELTERS}
                  corridor={corridor}
                  onSelectVehicle={(v) => setSelectedVehicle(v)}
                />

                {/* Bottom Telemetry Overlay Inspector Panel */}
                {selectedVehicle && (
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur flex items-center justify-between z-10 text-xs">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600/20 text-blue-400 p-3 rounded-xl border border-blue-500/30 font-bold text-lg">
                        🚚
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100">{selectedVehicle.id} — {selectedVehicle.driverName}</h3>
                        <p className="text-slate-400">{selectedVehicle.currentLocation.name} → {selectedVehicle.destination.name}</p>
                      </div>
                    </div>

                    <div className="flex gap-6 border-x border-slate-800 px-6">
                      <div>
                        <span className="text-slate-400 block">{t.speed}</span>
                        <span className="font-bold text-slate-200 text-sm">{selectedVehicle.speedKmH} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t.fuel}</span>
                        <span className="font-bold text-emerald-400 text-sm">{selectedVehicle.fuelPercent}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t.driverContact}</span>
                        <span className="font-bold text-blue-400 text-sm">{selectedVehicle.contactNumber}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadPDF}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        📄 Export Route PDF
                      </button>

                      <button
                        onClick={() => alert(`Connecting emergency radio broadcast to ${selectedVehicle.driverName}...`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                      >
                        📞 Contact Vehicle
                      </button>
                    </div>
                  </div>
                )}
              </main>
            </>
          )}

          {/* Road Conditions Tab */}
          {activeTab === 'analytics' && (
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-100 mb-4">📊 Live Road Conditions & Weather Data (Highway NH-6)</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Rainfall per Hour</span>
                  <p className="text-2xl font-bold text-blue-400 mt-1">35.0 mm/hr</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Hill Steepness</span>
                  <p className="text-2xl font-bold text-orange-400 mt-1">45.0°</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Soil Water Level</span>
                  <p className="text-2xl font-bold text-red-400 mt-1">88.0%</p>
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-2">How Risk Score is Calculated</h3>
                <code className="text-xs text-emerald-400 font-mono block bg-slate-900 p-3 rounded-lg border border-slate-800">
                  Risk = (Rainfall * 1.5) + (Steepness * 0.8) + (Soil Water * 0.4)
                </code>
              </div>
            </div>
          )}

          {/* Shelters Tab */}
          {activeTab === 'shelters' && (
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-100 mb-4">🛖 Emergency Shelters & Relief Camps</h2>
              <div className="grid grid-cols-2 gap-4">
                {INITIAL_SHELTERS.map((s) => (
                  <div key={s.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-blue-400">{s.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">Beds Filled: {s.capacityOccupied} / {s.capacityTotal}</p>
                      <p className="text-xs text-slate-500 mt-1">Medical Care: {s.hasMedicalFacility ? 'Available ✓' : 'Not Available'}</p>
                    </div>
                    <span className="bg-purple-950 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-800 font-semibold">
                      Open
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Field Incident Reporting Modal */}
      <ReportIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitReport={(newReport) => {
          setIncidents((prev) => [newReport, ...prev]);
        }}
      />
    </div>
  );
}

export default App;