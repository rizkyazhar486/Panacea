// Seratus ringkasan: buku dan film pengembangan diri, satu paragraf pendek.
//
// MENGAPA TIDAK ADA ANGKA PENILAIAN DI SINI, padahal daftar semacam ini
// biasanya dijual dengan angka. Nilai di Goodreads dan IMDb BERUBAH setiap
// hari, berbeda antar-negara, dan tidak dapat diperiksa dari dalam aplikasi
// ini tanpa memanggil layanan berbayar mereka. Menuliskan "4,37" yang
// sebenarnya tidak pernah diambil dari mana pun berarti mengarang angka —
// hal yang sama yang ditolak di seluruh bagian lain aplikasi ini. Yang
// dinyatakan sebagai gantinya: judul-judul ini KONSISTEN BERNILAI TINGGI dan
// bertahan dibicarakan bertahun-tahun, dan yang menilai apakah sebuah buku
// cocok tetap pembacanya.
//
// RINGKASANNYA DITULIS ULANG, BUKAN DIKUTIP. Tidak ada satu kalimat pun yang
// disalin dari bukunya, dari sampul belakangnya, atau dari ulasan orang lain.
// Ringkasan yang menyalin kalimat penulisnya adalah pelanggaran hak cipta, dan
// ringkasan yang menyalin ulasan orang lain bukan ringkasan.
//
// SATU PARAGRAF, BUKAN LIMA. Ringkasan yang panjang berubah menjadi pengganti
// bukunya, dan pengganti yang buruk: yang membuat buku bekerja adalah contoh,
// bantahan, dan pengulangannya — justru bagian yang pertama hilang saat
// diringkas. Yang di sini cukup untuk memutuskan APAKAH akan dibaca.
//
// APA YANG TIDAK DILAKUKAN. Tidak ada janji hasil ("baca ini dan hidup Anda
// berubah"), tidak ada urutan "terbaik nomor satu", dan buku yang gagasannya
// dibantah bukti disebutkan bantahannya di ringkasannya sendiri.

export type JenisKarya = 'buku' | 'film'

export interface Karya {
  id: string
  jenis: JenisKarya
  judul: string
  /** Penulis untuk buku, sutradara/pembuat untuk film. */
  oleh: string
  tahun?: number
  tema: string[]
  ringkas: string
}

export const TEMA: string[] = [
  'Kebiasaan', 'Fokus', 'Ketahanan', 'Pikiran', 'Tidur & tubuh', 'Uang',
  'Hubungan', 'Karya & kreativitas', 'Kedokteran', 'Makna', 'Olahraga', 'Kepemimpinan',
]

