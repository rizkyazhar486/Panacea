// Equipment education: how each machine is actually used, which muscles do the
// work, and an honest comparison against the bodyweight (calisthenic)
// equivalent.
//
// The comparison is the part most gym content gets wrong, in both directions.
// "Machines are useless, only free weights count" and "machines are safer and
// better" are both marketing rather than physiology. What genuinely differs is
// measurable: how much stabiliser work the movement demands, how easily load
// can be added in small steps, how much skill is needed before the exercise is
// productive, and how well it transfers to moving your own body. Each entry
// below states where the machine wins, where the bodyweight version wins, and —
// where it is true — that the difference is small enough not to matter.

export type Group = 'kardio' | 'kekuatan' | 'hyrox' | 'fungsional'

export const GROUP_LABEL: Record<Group, string> = {
  kardio: 'Kardio',
  kekuatan: 'Kekuatan (mesin & beban)',
  hyrox: 'Stasiun Hyrox',
  fungsional: 'Fungsional & bawa beban',
}

export interface Equipment {
  id: string
  name: string
  group: Group
  /** One line on what the machine is for. */
  purpose: string
  /** Step-by-step setup and execution. */
  howTo: string[]
  /** Mistakes that either cause injury or quietly waste the set. */
  mistakes: string[]
  primaryMuscles: string[]
  secondaryMuscles: string[]
  /** Where this genuinely beats the bodyweight alternative. */
  machineWins: string
  /** Where the bodyweight version genuinely beats it. */
  calisthenicWins: string
  /** The nearest bodyweight substitute, for people without equipment. */
  calisthenicAlternative: string
  /** Honest bottom line, including "the difference is small". */
  verdict: string
  hyroxNote?: string
}

