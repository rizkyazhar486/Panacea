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
          -0.7313,
          -0.1476,
          0.6044
        ],
        "color": "#b86858"
      },
      {
        "id": "left-corona-ciliaris",
        "ta": "Left corona ciliaris",
        "position": [
          0.727,
          -0.1408,
          0.6038
        ],
        "color": "#d89bc4"
      },
      {
        "id": "left-sclera",
        "ta": "Left sclera",
        "position": [
          0.6979,
          -0.1328,
          0.4404
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-sclera",
        "ta": "Right sclera",
        "position": [
          -0.6927,
          -0.1334,
          0.448
        ],
        "color": "#c69a5e"
      },
      {
        "id": "left-choroid",
        "ta": "Left choroid",
        "position": [
          0.7,
          -0.1349,
          0.4242
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-choroid",
        "ta": "Right choroid",
        "position": [
          -0.6915,
          -0.1302,
          0.4395
        ],
        "color": "#7294b9"
      },
      {
        "id": "optic-part-of-left-retina",
        "ta": "Optic part of left retina",
        "position": [
          0.6933,
          -0.1298,
          0.3808
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "optic-part-of-right-retina",
        "ta": "Optic part of right retina",
        "position": [
          -0.6941,
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
          0.6699,
          -0.1695,
          0.8181
        ],
        "color": "#f2a33b"
      },
      {
        "id": "optic-part-of-right-retina",
        "ta": "Optic part of right retina",
        "position": [
          -0.6706,
          -0.1678,
          0.8182
        ],
        "color": "#d89bc4"
      },
      {
        "id": "left-optic-tract",
        "ta": "Left optic tract",
        "position": [
          0.3379,
          0.3266,
          -0.6311
        ],
        "color": "#7294b9"
      },
      {
        "id": "right-optic-tract",
        "ta": "Right optic tract",
        "position": [
          -0.3351,
          0.3271,
          -0.6278
        ],
        "color": "#f2a33b"
      },
      {
        "id": "optic-chiasm",
        "ta": "Optic chiasm",
        "position": [
          0.0893,
          0.3216,
          -0.1987
        ],
        "color": "#7fa88a"
      },
      {
        "id": "optic-chiasm",
        "ta": "Optic chiasm",
        "position": [
          -0.0893,
          0.3207,
          -0.1963
        ],
        "color": "#b86858"
      },
      {
        "id": "right-optic-nerve",
        "ta": "Right optic nerve",
        "position": [
          -0.3457,
          0.1052,
          0.2255
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "left-optic-nerve",
        "ta": "Left optic nerve",
        "position": [
          0.3465,
          0.1046,
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
          -0.0688,
          -0.0587
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
          0.0102,
          -0.0007,
          0.0378
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
          -0.1895,
          -0.0652,
          0.0339
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "cystic-duct",
        "ta": "Cystic duct",
        "position": [
          0.6664,
          0.5859,
          -0.8107
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
          -0.2647,
          0.4301,
          -0.1751
        ],
        "color": "#f2a33b"
      },
      {
        "id": "left-ureter",
        "ta": "Left ureter",
        "position": [
          0.2571,
          0.5358,
          -0.2052
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "urethra",
        "ta": "Urethra",
        "position": [
          -0.0217,
          -0.7064,
          0.0945
        ],
        "color": "#6393d8"
      },
      {
        "id": "urinary-bladder",
        "ta": "Urinary bladder",
        "position": [
          -0.0054,
          -0.4206,
          -0.1897
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
          0.3183,
          0.0441,
          0.1939
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-deferent-duct",
        "ta": "Right deferent duct",
        "position": [
          -0.428,
          -0.0051,
          0.1712
        ],
        "color": "#d89bc4"
      },
      {
        "id": "prostate",
        "ta": "Prostate",
        "position": [
          -0.1074,
          0.0554,
          -0.2534
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-seminal-vesicle",
        "ta": "Left seminal vesicle",
        "position": [
          0.0852,
          0.2759,
          -0.4291
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-seminal-vesicle",
        "ta": "Right seminal vesicle",
        "position": [
          -0.3072,
          0.2825,
          -0.4304
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
          0.7023,
          0.2375,
          -0.1519
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-testis",
        "ta": "Right testis",
        "position": [
          -0.6484,
          -0.0678,
          0.0231
        ],
        "color": "#d89bc4"
      },
      {
        "id": "left-testis",
        "ta": "Left testis",
        "position": [
          0.654,
          -0.0716,
          0.0142
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-epididymis",
        "ta": "Right epididymis",
        "position": [
          -0.6699,
          0.1287,
          -0.1742
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
          0.6122,
          0.1668,
          -0.1517
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-adrenal-gland",
        "ta": "Right adrenal gland",
        "position": [
          -0.7118,
          -0.1237,
          0.1005
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
          0.0026,
          -0.2688,
          0.7967
        ],
        "color": "#f2a33b"
      },
      {
        "id": "pineal-body",
        "ta": "Pineal body",
        "position": [
          -0.0013,
          0.3432,
          -0.7956
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
          0.1955,
          -0.0664
        ],
        "color": "#c69a5e"
      },
      {
        "id": "left-thyro-arytenoid",
        "ta": "Left thyro-arytenoid",
        "position": [
          0.2169,
          0.1967,
          -0.0748
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-aryepiglotticus",
        "ta": "Left aryepiglotticus",
        "position": [
          0.2624,
          0.5042,
          -0.0698
        ],
        "color": "#7fa88a"
      },
      {
        "id": "oblique-part-of-left-cricothyroid",
        "ta": "Oblique part of left cricothyroid",
        "position": [
          0.4063,
          -0.717,
          -0.2303
        ],
        "color": "#b86858"
      },
      {
        "id": "oblique-part-of-right-cricothyroid",
        "ta": "Oblique part of right cricothyroid",
        "position": [
          -0.4093,
          -0.7129,
          -0.2321
        ],
        "color": "#6393d8"
      },
      {
        "id": "straight-part-of-left-cricothyroid",
        "ta": "Straight part of left cricothyroid",
        "position": [
          0.2755,
          -0.7059,
          0.0729
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-aryepiglotticus",
        "ta": "Right aryepiglotticus",
        "position": [
          -0.2568,
          0.4889,
          -0.0744
        ],
        "color": "#7294b9"
      },
      {
        "id": "thyroid-cartilage",
        "ta": "Thyroid cartilage",
        "position": [
          0.0022,
          -0.1488,
          -0.1927
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
          -0.0074,
          -0.1796,
          -0.5135
        ],
        "color": "#b86858"
      },
      {
        "id": "left-inferior-nasal-concha",
        "ta": "Left inferior nasal concha",
        "position": [
          0.2209,
          -0.279,
          -0.1032
        ],
        "color": "#d89bc4"
      },
      {
        "id": "right-inferior-nasal-concha",
        "ta": "Right inferior nasal concha",
        "position": [
          -0.2364,
          -0.2812,
          -0.1723
        ],
        "color": "#c69a5e"
      },
      {
        "id": "right-lateral-nasal-cartilage",
        "ta": "Right lateral nasal cartilage",
        "position": [
          -0.1278,
          -0.2049,
          0.6408
        ],
        "color": "#6393d8"
      },
      {
        "id": "right-nasal-bone",
        "ta": "Right nasal bone",
        "position": [
          -0.079,
          0.2817,
          0.4042
        ],
        "color": "#7294b9"
      },
      {
        "id": "left-nasal-bone",
        "ta": "Left nasal bone",
        "position": [
          0.0308,
          0.3121,
          0.3845
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-lateral-nasal-cartilage",
        "ta": "Left lateral nasal cartilage",
        "position": [
          0.1069,
          -0.2138,
          0.6652
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "septal-nasal-cartilage",
        "ta": "Septal nasal cartilage",
        "position": [
          -0.0066,
          -0.2626,
          0.5438
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
          0.1537,
          -0.1924,
          -0.1679
        ],
        "color": "#6393d8"
      },
      {
        "id": "right-palatopharyngeus",
        "ta": "Right palatopharyngeus",
        "position": [
          -0.1542,
          -0.1929,
          -0.1671
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-stylopharyngeus",
        "ta": "Right stylopharyngeus",
        "position": [
          -0.3713,
          0.071,
          -0.1096
        ],
        "color": "#d89bc4"
      },
      {
        "id": "pharyngeal-raphe",
        "ta": "Pharyngeal raphe",
        "position": [
          0.0016,
          -0.1553,
          -0.251
        ],
        "color": "#7294b9"
      },
      {
        "id": "right-superior-pharyngeal-constrictor",
        "ta": "Right superior pharyngeal constrictor",
        "position": [
          -0.2012,
          0.5259,
          -0.0369
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-superior-pharyngeal-constrictor",
        "ta": "Left superior pharyngeal constrictor",
        "position": [
          0.2111,
          0.5131,
          -0.0281
        ],
        "color": "#c69a5e"
      },
      {
        "id": "right-middle-pharyngeal-constrictor",
        "ta": "Right middle pharyngeal constrictor",
        "position": [
          0.1808,
          0.0376,
          -0.0809
        ],
        "color": "#f2a33b"
      },
      {
        "id": "left-middle-pharyngeal-constrictor",
        "ta": "Left middle pharyngeal constrictor",
        "position": [
          -0.1735,
          0.0379,
          -0.09
        ],
        "color": "#ee7c6a"
      }
    ]
  }
]
