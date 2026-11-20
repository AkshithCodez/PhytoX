from pathlib import Path
from pptx import Presentation
from pptx.util import Inches as I,Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE,MSO_CONNECTOR
from pptx.oxml.xmlchemy import OxmlElement
from PIL import Image
from pypdf import PdfReader
import shutil
root=Path('PhytoX/docs/final-review-presentation');out=root/'deliverables';out.mkdir(parents=True,exist_ok=True)
for f in ['source','assets/screenshots','assets/diagrams','previews/rendered_slides','references']:(root/f).mkdir(parents=True,exist_ok=True)
repo=Path('PhytoX/docs/final-academic-report');p=Presentation();p.slide_width=I(13.333);p.slide_height=I(7.5)
bg='27110E';panel='554846';light='CFD7DD';sub='A5AEB7';red='610B0D';accent='A5080A';muted='7C7C81'
def color(x):return RGBColor.from_string(x)
def rect(s,x,y,w,h,c):
 z=s.shapes.add_shape(MSO_SHAPE.RECTANGLE,I(x),I(y),I(w),I(h));z.fill.solid();z.fill.fore_color.rgb=color(c);z.line.fill.background();return z
def text(s,x,y,w,h,t,size=20,c=light,b=False):
 z=s.shapes.add_textbox(I(x),I(y),I(w),I(h));f=z.text_frame;f.word_wrap=True;f.margin_left=f.margin_right=I(.01);f.margin_top=f.margin_bottom=I(.01)
 for i,line in enumerate(t.split('\n')):
  q=f.paragraphs[0] if i==0 else f.add_paragraph();q.space_after=Pt(9);r=q.add_run();r.text=line;r.font.name='Aptos';r.font.size=Pt(size);r.font.bold=b;r.font.color.rgb=color(c)
 return z
def slide(title,notes):
 s=p.slides.add_slide(p.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=color(bg);rect(s,.55,.45,.07,.45,accent);text(s,.8,.35,11.6,.66,title,29,light,True);text(s,.8,7.13,10,.22,'PHYTOX   •   MATRUSRI ENGINEERING COLLEGE',10,sub);text(s,12.1,7.1,.45,.25,str(len(p.slides)).zfill(2),11,sub);s.notes_slide.notes_text_frame.text=notes;return s
def card(s,x,y,w,h,title,body):
 rect(s,x,y,w,h,panel);text(s,x+.19,y+.17,w-.38,.49,title,19,light,True);text(s,x+.19,y+.76,w-.38,h-.8,body,17,light)
def pic(s,path,x,y,w,h):
 with Image.open(path) as im:a,b=im.size
 z=min(w/a,h/b);s.shapes.add_picture(str(path),I(x+(w-a*z)/2),I(y+(h-b*z)/2),I(a*z),I(b*z))
def arr(s,x,y,u,v):
 z=s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,I(x),I(y),I(u),I(v));z.line.color.rgb=color(light);z.line.width=Pt(1.4);q=OxmlElement('a:tailEnd');q.set('type','triangle');z._element.spPr.ln.append(q)
