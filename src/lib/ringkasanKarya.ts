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

// Nilainya dipakai menyaring dan dibandingkan dengan ===, jadi tidak diubah.
export const JENIS_LABEL: Record<JenisKarya, string> = { buku: 'Book', film: 'Film' }

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
  'Habits', 'Focus', 'Resilience', 'Mind', 'Sleep & body', 'Money',
  'Relationships', 'Work & creativity', 'Medicine', 'Meaning', 'Sport', 'Leadership',
]

export const KARYA: Karya[] = [
  // ── Kebiasaan & perubahan perilaku ────────────────────────────────────────
  {
    id: 'atomic-habits', jenis: 'buku', judul: 'Atomic Habits', oleh: 'James Clear', tahun: 2018,
    tema: ['Habits'],
    ringkas: 'Big change rarely comes from big resolve; it comes from small habits repeated. Clear breaks a habit into four parts — cue, craving, response, reward — then shows how to alter each: make the good ones obvious and easy, the bad ones hidden and hard. The part readers most often skip is the most important: changing how you see yourself, rather than merely chasing a target.',
  },
  {
    id: 'power-of-habit', jenis: 'buku', judul: 'The Power of Habit', oleh: 'Charles Duhigg', tahun: 2012,
    tema: ['Habits'],
    ringkas: 'Duhigg traces how the brain automates behaviour through the cue–routine–reward loop, and why that loop cannot be erased — only the routine can be swapped while cue and reward stay put. Its strength is the real cases, from an aluminium plant to a toothpaste campaign. Its weakness: some of the research it cites has held up less well than it appeared when the book was written.',
  },
  {
    id: 'tiny-habits', jenis: 'buku', judul: 'Tiny Habits', oleh: 'BJ Fogg', tahun: 2019,
    tema: ['Habits'],
    ringkas: 'Fogg builds behaviour from three things that must coincide: motivation, ability, and a prompt. Because motivation rises and falls outside your control, the most reliable lever is making the behaviour very small — two push-ups, one sentence — then anchoring it to a habit you already have. The small celebration afterwards is not decoration; it is what makes the brain mark the act as worth repeating.',
  },
  {
    id: 'compound-effect', jenis: 'buku', judul: 'The Compound Effect', oleh: 'Darren Hardy', tahun: 2010,
    tema: ['Habits'],
    ringkas: 'One idea, patiently repeated: small boring choices, multiplied by time, beat occasional grand efforts. Hardy asks readers to track a single behaviour for several weeks before judging anything, because the result is invisible in the early ones. The book is thin and repetitive — and the repetition is part of the point.',
  },
  {
    id: 'indistractable', jenis: 'buku', judul: 'Indistractable', oleh: 'Nir Eyal', tahun: 2019,
    tema: ['Focus', 'Habits'],
    ringkas: 'Eyal argues that distraction does not begin with the phone but with a discomfort we are trying to escape — boredom, anxiety, doubt. So he starts on the inside: name the internal trigger, schedule time for what you value, and only then close off the external routes to distraction. Interesting read alongside Eyal\'s earlier book on how products are built to hook people.',
  },
  {
    id: 'atomic-focus-onething', jenis: 'buku', judul: 'The ONE Thing', oleh: 'Gary Keller & Jay Papasan', tahun: 2013,
    tema: ['Focus'],
    ringkas: 'One question carries the book: what is the one thing that, once done, makes everything else easier or unnecessary? Keller attacks the long to-do list as the subtlest way to stay busy without moving. What makes it useful is not the idea but the discipline of blocking time for that one thing first, before the day is filled by other people.',
  },

  // ── Fokus, waktu, perhatian ───────────────────────────────────────────────
  {
    id: 'deep-work', jenis: 'buku', judul: 'Deep Work', oleh: 'Cal Newport', tahun: 2016,
    tema: ['Focus', 'Work & creativity'],
    ringkas: 'Newport names deep work — concentrating without interruption on something hard — as a capacity that is becoming both rarer and more valuable. He offers ways to schedule it rather than wait for the mood, and shows how long the brain needs to return to focus after a single interruption. The tone towards social media is harsh, and deliberately so.',
  },
  {
    id: 'digital-minimalism', jenis: 'buku', judul: 'Digital Minimalism', oleh: 'Cal Newport', tahun: 2019,
    tema: ['Focus'],
    ringkas: 'Not a call to throw the phone away, but a demand that each app prove itself: does it serve something you genuinely value, and is it the best way of serving it? Newport proposes a thirty-day pause, then reintroducing apps one at a time with explicit rules of use. Its strongest passages are about solitude — and what is lost when it never happens again.',
  },
  {
    id: 'make-time', jenis: 'buku', judul: 'Make Time', oleh: 'Jake Knapp & John Zeratsky', tahun: 2018,
    tema: ['Focus'],
    ringkas: 'Two former product designers write up how they fight the very designs they helped build. The shape is simple: pick one highlight for the day, remove the obstacles, protect energy through sleep and movement, then reflect in the evening. It is a collection of small tactics rather than a grand system — which is exactly what makes it easy to try.',
  },
  {
    id: 'four-thousand-weeks', jenis: 'buku', judul: 'Four Thousand Weeks', oleh: 'Oliver Burkeman', tahun: 2021,
    tema: ['Meaning', 'Focus'],
    ringkas: 'Burkeman inverts the whole idea of productivity: a human life is roughly four thousand weeks, and no system will ever make that enough. Instead of chasing mastery over time, he invites you to accept the limit and choose deliberately what you will not do. The book is calming precisely because it stops promising control.',
  },
  {
    id: 'gtd', jenis: 'buku', judul: 'Getting Things Done', oleh: 'David Allen', tahun: 2001,
    tema: ['Focus'],
    ringkas: 'Allen starts from one observation: the mind is bad at holding reminders, and that burden is what exhausts. His system moves everything outstanding out of the head into one trusted place, breaks it into clear next actions, then reviews it regularly. It is heavy to set up and demands maintenance — but the frame of \'what is the next action\' survives even when the system is not followed in full.',
  },
  {
    id: 'essentialism', jenis: 'buku', judul: 'Essentialism', oleh: 'Greg McKeown', tahun: 2014,
    tema: ['Focus'],
    ringkas: 'McKeown attacks the habit of saying yes to a little of everything. The point is not doing less in order to relax, but concentrating almost all your energy on what genuinely matters and declining the rest firmly. The passages on how to decline without damaging a relationship are what people use most after reading it.',
  },
  {
    id: 'flow', jenis: 'buku', judul: 'Flow', oleh: 'Mihaly Csikszentmihalyi', tahun: 1990,
    tema: ['Focus', 'Meaning'],
    ringkas: 'From thousands of everyday experience reports, Csikszentmihalyi found that the most satisfying moments are not moments of rest but moments of absorption in an activity whose challenge matches your ability. He sets out the conditions: clear goals, immediate feedback, undivided attention. The language is academic, but the idea underlies almost everything written about focus since.',
  },

  // ── Ketahanan, mental, dan Stoa ───────────────────────────────────────────
  {
    id: 'mans-search', jenis: 'buku', judul: "Man's Search for Meaning", oleh: 'Viktor Frankl', tahun: 1946,
    tema: ['Meaning', 'Resilience'],
    ringkas: 'Frankl, a psychiatrist who survived the camps, records what distinguished those who endured: not physical strength but having something still demanding to be finished — work, a person loved, or a chosen stance towards suffering that cannot be changed. The first half is testimony, the second the basis of logotherapy. Short, and never cheaply consoling.',
  },
  {
    id: 'meditations', jenis: 'buku', judul: 'Meditations', oleh: 'Marcus Aurelius', tahun: 180,
    tema: ['Mind', 'Resilience'],
    ringkas: 'The private notes of an emperor, never meant for publication, and that is their strength: he counsels himself, over and over, on the same things — govern your judgements, do the work in front of you, remember you will die. There is no system here, which is why it reads as honest rather than as instruction.',
  },
  {
    id: 'seneca-letters', jenis: 'buku', judul: 'Letters from a Stoic', oleh: 'Seneca', tahun: 65,
    tema: ['Mind', 'Meaning'],
    ringkas: 'Letters to a friend on time, death, luxury and friendship — written in sharp and often funny prose. Seneca returns repeatedly to one point: we are miserly with money and reckless with time, though only the second cannot be recovered.',
  },
  {
    id: 'epictetus', jenis: 'buku', judul: 'Enchiridion (Buku Pegangan)', oleh: 'Epictetus', tahun: 125,
    tema: ['Mind'],
    ringkas: 'A digest of the teaching of a former slave who became a teacher: separate firmly what is within your control — judgement, desire, action — from what is not, and stop making demands of the second. Its sentences are blunt and hard to argue with.',
  },
  {
    id: 'obstacle-way', jenis: 'buku', judul: 'The Obstacle Is the Way', oleh: 'Ryan Holiday', tahun: 2014,
    tema: ['Resilience', 'Mind'],
    ringkas: 'Holiday turns Stoicism into three practical steps: see the situation as it is, act on the part that can be moved, and bear the rest. Built from historical figures who turned an obstacle into the route itself. Light on argument, strong on momentum.',
  },
  {
    id: 'ego-enemy', jenis: 'buku', judul: 'Ego Is the Enemy', oleh: 'Ryan Holiday', tahun: 2016,
    tema: ['Mind'],
    ringkas: 'The greatest danger to a talented person is not failure but the need to feel special. Holiday follows it through three states — while aspiring, while succeeding, and while failing — and shows how ego quietly closes off learning in each of them.',
  },
  {
    id: 'daily-stoic', jenis: 'buku', judul: 'The Daily Stoic', oleh: 'Ryan Holiday & Stephen Hanselman', tahun: 2016,
    tema: ['Mind'],
    ringkas: 'One Stoic passage for each day of the year, with a short commentary. The form makes it work as a daily habit rather than a single read. Useful as a doorway before going to the originals.',
  },
  {
    id: 'cant-hurt-me', jenis: 'buku', judul: "Can't Hurt Me", oleh: 'David Goggins', tahun: 2018,
    tema: ['Resilience', 'Sport'],
    ringkas: 'A hard life story: from a childhood of violence and poverty to special forces and ultrarunning. The idea most often quoted from it is the \'forty per cent rule\' — that the point where you feel finished is far from your actual limit. The tone is relentless and will not suit everyone; the underlying claim is that discomfort can be trained.',
  },
  {
    id: 'do-hard-things', jenis: 'buku', judul: 'Do Hard Things', oleh: 'Steve Magness', tahun: 2022,
    tema: ['Resilience', 'Sport'],
    ringkas: 'Magness dismantles old-style toughness — shouting, forcing, ignoring pain — and replaces it with what the research actually shows: reading bodily signals accurately, responding calmly, and building genuine confidence from evidence rather than bravado. A direct rebuttal to much of the endurance-culture canon.',
  },
  {
    id: 'peak-performance', jenis: 'buku', judul: 'Peak Performance', oleh: 'Brad Stulberg & Steve Magness', tahun: 2017,
    tema: ['Sport', 'Focus'],
    ringkas: 'One formula that applies to athletes and to knowledge workers alike: stress plus rest produces growth — and removing either removes the result. The book explains why recovery is not the opposite of training but part of it, and how to build routines that make hard work repeatable.',
  },
  {
    id: 'grit', jenis: 'buku', judul: 'Grit', oleh: 'Angela Duckworth', tahun: 2016,
    tema: ['Resilience'],
    ringkas: 'Duckworth argues that sustained interest combined with perseverance often matters more than talent. She offers ways to grow it: interest, deliberate practice, a purpose beyond yourself, and hope. Worth reading alongside the later criticism, which holds that the effect is smaller than the book\'s popularity suggests.',
  },
  {
    id: 'mindset', jenis: 'buku', judul: 'Mindset', oleh: 'Carol Dweck', tahun: 2006,
    tema: ['Mind'],
    ringkas: 'Dweck distinguishes two ways of seeing ability: as fixed, or as something that grows through effort and strategy. The second changes how people meet failure — from evidence of a limit to information about method. Later replication work has been mixed, and the strongest version of the claim has not held up.',
  },
  {
    id: 'body-keeps-score', jenis: 'buku', judul: 'The Body Keeps the Score', oleh: 'Bessel van der Kolk', tahun: 2014,
    tema: ['Mind', 'Medicine'],
    ringkas: 'Trauma is not only a bad memory; it changes how body and brain respond to ordinary situations. Van der Kolk records decades of practice and a range of recovery approaches, from talking therapy to movement and bodywork. Some of the therapies he describes have a weaker evidence base than the book\'s confidence implies.',
  },
  {
    id: 'why-zebras', jenis: 'buku', judul: "Why Zebras Don't Get Ulcers", oleh: 'Robert Sapolsky', tahun: 1994,
    tema: ['Mind', 'Medicine'],
    ringkas: 'The human stress response was built for emergencies lasting minutes, not for anxiety running for years. Sapolsky explains what happens when that system stays switched on — to blood vessels, digestion, immunity, memory and sleep — with enough humour that the biology stays readable.',
  },
  {
    id: 'dopamine-nation', jenis: 'buku', judul: 'Dopamine Nation', oleh: 'Anna Lembke', tahun: 2021,
    tema: ['Mind', 'Habits'],
    ringkas: 'Lembke, an addiction psychiatrist, explains why a world full of easy pleasure raises dissatisfaction: the brain balances pleasure with pain, and repeated stimulation shifts the set point. Her clinical cases are the strongest part, and the proposed remedy — a deliberate period of abstinence — is described with its difficulty intact.',
  },
  {
    id: 'molecule-of-more', jenis: 'buku', judul: 'The Molecule of More', oleh: 'Daniel Lieberman & Michael Long', tahun: 2018,
    tema: ['Mind'],
    ringkas: 'The book separates two kinds of pleasure: pursuing something, and enjoying what you already have. They run on different brain pathways, and people who are very strong at the first are often poor at the second. The framing is useful; the popular science around it is stretched further than the evidence supports.',
  },
  {
    id: 'behave', jenis: 'buku', judul: 'Behave', oleh: 'Robert Sapolsky', tahun: 2017,
    tema: ['Mind'],
    ringkas: 'A single act traced backwards: what happened a second earlier in the brain, a minute earlier in hormones, a year earlier in development, and centuries earlier in culture and evolution. Long and demanding, and the most complete answer available to why people do what they do.',
  },
  {
    id: 'thinking-fast-slow', jenis: 'buku', judul: 'Thinking, Fast and Slow', oleh: 'Daniel Kahneman', tahun: 2011,
    tema: ['Mind'],
    ringkas: 'Kahneman summarises a lifetime of research on two modes of thinking: fast and automatic, slow and effortful. He shows the systematic errors that arise from the first — anchoring, availability, loss aversion. Note that several of the priming studies described have since failed to replicate, which the author acknowledged.',
  },
  {
    id: 'thinking-in-bets', jenis: 'buku', judul: 'Thinking in Bets', oleh: 'Annie Duke', tahun: 2018,
    tema: ['Mind'],
    ringkas: 'A former professional poker player teaches how to separate the quality of a decision from its outcome — two things people constantly conflate, especially after the result is known. She offers ways to think in probabilities and to build a group that will actually disagree with you.',
  },
  {
    id: 'antifragile', jenis: 'buku', judul: 'Antifragile', oleh: 'Nassim Nicholas Taleb', tahun: 2012,
    tema: ['Mind', 'Resilience'],
    ringkas: 'Some things break under shock, some withstand it, and some get stronger — and Taleb argues the third has never had a name. He applies it to bodies, careers, cities and finance. Repetitive and combative in tone, but the central distinction is genuinely useful.',
  },
  {
    id: 'black-swan', jenis: 'buku', judul: 'The Black Swan', oleh: 'Nassim Nicholas Taleb', tahun: 2007,
    tema: ['Mind', 'Money'],
    ringkas: 'The events that shape history most are the ones least anticipated, and people are skilled at inventing explanations afterwards as though it had all made sense from the start. Taleb attacks risk models built on the assumption that tomorrow resembles yesterday.',
  },

  // ── Tidur, tubuh, dan umur panjang ────────────────────────────────────────
  {
    id: 'why-we-sleep', jenis: 'buku', judul: 'Why We Sleep', oleh: 'Matthew Walker', tahun: 2017,
    tema: ['Sleep & body', 'Medicine'],
    ringkas: 'Walker gathers the evidence on the role of sleep in memory, immunity, hormones and mood, then asks the reader to treat sleep as a requirement rather than as leftover time. Important caveat: a detailed critique has documented factual errors and overstatements in the book, so treat the specific figures with care while the general direction stands.',
  },
  {
    id: 'breath', jenis: 'buku', judul: 'Breath', oleh: 'James Nestor', tahun: 2020,
    tema: ['Sleep & body'],
    ringkas: 'Nestor traces how human breathing changed, and what happens when mouth breathing becomes the habit. The nasal-breathing and slow-breathing sections are reasonably supported; some of the more dramatic claims go well beyond the evidence.',
  },
  {
    id: 'spark', jenis: 'buku', judul: 'Spark', oleh: 'John Ratey', tahun: 2008,
    tema: ['Sleep & body', 'Mind'],
    ringkas: 'Not about muscle but about the brain: how regular movement affects learning, anxiety, attention and mood. Ratey writes it through school and patient stories that make the mechanisms stick. The effect sizes are presented more confidently than the research warrants.',
  },
  {
    id: 'outlive', jenis: 'buku', judul: 'Outlive', oleh: 'Peter Attia', tahun: 2023,
    tema: ['Medicine', 'Sleep & body'],
    ringkas: 'Attia separates lifespan from healthspan, then concentrates on the four diseases that most determine both. The training section is strong — particularly the idea of training now for the physical demands of your last decade. Some of the supplement and screening recommendations run ahead of the evidence, which he states openly.',
  },
  {
    id: 'endure', jenis: 'buku', judul: 'Endure', oleh: 'Alex Hutchinson', tahun: 2018,
    tema: ['Sport'],
    ringkas: 'What actually stops a person when they tire — muscle, heart, or brain? Hutchinson follows the long argument about the limits of endurance, from the central-governor theory to experiments in which belief alone changed performance. Even-handed where the field is not settled.',
  },
  {
    id: 'born-to-run', jenis: 'buku', judul: 'Born to Run', oleh: 'Christopher McDougall', tahun: 2009,
    tema: ['Sport'],
    ringkas: 'A journey in search of a long-distance running people in Mexico, woven together with the idea that humans evolved to run far. The story is extraordinary and infectious. But the claims about minimalist shoes preventing injury were never demonstrated, and later trials did not support them.',
  },
  {
    id: 'sports-gene', jenis: 'buku', judul: 'The Sports Gene', oleh: 'David Epstein', tahun: 2013,
    tema: ['Sport'],
    ringkas: 'Epstein tests the talent-versus-training argument against evidence far messier than either camp allows: genes affect not only starting ability but how quickly someone responds to training at all. The most honest book on the question, precisely because it refuses to settle it.',
  },
  {
    id: 'range', jenis: 'buku', judul: 'Range', oleh: 'David Epstein', tahun: 2019,
    tema: ['Work & creativity'],
    ringkas: 'An orderly rebuttal to the idea that mastery always demands early specialisation. Epstein shows that in fields where the rules are unclear and feedback is slow, people with broad experience outperform early specialists. Sits deliberately against the ten-thousand-hours story.',
  },
  {
    id: 'peak-ericsson', jenis: 'buku', judul: 'Peak', oleh: 'Anders Ericsson & Robert Pool', tahun: 2016,
    tema: ['Work & creativity'],
    ringkas: 'Ericsson, the researcher behind the idea of deliberate practice, explains what he actually found: not ten thousand hours of anything, but practice with clear goals, immediate feedback, and constant work at the edge of ability. Written partly to correct how his research had been popularised.',
  },
  {
    id: 'outliers', jenis: 'buku', judul: 'Outliers', oleh: 'Malcolm Gladwell', tahun: 2008,
    tema: ['Work & creativity'],
    ringkas: 'Gladwell argues that extraordinary success is never only about talent: birth timing, opportunity, cultural inheritance and hours of practice all contribute. Entertaining, and it changed how many people think about merit — though several of its cases are told more neatly than the underlying data allows.',
  },

  // ── Uang ──────────────────────────────────────────────────────────────────
  {
    id: 'psychology-money', jenis: 'buku', judul: 'The Psychology of Money', oleh: 'Morgan Housel', tahun: 2020,
    tema: ['Money'],
    ringkas: 'Housel argues that behaviour decides financial outcomes more than intelligence does: enough, patience, and staying in the game beat clever but fragile. Twenty short chapters that stand on their own, with more stories than formulas.',
  },
  {
    id: 'your-money-or-life', jenis: 'buku', judul: 'Your Money or Your Life', oleh: 'Vicki Robin & Joe Dominguez', tahun: 1992,
    tema: ['Money', 'Meaning'],
    ringkas: 'The book reprices goods in the hours of life spent to buy them. The modern financial-independence movement grew out of it. The budgeting sections have aged; the central question has not.',
  },
  {
    id: 'millionaire-next-door', jenis: 'buku', judul: 'The Millionaire Next Door', oleh: 'Thomas Stanley & William Danko', tahun: 1996,
    tema: ['Money'],
    ringkas: 'Research on wealthy Americans found a pattern opposite to the popular image: most live modestly, drive ordinary cars, and save heavily over long periods. Its method has been criticised for survivorship bias, and the data is now decades old.',
  },
  {
    id: 'i-will-teach', jenis: 'buku', judul: 'I Will Teach You to Be Rich', oleh: 'Ramit Sethi', tahun: 2009,
    tema: ['Money'],
    ringkas: 'A blunt six-week system: automate saving and investing, attack the large costs instead of counting coffees, and spend the remainder guilt-free on what you actually care about. The tone is brash; the mechanics are sound.',
  },
  {
    id: 'principles', jenis: 'buku', judul: 'Principles', oleh: 'Ray Dalio', tahun: 2017,
    tema: ['Money', 'Leadership'],
    ringkas: 'Dalio sets out the rules he used to run his life and his firm: seek truth openly, treat mistakes as data, and weight opinions by track record. The section on radical transparency describes a culture few organisations could survive, and he says so.',
  },
  {
    id: 'almanack-naval', jenis: 'buku', judul: 'The Almanack of Naval Ravikant', oleh: 'Eric Jorgenson', tahun: 2020,
    tema: ['Money', 'Meaning'],
    ringkas: 'A collection of Naval\'s ideas on wealth and happiness, assembled from interviews and posts. The wealth half centres on ownership and leverage — specific knowledge, code, and media. The happiness half is thinner, and closer to assertion than argument.',
  },
  {
    id: 'poor-charlie', jenis: 'buku', judul: "Poor Charlie's Almanack", oleh: 'Charlie Munger (peny. Peter Kaufman)', tahun: 2005,
    tema: ['Money', 'Mind'],
    ringkas: 'Munger advocates collecting mental models from many disciplines — psychology, physics, biology, mathematics — and using them together, rather than forcing one lens onto everything. The lecture on the causes of human misjudgement is the part worth returning to.',
  },

  // ── Hubungan dan komunikasi ───────────────────────────────────────────────
  {
    id: 'how-to-win-friends', jenis: 'buku', judul: 'How to Win Friends and Influence People', oleh: 'Dale Carnegie', tahun: 1936,
    tema: ['Relationships'],
    ringkas: 'A nearly century-old book that survives because its content is simple and hard: listen properly, use people\'s names, appreciate what they do, and do not try to win arguments by defeating people. Read cynically it looks like manipulation; read plainly it is mostly about paying attention.',
  },
  {
    id: 'nvc', jenis: 'buku', judul: 'Nonviolent Communication', oleh: 'Marshall Rosenberg', tahun: 1999,
    tema: ['Relationships'],
    ringkas: 'Four steps for speaking while angry: state an observation without judgement, name the feeling, name the need behind it, then make a clear request. It feels stiff the first few times, and that stiffness is what stops the habitual reply.',
  },
  {
    id: 'difficult-conversations', jenis: 'buku', judul: 'Difficult Conversations', oleh: 'Douglas Stone, Bruce Patton & Sheila Heen', tahun: 1999,
    tema: ['Relationships'],
    ringkas: 'Every difficult conversation is really three at once: about what happened, about feelings, and about our own identity. The book shows how an argument about facts is usually an argument about one of the other two.',
  },
  {
    id: 'never-split', jenis: 'buku', judul: 'Never Split the Difference', oleh: 'Chris Voss', tahun: 2016,
    tema: ['Relationships'],
    ringkas: 'A former FBI hostage negotiator sets out an approach built on listening: naming the other person\'s emotion, mirroring their last words, and asking questions that make them solve your problem. The business examples are thinner than the hostage ones.',
  },
  {
    id: 'influence', jenis: 'buku', judul: 'Influence', oleh: 'Robert Cialdini', tahun: 1984,
    tema: ['Mind', 'Relationships'],
    ringkas: 'Six shortcuts people use to decide without thinking — reciprocity, commitment, social proof, liking, authority and scarcity — together with how each is used against them. Written by the researcher who documented them, which is why it is more careful than its imitators.',
  },
  {
    id: 'quiet', jenis: 'buku', judul: 'Quiet', oleh: 'Susan Cain', tahun: 2012,
    tema: ['Relationships', 'Work & creativity'],
    ringkas: 'Cain shows how modern schools and offices are designed for people who think while talking, and what is lost as a result. She separates shyness from introversion, and gives introverts a defensible reason to work the way they do.',
  },
  {
    id: 'emotional-intelligence', jenis: 'buku', judul: 'Emotional Intelligence', oleh: 'Daniel Goleman', tahun: 1995,
    tema: ['Relationships', 'Mind'],
    ringkas: 'The book that put emotional intelligence into general conversation: recognising your own feelings, managing them, and reading other people\'s. The neuroscience sections have aged, and the claim that it predicts success better than IQ has not held up in later research.',
  },

  // ── Karya, kreativitas, menulis ───────────────────────────────────────────
  {
    id: 'war-of-art', jenis: 'buku', judul: 'The War of Art', oleh: 'Steven Pressfield', tahun: 2002,
    tema: ['Work & creativity'],
    ringkas: 'Pressfield names the enemy faced by anyone who wants to make something: Resistance — the urge to delay, which appears most strongly on the work that matters most. The chapters are a page long and read like a series of blows.',
  },
  {
    id: 'bird-by-bird', jenis: 'buku', judul: 'Bird by Bird', oleh: 'Anne Lamott', tahun: 1994,
    tema: ['Work & creativity'],
    ringkas: 'The most honest writing advice about how bad a first draft is — and that it is supposed to be. The title comes from her father\'s advice to her overwhelmed brother, who had a report on birds due the next day: take it bird by bird.',
  },
  {
    id: 'on-writing', jenis: 'buku', judul: 'On Writing', oleh: 'Stephen King', tahun: 2000,
    tema: ['Work & creativity'],
    ringkas: 'Half memoir, half working manual. King demands two things without negotiation: read a great deal and write every day. The passages on cutting adverbs and trimming ten per cent from every draft are the most quoted, and the most useful.',
  },
  {
    id: 'steal-like-artist', jenis: 'buku', judul: 'Steal Like an Artist', oleh: 'Austin Kleon', tahun: 2012,
    tema: ['Work & creativity'],
    ringkas: 'Nothing is truly original; there is only influence, processed until it becomes your own. Kleon arranges this into ten short pieces of advice with hand-drawn illustrations, readable in an hour and worth returning to.',
  },
  {
    id: 'show-your-work', jenis: 'buku', judul: 'Show Your Work!', oleh: 'Austin Kleon', tahun: 2014,
    tema: ['Work & creativity'],
    ringkas: 'The sequel answering the next question: how do people find out your work exists without you having to sell. The answer is to share the process a little at a time, not only the finished result.',
  },
  {
    id: 'big-magic', jenis: 'buku', judul: 'Big Magic', oleh: 'Elizabeth Gilbert', tahun: 2015,
    tema: ['Work & creativity'],
    ringkas: 'Gilbert invites you to treat making things as curiosity kept alive rather than a heavy calling that demands suffering. The section on not asking your art to pay your rent is the most practical thing in it.',
  },
  {
    id: 'artists-way', jenis: 'buku', judul: "The Artist's Way", oleh: 'Julia Cameron', tahun: 1992,
    tema: ['Work & creativity'],
    ringkas: 'A twelve-week programme with two core habits: three unfiltered handwritten pages every morning, and one weekly appointment with yourself to seek new impressions. The language is spiritual and will not suit everyone; the two habits work regardless.',
  },
  {
    id: 'so-good', jenis: 'buku', judul: "So Good They Can't Ignore You", oleh: 'Cal Newport', tahun: 2012,
    tema: ['Work & creativity'],
    ringkas: 'Newport rejects \'follow your passion\': passion more often grows out of skill already built than precedes it. He recommends accumulating career capital through rare and valuable skills, then spending it on autonomy.',
  },
  {
    id: 'drive', jenis: 'buku', judul: 'Drive', oleh: 'Daniel Pink', tahun: 2009,
    tema: ['Work & creativity', 'Leadership'],
    ringkas: 'For work that demands thinking, rewards and punishments often lower the quality of the result. Pink summarises research pointing to three other things: autonomy, mastery, and purpose. Some of the studies cited have been questioned since.',
  },

  // ── Makna, riwayat hidup, dan kedokteran ──────────────────────────────────
  {
    id: 'when-breath', jenis: 'buku', judul: 'When Breath Becomes Air', oleh: 'Paul Kalanithi', tahun: 2016,
    tema: ['Medicine', 'Meaning'],
    ringkas: 'A neurosurgical resident nearing the end of his training is diagnosed with advanced lung cancer at thirty-six. He writes from both sides at once — the doctor who delivered such news, and the patient receiving it. Unfinished when he died, and the epilogue by his wife is the hardest part.',
  },
  {
    id: 'being-mortal', jenis: 'buku', judul: 'Being Mortal', oleh: 'Atul Gawande', tahun: 2014,
    tema: ['Medicine', 'Meaning'],
    ringkas: 'Gawande examines modern medicine\'s failure at old age and the end of life: extending life is handled well, while asking what matters most to a patient is barely handled at all. It changed how many clinicians talk to families.',
  },
  {
    id: 'checklist-manifesto', jenis: 'buku', judul: 'The Checklist Manifesto', oleh: 'Atul Gawande', tahun: 2009,
    tema: ['Medicine', 'Focus'],
    ringkas: 'Failure in complex work is often not from not knowing but from skipping what is already known. Gawande takes the checklist from aviation into the operating theatre, and reports both the results and the resistance from people who found it insulting.',
  },
  {
    id: 'complications', jenis: 'buku', judul: 'Complications', oleh: 'Atul Gawande', tahun: 2002,
    tema: ['Medicine'],
    ringkas: 'Essays on the part of medicine rarely discussed openly: uncertainty, mistaken judgement, and how doctors learn by practising on real patients. Written by a surgeon while still in training, which is what makes it candid.',
  },
  {
    id: 'do-no-harm', jenis: 'buku', judul: 'Do No Harm', oleh: 'Henry Marsh', tahun: 2014,
    tema: ['Medicine'],
    ringkas: 'A senior neurosurgeon\'s account of operations that succeeded, operations that failed, and decisions he still regrets years later. Written without self-defence. Rare in showing what carrying a bad outcome actually feels like.',
  },
  {
    id: 'this-is-going-to-hurt', jenis: 'buku', judul: 'This Is Going to Hurt', oleh: 'Adam Kay', tahun: 2017,
    tema: ['Medicine'],
    ringkas: 'The diary of a junior obstetrician in the British health service: funny on almost every page, until suddenly it is not. It documents the hours, the exhaustion, and the price paid by people who leave the profession.',
  },
  {
    id: 'emperor-maladies', jenis: 'buku', judul: 'The Emperor of All Maladies', oleh: 'Siddhartha Mukherjee', tahun: 2010,
    tema: ['Medicine'],
    ringkas: 'A biography of cancer, from ancient Egyptian records to targeted therapy. Mukherjee combines medical history, patient stories and mechanism with a quality of writing rare in the genre.',
  },
  {
    id: 'educated', jenis: 'buku', judul: 'Educated', oleh: 'Tara Westover', tahun: 2018,
    tema: ['Meaning', 'Resilience'],
    ringkas: 'Raised in a family that rejected schooling and medical care, Westover entered a classroom for the first time at seventeen and ended with a doctorate. The book is not a story of triumph but of the cost: what it takes to leave a family whose account of reality is the only one you have known.',
  },
  {
    id: 'long-walk', jenis: 'buku', judul: 'Long Walk to Freedom', oleh: 'Nelson Mandela', tahun: 1994,
    tema: ['Leadership', 'Resilience'],
    ringkas: 'An autobiography written partly in prison: from a childhood village, through resistance, twenty-seven years of imprisonment, to the negotiations that ended apartheid. The strongest passages are the ordinary ones — what it takes to keep a mind intact across decades in a cell.',
  },
  {
    id: 'malcolm-x', jenis: 'buku', judul: 'The Autobiography of Malcolm X', oleh: 'Malcolm X & Alex Haley', tahun: 1965,
    tema: ['Meaning', 'Resilience'],
    ringkas: 'A story of repeated transformation: from the street and prison, to a hard creed, then to a changed view after the pilgrimage — all told without smoothing over the earlier stages. Recorded by Alex Haley in the last years of his life.',
  },
  {
    id: 'anne-frank', jenis: 'buku', judul: 'The Diary of a Young Girl', oleh: 'Anne Frank', tahun: 1947,
    tema: ['Meaning'],
    ringkas: 'The diary of a teenager hidden for two years in Amsterdam. What has kept it alive is not only its historical setting but her voice: sharp, funny, sometimes irritating in exactly the way a fifteen-year-old is. That is what makes the ending unbearable.',
  },
  {
    id: 'tuesdays-morrie', jenis: 'buku', judul: 'Tuesdays with Morrie', oleh: 'Mitch Albom', tahun: 1997,
    tema: ['Meaning'],
    ringkas: 'Fourteen Tuesday conversations with a former professor dying of motor neurone disease. The language is plain and makes no pretence at profundity. What stays is the ordinariness: an old man saying obvious things at the point where they stop being obvious.',
  },
  {
    id: 'siddhartha', jenis: 'buku', judul: 'Siddhartha', oleh: 'Hermann Hesse', tahun: 1922,
    tema: ['Meaning'],
    ringkas: 'A short novel about someone who leaves every teaching behind to find his own understanding — passing through asceticism, wealth, love and despair, before learning from a river and a ferryman. Reads differently at twenty and at forty.',
  },
  {
    id: 'alchemist', jenis: 'buku', judul: 'The Alchemist', oleh: 'Paulo Coelho', tahun: 1988,
    tema: ['Meaning'],
    ringkas: 'A fable about an Andalusian shepherd who travels to Egypt following a dream. Simple to the point of being too simple, and precisely for that reason it has reached tens of millions of readers. Either it arrives at the right moment or it does not arrive at all.',
  },
  {
    id: 'sapiens', jenis: 'buku', judul: 'Sapiens', oleh: 'Yuval Noah Harari', tahun: 2011,
    tema: ['Mind', 'Meaning'],
    ringkas: 'Human history in one volume, built around one idea: humans came to dominate because they can cooperate in large numbers through shared stories — money, nations, law. Sweeping and readable, and specialists dispute a number of the specific claims.',
  },
  {
    id: 'factfulness', jenis: 'buku', judul: 'Factfulness', oleh: 'Hans Rosling', tahun: 2018,
    tema: ['Mind'],
    ringkas: 'Rosling shows that almost everyone — experts included — guesses the state of the world as worse than it is, then sets out ten instincts that produce the error. His point is not that everything is fine but that the direction is misread. Finished by his family after his death.',
  },
  {
    id: 'untethered-soul', jenis: 'buku', judul: 'The Untethered Soul', oleh: 'Michael Singer', tahun: 2007,
    tema: ['Mind', 'Meaning'],
    ringkas: 'It starts from one plain observation: there is a voice talking constantly in your head, and you are not that voice — you are the one hearing it. From there Singer builds a way of loosening the grip of thought and feeling. The later chapters turn more metaphysical than the opening ones.',
  },
  {
    id: 'miracle-mindfulness', jenis: 'buku', judul: 'The Miracle of Mindfulness', oleh: 'Thich Nhat Hanh', tahun: 1975,
    tema: ['Mind'],
    ringkas: 'Mindfulness practice explained through the most ordinary things: washing dishes in order to wash dishes, not in order to have finished washing dishes. Thin, calm, and easier to follow than most of the genre.',
  },
  {
    id: 'wherever-you-go', jenis: 'buku', judul: 'Wherever You Go, There You Are', oleh: 'Jon Kabat-Zinn', tahun: 1994,
    tema: ['Mind'],
    ringkas: 'Kabat-Zinn, who brought mindfulness practice into mainstream medicine, writes it in chapters one or two pages long and without religious vocabulary. Suited to being read a little at a time rather than straight through.',
  },
  {
    id: 'when-things-fall-apart', jenis: 'buku', judul: 'When Things Fall Apart', oleh: 'Pema Chödrön', tahun: 1997,
    tema: ['Resilience', 'Mind'],
    ringkas: 'Written for the times when life genuinely comes apart. Chödrön offers not a way to fix the situation but a way to stay inside it without fleeing — an idea that is initially unwelcome and later the only one that helps.',
  },
  {
    id: 'radical-acceptance', jenis: 'buku', judul: 'Radical Acceptance', oleh: 'Tara Brach', tahun: 2003,
    tema: ['Mind'],
    ringkas: 'Brach focuses on the quiet sense that \'something is wrong with me\' which accompanies many people, and offers practice in accepting experience as it is without giving up on change. Grounded in her own clinical work.',
  },
  {
    id: '7-habits', jenis: 'buku', judul: 'The 7 Habits of Highly Effective People', oleh: 'Stephen Covey', tahun: 1989,
    tema: ['Habits', 'Leadership'],
    ringkas: 'Covey sets out seven habits in sequence: from personal independence towards cooperation that produces more than the sum of its parts. The one people use most is the urgent-versus-important grid, which is only a small part of the book.',
  },
  {
    id: 'extreme-ownership', jenis: 'buku', judul: 'Extreme Ownership', oleh: 'Jocko Willink & Leif Babin', tahun: 2015,
    tema: ['Leadership'],
    ringkas: 'Two former SEAL officers carry leadership lessons from combat into working life: a leader owns every failure of their team without exception, and their main job is making the plan simple enough to be executed under pressure. The military framing will not translate everywhere.',
  },
  {
    id: 'start-with-why', jenis: 'buku', judul: 'Start with Why', oleh: 'Simon Sinek', tahun: 2009,
    tema: ['Leadership'],
    ringkas: 'Sinek argues that people follow a reason rather than a product, and organises this into the why–how–what circle. The examples work well as talking points but were selected after the fact, which is the standard criticism of the book.',
  },
  {
    id: 'good-to-great', jenis: 'buku', judul: 'Good to Great', oleh: 'Jim Collins', tahun: 2001,
    tema: ['Leadership'],
    ringkas: 'Research into companies that jumped from good to exceptional, producing ideas such as the humble but stubborn leader and \'first who, then what\'. Worth noting that several of the companies studied later declined sharply, which undermines the method more than the individual ideas.',
  },
  {
    id: 'zero-to-one', jenis: 'buku', judul: 'Zero to One', oleh: 'Peter Thiel & Blake Masters', tahun: 2014,
    tema: ['Work & creativity'],
    ringkas: 'Lecture notes on building something genuinely new rather than copying what exists. It contains a question worth keeping: what important truth do very few people agree with you about? Opinionated, and deliberately so.',
  },
  {
    id: 'shoe-dog', jenis: 'buku', judul: 'Shoe Dog', oleh: 'Phil Knight', tahun: 2016,
    tema: ['Work & creativity', 'Sport'],
    ringkas: 'The Nike founder\'s memoir, startling for its honesty: near-bankruptcy repeatedly, damaged relationships, and decisions he admits were wrong. Not a business manual but an account of how uncertain it looked from the inside.',
  },
  {
    id: 'discipline-freedom', jenis: 'buku', judul: 'Discipline Equals Freedom', oleh: 'Jocko Willink', tahun: 2017,
    tema: ['Habits', 'Resilience'],
    ringkas: 'A short book of brief answers to questions like \'what if I have no motivation\' — and the answer is always the same: do not wait, go. The tone is harsh and repetitive, which is either exactly what someone needs or exactly what they do not.',
  },
  {
    id: 'practice-groundedness', jenis: 'buku', judul: 'The Practice of Groundedness', oleh: 'Brad Stulberg', tahun: 2021,
    tema: ['Meaning', 'Resilience'],
    ringkas: 'Written after the author burned out chasing achievement himself. Stulberg offers six foundations — acceptance, presence, patience, vulnerability, community and movement — as an alternative to drive that consumes the person driving.',
  },
  // ── Film ──────────────────────────────────────────────────────────────────
  {
    id: 'shawshank', jenis: 'film', judul: 'The Shawshank Redemption', oleh: 'Frank Darabont', tahun: 1994,
    tema: ['Resilience', 'Meaning'],
    ringkas: 'A banker imprisoned for a murder he did not commit spends decades inside without losing the habit of building: a library, letters written weekly, a plan measured in years. About patience as a form of resistance rather than about escape.',
  },
  {
    id: 'forrest-gump', jenis: 'film', judul: 'Forrest Gump', oleh: 'Robert Zemeckis', tahun: 1994,
    tema: ['Meaning'],
    ringkas: 'The life of a man of below-average intelligence who crosses three decades of American history while never once failing to keep a promise, or to run when running was needed. The film is warmer than the book, and considerably less bitter.',
  },
  {
    id: 'pursuit-happyness', jenis: 'film', judul: 'The Pursuit of Happyness', oleh: 'Gabriele Muccino', tahun: 2006,
    tema: ['Resilience', 'Money'],
    ringkas: 'Adapted from the true story of Chris Gardner: a single father working an unpaid internship at a brokerage while losing his housing. Its most honest stretch is not the success at the end but the nights in a station toilet with his son.',
  },
  {
    id: 'good-will-hunting', jenis: 'film', judul: 'Good Will Hunting', oleh: 'Gus Van Sant', tahun: 1997,
    tema: ['Mind', 'Relationships'],
    ringkas: 'A young mathematical genius working as a university cleaner rejects every opportunity because of childhood injury. What changes things is not his intelligence but a therapist who refuses to be driven away. The \'it\'s not your fault\' scene is why it is remembered.',
  },
  {
    id: 'dead-poets', jenis: 'film', judul: 'Dead Poets Society', oleh: 'Peter Weir', tahun: 1989,
    tema: ['Meaning', 'Work & creativity'],
    ringkas: 'A literature teacher at a rigid boarding school urges his students to think for themselves and to read poetry as something other than homework. The film is brave enough to show that awakening people has consequences, and that they are not all good.',
  },
  {
    id: 'whiplash', jenis: 'film', judul: 'Whiplash', oleh: 'Damien Chazelle', tahun: 2014,
    tema: ['Work & creativity', 'Resilience'],
    ringkas: 'A young drummer and a teacher who torments him in the name of perfection. Often misread as a celebration of limitless hard work; the film actually shows the price and leaves the question of whether it was worth it open.',
  },
  {
    id: 'rocky', jenis: 'film', judul: 'Rocky', oleh: 'John G. Avildsen', tahun: 1976,
    tema: ['Sport', 'Resilience'],
    ringkas: 'A club fighter gets an impossible shot at the world champion, and his aim is not to win but to still be standing in the final round. That redefinition of success is the whole film, and the reason it outlasted its sequels.',
  },
  {
    id: 'coach-carter', jenis: 'film', judul: 'Coach Carter', oleh: 'Thomas Carter', tahun: 2005,
    tema: ['Sport', 'Leadership'],
    ringkas: 'Based on the true story of a basketball coach who locked the gym because his players\' grades had collapsed, while the team was undefeated. The film is about deciding what the point actually is.',
  },
  {
    id: 'remember-titans', jenis: 'film', judul: 'Remember the Titans', oleh: 'Boaz Yakin', tahun: 2000,
    tema: ['Sport', 'Leadership'],
    ringkas: 'A high-school American football team newly merged from two racially separate schools in 1971. What it depicts well is the mechanism: not speeches, but forced proximity and shared work over time.',
  },
  {
    id: 'invictus', jenis: 'film', judul: 'Invictus', oleh: 'Clint Eastwood', tahun: 2009,
    tema: ['Leadership', 'Sport'],
    ringkas: 'Mandela uses the 1995 Rugby World Cup as an instrument for uniting a country just out of apartheid. The politics are the interesting part: the decision to keep a symbol his own supporters wanted destroyed.',
  },
  {
    id: 'moneyball', jenis: 'film', judul: 'Moneyball', oleh: 'Bennett Miller', tahun: 2011,
    tema: ['Sport', 'Mind'],
    ringkas: 'The manager of a low-budget baseball team assembles players on data that experienced scouts ignored. The best film there is about how numbers challenge instinct, and about what it costs the person who insists on them.',
  },
  {
    id: 'ford-ferrari', jenis: 'film', judul: 'Ford v Ferrari', oleh: 'James Mangold', tahun: 2019,
    tema: ['Work & creativity', 'Sport'],
    ringkas: 'A stubborn car designer and driver try to win Le Mans against Ferrari — while fighting the company funding them. The film is about craft, and about what happens when the people who understand the work are overruled by the people who own it.',
  },
  {
    id: 'beautiful-mind', jenis: 'film', judul: 'A Beautiful Mind', oleh: 'Ron Howard', tahun: 2001,
    tema: ['Mind', 'Medicine'],
    ringkas: 'The story of the mathematician John Nash living with schizophrenia. As a film it is strong on learning to live alongside symptoms rather than waiting for a cure. As biography it simplifies and omits a good deal.',
  },
  {
    id: 'theory-everything', jenis: 'film', judul: 'The Theory of Everything', oleh: 'James Marsh', tahun: 2014,
    tema: ['Resilience', 'Relationships'],
    ringkas: 'Stephen Hawking, from a motor neurone disease diagnosis at twenty-one to his major work, seen largely through his marriage. The film chooses the relationship over the physics, which is both its strength and its limitation.',
  },
  {
    id: 'hidden-figures', jenis: 'film', judul: 'Hidden Figures', oleh: 'Theodore Melfi', tahun: 2016,
    tema: ['Resilience', 'Work & creativity'],
    ringkas: 'Three Black women mathematicians at NASA during segregation, doing the calculations that put the first American astronaut into orbit. About competence in a system built to ignore it. Compresses the timeline and invents some scenes.',
  },
  {
    id: '12-angry-men', jenis: 'film', judul: '12 Angry Men', oleh: 'Sidney Lumet', tahun: 1957,
    tema: ['Mind'],
    ringkas: 'Twelve jurors in one hot room, eleven certain of guilt, one asking them to think again. The densest lesson ever filmed on evidence, prejudice, and how much courage a single dissent requires.',
  },
  {
    id: 'life-is-beautiful', jenis: 'film', judul: 'Life Is Beautiful', oleh: 'Roberto Benigni', tahun: 1997,
    tema: ['Meaning', 'Resilience'],
    ringkas: 'A father convinces his son that the concentration camp is a game with a prize, in order to protect his mind. An impossible combination of funny and horrifying, and precisely that combination is why it works. It divided critics on whether such a setting can be played this way at all.',
  },
  {
    id: 'schindler', jenis: 'film', judul: "Schindler's List", oleh: 'Steven Spielberg', tahun: 1993,
    tema: ['Meaning', 'Leadership'],
    ringkas: 'A German businessman who initially sought profit from the war ends up spending his entire fortune saving more than a thousand Jewish workers. The change is never explained, and the film is better for refusing to explain it.',
  },
  {
    id: 'soul', jenis: 'film', judul: 'Soul', oleh: 'Pete Docter', tahun: 2020,
    tema: ['Meaning'],
    ringkas: 'A music teacher who has spent his life chasing one big break finally has to answer a different question: does a life need a grand purpose to be worth living? Pixar\'s most adult film, and its answer is quieter than expected.',
  },
  {
    id: 'inside-out', jenis: 'film', judul: 'Inside Out', oleh: 'Pete Docter', tahun: 2015,
    tema: ['Mind', 'Relationships'],
    ringkas: 'A girl\'s five emotions rendered as characters inside her head. The core idea is the hardest thing in mental health: sadness is not a fault to be removed but a signal that asks other people to come closer.',
  },
  {
    id: 'up', jenis: 'film', judul: 'Up', oleh: 'Pete Docter', tahun: 2009,
    tema: ['Meaning', 'Relationships'],
    ringkas: 'Its first ten minutes tell a whole marriage almost without dialogue, and the rest follows an old widower learning that the adventure he kept postponing already happened, in the ordinary years he was not counting.',
  },
  {
    id: 'ratatouille', jenis: 'film', judul: 'Ratatouille', oleh: 'Brad Bird', tahun: 2007,
    tema: ['Work & creativity'],
    ringkas: 'A rat with an extraordinary palate cooks in a Paris kitchen. Its key line is delivered by a critic at the end: not everyone can become a great artist, but a great artist can come from anywhere.',
  },
  {
    id: 'kung-fu-panda', jenis: 'film', judul: 'Kung Fu Panda', oleh: 'Mark Osborne & John Stevenson', tahun: 2008,
    tema: ['Resilience', 'Work & creativity'],
    ringkas: 'An overweight panda chosen as the foretold warrior turns out to be trainable only in a way that suits him, not the way that worked on other students. The blank scroll is the whole point, and it lands better than most films aimed at adults.',
  },
  {
    id: 'intouchables', jenis: 'film', judul: 'The Intouchables', oleh: 'Olivier Nakache & Éric Toledano', tahun: 2011,
    tema: ['Relationships', 'Medicine'],
    ringkas: 'An aristocrat paralysed from the neck down hires a carer from the banlieue who treats him without a trace of pity — and that is exactly what gives him his life back. Based on a real friendship, and it sands down the harder edges of it.',
  },
  {
    id: '127-hours', jenis: 'film', judul: '127 Hours', oleh: 'Danny Boyle', tahun: 2010,
    tema: ['Resilience'],
    ringkas: 'The true story of a climber whose arm was trapped by a boulder in a remote canyon for five days. The most haunting part is not the act he had to perform to survive but what he realises about the people he had pushed away.',
  },
  {
    id: 'into-the-wild', jenis: 'film', judul: 'Into the Wild', oleh: 'Sean Penn', tahun: 2007,
    tema: ['Meaning'],
    ringkas: 'A young graduate burns his money and walks into the Alaskan wilderness in search of a purer life. Often mistaken for a celebration of freedom; it is closer to a warning — and its last written line is about happiness only being real when shared.',
  },
  {
    id: 'free-solo', jenis: 'film', judul: 'Free Solo', oleh: 'Jimmy Chin & Elizabeth Chai Vasarhelyi', tahun: 2018,
    tema: ['Sport', 'Resilience'],
    ringkas: 'A documentary about climbing El Capitan without a rope. The useful part is not the climb but the preparation: years of practice, hundreds of repetitions of every move, and a risk assessment far colder than the result appears.',
  },
  {
    id: 'last-dance', jenis: 'film', judul: 'The Last Dance', oleh: 'Jason Hehir', tahun: 2020,
    tema: ['Sport', 'Leadership'],
    ringkas: 'A documentary series on Michael Jordan\'s final season with the Chicago Bulls. It shows an extraordinary standard of work and what it cost his team-mates — and does not pretend the two can be separated.',
  },
  {
    id: 'jiro', jenis: 'film', judul: 'Jiro Dreams of Sushi', oleh: 'David Gelb', tahun: 2011,
    tema: ['Work & creativity'],
    ringkas: 'A sushi chef in his eighties still trying to improve the same work he has done every day for decades. The calmest portrait of mastery there is: repetition without boredom, and a son waiting in a shadow that will not move.',
  },
  {
    id: 'my-octopus-teacher', jenis: 'film', judul: 'My Octopus Teacher', oleh: 'Pippa Ehrlich & James Reed', tahun: 2020,
    tema: ['Meaning', 'Mind'],
    ringkas: 'An exhausted filmmaker starts diving daily in a kelp forest and slowly forms a relationship with an octopus. About patient attention to one thing over a long time, and how much of that is really about the person paying it.',
  },
  {
    id: 'spirited-away', jenis: 'film', judul: 'Spirited Away', oleh: 'Hayao Miyazaki', tahun: 2001,
    tema: ['Resilience', 'Meaning'],
    ringkas: 'A timid girl is trapped in a spirit world and must work to save her parents. What saves her is not magic power but hard work, remembering her own name, and small kindnesses to people nobody else notices.',
  },
  {
    id: 'groundhog-day', jenis: 'film', judul: 'Groundhog Day', oleh: 'Harold Ramis', tahun: 1993,
    tema: ['Habits', 'Meaning'],
    ringkas: 'A cynical man is trapped repeating the same day endlessly. He goes through every stage — playing with it, despair, and finally using the time to learn and to help — which is why it is quoted far outside comedy.',
  },
  {
    id: 'peaceful-warrior', jenis: 'film', judul: 'Peaceful Warrior', oleh: 'Victor Salva', tahun: 2006,
    tema: ['Sport', 'Mind'],
    ringkas: 'A college gymnast who suffers a serious accident learns from a petrol-station attendant that attention to the present moment matters more than obsession with winning. The dialogue is heavy-handed; the underlying point survives it.',
  },
  {
    id: 'gattaca', jenis: 'film', judul: 'Gattaca', oleh: 'Andrew Niccol', tahun: 1997,
    tema: ['Resilience', 'Medicine'],
    ringkas: 'In a world where fate is set by a genetic test at birth, a man declared unqualified tries to break through. Its key line — that there is no gene for the human spirit — is why it is still shown in ethics classes.',
  },
  {
    id: 'chef', jenis: 'film', judul: 'Chef', oleh: 'Jon Favreau', tahun: 2014,
    tema: ['Work & creativity', 'Relationships'],
    ringkas: 'A fine-dining chef who loses his job starts again from a food truck with his son. About returning to work you actually love after years of doing it to someone else\'s specification.',
  },
]
