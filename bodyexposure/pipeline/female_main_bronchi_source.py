"""Pinned source identity and exact source-mesh labels for the HRA female bronchus reference."""
BODY_ID = 'HUMAN.ADULT.FEMALE.MAIN_BRONCHI_REFERENCE'
SOURCE_URL = 'https://3d.nih.gov/entries/3DPX-020976'
SOURCE = 'Human Reference Atlas, main bronchus female v1.0, Visible Human female (NLM); NIH 3D 3DPX-020976'
LICENSE = 'CC BY 4.0'
SOURCE_SHA256 = 'c58e5b8fb61d982eb72f7385b6ce858e07e05766b0101ff0e15c7bc469cf60ff'
NODES = {
    'VH_F_right_main_bronchus': ('MAIN_BRONCHUS.R', 'Right main bronchus', 'right'),
    'VH_F_left_main_bronchus': ('MAIN_BRONCHUS.L', 'Left main bronchus', 'left'),
    'VH_F_cartilage_of_main_bronchus_R': ('MAIN_BRONCHUS_CARTILAGE.R', 'Cartilage of right main bronchus', 'right'),
    'VH_F_cartilage_of_main_bronchus_L': ('MAIN_BRONCHUS_CARTILAGE.L', 'Cartilage of left main bronchus', 'left'),
}