export const EQUIPMENT: Equipment[] = [
  // ── Kardio ────────────────────────────────────────────────────────────────
  {
    id: 'treadmill',
    name: 'Treadmill (motorized)',
    group: 'kardio',
    purpose: 'Lari atau jalan dengan kecepatan dan kemiringan yang bisa diatur persis.',
    howTo: [
      'Pasang klip pengaman (safety key) ke pakaian sebelum menyalakan — ini satu-satunya yang menghentikan sabuk bila Anda terjatuh.',
      'Berdiri di pijakan samping, bukan di sabuk, saat menyalakan mesin.',
      'Mulai jalan 3-5 km/jam selama 3-5 menit sebagai pemanasan sebelum menaikkan kecepatan.',
      'Untuk kardio ringan: atur kecepatan sampai Anda masih bisa bicara kalimat penuh.',
      'Untuk interval: naikkan kecepatan 1-3 menit, lalu turunkan sampai napas pulih, ulangi.',
      'Kemiringan 1-2% membuat beban lebih menyerupai lari di luar, karena tidak ada hambatan angin di dalam ruangan.',
      'Turunkan kecepatan bertahap di akhir, jangan melompat turun saat sabuk masih berjalan.',
    ],
    mistakes: [
      'Berpegangan pada pegangan sepanjang latihan — ini memindahkan sebagian berat badan ke lengan sehingga beban kerja jauh lebih ringan daripada yang ditampilkan layar, dan angka kalorinya menjadi tidak berarti.',
      'Kemiringan sangat tinggi sambil bersandar ke pegangan — postur berubah total dan justru membebani punggung bawah.',
      'Melangkah terlalu jauh ke depan (overstriding) sehingga tumit mendarat jauh di depan panggul; ini menambah gaya benturan pada lutut.',
      'Melihat ke bawah terus-menerus, yang membuat leher dan punggung atas tegang.',
    ],
    primaryMuscles: ['Kuadriseps', 'Hamstring', 'Gluteus', 'Betis (gastrocnemius & soleus)'],
    secondaryMuscles: ['Core', 'Fleksor panggul', 'Tibialis anterior'],
    machineWins: 'Kecepatan dan kemiringan bisa dikunci pada angka tertentu, sehingga latihan bisa diulang persis sama minggu depan dan kemajuan benar-benar terukur. Permukaannya juga sedikit menyerap benturan, dan cuaca maupun lalu lintas tidak menjadi alasan batal.',
    calisthenicWins: 'Lari di luar melatih perubahan permukaan, tikungan, dan angin — variasi yang tidak ada di sabuk. Sabuk yang bergerak sendiri juga sedikit mengurangi kerja hamstring untuk menarik kaki ke belakang, sehingga pola langkahnya tidak identik dengan lari di jalan.',
    calisthenicAlternative: 'Lari atau jalan cepat di luar; naik-turun tangga; skipping; jumping jack untuk ruang sempit.',
    verdict: 'Untuk kebugaran jantung, perbedaan treadmill dan lari di luar kecil — yang menentukan adalah durasi dan intensitasnya, bukan alatnya. Pilih yang paling mungkin Anda lakukan secara rutin.',
  },
  {
    id: 'curve-treadmill',
    name: 'Curve treadmill (non-motorized)',
    group: 'kardio',
    purpose: 'Treadmill melengkung tanpa mesin — sabuk hanya bergerak oleh dorongan kaki Anda.',
    howTo: [
      'Pegang pegangan samping saat naik, letakkan kaki di bagian belakang lengkungan yang paling curam.',
      'Mulai berjalan; sabuk bergerak karena gesekan kaki Anda, bukan karena motor.',
      'Semakin ke DEPAN posisi Anda pada lengkungan, semakin cepat sabuk berjalan. Kecepatan dikendalikan oleh posisi tubuh, bukan tombol.',
      'Untuk memperlambat, mundur sedikit ke arah belakang lengkungan.',
      'Untuk sprint interval: 10-20 detik lari cepat di bagian depan, lalu mundur dan jalan sampai pulih.',
    ],
    mistakes: [
      'Berpegangan erat sepanjang lari — pada alat ini efeknya lebih besar daripada treadmill biasa karena mengubah posisi tubuh terhadap lengkungan sekaligus mengurangi beban.',
      'Mencoba durasi panjang seperti treadmill biasa; alat ini jauh lebih berat sehingga sesi biasanya lebih pendek.',
      'Membandingkan angka kecepatan dengan treadmill bermotor — pada beban yang sama, angka pada curve treadmill akan terasa jauh lebih berat.',
    ],
    primaryMuscles: ['Gluteus', 'Hamstring', 'Kuadriseps', 'Betis'],
    secondaryMuscles: ['Core', 'Fleksor panggul'],
    machineWins: 'Karena Anda yang menggerakkan sabuk, konsumsi energi sekitar 20-30% lebih tinggi daripada treadmill bermotor pada kecepatan yang sama, dan kerja otot posterior (gluteus dan hamstring) lebih besar. Tidak ada motor yang perlu "dikejar", sehingga sprint interval bisa dimulai dan dihentikan seketika tanpa menunggu mesin.',
    calisthenicWins: 'Tidak melatih keterampilan lari di permukaan nyata, dan harganya membuat alat ini jarang tersedia. Sprint di lapangan memberi rangsang serupa tanpa biaya.',
    calisthenicAlternative: 'Sprint di lapangan atau tanjakan; hill sprint 10-20 detik; bear crawl untuk beban serupa tanpa alat.',
    verdict: 'Alat kardio yang benar-benar lebih berat per menit dibanding treadmill biasa, bagus untuk interval pendek. Namun sprint tanjakan di luar memberikan sebagian besar manfaat yang sama tanpa biaya.',
    hyroxNote: 'Tidak dipakai sebagai stasiun Hyrox, tapi berguna melatih segmen lari 1 km yang berulang di antara stasiun.',
  },
  {
    id: 'assault-bike',
    name: 'Air bike / assault bike',
    group: 'kardio',
    purpose: 'Sepeda statis dengan kipas — hambatan naik sebanding dengan seberapa keras Anda mengayuh.',
    howTo: [
      'Atur tinggi sadel: saat pedal di titik terbawah, lutut sedikit menekuk (sekitar 25-30 derajat), tidak lurus penuh.',
      'Genggam pegangan yang bergerak, dorong dan tarik dengan lengan sambil mengayuh dengan kaki.',
      'Untuk interval: 20-40 detik maksimal, lalu 60-90 detik ringan. Ulangi 6-10 putaran.',
      'Perhatikan satuan pada layar — kebanyakan alat memakai "kalori", dan kalori pada air bike naik sangat cepat.',
    ],
    mistakes: [
      'Hanya memakai kaki dan membiarkan lengan pasif, sehingga kehilangan sebagian besar keunggulan alat ini.',
      'Sadel terlalu rendah, yang menambah tekanan pada lutut.',
      'Memulai dengan sesi panjang; alat ini sangat melelahkan dan lebih cocok untuk interval.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus', 'Hamstring', 'Latissimus dorsi', 'Deltoid'],
    secondaryMuscles: ['Core', 'Trisep', 'Bisep', 'Betis'],
    machineWins: 'Melibatkan tubuh atas dan bawah sekaligus, sehingga permintaan kardiovaskular per menit sangat tinggi. Hambatan mengatur diri sendiri: sekeras apa pun Anda mendorong, alat akan mengimbanginya — jadi cocok untuk semua tingkat tanpa mengganti setelan. Benturan pada sendi hampir nol, berguna bila lutut atau pergelangan kaki bermasalah.',
    calisthenicWins: 'Burpee melatih pola serupa (seluruh tubuh, napas berat) sekaligus melatih turun-naik dari lantai, keterampilan yang berguna dan tidak dilatih sepeda.',
    calisthenicAlternative: 'Burpee; mountain climber; squat thrust; shadow boxing dengan lompatan.',
    verdict: 'Salah satu alat kardio paling efisien per menit dan paling ramah sendi. Bila tidak tersedia, burpee memberi rangsang kardiovaskular yang sebanding meski lebih membebani pergelangan tangan dan bahu.',
  },
  {
    id: 'rower',
    name: 'Rowing machine (ergometer)',
    group: 'kardio',
    purpose: 'Mendayung — kardio seluruh tubuh dengan penekanan pada rantai otot belakang.',
    howTo: [
      'Ikat kaki pada footplate, tali melintang di bagian terlebar telapak kaki.',
      'Urutan gerak DORONG dulu: kaki → badan → lengan. Sekitar 60% tenaga berasal dari KAKI, bukan lengan.',
      'Tarik pegangan sampai ke bawah tulang rusuk, siku menyapu dekat badan.',
      'Urutan kembali dibalik: lengan → badan → kaki.',
      'Target stroke rate 20-26 per menit untuk latihan dasar; laju yang lebih tinggi belum tentu lebih cepat.',
      'Atur damper 3-5 untuk sebagian besar orang — damper bukan "tingkat kesulitan", melainkan seberapa banyak udara masuk.',
    ],
    mistakes: [
      'Menarik dengan lengan lebih dulu sebelum kaki mendorong — kesalahan paling umum, membuat punggung cepat lelah dan tenaga hilang.',
      'Membungkuk dengan punggung membulat saat recovery, yang membebani diskus lumbal.',
      'Menyetel damper di 10 dengan anggapan lebih berat lebih baik; ini memperlambat laju dan memperbesar risiko punggung.',
      'Mengangkat pegangan terlalu tinggi ke dada atau terlalu rendah ke perut.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus', 'Hamstring', 'Latissimus dorsi', 'Rhomboid', 'Trapezius'],
    secondaryMuscles: ['Bisep', 'Deltoid posterior', 'Core', 'Erector spinae'],
    machineWins: 'Melatih otot tarik punggung sekaligus kardio, kombinasi yang sulit didapat dari gerakan bodyweight. Benturan sendi rendah, dan setiap dayungan terukur dalam watt sehingga kemajuan terlihat objektif.',
    calisthenicWins: 'Pull-up dan inverted row membangun kekuatan tarik maksimal jauh lebih baik; rowing melatih daya tahan tarik, bukan kekuatan puncak.',
    calisthenicAlternative: 'Inverted row di bawah meja kokoh; pull-up; superman hold untuk rantai belakang.',
    verdict: 'Satu dari sedikit alat kardio yang benar-benar melatih otot tarik. Jika tujuannya kekuatan tarik, tetap butuh pull-up atau row berbeban — dayung tidak menggantikannya.',
    hyroxNote: 'Stasiun resmi Hyrox: 1000 m rowing. Latih pacing, bukan sprint — mendayung terlalu keras di awal menghabiskan tenaga untuk stasiun berikutnya.',
  },

  // ── Hyrox ────────────────────────────────────────────────────────────────
  {
    id: 'skierg',
    name: 'SkiErg',
    group: 'hyrox',
    purpose: 'Meniru gerakan double-poling ski lintas alam — dominan tubuh atas dan core.',
    howTo: [
      'Berdiri sedikit lebih jauh dari mesin daripada yang terasa alami, kaki selebar pinggul.',
      'Raih pegangan setinggi kepala atau sedikit di atasnya, lengan hampir lurus.',
      'Tarik ke bawah dengan MENEKUK PANGGUL (hip hinge) dan mengencangkan core — bukan hanya menarik dengan lengan.',
      'Akhiri tarikan di sekitar paha, lalu biarkan pegangan naik kembali sambil meluruskan panggul.',
      'Gunakan sedikit tekukan lutut untuk membantu ritme, tapi tenaga utama dari batang tubuh.',
    ],
    mistakes: [
      'Menarik murni dengan trisep dan bahu, sehingga lengan cepat habis dan lajunya turun drastis di 200 m terakhir.',
      'Berdiri terlalu dekat sehingga tidak ada ruang untuk hip hinge.',
      'Menekuk punggung bawah alih-alih menekuk panggul.',
    ],
    primaryMuscles: ['Latissimus dorsi', 'Trisep', 'Core (rectus abdominis & obliques)', 'Deltoid posterior'],
    secondaryMuscles: ['Gluteus', 'Hamstring', 'Erector spinae', 'Pektoralis'],
    machineWins: 'Salah satu dari sedikit alat kardio yang membebani tubuh atas secara dominan, dan mengajarkan penggunaan core untuk menyalurkan tenaga — pola yang jarang dilatih.',
    calisthenicWins: 'Tidak ada padanan bodyweight yang benar-benar setara. Push-up dan dips membangun kekuatan dorong lebih baik, tapi tidak memberi komponen kardio berdurasi panjang.',
    calisthenicAlternative: 'Kombinasi burpee + push-up + plank-to-pike; battle rope bila tersedia.',
    verdict: 'Sulit digantikan latihan bodyweight. Bila Anda menyiapkan Hyrox, alat ini perlu dilatih langsung karena tekniknya sangat menentukan hasil.',
    hyroxNote: 'Stasiun pertama Hyrox: 1000 m SkiErg. Karena ini stasiun pembuka, banyak peserta memulai terlalu keras dan membayar mahal di sled berikutnya.',
  },
  {
    id: 'sled-push',
    name: 'Sled push',
    group: 'hyrox',
    purpose: 'Mendorong kereta berbeban — kekuatan kaki dan kardio tanpa fase eksentrik.',
    howTo: [
      'Pegang tiang, lengan hampir lurus, badan condong ke depan membentuk garis lurus dari kepala ke tumit.',
      'Posisi tangan rendah untuk dorongan bertenaga; posisi tinggi lebih tegak dan lebih ringan pada punggung.',
      'Langkah pendek dan cepat, dorong lewat ujung kaki, jangan berdiri tegak di tengah dorongan.',
      'Jaga panggul tidak naik-turun; tenaga berasal dari kaki yang menyodok tanah, bukan dari punggung.',
      'Napas berirama — menahan napas sepanjang lintasan adalah sebab utama pusing.',
    ],
    mistakes: [
      'Berdiri terlalu tegak sehingga tenaga terbuang dan punggung bawah menanggung beban.',
      'Langkah terlalu panjang, membuat momentum hilang setiap langkah.',
      'Beban terlalu berat sehingga gerakan berhenti-mulai; sled seharusnya bergerak terus.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus', 'Betis'],
    secondaryMuscles: ['Hamstring', 'Core', 'Deltoid anterior', 'Trisep'],
    machineWins: 'Hampir tidak ada fase eksentrik (otot memanjang di bawah beban), sehingga nyeri otot setelahnya jauh lebih sedikit dibanding squat berat — bisa dilatih lebih sering. Sangat aman dipelajari karena tidak ada beban di atas tubuh yang bisa jatuh.',
    calisthenicWins: 'Tidak melatih kontrol menurunkan beban, yang penting untuk kekuatan dan pencegahan cedera. Squat dan lunge tetap diperlukan.',
    calisthenicAlternative: 'Walking lunge; wall sit; bear crawl; mendorong mobil di tempat aman (dengan pengawasan).',
    verdict: 'Sangat baik sebagai pelengkap, bukan pengganti squat. Nilai utamanya adalah rangsang kaki berat dengan pemulihan cepat.',
    hyroxNote: 'Stasiun Hyrox: 50 m sled push. Salah satu stasiun yang paling sering menghancurkan waktu peserta — latih dengan beban mendekati lomba, bukan hanya ringan.',
  },
  {
    id: 'sled-pull',
    name: 'Sled pull',
    group: 'hyrox',
    purpose: 'Menarik kereta berbeban dengan tali — rantai otot belakang dan cengkeraman.',
    howTo: [
      'Berdiri dengan kaki selebar bahu, lutut sedikit menekuk, panggul agak turun.',
      'Tarik tali tangan-ke-tangan (hand over hand), badan sedikit condong ke belakang melawan beban.',
      'Jaga punggung netral; tenaga dari kaki menahan lantai dan punggung menjaga posisi.',
      'Kumpulkan tali di samping, jangan sampai menumpuk di depan kaki dan membuat tersandung.',
    ],
    mistakes: [
      'Menarik hanya dengan lengan sambil berdiri tegak — cengkeraman habis sebelum jarak tercapai.',
      'Punggung membulat saat menarik beban berat.',
      'Berdiri terlalu dekat sehingga tidak ada jarak untuk menarik.',
    ],
    primaryMuscles: ['Latissimus dorsi', 'Trapezius', 'Rhomboid', 'Bisep', 'Otot cengkeram lengan bawah'],
    secondaryMuscles: ['Gluteus', 'Hamstring', 'Core', 'Erector spinae'],
    machineWins: 'Melatih cengkeraman dan otot tarik di bawah kelelahan kardio — kombinasi yang hampir tidak bisa ditiru gerakan bodyweight.',
    calisthenicWins: 'Pull-up membangun kekuatan tarik vertikal maksimal yang lebih besar; sled pull lebih ke daya tahan tarik horizontal.',
    calisthenicAlternative: 'Inverted row; towel row pada tiang; dead hang untuk cengkeraman.',
    verdict: 'Pelengkap yang baik untuk daya tahan tarik dan cengkeraman. Untuk kekuatan tarik murni, pull-up tetap lebih efektif.',
    hyroxNote: 'Stasiun Hyrox: 50 m sled pull. Cengkeraman sering menjadi titik gagal — latih dead hang dan farmer carry secara terpisah.',
  },
  {
    id: 'wall-ball',
    name: 'Wall ball',
    group: 'hyrox',
    purpose: 'Squat lalu melempar bola ke sasaran di dinding — gerakan seluruh tubuh berulang.',
    howTo: [
      'Pegang bola di depan dada, siku di bawah bola, kaki selebar bahu.',
      'Turun ke squat penuh — paha minimal sejajar lantai.',
      'Berdiri meledak, dan gunakan momentum dari kaki untuk melempar bola ke sasaran.',
      'Tangkap bola dengan lengan menyerap turun langsung ke squat berikutnya, tanpa jeda berdiri.',
      'Napas: buang saat melempar, tarik saat turun.',
    ],
    mistakes: [
      'Melempar dengan lengan saja tanpa memanfaatkan dorongan kaki — lengan akan habis dalam 15 repetisi.',
      'Squat tidak cukup dalam sehingga repetisi tidak sah dalam lomba.',
      'Menangkap bola dengan lengan kaku, yang membebani bahu dan pergelangan.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus', 'Deltoid', 'Trisep'],
    secondaryMuscles: ['Core', 'Betis', 'Pektoralis atas', 'Punggung atas'],
    machineWins: 'Menggabungkan kekuatan kaki, tenaga eksplosif, dan kardio dalam satu gerakan, dengan beban yang bisa disesuaikan lewat berat bola.',
    calisthenicWins: 'Squat jump memberi komponen eksplosif serupa tanpa alat sama sekali, dan tidak menuntut ruang berdinding tinggi.',
    calisthenicAlternative: 'Squat jump; thruster dengan botol air atau ransel; squat-to-press.',
    verdict: 'Sangat efisien, tapi bisa didekati dengan squat jump dan thruster ransel bila tidak ada bola dan dinding.',
    hyroxNote: 'Stasiun terakhir Hyrox: 75-100 wall balls. Ini stasiun paling ditakuti karena dikerjakan saat tubuh sudah habis — latih dalam keadaan lelah, bukan segar.',
  },
  {
    id: 'farmers-carry',
    name: 'Farmers carry',
    group: 'hyrox',
    purpose: 'Berjalan sambil membawa beban berat di kedua tangan.',
    howTo: [
      'Angkat beban dengan menekuk lutut dan panggul, punggung netral — bukan membungkuk.',
      'Berdiri tegak, bahu ditarik ke belakang dan ke bawah, core dikencangkan.',
      'Langkah normal dan cepat, jangan menyeret kaki.',
      'Jaga beban tidak mengayun dan tidak menyentuh paha.',
      'Turunkan beban dengan menekuk lutut, bukan dengan menjatuhkannya sambil membungkuk.',
    ],
    mistakes: [
      'Membungkuk saat mengangkat dan menurunkan — cedera punggung pada gerakan ini hampir selalu terjadi di dua momen itu, bukan saat berjalan.',
      'Bahu terangkat ke telinga, membuat leher tegang.',
      'Beban terlalu berat sehingga postur runtuh dalam beberapa langkah.',
    ],
    primaryMuscles: ['Otot cengkeram lengan bawah', 'Trapezius', 'Core', 'Gluteus'],
    secondaryMuscles: ['Erector spinae', 'Kuadriseps', 'Betis', 'Deltoid'],
    machineWins: 'Melatih cengkeraman, kestabilan batang tubuh, dan postur di bawah beban sekaligus — sangat mirip tuntutan kehidupan sehari-hari seperti membawa belanjaan atau koper.',
    calisthenicWins: 'Tidak ada padanan bodyweight untuk beban eksternal; namun plank dan dead hang melatih dua komponennya secara terpisah.',
    calisthenicAlternative: 'Membawa galon air atau ransel berisi buku; dead hang untuk cengkeraman; suitcase carry satu sisi.',
    verdict: 'Salah satu latihan dengan transfer paling langsung ke kehidupan nyata, dan mudah ditiru di rumah dengan galon atau ransel.',
    hyroxNote: 'Stasiun Hyrox: 200 m farmers carry. Cengkeraman adalah pembatasnya — bila tangan lepas, waktu terbuang untuk mengangkat ulang.',
  },
  {
    id: 'burpee-broad-jump',
    name: 'Burpee broad jump',
    group: 'hyrox',
    purpose: 'Burpee diikuti lompat jauh ke depan — stasiun tanpa alat sama sekali.',
    howTo: [
      'Dari berdiri, turun ke posisi push-up, dada menyentuh lantai.',
      'Dorong naik, tarik kaki ke depan sampai posisi jongkok.',
      'Dari jongkok, lompat sejauh mungkin ke depan dengan kedua kaki, mendarat lembut dengan lutut menekuk.',
      'Langsung turun ke burpee berikutnya dari titik pendaratan.',
      'Atur ritme napas — ini stasiun paling menguras oksigen.',
    ],
    mistakes: [
      'Melompat terlalu jauh di awal sehingga cepat kehabisan napas.',
      'Mendarat dengan lutut lurus, yang memperbesar benturan pada lutut dan punggung.',
      'Dada tidak menyentuh lantai, sehingga repetisi tidak sah.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus', 'Pektoralis', 'Trisep'],
    secondaryMuscles: ['Core', 'Deltoid', 'Hamstring', 'Betis'],
    machineWins: 'Tidak memerlukan alat apa pun — ini justru contoh gerakan calisthenic murni yang dipakai dalam kompetisi berbayar.',
    calisthenicWins: 'Ini memang gerakan calisthenic; tidak ada mesin yang menggantikannya.',
    calisthenicAlternative: 'Sudah merupakan gerakan bodyweight. Versi lebih ringan: burpee tanpa lompat jauh, atau step-back burpee.',
    verdict: 'Bukti bahwa latihan tanpa alat bisa sangat menuntut. Berguna dilatih siapa pun, dengan atau tanpa akses gym.',
    hyroxNote: 'Stasiun Hyrox: 80 m burpee broad jump. Umumnya dianggap stasiun tersulit — strategi terbaik adalah lompatan sedang yang konsisten, bukan lompatan jauh yang cepat habis.',
  },
  {
    id: 'sandbag-lunge',
    name: 'Sandbag lunges',
    group: 'hyrox',
    purpose: 'Lunge berjalan sambil memanggul karung pasir di bahu atau punggung atas.',
    howTo: [
      'Letakkan karung di punggung atas atau bahu, pegang erat dengan kedua tangan.',
      'Langkah ke depan, turunkan lutut belakang hingga hampir menyentuh lantai.',
      'Lutut depan sejajar dengan arah kaki, tidak jatuh ke dalam.',
      'Dorong dengan tumit kaki depan untuk berdiri, lalu langkah dengan kaki berikutnya.',
      'Jaga badan tegak — condong ke depan berarti karung terlalu berat atau posisinya salah.',
    ],
    mistakes: [
      'Lutut belakang menghantam lantai keras.',
      'Badan membungkuk ke depan sehingga punggung bawah menanggung beban.',
      'Langkah terlalu pendek sehingga lutut depan melewati jari kaki secara berlebihan.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus', 'Hamstring'],
    secondaryMuscles: ['Core', 'Erector spinae', 'Betis', 'Trapezius'],
    machineWins: 'Beban tidak stabil sehingga core dan otot penstabil panggul bekerja jauh lebih keras daripada lunge dengan dumbbell.',
    calisthenicWins: 'Walking lunge tanpa beban melatih pola gerak yang sama dan cukup menantang bagi pemula, tanpa risiko beban di punggung.',
    calisthenicAlternative: 'Walking lunge; Bulgarian split squat; lunge dengan ransel berisi buku.',
    verdict: 'Versi berbeban dari gerakan yang sudah baik. Untuk pemula, kuasai walking lunge tanpa beban lebih dulu.',
    hyroxNote: 'Stasiun Hyrox: 100 m sandbag lunges. Kunci utamanya bukan kekuatan kaki melainkan posisi karung yang stabil — karung yang melorot membuang banyak waktu.',
  },

  // ── Kekuatan ─────────────────────────────────────────────────────────────
  {
    id: 'lat-pulldown',
    name: 'Lat pulldown',
    group: 'kekuatan',
    purpose: 'Menarik beban dari atas ke bawah — pola tarik vertikal dengan beban yang bisa diatur.',
    howTo: [
      'Atur bantalan paha agar menekan cukup kuat sehingga tubuh tidak terangkat.',
      'Pegang batang sedikit lebih lebar dari bahu.',
      'Tarik siku ke bawah dan ke belakang, bayangkan menarik siku ke saku celana — bukan menarik dengan tangan.',
      'Turunkan batang sampai sekitar dagu atau tulang selangka, jangan ke belakang leher.',
      'Kembalikan perlahan sampai lengan hampir lurus, rasakan tarikan pada punggung.',
    ],
    mistakes: [
      'Menarik batang ke belakang leher — menempatkan bahu pada posisi rotasi ekstrem dan berisiko cedera, tanpa manfaat tambahan.',
      'Mengayun badan ke belakang untuk membantu, yang mengubah latihan menjadi row.',
      'Beban terlalu berat sehingga jangkauan gerak menjadi separuh.',
    ],
    primaryMuscles: ['Latissimus dorsi', 'Teres major'],
    secondaryMuscles: ['Bisep', 'Rhomboid', 'Trapezius bawah', 'Deltoid posterior'],
    machineWins: 'Bebannya bisa diatur LEBIH RINGAN dari berat badan, sehingga orang yang belum bisa pull-up tetap dapat melatih pola tarik vertikal dengan jangkauan penuh — ini keunggulan nyata dan bukan sekadar kemudahan.',
    calisthenicWins: 'Pull-up menuntut penstabilan seluruh tubuh dan melatih core serta cengkeraman jauh lebih besar. Untuk orang yang sudah mampu, pull-up memberi rangsang lebih lengkap.',
    calisthenicAlternative: 'Pull-up; chin-up; inverted row; pull-up dengan karet resistensi.',
    verdict: 'Bukan versi "lebih rendah" dari pull-up — ini jalur masuk bagi yang belum kuat, dan alat progresi bagi yang sudah kuat. Idealnya keduanya dipakai.',
  },
  {
    id: 'leg-press',
    name: 'Leg press',
    group: 'kekuatan',
    purpose: 'Mendorong beban dengan kaki pada rangka terpandu.',
    howTo: [
      'Duduk rapat, punggung dan panggul menempel penuh pada sandaran.',
      'Kaki selebar bahu di tengah papan; posisi lebih tinggi menekankan gluteus dan hamstring, lebih rendah menekankan kuadriseps.',
      'Lepaskan pengaman, turunkan beban sampai lutut sekitar 90 derajat.',
      'Dorong lewat seluruh telapak kaki, JANGAN meluruskan lutut sampai terkunci.',
      'Jaga panggul tetap menempel — bila panggul terangkat, Anda menurunkan beban terlalu jauh.',
    ],
    mistakes: [
      'Menurunkan terlalu dalam sehingga panggul terangkat dan punggung bawah membulat — penyebab cedera tersering pada alat ini.',
      'Mengunci lutut di puncak gerakan.',
      'Menaruh tangan di lutut untuk membantu mendorong.',
    ],
    primaryMuscles: ['Kuadriseps', 'Gluteus'],
    secondaryMuscles: ['Hamstring', 'Betis', 'Adduktor'],
    machineWins: 'Memungkinkan beban kaki yang sangat berat tanpa membebani tulang belakang, dan tanpa keterampilan teknik squat. Berguna bagi yang punya masalah punggung atau baru pulih dari cedera.',
    calisthenicWins: 'Tidak melatih keseimbangan, core, maupun kestabilan panggul karena punggung disangga mesin. Squat dan lunge jauh lebih transfer ke gerakan nyata seperti berdiri dari kursi atau menaiki tangga.',
    calisthenicAlternative: 'Bodyweight squat; Bulgarian split squat; pistol squat progression; step-up ke bangku.',
    verdict: 'Baik untuk menambah beban pada kuadriseps dengan aman, tapi tidak menggantikan squat dan lunge yang melatih keseimbangan dan penstabil. Bila hanya bisa memilih satu, pilih squat atau lunge.',
  },
  {
    id: 'cable-machine',
    name: 'Cable machine (crossover)',
    group: 'kekuatan',
    purpose: 'Beban melalui katrol — hambatan tetap konstan di sepanjang jangkauan gerak.',
    howTo: [
      'Atur ketinggian katrol sesuai gerakan: tinggi untuk tarikan ke bawah, sejajar dada untuk dorong dan tarik horizontal, rendah untuk gerakan mengangkat.',
      'Berdiri dengan satu kaki sedikit ke depan untuk kestabilan pada gerakan satu tangan.',
      'Gerakkan hanya sendi yang dimaksud; jaga sisanya tetap diam.',
      'Kembalikan beban terkendali — jangan biarkan tumpukan beban membentur.',
    ],
    mistakes: [
      'Memakai momentum badan sehingga otot sasaran tidak bekerja.',
      'Menjatuhkan beban di fase kembali, yang membuang separuh manfaat latihan.',
      'Berdiri terlalu dekat katrol sehingga tidak ada tegangan di awal gerakan.',
    ],
    primaryMuscles: ['Bergantung setelan — pektoralis, latissimus, deltoid, atau lengan'],
    secondaryMuscles: ['Core (terutama pada gerakan satu tangan)', 'Otot penstabil bahu'],
    machineWins: 'Tegangan konstan sepanjang gerakan, berbeda dari dumbbell yang tegangannya berubah mengikuti gravitasi. Sangat baik untuk gerakan rotasi dan anti-rotasi yang sulit dibebani dengan cara lain.',
    calisthenicWins: 'Push-up dan dip melatih penstabilan seluruh tubuh yang tidak dituntut kabel.',
    calisthenicAlternative: 'Karet resistensi (resistance band) — memberi pola tegangan yang paling mendekati kabel dengan harga sangat murah.',
    verdict: 'Alat paling serbaguna di gym. Bila tidak ada, karet resistensi adalah pengganti terdekat dan cukup memadai untuk sebagian besar tujuan.',
  },
  {
    id: 'smith-machine',
    name: 'Smith machine',
    group: 'kekuatan',
    purpose: 'Barbel yang terkunci pada rel vertikal.',
    howTo: [
      'Atur pengaman (safety stop) sedikit di bawah kedalaman terendah gerakan Anda.',
      'Posisikan kaki sedikit lebih ke depan daripada saat squat bebas, karena batang hanya bergerak lurus.',
      'Putar batang untuk melepas kunci sebelum mulai.',
      'Kerjakan gerakan seperti biasa, lalu putar batang untuk mengunci di akhir set.',
    ],
    mistakes: [
      'Menganggapnya sama dengan squat barbel bebas — jalur geraknya dipaksa lurus sehingga sendi harus menyesuaikan diri, dan ini bisa menimbulkan nyeri pada sebagian orang.',
      'Tidak memasang pengaman.',
      'Beban jauh lebih berat daripada squat bebas lalu menyimpulkan diri lebih kuat — angka keduanya tidak sebanding.',
    ],
    primaryMuscles: ['Bergantung gerakan — kuadriseps dan gluteus pada squat, pektoralis pada bench'],
    secondaryMuscles: ['Lebih sedikit otot penstabil dibanding versi beban bebas'],
    machineWins: 'Aman dilatih sendirian tanpa spotter, dan berguna untuk fokus pada satu otot tanpa dibatasi keseimbangan.',
    calisthenicWins: 'Justru karena mesin yang menstabilkan, otot penstabil dan core bekerja jauh lebih sedikit — dan itulah bagian yang paling berguna dalam kehidupan nyata.',
    calisthenicAlternative: 'Bodyweight squat; push-up untuk pola dorong; goblet squat dengan satu dumbbell.',
    verdict: 'Alat yang paling sering disalahpahami. Bukan buruk, tapi jangan menjadikannya satu-satunya sumber latihan kekuatan — gerakan bebas atau bodyweight tetap diperlukan untuk penstabil.',
  },
  {
    id: 'kettlebell',
    name: 'Kettlebell (swing)',
    group: 'fungsional',
    purpose: 'Ayunan berbandul untuk melatih tenaga panggul (hip hinge) dan rantai otot belakang.',
    howTo: [
      'Letakkan kettlebell sekitar 30 cm di depan kaki, kaki selebar bahu.',
      'Tekuk PANGGUL ke belakang (bukan menekuk lutut seperti squat), raih pegangan.',
      'Ayunkan ke belakang di antara kedua paha, lalu DORONG PANGGUL KE DEPAN dengan kuat.',
      'Bandul terangkat oleh tenaga panggul, bukan oleh lengan mengangkat. Lengan hanya menjadi tali.',
      'Puncak ayunan setinggi dada; kencangkan gluteus dan core di titik atas.',
    ],
    mistakes: [
      'Mengangkat dengan bahu alih-alih mendorong panggul — kesalahan paling umum dan penyebab nyeri bahu.',
      'Squat alih-alih hip hinge, yang mengubah gerakan sepenuhnya.',
      'Punggung membulat saat ayunan ke belakang.',
      'Ayunan di atas kepala tanpa dasar teknik yang cukup.',
    ],
    primaryMuscles: ['Gluteus maximus', 'Hamstring', 'Erector spinae'],
    secondaryMuscles: ['Core', 'Trapezius', 'Deltoid', 'Otot cengkeram'],
    machineWins: 'Melatih tenaga eksplosif panggul sekaligus kardio dengan satu alat murah, dan pola hip hinge-nya melindungi punggung saat mengangkat benda di kehidupan sehari-hari.',
    calisthenicWins: 'Glute bridge dan hip thrust melatih otot yang sama tanpa risiko teknik, dan lebih aman dipelajari sendiri.',
    calisthenicAlternative: 'Glute bridge; single-leg deadlift tanpa beban; broad jump untuk komponen eksplosif.',
    verdict: 'Sangat efisien bila tekniknya benar, tapi termasuk gerakan yang paling sering salah dikerjakan tanpa bimbingan. Pelajari hip hinge tanpa beban lebih dulu.',
  },
  {
    id: 'stair-climber',
    name: 'Stair climber / stepmill',
    group: 'kardio',
    purpose: 'Menaiki anak tangga yang berputar terus-menerus.',
    howTo: [
      'Berdiri tegak, tangan menyentuh pegangan hanya untuk keseimbangan, bukan untuk menopang berat badan.',
      'Injak tangga dengan seluruh telapak kaki, bukan ujung jari saja.',
      'Mulai kecepatan rendah 3-5 menit, lalu naikkan.',
      'Jaga badan tegak; membungkuk ke depan mengurangi kerja gluteus.',
    ],
    mistakes: [
      'Bersandar berat pada pegangan — mengurangi beban kerja secara drastis sementara layar tetap menghitung seolah beban penuh.',
      'Melangkah hanya dengan ujung kaki, yang membuat betis cepat lelah dan gluteus kurang bekerja.',
      'Melangkahi dua anak tangga sekaligus tanpa kekuatan yang memadai.',
    ],
    primaryMuscles: ['Gluteus', 'Kuadriseps', 'Hamstring'],
    secondaryMuscles: ['Betis', 'Core'],
    machineWins: 'Beban gluteus jauh lebih besar daripada treadmill datar dengan benturan sendi yang tetap rendah, dan intensitasnya konsisten karena tangga bergerak sendiri.',
    calisthenicWins: 'Menaiki tangga gedung memberi rangsang hampir identik, gratis, dan sekaligus melatih menuruni tangga yang tidak dilatih mesin ini.',
    calisthenicAlternative: 'Naik tangga gedung; step-up ke bangku kokoh; lunge naik tanjakan.',
    verdict: 'Efektif, tapi ini salah satu alat yang paling mudah digantikan — tangga gedung memberi manfaat setara tanpa biaya.',
  },
]

export function equipmentByGroup(group: Group | null, query: string): Equipment[] {
  const q = query.toLowerCase().trim()
  return EQUIPMENT.filter((e) => {
    if (group && e.group !== group) return false
    if (!q) return true
    return `${e.name} ${e.purpose} ${e.primaryMuscles.join(' ')} ${e.group}`.toLowerCase().includes(q)
  })
}
