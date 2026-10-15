# Execute through Blender -b --factory-startup -P this.py --python-exit-code 1
import importlib.util
import unittest
import sys
sys.dont_write_bytecode = True
from pathlib import Path
spec=importlib.util.spec_from_file_location('audit',Path(__file__).with_name('public-organ-interpenetration.py'))
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
V=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
T=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]
class Parity(unittest.TestCase):
    def test_inside_outside_and_mixed_exact_fractions(self):
        for points,expected in [([[0,0,0]],1),([[2,2,2]],0),([[0,0,0],[2,2,2]],.5)]:
            self.assertEqual(audit.inside_fraction(points,V,T)['fraction'],expected)
    def test_invalid_geometry_rejected(self):
        for points in ([],[[float('nan'),0,0]],[[float('inf'),0,0]],[[0,0]]):
            with self.assertRaises(ValueError):audit.inside_fraction(points,V,T)
        for triangles in ([],[[0,1,8]],[[0,1,-1]],[[0,1]],[[0,1,True]]):
            with self.assertRaises(ValueError):audit.inside_fraction([[0,0,0]],V,triangles)
    def test_sample_stride_is_existing_method(self):
        result=audit.inside_fraction([[0,0,0]]*901,V,T)
        self.assertEqual(result,{'inside':301,'sampled':301,'fraction':1.,'stride':3})
    def test_existing_five_percent_threshold_accepts_boundary_rejects_above(self):
        expected=[['liver','heart'],['liver','stomach'],['heart','lungLeft'],['heart','lungRight'],['kidneyLeft','spleen'],['liver','kidneyRight'],['bladder','rectum']]
        for count,total,ok in [(5,100,True),(6,100,False),(15,298,False)]:
            organs={k:{'name':k,'vertices':V,'triangles':T} for k in ['liver','heart','stomach','lungLeft','lungRight','kidneyLeft','kidneyRight','spleen','bladder','rectum']}
            organs['liver']={'name':'liver','vertices':[[0,0,0]]*count+[[2,2,2]]*(total-count),'triangles':[[0,1,2]]}
            result=audit.audit({'schema':1,'coordinateFrame':'Blender Z-up metres','pairs':expected,
                                'organs':organs,'summaries':gross_fixture(),'sourceLevel':'synthetic test','sources':[]})
            self.assertEqual(result['checks'][0]['ok'],ok)
            self.assertEqual(result['checks'][0]['fraction'],round(count/total,3))
    def test_empty_contract_fails_closed(self):
        with self.assertRaises(ValueError):audit.audit({})


def gross_fixture():
    entries=[('DIGESTIVE.LIVER',-.02,1.18),('LYMPHATIC.SPLEEN',.08,1.18),
             ('CARDIOVASCULAR.LEFT_VENTRICLE',.05,1.28),('DIGESTIVE.STOMACH',.04,1.18),
             ('NERVOUS.WHITE_MATTER_OF_TELENCEPHALON',0,1.64),('URINARY.URINARY_BLADDER',0,.85),
             ('URINARY.KIDNEY.L',.08,1.1),('URINARY.KIDNEY.R',-.08,1.1)]
    out=[{'name':'ADULT.MALE.'+n,'centroid':[x,0,z],'lo':[x-.01,-.01,z-.01],
          'hi':[x+.01,.01,z+.01],'vertexCount':10,'qaNote':None} for n,x,z in entries]
    out += [{'name':'ADULT.MALE.SKELETAL.FIRST_RIB.L','centroid':[.1,0,1.2],
             'lo':[-.2,-.2,1.0],'hi':[.2,.2,1.45],'vertexCount':10,'qaNote':None},
            {'name':'ADULT.MALE.SKELETAL.FRONTAL_BONE','centroid':[0,0,1.65],
             'lo':[-.1,-.1,1.55],'hi':[.1,.1,1.8],'vertexCount':10,'qaNote':None},
            {'name':'ADULT.MALE.FOOT','centroid':[0,0,.01],
             'lo':[0,0,0],'hi':[0,0,.02],'vertexCount':10,'qaNote':None}]
    return out

class Gross(unittest.TestCase):
    def test_all_nine_original_gross_relations(self):
        checks=audit.gross_checks(gross_fixture())
        self.assertEqual(len(checks),9)
        self.assertTrue(all(c['ok'] for c in checks))
    def test_missing_required_structures_fail(self):
        for prefix in ('DIGESTIVE.LIVER','NERVOUS.WHITE','SKELETAL.FIRST_RIB','SKELETAL.FRONTAL'):
            with self.assertRaises(ValueError):audit.gross_checks([s for s in gross_fixture() if prefix not in s['name']])
    def test_unexplained_laterality_vs_existing_documented_exception(self):
        summaries=gross_fixture(); kidney=next(s for s in summaries if s['name'].endswith('KIDNEY.R'))
        kidney['centroid'][0]=.02
        self.assertFalse(audit.gross_checks(summaries)[0]['ok'])
        kidney['qaNote']='Existing source ambiguity, not clinical approval'
        self.assertTrue(audit.gross_checks(summaries)[0]['ok'])
    def test_ground_boundary_and_brain_tolerance(self):
        summaries=gross_fixture();summaries[-1]['lo'][2]=-.005
        self.assertFalse(next(c for c in audit.gross_checks(summaries) if c['check']=='feet_on_ground')['ok'])
        for high,expected in ((1.802,True),(1.8021,False)):
            summaries=gross_fixture();summaries[4]['hi'][2]=high
            self.assertEqual(audit.gross_checks(summaries)[-1]['ok'],expected)

suite=unittest.TestSuite([unittest.defaultTestLoader.loadTestsFromTestCase(c) for c in (Parity,Gross)])
result=unittest.TextTestRunner().run(suite)
if not result.wasSuccessful():raise SystemExit(1)
