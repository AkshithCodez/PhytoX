from pathlib import Path
from pptx import Presentation
from pptx.util import Inches as I,Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE,MSO_CONNECTOR
from pptx.oxml.xmlchemy import OxmlElement
from PIL import Image
import shutil
root=Path('PhytoX/docs/final-review-presentation'); repo=Path('PhytoX/docs/final-academic-report/screenshots');orig=Presentation(root/'deliverables/PHYTOX_FINAL_REVIEW_PRESENTATION.pptx'); p=Presentation();p.slide_width=I(13.333);p.slide_height=I(7.5)
D='1B1B1B';C='24462B';L='FFFFFF';N='A7B3A3';M='729D55';B='507A3C';A='729D55';W='FFFFFF'
def col(t):return RGBColor.from_string(t)
def box(s,x,y,w,h,c):
 q=s.shapes.add_shape(MSO_SHAPE.RECTANGLE,I(x),I(y),I(w),I(h));q.fill.solid();q.fill.fore_color.rgb=col(c);q.line.fill.background();return q
def txt(s,x,y,w,h,t,size=20,c=L,b=False):
 q=s.shapes.add_textbox(I(x),I(y),I(w),I(h));f=q.text_frame;f.word_wrap=True;f.margin_left=f.margin_right=I(.01);f.margin_top=f.margin_bottom=0
 for i,line in enumerate(t.split('\n')):
  z=f.paragraphs[0] if i==0 else f.add_paragraph();z.space_after=Pt(7);r=z.add_run();r.text=line;r.font.name='Aptos';r.font.size=Pt(size);r.font.bold=b;r.font.color.rgb=col(c)
 return q
def slide(bg,title,ink):
 s=p.slides.add_slide(p.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=col(bg);txt(s,.72,.44,11.8,.62,title,30,ink,True);txt(s,.75,7.12,10,.22,'PHYTOX   /   MATRUSRI ENGINEERING COLLEGE',10,ink);txt(s,12.25,7.10,.4,.25,str(len(p.slides)).zfill(2),11,ink);s.notes_slide.notes_text_frame.text=orig.slides[len(p.slides)-1].notes_slide.notes_text_frame.text;return s
def pic(s,path,x,y,w,h):
 with Image.open(path) as im:a,b=im.size
 z=min(w/a,h/b);s.shapes.add_picture(str(path),I(x+(w-a*z)/2),I(y+(h-b*z)/2),I(a*z),I(b*z))
def arrow(s,x,y,u,v,ink):
 q=s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,I(x),I(y),I(u),I(v));q.line.color.rgb=col(ink);q.line.width=Pt(1.8);e=OxmlElement('a:tailEnd');e.set('type','triangle');q._element.spPr.ln.append(e)
s=slide(D,'PhytoX',L);box(s,6.8,0,6.53,7.5,C);pic(s,Path('PhytoX/apps/web/public/images/farmers-leaf.jpg'),6.8,0,6.53,7.5);box(s,6.68,0,.08,7.5,A);txt(s,.75,1.55,5.7,1.7,'FARMER DISEASE DIAGNOSTIC/REPORTING PORTAL - MOBILE PORTAL AI BASED',25,L,True);txt(s,.75,3.65,5.7,2.6,'Sidda Reddy Akshith Reddy  ·  1608-24-733-067\nGande Pranav Sai  ·  1608-24-733-105\nBattuwar Aryan  ·  1608-24-733-106\nGuide  Mrs. Santoshi Juluri, Assistant Professor\nCSE  ·  2026–2027',16,L)
s=slide(D,'Abstract',L);box(s,0,1.1,.22,5.8,B);pic(s,Path('PhytoX/apps/web/public/images/guidance-leaf-sample.jpg'),9.5,5.0,2.8,1.5);txt(s,.8,1.4,10.9,1.3,'A connected workflow for leaf screening and human review.',30,L,True)
for i,(a,b) in enumerate([('Farmer diagnosis','Select crop and scan a leaf'),('Report verification','Share results with consent'),('Regional monitoring','Follow dated plot observations')]):
 x=.8+i*4.15;txt(s,x,3.5,3.5,.55,a,21,A,True);txt(s,x,4.2,3.5,.9,b,18,L)
 if i<2:arrow(s,x+3.5,3.8,x+4,3.8,C)
