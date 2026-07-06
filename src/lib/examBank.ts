// International medical licensing exam practice bank.
//
// IMPORTANT — legal & honesty note: these are ORIGINAL practice questions
// written to match each exam's known format and content blueprint. They are
// NOT real/leaked past questions — actual board questions are copyrighted by
// their administering bodies (NBME, GMC, SCFHS, etc.) and no legitimate
// source of real past papers exists for an app to redistribute. Every track
// below states this plainly so nobody mistakes practice content for official
// material. Where a question leans on country-specific epidemiology (e.g.
// consanguinity screening in Saudi, HIV/TB co-infection in South Africa),
// that reflects genuine regional disease burden, not stereotype.

export type ExamTrack =
  | 'usmle' | 'plab' | 'saudi_smle' | 'uae' | 'singapore' | 'japan'
  | 'taiwan' | 'china' | 'europe_de' | 'south_africa' | 'israel'

export interface ExamInfo {
  id: ExamTrack
  flag: string
  country: string
  examName: string
  body: string
  format: string
}

export interface ExamQuestion {
  id: string
  vignette: string
  options: string[]
  answer: number
  explanation: string
}

export const EXAM_INFO: Record<ExamTrack, ExamInfo> = {
  usmle: { id: 'usmle', flag: '🇺🇸', country: 'Amerika Serikat', examName: 'USMLE (Step 1/2 CK)', body: 'NBME/FSMB', format: 'MCQ vignette klinis, single best answer' },
  plab: { id: 'plab', flag: '🇬🇧', country: 'Inggris (UK)', examName: 'PLAB 1 & 2', body: 'General Medical Council (GMC)', format: 'MCQ + OSCE, penekanan etika & NHS guideline' },
  saudi_smle: { id: 'saudi_smle', flag: '🇸🇦', country: 'Arab Saudi', examName: 'SMLE', body: 'Saudi Commission for Health Specialties (SCFHS)', format: 'MCQ vignette klinis' },
  uae: { id: 'uae', flag: '🇦🇪', country: 'UEA', examName: 'DHA/MOH/HAAD Exam', body: 'Prometric (untuk DHA/MOH/DOH)', format: 'MCQ berbasis komputer' },
  singapore: { id: 'singapore', flag: '🇸🇬', country: 'Singapura', examName: 'SMC Qualifying Exam', body: 'Singapore Medical Council (SMC)', format: 'MCQ + klinis' },
  japan: { id: 'japan', flag: '🇯🇵', country: 'Jepang', examName: 'National Medical Practitioners Qualifying Examination', body: 'Kementerian Kesehatan Jepang (MHLW)', format: 'MCQ, berbahasa Jepang' },
  taiwan: { id: 'taiwan', flag: '🇹🇼', country: 'Taiwan', examName: 'Medical Licensing Examination', body: 'Ministry of Examination Taiwan', format: 'MCQ, dua tahap' },
  china: { id: 'china', flag: '🇨🇳', country: 'Tiongkok', examName: 'National Medical Licensing Examination (NMLE)', body: 'National Medical Examination Center (NMEC)', format: 'MCQ komputer + skill klinis' },
  europe_de: { id: 'europe_de', flag: '🇩🇪', country: 'Jerman (contoh Eropa)', examName: 'Kenntnisprüfung', body: 'Landesärztekammer (dewan kedokteran negara bagian)', format: 'Ujian lisan/klinis untuk pengakuan gelar non-UE' },
  south_africa: { id: 'south_africa', flag: '🇿🇦', country: 'Afrika Selatan', examName: 'HPCSA Board Exam', body: 'Health Professions Council of South Africa', format: 'MCQ + OSCE untuk lulusan asing' },
  israel: { id: 'israel', flag: '🇮🇱', country: 'Israel', examName: 'Rishuy (Israeli Medical Licensing Exam)', body: 'Kementerian Kesehatan Israel', format: 'MCQ, tersedia versi bahasa Inggris' },
}

export const EXAM_ORDER: ExamTrack[] = ['usmle', 'plab', 'saudi_smle', 'uae', 'singapore', 'japan', 'taiwan', 'china', 'europe_de', 'south_africa', 'israel']