def cap(s,x,y,t):text(s,x,y,5,.4,t,13,sub)
shots=repo/'screenshots'
s=slide('PhytoX','Introduce the team and project.');pic(s,shots/'public/landing.png',7.3,1.2,5.45,4.7);text(s,.8,1.35,6.2,1.6,'FARMER DISEASE DIAGNOSTIC/REPORTING PORTAL - MOBILE PORTAL AI BASED',26,light,True);text(s,.8,3.35,6.1,2.8,'Sidda Reddy Akshith Reddy   1608-24-733-067\nGande Pranav Sai   1608-24-733-105\nBattuwar Aryan   1608-24-733-106\nGuide  Mrs. Santoshi Juluri, Assistant Professor\nComputer Science and Engineering  •  2026–2027',16)
s=slide('Abstract','Explain screening, consent and human review.');card(s,.8,1.55,3.6,3.8,'Screen','Farmers submit a crop and leaf photograph for AI-assisted assessment.');card(s,4.87,1.55,3.6,3.8,'Follow up','Saved results and scheduled plot observations support continued monitoring.');card(s,8.93,1.55,3.6,3.8,'Review','Farmers share selected reports with agricultural officers in assigned regions.')
s=slide('Motivation & Problem Statement','Describe delayed expert access and fragmented observations.');card(s,.8,1.55,5.65,4.5,'The problem','Expert access may be delayed. Similar-looking symptoms and disconnected observations make follow-up difficult.');card(s,6.85,1.55,5.65,4.5,'Why PhytoX?','Crop-conditioned screening connects a farmer’s photograph to saved history, plot monitoring and officer review.')
s=slide('Objectives of the Project','Cover the six objectives.');items=[('01  Classify','Screen supported crop conditions.'),('02  Include','Provide English, Telugu and Hindi.'),('03  Qualify','Flag uncertainty and crop mismatch.'),('04  Report','Enable consent-based officer review.'),('05  Monitor','Record dated checks on enrolled plots.'),('06  Inform','Provide privacy-aware regional insights.')]
for i,(a,b) in enumerate(items):card(s,.8+(i%3)*4.1,1.43+(i//3)*2.45,3.75,2.2,a,b)
s=slide('System Architecture','Explain the BFF, private storage and inference boundary.')
for x,y,w,t,b in [(.8,1.5,3.1,'Farmer PWA / Android','Photos, history, observations'),(9.45,1.5,3.1,'Officer web portal','Reports and regional review'),(4.65,3.0,4,'Next.js BFF · Vercel','HTTPS, authentication, validation'),(.8,5.0,4.0,'FastAPI + ONNX · Render','CPU inference and crop conditioning'),(8.45,5.0,4.1,'Supabase','Auth, PostgreSQL and private storage')]:card(s,x,y,w,1.45,t,b)
for a,b,c,d in [(3.9,2.2,4.65,3.35),(9.45,2.2,8.65,3.35),(5.3,4.45,4.1,5),(8,4.45,9.4,5)]:arr(s,a,b,c,d)
s=slide('Proposed Methodology','Follow one diagnosis into reporting.');steps=['Sign in & select crop','Upload leaf photograph','Validate & preprocess','Run model inference','Rank & flag uncertainty','Save / submit report','Officer reviews','Monitor observations']
for i,t in enumerate(steps):
 x=.8+(i%4)*3.1;y=1.55+(i//4)*2.45;rect(s,x,y,2.75,1.55,panel);text(s,x+.2,y+.2,2.35,1.1,t,19,light,True)
 if i%4<3:arr(s,x+2.75,y+.75,x+3.1,y+.75)
s=slide('MobileNetV2-Based Crop Disease Classification','Separate source folder inventory from model splits.');text(s,.9,1.6,5.6,3.9,'New Plant Diseases Dataset (Augmented)\n70,295 training-folder images\n17,572 validation-folder images\n33 standalone test images',21)
for i,(a,b) in enumerate([('INPUT','224 × 224 RGB'),('BACKBONE','MobileNetV2 · 1,280 features'),('HEAD','1,280 → 512 → 38'),('RUNTIME','ONNX Runtime · CPU')]):card(s,7.0,1.35+i*1.25,5.3,1.08,a,b)
s=slide('Crop-Conditioned Diagnosis','The serving manifest sets 0.70 confidence and 0.15 margin thresholds. Review is recommended for all results.');card(s,.8,1.6,3.65,3.5,'Crop selection','Compute evidence across the selected crop’s labels.');card(s,4.85,1.6,3.65,3.5,'Confidence checks','Flag mismatch, low confidence, small margin and image-quality warnings.');card(s,8.9,1.6,3.65,3.5,'Expert review','The result is a screening aid. Confidence is not proven accuracy.')
s=slide('Farmer Portal','The scan uses AppleScab1.JPG from the project dataset.');pic(s,shots/'live/scan.png',.8,1.2,6,4.6);pic(s,shots/'live/assessment.png',6.85,1.2,5.65,4.6);cap(s,1,6,'Uploaded leaf during scanning');cap(s,7,6,'Saved assessment · demo account')
s=slide('Officer Portal & Reporting','A labeled demo report was submitted with consent to Guntur.');pic(s,shots/'live/dashboard.png',.8,1.35,6.25,4.6);pic(s,shots/'live/reports.png',7.2,1.35,5.35,4.6);cap(s,1,6,'Dashboard · one demo submission');cap(s,7.2,6,'Report pending officer review')
s=slide('Crop Monitoring & Early Warnings','The recurrence query examines the last two prior observations without a 14-day cutoff.');card(s,.8,1.55,5.5,4.3,'Plot timeline','Register plot → Monday / Thursday checks → dated observation history.');card(s,6.8,1.55,5.7,4.3,'Rule-based signals','A matching condition in the last two prior plot observations can trigger recurrence. Three matching regional observations within seven days can trigger a cluster signal.')
s=slide('Results · Model Performance','Accuracy is checkpoint validation, not independent field performance.');text(s,.9,1.55,5.5,1.2,'96.04%',62,light,True);text(s,.95,2.8,5.4,.6,'Recorded validation accuracy · epoch 15',20,sub)
for i,(a,b) in enumerate([('38','condition classes'),('14','crops'),('13.31 ms','median CPU forward pass'),('11.57 MB','ONNX model')]):card(s,6.55+(i%2)*3,1.55+(i//2)*2.1,2.72,1.85,a,b)
text(s,.95,5.65,5.3,.8,'Independent field performance remains unestablished.',17,sub)
s=slide('Results · System Validation','44 and 23 passed in the local rerun on 20 November. Three browser scenarios are reported in the prior test record.');items=[('44','Vitest · web / database'),('23','Pytest · inference API'),('3','Playwright · reported E2E')]
for i,(a,b) in enumerate(items):rect(s,.8+i*4.12,1.65,3.75,2.2,panel);text(s,1+i*4.12,1.85,3.3,.8,a,42,light,True);text(s,1+i*4.12,2.8,3.3,.7,b,17)
text(s,.85,4.7,11.4,1.0,'Test coverage includes model contracts, database authorization and role isolation. Agricultural field trials require separate evidence.',19)
s=slide('Results · Application Evidence','Screenshots were captured from the live demo on 20 November 2026.');pic(s,shots/'live/plots.png',.8,1.25,5.85,4.75);pic(s,shots/'live/dashboard.png',6.8,1.25,5.7,4.75);cap(s,.9,6,'Demo plot with dated observation');cap(s,6.9,6,'Demo reporting records · one date')
s=slide('Conclusion & Future Enhancements','Differentiate deployed functions from proposals.');card(s,.8,1.55,5.65,4.5,'Implemented','AI-assisted screening, multilingual farmer access, officer reporting, private storage and deterministic monitoring rules.');card(s,6.85,1.55,5.65,4.5,'Future enhancements','Field validation, expanded crop coverage, calibrated confidence, on-device inference and weather-informed forecasting.')
s=slide('References','Research and project sources.');text(s,.85,1.25,11.8,5.65,'Hughes & Salathé (2015). PlantVillage image collection. arXiv:1511.08060.\nMohanty et al. (2016). Using Deep Learning for Image-Based Plant Disease Detection. Frontiers in Plant Science 7:1419.\nSandler et al. (2018). MobileNetV2: Inverted Residuals and Linear Bottlenecks. CVPR.\nvipoooool. New Plant Diseases Dataset (Augmented). Kaggle.\nPhytoX project checkpoint, source code, test record and demo deployment.',18)
p.save(out/'PHYTOX_FINAL_REVIEW_PRESENTATION.pptx')
shutil.copy2(__file__,root/'source/presentation_source.py')
(root/'source/slide_content.md').write_text('\n'.join(f'{i+1}. '+s.shapes[1].text for i,s in enumerate(p.slides)),encoding='utf8')
(root/'references/verified_sources.md').write_text('Checkpoint: ../ml/models/best_model.pt; serving manifest: services/inference/models/supplied.manifest.json; monitoring: apps/web/src/services/monitoring.ts; local test verification and screenshot provenance: docs/final-academic-report/verification and screenshots/screenshot_manifest.md.\n',encoding='utf8')

