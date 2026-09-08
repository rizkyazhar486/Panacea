// DIBANGKITKAN oleh scripts/atlasOrgan.mjs — jangan disunting tangan.
//
// Geometri organ diambil dari BodyParts3D 4.0 (Database Center for Life
// Science, CC BY 4.0) lewat kemasan ashemag/human-atlas. Berbeda dengan model
// di /public/organs/ yang dibuat AI, yang ini geometri manusia rujukan yang
// sesungguhnya, dan tiap mesh membawa nama anatomisnya sendiri.
import type { OrganModel } from './organModels'

export const ORGAN_ATLAS: OrganModel[] = [
  {
    "id": "heart",
    "focusKey": "heart",
    "label": "Heart",
    "scientificName": "Cor",
    "accent": "#f2a33b",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 21,
    "jumlahMesh": 22,
    "hotspots": [
      {
        "id": "wall-of-ventricle",
        "ta": "Wall of ventricle",
        "position": [
          0.0703,
          0.5573,
          0.0591
        ],
        "color": "#f2a33b"
      },
      {
        "id": "wall-of-left-atrium",
        "ta": "Wall of left atrium",
        "position": [
          0.0016,
          0.6074,
          -0.1449
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "wall-of-right-atrium",
        "ta": "Wall of right atrium",
        "position": [
          -0.201,
          0.5495,
          -0.0021
        ],
        "color": "#f2a33b"
      },
      {
        "id": "cavity-of-right-ventricle",
        "ta": "Cavity of right ventricle",
        "position": [
          -0.0129,
          0.5316,
          0.1201
        ],
        "color": "#7fa88a"
      },
      {
        "id": "cavity-of-left-ventricle",
        "ta": "Cavity of left ventricle",
        "position": [
          0.0783,
          0.5081,
          -0.0237
        ],
        "color": "#d89bc4"
      },
      {
        "id": "right-anterior-cusp-of-pulmonary-valve",
        "ta": "Right anterior cusp of pulmonary valve",
        "position": [
          -0.0219,
          0.7047,
          0.1182
        ],
        "color": "#c69a5e"
      },
      {
        "id": "cavity-of-right-atrium",
        "ta": "Cavity of right atrium",
        "position": [
          -0.2017,
          0.5704,
          -0.0186
        ],
        "color": "#c69a5e"
      },
      {
        "id": "left-anterior-cusp-of-pulmonary-valve",
        "ta": "Left anterior cusp of pulmonary valve",
        "position": [
          0.0606,
          0.682,
          0.1473
        ],
        "color": "#ee7c6a"
      }
    ]
  },
  {
    "id": "kidneys",
    "focusKey": "kidneys",
    "label": "Kidneys & renal vessels",
    "scientificName": "Renes",
    "accent": "#7fa88a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 22,
    "jumlahMesh": 40,
    "hotspots": [
      {
        "id": "anterior-division-of-left-renal-artery",
        "ta": "Anterior division of left renal artery",
        "position": [
          0.4678,
          0.6106,
          -0.0381
        ],
        "color": "#7fa88a"
      },
      {
        "id": "anterior-division-of-right-renal-artery",
        "ta": "Anterior division of right renal artery",
        "position": [
          -0.3084,
          0.5158,
          0.0123
        ],
        "color": "#f2a33b"
      },
      {
        "id": "left-renal-vein",
        "ta": "Left renal vein",
        "position": [
          0.4499,
          0.6089,
          -0.061
        ],
        "color": "#b86858"
      },
      {
        "id": "right-renal-vein",
        "ta": "Right renal vein",
        "position": [
          -0.3061,
          0.4998,
          -0.0198
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-kidney",
        "ta": "Left kidney",
        "position": [
          0.4783,
          0.6136,
          -0.0733
        ],
        "color": "#f2a33b"
      },
      {
        "id": "right-kidney",
        "ta": "Right kidney",
        "position": [
          -0.3246,
          0.4902,
          0.0027
        ],
        "color": "#d89bc4"
      },
      {
        "id": "posterior-division-of-right-renal-artery",
        "ta": "Posterior division of right renal artery",
        "position": [
          -0.3495,
          0.5045,
          -0.0558
        ],
        "color": "#6393d8"
      },
      {
        "id": "right-ureter",
        "ta": "Right ureter",
        "position": [
          -0.2598,
          0.1279,
          -0.0204
        ],
        "color": "#6393d8"
      }
    ]
  },
  {
    "id": "small-intestine",
    "focusKey": "small-intestine",
    "label": "Small intestine",
    "scientificName": "Intestinum tenue",
    "accent": "#b86858",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 8,
    "jumlahMesh": 56,
    "hotspots": [
      {
        "id": "distal-part-of-jejunum",
        "ta": "Distal part of jejunum",
        "position": [
          -0.2595,
          0.1882,
          0.1339
        ],
        "color": "#b86858"
      },
      {
        "id": "proximal-part-of-ileum",
        "ta": "Proximal part of ileum",
        "position": [
          -0.0343,
          -0.2267,
          0.0833
        ],
        "color": "#f2a33b"
      },
      {
        "id": "distal-part-of-ileum",
        "ta": "Distal part of ileum",
        "position": [
          -0.189,
          -0.7338,
          -0.0528
        ],
        "color": "#d89bc4"
      },
      {
        "id": "middle-part-of-ileum",
        "ta": "Middle part of ileum",
        "position": [
          -0.0827,
          -0.5223,
          0.0683
        ],
        "color": "#6393d8"
      },
      {
        "id": "proximal-part-of-jejunum",
        "ta": "Proximal part of jejunum",
        "position": [
          0.3018,
          0.3312,
          0.0868
        ],
        "color": "#c69a5e"
      },
      {
        "id": "duodenum",
        "ta": "Duodenum",
        "position": [
          -0.2277,
          0.6454,
          -0.0939
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "middle-part-of-jejunum",
        "ta": "Middle part of jejunum",
        "position": [
          0.4358,
          -0.008,
          0.0609
        ],
        "color": "#7294b9"
      },
      {
        "id": "ileocecal-junction",
        "ta": "Ileocecal junction",
        "position": [
          -0.5742,
          -0.3262,
          -0.1516
        ],
        "color": "#7fa88a"
      }
    ]
  },
  {
    "id": "large-intestine",
    "focusKey": "large-intestine",
    "label": "Large intestine",
    "scientificName": "Intestinum crassum",
    "accent": "#f2a33b",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 4,
    "jumlahMesh": 4,
    "hotspots": [
      {
        "id": "descending-colon",
        "ta": "Descending colon",
        "position": [
          0.5023,
          0.1157,
          0.0183
        ],
        "color": "#f2a33b"
      },
      {
        "id": "transverse-colon",
        "ta": "Transverse colon",
        "position": [
          0.0779,
          0.7488,
          0.353
        ],
        "color": "#d89bc4"
      },
      {
        "id": "ascending-colon",
        "ta": "Ascending colon",
        "position": [
          -0.5732,
          0.3179,
          0.0756
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "rectum",
        "ta": "Rectum",
        "position": [
          0.0385,
          -0.6028,
          -0.4175
        ],
        "color": "#6393d8"
      }
    ]
  },
  {
    "id": "pancreas",
    "focusKey": "pancreas",
    "label": "Pancreas",
    "scientificName": "Pancreas",
    "accent": "#ee7c6a",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 14,
    "jumlahMesh": 16,
    "hotspots": [
      {
        "id": "pancreas",
        "ta": "Pancreas",
        "position": [
          -0.044,
          0.003,
          0.0288
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "parenchyma-of-pancreas",
        "ta": "Parenchyma of pancreas",
        "position": [
          -0.0363,
          0.0106,
          0.0251
        ],
        "color": "#6393d8"
      },
      {
        "id": "pancreatic-duct-tree",
        "ta": "Pancreatic duct tree",
        "position": [
          -0.1085,
          0.0027,
          0.0466
        ],
        "color": "#d89bc4"
      },
      {
        "id": "pancreatic-duct",
        "ta": "Pancreatic duct",
        "position": [
          -0.1534,
          -0.0053,
          0.0731
        ],
        "color": "#f2a33b"
      },
      {
        "id": "pancreaticoduodenal-vein",
        "ta": "Pancreaticoduodenal vein",
        "position": [
          -0.5254,
          -0.1356,
          0.1179
        ],
        "color": "#d89bc4"
      },
      {
        "id": "dorsal-pancreatic-artery",
        "ta": "Dorsal pancreatic artery",
        "position": [
          -0.0178,
          0.2275,
          0.0878
        ],
        "color": "#b86858"
      },
      {
        "id": "anterior-superior-pancreaticoduodenal-artery",
        "ta": "Anterior superior pancreaticoduodenal artery",
        "position": [
          -0.6076,
          0.0305,
          0.1963
        ],
        "color": "#c69a5e"
      },
      {
        "id": "caudal-pancreatic-artery",
        "ta": "Caudal pancreatic artery",
        "position": [
          0.6752,
          0.3503,
          -0.3616
        ],
        "color": "#7294b9"
      }
    ]
  },
  {
    "id": "brain",
    "focusKey": "brain",
    "label": "Brain",
    "scientificName": "Encephalon",
    "accent": "#6393d8",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 45,
    "jumlahMesh": 51,
    "hotspots": [
      {
        "id": "cerebellum",
        "ta": "Cerebellum",
        "position": [
          -0.0008,
          -0.4202,
          -0.4597
        ],
        "color": "#6393d8"
      },
      {
        "id": "corpus-callosum",
        "ta": "Corpus callosum",
        "position": [
          0.005,
          0.2211,
          0.0478
        ],
        "color": "#7294b9"
      },
      {
        "id": "pons",
        "ta": "Pons",
        "position": [
          -0.0016,
          -0.3643,
          -0.0564
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-superior-frontal-gyrus",
        "ta": "Right superior frontal gyrus",
        "position": [
          -0.1507,
          0.5919,
          0.3575
        ],
        "color": "#7294b9"
      },
      {
        "id": "left-superior-frontal-gyrus",
        "ta": "Left superior frontal gyrus",
        "position": [
          0.1528,
          0.598,
          0.3456
        ],
        "color": "#c69a5e"
      },
      {
        "id": "orbital-gyrus",
        "ta": "Orbital gyrus",
        "position": [
          -0.0035,
          -0.0001,
          0.5514
        ],
        "color": "#7fa88a"
      },
      {
        "id": "right-precentral-gyrus",
        "ta": "Right precentral gyrus",
        "position": [
          -0.3812,
          0.5664,
          -0.1447
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "left-precentral-gyrus",
        "ta": "Left precentral gyrus",
        "position": [
          0.3868,
          0.5683,
          -0.1416
        ],
        "color": "#b86858"
      }
    ]
  },
  {
    "id": "eye",
    "focusKey": "eye",
    "label": "Eye",
    "scientificName": "Oculus",
    "accent": "#c69a5e",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 22,
    "jumlahMesh": 26,
    "hotspots": [
      {
        "id": "right-corona-ciliaris",
        "ta": "Right corona ciliaris",
        "position": [
          -0.7313,
          -0.1476,
          0.6044
        ],
        "color": "#c69a5e"
      },
      {
        "id": "left-corona-ciliaris",
        "ta": "Left corona ciliaris",
        "position": [
          0.727,
          -0.1408,
          0.6038
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-sclera",
        "ta": "Left sclera",
        "position": [
          0.6979,
          -0.1328,
          0.4404
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "right-sclera",
        "ta": "Right sclera",
        "position": [
          -0.6927,
          -0.1334,
          0.448
        ],
        "color": "#d89bc4"
      },
      {
        "id": "right-choroid",
        "ta": "Right choroid",
        "position": [
          -0.6958,
          -0.1299,
          0.4762
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-choroid",
        "ta": "Left choroid",
        "position": [
          0.7022,
          -0.1358,
          0.465
        ],
        "color": "#f2a33b"
      },
      {
        "id": "optic-part-of-left-retina",
        "ta": "Optic part of left retina",
        "position": [
          0.6933,
          -0.1298,
          0.3808
        ],
        "color": "#b86858"
      },
      {
        "id": "optic-part-of-right-retina",
        "ta": "Optic part of right retina",
        "position": [
          -0.6941,
          -0.128,
          0.381
        ],
        "color": "#6393d8"
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
    "jumlahBagian": 7,
    "jumlahMesh": 10,
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
        "id": "optic-chiasm",
        "ta": "Optic chiasm",
        "position": [
          0.0011,
          0.3211,
          -0.1975
        ],
        "color": "#7fa88a"
      },
      {
        "id": "left-optic-tract",
        "ta": "Left optic tract",
        "position": [
          0.3379,
          0.3266,
          -0.6311
        ],
        "color": "#c69a5e"
      },
      {
        "id": "right-optic-tract",
        "ta": "Right optic tract",
        "position": [
          -0.3351,
          0.3271,
          -0.6278
        ],
        "color": "#7294b9"
      },
      {
        "id": "right-optic-nerve",
        "ta": "Right optic nerve",
        "position": [
          -0.3058,
          0.1219,
          0.1597
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-optic-nerve",
        "ta": "Left optic nerve",
        "position": [
          0.3346,
          0.1026,
          0.1947
        ],
        "color": "#ee7c6a"
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
    "jumlahMesh": 1,
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
    "jumlahMesh": 1,
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
    "jumlahMesh": 2,
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
    "jumlahMesh": 4,
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
    "jumlahMesh": 5,
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
    "jumlahMesh": 4,
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
    "jumlahMesh": 2,
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
    "jumlahMesh": 2,
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
    "accent": "#6393d8",
    "illustrated": false,
    "sumber": "bodyparts3d",
    "jumlahBagian": 22,
    "jumlahMesh": 25,
    "hotspots": [
      {
        "id": "right-thyro-arytenoid",
        "ta": "Right thyro-arytenoid",
        "position": [
          -0.2094,
          0.0419,
          -0.0893
        ],
        "color": "#6393d8"
      },
      {
        "id": "left-thyro-arytenoid",
        "ta": "Left thyro-arytenoid",
        "position": [
          0.2097,
          0.0369,
          -0.0982
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "cricoid-cartilage",
        "ta": "Cricoid cartilage",
        "position": [
          0.0025,
          -0.7326,
          -0.2273
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "left-aryepiglotticus",
        "ta": "Left aryepiglotticus",
        "position": [
          0.2624,
          0.5042,
          -0.0698
        ],
        "color": "#d89bc4"
      },
      {
        "id": "oblique-part-of-left-cricothyroid",
        "ta": "Oblique part of left cricothyroid",
        "position": [
          0.4063,
          -0.717,
          -0.2303
        ],
        "color": "#7294b9"
      },
      {
        "id": "oblique-part-of-right-cricothyroid",
        "ta": "Oblique part of right cricothyroid",
        "position": [
          -0.4093,
          -0.7129,
          -0.2321
        ],
        "color": "#ee7c6a"
      },
      {
        "id": "straight-part-of-left-cricothyroid",
        "ta": "Straight part of left cricothyroid",
        "position": [
          0.2755,
          -0.7059,
          0.0729
        ],
        "color": "#b86858"
      },
      {
        "id": "right-aryepiglotticus",
        "ta": "Right aryepiglotticus",
        "position": [
          -0.2568,
          0.4889,
          -0.0744
        ],
        "color": "#7fa88a"
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
    "jumlahMesh": 8,
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
    "jumlahMesh": 14,
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
