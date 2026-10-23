// sweep:all-engines (penanda untuk scripts/qa/calculator-mutation-sweep.mts: suite ini menjalankan semua mesin lewat indeks)
// C6 (bagian rekayasa), tahap 13: batas rentang masukan seluruh mesin kalkulator, dipaku sebagai literal. Sapuan mutasi
// (docs/governance/CALCULATOR_MUTATION_SWEEP.md) menemukan 94 mutan batas rentang di 27 mesin yang selamat: mengubah `max: 300` menjadi `301`
// tidak membuat suite referensi mana pun gagal. Suite ini mengunci 66 tabel rentang yang diekspor.
// BATAS KLAIM: ini batas KEWARASAN masukan buatan repo (bukan ambang klinis, lihat komentar di tiap mesin). Nilai di bawah adalah foto (golden
// master) dari batas yang berlaku saat suite ditulis; tujuannya detektor perubahan: mengubah satu batas HARUS disertai perubahan di sini dan
// ditinjau. Ini tidak membuktikan batasnya benar secara klinis. Perilaku di tepi (tepat di batas diterima, satu langkah di luar ditolak dengan
// alasan bernama) diuji per mesin di suite 12 untuk mesin yang mengubah label atau skor, dan oleh suite 1-11 untuk banyak lainnya.
import assert from 'node:assert/strict'
import * as calc from '../../src/domains/clinical-calculators/index.ts'

