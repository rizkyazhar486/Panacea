import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Resilience Stories — a curated collection of well-documented people across
// medicine, sport, science, and invention who faced serious adversity
// (illness, injury, failure, loss, rejection) and kept going. Curated for
// factual accuracy rather than padded to an arbitrary count — each entry is a
// widely-documented, verifiable public fact pattern, not an invented bio.
// Pure static content, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Story { name: string; field: string; category: string; hardship: string; lesson: string }

const STORIES: Story[] = [
  // Medicine
  { name: 'Insulin discovery team (Banting, Best, Macleod, Collip)', field: 'Medicine', category: 'Doctors & Scientists', hardship: 'Banting had failed in private practice and had no research reputation; the team raced against time as children were dying of type 1 diabetes with no treatment.', lesson: 'A rejected outsider with a stubborn hypothesis and relentless bench work turned a universally fatal childhood disease into a manageable one within a single year (1921-22).' },
  { name: 'Marie Curie', field: 'Physics & Chemistry', category: 'Doctors & Scientists', hardship: 'Barred from Polish universities for being a woman, worked in a leaking shed, and was later shunned by parts of the French academy over her personal life even as her science was undeniable.', lesson: 'Two Nobel Prizes in two different sciences, achieved through sheer methodological rigor in the face of institutional exclusion.' },
  { name: 'Vivien Thomas', field: 'Cardiac surgery', category: 'Doctors & Scientists', hardship: 'A Black carpenter with no medical degree during Jim Crow-era segregation, denied recognition for decades despite developing the surgical technique behind the first "blue baby" heart operation.', lesson: 'Pioneered lifesaving pediatric cardiac surgery from outside the credentialed system — Johns Hopkins eventually awarded him an honorary doctorate.' },
  { name: 'Paul Farmer', field: 'Global health', category: 'Doctors & Scientists', hardship: 'Built health infrastructure in rural Haiti and other of the world\'s poorest regions against chronic underfunding and skepticism that quality care was "possible" for the poor.', lesson: 'Proved that the standard of care shouldn\'t depend on a patient\'s postal code — a founding principle now central to global health equity work.' },

  // Athletes
  { name: 'Wilma Rudolph', field: 'Track & field', category: 'Athletes', hardship: 'Had polio as a child and wore a leg brace, told she might never walk normally.', lesson: 'Became the first American woman to win three gold medals in a single Olympics (Rome, 1960).' },
  { name: 'Michael Jordan', field: 'Basketball', category: 'Athletes', hardship: 'Cut from his varsity high school team as a sophomore.', lesson: 'Used the rejection as fuel; became widely regarded as one of the greatest basketball players of all time.' },
  { name: 'Bethany Hamilton', field: 'Surfing', category: 'Athletes', hardship: 'Lost her left arm in a shark attack at 13.', lesson: 'Returned to competitive surfing within months and continued a professional career for decades after.' },
  { name: 'Kyle Maynard', field: 'Wrestling & mountaineering', category: 'Athletes', hardship: 'Born with congenital amputation of all four limbs.', lesson: 'Became a championship wrestler and the first quadruple amputee to summit Mount Kilimanjaro unassisted.' },
  { name: 'Eliud Kipchoge', field: 'Marathon running', category: 'Athletes', hardship: 'Grew up in poverty in rural Kenya, ran to school barefoot, finished only fifth in his marathon debut category as a junior.', lesson: 'Became the first person to run a marathon under two hours, crediting relentless, unglamorous daily discipline over talent.' },

  // Innovators & entrepreneurs
  { name: 'Thomas Edison', field: 'Invention', category: 'Innovators', hardship: 'Widely described as failing thousands of times while developing a practical incandescent light bulb; his lab burned down later in life.', lesson: 'Reframed each failure as "a way that won\'t work" — perseverance across thousands of iterations, not one flash of genius.' },
  { name: 'J.K. Rowling', field: 'Writing', category: 'Innovators', hardship: 'A single parent living on welfare, clinically depressed, rejected by roughly a dozen publishers for the first Harry Potter manuscript.', lesson: 'One editor\'s daughter loved the first chapter — the book went on to become one of the best-selling series in history.' },
  { name: 'Stephen King', field: 'Writing', category: 'Innovators', hardship: 'His first novel, Carrie, was rejected around 30 times; he threw the manuscript in the trash before his wife retrieved it.', lesson: 'Became one of the best-selling novelists of all time off a manuscript he had already given up on.' },
  { name: 'Sara Blakely', field: 'Entrepreneurship', category: 'Innovators', hardship: 'Sold fax machines door-to-door and was rejected by every hosiery manufacturer she approached with her idea.', lesson: 'Built Spanx into a billion-dollar company and became one of the youngest self-made female billionaires.' },

  // Scientists & thinkers
  { name: 'Stephen Hawking', field: 'Theoretical physics', category: 'Scientists', hardship: 'Diagnosed with ALS at 21 and given roughly two years to live; progressively lost nearly all motor function and speech.', lesson: 'Continued groundbreaking work on black holes and cosmology for over 50 more years, communicating via a speech-generating device.' },
  { name: 'Charles Darwin', field: 'Natural science', category: 'Scientists', hardship: 'Chronic, poorly understood illness for much of his adult life; anticipated fierce public and religious backlash to his theory for over 20 years before publishing.', lesson: 'On the Origin of Species reshaped biology permanently despite the author\'s own doubt and the certainty of controversy.' },
  { name: 'Katalin Karikó', field: 'Biochemistry', category: 'Scientists', hardship: 'Demoted and nearly pushed out of academia for decades while pursuing mRNA research that mainstream funders considered a dead end.', lesson: 'Her mRNA work became the foundation of COVID-19 vaccines and won the 2023 Nobel Prize in Physiology or Medicine.' },

  // Public figures & leaders
  { name: 'Nelson Mandela', field: 'Leadership', category: 'Leaders', hardship: '27 years in prison, much of it in a small cell on Robben Island, separated from his family.', lesson: 'Emerged advocating reconciliation over revenge, becoming South Africa\'s first democratically elected president.' },
  { name: 'Viktor Frankl', field: 'Psychiatry', category: 'Leaders', hardship: 'Survived multiple Nazi concentration camps, including Auschwitz, and lost his wife and parents in the Holocaust.', lesson: 'Wrote Man\'s Search for Meaning, arguing that finding purpose is what allows people to endure almost any suffering — a founding text of logotherapy.' },
  { name: 'Malala Yousafzai', field: 'Education advocacy', category: 'Leaders', hardship: 'Shot in the head by the Taliban at 15 for advocating girls\' education.', lesson: 'Recovered and became the youngest-ever Nobel Peace Prize laureate, continuing global advocacy for girls\' education.' },
  { name: 'Wangari Maathai', field: 'Environmental activism', category: 'Leaders', hardship: 'Jailed and physically beaten multiple times by the Kenyan government for organizing grassroots tree-planting and pro-democracy protests.', lesson: 'Founded the Green Belt Movement (45+ million trees planted) and became the first African woman to win the Nobel Peace Prize (2004).' },
  { name: 'Elie Wiesel', field: 'Writing & human rights', category: 'Leaders', hardship: 'Survived Auschwitz and Buchenwald as a teenager; his mother, father, and younger sister were killed in the Holocaust.', lesson: 'Wrote Night and spent the rest of his life testifying against indifference to atrocity, winning the Nobel Peace Prize in 1986.' },

  // Athletes (footballers)
  { name: 'Lionel Messi', field: 'Football', category: 'Athletes', hardship: 'Diagnosed with a growth hormone deficiency at 11; his family in Argentina could not afford the treatment and his local club withdrew financial support.', lesson: 'Barcelona\'s youth academy agreed to fund his treatment (famously formalized on a napkin) after he relocated across the Atlantic at 13 — he went on to become a record-breaking Ballon d\'Or winner and 2022 World Cup champion.' },
  { name: 'Cristiano Ronaldo', field: 'Football', category: 'Athletes', hardship: 'Grew up in a poor household in Madeira and left home at 12 to join Sporting CP\'s academy alone; underwent heart surgery at 15 to correct a racing heartbeat that risked ending his career before it started.', lesson: 'Became one of football\'s most decorated goal-scorers, crediting relentless extra training as much as natural talent.' },

  // Faith & spiritual traditions — resilience narratives central to each faith's
  // own teaching. Presented as each tradition describes them, not as a claim
  // adjudicating between beliefs; included because billions of people draw on
  // exactly these stories when facing hardship.
  { name: 'Jesus of Nazareth', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'The Gospels describe him as betrayed by a close disciple, abandoned by his followers at his arrest, and executed by crucifixion as a condemned criminal.', lesson: 'Christian tradition holds the resurrection that followed as the foundation of hope in suffering — the central resilience narrative for over two billion people.' },
  { name: 'Siddhartha Gautama (the Buddha)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Renounced a life of royal comfort to confront suffering directly, then spent years in extreme ascetic self-denial that brought him close to death without answering his questions.', lesson: 'Rejected both indulgence and self-destruction for a "Middle Way" — a founding teaching on enduring hardship without being consumed by it.' },
  { name: 'Prophet Muhammad ﷺ', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Islamic tradition describes him as orphaned in early childhood, then facing years of persecution, boycott, and exile from his home city of Mecca alongside his early followers.', lesson: 'His endurance through the Meccan persecution and the migration (Hijra) to Medina is held up in Islamic teaching as the model of sabr (steadfast patience) under hardship.' },
  { name: 'Musa (Moses)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Accounts shared across Judaism, Christianity, and Islam describe him fleeing Egypt as a fugitive and spending decades in exile as a shepherd before being called to confront Pharaoh.', lesson: 'His path from exile back to leading the Exodus is cited across all three traditions as a model of returning to purpose despite past failure and self-doubt.' },
  { name: 'Ibrahim (Abraham)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Tradition describes him cast into a fire by his own community for rejecting idol worship, and later tested by the command to sacrifice his son.', lesson: 'Revered across Judaism, Christianity, and Islam as the model of unwavering faith held under the most extreme tests.' },
  { name: 'Yusuf (Joseph)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Sold into slavery by his own brothers, then falsely accused and imprisoned in Egypt for years despite his innocence.', lesson: 'Rose to a position saving the region from famine — his story, told in Genesis and Surah Yusuf, is widely cited as a model of patience through betrayal.' },
  { name: 'Ayyub (Job)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Tradition describes him losing his wealth, his children, and his health to prolonged illness in rapid succession, while remaining outwardly faithful throughout.', lesson: 'Held up across Judaism, Christianity, and Islam as the archetypal model of patience (sabr) under compounding, undeserved loss — his eventual restoration is read as the reward for enduring without losing faith.' },
  { name: 'Nuh (Noah)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Accounts describe him preaching for centuries to a community that mocked and rejected him, including members of his own family, before the flood came.', lesson: 'Cited across traditions as the model of persisting in a difficult, unpopular mission for a lifetime without abandoning it.' },
  { name: 'Yunus (Jonah)', field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Fled the difficult task he was given, was cast overboard in a storm, and — in the account shared across Judaism, Christianity, and Islam — swallowed by a great fish.', lesson: 'His prayer for help from within the fish and eventual return to his mission is cited as a model of repentance and recommitment after failure, not just endurance through hardship.' },
  { name: "Ya'qub (Jacob)", field: 'Faith', category: 'Faith & Spiritual Traditions', hardship: 'Grieved the loss of his son Yusuf for decades believing him dead, reportedly weeping until his sight failed, then faced the imprisonment of another son.', lesson: 'His sustained grief paired with refusal to abandon hope — "I only complain of my grief and sorrow to God" — is cited as a model of mourning without despairing.' },

  // Scientists & inventors — foundational figures whose adversity is well
  // documented and directly shaped how they worked.
  { name: 'Albert Einstein', field: 'Physics', category: 'Scientists', hardship: 'Widely rejected for academic teaching posts after graduating and worked as a patent clerk; his 1905 "miracle year" papers were written outside any university position.', lesson: 'Produced the special theory of relativity and the photoelectric-effect paper (his Nobel-winning work) while shut out of the academic system he was trying to enter.' },
  { name: 'Isaac Newton', field: 'Physics & mathematics', category: 'Scientists', hardship: 'Born prematurely and not expected to survive; Cambridge closed during the Great Plague of 1665-66, forcing him into two years of isolated self-study at home.', lesson: 'That plague-era isolation produced his foundational work on calculus, optics, and gravitation — later formalized in the Principia.' },
  { name: 'Nikola Tesla', field: 'Electrical engineering', category: 'Scientists', hardship: 'Swindled out of pay by early employers, lived in poverty for stretches in New York, and saw his AC power system dismissed by rivals invested in DC.', lesson: 'His alternating-current system became the standard for electrical power distribution worldwide.' },
  { name: 'Alan Turing', field: 'Mathematics & computing', category: 'Scientists', hardship: 'Prosecuted and chemically castrated by the UK government in 1952 for homosexuality, then had his security clearance revoked despite his wartime codebreaking work.', lesson: 'His work breaking the Enigma cipher and his foundational papers on computation are now credited as cornerstones of modern computer science; he received a posthumous royal pardon in 2013.' },
  { name: 'Ada Lovelace', field: 'Mathematics & computing', category: 'Scientists', hardship: 'Chronically ill for much of her life and dismissed in her era as a woman working in mathematics, a field she was largely self-taught in through correspondence.', lesson: 'Her notes on Babbage\'s Analytical Engine are widely credited as the first published algorithm intended for a machine — she is regarded as a founding figure of computer science.' },
  { name: 'Louis Pasteur', field: 'Microbiology', category: 'Doctors & Scientists', hardship: 'Suffered a severe stroke at 46 that partially paralyzed his left side, and faced fierce resistance from the medical establishment over germ theory.', lesson: 'Continued his most important work on vaccination (rabies, anthrax) after the stroke, laying the foundation of modern microbiology and immunization.' },
  { name: 'Florence Nightingale', field: 'Nursing', category: 'Doctors & Scientists', hardship: 'Defied her wealthy family\'s expectations to work in a field considered unsuitable for women of her class, then spent most of her later decades bedridden with chronic illness.', lesson: 'Founded modern nursing and used statistical analysis of Crimean War death rates to drive hospital sanitation reform — much of it from her sickbed.' },

  // Business, invention & culture
  { name: 'Walt Disney', field: 'Animation & entertainment', category: 'Innovators', hardship: 'His first animation studio went bankrupt; he was reportedly told by an editor he "lacked imagination," and lost the rights to an early character, Oswald the Rabbit, to a distributor.', lesson: 'Rebuilt around a new character, Mickey Mouse, and built one of the most influential entertainment companies in history.' },
  { name: 'Oprah Winfrey', field: 'Media', category: 'Innovators', hardship: 'Grew up in poverty, was abused as a child, and was demoted from a local news anchor job early in her career for being "unfit for television."', lesson: 'Built the highest-rated daytime talk show in U.S. television history and became one of the most influential media figures and philanthropists in the world.' },
  { name: 'Steve Jobs', field: 'Technology', category: 'Innovators', hardship: 'Given up for adoption at birth, later publicly ousted from Apple, the company he co-founded, in 1985.', lesson: 'Returned over a decade later to lead Apple through its most transformative period, calling the ouster "the best thing that could have ever happened."' },
  { name: 'Henry Ford', field: 'Industry', category: 'Innovators', hardship: 'His first two automobile companies failed and left him without financial backers willing to invest again.', lesson: 'His third venture, Ford Motor Company, pioneered the moving assembly line and made automobile ownership affordable at scale.' },

  // Civil rights, politics & history
  { name: 'Abraham Lincoln', field: 'Politics', category: 'Leaders', hardship: 'Lost multiple elections, failed in business, and suffered recurring depression and personal losses including his mother and, later, his own young son, before reaching the presidency.', lesson: 'Led the United States through the Civil War and signed the Emancipation Proclamation, reshaping the nation\'s trajectory on slavery.' },
  { name: 'Winston Churchill', field: 'Politics', category: 'Leaders', hardship: 'A poor student who struggled with a stammer, was voted out of office after WWI, and spent much of the 1930s politically sidelined while warning — largely unheeded — about the rise of Nazi Germany.', lesson: 'Was recalled to lead Britain as Prime Minister through WWII, becoming one of the war\'s defining wartime leaders.' },
  { name: 'Mahatma Gandhi', field: 'Civil rights', category: 'Leaders', hardship: 'Thrown off a train in South Africa for refusing to leave a first-class compartment as an Indian man, and was jailed repeatedly by British colonial authorities over decades of civil disobedience.', lesson: 'His philosophy of nonviolent resistance (satyagraha) led India to independence and directly inspired later civil rights movements worldwide.' },
  { name: 'Martin Luther King Jr.', field: 'Civil rights', category: 'Leaders', hardship: 'Arrested nearly 30 times, his home was bombed, and he faced constant surveillance and death threats throughout the civil rights movement.', lesson: 'Led the movement that dismantled legal segregation in the U.S., becoming the youngest man at the time to receive the Nobel Peace Prize.' },
  { name: 'Frederick Douglass', field: 'Abolitionism', category: 'Leaders', hardship: 'Born into slavery, taught himself to read in defiance of laws forbidding it, and escaped to freedom at 20 under threat of severe punishment if caught.', lesson: 'Became one of the most influential abolitionist orators and writers in U.S. history, advising presidents on emancipation policy.' },
  { name: 'Harriet Tubman', field: 'Abolitionism', category: 'Leaders', hardship: 'Suffered a severe head injury as an enslaved teenager that caused lifelong seizures, then escaped slavery alone before returning repeatedly, at extreme personal risk, to guide others to freedom.', lesson: 'Personally led dozens of enslaved people north via the Underground Railroad and later served as a Union scout and spy during the Civil War.' },
  { name: 'Rosa Parks', field: 'Civil rights', category: 'Leaders', hardship: 'Arrested and fired from her job for refusing to give up her bus seat to a white passenger in segregated Montgomery, Alabama.', lesson: 'Her arrest sparked the Montgomery Bus Boycott, a foundational moment in the American civil rights movement.' },
  { name: 'Franklin D. Roosevelt', field: 'Politics', category: 'Leaders', hardship: 'Paralyzed from the waist down by polio at 39, at a time when disability was widely seen as disqualifying for public office; he concealed the extent of it for the rest of his political career.', lesson: 'Was elected U.S. president four times, leading the country through the Great Depression and most of WWII.' },

  // Arts & music
  { name: 'Ludwig van Beethoven', field: 'Music composition', category: 'Innovators', hardship: 'Began losing his hearing in his late twenties and was completely deaf for the final decade of his life.', lesson: 'Composed some of his most celebrated works, including his Ninth Symphony, after losing his hearing entirely.' },
  { name: 'Vincent van Gogh', field: 'Painting', category: 'Innovators', hardship: 'Struggled with severe mental illness, sold only one painting during his lifetime, and was largely dismissed by the art establishment of his time.', lesson: 'Produced over 2,000 works in roughly a decade; posthumously recognized as one of the most influential painters in Western art history.' },
  { name: 'Frida Kahlo', field: 'Painting', category: 'Innovators', hardship: 'Contracted polio as a child, then suffered life-altering injuries in a bus accident at 18 that caused lifelong pain and dozens of surgeries.', lesson: 'Painted much of her most acclaimed work from bed during recovery, becoming one of the most influential visual artists of the 20th century.' },
  { name: 'Maya Angelou', field: 'Writing', category: 'Innovators', hardship: 'Was mute by choice for nearly five years as a child after a traumatic assault, and worked a series of jobs, including as a young single mother, before her writing career began.', lesson: 'Became a celebrated poet and memoirist (I Know Why the Caged Bird Sings), later reading her work at a U.S. presidential inauguration.' },

  // More athletes
  { name: 'Muhammad Ali', field: 'Boxing', category: 'Athletes', hardship: 'Stripped of his heavyweight title and banned from boxing for over three years for refusing military service on religious grounds.', lesson: 'Returned to reclaim the heavyweight title and is widely regarded as one of the greatest boxers and most influential athletes in history.' },
  { name: 'Serena Williams', field: 'Tennis', category: 'Athletes', hardship: 'Nearly died from a pulmonary embolism and related complications after childbirth, requiring multiple emergency surgeries.', lesson: 'Returned to professional tennis and continued competing at the top level, later using her experience to advocate for maternal health equity.' },
  { name: 'Simone Biles', field: 'Gymnastics', category: 'Athletes', hardship: 'Withdrew from multiple 2020 Tokyo Olympics events after developing "the twisties," a dangerous loss of spatial awareness, prioritizing her mental health under intense public scrutiny.', lesson: 'Returned to competition and won further Olympic medals, reshaping public conversation about athlete mental health.' },
  { name: 'Michael Phelps', field: 'Swimming', category: 'Athletes', hardship: 'Diagnosed with ADHD as a child and later spoke openly about depression and suicidal thoughts following the peak of his competitive career.', lesson: 'Became the most decorated Olympian in history and has since become a prominent advocate for athlete mental health.' },
  { name: 'Pelé', field: 'Football', category: 'Athletes', hardship: 'Grew up in poverty in Bauru, Brazil, unable to afford a proper football and reportedly practicing with a sock stuffed with rags.', lesson: 'Won three FIFA World Cups (1958, 1962, 1970) and is widely regarded as one of the greatest players in the sport\'s history.' },
  { name: 'Diego Maradona', field: 'Football', category: 'Athletes', hardship: 'Grew up in Villa Fiorito, one of Buenos Aires\' poorest shantytowns, and battled cocaine addiction and suspensions for much of his professional career.', lesson: 'Led Argentina to the 1986 World Cup title virtually single-handedly, producing what many still regard as the greatest individual World Cup performance ever.' },
  { name: 'Novak Djokovic', field: 'Tennis', category: 'Athletes', hardship: 'Trained as a child in Serbia during the 1990s Yugoslav wars, at times practicing in a drained public swimming pool converted into a makeshift court during NATO bombing.', lesson: 'Became the men\'s all-time leader in Grand Slam singles titles and weeks at world No. 1.' },
  { name: 'Usain Bolt', field: 'Sprinting', category: 'Athletes', hardship: 'Diagnosed with scoliosis as a child, a spinal condition that affected his running form and caused recurring back problems throughout his career.', lesson: 'Set world records in the 100m (9.58s) and 200m (19.19s) and won eight Olympic gold medals.' },
  { name: 'Lewis Hamilton', field: 'Formula 1', category: 'Athletes', hardship: 'Grew up in a working-class family with his father working multiple jobs to fund his karting career, and faced racist abuse as one of the only Black drivers in a historically homogenous sport.', lesson: 'Became a seven-time Formula 1 World Champion, tied for the most in the sport\'s history.' },
  { name: 'Ayrton Senna', field: 'Formula 1', category: 'Athletes', hardship: 'Fought bitter political and technical battles within his own teams (notably at McLaren) over car reliability and team orders throughout his career.', lesson: 'Won three Formula 1 World Championships and is still widely regarded as one of the sport\'s most gifted and intense competitors.' },
  { name: 'Rafael Nadal', field: 'Tennis', category: 'Athletes', hardship: 'Battled chronic foot (Müller-Weiss syndrome) and knee injuries for most of his career, at multiple points reportedly told he might need to retire.', lesson: 'Repeatedly returned from injury layoffs to win a record 14 French Open titles and 22 Grand Slam titles overall.' },
  { name: 'Valentino Rossi', field: 'Motorcycle racing', category: 'Athletes', hardship: 'Faced fierce rivalries, manufacturer switches, and serious crashes across a career that spanned more than two decades in one of the most physically dangerous sports.', lesson: 'Won nine Grand Prix World Championships across multiple classes and became one of motorsport\'s most enduring figures.' },
  { name: 'Marc Márquez', field: 'Motorcycle racing', category: 'Athletes', hardship: 'A severe arm injury from a 2020 crash required four separate surgeries over several years and threatened to end his career entirely.', lesson: 'Returned to full competitiveness and continued winning at the sport\'s highest level after the prolonged recovery.' },
  { name: 'David Beckham', field: 'Football', category: 'Athletes', hardship: 'Was sent off in the 1998 World Cup for England and became the target of intense national hostility and death threats for years afterward.', lesson: 'Rebuilt his career and reputation to become one of the sport\'s most decorated and recognizable global figures.' },

  // Historical polymaths & scientists (additional)
  { name: 'Ibn Sina (Avicenna)', field: 'Medicine & philosophy', category: 'Doctors & Scientists', hardship: 'Lived through repeated political upheaval in 10th-11th century Persia, was imprisoned at least once, and wrote much of his major work while in hiding or on the move between rival courts.', lesson: 'Authored The Canon of Medicine, which remained a standard medical textbook in Europe and the Islamic world for roughly 600 years.' },
  { name: 'Rosalind Franklin', field: 'Chemistry & X-ray crystallography', category: 'Scientists', hardship: 'Her X-ray diffraction data was used without her knowledge to help Watson and Crick model DNA\'s structure, and she died of ovarian cancer at 37, before the Nobel Prize for the discovery was awarded.', lesson: 'Her "Photo 51" is now widely recognized as critical evidence in identifying DNA\'s double-helix structure, and her overlooked contribution helped prompt broader recognition of women\'s roles in the discovery.' },
  { name: 'J. Robert Oppenheimer', field: 'Theoretical physics', category: 'Scientists', hardship: 'Led the Manhattan Project to build the atomic bomb, then had his security clearance revoked in a 1954 hearing during the McCarthy era despite his service, effectively ending his influence on U.S. nuclear policy.', lesson: 'Spent his remaining years advocating for international control of nuclear weapons; the U.S. government formally vacated the 1954 decision in 2022, decades after his death.' },

  // Historical rulers & conquerors — included for documented, era-defining
  // influence and the genuine adversity in each figure's rise, not as an
  // endorsement of conquest or empire. (Note: figures whose rule was
  // fundamentally organized around genocide, such as Hitler and Mussolini,
  // are deliberately excluded from this "resilience" framing.)
  { name: 'Alexander the Great', field: 'Military leadership', category: 'Historical Rulers', hardship: 'Became king of Macedon at 20 after his father\'s assassination, immediately facing revolts across the kingdom\'s vassal territories that threatened to unravel it before his campaigns even began.', lesson: 'Built one of the largest empires of the ancient world by his early thirties, spreading Hellenistic culture across three continents.' },
  { name: 'Genghis Khan', field: 'Military leadership', category: 'Historical Rulers', hardship: 'Abandoned with his family on the Mongolian steppe after his father was poisoned, endured childhood poverty and enslavement by a rival clan, and was betrayed by former allies as a young leader.', lesson: 'United the fractured Mongol tribes and built the largest contiguous land empire in history.' },
  { name: 'Napoleon Bonaparte', field: 'Military & political leadership', category: 'Historical Rulers', hardship: 'A relatively poor Corsican-born artillery officer often mocked early in his career for his accent and background, later defeated and exiled twice (Elba, then Saint Helena, where he died in exile).', lesson: 'Reshaped European legal and administrative systems through the Napoleonic Code, portions of which still underpin civil law in many countries today.' },
  { name: 'Salahuddin Ayyubi (Saladin)', field: 'Military & political leadership', category: 'Historical Rulers', hardship: 'Inherited a Muslim world fractured by rival factions and had to unite deeply divided territories before he could challenge the Crusader states at all.', lesson: 'Recaptured Jerusalem in 1187 and was noted, including by his Crusader adversaries, for his comparatively measured treatment of defeated populations.' },
]

const CATEGORIES = ['All', ...Array.from(new Set(STORIES.map((s) => s.category)))]

export function ResilienceStories() {
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return STORIES.filter((s) => (cat === 'All' || s.category === cat) && (!q || (s.name + s.field + s.hardship + s.lesson).toLowerCase().includes(q)))
  }, [cat, q])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Resilience Stories" subtitle="Real people, real hardship, real comebacks" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A curated collection of well-documented doctors, scientists, athletes, innovators, leaders,
          Nobel laureates, and revered spiritual figures who faced serious adversity — illness, injury,
          poverty, rejection, loss, persecution — and kept going. Curated for accuracy over quantity:
          each story is a verifiable public fact pattern (or, for faith figures, each tradition's own
          well-known account), not padding.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{c}</button>
          ))}
        </div>
        <input className={`${inputClass} mt-3`} placeholder="Search a name, field, or struggle…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </Card>

      {filtered.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-400">No stories match "{query}".</Card>}

      {filtered.map((s) => (
        <Card key={s.name} className="!p-5">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black text-ink dark:text-white">{s.name}</span>
            <Badge tone="brand">{s.field}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500"><span className="font-bold text-neutral-600 dark:text-neutral-300">The struggle: </span>{s.hardship}</p>
          <p className="mt-2 rounded-xl bg-brand/10 px-3 py-2 text-[13px] leading-relaxed text-brand-dark">{s.lesson}</p>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Facts summarized from widely available public biographical record. Faith figures are described
        as their own tradition presents them, not as a claim between beliefs. This collection will grow
        over time — always with verifiable stories, never invented ones.
      </div>
    </div>
  )
}

export default ResilienceStories
