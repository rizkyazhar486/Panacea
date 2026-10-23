import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('gross', Path(__file__).with_name('glb-gross-reproduce.py'))
gross = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gross)

def box(lo, hi):
    return ([sum(p)/2 for p in zip(lo, hi)], list(lo), list(hi))

def fixture():
    return {
        'HUMAN.ADULT.MALE.CARDIOVASCULAR.LEFT_VENTRICLE': box((-0.1,1.2,-0.1),(0.1,1.3,0.1)),
        'HUMAN.ADULT.MALE.SKELETAL.FIRST_RIB.L': box((-0.2,1.0,-0.2),(0.2,1.5,0.2)),
        'HUMAN.ADULT.MALE.NERVOUS.CORPUS_CALLOSUM.L': box((-0.05,1.6,-0.05),(0.05,1.7,0.05)),
        'HUMAN.ADULT.MALE.SKELETAL.FRONTAL_BONE': box((-0.1,1.55,-0.1),(0.1,1.8,0.1)),
    }

class Cavities(unittest.TestCase):
    def test_contained_structures_pass(self):
        self.assertTrue(all(c['ok'] for c in gross.cavity_checks(fixture())))
    def test_missing_required_parts_fail_closed(self):
        for name in fixture():
            data=fixture(); del data[name]
            self.assertTrue(any(not c['ok'] for c in gross.cavity_checks(data)), name)
        self.assertTrue(all(not c['ok'] for c in gross.cavity_checks({})))
    def test_heart_outside_or_on_rib_boundary_fails(self):
        for y in (0.9,1.0,1.5,1.6):
            data=fixture();data['HUMAN.ADULT.MALE.CARDIOVASCULAR.LEFT_VENTRICLE']=box((0,y,0),(0,y,0))
            self.assertFalse(gross.cavity_checks(data)[0]['ok'])
    def test_brain_beyond_each_axis_fails(self):
        for axis in range(3):
            for direction in (-1,1):
                data=fixture();lo=[-0.05,1.6,-0.05];hi=[0.05,1.7,0.05]
                if direction<0:lo[axis]=[-0.103,1.547,-0.103][axis]
                else:hi[axis]=[0.103,1.803,0.103][axis]
                data['HUMAN.ADULT.MALE.NERVOUS.CORPUS_CALLOSUM.L']=box(lo,hi)
                self.assertFalse(gross.cavity_checks(data)[1]['ok'])
    def test_both_brain_parts_are_checked(self):
        data=fixture();data['HUMAN.ADULT.MALE.NERVOUS.CORPUS_CALLOSUM.R']=box((0,1.9,0),(0,2.0,0))
        self.assertFalse(gross.cavity_checks(data)[1]['ok'])

if __name__=='__main__': unittest.main()
