// DIBANGKITKAN oleh scripts/atlasOrgan.mjs — jangan disunting tangan.
//
// Geometri organ diambil dari BodyParts3D 4.0 (Database Center for Life
// Science, CC BY 4.0) lewat kemasan ashemag/human-atlas. Berbeda dengan model
// di /public/organs/ yang dibuat AI, yang ini geometri manusia rujukan yang
// sesungguhnya, dan tiap mesh membawa nama anatomisnya sendiri.
import type { OrganModel } from './organModels'

export const ORGAN_ATLAS: OrganModel[] = [
  {
    "id": "eye",
    "focusKey": "eye",
    "label": "Eye",
    "scientificName": "Oculus",
    "accent": "#b86858",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 26,
    "hotspots": [
      {
        "id": "right-corona-ciliaris",
        "ta": "Right corona ciliaris",
        "position": [
          -0.731,
          -0.148,
          0.604
        ],
        "color": "#b86858"
      },
      {
        "id": "left-corona-ciliaris",
        "ta": "Left corona ciliaris",
        "position": [
          0.727,
          -0.141,
          0.604
        ],
        "color": "#d89bc4"
      },
      {
        "id": "left-sclera",
        "ta": "Left sclera",
        "position": [
          0.698,
          -0.133,
          0.44
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-sclera",
        "ta": "Right sclera",
        "position": [
          -0.693,
          -0.133,
          0.448
        ],
        "color": "#c69a5e"
      },
      {
        "id": "left-choroid",
        "ta": "Left choroid",
        "position": [
          0.7,
          -0.135,
          0.424
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-choroid",
        "ta": "Right choroid",
        "position": [
          -0.692,
          -0.13,
          0.44
        ],
        "color": "#7294b9"
      },
      {
        "id": "optic-part-of-left-retina",
        "ta": "Optic part of left retina",
        "position": [
          0.693,
          -0.13,
          0.381
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "optic-part-of-right-retina",
        "ta": "Optic part of right retina",
        "position": [
          -0.694,
          -0.128,
          0.381
        ],
        "color": "#7fa88a"
      }
    ]
  },
  {
    "id": "optic-pathway",
    "focusKey": "optic-pathway",
    "label": "Optic pathway",
    "scientificName": "Via optica",
    "accent": "#f2a33b",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 10,
    "hotspots": [
      {
        "id": "optic-part-of-left-retina",
        "ta": "Optic part of left retina",
        "position": [
          0.67,
          -0.169,
          0.818
        ],
        "color": "#f2a33b"
      },
      {
        "id": "optic-part-of-right-retina",
        "ta": "Optic part of right retina",
        "position": [
          -0.671,
          -0.168,
          0.818
        ],
        "color": "#d89bc4"
      },
      {
        "id": "left-optic-tract",
        "ta": "Left optic tract",
        "position": [
          0.338,
          0.327,
          -0.631
        ],
        "color": "#7294b9"
      },
      {
        "id": "right-optic-tract",
        "ta": "Right optic tract",
        "position": [
          -0.335,
          0.327,
          -0.628
        ],
        "color": "#f2a33b"
      },
      {
        "id": "optic-chiasm",
        "ta": "Optic chiasm",
        "position": [
          0.089,
          0.322,
          -0.199
        ],
        "color": "#7fa88a"
      },
      {
        "id": "optic-chiasm",
        "ta": "Optic chiasm",
        "position": [
          -0.089,
          0.321,
          -0.196
        ],
        "color": "#b86858"
      },
      {
        "id": "right-optic-nerve",
        "ta": "Right optic nerve",
        "position": [
          -0.346,
          0.105,
          0.225
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "left-optic-nerve",
        "ta": "Left optic nerve",
        "position": [
          0.347,
          0.105,
          0.224
        ],
        "color": "#c69a5e"
      }
    ]
  },
  {
    "id": "spleen",
    "focusKey": "spleen",
    "label": "Spleen",
    "scientificName": "Splen",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 1,
    "hotspots": [
      {
        "id": "spleen",
        "ta": "Spleen",
        "position": [
          0.039,
          -0.069,
          -0.059
        ],
        "color": "#ee7c6a"
      }
    ]
  },
  {
    "id": "stomach",
    "focusKey": "stomach",
    "label": "Stomach",
    "scientificName": "Gaster",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 1,
    "hotspots": [
      {
        "id": "stomach",
        "ta": "Stomach",
        "position": [
          0.01,
          -0.001,
          0.038
        ],
        "color": "#ee7c6a"
      }
    ]
  },
  {
    "id": "gallbladder",
    "focusKey": "gallbladder",
    "label": "Gallbladder",
    "scientificName": "Vesica biliaris",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 2,
    "hotspots": [
      {
        "id": "gallbladder",
        "ta": "Gallbladder",
        "position": [
          -0.19,
          -0.065,
          0.034
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "cystic-duct",
        "ta": "Cystic duct",
        "position": [
          0.666,
          0.586,
          -0.811
        ],
        "color": "#f2a33b"
      }
    ]
  },
  {
    "id": "bladder",
    "focusKey": "bladder",
    "label": "Bladder & ureters",
    "scientificName": "Vesica urinaria",
    "accent": "#f2a33b",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 4,
    "hotspots": [
      {
        "id": "right-ureter",
        "ta": "Right ureter",
        "position": [
          -0.265,
          0.43,
          -0.175
        ],
        "color": "#f2a33b"
      },
      {
        "id": "left-ureter",
        "ta": "Left ureter",
        "position": [
          0.257,
          0.536,
          -0.205
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "urethra",
        "ta": "Urethra",
        "position": [
          -0.022,
          -0.706,
          0.095
        ],
        "color": "#6393d8"
      },
      {
        "id": "urinary-bladder",
        "ta": "Urinary bladder",
        "position": [
          -0.005,
          -0.421,
          -0.19
        ],
        "color": "#d89bc4"
      }
    ]
  },
  {
    "id": "prostate",
    "focusKey": "prostate",
    "label": "Prostate & seminal tract",
    "scientificName": "Prostata",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 5,
    "hotspots": [
      {
        "id": "left-deferent-duct",
        "ta": "Left deferent duct",
        "position": [
          0.318,
          0.044,
          0.194
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-deferent-duct",
        "ta": "Right deferent duct",
        "position": [
          -0.428,
          -0.005,
          0.171
        ],
        "color": "#d89bc4"
      },
      {
        "id": "prostate",
        "ta": "Prostate",
        "position": [
          -0.107,
          0.055,
          -0.253
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-seminal-vesicle",
        "ta": "Left seminal vesicle",
        "position": [
          0.085,
          0.276,
          -0.429
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-seminal-vesicle",
        "ta": "Right seminal vesicle",
        "position": [
          -0.307,
          0.282,
          -0.43
        ],
        "color": "#7fa88a"
      }
    ]
  },
  {
    "id": "testis",
    "focusKey": "testis",
    "label": "Testis & epididymis",
    "scientificName": "Testis",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 4,
    "hotspots": [
      {
        "id": "left-epididymis",
        "ta": "Left epididymis",
        "position": [
          0.702,
          0.237,
          -0.152
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-testis",
        "ta": "Right testis",
        "position": [
          -0.648,
          -0.068,
          0.023
        ],
        "color": "#d89bc4"
      },
      {
        "id": "left-testis",
        "ta": "Left testis",
        "position": [
          0.654,
          -0.072,
          0.014
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-epididymis",
        "ta": "Right epididymis",
        "position": [
          -0.67,
          0.129,
          -0.174
        ],
        "color": "#6393d8"
      }
    ]
  },
  {
    "id": "adrenal",
    "focusKey": "adrenal",
    "label": "Adrenal glands",
    "scientificName": "Glandula suprarenalis",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 2,
    "hotspots": [
      {
        "id": "left-adrenal-gland",
        "ta": "Left adrenal gland",
        "position": [
          0.612,
          0.167,
          -0.152
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-adrenal-gland",
        "ta": "Right adrenal gland",
        "position": [
          -0.712,
          -0.124,
          0.101
        ],
        "color": "#f2a33b"
      }
    ]
  },
  {
    "id": "pituitary",
    "focusKey": "pituitary",
    "label": "Pituitary & pineal",
    "scientificName": "Hypophysis",
    "accent": "#f2a33b",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 2,
    "hotspots": [
      {
        "id": "pituitary-gland",
        "ta": "Pituitary gland",
        "position": [
          0.003,
          -0.269,
          0.797
        ],
        "color": "#f2a33b"
      },
      {
        "id": "pineal-body",
        "ta": "Pineal body",
        "position": [
          -0.001,
          0.343,
          -0.796
        ],
        "color": "#ee7c6a"
      }
    ]
  },
  {
    "id": "larynx",
    "focusKey": "larynx",
    "label": "Larynx",
    "scientificName": "Larynx",
    "accent": "#c69a5e",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 25,
    "hotspots": [
      {
        "id": "right-thyro-arytenoid",
        "ta": "Right thyro-arytenoid",
        "position": [
          -0.217,
          0.195,
          -0.066
        ],
        "color": "#c69a5e"
      },
      {
        "id": "left-thyro-arytenoid",
        "ta": "Left thyro-arytenoid",
        "position": [
          0.217,
          0.197,
          -0.075
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-aryepiglotticus",
        "ta": "Left aryepiglotticus",
        "position": [
          0.262,
          0.504,
          -0.07
        ],
        "color": "#7fa88a"
      },
      {
        "id": "oblique-part-of-left-cricothyroid",
        "ta": "Oblique part of left cricothyroid",
        "position": [
          0.406,
          -0.717,
          -0.23
        ],
        "color": "#b86858"
      },
      {
        "id": "oblique-part-of-right-cricothyroid",
        "ta": "Oblique part of right cricothyroid",
        "position": [
          -0.409,
          -0.713,
          -0.232
        ],
        "color": "#6393d8"
      },
      {
        "id": "straight-part-of-left-cricothyroid",
        "ta": "Straight part of left cricothyroid",
        "position": [
          0.275,
          -0.706,
          0.073
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-aryepiglotticus",
        "ta": "Right aryepiglotticus",
        "position": [
          -0.257,
          0.489,
          -0.074
        ],
        "color": "#7294b9"
      },
      {
        "id": "thyroid-cartilage",
        "ta": "Thyroid cartilage",
        "position": [
          0.002,
          -0.149,
          -0.193
        ],
        "color": "#ee7c6a"
      }
    ]
  },
  {
    "id": "nasal-septum",
    "focusKey": "nasal-septum",
    "label": "Nasal septum & conchae",
    "scientificName": "Septum nasi",
    "accent": "#b86858",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 8,
    "hotspots": [
      {
        "id": "vomer",
        "ta": "Vomer",
        "position": [
          -0.007,
          -0.18,
          -0.513
        ],
        "color": "#b86858"
      },
      {
        "id": "left-inferior-nasal-concha",
        "ta": "Left inferior nasal concha",
        "position": [
          0.221,
          -0.279,
          -0.103
        ],
        "color": "#d89bc4"
      },
      {
        "id": "right-inferior-nasal-concha",
        "ta": "Right inferior nasal concha",
        "position": [
          -0.236,
          -0.281,
          -0.172
        ],
        "color": "#c69a5e"
      },
      {
        "id": "right-lateral-nasal-cartilage",
        "ta": "Right lateral nasal cartilage",
        "position": [
          -0.128,
          -0.205,
          0.641
        ],
        "color": "#6393d8"
      },
      {
        "id": "right-nasal-bone",
        "ta": "Right nasal bone",
        "position": [
          -0.079,
          0.282,
          0.404
        ],
        "color": "#7294b9"
      },
      {
        "id": "left-nasal-bone",
        "ta": "Left nasal bone",
        "position": [
          0.031,
          0.312,
          0.385
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-lateral-nasal-cartilage",
        "ta": "Left lateral nasal cartilage",
        "position": [
          0.107,
          -0.214,
          0.665
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "septal-nasal-cartilage",
        "ta": "Septal nasal cartilage",
        "position": [
          -0.007,
          -0.263,
          0.544
        ],
        "color": "#f2a33b"
      }
    ]
  },
  {
    "id": "pharynx",
    "focusKey": "pharynx",
    "label": "Pharynx",
    "scientificName": "Pharynx",
    "accent": "#6393d8",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 14,
    "hotspots": [
      {
        "id": "left-palatopharyngeus",
        "ta": "Left palatopharyngeus",
        "position": [
          0.154,
          -0.192,
          -0.168
        ],
        "color": "#6393d8"
      },
      {
        "id": "right-palatopharyngeus",
        "ta": "Right palatopharyngeus",
        "position": [
          -0.154,
          -0.193,
          -0.167
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-stylopharyngeus",
        "ta": "Right stylopharyngeus",
        "position": [
          -0.371,
          0.071,
          -0.11
        ],
        "color": "#d89bc4"
      },
      {
        "id": "pharyngeal-raphe",
        "ta": "Pharyngeal raphe",
        "position": [
          0.002,
          -0.155,
          -0.251
        ],
        "color": "#7294b9"
      },
      {
        "id": "right-superior-pharyngeal-constrictor",
        "ta": "Right superior pharyngeal constrictor",
        "position": [
          -0.201,
          0.526,
          -0.037
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-superior-pharyngeal-constrictor",
        "ta": "Left superior pharyngeal constrictor",
        "position": [
          0.211,
          0.513,
          -0.028
        ],
        "color": "#c69a5e"
      },
      {
        "id": "right-middle-pharyngeal-constrictor",
        "ta": "Right middle pharyngeal constrictor",
        "position": [
          0.181,
          0.038,
          -0.081
        ],
        "color": "#f2a33b"
      },
      {
        "id": "left-middle-pharyngeal-constrictor",
        "ta": "Left middle pharyngeal constrictor",
        "position": [
          -0.174,
          0.038,
          -0.09
        ],
        "color": "#ee7c6a"
      }
    ]
  }
]