export const EXAM_BANK: Record<ExamTrack, ExamQuestion[]> = {
  usmle: [
    { id: 'usmle-1',
      vignette: 'Wanita 32 tahun datang dengan palpitasi, tremor halus, penurunan berat badan meski nafsu makan meningkat, dan goiter difus disertai eksoftalmus. TSH rendah, free T4 tinggi.',
      options: ['Tiroiditis subakut (De Quervain)', "Graves' disease", 'Adenoma toksik', 'Hashimoto tirotoksikosis transien'],
      answer: 1,
      explanation: "Goiter difus + eksoftalmus + hipertiroid adalah trias klasik Graves' disease — autoantibodi TSI (thyroid-stimulating immunoglobulin) mengaktifkan reseptor TSH secara terus-menerus, memicu hipertrofi & hiperfungsi difus kelenjar tiroid serta manifestasi ekstratiroid (oftalmopati) akibat reaktivitas silang antigen retro-orbital." },
    { id: 'usmle-2',
      vignette: 'Pasien laki-laki dengan defisiensi G6PD mengalami hemolisis akut 2 hari setelah minum obat antimalaria untuk terapi radikal Plasmodium vivax.',
      options: ['Primakuin', 'Metformin', 'Atorvastatin', 'Lisinopril'],
      answer: 0,
      explanation: 'Primakuin (dan obat oksidan lain seperti dapson, sulfonamid) menghasilkan spesies oksigen reaktif yang tidak bisa dinetralisir sel darah merah defisien G6PD (kurang NADPH untuk regenerasi glutation tereduksi) — menyebabkan denaturasi hemoglobin (Heinz bodies) dan hemolisis.' },
  ],
  plab: [
    { id: 'plab-1',
      vignette: 'Anak perempuan 15 tahun datang sendiri meminta resep pil kontrasepsi, menolak orang tuanya diberi tahu. Ia tampak memahami risiko & manfaat terapi dengan baik.',
      options: ['Tolak meresepkan tanpa persetujuan orang tua', 'Nilai kompetensi Gillick — jika terpenuhi, boleh diresepkan tanpa memberi tahu orang tua', 'Hubungi orang tua terlebih dahulu sebelum konsultasi lanjut', 'Rujuk ke polisi karena di bawah umur'],
      answer: 1,
      explanation: 'Prinsip "Gillick competence" (kasus hukum Gillick v West Norfolk, 1985) memungkinkan anak di bawah 16 tahun menerima layanan kesehatan tanpa persetujuan orang tua jika dokter menilai ia cukup matang memahami implikasi keputusannya — inti pendekatan GMC pada etika & kerahasiaan remaja.' },
    { id: 'plab-2',
      vignette: 'Pasien asma datang dengan eksaserbasi akut sedang: bicara kalimat penuh, RR 22x/menit, SpO2 95% udara ruangan.',
      options: ['Kortikosteroid oral sebagai langkah pertama', 'Salbutamol nebulisasi/inhaler dosis tinggi sebagai langkah pertama', 'Intubasi elektif', 'Antibiotik empiris'],
      answer: 1,
      explanation: 'Bronkodilator kerja cepat (SABA) adalah lini pertama pada semua tingkat keparahan eksaserbasi asma (British Thoracic Society/NICE guideline) — steroid oral ditambahkan untuk mengurangi inflamasi & mencegah relaps, tapi onsetnya lambat sehingga bukan langkah pertama untuk perbaikan gejala akut.' },
  ],
  saudi_smle: [
    { id: 'smle-1',
      vignette: 'Pasangan calon pengantin menjalani program skrining pranikah wajib nasional di Arab Saudi. Program ini terutama ditujukan mendeteksi kondisi genetik resesif yang meningkat akibat pernikahan kerabat (consanguinity).',
      options: ['Diabetes tipe 2', 'Talasemia & anemia sel sabit', 'Hipertensi esensial', 'Osteoporosis'],
      answer: 1,
      explanation: 'Program skrining pranikah Arab Saudi (sejak 2004) berfokus pada hemoglobinopati (talasemia, anemia sel sabit) karena prevalensinya meningkat signifikan akibat tingginya angka pernikahan kerabat dekat (consanguineous marriage) — kondisi resesif autosomal jauh lebih sering muncul saat kedua orang tua carrier gen yang sama.' },
    { id: 'smle-2',
      vignette: 'Selama musim haji, seorang jamaah kolaps dengan suhu tubuh 41°C, kulit kering, dan penurunan kesadaran di tengah cuaca ekstrem.',
      options: ['Antipiretik oral segera', 'Pendinginan eksternal cepat (evaporative/immersion cooling) + resusitasi cairan', 'Antibiotik spektrum luas empiris', 'Observasi tanpa intervensi aktif'],
      answer: 1,
      explanation: 'Ini heat stroke klasik (bukan infeksi) — mekanisme utama kematian adalah kegagalan termoregulasi menyebabkan denaturasi protein & disfungsi multiorgan. Tatalaksana prioritas adalah pendinginan cepat (target turun <39°C dalam 30 menit) karena kecepatan pendinginan berkorelasi langsung dengan mortalitas, bukan antipiretik yang bekerja pada mekanisme demam berbeda (bukan gangguan hipotalamus akibat panas eksternal).' },
  ],
  uae: [
    { id: 'uae-1',
      vignette: 'Pria 45 tahun ekspatriat di UEA dengan obesitas sentral, HbA1c 8.2%, riwayat keluarga diabetes tipe 2 kuat — populasi UEA termasuk salah satu prevalensi diabetes tertinggi dunia.',
      options: ['Insulin basal sebagai lini pertama', 'Modifikasi gaya hidup + metformin sebagai lini pertama', 'Sulfonilurea sebagai monoterapi awal', 'Tidak perlu terapi farmakologis'],
      answer: 1,
      explanation: 'Metformin tetap lini pertama DM tipe 2 pada mayoritas pasien (kecuali kontraindikasi) — bekerja menurunkan produksi glukosa hepatik (menghambat glukoneogenesis lewat aktivasi AMPK) dan meningkatkan sensitivitas insulin perifer, dengan risiko hipoglikemia rendah dibanding sulfonilurea.' },
    { id: 'uae-2',
      vignette: 'Pasien datang dengan nyeri dada substernal khas, EKG menunjukkan ST elevasi di V1-V4.',
      options: ['STEMI anterior — evaluasi reperfusi segera (PCI primer/fibrinolitik)', 'Perikarditis akut', 'Angina stabil, rawat jalan', 'GERD, terapi PPI empiris'],
      answer: 0,
      explanation: 'ST elevasi V1-V4 menunjukkan infark dinding anterior, khas oklusi LAD (Left Anterior Descending) — teritori terbesar ventrikel kiri, sehingga membutuhkan reperfusi tercepat (door-to-balloon <90 menit untuk PCI primer) untuk membatasi luasnya nekrosis miokard.' },
  ],
  singapore: [
    { id: 'sg-1',
      vignette: 'Pasien dengan demam 3 hari, nyeri retro-orbital, ruam, lalu tiba-tiba tampak membaik namun muncul nyeri perut hebat, muntah persisten, dan perdarahan mukosa — di negara endemis dengue seperti Singapura.',
      options: ['Ini fase pemulihan normal, pulangkan pasien', 'Warning signs dengue berat — perlu rawat inap & monitoring ketat', 'Diagnosis banding utama adalah malaria', 'Berikan aspirin untuk demam'],
      answer: 1,
      explanation: '"Warning signs" dengue (nyeri perut hebat, muntah persisten, perdarahan mukosa, letargi) tepat pada masa transisi ke fase kritis (biasanya hari 3-7) menandakan risiko kebocoran plasma (plasma leakage) akibat disfungsi endotel — memerlukan pemantauan hematokrit & cairan ketat. Aspirin dikontraindikasikan karena efek antiplatelet memperberat risiko perdarahan.' },
    { id: 'sg-2',
      vignette: 'Pria etnis Asia Selatan 50 tahun dengan lingkar pinggang besar namun BMI hanya 24 kg/m², profil lipid menunjukkan trigliserida tinggi dan HDL rendah.',
      options: ['Bukan risiko kardiovaskular karena BMI normal', 'Fenotipe "metabolically obese normal weight" — tetap berisiko tinggi sindrom metabolik', 'Perlu evaluasi untuk anoreksia', 'Cukup pantau tanpa intervensi'],
      answer: 1,
      explanation: 'Populasi Asia Selatan/Asia secara umum cenderung memiliki lebih banyak lemak viseral pada BMI yang sama dibanding populasi Barat — karena itu ambang batas obesitas Asia lebih rendah (WHO Asia-Pacific: overweight ≥23, obesitas ≥25 kg/m²) dan lingkar pinggang/rasio pinggang-pinggul menjadi penanda risiko metabolik yang lebih relevan dari BMI saja.' },
  ],
  japan: [
    { id: 'jpn-1',
      vignette: 'Anak 2 tahun dengan demam ≥5 hari, konjungtivitis bilateral non-purulen, ruam polimorfik, perubahan ekstremitas (edema/eritema telapak), bibir merah pecah-pecah, dan limfadenopati servikal.',
      options: ['Demam skarlatina', 'Penyakit Kawasaki', 'Campak (rubeola)', 'Sindrom Steven-Johnson'],
      answer: 1,
      explanation: 'Penyakit Kawasaki (pertama dideskripsikan oleh Dr. Tomisaku Kawasaki di Jepang, 1967) adalah vaskulitis akut pembuluh darah sedang, terutama arteri koroner — kriteria diagnostik utama: demam ≥5 hari + minimal 4 dari 5 kriteria (konjungtivitis, perubahan mukosa oral, ruam, perubahan ekstremitas, limfadenopati servikal). Tatalaksana IVIG dini krusial mencegah aneurisma koroner.' },
    { id: 'jpn-2',
      vignette: 'Pasien dengan hepatitis B kronis, HBeAg positif, DNA HBV tinggi, ALT meningkat — negara dengan riwayat program skrining & vaksinasi hepatitis B nasional yang luas.',
      options: ['Tidak perlu terapi karena asimtomatik', 'Pertimbangkan terapi antivirus (mis. entecavir/tenofovir) untuk menekan replikasi virus & mencegah progresi ke sirosis/HCC', 'Cukup pemantauan tahunan tanpa terapi', 'Transplantasi hati segera'],
      answer: 1,
      explanation: 'Analog nukleos(t)ida seperti entecavir/tenofovir menghambat reverse transcriptase HBV, menekan replikasi virus jangka panjang — pada fase HBeAg-positif dengan ALT & DNA tinggi (fase imun aktif), terapi menurunkan risiko progresi ke sirosis dan karsinoma hepatoseluler (HCC), komplikasi jangka panjang utama hepatitis B kronis.' },
  ],
  taiwan: [
    { id: 'tw-1',
      vignette: 'Taiwan dikenal sebagai salah satu contoh sukses program vaksinasi hepatitis B universal bayi baru lahir sejak 1984, menurunkan drastis insidensi karsinoma hepatoseluler pada generasi setelahnya.',
      options: ['Vaksin hepatitis B tidak berhubungan dengan risiko HCC', 'Vaksinasi hepatitis B universal mengurangi HCC karena mencegah infeksi kronis yang menjadi pemicu utama karsinogenesis hepatosit', 'HCC di Taiwan terutama disebabkan alkohol, bukan virus', 'Program ini terbukti tidak efektif menurunkan HCC'],
      answer: 1,
      explanation: 'Infeksi HBV kronis adalah penyebab utama HCC secara global lewat integrasi genom virus ke DNA hepatosit & inflamasi kronis berulang (siklus nekrosis-regenerasi meningkatkan mutasi). Studi kohort Taiwan pasca-vaksinasi universal (Chang et al., NEJM 1997) menjadi salah satu bukti epidemiologis terkuat bahwa vaksin virus dapat mencegah kanker.' },
    { id: 'tw-2',
      vignette: 'Anak dengan demam, luka/vesikel di mulut, telapak tangan, dan telapak kaki, dikonfirmasi infeksi Enterovirus 71 selama wabah musiman.',
      options: ['Hand, foot, and mouth disease (HFMD)', 'Varicella (cacar air)', 'Sifilis kongenital', 'Impetigo bulosa'],
      answer: 0,
      explanation: 'HFMD klasik disebabkan Coxsackievirus A16 atau Enterovirus 71 — EV71 penting secara klinis karena berpotensi menyebabkan komplikasi neurologis berat (ensefalitis batang otak, edema paru neurogenik) terutama pada anak kecil, dan menjadi perhatian kesehatan masyarakat besar di kawasan Asia Timur termasuk Taiwan.' },
  ],
  china: [
    { id: 'cn-1',
      vignette: 'Pasien TB paru baru terdiagnosis (kasus baru, belum pernah terapi), sputum BTA positif.',
      options: ['Monoterapi rifampisin', 'Regimen 4 obat (isoniazid, rifampisin, pirazinamid, etambutol) fase intensif 2 bulan, dilanjutkan fase lanjutan', 'Hanya observasi, TB paru bisa sembuh sendiri', 'Streptomisin tunggal seumur hidup'],
      answer: 1,
      explanation: 'Regimen standar TB kasus baru (WHO, diadopsi luas termasuk program nasional Tiongkok yang menanggung beban TB tinggi secara global): fase intensif 2 bulan HRZE menekan populasi basil secara cepat & mencegah resistensi, dilanjutkan fase lanjutan 4 bulan HR untuk mengeliminasi basil persisten/dorman.' },
    { id: 'cn-2',
      vignette: 'Wabah musiman pada anak-anak: demam, vesikel oral-tangan-kaki, sebagian kecil berkembang komplikasi neurologis berat.',
      options: ['Rubella', 'Enterovirus 71 (hand, foot, mouth disease berat)', 'Difteri', 'Pertusis'],
      answer: 1,
      explanation: 'EV71 adalah penyebab HFMD yang berisiko komplikasi neurologis serius (rhombencephalitis, edema paru neurogenik) — Tiongkok mengalami wabah besar berulang, mendorong pengembangan vaksin EV71 inaktivasi yang mulai digunakan di beberapa provinsi.' },
  ],
  europe_de: [
    { id: 'de-1',
      vignette: 'Pasien dengan demam, hipotensi, takikardia, laktat serum meningkat, dan kecurigaan kuat sumber infeksi — dievaluasi menggunakan kriteria Sepsis-3 (qSOFA/SOFA).',
      options: ['Sepsis didefinisikan cukup dengan SIRS ≥2 kriteria (definisi lama)', 'Sepsis-3 mendefinisikan sepsis sebagai disfungsi organ mengancam nyawa akibat respons host yang tidak teregulasi terhadap infeksi, dinilai lewat perubahan skor SOFA ≥2', 'Sepsis hanya bisa didiagnosis dengan kultur darah positif', 'qSOFA menggantikan kebutuhan pemberian antibiotik segera'],
      answer: 1,
      explanation: 'Konsensus Sepsis-3 (2016, dipakai luas termasuk pedoman Jerman/Eropa) meninggalkan kriteria SIRS yang terlalu sensitif-nonspesifik, menggantinya dengan disfungsi organ (∆SOFA≥2) sebagai inti definisi — mencerminkan pemahaman patofisiologi bahwa sepsis adalah kegagalan regulasi imun-host, bukan sekadar infeksi + inflamasi.' },
    { id: 'de-2',
      vignette: 'Dalam ujian Kenntnisprüfung, kandidat ditanya mengenai dasar hukum informed consent sebelum tindakan medis invasif di sistem kesehatan Jerman.',
      options: ['Persetujuan lisan tanpa dokumentasi selalu cukup secara hukum', 'Informed consent memerlukan penjelasan risiko, manfaat, dan alternatif yang dipahami pasien, didokumentasikan, sebelum tindakan non-darurat', 'Informed consent hanya diperlukan untuk tindakan bedah mayor', 'Dokter dapat memutuskan tanpa persetujuan pasien jika demi "kebaikan pasien"'],
      answer: 1,
      explanation: 'Prinsip informed consent (Aufklärungspflicht) dalam hukum kedokteran Jerman mewajibkan penjelasan komprehensif & terdokumentasi sebelum tindakan non-darurat — kegagalan memenuhi ini dapat dianggap sebagai pelanggaran (Körperverletzung) terlepas dari keberhasilan medis tindakannya, mencerminkan prinsip otonomi pasien di atas paternalisme medis.' },
  ],
  south_africa: [
    { id: 'za-1',
      vignette: 'Pasien HIV-positif baru terdiagnosis TB paru aktif, CD4 180 sel/µL, di negara dengan beban HIV-TB koinfeksi tertinggi di dunia.',
      options: ['Tunda ART hingga terapi TB selesai penuh (6 bulan)', 'Mulai terapi TB dulu, lalu mulai ART dalam 2-8 minggu (lebih cepat pada CD4 sangat rendah)', 'Mulai ART dan TB bersamaan di hari yang sama tanpa jeda', 'ART tidak diperlukan jika TB sudah diobati'],
      answer: 1,
      explanation: 'Pedoman WHO/Afrika Selatan: mulai terapi TB terlebih dulu untuk menstabilkan pasien, lalu ART diinisiasi dalam 2 minggu bila CD4 <50, atau dalam 8 minggu bila CD4 lebih tinggi — jeda ini menyeimbangkan risiko mortalitas terkait HIV vs risiko IRIS (Immune Reconstitution Inflammatory Syndrome) yang bisa memperberat gejala TB saat sistem imun pulih mendadak.' },
    { id: 'za-2',
      vignette: 'Pasien dari area endemis malaria falciparum datang dengan demam siklik, dan hasil apus darah tipis-tebal mengonfirmasi Plasmodium falciparum tanpa tanda bahaya (komplikata).',
      options: ['Klorokuin sebagai lini pertama', 'ACT (Artemisinin-based Combination Therapy) sebagai lini pertama', 'Observasi tanpa terapi antimalaria', 'Kina intravena wajib meski tanpa tanda bahaya'],
      answer: 1,
      explanation: 'P. falciparum di sebagian besar Afrika (termasuk Afrika Selatan) sudah resisten luas terhadap klorokuin — ACT (mis. artemether-lumefantrine) menjadi lini pertama WHO untuk malaria falciparum tanpa komplikasi, bekerja cepat menurunkan parasitemia lewat pembentukan radikal bebas yang merusak protein parasit.' },
  ],
  israel: [
    { id: 'il-1',
      vignette: 'Pasien keturunan Yahudi Sefardik dengan episode berulang demam disertai nyeri perut hebat, nyeri sendi, dan nyeri dada pleuritik, masing-masing episode mereda spontan dalam 1-3 hari.',
      options: ['Familial Mediterranean Fever (FMF), terapi profilaksis kolkisin', 'Apendisitis akut berulang', 'Lupus eritematosus sistemik', 'Porfiria intermiten akut'],
      answer: 0,
      explanation: 'FMF adalah penyakit autoinflamasi autosomal resesif akibat mutasi gen MEFV (mengkode pyrin) — lebih prevalen pada populasi Mediterania termasuk Yahudi Sefardik, Armenia, dan Arab. Kolkisin (menghambat polimerisasi mikrotubulus, mengganggu aktivasi inflammasom pyrin) adalah terapi profilaksis standar yang mencegah episode & komplikasi jangka panjang (amiloidosis AA).' },
    { id: 'il-2',
      vignette: 'Bayi baru lahir dari populasi dengan prevalensi tinggi penyakit Tay-Sachs menjalani skrining genetik pra-konsepsi rutin pada pasangan keturunan Yahudi Ashkenazi.',
      options: ['Tay-Sachs disebabkan defisiensi enzim heksosaminidase A, terakumulasi gangliosida GM2 di neuron', 'Tay-Sachs adalah penyakit menular', 'Tay-Sachs hanya memengaruhi tulang', 'Skrining ini tidak relevan secara populasi'],
      answer: 0,
      explanation: 'Tay-Sachs adalah penyakit penimbunan lisosomal akibat defisiensi heksosaminidase A, menyebabkan akumulasi gangliosida GM2 toksik di neuron — frekuensi carrier jauh lebih tinggi pada populasi Yahudi Ashkenazi (efek founder), mendasari program skrining carrier pra-konsepsi yang sangat sukses menurunkan insidensi penyakit di populasi ini.' },
  ],
}

export function questionsForExam(track: ExamTrack): ExamQuestion[] {
  return EXAM_BANK[track] ?? []
}
