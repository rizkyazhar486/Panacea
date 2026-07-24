// Quick-reference clinical notes for the full SKDI 2012 disease directory
// (src/lib/skdiDiseaseList.ts), covering diseases beyond the 143-case OSCE
// practical exam bank (which has full station notes in osceStationNotes.ts).
// Kept intentionally concise (definisi/diagnosis/tatalaksana) given the ~600+
// entry volume — cross-check current dosing/guidelines before clinical use.

export interface SkdiDiseaseNote {
  definisi: string
  diagnosis: string[]
  tatalaksana: string[]
}

export const SKDI_DISEASE_NOTES: Record<string, SkdiDiseaseNote> = {
  // ─── Forensik & Medikolegal ──────────────────────────────────────────────
  'Kekerasan tumpul': {
    definisi: 'Cedera akibat benda tumpul (memar, luka lecet, luka robek) tanpa terputusnya kontinuitas kulit secara tajam.',
    diagnosis: [
      'Deskripsi luka: lokasi, bentuk, ukuran, warna (perkiraan usia luka dari perubahan warna memar), tepi luka tidak rata dengan jembatan jaringan (vibrio/bridging) — khas luka robek akibat benda tumpul',
      'Bedakan luka lecet tekan, geser, dan luka memar berdasarkan mekanisme',
      'Visum et repertum mendeskripsikan derajat luka sesuai KUHP (ringan/sedang/berat) berdasarkan dampak fungsional, bukan hanya ukuran',
    ],
    tatalaksana: [
      'Tatalaksana medis sesuai jenis dan derajat cedera (luka, fraktur, organ dalam)',
      'Dokumentasi forensik: foto, pengukuran, deskripsi tertulis rinci sebelum/selama tindakan medis',
      'Pembuatan visum et repertum atas permintaan resmi penyidik',
    ],
  },
  'Kekerasan tajam': {
    definisi: 'Cedera akibat benda bermata tajam/berujung runcing (luka iris, luka tusuk, luka bacok) dengan tepi luka rata.',
    diagnosis: [
      'Luka iris: panjang > dalam, tepi rata, tidak ada jembatan jaringan',
      'Luka tusuk: dalam > panjang permukaan, dapat menembus rongga tubuh',
      'Luka bacok: kombinasi sifat tajam dan tumpul, biasanya luas dan dalam akibat benda besar/berat',
      'Perkirakan arah, jumlah, dan kemungkinan mekanisme (self-inflicted vs. akibat orang lain) dari pola luka',
    ],
    tatalaksana: [
      'Tatalaksana kegawatdaruratan bila mengenai organ vital/pembuluh darah besar',
      'Dokumentasi forensik lengkap sebelum debridement/penjahitan bila memungkinkan',
      'Visum et repertum menjelaskan jenis kekerasan dan derajat luka',
    ],
  },
  'Trauma kimia': {
    definisi: 'Cedera jaringan akibat kontak dengan bahan kimia korosif (asam/basa), dapat mengenai kulit, mata, atau saluran cerna.',
    diagnosis: [
      'Riwayat kontak dengan zat kimia spesifik (identifikasi jenis asam/basa bila mungkin)',
      'Luka bakar kimia: nekrosis koagulasi (asam) atau likuefaksi (basa, lebih dalam dan progresif)',
      'Pada tertelan: nilai risiko cedera esofagus/lambung, endoskopi dini bila indikasi',
    ],
    tatalaksana: [
      'Irigasi segera dengan air mengalir banyak (kecuali kontraindikasi spesifik zat tertentu)',
      'Netralisasi tidak direkomendasikan rutin (risiko reaksi eksotermik memperberat cedera)',
      'Rujuk untuk evaluasi lebih lanjut sesuai organ terkena (mata: oftalmologi; esofagus: endoskopi)',
    ],
  },
  'Luka tembak': {
    definisi: 'Cedera akibat proyektil senjata api, dengan karakteristik luka masuk dan keluar yang khas untuk rekonstruksi forensik.',
    diagnosis: [
      'Luka tembak masuk: kelim lecet, kelim tato/jelaga (jarak dekat), kelim api (jarak sangat dekat/kontak)',
      'Luka tembak keluar: umumnya lebih besar, tepi tidak rata, tanpa kelim lecet',
      'Estimasi jarak tembak dari pola residu mesiu di sekitar luka',
    ],
    tatalaksana: [
      'Tatalaksana kegawatdaruratan trauma (ATLS) sesuai organ yang terkena',
      'Dokumentasi forensik sebelum tindakan bedah bila kondisi pasien memungkinkan',
      'Pelaporan wajib ke pihak berwajib (kasus forensik/pidana)',
    ],
  },
  'Luka listrik dan petir': {
    definisi: 'Cedera akibat aliran listrik (arus rumah tangga/industri) atau sambaran petir, dapat menyebabkan luka lokal maupun kerusakan sistemik.',
    diagnosis: [
      'Luka listrik: titik masuk dan keluar arus (electrical mark), dapat tampak minimal di permukaan meski kerusakan jaringan dalam luas',
      'Sambaran petir: pola Lichtenberg (percabangan seperti pakis) pada kulit, dapat disertai ruptur gendang telinga, katarak',
      'Waspada aritmia jantung, rhabdomiolisis, dan cedera organ dalam meski luka kulit tampak ringan',
    ],
    tatalaksana: [
      'Amankan sumber listrik sebelum pertolongan (safety pertama)',
      'Monitor EKG dan jantung (risiko aritmia terutama arus AC)',
      'Resusitasi cairan bila rhabdomiolisis (cegah gagal ginjal akut)',
      'Tatalaksana luka bakar lokal sesuai derajat',
    ],
  },
  'Barotrauma': {
    definisi: 'Cedera jaringan akibat perubahan tekanan lingkungan mendadak (menyelam, penerbangan), sering mengenai telinga tengah, sinus, atau paru.',
    diagnosis: [
      'Nyeri telinga, tuli konduktif, kadang ruptur gendang telinga pada barotrauma telinga',
      'Nyeri wajah/sinus pada barotrauma sinus',
      'Barotrauma paru (dekompresi): nyeri dada, sesak, kemungkinan pneumotoraks/emboli udara pada penyelam',
    ],
    tatalaksana: [
      'Barotrauma telinga/sinus ringan: analgesik, dekongestan, hindari penyelaman/penerbangan hingga sembuh',
      'Barotrauma paru berat (emboli udara/dekompresi): oksigen 100%, rekompresi hiperbarik segera',
      'Rujuk THT bila ruptur membran timpani menetap',
    ],
  },
  'Trauma suhu': {
    definisi: 'Cedera jaringan akibat paparan suhu ekstrem, meliputi luka bakar (panas) dan frostbite/hipotermia (dingin).',
    diagnosis: [
      'Luka bakar: derajat I (epidermis), II (dermis, bulla), III (full-thickness); hitung luas dengan rule of nine',
      'Frostbite: pucat, mati rasa, kemudian nyeri hebat saat rewarming, bula hemoragik pada derajat berat',
      'Hipotermia: suhu inti <35°C, bradikardia, penurunan kesadaran progresif',
    ],
    tatalaksana: [
      'Luka bakar: pendinginan air mengalir (bukan es), resusitasi cairan formula Parkland bila luas >20%, rujuk pusat luka bakar bila berat',
      'Frostbite: rewarming cepat air hangat 37-39°C, hindari gosokan/pemanasan langsung api',
      'Hipotermia: rewarming bertahap (pasif eksternal ringan, aktif internal pada berat), hindari pergerakan kasar (risiko aritmia)',
    ],
  },
  'Asfiksia': {
    definisi: 'Kondisi kekurangan oksigen jaringan akibat gangguan jalan napas/pertukaran gas, penyebab kematian penting dalam kasus forensik (pencekikan, penjeratan, pembekapan).',
    diagnosis: [
      'Tanda umum asfiksia: sianosis, petekie konjungtiva/wajah, kongesti dan edema wajah',
      'Tanda spesifik sesuai mekanisme: jejas jerat (penjeratan/gantung), jejas kuku/tangan (pencekikan manual)',
      'Otopsi: kongesti viseral, perdarahan petekie pleura/perikardium (tardieu spots)',
    ],
    tatalaksana: [
      'Bila korban masih hidup: bebaskan jalan napas segera, oksigenasi, resusitasi sesuai kondisi',
      'Kasus forensik (korban meninggal): pemeriksaan luar dan dalam sistematis, dokumentasi jejas untuk rekonstruksi mekanisme kematian',
    ],
  },
  'Tenggelam': {
    definisi: 'Asfiksia akibat terendamnya jalan napas dalam cairan, dapat fatal atau non-fatal (near-drowning) tergantung durasi dan pertolongan.',
    diagnosis: [
      'Riwayat terendam air, ditemukan tidak sadar di air/dekat air',
      'Otopsi: buih halus di jalan napas (jamur buih), paru-paru membesar dan berat (paru cadaver), diatom dalam jaringan pada kasus tertentu',
      'Bedakan tenggelam basah (aspirasi cairan) vs kering (spasme laring)',
    ],
    tatalaksana: [
      'Resusitasi jantung paru segera bila korban ditemukan, prioritaskan ventilasi (hipoksia adalah masalah utama)',
      'Rujuk ICU untuk pemantauan ARDS/edema paru sekunder meski awalnya tampak stabil',
      'Kasus forensik: pemeriksaan lengkap untuk konfirmasi tenggelam vs penyebab kematian lain sebelum masuk air',
    ],
  },
  'Pembunuhan anak sendiri': {
    definisi: 'Istilah forensik (dan pasal KUHP) untuk pembunuhan bayi baru lahir oleh ibu kandungnya sendiri, umumnya dalam kondisi psikologis tertekan pasca melahirkan.',
    diagnosis: [
      'Pemeriksaan forensik menentukan: apakah bayi lahir hidup (uji apung paru/docimasia pulmonum), viabilitas (cukup bulan), dan penyebab kematian',
      'Cari tanda kekerasan pada bayi dan bukti persalinan pada ibu (tersangka)',
      'Aspek medikolegal: dibedakan dari kematian janin dalam kandungan atau kematian alamiah bayi',
    ],
    tatalaksana: [
      'Bukan kondisi klinis yang ditatalaksana medis — peran dokter adalah pemeriksaan forensik objektif dan pembuatan visum et repertum',
      'Rujuk ibu untuk evaluasi dan dukungan psikiatri (sering terkait gangguan psikologis pascapersalinan)',
    ],
  },
  'Pengguguran kandungan': {
    definisi: 'Aborsi/abortus provokatus — penghentian kehamilan secara sengaja, aspek forensik menilai legalitas (indikasi medis vs kriminal) dan komplikasinya.',
    diagnosis: [
      'Pemeriksaan tanda kehamilan sebelumnya dan bukti tindakan pengguguran (instrumentasi, obat)',
      'Identifikasi komplikasi: perdarahan, infeksi, perforasi uterus',
      'Aspek hukum: bedakan abortus provokatus medisinalis (indikasi medis, legal dengan syarat) dari abortus provokatus kriminalis',
    ],
    tatalaksana: [
      'Tatalaksana komplikasi medis (kuretase, antibiotik, resusitasi bila perdarahan/sepsis)',
      'Pelaporan sesuai ketentuan hukum bila dicurigai tindak pidana',
    ],
  },
  'Kematian mendadak': {
    definisi: 'Kematian yang terjadi tiba-tiba dan tidak terduga pada individu yang tampak sehat/tanpa penyakit terminal diketahui sebelumnya, sering memerlukan otopsi untuk penyebab.',
    diagnosis: [
      'Penyebab tersering: penyakit jantung koroner/aritmia mendadak, emboli paru, perdarahan intrakranial',
      'Otopsi forensik menentukan penyebab kematian alamiah vs tidak alamiah',
      'Perlu anamnesis riwayat penyakit sebelumnya dari keluarga dan kronologi kejadian',
    ],
    tatalaksana: [
      'Bukan kondisi yang ditatalaksana — fokus pada penentuan sebab kematian yang akurat untuk kepentingan medikolegal dan keluarga',
      'Visum et repertum jenazah sesuai permintaan penyidik',
    ],
  },
  'Toksikologi forensik': {
    definisi: 'Cabang forensik yang mempelajari identifikasi zat racun/obat dalam tubuh untuk menentukan peran zat tersebut dalam sakit/kematian.',
    diagnosis: [
      'Pengambilan sampel forensik: darah, urin, isi lambung, jaringan hati/ginjal untuk analisis toksikologi',
      'Korelasikan gejala klinis (bila korban sempat hidup) dengan pola keracunan spesifik (organofosfat, sianida, alkohol, NAPZA)',
      'Interpretasi kadar zat mempertimbangkan post-mortem redistribution (kadar dapat berubah setelah kematian)',
    ],
    tatalaksana: [
      'Bila korban hidup: tatalaksana keracunan sesuai zat (antidot spesifik, dekontaminasi, suportif)',
      'Kasus forensik: koordinasi dengan laboratorium forensik untuk analisis toksikologi lengkap sebagai bagian visum',
    ],
  },

  // ─── Endokrin & Metabolik ────────────────────────────────────────────────
  'Diabetes melitus tipe 1': {
    definisi: 'DM akibat destruksi autoimun sel beta pankreas sehingga defisiensi insulin absolut, umumnya onset usia muda.',
    diagnosis: [
      'Poliuria, polidipsia, penurunan BB cepat, sering onset dengan ketoasidosis diabetikum',
      'GDP ≥126 mg/dL atau GDS ≥200 mg/dL + gejala klasik; C-peptide rendah, autoantibodi (anti-GAD, anti-islet) mendukung',
    ],
    tatalaksana: [
      'Terapi insulin wajib seumur hidup (basal-bolus), tidak responsif terhadap OAD oral',
      'Edukasi pemantauan gula darah mandiri, pengenalan dan tatalaksana hipoglikemia',
      'Skrining komplikasi kronik rutin (mata, ginjal, kaki) sejak dini',
    ],
  },
  'Diabetes melitus tipe 2': {
    definisi: 'DM akibat resistensi insulin dengan defisiensi insulin relatif, terkait obesitas dan gaya hidup, onset biasanya usia dewasa.',
    diagnosis: [
      'GDP ≥126 mg/dL, GD 2 jam PP (TTGO) ≥200 mg/dL, GDS ≥200 mg/dL + gejala, atau HbA1c ≥6,5%',
      'Sering asimtomatik, ditemukan skrining rutin atau saat komplikasi muncul',
    ],
    tatalaksana: [
      'Modifikasi gaya hidup + metformin lini pertama, kombinasi OAD/insulin bertahap sesuai target HbA1c',
      'Skrining dan tatalaksana komorbid kardiovaskular (hipertensi, dislipidemia)',
    ],
  },
  'Ketoasidosis diabetikum nonketotik': {
    definisi: 'Merujuk pada Hyperosmolar Hyperglycemic State (HHS) — dekompensasi hiperglikemik berat tanpa ketosis signifikan, khas pada DM tipe 2 lansia.',
    diagnosis: [
      'GDS sangat tinggi (>600 mg/dL), osmolaritas serum >320 mOsm/kg, keton minimal/negatif, pH >7,3',
      'Dehidrasi berat dan penurunan kesadaran progresif, sering dengan faktor pencetus infeksi',
    ],
    tatalaksana: [
      'Resusitasi cairan agresif sebagai prioritas utama, insulin drip setelah cairan dan kalium adekuat',
      'Cari dan atasi faktor pencetus, monitor status neurologis ketat',
    ],
  },
  'Hiperglikemi hiperosmolar': {
    definisi: 'Hyperosmolar Hyperglycemic State (HHS) — komplikasi akut DM tipe 2 dengan hiperglikemia ekstrem dan dehidrasi berat tanpa ketoasidosis bermakna.',
    diagnosis: ['GDS >600 mg/dL, osmolaritas serum efektif >320 mOsm/kg, keton negatif/minimal, penurunan kesadaran'],
    tatalaksana: ['Resusitasi cairan kristaloid bertahap (defisit besar, koreksi 24-48 jam), insulin drip setelah resusitasi awal, koreksi kalium'],
  },
  'Hipoglikemia ringan': {
    definisi: 'Penurunan gula darah <70 mg/dL dengan gejala otonom (berkeringat, gemetar, jantung berdebar) tanpa gangguan kesadaran berat.',
    diagnosis: ['Gejala adrenergik + GDS rendah, membaik setelah asupan glukosa (whipple triad)'],
    tatalaksana: ['Rule of 15: 15g karbohidrat cepat serap oral, ulangi cek GDS 15 menit, edukasi penyesuaian dosis obat DM'],
  },
  'Hipoglikemia berat': {
    definisi: 'Hipoglikemia dengan gangguan kesadaran/kejang, memerlukan bantuan orang lain untuk penanganan — kegawatdaruratan.',
    diagnosis: ['GDS sangat rendah disertai penurunan kesadaran, kejang, atau perilaku abnormal'],
    tatalaksana: ['Dekstrosa 40% IV bolus (bila akses IV ada) atau glukagon IM bila tidak ada akses IV, lanjut infus dekstrosa maintenance, cari penyebab (overdosis insulin/sulfonilurea)'],
  },
  'Diabetes insipidus': {
    definisi: 'Gangguan defisiensi ADH (sentral) atau resistensi ginjal terhadap ADH (nefrogenik) menyebabkan poliuria masif dan polidipsia.',
    diagnosis: ['Poliuria >3L/hari dengan urin sangat encer (osmolaritas rendah), water deprivation test membedakan sentral vs nefrogenik'],
    tatalaksana: ['Sentral: desmopressin (DDAVP); Nefrogenik: atasi penyebab dasar, diuretik tiazid paradoksal, restriksi garam'],
  },
  'Akromegali, gigantisme': {
    definisi: 'Kelebihan hormon pertumbuhan (GH) kronik akibat adenoma hipofisis — gigantisme bila terjadi sebelum lempeng epifisis menutup, akromegali bila sesudahnya.',
    diagnosis: ['Pembesaran tangan/kaki/wajah progresif (akromegali), pertumbuhan tinggi berlebihan (gigantisme); IGF-1 meningkat, GH tidak tersupresi pada OGTT'],
    tatalaksana: ['Reseksi transsfenoidal adenoma hipofisis sebagai lini pertama, analog somatostatin/pegvisomant bila residual/tidak operable'],
  },
  'Defisiensi hormon pertumbuhan': {
    definisi: 'Kekurangan GH menyebabkan perawakan pendek pada anak atau gejala metabolik pada dewasa.',
    diagnosis: ['Perawakan pendek dengan kecepatan tumbuh melambat pada anak; stimulation test GH rendah'],
    tatalaksana: ['Terapi GH rekombinan pada anak dengan defisiensi terbukti, dipantau kecepatan tumbuh dan usia tulang'],
  },
  'Hiperparatiroid': {
    definisi: 'Kelebihan hormon paratiroid (PTH) menyebabkan hiperkalsemia, tersering akibat adenoma paratiroid.',
    diagnosis: ['Gejala hiperkalsemia ("stones, bones, groans, psychiatric overtones"), PTH dan kalsium serum meningkat bersamaan'],
    tatalaksana: ['Paratiroidektomi pada kasus simtomatik/kalsium sangat tinggi, hidrasi dan bifosfonat untuk kontrol hiperkalsemia akut'],
  },
  'Hipoparatiroid': {
    definisi: 'Defisiensi PTH menyebabkan hipokalsemia, sering pasca tiroidektomi/paratiroidektomi.',
    diagnosis: ['Gejala hipokalsemia: parestesia perioral, tetani, Chvostek/Trousseau sign positif; kalsium rendah, PTH rendah/tidak sesuai'],
    tatalaksana: ['Kalsium dan vitamin D oral jangka panjang, kalsium glukonas IV pada tetani akut'],
  },
  'Hipertiroid': {
    definisi: 'Kelebihan hormon tiroid menyebabkan hipermetabolisme sistemik, tersering akibat Grave\'s disease.',
    diagnosis: ['Penurunan BB, palpitasi, tremor, intoleransi panas; TSH rendah, FT4/FT3 tinggi'],
    tatalaksana: ['Obat antitiroid (methimazole/PTU), beta-blocker simptomatik, terapi definitif (iodine radioaktif/tiroidektomi) bila relaps'],
  },
  'Tirotoksikosis': {
    definisi: 'Sindrom klinis kelebihan hormon tiroid beredar, dapat akibat hipertiroid primer atau sumber lain (tiroiditis, eksogen).',
    diagnosis: ['Gejala hipermetabolik berat, krisis tiroid (thyroid storm) bila disertai demam tinggi/takikardia berat/penurunan kesadaran'],
    tatalaksana: ['Krisis tiroid: PTU dosis tinggi, iodine (1 jam setelah PTU), beta-blocker, kortikosteroid, tatalaksana suportif ICU'],
  },
  'Hipotiroid': {
    definisi: 'Defisiensi hormon tiroid menyebabkan perlambatan metabolisme sistemik, tersering akibat tiroiditis Hashimoto.',
    diagnosis: ['Lemas, penambahan BB, intoleransi dingin, konstipasi; TSH tinggi, FT4 rendah'],
    tatalaksana: ['Levothyroxine substitusi seumur hidup, titrasi berdasarkan TSH tiap 6-8 minggu'],
  },
  'Goiter': {
    definisi: 'Pembesaran kelenjar tiroid, dapat difus atau nodular, dengan fungsi tiroid normal/hiper/hipo.',
    diagnosis: ['Pembesaran leher anterior teraba/terlihat, USG tiroid dan fungsi tiroid (TSH/FT4) untuk klasifikasi'],
    tatalaksana: ['Suplementasi iodium bila endemik, obat antitiroid/levothyroxine sesuai fungsi, operasi bila kompresi/kosmetik/curiga keganasan'],
  },
  'Tiroiditis': {
    definisi: 'Inflamasi kelenjar tiroid (autoimun, subakut/de Quervain, atau pasca-partum), dapat menyebabkan fase hipertiroid diikuti hipotiroid.',
    diagnosis: ['Nyeri tiroid (subakut) atau tanpa nyeri (Hashimoto/pascapartum), pola TSH/FT4 berubah sesuai fase'],
    tatalaksana: ['Subakut: NSAID/steroid untuk nyeri, beta-blocker fase hipertiroid; Hashimoto: levothyroxine bila hipotiroid menetap'],
  },
  "Cushing's disease": {
    definisi: "Sindrom Cushing akibat kelebihan ACTH dari adenoma hipofisis, menyebabkan hiperkortisolisme kronik.",
    diagnosis: ['Moon face, buffalo hump, striae ungu, obesitas sentral; kortisol bebas urin 24 jam meningkat, tidak tersupresi dexamethasone'],
    tatalaksana: ['Reseksi transsfenoidal adenoma hipofisis sebagai terapi definitif, terapi medikamentosa (ketoconazole) bila tidak operable'],
  },
  'Krisis adrenal': {
    definisi: 'Kegawatdaruratan akibat defisiensi kortisol akut, dapat dipicu stres/infeksi pada pasien insufisiensi adrenal kronik atau penghentian steroid mendadak.',
    diagnosis: ['Hipotensi refrakter, syok, hiponatremia, hiperkalemia, hipoglikemia, nyeri perut/muntah'],
    tatalaksana: ['Hidrokortison IV bolus segera (jangan tunda untuk hasil lab), resusitasi cairan NaCl 0,9% dengan dekstrosa, cari dan atasi pencetus'],
  },
  "Addison's disease": {
    definisi: 'Insufisiensi adrenal primer akibat destruksi korteks adrenal (autoimun tersering), menyebabkan defisiensi kortisol dan aldosteron.',
    diagnosis: ['Lemas, hiperpigmentasi kulit, hipotensi, hiponatremia, hiperkalemia; kortisol pagi rendah, ACTH tinggi'],
    tatalaksana: ['Substitusi hidrokortison dan fludrokortison seumur hidup, edukasi dosis stres saat sakit/prosedur'],
  },
  'Pubertas prekoks': {
    definisi: 'Munculnya tanda pubertas sebelum usia 8 tahun (perempuan) atau 9 tahun (laki-laki).',
    diagnosis: ['Tanda seks sekunder dini, usia tulang lebih maju dari usia kronologis, LH/FSH dan hormon seks meningkat sesuai jenis (sentral vs perifer)'],
    tatalaksana: ['Sentral: agonis GnRH untuk menekan pubertas; cari dan tatalaksana penyebab dasar (tumor SSP, dll)'],
  },
  'Hipogonadisme': {
    definisi: 'Penurunan fungsi gonad menyebabkan defisiensi hormon seks, dapat primer (gonad) atau sekunder (hipotalamus-hipofisis).',
    diagnosis: ['Pubertas terlambat/tidak lengkap, infertilitas, penurunan libido; kadar hormon seks rendah dengan LH/FSH tinggi (primer) atau rendah (sekunder)'],
    tatalaksana: ['Terapi sulih hormon seks sesuai jenis kelamin dan usia, evaluasi penyebab sekunder (tumor hipofisis, dll)'],
  },
  'Prolaktinemia': {
    definisi: 'Hiperprolaktinemia — kelebihan hormon prolaktin, tersering akibat prolaktinoma hipofisis atau obat (antipsikotik).',
    diagnosis: ['Galaktorea, gangguan menstruasi/infertilitas pada wanita, disfungsi ereksi pada pria; prolaktin serum meningkat, MRI hipofisis bila curiga tumor'],
    tatalaksana: ['Agonis dopamin (bromocriptine/cabergoline) lini pertama untuk prolaktinoma, hentikan/ganti obat pencetus bila penyebab medikamentosa'],
  },
  'Adenoma tiroid': {
    definisi: 'Tumor jinak kelenjar tiroid, dapat fungsional (toxic adenoma) atau non-fungsional.',
    diagnosis: ['Nodul tiroid teraba, USG untuk karakteristik nodul, sidik tiroid bila fungsional (hot nodule), FNAB bila curiga keganasan'],
    tatalaksana: ['Observasi bila non-fungsional dan jinak, ablasi/operasi bila toxic adenoma atau kecurigaan keganasan'],
  },
  'Karsinoma tiroid': {
    definisi: 'Keganasan kelenjar tiroid, tersering tipe papiler dengan prognosis baik bila ditatalaksana tepat.',
    diagnosis: ['Nodul tiroid dengan tanda curiga (keras, fiksasi, pembesaran KGB), FNAB untuk konfirmasi sitologi'],
    tatalaksana: ['Tiroidektomi total/near-total, ablasi iodine radioaktif pasca-operasi, supresi TSH dengan levothyroxine, surveilans tiroglobulin'],
  },
  'Malnutrisi energi-protein': {
    definisi: 'Kekurangan asupan energi dan protein kronik, meliputi spektrum marasmus, kwashiorkor, dan campuran keduanya.',
    diagnosis: ['BB/TB rendah, LiLA rendah, edema (kwashiorkor), wasting berat (marasmus)'],
    tatalaksana: ['Tatalaksana 10 langkah WHO gizi buruk, pemberian makan bertahap (F-75 lalu F-100), koreksi mikronutrien'],
  },
  'Defisiensi vitamin': {
    definisi: 'Kekurangan satu atau lebih vitamin esensial, manifestasi bervariasi sesuai jenis vitamin (A: xerophthalmia, B1: beri-beri, C: skorbut, D: rakitis).',
    diagnosis: ['Sesuai jenis vitamin: gangguan penglihatan malam (A), neuropati/gagal jantung (B1), perdarahan gusi (C), deformitas tulang (D)'],
    tatalaksana: ['Suplementasi vitamin spesifik sesuai defisiensi, atasi penyebab dasar (malabsorpsi, diet tidak adekuat)'],
  },
  'Defisiensi mineral': {
    definisi: 'Kekurangan mineral esensial (besi, zink, iodium, kalsium) dengan manifestasi klinis sesuai jenis.',
    diagnosis: ['Sesuai jenis: anemia (besi), gangguan pertumbuhan/imunitas (zink), goiter (iodium), osteopenia (kalsium)'],
    tatalaksana: ['Suplementasi mineral spesifik, perbaikan diet, atasi penyebab dasar'],
  },
  'Dislipidemia': {
    definisi: 'Kelainan profil lipid darah (kolesterol total, LDL, HDL, trigliserida) yang meningkatkan risiko kardiovaskular.',
    diagnosis: ['Profil lipid puasa abnormal sesuai kriteria (LDL/TG tinggi, HDL rendah)'],
    tatalaksana: ['Modifikasi gaya hidup, statin lini pertama sesuai kategori risiko kardiovaskular'],
  },
  'Porfiria': {
    definisi: 'Kelompok gangguan metabolik akibat defek enzim sintesis heme, menyebabkan akumulasi porfirin/prekursornya.',
    diagnosis: ['Nyeri perut hebat, gejala neuropsikiatri, urin berwarna gelap (port-wine) saat serangan akut; porfobilinogen urin meningkat saat serangan'],
    tatalaksana: ['Hindari faktor pencetus (obat porfirinogenik, puasa, alkohol), hematin/glukosa IV pada serangan akut'],
  },
  'Hiperurisemia': {
    definisi: 'Peningkatan kadar asam urat serum, dapat asimtomatik atau berujung gout artritis/batu ginjal.',
    diagnosis: ['Asam urat serum tinggi (>7 mg/dL pria, >6 mg/dL wanita), evaluasi gejala gout bila ada'],
    tatalaksana: ['Modifikasi diet (batasi purin, alkohol), obat penurun urat (allopurinol) bila simtomatik/berulang, tidak rutin diobati bila asimtomatik murni'],
  },
  'Obesitas': {
    definisi: 'Akumulasi lemak tubuh berlebih yang meningkatkan risiko berbagai komorbid metabolik dan kardiovaskular.',
    diagnosis: ['BMI ≥25 kg/m² (kriteria Asia Pasifik), evaluasi komorbid terkait (DM, hipertensi, sleep apnea)'],
    tatalaksana: ['Modifikasi gaya hidup (defisit kalori, aktivitas fisik), farmakoterapi/bedah bariatrik pada kasus berat gagal konservatif'],
  },
  'Sindrom metabolik': {
    definisi: 'Kumpulan faktor risiko kardiometabolik (obesitas sentral, dislipidemia, hipertensi, hiperglikemia) yang meningkatkan risiko DM dan penyakit kardiovaskular.',
    diagnosis: ['Minimal 3 dari 5 kriteria NCEP ATP III modifikasi Asia (lingkar pinggang, TG, HDL, TD, GDP)'],
    tatalaksana: ['Modifikasi gaya hidup multifaktorial sebagai dasar, tatalaksana tiap komponen sesuai indikasi'],
  },
}