const PIN: Record<string, unknown> = {
  "AA_RANGES": {
    "fio2": {
      "min": 21,
      "max": 100
    },
    "pao2": {
      "min": 1,
      "max": 700
    },
    "paco2": {
      "min": 5,
      "max": 150
    },
    "age": {
      "min": 0,
      "max": 120
    },
    "patm": {
      "min": 400,
      "max": 800
    }
  },
  "ABG_RANGES": {
    "ph": {
      "min": 6.5,
      "max": 8
    },
    "paco2": {
      "min": 5,
      "max": 150
    },
    "hco3": {
      "min": 1,
      "max": 60
    },
    "na": {
      "min": 90,
      "max": 200
    },
    "cl": {
      "min": 50,
      "max": 160
    },
    "albumin": {
      "min": 0.5,
      "max": 7
    }
  },
  "APGAR": {
    "min": 0,
    "max": 10
  },
  "AUTOPHAGY_RANGES": {
    "bodyFatPct": {
      "min": 3,
      "max": 70
    },
    "hoursSinceMeal": {
      "min": 0,
      "max": 72
    }
  },
  "BAC_RANGES": {
    "weightKg": {
      "min": 30,
      "max": 200
    },
    "hours": {
      "min": 0,
      "max": 12
    },
    "drinkCount": {
      "min": 0,
      "max": 50
    }
  },
  "BIRTH_WEIGHT_G": {
    "min": 200,
    "max": 8000
  },
  "CA_RANGES": {
    "totalCa": {
      "min": 2,
      "max": 20
    },
    "albumin": {
      "min": 0.5,
      "max": 7
    }
  },
  "CAFFEINE_RANGES": {
    "servings": {
      "min": 0,
      "max": 20
    },
    "customMg": {
      "min": 0,
      "max": 2000
    },
    "halfLifeH": {
      "min": 1.5,
      "max": 9.5
    }
  },
  "CDC_AGE_YEARS": {
    "min": 2,
    "max": 20
  },
  "CDC_HEIGHT_CM": {
    "min": 50,
    "max": 250
  },
  "CDC_WEIGHT_KG": {
    "min": 5,
    "max": 300
  },
  "CENTOR_AGE_YEARS": {
    "min": 0,
    "max": 120
  },
  "CG_RANGES": {
    "age": {
      "min": 18,
      "max": 120
    },
    "weightKg": {
      "min": 20,
      "max": 400
    },
    "heightCm": {
      "min": 100,
      "max": 250
    },
    "scr": {
      "min": 0.1,
      "max": 20
    }
  },
  "CHARLSON_AGE": {
    "min": 18,
    "max": 110
  },
  "CP_RANGES": {
    "bilirubin": {
      "min": 0.1,
      "max": 60
    },
    "albumin": {
      "min": 0.5,
      "max": 7
    },
    "inr": {
      "min": 0.5,
      "max": 15
    }
  },
  "CYCLE_LENGTH_DAYS": {
    "min": 20,
    "max": 60
  },
  "DENVER_AGE_MONTHS": {
    "min": 0,
    "max": 72
  },
  "DIASTOLIC_MMHG": {
    "min": 20,
    "max": 200
  },
  "DKA_RANGES": {
    "weightKg": {
      "min": 2,
      "max": 120
    },
    "dehydrationPct": {
      "min": 1,
      "max": 15
    },
    "potassiumMeq": {
      "min": 1,
      "max": 10
    },
    "insulinRateUKgHr": {
      "min": 0.01,
      "max": 0.1
    }
  },
  "DONATION_RANGES": {
    "age": {
      "min": 5,
      "max": 120
    },
    "weightKg": {
      "min": 20,
      "max": 250
    }
  },
  "FENA_RANGES": {
    "urineNa": {
      "min": 0.1,
      "max": 400
    },
    "plasmaCr": {
      "min": 0.1,
      "max": 30
    },
    "plasmaNa": {
      "min": 90,
      "max": 200
    },
    "urineCr": {
      "min": 1,
      "max": 1500
    }
  },
  "FINDRISC_RANGES": {
    "age": {
      "min": 18,
      "max": 120
    },
    "bmi": {
      "min": 10,
      "max": 80
    },
    "waist": {
      "min": 30,
      "max": 250
    }
  },
  "FLUID_COMPONENT_ML": {
    "min": 0,
    "max": 20000
  },
  "FLUID_RANGES": {
    "weightKg": {
      "min": 0.5,
      "max": 300
    },
    "tbsaPct": {
      "min": 1,
      "max": 100
    },
    "sodium": {
      "min": 90,
      "max": 200
    },
    "glucose": {
      "min": 20,
      "max": 2000
    },
    "potassium": {
      "min": 1,
      "max": 10
    }
  },
  "FRAMINGHAM_RANGE": {
    "age": {
      "min": 30,
      "max": 74
    },
    "totChol": {
      "min": 100,
      "max": 500
    },
    "hdl": {
      "min": 10,
      "max": 150
    },
    "sbp": {
      "min": 70,
      "max": 300
    }
  },
  "GBS_RANGES": {
    "bun": {
      "min": 1,
      "max": 300
    },
    "hgb": {
      "min": 2,
      "max": 25
    },
    "sbp": {
      "min": 30,
      "max": 300
    }
  },
  "GLUCOSE_MG_DL": {
    "min": 20,
    "max": 2000
  },
  "GRACE_RANGES": {
    "age": {
      "min": 18,
      "max": 120
    },
    "hr": {
      "min": 20,
      "max": 300
    },
    "sbp": {
      "min": 40,
      "max": 300
    },
    "creat": {
      "min": 0.1,
      "max": 25
    }
  },
  "GRIP_KG": {
    "min": 1,
    "max": 100
  },
  "HYDRATION_RANGES": {
    "weightKg": {
      "min": 30,
      "max": 200
    },
    "exerciseMin": {
      "min": 0,
      "max": 600
    }
  },
  "IBW_HEIGHT_CM": {
    "min": 120,
    "max": 250
  },
  "IV_DURATION_HOURS": {
    "min": 0.1,
    "max": 168
  },
  "IV_VOLUME_ML": {
    "min": 1,
    "max": 20000
  },
  "LDL_RANGES": {
    "totalChol": {
      "min": 50,
      "max": 1000
    },
    "hdl": {
      "min": 5,
      "max": 200
    },
    "tg": {
      "min": 10,
      "max": 5000
    }
  },
  "LIGHTS_RANGES": {
    "pleuralProtein": {
      "min": 0.1,
      "max": 15
    },
    "serumProtein": {
      "min": 0.5,
      "max": 15
    },
    "pleuralLdh": {
      "min": 1,
      "max": 20000
    },
    "serumLdh": {
      "min": 1,
      "max": 20000
    },
    "serumLdhUln": {
      "min": 1,
      "max": 2000
    }
  },
  "LMP_YEAR": {
    "min": 1900,
    "max": 2100
  },
  "MADDREY_RANGES": {
    "bilirubin": {
      "min": 0.1,
      "max": 60
    },
    "patientPt": {
      "min": 5,
      "max": 150
    },
    "controlPt": {
      "min": 5,
      "max": 60
    }
  },
  "MAINTENANCE_WEIGHT_KG": {
    "min": 0.3,
    "max": 300
  },
  "MCDONALD_FUNDAL_CM": {
    "min": 20,
    "max": 36
  },
  "MELD_RANGES": {
    "bilirubin": {
      "min": 0.1,
      "max": 60
    },
    "inr": {
      "min": 0.5,
      "max": 10
    },
    "creatinine": {
      "min": 0.1,
      "max": 20
    },
    "sodium": {
      "min": 100,
      "max": 180
    }
  },
  "NEONATE_AGE_DAYS": {
    "min": 0,
    "max": 30
  },
  "NEONATE_WEIGHT_G": {
    "min": 200,
    "max": 8000
  },
  "NEWS2_RANGES": {
    "rr": {
      "min": 1,
      "max": 80
    },
    "spo2": {
      "min": 30,
      "max": 100
    },
    "sbp": {
      "min": 20,
      "max": 300
    },
    "hr": {
      "min": 10,
      "max": 300
    },
    "temp": {
      "min": 20,
      "max": 45
    }
  },
  "OSM_RANGES": {
    "na": {
      "min": 90,
      "max": 200
    },
    "glucose": {
      "min": 20,
      "max": 2000
    },
    "bun": {
      "min": 1,
      "max": 300
    },
    "ethanol": {
      "min": 0,
      "max": 1000
    },
    "measured": {
      "min": 150,
      "max": 600
    }
  },
  "PACK_YEAR_RANGES": {
    "cigsPerDay": {
      "min": 0,
      "max": 200
    },
    "yearsSmoked": {
      "min": 0,
      "max": 90
    },
    "age": {
      "min": 10,
      "max": 120
    },
    "quitYearsAgo": {
      "min": 0,
      "max": 100
    }
  },
  "PARADISE_EPISODES": {
    "min": 0,
    "max": 365
  },
  "PARENT_HEIGHT_CM": {
    "min": 100,
    "max": 250
  },
  "PARKLAND_TBSA_PERCENT": {
    "min": 0,
    "max": 100
  },
  "PARKLAND_WEIGHT_KG": {
    "min": 0.5,
    "max": 300
  },
  "PEDS_FREQUENCY_PER_DAY": {
    "min": 1,
    "max": 24
  },
  "PEDS_WEIGHT_KG": {
    "min": 0.3,
    "max": 200
  },
  "POTASSIUM_MEQ_L": {
    "min": 1,
    "max": 10
  },
  "QTC_RANGES": {
    "qtMs": {
      "min": 200,
      "max": 700
    },
    "hr": {
      "min": 30,
      "max": 200
    }
  },
  "RISK_RANGES": {
    "age": {
      "min": 18,
      "max": 120
    },
    "weightKg": {
      "min": 20,
      "max": 400
    },
    "totChol": {
      "min": 50,
      "max": 1000
    },
    "hdl": {
      "min": 5,
      "max": 200
    },
    "sbp": {
      "min": 50,
      "max": 300
    },
    "ast": {
      "min": 1,
      "max": 5000
    },
    "alt": {
      "min": 1,
      "max": 5000
    },
    "platelets": {
      "min": 5,
      "max": 2000
    }
  },
  "SLEEP_RANGES": {
    "need": {
      "min": 5,
      "max": 11
    },
    "hours": {
      "min": 0,
      "max": 16
    }
  },
  "SODIUM_MEQ_L": {
    "min": 80,
    "max": 200
  },
  "SOFA_RANGES": {
    "pf": {
      "min": 20,
      "max": 800
    },
    "plt": {
      "min": 1,
      "max": 2000
    },
    "bili": {
      "min": 0.1,
      "max": 60
    },
    "creat": {
      "min": 0.1,
      "max": 25
    },
    "gcs": {
      "min": 3,
      "max": 15
    }
  },
  "STOP_BANG_RANGES": {
    "bmi": {
      "min": 10,
      "max": 100
    },
    "age": {
      "min": 10,
      "max": 120
    },
    "neckCm": {
      "min": 20,
      "max": 100
    }
  },
  "SYSTOLIC_MMHG": {
    "min": 40,
    "max": 300
  },
  "THRESHOLD_DB_HL": {
    "min": -10,
    "max": 120
  },
  "WAIST_CM": {
    "min": 40,
    "max": 200
  },
  "WHO_AGE_MONTHS": {
    "min": 0,
    "max": 60
  },
  "WHO_LENGTH_CM": {
    "min": 30,
    "max": 150
  },
  "WHO_WEIGHT_KG": {
    "min": 0.5,
    "max": 60
  },
  "WHTR_HEIGHT_CM": {
    "min": 100,
    "max": 230
  },
  "ZONE2_AGE_YEARS": {
    "min": 10,
    "max": 100
  }
}

