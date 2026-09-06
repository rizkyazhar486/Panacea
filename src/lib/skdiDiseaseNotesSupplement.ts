import type { SkdiDiseaseNote } from './skdiDiseaseNotes'

/**
 * Catatan tambahan untuk baris SKDI yang sebelumnya belum mempunyai isi.
 *
 * Kunci sengaja memakai judul SKDI persis seperti pada `skdiDiseaseList.ts`.
 * Sebagian baris SKDI adalah payung beberapa diagnosis (misalnya penyakit katup
 * dan kelainan jantung kongenital), sehingga catatan ini TIDAK memaksakan satu
 * kode ICD-11 untuk seluruh baris. Kode/entitas resmi harus diambil dari WHO ICD
 * API per diagnosis melalui katalog ICD-11 di UI.
 *
 * Isi klinis adalah ringkasan edukasi berbasis sumber pada `REFERENSI_SUMBER`;
 * bukan salinan teks WHO dan bukan pengganti pedoman klinis terbaru.
 */
export const SKDI_DISEASE_NOTES_SUPPLEMENT: Record<string, SkdiDiseaseNote> = {
  "Delirium yang diinduksi oleh alkohol atau zat psikoaktif lainnya": {
    definisi:
      'Gangguan akut perhatian dan kesadaran yang berfluktuasi akibat intoksikasi, putus zat, obat, atau kombinasi faktor medis; pada alkohol, delirium tremens adalah bentuk putus alkohol berat yang dapat mengancam nyawa.',
    etiologi:
      'Putus alkohol setelah penggunaan berat berkepanjangan; intoksikasi atau putus sedatif-hipnotik dan zat lain; obat antikolinergik, opioid, kortikosteroid, atau polifarmasi; sering diperberat infeksi, gangguan elektrolit, hipoglikemia, hipoksia, gagal hati, atau trauma kepala.',
    patofisiologi:
      'Perubahan mendadak keseimbangan neurotransmiter dan respons stres otak mengganggu jaringan atensi dan kesadaran. Pada putus alkohol terjadi hiperaktivitas glutamatergik relatif setelah efek inhibisi GABA kronik hilang, sehingga dapat muncul tremor, agitasi, halusinasi, kejang, dan disautonomia.',
    faktorRisiko: [
      'Penggunaan alkohol berat atau sedatif jangka panjang',
      'Riwayat kejang putus zat atau delirium tremens',
      'Usia lanjut, penyakit akut berat, gangguan hati, dehidrasi, dan polifarmasi',
    ],
    pemeriksaanFisik: [
      'Nilai tingkat kesadaran, perhatian, orientasi, agitasi/retardasi, tremor, halusinasi, dan fluktuasi gejala',
      'Tanda vital termasuk demam, hipertensi, takikardia, takipnea, dan tanda dehidrasi; cari trauma serta fokus infeksi',
    ],
    penunjang: [
      'Glukosa darah segera; elektrolit, fungsi ginjal/hati, darah lengkap, dan pemeriksaan toksikologi sesuai konteks',
      'EKG bila ada gangguan elektrolit atau obat yang memanjangkan QT; pencitraan otak bila trauma, defisit neurologis fokal, atau penyebab struktural dicurigai',
    ],
    diagnosis: [
      'Onset akut atau subakut dengan gangguan perhatian dan kesadaran yang berfluktuasi, disertai bukti hubungan temporal dengan zat/obat atau putus zat, setelah penyebab medis lain dicari secara aktif',
    ],
    diagnosisBanding: ['Psikosis primer', 'Demensia', 'Ensefalopati metabolik', 'Meningoensefalitis', 'Hipoglikemia', 'Cedera kepala'],
    tatalaksana: [
      'Stabilisasi ABC, koreksi hipoglikemia, hipoksia, dehidrasi, dan gangguan elektrolit serta tangani penyebab medis yang menyertai',
      'Pada putus alkohol sedang-berat, benzodiazepin bertitrasi berdasarkan gejala merupakan terapi utama; berikan tiamin sebelum atau bersama glukosa pada pasien berisiko defisiensi tiamin',
      'Lingkungan tenang, reorientasi berulang, tidur terjaga, minimalkan restrain dan obat yang memperburuk delirium',
    ],
    komplikasi: ['Kejang', 'Aspirasi', 'Aritmia', 'Rabdomiolisis', 'Cedera akibat agitasi', 'Kematian bila delirium tremens tidak ditangani'],
    edukasi: ['Jelaskan bahwa penghentian alkohol/sedatif mendadak setelah penggunaan berat dapat berbahaya dan sebaiknya dilakukan dengan penilaian medis.'],
    prognosis: 'Umumnya membaik bila penyebab diatasi cepat; delirium tremens memiliki risiko komplikasi serius dan memerlukan pemantauan ketat.',
    referensi: ['SKDI2012', 'DSM5TR2022', 'KAPLAN2015', 'WHOMHGAP2016'],
  },

  "Penyakit Paru Obstruksi Kronik (PPOK) eksaserbasi akut": {
    definisi:
      'Perburukan akut sesak napas dan/atau batuk serta sputum pada PPOK yang terjadi dalam beberapa hari dan membutuhkan tambahan terapi dibanding keadaan stabil.',
    etiologi:
      'Infeksi virus atau bakteri saluran napas, polusi udara dan pajanan iritan adalah pencetus tersering; pneumonia, gagal jantung, emboli paru, pneumotoraks, dan aritmia harus dipikirkan sebagai diagnosis alternatif atau penyerta.',
    patofisiologi:
      'Inflamasi jalan napas meningkat, edema dan mukus bertambah, bronkokonstriksi serta air trapping memburuk sehingga kerja napas meningkat. Ketidakcocokan ventilasi-perfusi dapat menimbulkan hipoksemia dan pada kasus berat hiperkapnia/asidosis respiratorik.',
    faktorRisiko: ['PPOK berat', 'Eksaserbasi berulang', 'Merokok aktif', 'Infeksi respiratorik', 'Paparan polusi/biomassa', 'Komorbid kardiovaskular'],
    pemeriksaanFisik: [
      'Nilai kemampuan bicara, penggunaan otot bantu napas, frekuensi napas, saturasi oksigen, wheezing, dan perubahan status mental',
      'Cari tanda pneumonia, gagal jantung, pneumotoraks, tromboemboli, dan sepsis',
    ],
    penunjang: [
      'Pulse oximetry; analisis gas darah bila berat, hiperkapnia dicurigai, atau ventilasi noninvasif dipertimbangkan',
      'Foto toraks bila diagnosis alternatif/komplikasi dicurigai; EKG dan pemeriksaan lain sesuai komorbid/pencetus',
    ],
    diagnosis: ['Diagnosis klinis pada pasien PPOK dengan peningkatan akut dispnea dan/atau batuk-sputum yang memerlukan eskalasi terapi, sambil menyingkirkan penyebab lain.'],
    diagnosisBanding: ['Pneumonia', 'Gagal jantung akut', 'Emboli paru', 'Pneumotoraks', 'Asma', 'Aritmia'],
    tatalaksana: [
      'Bronkodilator kerja pendek inhalasi (beta-2 agonis dengan atau tanpa antimuskarinik) sebagai terapi awal',
      'Kortikosteroid sistemik jangka pendek pada eksaserbasi sedang-berat sesuai pedoman; antibiotik bila terdapat indikasi infeksi bakteri seperti peningkatan purulensi sputum bersama gejala respiratorik atau kebutuhan ventilasi',
      'Oksigen terkontrol dengan target saturasi individual; pada risiko retensi CO2 umumnya dititrasi sekitar 88-92% sambil memantau gas darah',
      'Ventilasi noninvasif pada gagal napas hiperkapnik dengan asidosis bila tidak ada kontraindikasi; rujuk/intensifkan perawatan bila memburuk',
    ],
    komplikasi: ['Gagal napas akut', 'Asidosis respiratorik', 'Pneumonia', 'Aritmia', 'Kebutuhan ventilasi invasif', 'Kematian'],
    edukasi: ['Setelah stabil: optimalkan inhaler pemeliharaan, teknik inhalasi, berhenti merokok, vaksinasi yang sesuai, rehabilitasi paru, dan rencana aksi eksaserbasi.'],
    prognosis: 'Eksaserbasi mempercepat penurunan fungsi dan meningkatkan risiko rawat inap serta kematian; pencegahan episode berikutnya merupakan bagian inti terapi.',
    referensi: ['SKDI2012', 'GOLD2024', 'MURRAY2022'],
  },

  "Kelainan jantung kongenital (Ventricular Septal Defect, Atrial Septal Defect, Patent Ductus Arteriosus, Tetralogy of Fallot)": {
    definisi:
      'Baris payung untuk kelainan struktur jantung sejak lahir. VSD, ASD, PDA umumnya menyebabkan shunt kiri-ke-kanan, sedangkan Tetralogy of Fallot merupakan kelainan sianotik dengan VSD, overriding aorta, obstruksi aliran keluar ventrikel kanan, dan hipertrofi ventrikel kanan.',
    etiologi:
      'Sebagian besar multifaktorial; risiko meningkat pada kelainan kromosom/sindrom genetik tertentu, diabetes maternal, infeksi rubela, obat/teratogen tertentu, dan riwayat keluarga penyakit jantung bawaan.',
    patofisiologi:
      'Besarnya defek dan resistensi vaskular menentukan arah/besar shunt. Shunt kiri-ke-kanan besar menyebabkan overcirculation paru dan gagal jantung; penyakit vaskular paru yang menetap dapat berbalik menjadi shunt kanan-ke-kiri (Eisenmenger). Pada Tetralogy of Fallot, obstruksi aliran keluar kanan mendorong darah terdeoksigenasi melewati VSD ke aorta sehingga timbul sianosis.',
    pemeriksaanFisik: ['Nilai sianosis, takipnea, gagal tumbuh, clubbing, saturasi, karakter murmur, bunyi jantung, hepatomegali, dan tanda gagal jantung.'],
    penunjang: ['Ekokardiografi Doppler adalah pemeriksaan utama anatomi dan hemodinamika; EKG dan foto toraks melengkapi penilaian, sedangkan CT/MRI/katerisasi dipakai pada kasus terpilih.'],
    diagnosis: ['Tentukan lesi spesifik dengan ekokardiografi; jangan menggunakan satu kode ICD-11 untuk keseluruhan baris payung ini karena setiap defek merupakan entitas tersendiri.'],
    diagnosisBanding: ['Murmur fungsional', 'Penyakit katup didapat', 'Kardiomiopati', 'Hipertensi pulmonal primer'],
    tatalaksana: [
      'Tatalaksana bergantung pada jenis dan dampak hemodinamik: observasi pada defek kecil tertentu, terapi gagal jantung bila simptomatik, dan penutupan kateter/bedah atau koreksi bedah sesuai indikasi',
      'Tetralogy of Fallot memerlukan evaluasi kardiologi anak dan koreksi bedah; episode hipersianotik memerlukan penanganan emergensi',
    ],
    komplikasi: ['Gagal jantung', 'Hipertensi pulmonal/Eisenmenger', 'Aritmia', 'Endokarditis pada kondisi berisiko tertentu', 'Hipoksemia kronik', 'Stroke/abses otak pada shunt kanan-ke-kiri'],
    edukasi: ['Jelaskan bahwa jenis kelainan menentukan prognosis dan terapi; follow-up kardiologi diperlukan bahkan setelah intervensi pada sebagian pasien.'],
    prognosis: 'Bervariasi luas. Banyak defek sederhana memiliki luaran sangat baik setelah observasi atau koreksi; lesi kompleks membutuhkan follow-up seumur hidup.',
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },

  "Radang pada dinding jantung (Endokarditis, Miokarditis, Perikarditis)": {
    definisi:
      'Baris payung tiga proses berbeda: endokarditis mengenai endokard/katup, miokarditis mengenai otot jantung, dan perikarditis mengenai selaput perikard. Ketiganya tidak boleh diperlakukan sebagai satu diagnosis atau satu kode ICD-11.',
    etiologi:
      'Endokarditis paling sering infeksi bakteri pada permukaan endokard; miokarditis sering berkaitan infeksi virus, proses imun, obat, atau toksin; perikarditis dapat idiopatik/viral, pascainfark, uremik, autoimun, neoplastik, tuberkulosis, atau bakteri.',
    patofisiologi:
      'Endokarditis membentuk vegetasi yang merusak katup dan dapat berembolisasi. Miokarditis menimbulkan cedera miosit dan disfungsi pompa/aritmia. Perikarditis menimbulkan inflamasi perikard, nyeri pleuritik dan efusi; akumulasi cairan bertekanan dapat menyebabkan tamponade.',
    pemeriksaanFisik: ['Cari demam, murmur baru/perubahan murmur, tanda emboli; tanda gagal jantung/aritmia pada miokarditis; friction rub, nyeri membaik saat duduk condong ke depan, pulsus paradoxus atau tanda tamponade pada perikarditis.'],
    penunjang: ['EKG, troponin, marker inflamasi dan ekokardiografi sesuai sindrom; kultur darah sebelum antibiotik bila endokarditis dicurigai; cardiac MRI dapat membantu miokarditis; evaluasi efusi perikard dengan echo.'],
    diagnosis: ['Tentukan diagnosis spesifik berdasarkan sindrom klinis dan pemeriksaan penunjang; endokarditis memakai kriteria klinis/mikrobiologi-pencitraan, sedangkan miokarditis/perikarditis memiliki pendekatan berbeda.'],
    diagnosisBanding: ['Sindrom koroner akut', 'Emboli paru', 'Pneumonia/pleuritis', 'Kardiomiopati', 'Sepsis tanpa endokarditis'],
    tatalaksana: [
      'Endokarditis infektif: kultur darah dan antibiotik IV terarah; konsultasi bedah bila gagal jantung, infeksi tidak terkontrol, atau indikasi struktural lain',
      'Miokarditis: terapi suportif dan gagal jantung/aritmia, hindari olahraga intens selama fase aktif; terapi spesifik tergantung penyebab',
      'Perikarditis tidak komplikata umumnya antiinflamasi dan kolkisin sesuai indikasi; tamponade memerlukan drainase segera',
    ],
    komplikasi: ['Gagal katup/emboli/sepsis', 'Gagal jantung dan aritmia ganas', 'Tamponade jantung', 'Perikarditis konstriktif'],
    prognosis: 'Sangat bergantung pada etiologi dan komplikasi; identifikasi subtipe lebih penting daripada label payung.',
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },

  "Cardiorespiratory arrest": {
    definisi:
      'Hilangnya sirkulasi efektif yang menyebabkan tidak ada respons, tidak bernapas normal atau hanya gasping, dan tidak ada tanda perfusi; merupakan kegawatdaruratan yang memerlukan resusitasi segera.',
    etiologi:
      'Penyebab reversibel mencakup hipoksia, hipovolemia, gangguan ion/metabolik berat, hipotermia, trombosis koroner atau pulmonal, tamponade jantung, tension pneumothorax, dan toksin; penyakit jantung koroner/aritmia merupakan penyebab penting pada dewasa.',
    patofisiologi:
      'Berhentinya curah jantung memutus perfusi otak dan koroner dalam detik. Peluang keberhasilan turun cepat tanpa kompresi dan defibrilasi pada ritme shockable; setelah ROSC dapat terjadi cedera hipoksik-iskemik dan sindrom pascahenti jantung.',
    pemeriksaanFisik: ['Pastikan keamanan, nilai respons, pernapasan normal dan tanda sirkulasi secara cepat; identifikasi ritme dengan monitor/defibrillator sesegera mungkin.'],
    penunjang: ['Selama resusitasi, penilaian ritme dan ETCO2 bila tersedia; setelah ROSC lakukan EKG 12 sadapan, gas darah, elektrolit, glukosa, pencitraan/pemeriksaan lain untuk mencari penyebab.'],
    diagnosis: ['Tidak responsif, tidak bernapas normal/gasping, dan tidak ada sirkulasi efektif; jangan menunda CPR untuk pemeriksaan yang tidak esensial.'],
    tatalaksana: [
      'Aktifkan sistem emergensi, mulai CPR berkualitas tinggi dan pasang AED/defibrillator secepat mungkin',
      'Defibrilasi segera untuk ventricular fibrillation/pulseless ventricular tachycardia; epinefrin dan obat lain mengikuti algoritme resusitasi sesuai ritme',
      'Cari dan koreksi penyebab reversibel; setelah ROSC lakukan stabilisasi oksigenasi, ventilasi, hemodinamika, temperatur dan evaluasi penyebab',
    ],
    komplikasi: ['Cedera otak hipoksik-iskemik', 'Syok pascahenti jantung', 'Disfungsi multi-organ', 'Trauma akibat CPR', 'Kematian'],
    edukasi: ['Untuk masyarakat, pengenalan cepat, panggilan bantuan, CPR segera, dan AED adalah mata rantai utama keselamatan.'],
    prognosis: 'Ditentukan terutama oleh penyebab, apakah kejadian disaksikan, waktu ke CPR/defibrilasi, ritme awal, dan kualitas perawatan pasca-ROSC.',
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },

  "Penyakit katup jantung (Mitral stenosis, Mitral regurgitation, Aortic stenosis, Aortic regurgitation)": {
    definisi:
      'Baris payung untuk stenosis atau regurgitasi katup mitral/aorta. Setiap lesi mempunyai hemodinamika, etiologi, indikasi intervensi, dan kode ICD-11 tersendiri.',
    etiologi:
      'Mitral stenosis klasik berkaitan penyakit jantung rematik; mitral regurgitation dapat primer degeneratif/prolaps atau sekunder akibat dilatasi ventrikel; aortic stenosis sering degeneratif-kalsifik atau katup bikus; aortic regurgitation dapat akibat kelainan daun katup atau dilatasi akar aorta.',
    patofisiologi:
      'Stenosis menimbulkan hambatan aliran dan overload tekanan di ruang proksimal; regurgitasi menimbulkan overload volume. Adaptasi jangka panjang berupa hipertrofi/dilatasi akhirnya dapat gagal, menyebabkan kongesti, hipertensi pulmonal, aritmia, sinkop, iskemia, atau gagal jantung.',
    pemeriksaanFisik: ['Nilai karakter murmur, lokasi/radiasi, S1/S2, pulse pressure, tanda kongesti, atrial fibrillation, dan perfusi perifer.'],
    penunjang: ['Ekokardiografi transthorakal Doppler adalah pemeriksaan utama untuk mekanisme dan derajat; EKG, foto toraks, stress testing, CT atau kateterisasi digunakan selektif.'],
    diagnosis: ['Klasifikasikan jenis katup, mekanisme, derajat berat, gejala, fungsi ventrikel, dan konsekuensi hemodinamik; jangan menggunakan satu label payung sebagai diagnosis final.'],
    diagnosisBanding: ['Murmur fungsional', 'Kardiomiopati hipertrofik', 'Defek septum', 'Gagal jantung tanpa kelainan katup primer'],
    tatalaksana: [
      'Terapi medik menangani gejala/komorbid tetapi tidak memperbaiki semua lesi mekanik',
      'Intervensi kateter atau bedah dipertimbangkan berdasarkan jenis dan derajat lesi, gejala, fungsi ventrikel, anatomi, risiko prosedur, serta guideline Heart Team',
      'Antikoagulasi mengikuti indikasi seperti atrial fibrillation dan konteks katup/prostesis, bukan diberikan otomatis pada semua penyakit katup',
    ],
    komplikasi: ['Gagal jantung', 'Atrial fibrillation', 'Tromboemboli', 'Hipertensi pulmonal', 'Endokarditis', 'Kematian mendadak pada lesi tertentu'],
    prognosis: 'Baik bila lesi berat dikenali dan diintervensi pada waktu yang tepat; keterlambatan sampai terjadi disfungsi ventrikel menetap memperburuk luaran.',
    referensi: ['SKDI2012', 'BRAUNWALD2022', 'HARRISON2022'],
  },

  "Hernia (inguinalis, femoralis, skrotalis) reponibilis, irreponibilis": {
    definisi:
      'Penonjolan isi rongga abdomen melalui defek dinding. Reponibilis dapat kembali ke rongga abdomen spontan/dengan tekanan lembut; irreponibilis tidak dapat direduksi. Hernia skrotalis biasanya merupakan hernia inguinal yang turun ke skrotum.',
    etiologi:
      'Kelemahan anatomi dinding abdomen yang bersifat kongenital atau didapat, diperberat peningkatan tekanan intraabdomen seperti batuk kronik, konstipasi, mengangkat beban, asites, kehamilan, atau prostatismus.',
    patofisiologi:
      'Kantung peritoneum dan isinya menonjol melalui kanal/defek. Hernia yang tidak dapat direduksi dapat berisi omentum atau usus yang terjepit; bila aliran darah terganggu, keadaan berubah menjadi strangulasi dan menjadi emergensi.',
    pemeriksaanFisik: ['Periksa berdiri dan berbaring, impuls batuk, lokasi benjolan terhadap ligamentum inguinale, kemampuan reduksi, nyeri tekan, perubahan kulit, distensi abdomen, dan tanda obstruksi.'],
    diagnosis: ['Diagnosis umumnya klinis; ultrasonografi dapat membantu bila temuan meragukan, terutama pada benjolan groin yang kecil atau pasien dengan habitus sulit.'],
    diagnosisBanding: ['Limfadenopati inguinal', 'Hidrokel', 'Varikokel', 'Lipoma', 'Aneurisma femoral', 'Testis tidak turun'],
    tatalaksana: [
      'Hernia simptomatik atau irreponibilis membutuhkan evaluasi bedah; operasi elektif memperbaiki defek pada kasus yang sesuai',
      'Jangan memaksa reduksi pada benjolan sangat nyeri atau bila dicurigai strangulasi; evaluasi emergensi diperlukan',
    ],
    komplikasi: ['Inkarserasi', 'Obstruksi usus', 'Strangulasi dan nekrosis usus', 'Perforasi/peritonitis'],
    edukasi: ['Segera ke IGD bila benjolan mendadak sangat nyeri, tidak dapat masuk, disertai muntah, distensi, demam, atau perubahan warna kulit.'],
    prognosis: 'Umumnya sangat baik setelah perbaikan yang tepat; risiko menjadi emergensi lebih tinggi pada hernia femoralis.',
    referensi: ['SKDI2012', 'SCHWARTZ2019'],
  },

  "Hernia (inguinalis, femoralis, skrotalis) strangulata, inkarserata": {
    definisi:
      'Hernia inkarserata adalah hernia irreponibel dengan isi terperangkap; strangulata berarti suplai darah isi hernia telah terganggu dan merupakan kegawatdaruratan bedah.',
    etiologi:
      'Leher kantung sempit dan tekanan tinggi menjepit usus/omentum; hernia femoralis memiliki risiko strangulasi yang relatif tinggi karena cincin femoral kaku dan sempit.',
    patofisiologi:
      'Kompresi vena terjadi lebih dahulu sehingga edema dinding usus bertambah dan tekanan meningkat, kemudian aliran arteri berkurang, terjadi iskemia, nekrosis, translokasi bakteri, perforasi, peritonitis, dan sepsis.',
    pemeriksaanFisik: ['Benjolan nyeri hebat, tegang, irreponibel; nilai perubahan kulit, demam, takikardia, nyeri abdomen, muntah, distensi, bising usus dan tanda peritonitis/sepsis.'],
    penunjang: ['Diagnosis terutama klinis; darah lengkap, elektrolit, laktat dan CT abdomen dapat membantu bila tidak menunda operasi pada kecurigaan tinggi.'],
    diagnosis: ['Hernia irreponibel dengan tanda obstruksi atau iskemia; nyeri berat menetap, tanda sistemik, peritonitis, atau gambaran iskemia meningkatkan kecurigaan strangulasi.'],
    diagnosisBanding: ['Limfadenitis/abses groin', 'Torsio testis', 'Aneurisma femoral', 'Obstruksi usus penyebab lain'],
    tatalaksana: [
      'Resusitasi cairan, analgesia, puasa, koreksi elektrolit, dekompresi bila diperlukan, dan konsultasi bedah emergensi',
      'Strangulasi memerlukan eksplorasi operasi segera dan penilaian viabilitas usus; antibiotik diberikan bila iskemia/perforasi atau kontaminasi dicurigai',
    ],
    komplikasi: ['Nekrosis usus', 'Perforasi', 'Peritonitis', 'Sepsis/syok', 'Reseksi usus', 'Kematian'],
    prognosis: 'Sangat bergantung pada waktu menuju operasi; keterlambatan meningkatkan kebutuhan reseksi usus dan mortalitas.',
    referensi: ['SKDI2012', 'SCHWARTZ2019', 'ATLS2018'],
  },

  "Sindrom duh (discharge) genital (gonore dan nongonore)": {
    definisi:
      'Sindrom keluarnya sekret abnormal dari uretra atau genital yang dapat disebabkan gonore maupun penyebab nongonore; diagnosis etiologis ideal memakai pemeriksaan mikrobiologi karena gejala saling tumpang tindih.',
    etiologi:
      'Neisseria gonorrhoeae; Chlamydia trachomatis merupakan penyebab penting uretritis nongonore; Trichomonas vaginalis, Mycoplasma genitalium dan penyebab lain dipertimbangkan sesuai lokasi, populasi, dan pola gejala.',
    patofisiologi:
      'Infeksi epitel mukosa menimbulkan inflamasi dan eksudat. Infeksi yang naik ke traktus genital dapat menyebabkan epididimitis pada laki-laki atau penyakit radang panggul pada perempuan, dengan risiko infertilitas dan kehamilan ektopik.',
    faktorRisiko: ['Hubungan seksual tanpa kondom', 'Pasangan seksual baru/lebih dari satu', 'Riwayat IMS', 'Pasangan dengan IMS'],
    pemeriksaanFisik: ['Nilai karakter discharge, meatus/serviks, ulkus/lesi lain, nyeri pelvis, nyeri epididimis/testis, demam, dan tanda penyakit radang panggul.'],
    penunjang: ['NAAT untuk gonore dan klamidia bila tersedia; kultur gonore penting pada dugaan kegagalan terapi/resistensi; tes HIV, sifilis dan IMS lain sesuai risiko.'],
    diagnosis: ['Diagnosis sindromik dapat memandu terapi awal ketika tes tidak tersedia, tetapi hasil NAAT/kultur memungkinkan terapi etiologis dan surveilans resistensi.'],
    diagnosisBanding: ['Kandidiasis/vaginitis', 'Trikomoniasis', 'Servisitis noninfeksi', 'Balanitis', 'Infeksi saluran kemih'],
    tatalaksana: [
      'Terapi mengikuti diagnosis etiologis dan pedoman resistensi terkini; gonore memerlukan regimen sefalosporin yang direkomendasikan guideline, sementara klamidia/nongonore ditangani sesuai patogen dan kondisi pasien',
      'Evaluasi dan tata laksana pasangan seksual, anjurkan abstinensi sampai terapi selesai sesuai guideline, serta lakukan retesting bila direkomendasikan',
    ],
    komplikasi: ['Penyakit radang panggul', 'Infertilitas', 'Kehamilan ektopik', 'Epididimitis', 'Infeksi gonokokus diseminata', 'Transmisi perinatal'],
    edukasi: ['Kondom menurunkan risiko; pasangan perlu dievaluasi meski tanpa gejala.'],
    prognosis: 'Baik bila diobati dini dan pasangan ditangani; infeksi yang tidak dikenali dapat meninggalkan komplikasi reproduksi.',
    referensi: ['SKDI2012', 'CDCSTI2021', 'PERDOSKI2021'],
  },

  "Adenomiosis, mioma": {
    definisi:
      'Baris payung dua penyakit jinak uterus yang berbeda: adenomiosis adalah keberadaan jaringan endometrium di dalam miometrium, sedangkan mioma uteri (leiomioma) adalah tumor jinak otot polos uterus.',
    etiologi:
      'Keduanya dipengaruhi hormon reproduksi. Mioma berasal dari klon sel otot polos dengan perubahan molekuler yang beragam; adenomiosis berkaitan invaginasi endometrium/batas endometrium-miometrium dan mekanisme lain yang belum sepenuhnya dipahami.',
    patofisiologi:
      'Adenomiosis menimbulkan pembesaran uterus dan inflamasi/kontraksi yang berhubungan dengan dismenore dan perdarahan. Mioma mengubah luas/kontraktilitas kavum, vaskularisasi, dan mekanika uterus sehingga dapat menimbulkan heavy menstrual bleeding, tekanan pelvis atau gangguan reproduksi bergantung lokasi dan ukuran.',
    pemeriksaanFisik: ['Nilai anemia, nyeri tekan pelvis, ukuran/kontur uterus; uterus globular dapat mendukung adenomiosis, sedangkan kontur irregular dapat ditemukan pada mioma.'],
    penunjang: ['Tes kehamilan dan darah lengkap pada perdarahan; ultrasonografi transvaginal adalah pemeriksaan awal utama, MRI digunakan bila diagnosis/pemetaan masih tidak jelas atau untuk perencanaan tertentu.'],
    diagnosis: ['Bedakan adenomiosis dan mioma berdasarkan gejala dan pencitraan; jangan menggunakan satu kode ICD-11 untuk gabungan keduanya.'],
    diagnosisBanding: ['Endometriosis', 'Polip endometrium', 'Keganasan endometrium', 'Kehamilan', 'Kelainan koagulasi'],
    tatalaksana: [
      'Terapi disesuaikan gejala, anemia, usia dan rencana fertilitas: analgesik/NSAID, terapi hormonal dan/atau traneksamat dapat digunakan sesuai indikasi',
      'Pilihan prosedural untuk mioma mencakup miomektomi, embolisasi pada pasien terpilih, atau histerektomi; adenomiosis refrakter dapat memerlukan intervensi termasuk histerektomi bila fertilitas tidak diinginkan',
    ],
    komplikasi: ['Anemia defisiensi besi', 'Nyeri kronik', 'Gangguan kualitas hidup', 'Masalah fertilitas/kehamilan pada sebagian pasien'],
    edukasi: ['Pilihan terapi harus memasukkan keinginan mempertahankan uterus dan fertilitas; ukuran lesi saja tidak menentukan terapi.'],
    prognosis: 'Jinak; gejala sering berkurang setelah menopause, tetapi dampak terhadap perdarahan, nyeri, dan fertilitas dapat signifikan sebelum itu.',
    referensi: ['SKDI2012', 'WILLIAMSOB2022', 'HARRISON2022'],
  },

  "Sexual pain disorder (termasuk vaginismus, dispareunia)": {
    definisi:
      'Nyeri atau kesulitan penetrasi yang menetap/berulang dengan komponen nyeri genitopelvik, ketegangan otot dasar panggul, ketakutan atau penghindaran; istilah modern menekankan spektrum genito-pelvic pain/penetration disorder dan evaluasi penyebab organik maupun psikososial.',
    etiologi:
      'Dapat berkaitan atrofi/menopause, infeksi, vulvodynia, endometriosis, penyakit pelvis, trauma obstetri/operasi, hipertonus dasar panggul, gangguan dermatologis, efek obat, kecemasan, pengalaman seksual menyakitkan, trauma, atau faktor relasi; sering multifaktorial.',
    patofisiologi:
      'Nyeri berulang dapat memicu anticipatory fear dan kontraksi refleks dasar panggul; kontraksi meningkatkan nyeri saat penetrasi dan memperkuat siklus takut-nyeri-menghindar. Sensitisasi perifer/sentral dapat berperan pada nyeri kronik.',
    pemeriksaanFisik: ['Riwayat seksual dilakukan dengan consent dan tanpa menghakimi; pemeriksaan genital/pelvis hanya bila disetujui dan diperlukan, menilai mukosa, lesi, infeksi, nyeri tekan serta tonus dasar panggul.'],
    penunjang: ['Tidak ada satu tes diagnostik; pemeriksaan infeksi, pencitraan pelvis, atau evaluasi lain dilakukan berdasarkan gejala dan temuan klinis.'],
    diagnosis: ['Diagnosis memerlukan gejala menetap/berulang yang menimbulkan distress bermakna dan tidak lebih baik dijelaskan oleh kondisi medis/obstetri, kekerasan, atau faktor lain yang perlu ditangani terlebih dahulu.'],
    diagnosisBanding: ['Vulvovaginitis', 'Vulvodynia', 'Endometriosis', 'Atrofi genitourinaria', 'Penyakit radang panggul', 'Kelainan dermatologis genital'],
    tatalaksana: [
      'Tangani penyebab organik spesifik bila ditemukan dan hentikan faktor pencetus yang dapat dimodifikasi',
      'Pendekatan multidisiplin dapat mencakup edukasi, pelumas/moisturizer, terapi dasar panggul, psikoterapi/sex therapy berbasis bukti, serta terapi hormonal lokal pada indikasi tertentu',
      'Hindari penetrasi/pemeriksaan yang dipaksakan; keselamatan dan consent adalah bagian terapi',
    ],
    komplikasi: ['Nyeri kronik', 'Gangguan relasi dan fungsi seksual', 'Kecemasan/depresi', 'Penghindaran pemeriksaan kesehatan'],
    edukasi: ['Nyeri seksual bukan diagnosis tunggal; keberhasilan terapi bergantung pada identifikasi mekanisme yang dominan dan tujuan pasien.'],
    prognosis: 'Banyak pasien membaik dengan pendekatan multimodal dan bertahap, tetapi durasi terapi bervariasi terutama bila nyeri telah lama atau ada beberapa penyebab sekaligus.',
    referensi: ['SKDI2012', 'DSM5TR2022', 'WILLIAMSOB2022'],
  },

  "Diabetes melitus tipe lain (intoleransi glukosa akibat penyakit lain atau obat-obatan)": {
    definisi:
      'Hiperglikemia/diabetes yang disebabkan kondisi spesifik selain DM tipe 1, tipe 2, atau gestasional, misalnya penyakit pankreas eksokrin, endokrinopati, sindrom genetik, atau obat seperti glukokortikoid.',
    etiologi:
      'Pankreatitis kronik/pankreatektomi, hemochromatosis atau cystic fibrosis; Cushing, akromegali, feokromositoma; diabetes monogenik; serta obat seperti glukokortikoid, beberapa antipsikotik, terapi imun tertentu dan agen lain yang mengganggu sekresi/aksi insulin.',
    patofisiologi:
      'Mekanisme bergantung penyebab: kehilangan massa sel beta, resistensi insulin karena hormon kontra-regulasi, toksisitas obat pada sel beta, atau gangguan genetik sensor/secretion insulin. Karena mekanismenya berbeda, klasifikasi etiologi dapat mengubah pilihan terapi.',
    faktorRisiko: ['Penyakit pankreas', 'Endokrinopati', 'Riwayat keluarga diabetes monogenik', 'Paparan obat diabetogenik', 'Transplantasi/terapi imunosupresif tertentu'],
    penunjang: ['Gunakan kriteria glikemik standar untuk menegakkan diabetes; evaluasi temporal obat, penyakit pankreas/endokrin, C-peptide, autoantibodi atau tes genetik hanya bila indikasi klinis mendukung.'],
    diagnosis: ['Konfirmasi hiperglikemia dengan kriteria diabetes yang berlaku lalu dokumentasikan penyebab spesifik; jangan otomatis mengklasifikasikan sebagai tipe 2.'],
    diagnosisBanding: ['Diabetes melitus tipe 1', 'Diabetes melitus tipe 2', 'LADA', 'Diabetes gestasional', 'Stress hyperglycemia akut'],
    tatalaksana: [
      'Tangani penyebab bila dapat dimodifikasi dan tinjau kebutuhan obat pencetus bersama dokter yang meresepkan',
      'Terapi penurun glukosa dipilih berdasarkan mekanisme, berat hiperglikemia, komorbid, fungsi ginjal/hati dan risiko hipoglikemia; insulin sering diperlukan pada defisiensi insulin berat atau hiperglikemia simptomatik',
    ],
    komplikasi: ['Komplikasi mikrovaskular dan makrovaskular bila hiperglikemia kronik', 'Hipoglikemia terkait terapi', 'Malnutrisi/malabsorpsi pada penyakit pankreas tertentu'],
    edukasi: ['Nama penyebab harus tercatat karena memengaruhi terapi dan skrining penyakit dasarnya.'],
    prognosis: 'Bergantung penyebab; sebagian membaik bila pencetus berhenti, sedangkan kerusakan pankreas/genetik dapat memerlukan terapi jangka panjang.',
    referensi: ['SKDI2012', 'ADA2024', 'PERKENI2021', 'HARRISON2022'],
  },

  "Gangguan pembekuan darah (hemofilia, Von Willebrand's disease)": {
    definisi:
      'Baris payung gangguan hemostasis herediter: hemofilia A/B terutama defisiensi faktor VIII/IX dan cenderung menimbulkan perdarahan jaringan dalam/sendi; von Willebrand disease adalah gangguan kuantitas/fungsi vWF yang mengganggu adhesi trombosit dan stabilitas faktor VIII, sering menimbulkan perdarahan mukokutan.',
    etiologi:
      'Hemofilia A/B umumnya terkait X; von Willebrand disease biasanya autosomal dengan variasi tipe. Gangguan didapat juga ada tetapi harus dibedakan dari bentuk herediter.',
    patofisiologi:
      'Defisiensi faktor koagulasi mengganggu pembentukan fibrin stabil, sedangkan kekurangan/disfungsi vWF mengganggu adhesi trombosit pada cedera vaskular dan dapat menurunkan faktor VIII.',
    faktorRisiko: ['Riwayat keluarga perdarahan', 'Laki-laki dari garis maternal pada hemofilia', 'Tindakan gigi/operasi tanpa profilaksis yang tepat'],
    pemeriksaanFisik: ['Cari hemarthrosis, hematoma otot, perdarahan mukosa, epistaksis, menoragia, ekimosis, dan tanda perdarahan intrakranial/retroperitoneal.'],
    penunjang: ['Darah lengkap dan PT/aPTT sebagai skrining; assay faktor VIII/IX untuk hemofilia; vWF antigen/activity dan faktor VIII untuk vWD, dengan interpretasi hematologi karena kadar vWF dipengaruhi stres, inflamasi dan faktor biologis lain.'],
    diagnosis: ['Diagnosis spesifik berdasarkan pola perdarahan, riwayat keluarga dan pengujian faktor/vWF; hasil skrining koagulasi normal tidak selalu menyingkirkan vWD.'],
    diagnosisBanding: ['Trombositopenia', 'Disfungsi trombosit', 'Penyakit hati', 'Defisiensi vitamin K', 'Disseminated intravascular coagulation'],
    tatalaksana: [
      'Hemofilia: penggantian faktor VIII/IX atau terapi non-factor sesuai tipe dan akses; terapi profilaksis modern bertujuan mencegah hemarthrosis dan kerusakan sendi',
      'vWD: desmopressin pada tipe/pasien yang responsif atau konsentrat vWF/faktor VIII pada kondisi tertentu; antifibrinolitik membantu perdarahan mukosa',
      'Perdarahan mengancam nyawa membutuhkan terapi segera dan konsultasi hematologi; hindari obat yang memperburuk hemostasis tanpa indikasi kuat',
    ],
    komplikasi: ['Hemarthrosis kronik dan artropati', 'Perdarahan intrakranial', 'Anemia', 'Inhibitor terhadap faktor pada hemofilia', 'Perdarahan perioperatif'],
    edukasi: ['Pasien perlu kartu/identitas gangguan perdarahan dan rencana sebelum operasi, prosedur gigi, trauma atau kehamilan.'],
    prognosis: 'Dengan profilaksis dan terapi faktor/non-factor yang tepat, harapan hidup dan fungsi dapat mendekati normal; inhibitor dan akses terapi tetap menentukan luaran.',
    referensi: ['SKDI2012', 'HOFFBRAND2019', 'HARRISON2022'],
  },

  "Artritis, gout": {
    definisi:
      'Baris payung untuk radang sendi berbagai sebab; gout adalah artritis kristal akibat deposisi kristal monosodium urate. Artritis septik, rheumatoid arthritis, osteoarthritis inflamatorik, dan gout membutuhkan pendekatan berbeda dan tidak berbagi satu kode ICD-11.',
    etiologi:
      'Gout timbul dari hiperurisemia yang memungkinkan kristal urat mengendap; hiperurisemia paling sering karena ekskresi urat ginjal yang rendah dan dipengaruhi fungsi ginjal, genetik, obat tertentu, alkohol serta faktor metabolik.',
    patofisiologi:
      'Kristal monosodium urate mengaktifkan inflammasome dan respons neutrofil sehingga timbul serangan monoartritis sangat nyeri. Paparan kronik dapat membentuk tofi dan erosi. Pada artritis lain, mekanisme dapat infeksi, autoimun, degeneratif, atau kristal selain urat.',
    pemeriksaanFisik: ['Nilai jumlah sendi, onset, panas/kemerahan, efusi, rentang gerak, tofi, demam, serta tanda sepsis; monoartritis akut harus dianggap berpotensi septik sampai dinilai.'],
    penunjang: ['Aspirasi cairan sendi dengan hitung sel, Gram/kultur dan analisis kristal bila diagnosis tidak pasti atau artritis septik mungkin; kadar asam urat membantu konteks tetapi dapat normal saat serangan akut.'],
    diagnosis: ['Gout pasti didukung identifikasi kristal monosodium urate berbentuk jarum dengan birefringence negatif; pada monoartritis akut, kultur diperlukan bila infeksi dicurigai.'],
    diagnosisBanding: ['Artritis septik', 'Pseudogout/CPPD', 'Rheumatoid arthritis', 'Osteoarthritis', 'Trauma'],
    tatalaksana: [
      'Serangan gout akut: antiinflamasi seperti NSAID, kolkisin, atau kortikosteroid dipilih berdasarkan komorbid dan kontraindikasi',
      'Terapi penurun urat jangka panjang diberikan pada indikasi yang sesuai dengan target urat dan profilaksis flare saat inisiasi; modifikasi gaya hidup melengkapi, bukan menggantikan terapi bila indikasi obat kuat',
      'Artritis septik memerlukan antibiotik dan drainase segera dan tidak boleh ditunda karena dugaan gout',
    ],
    komplikasi: ['Tophi', 'Kerusakan sendi kronik', 'Batu urat', 'Penyakit ginjal', 'Sepsis/kerusakan sendi cepat bila artritis septik terlewat'],
    edukasi: ['Gout bukan sekadar akibat makanan; faktor genetik dan ekskresi ginjal berperan besar.'],
    prognosis: 'Gout dapat dikontrol sangat baik bila kadar urat dipertahankan pada target; flare berulang dan tofi menandakan kontrol jangka panjang belum adekuat.',
    referensi: ['SKDI2012', 'ACRGOUT2020', 'ACREULAR2010', 'HARRISON2022'],
  },

  "Kelainan bentuk tulang belakang (kifosis, skoliosis, lordosis)": {
    definisi:
      'Kelainan kurvatura spinal: skoliosis adalah deviasi lateral dengan rotasi vertebra, kifosis adalah peningkatan kurva sagital torakal, dan hiperlordosis adalah peningkatan kurva lordotik. Istilah deskriptif ini memiliki banyak etiologi dan kode berbeda.',
    etiologi:
      'Skoliosis idiopatik remaja paling umum; penyebab lain kongenital, neuromuskular, degeneratif atau sindromik. Kifosis dapat postural, Scheuermann, kongenital, osteoporosis/fraktur atau infeksi. Hiperlordosis dapat postural, terkait kontraktur panggul, spondylolisthesis, neuromuskular atau kompensasi deformitas lain.',
    patofisiologi:
      'Pertumbuhan asimetris dan rotasi vertebra dapat memperberat deformitas. Kurva besar dapat mengubah mekanika batang tubuh dan pada deformitas torakal berat mengurangi volume paru; etiologi neurologis/kongenital mempunyai pola progresi berbeda.',
    pemeriksaanFisik: ['Inspeksi dari depan/samping/belakang, shoulder/pelvic asymmetry, Adam forward-bend test, keseimbangan sagittal/coronal, panjang tungkai, pemeriksaan neurologis dan tanda sindromik.'],
    penunjang: ['Foto radiografi berdiri seluruh tulang belakang bila deformitas struktural dicurigai; ukur Cobb angle untuk skoliosis. MRI bila ada defisit neurologis, nyeri atipikal, onset sangat dini, atau kecurigaan kelainan medula.'],
    diagnosis: ['Tentukan jenis kurva, besar sudut, maturitas skeletal, progresi, gejala dan etiologi; skoliosis struktural umumnya didefinisikan berdasarkan Cobb angle dan rotasi vertebra.'],
    diagnosisBanding: ['Postural asymmetry', 'Perbedaan panjang tungkai', 'Spondylolisthesis', 'Fraktur kompresi', 'Kelainan neuromuskular'],
    tatalaksana: [
      'Observasi, latihan/fisioterapi, brace atau operasi dipilih berdasarkan etiologi, besar/progresi kurva, maturitas, gejala dan dampak fungsi',
      'Tangani penyebab seperti osteoporosis, infeksi atau penyakit neuromuskular bila ada; tidak semua kelengkungan memerlukan koreksi operasi',
    ],
    komplikasi: ['Nyeri dan gangguan fungsi', 'Progresi deformitas', 'Restriksi respiratorik pada kurva berat', 'Defisit neurologis pada etiologi tertentu', 'Dampak psikososial'],
    edukasi: ['Postur buruk tidak menjelaskan semua skoliosis struktural; serial measurement lebih bermakna daripada satu foto saja pada anak yang sedang tumbuh.'],
    prognosis: 'Ditentukan etiologi, besar kurva dan pertumbuhan tersisa; sebagian besar skoliosis idiopatik ringan tidak menimbulkan disabilitas berat.',
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },

  "Malformasi kongenital (genovarum, genovalgum, club foot, pes planus)": {
    definisi:
      'Baris payung deformitas ekstremitas bawah anak. Genu varum/valgum dan pes planus dapat merupakan variasi fisiologis sesuai usia, sedangkan club foot (congenital talipes equinovarus) adalah deformitas kompleks kaki yang memerlukan penanganan dini. Masing-masing merupakan entitas ICD-11 tersendiri.',
    etiologi:
      'Sebagian deformitas merupakan variasi perkembangan; penyebab patologis mencakup kelainan kongenital, neuromuskular, skeletal dysplasia, Blount disease, rickets, trauma growth plate, dan kondisi sindromik. Club foot biasanya idiopatik tetapi dapat terkait kelainan neuromuskular/sindrom.',
    patofisiologi:
      'Alignment tungkai berubah seiring pertumbuhan normal. Deformitas yang menetap, asimetris atau progresif dapat mengubah distribusi beban dan gait. Club foot melibatkan equinus, varus, adductus dan cavus dengan perubahan jaringan lunak/tulang yang akan makin kaku bila tidak dikoreksi dini.',
    pemeriksaanFisik: ['Nilai usia dan milestone, simetri, mechanical axis, jarak interkondiler/intermaleolar, fleksibilitas kaki, hindfoot alignment, lengkung saat berdiri/jinjit, gait, panjang tungkai, rotasi panggul/tibia dan pemeriksaan neurologis.'],
    penunjang: ['Banyak variasi fisiologis tidak memerlukan pencitraan; radiografi/laboratorium dipilih bila deformitas berat, asimetris, progresif, nyeri, pendek, atau rickets/kelainan skeletal dicurigai.'],
    diagnosis: ['Bedakan variasi fisiologis dari deformitas patologis berdasarkan usia, simetri, progresi dan temuan klinis; club foot didiagnosis klinis dan perlu dinilai kekakuan serta keterlibatan sindromik.'],
    diagnosisBanding: ['Blount disease', 'Rickets', 'Skeletal dysplasia', 'Cerebral palsy/neuromuscular disease', 'Tarsal coalition pada flatfoot kaku'],
    tatalaksana: [
      'Variasi fisiologis umumnya observasi dan reassurance dengan follow-up bila perlu; terapi penyebab dilakukan pada rickets atau penyakit dasar',
      'Club foot idiopatik ditangani sedini mungkin dengan metode Ponseti berupa manipulasi dan serial casting, sering disertai tenotomi Achilles dan dilanjutkan brace untuk mencegah relaps',
      'Operasi dipertimbangkan pada deformitas patologis terpilih berdasarkan usia, progresi dan gangguan fungsi',
    ],
    komplikasi: ['Gait abnormal dan nyeri', 'Deformitas menetap/progresif', 'Kekakuan', 'Relaps club foot bila brace tidak adekuat', 'Degenerasi sendi jangka panjang pada deformitas berat'],
    edukasi: ['Sepatu khusus tidak diperlukan untuk variasi fisiologis biasa; red flags adalah asimetri, nyeri, perburukan, gangguan tumbuh, atau deformitas kaku.'],
    prognosis: 'Sangat baik untuk variasi fisiologis dan club foot yang ditangani dini dengan program yang dipatuhi; prognosis lebih bergantung pada penyakit dasar pada deformitas sindromik/neuromuskular.',
    referensi: ['SKDI2012', 'APLEY2018', 'CAMPBELLORTHO2021'],
  },
}

export const SKDI_DISEASE_SUPPLEMENT_KEYS: ReadonlySet<string> = new Set(
  Object.keys(SKDI_DISEASE_NOTES_SUPPLEMENT),
)
