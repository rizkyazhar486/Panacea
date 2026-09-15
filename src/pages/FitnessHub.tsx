import { UnifiedBodyWorkspace } from './UnifiedBodyWorkspace'

interface SearchTool { to: string; name: string; kw: string }

// Keep the legacy searchable fitness catalogue available to global search even
// though the visible Fitness route now uses UnifiedBodyWorkspace.
export const GROUPS: { title: string; tools: SearchTool[] }[] = [
  {
    title: 'Daily Training',
    tools: [
      { to: '/athlete', name: 'Athlete', kw: 'athlete dashboard heart rate zones gps run' },
      { to: '/workout', name: 'Workout', kw: 'workout exercise session movement demo' },
      { to: '/training-plan', name: 'AI Program', kw: 'training plan program ai schedule periodization' },
      { to: '/lari-sepeda-renang', name: 'Running, Cycling, Swimming', kw: 'lari sepeda renang cycling swimming triathlon ftp watt power zone css critical swim speed cadence bike fit kecepatan speed' },
      { to: '/teknik-lari', name: 'Running Technique', kw: 'teknik lari running form cadence irama langkah spm stride panjang langkah overstriding postur posisi badan lean condong gerakan kaki foot strike pendaratan tumit midfoot forefoot lengan arm swing napas pernapasan breathing diafragma start pemanasan aerodinamis drafting angin endurance daya tahan volume intensitas 80/20' },
      { to: '/peregangan', name: 'Stretching & Posture', kw: 'peregangan stretching stretch dinamis statis yoga pilates postur posture mobilitas mobility pemanasan warm up pendinginan cooldown hamstring betis bahu pinggul leher fleksor lari renang sepeda' },
      { to: '/crossfit', name: 'CrossFit & AMRAP', kw: 'crossfit amrap emom wod tabata chipper couplet triplet ladder hyrox cindy mary angie barbara chelsea annie fran helen grace karen murph chad jt benchmark girls hero rabdomiolisis rhabdo skala scaling pemula' },
      { to: '/alat-fitness', name: 'Gym Equipment & Hyrox', kw: 'alat fitness gym equipment hyrox mesin beban dumbbell barbell kettlebell' },
      { to: '/sports-lab', name: 'Sports Lab', kw: 'sports lab tes olahraga performa cabang' },
      { to: '/health-data', name: 'Connect a Device', kw: 'connect sambungkan perangkat device wearable apple watch garmin whoop inbody sinkron sync impor import' },
      { to: '/analisis-gerak', name: 'Movement Analysis', kw: 'gait berjalan asimetri asymmetry langkah step length double support cadence irama ground contact vertical oscillation running form bentuk lari hrr cardio recovery pemulihan stair speed tangga daylight cahaya headphone audio' },
      { to: '/riwayat-latihan', name: 'Workout History', kw: 'workout latihan riwayat history sesi heart rate curve kurva zona zone 80/20 easy pace hrr recovery pemulihan apple watch import notification peringatan denyut' },
      { to: '/log-detak-jantung', name: 'Heart Rate Log', kw: 'heart rate log detak jantung real time realtime live monitor sampel webhook auto export apple watch bpm' },
      { to: '/pola-tidur', name: 'Sleep Pattern', kw: 'tidur sleep pola stage deep rem core awake tahapan malam jam tidur keteraturan regularity apple watch jaga shift' },
      { to: '/analisis-pro', name: 'Analysis Pro', kw: 'analisis pro strava fitness freshness ctl atl tsb kebugaran kesegaran relative effort upaya relatif training log best efforts usaha terbaik rekor pr goals target zona pace gap grade adjusted' },
      { to: '/body-battery', name: 'Body Battery', kw: 'body battery baterai energi cadangan stres stress sepanjang hari all day pemulihan recovery garmin hrv denyut istirahat' },
      { to: '/fisiologi-latihan', name: 'Training Physiology', kw: 'training load beban acute chronic acwr epoc trimp status recovery pemulihan readiness kesiapan training effect lthr ambang laktat performance condition endurance ketahanan garmin firstbeat suggested workout' },
      { to: '/alat-endurance', name: 'Endurance Tools', kw: 'fueling bahan bakar karbohidrat carb sweat rate keringat natrium sodium hidrasi ftp watt wkg power zone coggan power guide pacing tanjakan gradien acclimation aklimatisasi panas heat altitude ketinggian sepeda cycling' },
      { to: '/pelacak-klinis', name: 'Clinical Tracker', kw: 'spo2 saturasi pulse ox oksigen ekg ecg afib fibrilasi atrium jet lag jetlag circadian kehamilan hamil pregnancy trimester kursi roda wheelchair paraplegi disrefleksia bahu shoulder' },
      { to: '/latihan-dasar', name: 'Foundation Training & Posture', kw: 'lari run pace easy tempo interval long push up pull up sit up kalistenik calisthenics postur posture vdot' },
      { to: '/fitness-test', name: 'Fitness Test', kw: 'fitness test form posture ai photo injury risk' },
    ],
  },
  {
    title: 'Recovery & Readiness',
    tools: [
      { to: '/readiness', name: 'Recovery & Strain', kw: 'recovery strain readiness hrv fatigue' },
      { to: '/assessment', name: 'Initial Assessment', kw: 'initial assessment baseline screening onboarding' },
    ],
  },
  {
    title: 'Body & Performance Data',
    tools: [
      { to: '/body', name: 'Body Composition', kw: 'body composition inbody fat muscle scale' },
      { to: '/lab', name: 'Performance Lab', kw: 'performance lab vo2max load management' },
      { to: '/sports-science', name: 'Science & KPIs', kw: 'sports science kpi evidence metrics' },
      { to: '/organ-vitality', name: 'Anti-Aging & Organs', kw: 'organ vitality anti-aging longevity' },
    ],
  },
  {
    title: 'Programs & Scores',
    tools: [
      { to: '/shape-forming', name: 'Shape Forming', kw: 'shape forming body recomposition program' },
      { to: '/sports-scores', name: 'Live Scores', kw: 'live scores sports scoreboard football f1 motogp' },
    ],
  },
]

export function FitnessHub() {
  return <UnifiedBodyWorkspace />
}

export default FitnessHub