const isLimit = (v: unknown): v is { min: number; max: number } => !!v && typeof v === 'object' && typeof (v as any).min === 'number' && typeof (v as any).max === 'number'
const isTable = (v: unknown): boolean => !!v && typeof v === 'object' && !Array.isArray(v) && (isLimit(v) || (Object.keys(v as object).length > 0 && Object.values(v as object).every((x) => isLimit(x))))
const norm = (v: unknown): unknown => isLimit(v) ? { min: v.min, max: v.max } : Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, norm(x)]))
const exported = calc as unknown as Record<string, unknown>

// 1. Setiap tabel yang dipaku masih ada dan nilainya sama persis (positif); satu perubahan sekecil apa pun membuatnya gagal bernama.
for (const [name, expected] of Object.entries(PIN)) {
  assert.ok(name in exported, `tabel rentang yang dipaku tidak lagi diekspor (basi): ${name}`)
  assert.deepEqual(norm(exported[name]), expected, `batas rentang berubah: ${name}`)
}
// 2. Kelengkapan: tabel rentang BARU yang diekspor tanpa paku menggagalkan suite (batas baru harus ditinjau).
const unpinned = Object.entries(exported).filter(([name, v]) => isTable(v) && !(name in PIN)).map(([name]) => name)
assert.deepEqual(unpinned, [], `tabel rentang diekspor tanpa dipaku: ${unpinned.join(', ')}`)
assert.ok(Object.keys(PIN).length >= 66, 'jumlah tabel yang dipaku tidak boleh menyusut diam-diam')
// 3. Pemeriksa dirinya sendiri bisa gagal: mengenali tabel, dan satu perubahan satu langkah tertangkap.
assert.equal(isTable({ min: 1, max: 2 }), true)
assert.equal(isTable({ a: { min: 1, max: 2 }, b: { min: 0, max: 9 } }), true)
assert.equal(isTable({ a: { min: 1 } }), false)
assert.equal(isTable([]), false)
assert.equal(isTable(null), false)
assert.notDeepEqual(norm({ min: 40, max: 301 }), norm({ min: 40, max: 300 }), 'max 300 -> 301 terdeteksi')
assert.deepEqual(norm({ a: { min: 1, max: 2, name: 'x', unit: 'y' } }), { a: { min: 1, max: 2 } }, 'teks tampilan tidak ikut dipaku')

console.log('calculator-independent-reference-13: 66 tabel rentang masukan dipaku sebagai literal (batas kewarasan, bukan ambang klinis); tabel baru tanpa paku dan paku basi menggagalkan suite')