export const KARYA: Karya[] = [
  // ── Kebiasaan & perubahan perilaku ────────────────────────────────────────
  {
    id: 'atomic-habits', jenis: 'buku', judul: 'Atomic Habits', oleh: 'James Clear', tahun: 2018,
    tema: ['Kebiasaan'],
    ringkas: 'Perubahan besar jarang datang dari tekad besar; ia datang dari kebiasaan kecil yang diulang. Clear memecah kebiasaan menjadi empat bagian — isyarat, keinginan, tanggapan, ganjaran — lalu menunjukkan cara mengubah tiap bagiannya: buat yang baik jelas dan mudah, buat yang buruk tersembunyi dan sulit. Bagian yang paling sering terlewat pembacanya justru yang paling penting: mengubah bagaimana Anda memandang diri sendiri, bukan sekadar mengejar target.',
  },
  {
    id: 'power-of-habit', jenis: 'buku', judul: 'The Power of Habit', oleh: 'Charles Duhigg', tahun: 2012,
    tema: ['Kebiasaan'],
    ringkas: 'Duhigg menelusuri bagaimana otak mengotomatiskan perilaku lewat lingkar isyarat–rutinitas–ganjaran, dan mengapa lingkar itu tidak dapat dihapus — hanya dapat diganti rutinitasnya sementara isyarat dan ganjarannya dibiarkan tetap. Kekuatannya ada pada kisah nyatanya, dari pabrik alumunium sampai kampanye pasta gigi. Kelemahannya: sebagian penelitian yang dikutipnya belakangan tidak sekuat yang tampak saat buku ini ditulis.',
  },
  {
    id: 'tiny-habits', jenis: 'buku', judul: 'Tiny Habits', oleh: 'BJ Fogg', tahun: 2019,
    tema: ['Kebiasaan'],
    ringkas: 'Fogg menyusun perilaku dari tiga hal yang harus bertemu pada saat yang sama: keinginan, kemampuan, dan pemicu. Karena keinginan naik-turun di luar kendali, yang paling dapat diandalkan adalah membuat perilakunya sangat kecil — dua push-up, satu kalimat — lalu menempelkannya pada kebiasaan yang sudah ada. Perayaan kecil sesudahnya bukan hiasan; itulah yang membuat otak menandainya layak diulang.',
  },
  {
    id: 'compound-effect', jenis: 'buku', judul: 'The Compound Effect', oleh: 'Darren Hardy', tahun: 2010,
    tema: ['Kebiasaan'],
    ringkas: 'Satu gagasan, diulang dengan sabar: pilihan kecil yang membosankan, dikalikan waktu, mengalahkan usaha besar yang sesekali. Hardy menuntut pembacanya melacak satu perilaku selama beberapa pekan sebelum menilai apa pun, karena hasilnya tidak terlihat pada minggu-minggu awal. Bukunya tipis dan berulang — dan pengulangan itu memang bagian dari maksudnya.',
  },
  {
    id: 'indistractable', jenis: 'buku', judul: 'Indistractable', oleh: 'Nir Eyal', tahun: 2019,
    tema: ['Fokus', 'Kebiasaan'],
    ringkas: 'Eyal berargumen bahwa gangguan bukan berawal dari telepon, melainkan dari rasa tidak nyaman yang ingin kita hindari — bosan, cemas, ragu. Karena itu ia mulai dari dalam: menamai pemicu batin, menjadwalkan waktu untuk nilai yang penting, lalu baru menutup jalan gangguan dari luar. Menarik dibaca berdampingan dengan buku Eyal sebelumnya tentang cara produk dibuat mencandu.',
  },
  {
    id: 'atomic-focus-onething', jenis: 'buku', judul: 'The ONE Thing', oleh: 'Gary Keller & Jay Papasan', tahun: 2013,
    tema: ['Fokus'],
    ringkas: 'Satu pertanyaan menjadi tulang punggung bukunya: apa satu hal yang, bila dikerjakan, membuat hal lain menjadi lebih mudah atau tidak perlu sama sekali? Keller menyerang daftar tugas panjang sebagai cara paling halus untuk sibuk tanpa maju. Yang membuatnya berguna bukan gagasannya — melainkan disiplin memblokir waktu untuk satu hal itu lebih dahulu, sebelum hari diisi orang lain.',
  },

  // ── Fokus, waktu, perhatian ───────────────────────────────────────────────
  {
    id: 'deep-work', jenis: 'buku', judul: 'Deep Work', oleh: 'Cal Newport', tahun: 2016,
    tema: ['Fokus', 'Karya & kreativitas'],
    ringkas: 'Newport menyebut kerja pekat — berkonsentrasi tanpa gangguan pada sesuatu yang sulit — sebagai kemampuan yang makin langka sekaligus makin bernilai. Ia menawarkan cara menjadwalkannya, bukan menunggu suasana hati, dan menunjukkan berapa lama otak butuh untuk kembali fokus sesudah satu kali diselingi. Nadanya keras terhadap media sosial, dan itu memang disengaja.',
  },
  {
    id: 'digital-minimalism', jenis: 'buku', judul: 'Digital Minimalism', oleh: 'Cal Newport', tahun: 2019,
    tema: ['Fokus'],
    ringkas: 'Bukan anjuran membuang telepon, melainkan menuntut tiap aplikasi membuktikan diri: apakah ia melayani sesuatu yang benar-benar Anda hargai, dan apakah itu cara terbaik melayaninya. Newport mengusulkan jeda tiga puluh hari, lalu memasukkan kembali satu per satu dengan aturan pemakaian yang jelas. Bagian terkuatnya adalah tentang kesendirian — dan apa yang hilang ketika ia tidak pernah lagi terjadi.',
  },
  {
    id: 'make-time', jenis: 'buku', judul: 'Make Time', oleh: 'Jake Knapp & John Zeratsky', tahun: 2018,
    tema: ['Fokus'],
    ringkas: 'Dua mantan perancang produk menuliskan cara mereka melawan rancangan yang mereka bantu buat sendiri. Bentuknya sederhana: pilih satu sorotan untuk hari ini, singkirkan penghalang, jaga tenaga lewat tidur dan gerak, lalu renungkan hasilnya malam hari. Isinya kumpulan taktik kecil, bukan sistem besar — dan justru itu yang membuatnya mudah dicoba.',
  },
  {
    id: 'four-thousand-weeks', jenis: 'buku', judul: 'Four Thousand Weeks', oleh: 'Oliver Burkeman', tahun: 2021,
    tema: ['Makna', 'Fokus'],
    ringkas: 'Burkeman membalik seluruh gagasan produktivitas: hidup manusia kira-kira empat ribu minggu, dan tidak ada sistem yang akan membuat semuanya cukup. Alih-alih mengejar penguasaan atas waktu, ia mengajak menerima batas itu dan memilih dengan sadar apa yang sengaja tidak dikerjakan. Buku yang menenangkan justru karena berhenti menjanjikan kendali.',
  },
  {
    id: 'gtd', jenis: 'buku', judul: 'Getting Things Done', oleh: 'David Allen', tahun: 2001,
    tema: ['Fokus'],
    ringkas: 'Allen berangkat dari satu pengamatan: pikiran buruk dalam menyimpan pengingat, dan beban itulah yang melelahkan. Sistemnya mengeluarkan semua yang tertunda dari kepala ke satu tempat tepercaya, memecahnya menjadi tindakan berikutnya yang jelas, lalu meninjaunya berkala. Rumit di awal dan menuntut pemeliharaan — tetapi kerangka "apa tindakan berikutnya" bertahan meski sistemnya tidak dipakai utuh.',
  },
  {
    id: 'essentialism', jenis: 'buku', judul: 'Essentialism', oleh: 'Greg McKeown', tahun: 2014,
    tema: ['Fokus'],
    ringkas: 'McKeown menyerang kebiasaan mengiakan segalanya sedikit-sedikit. Intinya bukan mengerjakan lebih sedikit demi santai, melainkan memusatkan hampir seluruh tenaga pada yang benar-benar penting dan menolak sisanya dengan tegas. Bagian tentang cara menolak tanpa merusak hubungan adalah yang paling sering dipakai orang sesudah membacanya.',
  },
  {
    id: 'flow', jenis: 'buku', judul: 'Flow', oleh: 'Mihaly Csikszentmihalyi', tahun: 1990,
    tema: ['Fokus', 'Makna'],
    ringkas: 'Dari ribuan laporan pengalaman sehari-hari, Csikszentmihalyi menemukan bahwa saat-saat paling memuaskan bukan saat bersantai, melainkan saat tenggelam dalam kegiatan yang tantangannya pas dengan kemampuan. Ia merinci syaratnya: sasaran yang jelas, umpan balik langsung, dan perhatian yang tidak terbagi. Bahasanya akademis, tetapi gagasannya sudah menjadi dasar hampir semua tulisan tentang fokus sesudahnya.',
  },

  // ── Ketahanan, mental, dan Stoa ───────────────────────────────────────────
  {
    id: 'mans-search', jenis: 'buku', judul: "Man's Search for Meaning", oleh: 'Viktor Frankl', tahun: 1946,
    tema: ['Makna', 'Ketahanan'],
    ringkas: 'Frankl, psikiater yang selamat dari kamp konsentrasi, menuliskan apa yang membedakan orang yang bertahan: bukan kekuatan fisik, melainkan adanya sesuatu yang masih menuntut diselesaikan — pekerjaan, orang yang dicintai, atau sikap yang dipilih terhadap penderitaan yang tidak dapat diubah. Separuh pertama kesaksian, separuh kedua dasar logoterapi. Pendek, dan tidak pernah menghibur dengan murah.',
  },
  {
    id: 'meditations', jenis: 'buku', judul: 'Meditations', oleh: 'Marcus Aurelius', tahun: 180,
    tema: ['Pikiran', 'Ketahanan'],
    ringkas: 'Catatan pribadi seorang kaisar yang tidak pernah dimaksudkan terbit, dan justru itu kekuatannya: ia menasihati dirinya sendiri, berulang-ulang, tentang hal yang sama — kendalikan penilaianmu, kerjakan tugasmu, ingat bahwa waktumu terbatas. Tidak ada susunan bab; dibaca sedikit-sedikit lebih berguna daripada dihabiskan sekali duduk.',
  },
  {
    id: 'seneca-letters', jenis: 'buku', judul: 'Letters from a Stoic', oleh: 'Seneca', tahun: 65,
    tema: ['Pikiran', 'Makna'],
    ringkas: 'Surat-surat kepada seorang teman tentang waktu, kematian, kemewahan, dan persahabatan — ditulis dengan kalimat yang tajam dan sering lucu. Seneca berulang kali kembali ke satu hal: kita berlaku pelit terhadap harta, tetapi sangat royal terhadap waktu, satu-satunya yang tidak dapat dikembalikan. Hidupnya sendiri tidak selalu sejalan dengan nasihatnya, dan itu bagian dari yang menarik.',
  },
  {
    id: 'epictetus', jenis: 'buku', judul: 'Enchiridion (Buku Pegangan)', oleh: 'Epictetus', tahun: 125,
    tema: ['Pikiran'],
    ringkas: 'Ringkasan ajaran seorang bekas budak yang menjadi guru: pisahkan dengan tegas apa yang ada dalam kendali Anda — penilaian, keinginan, tindakan — dari yang tidak, lalu berhenti menuntut yang kedua. Kalimatnya pendek dan keras. Dibaca hari ini, sebagian nasihatnya terasa dingin; tetapi pemisahan kendali itu menjadi dasar hampir seluruh terapi perilaku kognitif modern.',
  },
  {
    id: 'obstacle-way', jenis: 'buku', judul: 'The Obstacle Is the Way', oleh: 'Ryan Holiday', tahun: 2014,
    tema: ['Ketahanan', 'Pikiran'],
    ringkas: 'Holiday menerjemahkan Stoa menjadi tiga langkah praktis: lihat keadaan apa adanya, bertindak pada bagian yang dapat digerakkan, dan tanggung sisanya. Dibangun dari kisah tokoh sejarah yang menjadikan hambatan sebagai jalan itu sendiri. Enak dibaca, tetapi contoh-contohnya dipilih sesudah hasilnya diketahui — itu perlu diingat sebelum menyimpulkan apa pun tentang sebab-akibat.',
  },
  {
    id: 'ego-enemy', jenis: 'buku', judul: 'Ego Is the Enemy', oleh: 'Ryan Holiday', tahun: 2016,
    tema: ['Pikiran'],
    ringkas: 'Bahaya terbesar bagi orang berbakat bukan kegagalan, melainkan kebutuhan untuk merasa istimewa. Holiday menelusurinya di tiga keadaan — saat berambisi, saat berhasil, dan saat gagal — dan menunjukkan bagaimana ego merusak ketiganya dengan cara yang berbeda. Nadanya menegur, dan itu memang maksudnya.',
  },
  {
    id: 'daily-stoic', jenis: 'buku', judul: 'The Daily Stoic', oleh: 'Ryan Holiday & Stephen Hanselman', tahun: 2016,
    tema: ['Pikiran'],
    ringkas: 'Satu kutipan Stoa untuk tiap hari dalam setahun, disertai keterangan pendek. Bentuknya membuatnya berfungsi sebagai kebiasaan harian, bukan bacaan sekali habis. Berguna sebagai pintu masuk sebelum membaca Marcus Aurelius, Seneca, dan Epictetus langsung — dan penerjemahannya cukup jujur menyebut ketika teks aslinya lebih rumit.',
  },
  {
    id: 'cant-hurt-me', jenis: 'buku', judul: "Can't Hurt Me", oleh: 'David Goggins', tahun: 2018,
    tema: ['Ketahanan', 'Olahraga'],
    ringkas: 'Kisah hidup yang keras: dari masa kecil penuh kekerasan dan kemiskinan menjadi anggota pasukan khusus dan pelari ultra. Gagasan yang paling sering dikutip darinya adalah "aturan empat puluh persen" — bahwa rasa habis sering datang jauh sebelum batas sebenarnya. Cara hidupnya ekstrem dan tidak dianjurkan ditiru mentah-mentah; yang layak diambil adalah bagian tentang membangun bukti diri melalui hal-hal sulit yang diselesaikan.',
  },
  {
    id: 'do-hard-things', jenis: 'buku', judul: 'Do Hard Things', oleh: 'Steve Magness', tahun: 2022,
    tema: ['Ketahanan', 'Olahraga'],
    ringkas: 'Magness membongkar gagasan ketangguhan gaya lama — berteriak, memaksa, mengabaikan rasa sakit — dan menggantinya dengan yang tampak dari penelitian: mengenali isyarat tubuh dengan tepat, menanggapi dengan tenang, dan membangun kemampuan menghadapi rasa tidak nyaman. Penawar yang baik untuk buku ketangguhan yang isinya semata-mata semangat.',
  },
  {
    id: 'peak-performance', jenis: 'buku', judul: 'Peak Performance', oleh: 'Brad Stulberg & Steve Magness', tahun: 2017,
    tema: ['Olahraga', 'Fokus'],
    ringkas: 'Satu rumus yang berlaku bagi atlet maupun pekerja pikiran: tekanan ditambah istirahat menghasilkan pertumbuhan — dan menghapus salah satunya menghapus hasilnya. Buku ini menjelaskan mengapa pemulihan bukan kemalasan, bagaimana rutinitas pemanasan bekerja untuk kerja pikiran, dan mengapa tujuan yang lebih besar daripada diri sendiri menaikkan daya tahan.',
  },
  {
    id: 'grit', jenis: 'buku', judul: 'Grit', oleh: 'Angela Duckworth', tahun: 2016,
    tema: ['Ketahanan'],
    ringkas: 'Duckworth berargumen bahwa gabungan minat yang bertahan lama dan ketekunan sering lebih menentukan daripada bakat. Ia menawarkan cara menumbuhkannya: minat, latihan yang terarah, tujuan yang melampaui diri, dan harapan. Penting diketahui: telaah belakangan menemukan pengaruh grit terhadap keberhasilan lebih kecil daripada kesan yang ditinggalkan bukunya, dan sebagian besarnya tumpang tindih dengan sifat ketekunan yang sudah dikenal.',
  },
  {
    id: 'mindset', jenis: 'buku', judul: 'Mindset', oleh: 'Carol Dweck', tahun: 2006,
    tema: ['Pikiran'],
    ringkas: 'Dweck membedakan dua cara memandang kemampuan: sebagai sesuatu yang tetap, atau sebagai sesuatu yang tumbuh lewat usaha dan strategi. Pandangan kedua mengubah cara orang menghadapi kegagalan — dari bukti keterbatasan menjadi keterangan tentang apa yang perlu diubah. Perlu disebut: percobaan pengulangan berskala besar menemukan pengaruhnya pada nilai akademik kecil, dan paling terasa pada murid yang tertinggal.',
  },
  {
    id: 'body-keeps-score', jenis: 'buku', judul: 'The Body Keeps the Score', oleh: 'Bessel van der Kolk', tahun: 2014,
    tema: ['Pikiran', 'Kedokteran'],
    ringkas: 'Trauma bukan hanya ingatan buruk; ia mengubah cara tubuh dan otak menanggapi keadaan biasa. Van der Kolk menuliskan puluhan tahun praktiknya dan berbagai pendekatan pemulihan, dari terapi bicara sampai yoga dan EMDR. Buku yang penting sekaligus perlu dibaca dengan kepala dingin: bukti untuk sebagian terapi yang diceritakannya lebih lemah daripada nada bukunya.',
  },
  {
    id: 'why-zebras', jenis: 'buku', judul: "Why Zebras Don't Get Ulcers", oleh: 'Robert Sapolsky', tahun: 1994,
    tema: ['Pikiran', 'Kedokteran'],
    ringkas: 'Sistem tanggap stres manusia dirancang untuk keadaan darurat beberapa menit, bukan untuk kecemasan yang berjalan bertahun-tahun. Sapolsky menjelaskan apa yang terjadi ketika sistem itu menyala terus — pada pembuluh darah, pencernaan, tidur, dan daya tahan tubuh — dengan humor yang tidak mengurangi ketelitiannya. Salah satu buku sains populer terbaik tentang tubuh.',
  },
  {
    id: 'dopamine-nation', jenis: 'buku', judul: 'Dopamine Nation', oleh: 'Anna Lembke', tahun: 2021,
    tema: ['Pikiran', 'Kebiasaan'],
    ringkas: 'Lembke, psikiater kecanduan, menjelaskan mengapa dunia yang penuh kesenangan mudah justru menaikkan rasa tidak puas: otak menyeimbangkan nikmat dengan nyeri, dan rangsangan berulang menggeser titik seimbangnya. Ia menganjurkan puasa rangsangan sekitar empat minggu untuk mengembalikannya. Contohnya berasal dari praktik kliniknya, jadi keras tetapi konkret.',
  },
  {
    id: 'molecule-of-more', jenis: 'buku', judul: 'The Molecule of More', oleh: 'Daniel Lieberman & Michael Long', tahun: 2018,
    tema: ['Pikiran'],
    ringkas: 'Buku ini memisahkan dua jenis kesenangan: mengejar sesuatu, dan menikmati yang sudah ada. Keduanya memakai jalur otak yang berbeda, dan orang yang sangat kuat pada yang pertama sering payah pada yang kedua — pola yang menjelaskan banyak kisah keberhasilan yang berakhir hampa. Penyederhanaannya kadang berlebihan, tetapi kerangkanya menempel lama.',
  },
  {
    id: 'behave', jenis: 'buku', judul: 'Behave', oleh: 'Robert Sapolsky', tahun: 2017,
    tema: ['Pikiran'],
    ringkas: 'Satu perbuatan ditelusuri mundur: apa yang terjadi sedetik sebelumnya di otak, semenit sebelumnya pada hormon, setahun sebelumnya pada perkembangan, dan berabad sebelumnya pada budaya dan evolusi. Tebal dan menuntut, tetapi tidak ada buku lain yang sejelas ini menunjukkan betapa berlapisnya sebab dari perilaku manusia.',
  },
  {
    id: 'thinking-fast-slow', jenis: 'buku', judul: 'Thinking, Fast and Slow', oleh: 'Daniel Kahneman', tahun: 2011,
    tema: ['Pikiran'],
    ringkas: 'Kahneman merangkum penelitian seumur hidupnya tentang dua cara berpikir: cepat dan otomatis, lambat dan berhati-hati. Ia memperlihatkan kesalahan sistematis yang muncul dari yang pertama — jangkar, ketersediaan, terlalu percaya diri. Perlu diketahui bahwa beberapa bab, terutama tentang priming, tidak bertahan pada percobaan pengulangan, dan Kahneman sendiri kemudian mengakuinya.',
  },
  {
    id: 'thinking-in-bets', jenis: 'buku', judul: 'Thinking in Bets', oleh: 'Annie Duke', tahun: 2018,
    tema: ['Pikiran'],
    ringkas: 'Mantan pemain poker profesional mengajarkan cara memisahkan mutu keputusan dari hasilnya — dua hal yang terus-menerus dicampur orang, terutama sesudah tahu hasilnya. Ia menawarkan cara memikirkan keputusan sebagai taruhan dengan peluang, dan cara membentuk kelompok yang saling mengoreksi. Pendek dan langsung dapat dipakai pada keputusan sehari-hari.',
  },
  {
    id: 'antifragile', jenis: 'buku', judul: 'Antifragile', oleh: 'Nassim Nicholas Taleb', tahun: 2012,
    tema: ['Pikiran', 'Ketahanan'],
    ringkas: 'Ada benda yang rusak oleh guncangan, ada yang bertahan, dan ada yang justru menguat — dan Taleb berargumen bahwa yang ketiga inilah yang selama ini tidak punya nama. Ia menerapkannya pada tubuh, keuangan, dan kebijakan, dengan tegas menolak sistem yang tampak tenang tetapi runtuh sekali dan habis. Nadanya sombong dan berputar-putar; gagasan intinya tetap layak diambil.',
  },
  {
    id: 'black-swan', jenis: 'buku', judul: 'The Black Swan', oleh: 'Nassim Nicholas Taleb', tahun: 2007,
    tema: ['Pikiran', 'Uang'],
    ringkas: 'Peristiwa yang paling menentukan sejarah justru yang paling tidak terduga, dan manusia pandai mengarang penjelasan sesudahnya seolah semuanya masuk akal sejak awal. Taleb menyerang model risiko yang menganggap dunia berperilaku rapi seperti lonceng. Bacaan yang menyehatkan bagi siapa pun yang membuat rencana jangka panjang.',
  },

  // ── Tidur, tubuh, dan umur panjang ────────────────────────────────────────
  {
    id: 'why-we-sleep', jenis: 'buku', judul: 'Why We Sleep', oleh: 'Matthew Walker', tahun: 2017,
    tema: ['Tidur & tubuh', 'Kedokteran'],
    ringkas: 'Walker mengumpulkan bukti tentang peran tidur pada ingatan, daya tahan tubuh, hormon, dan suasana hati, lalu menuntut pembacanya memperlakukan tidur sebagai kebutuhan, bukan sisa waktu. Penting disebut: buku ini menuai kritik terperinci karena beberapa angka dan klaimnya dinyatakan terlalu kuat dibanding sumbernya — bacalah gagasan besarnya, periksa ulang angkanya.',
  },
  {
    id: 'breath', jenis: 'buku', judul: 'Breath', oleh: 'James Nestor', tahun: 2020,
    tema: ['Tidur & tubuh'],
    ringkas: 'Nestor menelusuri bagaimana cara bernapas manusia berubah, dan apa yang terjadi ketika bernapas lewat mulut menjadi kebiasaan. Bagian bernapas lewat hidung dan memperlambat napas didukung bukti yang lumayan; bagian lain — terutama klaim tentang bentuk wajah dan penyembuhan penyakit — jauh melampaui buktinya. Menarik sebagai penjelajahan, bukan sebagai pedoman.',
  },
  {
    id: 'spark', jenis: 'buku', judul: 'Spark', oleh: 'John Ratey', tahun: 2008,
    tema: ['Tidur & tubuh', 'Pikiran'],
    ringkas: 'Bukan tentang otot, melainkan tentang otak: bagaimana gerak teratur memengaruhi belajar, kecemasan, perhatian, dan suasana hati. Ratey menulisnya dengan kisah sekolah dan pasien yang membuat mekanismenya mudah diingat. Sebagian besarnya bertahan sampai hari ini; angka-angka spesifiknya perlu diperiksa terhadap penelitian yang lebih baru.',
  },
  {
    id: 'outlive', jenis: 'buku', judul: 'Outlive', oleh: 'Peter Attia', tahun: 2023,
    tema: ['Kedokteran', 'Tidur & tubuh'],
    ringkas: 'Attia memisahkan panjang umur dari lamanya hidup sehat, lalu memusatkan perhatian pada empat penyakit yang paling menentukan keduanya. Bagian latihannya kuat — terutama gagasan berlatih hari ini untuk kemampuan yang dibutuhkan pada usia delapan puluh. Sebagian anjuran suplemen dan pemeriksaannya melampaui bukti yang ada, dan ia sendiri menandai mana yang masih dugaan.',
  },
  {
    id: 'endure', jenis: 'buku', judul: 'Endure', oleh: 'Alex Hutchinson', tahun: 2018,
    tema: ['Olahraga'],
    ringkas: 'Apa sebenarnya yang menghentikan seseorang saat lelah — otot, jantung, atau otak? Hutchinson menelusuri perdebatan panjang tentang batas daya tahan, dari teori pengatur di otak sampai percobaan yang membuktikan pengaruh keyakinan dan kata-kata pada waktu tempuh. Jujur menampilkan bukti yang bertentangan alih-alih memilih pihak.',
  },
  {
    id: 'born-to-run', jenis: 'buku', judul: 'Born to Run', oleh: 'Christopher McDougall', tahun: 2009,
    tema: ['Olahraga'],
    ringkas: 'Perjalanan mencari suku pelari jarak jauh di Meksiko, berpilin dengan gagasan bahwa manusia berevolusi untuk berlari jauh. Kisahnya luar biasa dan menular. Tetapi klaim tentang sepatu minimalis yang dipopulerkannya tidak terbukti menurunkan cedera pada penelitian sesudahnya — bacalah sebagai kisah yang menyalakan, bukan sebagai anjuran perlengkapan.',
  },
  {
    id: 'sports-gene', jenis: 'buku', judul: 'The Sports Gene', oleh: 'David Epstein', tahun: 2013,
    tema: ['Olahraga'],
    ringkas: 'Epstein menguji pertentangan bakat lawan latihan dengan bukti yang jauh lebih rumit daripada kedua kubunya: gen memengaruhi bukan hanya kemampuan awal, tetapi juga seberapa cepat seseorang menanggapi latihan. Berisi bagian yang jarang ditulis dengan sebaik ini tentang penglihatan atlet, bentuk tubuh, dan pengaruh ketinggian tempat tinggal.',
  },
  {
    id: 'range', jenis: 'buku', judul: 'Range', oleh: 'David Epstein', tahun: 2019,
    tema: ['Karya & kreativitas'],
    ringkas: 'Bantahan yang tertata terhadap gagasan bahwa penguasaan selalu menuntut pengkhususan sejak dini. Epstein menunjukkan bahwa pada bidang yang aturannya tidak jelas dan umpan baliknya lambat, orang yang mencoba banyak hal dan berpindah justru unggul. Bacaan penyeimbang bagi siapa pun yang merasa terlambat karena belum memilih satu jalan.',
  },
  {
    id: 'peak-ericsson', jenis: 'buku', judul: 'Peak', oleh: 'Anders Ericsson & Robert Pool', tahun: 2016,
    tema: ['Karya & kreativitas'],
    ringkas: 'Ericsson, peneliti asli di balik gagasan latihan terarah, menjelaskan apa yang sebenarnya ia temukan: bukan sepuluh ribu jam apa pun, melainkan latihan dengan sasaran jelas, umpan balik segera, dan tepat di luar batas kemampuan sekarang. Sekaligus koreksi terhadap penyederhanaan yang telanjur beredar tentang penelitiannya.',
  },
  {
    id: 'outliers', jenis: 'buku', judul: 'Outliers', oleh: 'Malcolm Gladwell', tahun: 2008,
    tema: ['Karya & kreativitas'],
    ringkas: 'Gladwell berargumen bahwa keberhasilan luar biasa tidak pernah hanya soal bakat: waktu kelahiran, kesempatan, warisan budaya, dan jam latihan ikut menentukan. Menghibur dan mengubah cara orang memandang kisah sukses. Perlu diketahui bahwa aturan sepuluh ribu jam yang dipopulerkannya disederhanakan dari penelitian aslinya, dan penelitinya sendiri membantahnya.',
  },

  // ── Uang ──────────────────────────────────────────────────────────────────
  {
    id: 'psychology-money', jenis: 'buku', judul: 'The Psychology of Money', oleh: 'Morgan Housel', tahun: 2020,
    tema: ['Uang'],
    ringkas: 'Housel berargumen bahwa perilaku lebih menentukan hasil keuangan daripada kecerdasan: cukup, sabar, dan bertahan lama mengalahkan pintar tetapi rapuh. Dua puluh bab pendek yang berdiri sendiri, penuh kisah, tanpa satu pun rumus. Tidak memberi tahu apa yang harus dibeli — dan itu justru kelebihannya.',
  },
  {
    id: 'your-money-or-life', jenis: 'buku', judul: 'Your Money or Your Life', oleh: 'Vicki Robin & Joe Dominguez', tahun: 1992,
    tema: ['Uang', 'Makna'],
    ringkas: 'Buku ini menghitung ulang harga barang dalam satuan jam hidup yang dipakai untuk membelinya. Dari situ lahir gerakan kemandirian keuangan modern. Bagian penganggarannya menua; pertanyaan intinya — berapa banyak hidup yang Anda tukar dengan ini — tidak.',
  },
  {
    id: 'millionaire-next-door', jenis: 'buku', judul: 'The Millionaire Next Door', oleh: 'Thomas Stanley & William Danko', tahun: 1996,
    tema: ['Uang'],
    ringkas: 'Penelitian tentang orang kaya di Amerika menemukan pola yang berlawanan dengan gambaran umum: sebagian besar hidup sederhana, mengendarai mobil biasa, dan menabung dalam jumlah besar dari penghasilan menengah. Datanya berumur tiga dekade dan sebagian tidak berlaku lagi, tetapi pemisahan antara terlihat kaya dan menjadi kaya tetap tajam.',
  },
  {
    id: 'i-will-teach', jenis: 'buku', judul: 'I Will Teach You to Be Rich', oleh: 'Ramit Sethi', tahun: 2009,
    tema: ['Uang'],
    ringkas: 'Sistem enam minggu yang blak-blakan: otomatiskan tabungan dan investasi, tekan biaya besar alih-alih menghitung kopi, dan belanjakan sisanya tanpa rasa bersalah pada yang benar-benar Anda sukai. Ditulis untuk pembaca Amerika, jadi bagian rekening dan pajaknya perlu diterjemahkan sendiri ke keadaan di sini.',
  },
  {
    id: 'principles', jenis: 'buku', judul: 'Principles', oleh: 'Ray Dalio', tahun: 2017,
    tema: ['Uang', 'Kepemimpinan'],
    ringkas: 'Dalio menuliskan aturan yang ia pakai untuk hidup dan mengelola perusahaannya: mencari kebenaran secara terbuka, menerima kesalahan sebagai data, dan menimbang pendapat menurut rekam jejak. Bagian pribadi lebih berguna daripada bagian perusahaannya, yang menuntut budaya kerja tertentu untuk dapat berjalan sama sekali.',
  },
  {
    id: 'almanack-naval', jenis: 'buku', judul: 'The Almanack of Naval Ravikant', oleh: 'Eric Jorgenson', tahun: 2020,
    tema: ['Uang', 'Makna'],
    ringkas: 'Kumpulan gagasan Naval tentang kekayaan dan kebahagiaan, disusun dari wawancara dan cuitannya. Bagian kekayaan berpusat pada kepemilikan dan daya ungkit — pengetahuan khusus, kode, dan media yang bekerja tanpa kehadiran Anda. Bagian kebahagiaannya lebih rapuh dan berulang, tetapi beberapa kalimatnya menempel bertahun-tahun.',
  },
  {
    id: 'poor-charlie', jenis: 'buku', judul: "Poor Charlie's Almanack", oleh: 'Charlie Munger (peny. Peter Kaufman)', tahun: 2005,
    tema: ['Uang', 'Pikiran'],
    ringkas: 'Munger menganjurkan mengumpulkan model berpikir dari banyak disiplin — psikologi, fisika, biologi, matematika — dan memakainya bersama, alih-alih memaksakan satu cara pandang pada segalanya. Bagian tentang dua puluh lima sebab salah nilai manusia adalah salah satu daftar terbaik yang pernah ditulis tentang cara pikiran menipu pemiliknya.',
  },

  // ── Hubungan dan komunikasi ───────────────────────────────────────────────
  {
    id: 'how-to-win-friends', jenis: 'buku', judul: 'How to Win Friends and Influence People', oleh: 'Dale Carnegie', tahun: 1936,
    tema: ['Hubungan'],
    ringkas: 'Buku berumur hampir seabad yang bertahan karena isinya sederhana dan sulit: dengarkan sungguh-sungguh, sebut nama orang, hargai apa yang mereka kerjakan, dan jangan menang berdebat dengan mengorbankan hubungan. Sebagian nasihatnya dapat berubah menjadi manipulasi bila dipakai tanpa niat baik — dan Carnegie sendiri menyebutkan itu.',
  },
  {
    id: 'nvc', jenis: 'buku', judul: 'Nonviolent Communication', oleh: 'Marshall Rosenberg', tahun: 1999,
    tema: ['Hubungan'],
    ringkas: 'Empat langkah untuk berbicara saat marah: nyatakan pengamatan tanpa penilaian, sebut perasaan, sebut kebutuhan di baliknya, lalu ajukan permintaan yang jelas. Terasa kaku ketika pertama dicoba dan mudah ditertawakan — tetapi memisahkan pengamatan dari penilaian mengubah hampir semua percakapan yang sedang memanas.',
  },
  {
    id: 'difficult-conversations', jenis: 'buku', judul: 'Difficult Conversations', oleh: 'Douglas Stone, Bruce Patton & Sheila Heen', tahun: 1999,
    tema: ['Hubungan'],
    ringkas: 'Setiap percakapan sulit sebenarnya tiga percakapan sekaligus: tentang apa yang terjadi, tentang perasaan, dan tentang jati diri kita sendiri. Buku ini menunjukkan bagaimana pertengkaran biasanya berpindah diam-diam ke lapis kedua dan ketiga tanpa disadari kedua pihak. Sangat berguna bagi siapa pun yang harus menyampaikan kabar buruk.',
  },
  {
    id: 'never-split', jenis: 'buku', judul: 'Never Split the Difference', oleh: 'Chris Voss', tahun: 2016,
    tema: ['Hubungan'],
    ringkas: 'Bekas juru runding sandera FBI menuliskan cara bernegosiasi yang berpusat pada mendengarkan: menamai perasaan lawan bicara, mengulang kata terakhirnya, dan mengajukan pertanyaan yang membuatnya menjelaskan sendiri. Contohnya dramatis; yang bertahan setelah dramanya lewat adalah kebiasaan bertanya "bagaimana saya bisa melakukan itu?" alih-alih menolak langsung.',
  },
  {
    id: 'influence', jenis: 'buku', judul: 'Influence', oleh: 'Robert Cialdini', tahun: 1984,
    tema: ['Pikiran', 'Hubungan'],
    ringkas: 'Enam jalan pintas yang dipakai orang untuk memutuskan tanpa berpikir panjang — timbal balik, komitmen, bukti sosial, rasa suka, otoritas, dan kelangkaan — beserta cara keenamnya dipakai untuk membujuk. Dibaca sebagai pertahanan, bukan sebagai buku resep: mengenali polanya adalah cara paling murah untuk tidak dipermainkan.',
  },
  {
    id: 'quiet', jenis: 'buku', judul: 'Quiet', oleh: 'Susan Cain', tahun: 2012,
    tema: ['Hubungan', 'Karya & kreativitas'],
    ringkas: 'Cain menunjukkan bagaimana sekolah dan kantor modern dirancang untuk orang yang berpikir sambil bicara, dan apa yang hilang karenanya. Ia membedakan pemalu dari introver, dan memberi alasan mengapa kerja sendiri sering menghasilkan lebih daripada tukar pikiran ramai-ramai. Menenangkan bagi yang selama ini merasa harus berpura-pura.',
  },
  {
    id: 'emotional-intelligence', jenis: 'buku', judul: 'Emotional Intelligence', oleh: 'Daniel Goleman', tahun: 1995,
    tema: ['Hubungan', 'Pikiran'],
    ringkas: 'Buku yang memasukkan istilah kecerdasan emosional ke percakapan umum: mengenali perasaan sendiri, mengelolanya, dan membaca perasaan orang lain. Bagian saraf-otaknya menua, dan klaim bahwa ia lebih menentukan daripada IQ tidak didukung penelitian sesudahnya — tetapi kerangkanya tetap berguna untuk menamai apa yang sedang terjadi.',
  },

  // ── Karya, kreativitas, menulis ───────────────────────────────────────────
  {
    id: 'war-of-art', jenis: 'buku', judul: 'The War of Art', oleh: 'Steven Pressfield', tahun: 2002,
    tema: ['Karya & kreativitas'],
    ringkas: 'Pressfield menamai musuh yang dihadapi setiap orang yang ingin membuat sesuatu: perlawanan — dorongan menunda yang muncul paling kuat justru pada pekerjaan yang paling penting. Bab-babnya sependek halaman. Bagian akhirnya berbelok ke bahasa mistik yang tidak semua pembaca ikuti; dua bagian pertamanya sudah cukup.',
  },
  {
    id: 'bird-by-bird', jenis: 'buku', judul: 'Bird by Bird', oleh: 'Anne Lamott', tahun: 1994,
    tema: ['Karya & kreativitas'],
    ringkas: 'Nasihat menulis yang paling jujur tentang betapa buruknya draf pertama — dan bahwa itu memang seharusnya. Judulnya berasal dari nasihat ayahnya kepada adiknya yang kewalahan mengerjakan tugas tentang burung: kerjakan seekor demi seekor. Berlaku jauh di luar menulis.',
  },
  {
    id: 'on-writing', jenis: 'buku', judul: 'On Writing', oleh: 'Stephen King', tahun: 2000,
    tema: ['Karya & kreativitas'],
    ringkas: 'Separuh riwayat hidup, separuh petunjuk kerja. King menuntut dua hal tanpa tawar: membaca banyak dan menulis setiap hari. Bagian tentang membuang kata keterangan dan memangkas sepuluh persen dari draf pertama adalah nasihat teknis yang langsung dapat dipakai siapa pun yang menulis apa pun.',
  },
  {
    id: 'steal-like-artist', jenis: 'buku', judul: 'Steal Like an Artist', oleh: 'Austin Kleon', tahun: 2012,
    tema: ['Karya & kreativitas'],
    ringkas: 'Tidak ada yang benar-benar asli; yang ada adalah pengaruh yang diolah menjadi milik sendiri. Kleon menyusunnya menjadi sepuluh nasihat pendek dengan gambar tangan, dapat dibaca dalam satu jam. Cocok sebagai dorongan pertama bagi orang yang tertahan karena merasa idenya belum cukup baru.',
  },
  {
    id: 'show-your-work', jenis: 'buku', judul: 'Show Your Work!', oleh: 'Austin Kleon', tahun: 2014,
    tema: ['Karya & kreativitas'],
    ringkas: 'Lanjutan yang menjawab pertanyaan berikutnya: bagaimana orang tahu karya Anda ada tanpa harus berjualan. Jawabannya membagikan prosesnya sedikit demi sedikit, bukan hanya hasil akhirnya. Ringan, dan berguna terutama bagi orang yang enggan mempromosikan diri.',
  },
  {
    id: 'big-magic', jenis: 'buku', judul: 'Big Magic', oleh: 'Elizabeth Gilbert', tahun: 2015,
    tema: ['Karya & kreativitas'],
    ringkas: 'Gilbert mengajak memperlakukan kegiatan mencipta sebagai rasa ingin tahu yang dirawat, bukan sebagai panggilan berat yang menuntut penderitaan. Bagian tentang tidak menuntut karya menghidupi Anda — supaya ia bebas dari beban itu — adalah nasihat paling praktis dalam buku yang selebihnya bernada mistik.',
  },
  {
    id: 'artists-way', jenis: 'buku', judul: "The Artist's Way", oleh: 'Julia Cameron', tahun: 1992,
    tema: ['Karya & kreativitas'],
    ringkas: 'Program dua belas minggu dengan dua kebiasaan inti: menulis tiga halaman tangan tiap pagi tanpa disaring, dan satu janji mingguan dengan diri sendiri untuk mencari kesan baru. Bahasanya kadang penuh istilah spiritual, tetapi kedua kebiasaan itu bertahan dipakai orang yang tidak menganut apa pun dari sisa bukunya.',
  },
  {
    id: 'so-good', jenis: 'buku', judul: "So Good They Can't Ignore You", oleh: 'Cal Newport', tahun: 2012,
    tema: ['Karya & kreativitas'],
    ringkas: 'Newport membantah nasihat "ikuti gairahmu": gairah lebih sering tumbuh dari keahlian yang sudah terbangun daripada mendahuluinya. Ia menganjurkan mengumpulkan modal karier lewat kemampuan langka, lalu menukarnya dengan kendali atas pekerjaan sendiri. Penawar berguna bagi orang yang merasa gagal karena belum menemukan panggilan hidup.',
  },
  {
    id: 'drive', jenis: 'buku', judul: 'Drive', oleh: 'Daniel Pink', tahun: 2009,
    tema: ['Karya & kreativitas', 'Kepemimpinan'],
    ringkas: 'Untuk pekerjaan yang menuntut pikiran, imbalan dan hukuman sering menurunkan mutu hasil. Pink merangkum penelitian yang menunjuk tiga hal lain: kemandirian, penguasaan, dan tujuan. Perlu dicatat bahwa sebagian percobaan yang dikutipnya berdiri di tanah yang lebih goyah daripada kesan bukunya, dan pengaruh imbalan pada pekerjaan sederhana tetap nyata.',
  },

  // ── Makna, riwayat hidup, dan kedokteran ──────────────────────────────────
  {
    id: 'when-breath', jenis: 'buku', judul: 'When Breath Becomes Air', oleh: 'Paul Kalanithi', tahun: 2016,
    tema: ['Kedokteran', 'Makna'],
    ringkas: 'Seorang residen bedah saraf yang hampir menyelesaikan pendidikannya didiagnosis kanker paru stadium akhir pada usia tiga puluh enam. Ia menulis dari kedua sisi sekaligus — dokter yang menerangkan prognosis, dan pasien yang menerimanya. Tidak ada pelajaran yang dipaksakan; yang tersisa adalah pertanyaan tentang apa yang membuat hidup layak ketika waktunya diketahui pendek.',
  },
  {
    id: 'being-mortal', jenis: 'buku', judul: 'Being Mortal', oleh: 'Atul Gawande', tahun: 2014,
    tema: ['Kedokteran', 'Makna'],
    ringkas: 'Gawande memeriksa kegagalan kedokteran modern menghadapi usia lanjut dan akhir hidup: memperpanjang hidup dikuasai dengan baik, sedangkan menanyakan apa yang paling berarti bagi pasien nyaris tidak diajarkan. Berisi pertanyaan-pertanyaan yang seharusnya ditanyakan tiap dokter, dan sulit dibaca tanpa memikirkan orang tua sendiri.',
  },
  {
    id: 'checklist-manifesto', jenis: 'buku', judul: 'The Checklist Manifesto', oleh: 'Atul Gawande', tahun: 2009,
    tema: ['Kedokteran', 'Fokus'],
    ringkas: 'Kegagalan pada pekerjaan rumit sering bukan karena kurang tahu, melainkan karena melewatkan yang sudah diketahui. Gawande mengambil daftar periksa dari penerbangan ke ruang operasi, dan menunjukkan penurunan komplikasi yang menyertainya. Perlu ditambahkan: penelitian berskala besar sesudahnya menemukan hasilnya tidak selalu berulang bila daftar itu dipakai tanpa mengubah budaya kerjanya.',
  },
  {
    id: 'complications', jenis: 'buku', judul: 'Complications', oleh: 'Atul Gawande', tahun: 2002,
    tema: ['Kedokteran'],
    ringkas: 'Kumpulan esai tentang bagian kedokteran yang jarang dibicarakan terbuka: ketidakpastian, penilaian yang keliru, dan bagaimana dokter belajar dengan berlatih pada pasien sungguhan. Jujur dengan cara yang membuat pembaca awam lebih percaya, bukan kurang.',
  },
  {
    id: 'do-no-harm', jenis: 'buku', judul: 'Do No Harm', oleh: 'Henry Marsh', tahun: 2014,
    tema: ['Kedokteran'],
    ringkas: 'Catatan seorang ahli bedah saraf senior tentang operasi yang berhasil, operasi yang gagal, dan keputusan yang masih ia sesali bertahun-tahun kemudian. Ditulis tanpa membela diri. Salah satu gambaran paling jujur tentang beban menanggung akibat dari keputusan yang harus diambil dengan keterangan yang tidak lengkap.',
  },
  {
    id: 'this-is-going-to-hurt', jenis: 'buku', judul: 'This Is Going to Hurt', oleh: 'Adam Kay', tahun: 2017,
    tema: ['Kedokteran'],
    ringkas: 'Buku harian seorang dokter kandungan muda di layanan kesehatan Inggris: lucu di hampir setiap halaman, sampai tiba-tiba tidak lagi. Menggambarkan jam kerja, kelelahan, dan harga yang dibayar tenaga kesehatan muda dengan cara yang sulit dilupakan siapa pun yang sedang menjalani koas.',
  },
  {
    id: 'emperor-maladies', jenis: 'buku', judul: 'The Emperor of All Maladies', oleh: 'Siddhartha Mukherjee', tahun: 2010,
    tema: ['Kedokteran'],
    ringkas: 'Riwayat hidup kanker, dari catatan Mesir kuno sampai terapi bersasaran. Mukherjee memadukan sejarah kedokteran, kisah pasien, dan penjelasan mekanisme dengan mutu tulisan yang jarang ditemukan pada keduanya sekaligus. Panjang, dan tidak ada bagian yang terasa mubazir.',
  },
  {
    id: 'educated', jenis: 'buku', judul: 'Educated', oleh: 'Tara Westover', tahun: 2018,
    tema: ['Makna', 'Ketahanan'],
    ringkas: 'Tumbuh di keluarga yang menolak sekolah dan layanan kesehatan, Westover pertama kali masuk ruang kelas pada usia tujuh belas dan berakhir dengan gelar doktor. Bukunya bukan kisah keberhasilan yang rapi, melainkan tentang harga yang dibayar ketika pendidikan membuat seseorang tidak lagi cocok dengan keluarganya sendiri.',
  },
  {
    id: 'long-walk', jenis: 'buku', judul: 'Long Walk to Freedom', oleh: 'Nelson Mandela', tahun: 1994,
    tema: ['Kepemimpinan', 'Ketahanan'],
    ringkas: 'Riwayat hidup yang ditulis sebagian di dalam penjara: dari desa masa kecil, perlawanan, dua puluh tujuh tahun kurungan, sampai perundingan yang mengakhiri apartheid. Bagian paling menentukan bukan penderitaannya, melainkan keputusan untuk tidak membalas ketika kekuasaan akhirnya di tangannya.',
  },
  {
    id: 'malcolm-x', jenis: 'buku', judul: 'The Autobiography of Malcolm X', oleh: 'Malcolm X & Alex Haley', tahun: 1965,
    tema: ['Makna', 'Ketahanan'],
    ringkas: 'Kisah perubahan berulang: dari jalanan dan penjara, ke keyakinan yang keras, lalu ke perubahan pandangan sesudah menunaikan haji — semuanya dituturkan tanpa menghaluskan tahap sebelumnya. Bagian tentang menyalin seluruh kamus di penjara untuk belajar membaca dengan sungguh-sungguh adalah salah satu bagian paling terkenal tentang belajar mandiri.',
  },
  {
    id: 'anne-frank', jenis: 'buku', judul: 'The Diary of a Young Girl', oleh: 'Anne Frank', tahun: 1947,
    tema: ['Makna'],
    ringkas: 'Catatan harian seorang remaja yang bersembunyi selama dua tahun di Amsterdam. Yang membuatnya bertahan bukan hanya latar sejarahnya, melainkan suaranya: cerdas, jenaka, kadang menjengkelkan seperti remaja mana pun. Justru kenormalan itu yang membuat akhirnya tak tertanggungkan.',
  },
  {
    id: 'tuesdays-morrie', jenis: 'buku', judul: 'Tuesdays with Morrie', oleh: 'Mitch Albom', tahun: 1997,
    tema: ['Makna'],
    ringkas: 'Empat belas percakapan Selasa dengan bekas dosen yang sedang menjelang ajal karena penyakit saraf motorik. Bahasanya sederhana dan tidak berpura-pura mendalam. Yang tertinggal adalah daftar hal yang menurut orang di ambang kematian ternyata tidak pernah penting.',
  },
  {
    id: 'siddhartha', jenis: 'buku', judul: 'Siddhartha', oleh: 'Hermann Hesse', tahun: 1922,
    tema: ['Makna'],
    ringkas: 'Novel pendek tentang seseorang yang meninggalkan segala ajaran untuk mencari pemahamannya sendiri — melewati pertapaan, kekayaan, cinta, dan keputusasaan, sebelum belajar dari sungai. Bukan buku petunjuk, melainkan bacaan yang berbeda maknanya tiap kali dibaca ulang pada usia berbeda.',
  },
  {
    id: 'alchemist', jenis: 'buku', judul: 'The Alchemist', oleh: 'Paulo Coelho', tahun: 1988,
    tema: ['Makna'],
    ringkas: 'Dongeng seorang gembala Andalusia yang menempuh perjalanan ke Mesir mengikuti mimpinya. Sederhana sampai kadang terlalu sederhana, dan tepat karena itu ia menyentuh puluhan juta pembaca. Dibaca sebagai pengingat, bukan sebagai peta.',
  },
  {
    id: 'sapiens', jenis: 'buku', judul: 'Sapiens', oleh: 'Yuval Noah Harari', tahun: 2011,
    tema: ['Pikiran', 'Makna'],
    ringkas: 'Sejarah manusia dalam satu jilid, berpusat pada satu gagasan: manusia menguasai dunia karena mampu bekerja sama dalam jumlah besar lewat cerita bersama — uang, bangsa, hukum. Sangat memikat; sejumlah sejarawan menilai beberapa penyederhanaannya terlalu berani, jadi bacalah sebagai kerangka besar, bukan sebagai rujukan rinci.',
  },
  {
    id: 'factfulness', jenis: 'buku', judul: 'Factfulness', oleh: 'Hans Rosling', tahun: 2018,
    tema: ['Pikiran'],
    ringkas: 'Rosling menunjukkan bahwa hampir semua orang — termasuk ahli — keliru menebak keadaan dunia ke arah yang lebih buruk daripada kenyataannya, lalu memerinci sepuluh naluri yang menyebabkannya. Bukan ajakan berpikir positif, melainkan ajakan memakai angka. Ditulis menjelang wafatnya dan diselesaikan keluarganya.',
  },
  {
    id: 'untethered-soul', jenis: 'buku', judul: 'The Untethered Soul', oleh: 'Michael Singer', tahun: 2007,
    tema: ['Pikiran', 'Makna'],
    ringkas: 'Berangkat dari satu pengamatan sederhana: ada suara yang terus berbicara di kepala, dan Anda bukan suara itu — Anda yang mendengarnya. Dari situ Singer membangun cara melepaskan diri dari lekatan pada pikiran dan perasaan. Bahasanya spiritual tanpa terikat satu agama; bagi sebagian pembaca terlalu longgar, bagi sebagian lain membebaskan.',
  },
  {
    id: 'miracle-mindfulness', jenis: 'buku', judul: 'The Miracle of Mindfulness', oleh: 'Thich Nhat Hanh', tahun: 1975,
    tema: ['Pikiran'],
    ringkas: 'Latihan kesadaran penuh yang dijelaskan lewat hal paling biasa: mencuci piring untuk mencuci piring, bukan untuk selesai mencuci piring. Tipis, tenang, dan lebih mudah diikuti daripada hampir semua buku meditasi lain — terutama bagian tentang bernapas sebagai jangkar ketika pikiran berlarian.',
  },
  {
    id: 'wherever-you-go', jenis: 'buku', judul: 'Wherever You Go, There You Are', oleh: 'Jon Kabat-Zinn', tahun: 1994,
    tema: ['Pikiran'],
    ringkas: 'Kabat-Zinn, yang membawa latihan kesadaran penuh ke dalam kedokteran arus utama, menuliskannya dalam bab-bab sependek satu-dua halaman tanpa istilah agama. Cocok dibaca sedikit demi sedikit. Ia jelas menyatakan bahwa ini latihan, bukan teknik cepat untuk menenangkan diri saat panik.',
  },
  {
    id: 'when-things-fall-apart', jenis: 'buku', judul: 'When Things Fall Apart', oleh: 'Pema Chödrön', tahun: 1997,
    tema: ['Ketahanan', 'Pikiran'],
    ringkas: 'Ditulis untuk saat-saat ketika hidup benar-benar berantakan. Chödrön tidak menawarkan cara memperbaiki keadaan, melainkan cara tinggal di dalamnya tanpa lari — gagasan yang asing bagi budaya yang menuntut solusi. Bacaan yang sering diberikan orang kepada teman yang sedang berduka.',
  },
  {
    id: 'radical-acceptance', jenis: 'buku', judul: 'Radical Acceptance', oleh: 'Tara Brach', tahun: 2003,
    tema: ['Pikiran'],
    ringkas: 'Brach memusatkan perhatian pada rasa "ada yang salah dengan saya" yang diam-diam menyertai banyak orang, dan menawarkan latihan menerima pengalaman apa adanya tanpa menyerah pada perubahan. Menggabungkan psikologi klinis dengan latihan meditasi, dengan contoh dari ruang praktiknya sendiri.',
  },
  {
    id: '7-habits', jenis: 'buku', judul: 'The 7 Habits of Highly Effective People', oleh: 'Stephen Covey', tahun: 1989,
    tema: ['Kebiasaan', 'Kepemimpinan'],
    ringkas: 'Covey menyusun tujuh kebiasaan yang berurutan: dari kemandirian pribadi menuju kerja sama yang menghasilkan lebih daripada penjumlahan. Yang paling sering dipakai orang adalah pemisahan lingkaran pengaruh dari lingkaran kepedulian, dan matriks penting–mendesak. Gayanya berat dan penuh istilah, tetapi kerangkanya bertahan tiga dekade karena memang berdiri sendiri.',
  },
  {
    id: 'extreme-ownership', jenis: 'buku', judul: 'Extreme Ownership', oleh: 'Jocko Willink & Leif Babin', tahun: 2015,
    tema: ['Kepemimpinan'],
    ringkas: 'Dua bekas perwira SEAL menarik pelajaran kepemimpinan dari pertempuran ke dunia kerja: pemimpin menanggung semua kegagalan timnya tanpa kecuali, dan tugas utamanya membuat rencana cukup sederhana untuk dipahami orang paling baru. Berulang dan bernada militer; gagasan tanggung jawab penuhnya tetap tajam.',
  },
  {
    id: 'start-with-why', jenis: 'buku', judul: 'Start with Why', oleh: 'Simon Sinek', tahun: 2009,
    tema: ['Kepemimpinan'],
    ringkas: 'Sinek berargumen bahwa orang mengikuti alasan, bukan produk, dan menyusunnya menjadi lingkaran mengapa–bagaimana–apa. Contohnya kuat sebagai bahan bicara, tetapi dipilih sesudah hasilnya diketahui, dan penjelasan otaknya disederhanakan berlebihan. Berguna sebagai alat menyusun pesan, bukan sebagai teori keberhasilan.',
  },
  {
    id: 'good-to-great', jenis: 'buku', judul: 'Good to Great', oleh: 'Jim Collins', tahun: 2001,
    tema: ['Kepemimpinan'],
    ringkas: 'Penelitian atas perusahaan yang melompat dari baik menjadi luar biasa, menghasilkan gagasan seperti pemimpin rendah hati yang keras kepala dan "dahulukan siapa, baru apa". Perlu diketahui: sebagian perusahaan teladannya kemudian jatuh, dan metodenya memilih pemenang lebih dahulu — kelemahan yang sama yang membayangi hampir semua buku bisnis semacam ini.',
  },
  {
    id: 'zero-to-one', jenis: 'buku', judul: 'Zero to One', oleh: 'Peter Thiel & Blake Masters', tahun: 2014,
    tema: ['Karya & kreativitas'],
    ringkas: 'Catatan kuliah tentang membangun sesuatu yang benar-benar baru alih-alih menyalin yang sudah ada. Berisi pertanyaan yang enak dipakai: kebenaran penting apa yang hanya sedikit orang menyetujuinya bersama Anda? Pandangannya tentang monopoli sengaja provokatif dan layak dibantah, bukan ditelan.',
  },
  {
    id: 'shoe-dog', jenis: 'buku', judul: 'Shoe Dog', oleh: 'Phil Knight', tahun: 2016,
    tema: ['Karya & kreativitas', 'Olahraga'],
    ringkas: 'Riwayat pendiri Nike yang mengejutkan karena kejujurannya: hampir bangkrut berkali-kali, hubungan yang rusak, dan keputusan yang ia akui salah. Bukan buku petunjuk bisnis, melainkan kisah tentang bertahan bertahun-tahun dalam ketidakpastian — dan salah satu riwayat pengusaha yang paling enak dibaca.',
  },
  {
    id: 'discipline-freedom', jenis: 'buku', judul: 'Discipline Equals Freedom', oleh: 'Jocko Willink', tahun: 2017,
    tema: ['Kebiasaan', 'Ketahanan'],
    ringkas: 'Buku pendek berisi jawaban singkat untuk pertanyaan seperti "bagaimana kalau tidak ada motivasi" — jawabannya selalu sama: jangan menunggu, lakukan. Nadanya keras dan berulang, dan itu memang bentuk yang dipilihnya. Berguna sebagai bacaan pagi, bukan sebagai penjelasan.',
  },
  {
    id: 'practice-groundedness', jenis: 'buku', judul: 'The Practice of Groundedness', oleh: 'Brad Stulberg', tahun: 2021,
    tema: ['Makna', 'Ketahanan'],
    ringkas: 'Ditulis sesudah penulisnya sendiri kelelahan mengejar pencapaian. Stulberg menawarkan enam dasar — penerimaan, kehadiran, kesabaran, kerentanan, kebersamaan, dan gerak — sebagai pengganti dorongan tanpa henti. Penawar yang tenang bagi rak buku yang isinya menuntut lebih keras.',
  },
  // ── Film ──────────────────────────────────────────────────────────────────
  {
    id: 'shawshank', jenis: 'film', judul: 'The Shawshank Redemption', oleh: 'Frank Darabont', tahun: 1994,
    tema: ['Ketahanan', 'Makna'],
    ringkas: 'Seorang bankir yang dihukum atas pembunuhan yang tidak ia lakukan menjalani puluhan tahun di penjara tanpa kehilangan kebiasaan membangun: perpustakaan, surat yang dikirim tiap pekan, dan pekerjaan kecil yang dikerjakan sungguh-sungguh. Yang membuat filmnya bertahan bukan pelariannya, melainkan gambaran tentang kesabaran yang bekerja diam-diam bertahun-tahun.',
  },
  {
    id: 'forrest-gump', jenis: 'film', judul: 'Forrest Gump', oleh: 'Robert Zemeckis', tahun: 1994,
    tema: ['Makna'],
    ringkas: 'Hidup seorang lelaki berkecerdasan di bawah rata-rata yang melintasi tiga dekade sejarah Amerika tanpa pernah berhenti menepati janji dan berlari ketika perlu. Filmnya sering dituduh terlalu manis; yang tetap kuat adalah gagasan bahwa keteguhan sederhana kadang membawa lebih jauh daripada kepandaian yang tidak dipakai.',
  },
  {
    id: 'pursuit-happyness', jenis: 'film', judul: 'The Pursuit of Happyness', oleh: 'Gabriele Muccino', tahun: 2006,
    tema: ['Ketahanan', 'Uang'],
    ringkas: 'Diangkat dari kisah nyata Chris Gardner: seorang ayah tunggal yang menjalani magang tanpa upah di perusahaan pialang sambil kehilangan tempat tinggal. Bagian paling jujur bukan keberhasilannya di akhir, melainkan penggambaran betapa sempit jarak antara berjuang dan tenggelam ketika tidak ada jaring pengaman.',
  },
  {
    id: 'good-will-hunting', jenis: 'film', judul: 'Good Will Hunting', oleh: 'Gus Van Sant', tahun: 1997,
    tema: ['Pikiran', 'Hubungan'],
    ringkas: 'Seorang jenius matematika muda yang bekerja sebagai petugas kebersihan kampus menolak setiap kesempatan karena luka masa kecilnya. Yang mengubah keadaan bukan kecerdasannya, melainkan seorang terapis yang sabar dan mengulang satu kalimat sampai ia benar-benar terdengar. Gambaran yang tidak menggampangkan tentang trauma dan bantuan profesional.',
  },
  {
    id: 'dead-poets', jenis: 'film', judul: 'Dead Poets Society', oleh: 'Peter Weir', tahun: 1989,
    tema: ['Makna', 'Karya & kreativitas'],
    ringkas: 'Seorang guru sastra di sekolah asrama yang keras mengajak murid-muridnya berpikir sendiri dan membaca puisi bukan sebagai tugas. Filmnya berani menunjukkan bahwa membangkitkan keberanian pada orang muda dapat berakhir dengan akibat yang berat — dan tidak menyelesaikannya dengan mudah.',
  },
  {
    id: 'whiplash', jenis: 'film', judul: 'Whiplash', oleh: 'Damien Chazelle', tahun: 2014,
    tema: ['Karya & kreativitas', 'Ketahanan'],
    ringkas: 'Seorang penabuh drum muda dan guru yang menyiksanya atas nama kesempurnaan. Sering disalahpahami sebagai pujian terhadap kerja keras tanpa batas; filmnya justru memperlihatkan harganya — hubungan yang hancur dan tubuh yang rusak — dan membiarkan penontonnya memutuskan apakah itu sepadan.',
  },
  {
    id: 'rocky', jenis: 'film', judul: 'Rocky', oleh: 'John G. Avildsen', tahun: 1976,
    tema: ['Olahraga', 'Ketahanan'],
    ringkas: 'Petinju kelas bawah mendapat kesempatan mustahil melawan juara dunia, dan sasarannya bukan menang melainkan bertahan sampai ronde terakhir. Perubahan ukuran keberhasilan itulah yang membuat filmnya bertahan lima puluh tahun, jauh melampaui adegan latihannya yang terkenal.',
  },
  {
    id: 'coach-carter', jenis: 'film', judul: 'Coach Carter', oleh: 'Thomas Carter', tahun: 2005,
    tema: ['Olahraga', 'Kepemimpinan'],
    ringkas: 'Berdasarkan kisah nyata pelatih basket yang mengunci gimnasium karena nilai akademik pemainnya jatuh, meski tim sedang tak terkalahkan. Filmnya tentang menentukan apa yang sebenarnya sedang dilatih: pertandingan pekan ini, atau hidup sesudah bola berhenti memantul.',
  },
  {
    id: 'remember-titans', jenis: 'film', judul: 'Remember the Titans', oleh: 'Boaz Yakin', tahun: 2000,
    tema: ['Olahraga', 'Kepemimpinan'],
    ringkas: 'Tim futbol Amerika sekolah menengah yang baru disatukan dari dua sekolah terpisah rasial pada 1971. Yang digambarkan dengan baik adalah caranya: bukan pidato, melainkan latihan bersama yang memaksa orang saling mengenal sebelum sempat saling membenci.',
  },
  {
    id: 'invictus', jenis: 'film', judul: 'Invictus', oleh: 'Clint Eastwood', tahun: 2009,
    tema: ['Kepemimpinan', 'Olahraga'],
    ringkas: 'Mandela memakai Piala Dunia rugbi 1995 sebagai alat menyatukan negara yang baru keluar dari apartheid. Menarik justru pada bagian politiknya: keputusan mempertahankan lambang tim yang dibenci pendukungnya sendiri, karena tujuannya bukan menang telak melainkan merangkul.',
  },
  {
    id: 'moneyball', jenis: 'film', judul: 'Moneyball', oleh: 'Bennett Miller', tahun: 2011,
    tema: ['Olahraga', 'Pikiran'],
    ringkas: 'Manajer tim bisbol bermodal kecil menyusun pemain berdasarkan data yang diabaikan pemandu bakat berpengalaman. Film terbaik yang ada tentang bagaimana angka menantang naluri lama — termasuk penolakan, kesalahan, dan kenyataan bahwa data pun tidak menjamin gelar juara.',
  },
  {
    id: 'ford-ferrari', jenis: 'film', judul: 'Ford v Ferrari', oleh: 'James Mangold', tahun: 2019,
    tema: ['Karya & kreativitas', 'Olahraga'],
    ringkas: 'Perancang mobil dan pembalap yang keras kepala mencoba memenangkan Le Mans melawan Ferrari — sambil bertengkar dengan perusahaan yang membiayai mereka. Filmnya tentang perbedaan antara membuat sesuatu dengan benar dan membuatnya terlihat baik dalam rapat.',
  },
  {
    id: 'beautiful-mind', jenis: 'film', judul: 'A Beautiful Mind', oleh: 'Ron Howard', tahun: 2001,
    tema: ['Pikiran', 'Kedokteran'],
    ringkas: 'Kisah matematikawan John Nash yang hidup dengan skizofrenia. Sebagai film, kuat pada gambaran belajar hidup berdampingan dengan gejala alih-alih menunggu sembuh. Sebagai gambaran penyakitnya, ada penyederhanaan yang cukup besar — halusinasi Nash sebenarnya terutama pendengaran, bukan penglihatan.',
  },
  {
    id: 'theory-everything', jenis: 'film', judul: 'The Theory of Everything', oleh: 'James Marsh', tahun: 2014,
    tema: ['Ketahanan', 'Hubungan'],
    ringkas: 'Stephen Hawking, dari diagnosis penyakit saraf motorik pada usia dua puluh satu sampai karya besarnya, dilihat sebagian besar lewat pernikahannya. Filmnya memilih hubungan alih-alih fisika, dan karena itu jujur tentang beban yang ditanggung pendamping seorang penyintas penyakit menahun.',
  },
  {
    id: 'hidden-figures', jenis: 'film', judul: 'Hidden Figures', oleh: 'Theodore Melfi', tahun: 2016,
    tema: ['Ketahanan', 'Karya & kreativitas'],
    ringkas: 'Tiga matematikawan perempuan kulit hitam di NASA pada era pemisahan rasial, mengerjakan perhitungan yang menerbangkan astronaut Amerika pertama ke orbit. Tentang kompetensi yang tidak dapat lagi diabaikan — dan tentang berapa banyak yang harus ditanggung sebelum sampai ke titik itu.',
  },
  {
    id: '12-angry-men', jenis: 'film', judul: '12 Angry Men', oleh: 'Sidney Lumet', tahun: 1957,
    tema: ['Pikiran'],
    ringkas: 'Dua belas juri di satu ruangan panas, sebelas yakin bersalah, satu meminta mereka berpikir sekali lagi. Pelajaran paling padat yang pernah difilmkan tentang bukti, prasangka, tekanan kelompok, dan keberanian menahan keputusan yang tampak sudah jelas.',
  },
  {
    id: 'life-is-beautiful', jenis: 'film', judul: 'Life Is Beautiful', oleh: 'Roberto Benigni', tahun: 1997,
    tema: ['Makna', 'Ketahanan'],
    ringkas: 'Seorang ayah meyakinkan anaknya bahwa kamp konsentrasi adalah permainan berhadiah, demi melindungi jiwanya. Perpaduan yang mustahil antara lucu dan mengerikan, dan tepat karena itu ia bekerja: gambaran tentang apa yang sanggup dilakukan orang tua untuk anaknya.',
  },
  {
    id: 'schindler', jenis: 'film', judul: "Schindler's List", oleh: 'Steven Spielberg', tahun: 1993,
    tema: ['Makna', 'Kepemimpinan'],
    ringkas: 'Seorang pengusaha Jerman yang mula-mula mencari untung dari perang berakhir menghabiskan seluruh hartanya untuk menyelamatkan lebih dari seribu pekerja Yahudi. Perubahan itu digambarkan bertahap, tanpa satu pun titik ajaib — dan adegan penutupnya tentang berapa banyak lagi yang bisa diselamatkan sulit dilupakan.',
  },
  {
    id: 'soul', jenis: 'film', judul: 'Soul', oleh: 'Pete Docter', tahun: 2020,
    tema: ['Makna'],
    ringkas: 'Seorang guru musik yang seumur hidup mengejar satu kesempatan besar akhirnya harus menjawab pertanyaan berbeda: apakah hidup harus punya tujuan besar untuk layak dijalani? Jawabannya tidak sesederhana yang diduga penonton, dan itulah yang membuat film anak-anak ini sering ditonton ulang orang dewasa.',
  },
  {
    id: 'inside-out', jenis: 'film', judul: 'Inside Out', oleh: 'Pete Docter', tahun: 2015,
    tema: ['Pikiran', 'Hubungan'],
    ringkas: 'Lima emosi seorang anak perempuan digambarkan sebagai tokoh di dalam kepalanya. Gagasan intinya justru bagian tersulit dalam kesehatan jiwa: kesedihan bukan gangguan yang harus dibuang: ia yang memanggil pertolongan orang lain, dan tanpa ia kebahagiaan pun tidak utuh.',
  },
  {
    id: 'up', jenis: 'film', judul: 'Up', oleh: 'Pete Docter', tahun: 2009,
    tema: ['Makna', 'Hubungan'],
    ringkas: 'Sepuluh menit pertamanya menceritakan seumur pernikahan hampir tanpa dialog, dan sisanya tentang seorang duda tua yang belajar bahwa petualangan yang ia tunda selama ini ternyata sudah ia jalani. Tentang cita-cita yang ditunda, dan tentang mengizinkan hidup baru dimulai setelah kehilangan.',
  },
  {
    id: 'ratatouille', jenis: 'film', judul: 'Ratatouille', oleh: 'Brad Bird', tahun: 2007,
    tema: ['Karya & kreativitas'],
    ringkas: 'Seekor tikus dengan indra perasa luar biasa memasak di dapur Paris. Kalimat pentingnya dijelaskan seorang kritikus di akhir: bukan semua orang bisa menjadi seniman besar, tetapi seniman besar bisa datang dari mana saja — pembedaan yang lebih jujur daripada nasihat "semua orang bisa asal mau".',
  },
  {
    id: 'kung-fu-panda', jenis: 'film', judul: 'Kung Fu Panda', oleh: 'Mark Osborne & John Stevenson', tahun: 2008,
    tema: ['Ketahanan', 'Karya & kreativitas'],
    ringkas: 'Panda gemuk yang dipilih sebagai pendekar terpilih ternyata hanya dapat dilatih dengan cara yang sesuai dirinya sendiri, bukan cara yang berhasil pada murid lain. Gulungan sakti yang kosong di akhir adalah salah satu penyampaian paling ringkas tentang kepercayaan diri yang tidak berasal dari luar.',
  },
  {
    id: 'intouchables', jenis: 'film', judul: 'The Intouchables', oleh: 'Olivier Nakache & Éric Toledano', tahun: 2011,
    tema: ['Hubungan', 'Kedokteran'],
    ringkas: 'Seorang bangsawan lumpuh dari leher ke bawah mempekerjakan perawat dari pinggiran kota yang memperlakukannya tanpa rasa kasihan sedikit pun — dan justru itu yang mengembalikan hidupnya. Berdasarkan kisah nyata; berguna bagi siapa pun yang bekerja merawat orang.',
  },
  {
    id: '127-hours', jenis: 'film', judul: '127 Hours', oleh: 'Danny Boyle', tahun: 2010,
    tema: ['Ketahanan'],
    ringkas: 'Kisah nyata pendaki yang lengannya terjepit batu di ngarai terpencil selama lima hari. Bagian yang paling menghantui bukan tindakan yang harus ia ambil untuk selamat, melainkan kesadarannya bahwa ia tidak memberi tahu siapa pun ke mana ia pergi.',
  },
  {
    id: 'into-the-wild', jenis: 'film', judul: 'Into the Wild', oleh: 'Sean Penn', tahun: 2007,
    tema: ['Makna'],
    ringkas: 'Seorang lulusan muda membakar uangnya dan pergi ke belantara Alaska mencari hidup yang lebih murni. Sering dikira film pemujaan kebebasan; sebenarnya sebuah peringatan — kalimat yang ia tulis menjelang akhir, bahwa kebahagiaan baru nyata ketika dibagikan, membalik seluruh perjalanannya.',
  },
  {
    id: 'free-solo', jenis: 'film', judul: 'Free Solo', oleh: 'Jimmy Chin & Elizabeth Chai Vasarhelyi', tahun: 2018,
    tema: ['Olahraga', 'Ketahanan'],
    ringkas: 'Film dokumenter tentang pendakian El Capitan tanpa tali. Bagian yang paling berguna bukan pendakiannya, melainkan persiapannya: bertahun-tahun latihan, ratusan pengulangan gerakan yang sama, dan penolakan berangkat ketika keadaannya belum tepat. Ketenangan yang tampak spontan itu ternyata hasil pekerjaan yang membosankan.',
  },
  {
    id: 'last-dance', jenis: 'film', judul: 'The Last Dance', oleh: 'Jason Hehir', tahun: 2020,
    tema: ['Olahraga', 'Kepemimpinan'],
    ringkas: 'Seri dokumenter tentang musim terakhir Michael Jordan bersama Chicago Bulls. Menampilkan standar kerja yang luar biasa sekaligus harganya bagi rekan setim — dan tidak menyembunyikan bahwa kepemimpinan yang menghasilkan gelar juara di sini juga menyakiti banyak orang di sekitarnya.',
  },
  {
    id: 'jiro', jenis: 'film', judul: 'Jiro Dreams of Sushi', oleh: 'David Gelb', tahun: 2011,
    tema: ['Karya & kreativitas'],
    ringkas: 'Seorang koki sushi berusia delapan puluhan yang masih mencoba memperbaiki pekerjaan yang sama setiap hari selama puluhan tahun. Gambaran paling tenang tentang penguasaan: bukan lompatan besar, melainkan pengulangan yang diperbaiki sedikit demi sedikit — termasuk bagian yang tidak nyaman, yaitu apa artinya itu bagi anak-anaknya.',
  },
  {
    id: 'my-octopus-teacher', jenis: 'film', judul: 'My Octopus Teacher', oleh: 'Pippa Ehrlich & James Reed', tahun: 2020,
    tema: ['Makna', 'Pikiran'],
    ringkas: 'Seorang pembuat film yang kelelahan mulai menyelam tiap hari di hutan rumput laut dan perlahan menjalin hubungan dengan seekor gurita. Tentang perhatian yang tekun pada satu hal kecil, dan bagaimana kebiasaan harian yang sederhana mengembalikan seseorang dari keletihan yang dalam.',
  },
  {
    id: 'spirited-away', jenis: 'film', judul: 'Spirited Away', oleh: 'Hayao Miyazaki', tahun: 2001,
    tema: ['Ketahanan', 'Makna'],
    ringkas: 'Seorang anak perempuan penakut terjebak di dunia roh dan harus bekerja untuk menyelamatkan orang tuanya. Yang menyelamatkannya bukan kekuatan ajaib melainkan kerja keras, kesopanan, dan mengingat namanya sendiri — gagasan yang bertahan jauh sesudah gambarnya yang indah selesai ditonton.',
  },
  {
    id: 'groundhog-day', jenis: 'film', judul: 'Groundhog Day', oleh: 'Harold Ramis', tahun: 1993,
    tema: ['Kebiasaan', 'Makna'],
    ringkas: 'Seorang lelaki sinis terjebak mengulang hari yang sama tanpa henti. Ia melewati semua tahap — main-main, putus asa, lalu akhirnya memakai waktunya untuk belajar dan menolong orang. Salah satu gambaran terbaik tentang apa yang terjadi bila seseorang berhenti mengejar hasil dan mulai memperbaiki harinya sendiri.',
  },
  {
    id: 'peaceful-warrior', jenis: 'film', judul: 'Peaceful Warrior', oleh: 'Victor Salva', tahun: 2006,
    tema: ['Olahraga', 'Pikiran'],
    ringkas: 'Seorang atlet senam kampus yang mengalami kecelakaan berat belajar dari seorang penjaga pompa bensin bahwa perhatian pada saat ini lebih menentukan daripada obsesi pada kemenangan. Sederhana dan kadang menggurui; tetapi bagian pemulihan cedera dan latihan perhatian tetap mengena bagi yang pernah mengalaminya.',
  },
  {
    id: 'gattaca', jenis: 'film', judul: 'Gattaca', oleh: 'Andrew Niccol', tahun: 1997,
    tema: ['Ketahanan', 'Kedokteran'],
    ringkas: 'Di dunia tempat nasib ditentukan hasil pemeriksaan genetik sejak lahir, seorang lelaki yang dinyatakan tidak memenuhi syarat berusaha menembusnya. Kalimat kuncinya — bahwa ia tidak pernah menyisakan tenaga untuk perjalanan pulang — menjadi salah satu gambaran paling tajam tentang usaha melampaui ramalan angka.',
  },
  {
    id: 'chef', jenis: 'film', judul: 'Chef', oleh: 'Jon Favreau', tahun: 2014,
    tema: ['Karya & kreativitas', 'Hubungan'],
    ringkas: 'Seorang koki restoran mewah yang kehilangan pekerjaan memulai lagi dari truk makanan bersama anaknya. Tentang kembali mengerjakan sesuatu yang benar-benar disukai setelah bertahun-tahun memasak menurut selera orang lain — dan tentang bekerja berdampingan sebagai cara memperbaiki hubungan.',
  },
]
