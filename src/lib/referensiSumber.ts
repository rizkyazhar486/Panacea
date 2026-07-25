// Daftar sumber rujukan (format Vancouver) yang dipakai bersama oleh catatan
// penyakit dan halaman keterampilan klinis.
//
// Dipisahkan ke modulnya sendiri agar halaman yang hanya membutuhkan daftar
// sitasi tidak ikut mengunduh seluruh isi skdiDiseaseNotes.ts (~600 kB).

/** Daftar sumber rujukan, format Vancouver. Key dipakai di field `referensi`. */
export const REFERENSI_SUMBER: Record<string, string> = {
  SKDI2012:
    'Konsil Kedokteran Indonesia. Standar Kompetensi Dokter Indonesia. Jakarta: Konsil Kedokteran Indonesia; 2012.',
  PPKFKTP2014:
    'Kementerian Kesehatan Republik Indonesia. Panduan Praktik Klinis bagi Dokter di Fasilitas Pelayanan Kesehatan Tingkat Pertama. Jakarta: Kementerian Kesehatan RI; 2014.',
  PAPDI2014:
    'Setiati S, Alwi I, Sudoyo AW, Simadibrata M, Setiyohadi B, Syam AF, editors. Buku Ajar Ilmu Penyakit Dalam. 6th ed. Jakarta: InternaPublishing; 2014.',
  HARRISON2022:
    "Loscalzo J, Fauci AS, Kasper DL, Hauser SL, Longo DL, Jameson JL, editors. Harrison's Principles of Internal Medicine. 21st ed. New York: McGraw Hill; 2022.",
  PERKENI2021:
    'Perkumpulan Endokrinologi Indonesia. Pedoman Pengelolaan dan Pencegahan Diabetes Melitus Tipe 2 Dewasa di Indonesia. Jakarta: PB PERKENI; 2021.',
  ADA2024:
    'American Diabetes Association Professional Practice Committee. Standards of Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1):S1-S321.',
  WHOSAM2013:
    'World Health Organization. Guideline: Updates on the Management of Severe Acute Malnutrition in Infants and Children. Geneva: World Health Organization; 2013.',
  FORENSIKFKUI:
    'Budiyanto A, Widiatmaka W, Sudiono S, Winardi T, Mun’im Idries A, Sidhi, et al. Ilmu Kedokteran Forensik. Jakarta: Bagian Kedokteran Forensik Fakultas Kedokteran Universitas Indonesia; 1997.',
  KNIGHT2016:
    "Saukko P, Knight B. Knight's Forensic Pathology. 4th ed. Boca Raton: CRC Press; 2016.",
  KDIGOCKD2024:
    'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.',
  KDIGOAKI2012:
    'Kidney Disease: Improving Global Outcomes (KDIGO) Acute Kidney Injury Work Group. KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2(1):1-138.',
  CAMPBELL2016:
    'Wein AJ, Kavoussi LR, Partin AW, Peters CA, editors. Campbell-Walsh Urology. 11th ed. Philadelphia: Elsevier; 2016.',
  HOFFBRAND2019:
    "Hoffbrand AV, Moss PAH. Hoffbrand's Essential Haematology. 8th ed. Oxford: Wiley-Blackwell; 2019.",
  SSC2021:
    'Evans L, Rhodes A, Alhazzani W, Antonelli M, Coopersmith CM, French C, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063-e1143.',
  WHODENGUE2009:
    'World Health Organization. Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control. New ed. Geneva: World Health Organization; 2009.',
  WAO2020:
    'Cardona V, Ansotegui IJ, Ebisawa M, El-Gamal Y, Fernandez Rivas M, Fineman S, et al. World Allergy Organization Anaphylaxis Guidance 2020. World Allergy Organ J. 2020;13(10):100472.',
  ACREULAR2010:
    'Aletaha D, Neogi T, Silman AJ, Funovits J, Felson DT, Bingham CO 3rd, et al. 2010 Rheumatoid Arthritis Classification Criteria: an American College of Rheumatology/European League Against Rheumatism Collaborative Initiative. Arthritis Rheum. 2010;62(9):2569-81.',
  WILLIAMSOB2022:
    "Cunningham FG, Leveno KJ, Dashe JS, Hoffman BL, Spong CY, Casey BM, editors. Williams Obstetrics. 26th ed. New York: McGraw Hill; 2022.",
  POGI2016:
    'Perkumpulan Obstetri dan Ginekologi Indonesia. Pedoman Nasional Pelayanan Kedokteran: Pelayanan Kesehatan Maternal dan Neonatal. Jakarta: POGI; 2016.',
  WHOPPH2012:
    'World Health Organization. WHO Recommendations for the Prevention and Treatment of Postpartum Haemorrhage. Geneva: World Health Organization; 2012.',
  KANSKI2020:
    "Salmon JF. Kanski's Clinical Ophthalmology: A Systematic Approach. 9th ed. Edinburgh: Elsevier; 2020.",
  CUMMINGS2021:
    'Flint PW, Francis HW, Haughey BH, Lesperance MM, Lund VJ, Robbins KT, et al., editors. Cummings Otolaryngology: Head and Neck Surgery. 7th ed. Philadelphia: Elsevier; 2021.',
  FITZPATRICK2019:
    "Kang S, Amagai M, Bruckner AL, Enk AH, Margolis DJ, McMichael AJ, et al., editors. Fitzpatrick's Dermatology. 9th ed. New York: McGraw Hill; 2019.",
  PERDOSKI2021:
    'Perhimpunan Dokter Spesialis Kulit dan Kelamin Indonesia. Panduan Praktik Klinis bagi Dokter Spesialis Kulit dan Kelamin di Indonesia. Jakarta: PERDOSKI; 2021.',
  WHOLEPROSY2018:
    'World Health Organization. Guidelines for the Diagnosis, Treatment and Prevention of Leprosy. New Delhi: WHO Regional Office for South-East Asia; 2018.',
  SLEISENGER2021:
    "Feldman M, Friedman LS, Brandt LJ, editors. Sleisenger and Fordtran's Gastrointestinal and Liver Disease. 11th ed. Philadelphia: Elsevier; 2021.",
  WHOHEPB2024:
    'World Health Organization. Guidelines for the Prevention, Diagnosis, Care and Treatment for People with Chronic Hepatitis B Infection. Geneva: World Health Organization; 2024.',
  SCHWARTZ2019:
    "Brunicardi FC, Andersen DK, Billiar TR, Dunn DL, Kao LS, Hunter JG, et al., editors. Schwartz's Principles of Surgery. 11th ed. New York: McGraw Hill; 2019.",
  ADAMS2019:
    "Ropper AH, Samuels MA, Klein JP, Prasad S. Adams and Victor's Principles of Neurology. 11th ed. New York: McGraw Hill; 2019.",
  PERDOSSI2016:
    'Perhimpunan Dokter Spesialis Saraf Indonesia. Panduan Praktik Klinis Neurologi. Jakarta: PERDOSSI; 2016.',
  AHASTROKE2019:
    'Powers WJ, Rabinstein AA, Ackerson T, Adeoye OM, Bambakidis NC, Becker K, et al. Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update. Stroke. 2019;50(12):e344-418.',
  PPDGJIII:
    'Departemen Kesehatan Republik Indonesia, Direktorat Jenderal Pelayanan Medik. Pedoman Penggolongan dan Diagnosis Gangguan Jiwa di Indonesia III (PPDGJ-III). Jakarta: Departemen Kesehatan RI; 1993.',
  DSM5TR2022:
    'American Psychiatric Association. Diagnostic and Statistical Manual of Mental Disorders. 5th ed., text revision (DSM-5-TR). Washington, DC: American Psychiatric Association Publishing; 2022.',
  KAPLAN2015:
    "Sadock BJ, Sadock VA, Ruiz P. Kaplan & Sadock's Synopsis of Psychiatry: Behavioral Sciences/Clinical Psychiatry. 11th ed. Philadelphia: Wolters Kluwer; 2015.",
  WHOMHGAP2016:
    'World Health Organization. mhGAP Intervention Guide for Mental, Neurological and Substance Use Disorders in Non-Specialized Health Settings. Version 2.0. Geneva: World Health Organization; 2016.',
  PERKIHF2020:
    'Perhimpunan Dokter Spesialis Kardiovaskular Indonesia. Pedoman Tatalaksana Gagal Jantung. 2nd ed. Jakarta: PERKI; 2020.',
  PERKIHT2021:
    'Perhimpunan Dokter Spesialis Kardiovaskular Indonesia. Pedoman Tatalaksana Hipertensi pada Penyakit Kardiovaskular. 2nd ed. Jakarta: PERKI; 2021.',
  ESCACS2023:
    'Byrne RA, Rossello X, Coughlan JJ, Barbato E, Berry C, Chieffo A, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023;44(38):3720-826.',
  BRAUNWALD2022:
    "Libby P, Bonow RO, Mann DL, Tomaselli GF, Bhatt DL, Solomon SD, editors. Braunwald's Heart Disease: A Textbook of Cardiovascular Medicine. 12th ed. Philadelphia: Elsevier; 2022.",
  GOLD2024:
    'Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for the Diagnosis, Management, and Prevention of Chronic Obstructive Pulmonary Disease: 2024 Report. GOLD; 2024.',
  PNPKTB2020:
    'Kementerian Kesehatan Republik Indonesia. Pedoman Nasional Pelayanan Kedokteran Tata Laksana Tuberkulosis. Jakarta: Kementerian Kesehatan RI; 2020.',
  WHOTBDR2022:
    'World Health Organization. WHO Consolidated Guidelines on Tuberculosis. Module 4: Treatment — Drug-Resistant Tuberculosis Treatment, 2022 Update. Geneva: World Health Organization; 2022.',
  MURRAY2022:
    "Broaddus VC, Ernst JD, King TE Jr, Lazarus SC, Sarmiento KF, Schnapp LM, et al., editors. Murray & Nadel's Textbook of Respiratory Medicine. 7th ed. Philadelphia: Elsevier; 2022.",
  ARDSBERLIN2012:
    'ARDS Definition Task Force; Ranieri VM, Rubenfeld GD, Thompson BT, Ferguson ND, Caldwell E, et al. Acute respiratory distress syndrome: the Berlin Definition. JAMA. 2012;307(23):2526-33.',
  APLEY2018:
    "Solomon L, Warwick D, Nayagam S. Apley & Solomon's System of Orthopaedics and Trauma. 10th ed. Boca Raton: CRC Press; 2018.",
  CAMPBELLORTHO2021:
    "Azar FM, Beaty JH, editors. Campbell's Operative Orthopaedics. 14th ed. Philadelphia: Elsevier; 2021.",
  ATLS2018:
    'American College of Surgeons Committee on Trauma. Advanced Trauma Life Support: Student Course Manual. 10th ed. Chicago: American College of Surgeons; 2018.',
  ATA2016:
    'Ross DS, Burch HB, Cooper DS, Greenlee MC, Laurberg P, Maia AL, et al. 2016 American Thyroid Association Guidelines for Diagnosis and Management of Hyperthyroidism and Other Causes of Thyrotoxicosis. Thyroid. 2016;26(10):1343-421.',
  ICHD3:
    'Headache Classification Committee of the International Headache Society (IHS). The International Classification of Headache Disorders, 3rd edition. Cephalalgia. 2018;38(1):1-211.',
  AAOBPPV2017:
    'Bhattacharyya N, Gubbels SP, Schwartz SR, Edlow JA, El-Kashlan H, Fife T, et al. Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update). Otolaryngol Head Neck Surg. 2017;156(3 Suppl):S1-S47.',
  AAOBELL2013:
    "Baugh RF, Basura GJ, Ishii LE, Schwartz SR, Drumheller CM, Burkholder R, et al. Clinical practice guideline: Bell's palsy. Otolaryngol Head Neck Surg. 2013;149(3 Suppl):S1-27.",
  IDSAFLU2018:
    'Uyeki TM, Bernstein HH, Bradley JS, Englund JA, File TM Jr, Fry AM, et al. Clinical Practice Guidelines by the Infectious Diseases Society of America: 2018 Update on Diagnosis, Treatment, Chemoprophylaxis, and Institutional Outbreak Management of Seasonal Influenza. Clin Infect Dis. 2019;68(6):e1-e47.',
  ACGGERD2022:
    'Katz PO, Dunbar KB, Schnoll-Sussman FH, Greer KB, Yadlapati R, Spechler SJ. ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease. Am J Gastroenterol. 2022;117(1):27-56.',
  WHOSTH2020:
    'World Health Organization. 2030 Targets for Soil-Transmitted Helminthiases Control Programmes. Geneva: World Health Organization; 2020.',
  ACRGOUT2020:
    'FitzGerald JD, Dalbeth N, Mikuls T, Brignardello-Petersen R, Guyatt G, Abeles AM, et al. 2020 American College of Rheumatology Guideline for the Management of Gout. Arthritis Rheumatol. 2020;72(6):879-95.',
  CDCSTI2021:
    'Workowski KA, Bachmann LH, Chan PA, Johnston CM, Muzny CA, Park I, et al. Sexually Transmitted Infections Treatment Guidelines, 2021. MMWR Recomm Rep. 2021;70(4):1-187.',
  IDSASSTI2014:
    'Stevens DL, Bisno AL, Chambers HF, Dellinger EP, Goldstein EJC, Gorbach SL, et al. Practice Guidelines for the Diagnosis and Management of Skin and Soft Tissue Infections: 2014 Update by the Infectious Diseases Society of America. Clin Infect Dis. 2014;59(2):e10-52.',
  WHOASIAPAC2000:
    'World Health Organization Regional Office for the Western Pacific, International Association for the Study of Obesity, International Obesity Task Force. The Asia-Pacific Perspective: Redefining Obesity and Its Treatment. Sydney: Health Communications Australia; 2000.',
  KEMENKESOBESITAS2015:
    'Kementerian Kesehatan Republik Indonesia. Pedoman Umum Pengendalian Obesitas. Jakarta: Direktorat Jenderal Pencegahan dan Pengendalian Penyakit, Kementerian Kesehatan RI; 2015.',
  ASCRSHEM2018:
    'Davis BR, Lee-Kong SA, Migaly J, Feingold DL, Steele SR. The American Society of Colon and Rectal Surgeons Clinical Practice Guidelines for the Management of Hemorrhoids. Dis Colon Rectum. 2018;61(3):284-92.',
}
