"""Rebuild the original 18-second sample with Pillow, NumPy, SciPy and ffmpeg."""
import json, math, subprocess, tempfile, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
W, H, FPS, SEC, RATE = 960, 484, 18, 18, 44100
rng = np.random.default_rng(27)
t = np.arange(SEC * RATE) / RATE
noise = rng.normal(0, 1, len(t))
def env(a,b):
    return np.minimum(np.clip((t-a)*3,0,1),np.clip((b-t)*3,0,1))
def ring(a,hz,decay):
    u=np.maximum(0,t-a)
    return (t>=a)*np.exp(-u*decay)*np.sin(2*np.pi*hz*u)
# Authored foley, not an inference or a classification result.
sound=.12*sosfilt(butter(2,240,fs=RATE,output='sos'),noise)*env(0,18)
for a in [0.35,1.14,2.1,3.05]: sound+=.15*ring(a,680,3.4)+.075*ring(a,1540,6)
for a in np.arange(4.25,9.5,.48): sound+=.24*ring(a,88,24)+.16*ring(a+.13,122,32)
sound+=.11*sosfilt(butter(2,[1900,7000],fs=RATE,btype='bandpass',output='sos'),noise)*env(10,13.2)
for f in [352,440,527]: sound+=.075*np.sin(2*np.pi*(f*t-.13*t*t))*env(14,17.85)
sound=np.clip(sound,-1,1)
bins=np.array([np.sqrt(np.mean(x*x)) for x in np.array_split(sound,190)])
(OUT/'waveform.json').write_text(json.dumps((bins/max(bins)).round(3).tolist()))
# Screen-printed landscape: layered relief, conifer banks and electric rail.
sky=np.empty((H,W,3),np.uint8)
for y in range(H):
    k=min(1,y/320); sky[y]=np.array([69,94,117])*(1-k)+np.array([250,189,140])*k
bg=Image.fromarray(sky); d=ImageDraw.Draw(bg)
d.ellipse((656,44,752,140),fill='#f4c593')
for i in range(24):
    x=int(rng.integers(130,940)); y=int(rng.integers(15,142)); d.line((x,y,x+int(rng.integers(3,42)),y), fill=(151,153,151))
def ridge(seed,heights,color,facets):
    xs=np.linspace(-20,W+20,len(heights)); local=np.random.default_rng(seed)
    gx=np.arange(-20,W+25,3); gy=np.interp(gx,xs,heights)+local.uniform(-2,2,len(gx))
    d.polygon(list(zip(gx,gy))+[(W+20,H),(-20,H)],fill=color)
    for i in range(1,len(xs)-1):
        if heights[i] < heights[i-1] and heights[i] < heights[i+1]:
            x,y=xs[i],heights[i]; d.polygon([(x,y+1),(x-16,y+43),(x+2,y+37),(x-13,y+66),(xs[i+1],heights[i+1])],fill=facets)
ridge(2,[235,182,206,147,174,108,156,94,135,109,168,146,116,167,140,186,140],'#9b9a9a','#b0a5a0')
ridge(3,[222,245,192,206,128,196,179,219,162,193,144,184,143,176,158,210,155],'#687f8a','#84939a')
ridge(5,[190,187,223,245,211,259,248,235,260,218,241,209,247,195,183,160,197],'#395968','#4d6972')
for j in range(1050):
    x=int(rng.integers(0,W)); y=int(249+15*math.sin(x/64)+rng.random()*40); h=int(rng.integers(2,13));d.polygon([(x,y-h),(x-3,y),(x+3,y)],fill='#324f56')
d.polygon([(0,284),(W,292),(W,H),(0,H)],fill='#435f61')
for j in range(470):
    x=int(rng.integers(0,W));y=int(rng.integers(292,420));d.line((x,y,x+int(rng.integers(3,30)),y),fill='#617373')
# Long iron trestle.
for x in range(-30,1030,68):
    d.polygon([(x,304),(x+7,304),(x+12,439),(x+3,440)],fill='#23363e')
    d.line((x,318,x+71,418),fill='#2f4449',width=4);d.line((x,418,x+68,318),fill='#2f4449',width=4)
d.rectangle((0,295,W,304),fill='#202e38');d.line((0,294,W,294),fill='#c8a077',width=2)
def train(im,t):
    g=ImageDraw.Draw(im); x=int(610+13*t)
    for k in range(4):
        a=x-k*147
        g.rounded_rectangle((a-141,247,a,290),radius=6,fill='#b75433',outline='#352f35',width=2)
        g.polygon([(a-139,248),(a-131,240),(a-7,240),(a-1,249)],fill='#36404a')
        g.rectangle((a-138,256,a-3,273),fill='#d5ad7c')
        for n in range(8):g.rounded_rectangle((a-132+n*16,257,a-121+n*16,270),radius=1,fill='#374b55')
        g.line((a-137,278,a-3,278),fill='#ffe1a1',width=2)
        for w in [a-124,a-18]:g.ellipse((w,285,w+9,294),fill='#23323c')
    g.polygon([(x-6,245),(x+15,247),(x+32,260),(x+35,285),(x+29,290),(x-6,290)],fill='#c56238',outline='#383d40')
    g.polygon([(x+8,249),(x+14,250),(x+26,260),(x+8,260)],fill='#304953')
    g.rounded_rectangle((x+24,267,x+32,271),radius=2,fill='#ffdd90')
    g.line((x-90,240,x-71,228,x-55,239),fill='#35434b',width=2)
    for a in [-5,200,417,645,880]:
        g.line((a,302,a-1,197),fill='#293f49',width=3);g.line((a-12,204,a+21,204),fill='#293f49',width=2)
        g.line((a,205,a+114,214,a+221,205),fill='#48565c')
fg=Image.new('RGBA',(W,H));d=ImageDraw.Draw(fg)
d.polygon([(0,375),(100,389),(192,423),(283,421),(402,449),(497,464),(676,448),(794,411),(893,400),(W,380),(W,H),(0,H)],fill='#192e35')
for x in [4,26,62,101,140,805,839,875,915,959]:
    y=452+int(19*math.sin(x));h=int(rng.integers(50,148))
    d.rectangle((x-2,y-h,x+2,y+25),fill='#172a31')
    for i in range(1,8):
        a=h*i/8; d.polygon([(x,y-h+a-h/5),(x-a*.23,y-h+a),(x+a*.24,y-h+a)],fill='#172a31')
grain=rng.normal(0,2.8,(H,W,1))
with tempfile.TemporaryDirectory() as tmp:
    wav=Path(tmp)/'sound.wav'
    with wave.open(str(wav),'w') as f:
        f.setparams((1,2,RATE,0,'NONE','not compressed'));f.writeframes((sound*32767).astype('<i2').tobytes())
    proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(wav),'-c:v','libx264','-crf','23','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(OUT/'last-light.mp4')],stdin=subprocess.PIPE)
    for n in range(FPS*SEC):
        frame=bg.copy();train(frame,n/FPS);frame.paste(fg,(0,0),fg)
        frame=Image.fromarray(np.clip(np.asarray(frame)+grain,0,255).astype('uint8'))
        if n==0:frame.save(OUT/'last-light.jpg',quality=92)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    if proc.wait():raise RuntimeError('ffmpeg render failed')