s=slide(L,'Motivation & Problem Statement',D);box(s,0,1.2,6.67,5.5,B);txt(s,.8,1.6,5,3.6,'The problem\n\nExpert access may be delayed. Similar symptoms and disconnected records make crop follow-up difficult.',23,L);txt(s,7.3,1.6,5.2,3.6,'The PhytoX response\n\nCrop-conditioned screening, private history, plot monitoring and consent-based officer review.',23,D)
s=slide(N,'Objectives of the Project',D)
for i,(t,b) in enumerate([('01','Classify leaf conditions'),('02','Provide multilingual access'),('03','Flag uncertainty'),('04','Enable officer review'),('05','Monitor enrolled plots'),('06','Provide regional insights')]):
 x=.9+(i%2)*6;y=1.45+(i//2)*1.65;txt(s,x,y,.85,.65,t,31,B,True);txt(s,x+1,y+.08,4.6,.9,b,21,D)
s=slide(L,'System Architecture',D)
for x,y,w,t,c in [(.7,1.45,3,'Farmer PWA / Android',D),(9.6,1.45,3,'Officer portal',D),(4.6,3.1,4.1,'Next.js BFF · Vercel',D),(.7,5.05,4.2,'FastAPI + ONNX · Render',B),(8.25,5.05,4.35,'Supabase Auth / DB / Storage',C)]:box(s,x,y,w,1,c);txt(s,x+.16,y+.24,w-.32,.65,t,18,L,True)
for a,b,c,d in [(3.7,1.95,4.6,3.4),(9.6,1.95,8.7,3.4),(5.2,4.1,3.5,5.05),(8.1,4.1,9.6,5.05)]:arrow(s,a,b,c,d,M)
s=slide(D,'Proposed Methodology',L);pic(s,Path('PhytoX/apps/web/public/images/farmers-leaf.jpg'),9.7,.55,2.8,.8)
st=['Sign in','Select crop','Upload leaf','Validate image','Run inference','Rank & flag','Save / report','Officer review']
for i,t in enumerate(st):
 x=.85+(i%4)*3.1;y=1.65+(i//4)*2.35;txt(s,x,y,2.8,.4,str(i+1).zfill(2),17,N);txt(s,x,y+.55,2.7,1,t,22,L,True)
 if i%4<3:arrow(s,x+2.3,y+.78,x+3.0,y+.78,N)
s=slide(L,'MobileNetV2 Classification',D);txt(s,.85,1.55,5.2,.5,'MODEL PIPELINE',16,B,True)
for i,t in enumerate(['224 × 224 RGB image','MobileNetV2 · 1,280 features','Classifier · 1,280 → 512 → 38','ONNX Runtime · CPU']):
 y=2+i*.96;box(s,.85,y,5.25,.7,B if i==2 else D);txt(s,1.05,y+.17,4.9,.45,t,17,L)
txt(s,7,1.55,5,.55,'DATASET INVENTORY',16,B,True);txt(s,7,2.2,5,3.8,'New Plant Diseases Dataset (Augmented)\n70,295 training-folder images\n17,572 validation-folder images\n33 standalone test images',19,D)
s=slide(L,'Crop-Conditioned Diagnosis',D);box(s,0,1.3,4.25,5.4,C);txt(s,.8,1.7,3,3,'Crop selected\n\nCalculate compatible class evidence and rank candidate labels.',22,L);txt(s,4.9,1.65,7.3,.6,'Mismatch or weak evidence?',23,D,True);arrow(s,5.2,2.45,5.2,3.25,C);arrow(s,9.1,2.45,9.1,3.25,C);txt(s,5.35,3.1,3,.45,'YES',18,B,True);txt(s,9.25,3.1,2,.45,'NO',18,D,True);txt(s,4.9,3.8,3.2,1.5,'Flag uncertainty and advise expert review.',20,D);txt(s,8.8,3.8,3.6,1.5,'Show ranked assessment and recommend review.',20,D);txt(s,4.9,6,7.5,.5,'Confidence is not proven accuracy.',16,C)
s=slide(D,'Farmer Portal',L);pic(s,repo/'live/scan.png',.7,1.25,7.3,4.85);pic(s,repo/'live/assessment.png',8.1,1.25,4.5,3.35);txt(s,8.25,4.9,4,1,'Uploaded dataset leaf → scan → saved assessment',19,L)
s=slide(L,'Officer Portal & Reporting',D);pic(s,repo/'live/dashboard.png',.65,1.3,8,5);txt(s,9,1.65,3.65,4.8,'01  Jurisdiction-restricted data\n\n02  Review queue\n\n03  Officer decisions and advisories',19,D);txt(s,9,6,3.5,.4,'One labeled demo report',14,C)
s=slide(B,'Crop Monitoring',L);txt(s,.9,1.5,10,.5,'TWICE-WEEKLY OBSERVATION CADENCE',17,N,True);txt(s,1,2.3,3,.6,'MONDAY',25,L,True);txt(s,6,2.3,3,.6,'THURSDAY',25,L,True);arrow(s,3.5,2.6,5.8,2.6,N);txt(s,1,4.05,5,1.7,'Recurrence\nMatching condition among the two latest prior plot observations.',19,L);txt(s,7,4.05,5.2,1.7,'Regional cluster\nThree matching observations in the region within seven days.',19,L)
s=slide(D,'Model Performance',L);txt(s,.8,1.65,6.3,1.45,'96.04%',72,L,True);txt(s,.85,3.3,5.8,.6,'RECORDED VALIDATION ACCURACY',18,N,True);txt(s,7.4,1.65,4.8,3.8,'38 classes   /   14 crops\n\n13.31 ms median CPU forward pass\n\n11.57 MB ONNX model',21,L);txt(s,.85,5.9,10.9,.65,'Checkpoint validation at epoch 15. Independent field accuracy is not established.',16,N)
s=slide(L,'System Validation',D)
for i,(n,t,c) in enumerate([(44,'Vitest · local rerun',B),(23,'Pytest · local rerun',C),(3,'Playwright · prior record',M)]):
 y=1.65+i*1.3;txt(s,.85,y,3.7,.6,t,20,D);box(s,4.7,y,6.2*n/44,.48,c);txt(s,11.25,y,1,.55,str(n),22,D,True)
txt(s,.85,6.05,11,.5,'Automated tests and browser scenarios do not establish agricultural field performance.',16,C)
s=slide(D,'Presentation Overview',L);box(s,0,1.15,3.7,5.9,B);txt(s,.8,1.65,2.7,1,'AGENDA',29,L)
for i,t in enumerate(['Abstract','Motivation & problem','Objectives','Architecture','Methodology','Results & discussion','Conclusion & future','References']):
 x=4.3+(i%2)*4.3;y=1.45+(i//2)*1.22;txt(s,x,y,.8,.55,str(i+1).zfill(2),25,L);txt(s,x+.8,y+.12,3.3,.55,t,16,L)
s=slide(D,'Conclusion & Future Enhancements',L);box(s,7.0,1.25,6.33,5.55,B);txt(s,.85,1.65,5.4,3.8,'Implemented\n\nAI-assisted screening\nMultilingual farmer access\nOfficer review\nRule-based monitoring',22,L);txt(s,7.55,1.65,5,4,'Future enhancements\n\nIndependent field validation\nExpanded crop coverage\nCalibrated confidence\nOn-device inference',21,L)
s=slide(L,'References',D);txt(s,.85,1.35,11.6,5.45,'Hughes & Salathé (2015). PlantVillage image collection. arXiv:1511.08060.\nMohanty et al. (2016). Using Deep Learning for Image-Based Plant Disease Detection. Frontiers in Plant Science 7:1419.\nSandler et al. (2018). MobileNetV2: Inverted Residuals and Linear Bottlenecks. CVPR.\nvipoooool. New Plant Diseases Dataset (Augmented). Kaggle.\nPhytoX project checkpoint, source code, test record and demo deployment.',18,D)
ids=p.slides._sldIdLst; agenda=ids[13];ids.remove(agenda);ids.insert(1,agenda)
for i,sl in enumerate(p.slides):
 for sh in sl.shapes:
  if sh.has_text_frame and sh.left>I(12) and sh.top>I(7) and sh.text.strip().isdigit():sh.text=str(i+1).zfill(2)
out=root/'deliverables/PHYTOX_FINAL_REVIEW_BOTANICAL.pptx';p.save(out)
shutil.copy2(__file__,root/'source/botanical_source.py')


