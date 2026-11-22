"""Assemble the English submission cut from a real browser recording. No web services."""
from pathlib import Path
import math, subprocess, tempfile, wave
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "submission/video"
RAW = ROOT / "submission/media/studio-capture.webm"
SAMPLE = ROOT / "public/last-light.mp4"
W, H, FPS = 1600, 900, 25
PAPER, INK, RUST, MOSS = "#f7f5eb", "#20382e", "#af4e31", "#c5cebd"

def font(size, face="Sans"):
    return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/DejaVu{face}.ttf", size)

def label(draw, xy, words, color=RUST):
    draw.text(xy, words, font=font(23, "SansMono"), fill=color)

def card(kind):
    im = Image.new("RGB", (W,H), PAPER)
    d = ImageDraw.Draw(im)
    label(d,(72,48),"FOLEYFOLD    /    SOUND CAPTION STUDIO")
    d.line((72,99,1528,99),fill=MOSS,width=2)
    size = (680,540)
    if kind in ("title","close"):
        poster=ImageOps.fit(Image.open(ROOT/"public/last-light.jpg"),size,centering=(.45,.5))
        im.paste(poster,(848,164)); d.rectangle((848,690,1527,704),fill=RUST)
        label(d,(72,198),"AN ORIGINAL SHORT   /   WEB + CHROME")
        lines = ["The sounds","between","the words."] if kind=="title" else ["Cut the film.","Keep the","sound."]
        for i,line in enumerate(lines):
            d.text((65,258+108*i),line,font=font(100,"Serif"),fill=INK)
        d.text((72,638),"Foleyfold  /  #BuildHybridAI",font=font(32),fill=RUST)
    else:
        d.text((69,146),"The film never enters the prompt.",font=font(69,"Serif"),fill=INK)
        label(d,(74,262),"REQUEST CONTRACT    /    IMPLEMENTED ROUTES, NOT A LIVE MODEL RESULT")
        for i,(header,a,b) in enumerate([
            ("01   INPUT","A listening note","and cue duration"),
            ("02   DEFAULT","Device only","No cloud permission"),
            ("03   OPTIONAL","Cloud fallback","One request, with consent")]):
            x=72+497*i
            d.rounded_rectangle((x,354,x+466,587),radius=16,fill=INK)
            label(d,(x+27,385),header,MOSS)
            d.text((x+25,447),a,font=font(34,"Serif"),fill=PAPER)
            d.text((x+27,509),b,font=font(26),fill=PAPER)
        d.text((72,647),"Successful responses identify their source. Every suggestion still needs review.",font=font(30),fill=RUST)
    return im

# kind, source in/out, chapter, spoken line or descriptive audio caption
SHOTS = [
 ("sample",0,3.8,"LAST LIGHT EXPRESS  /  ORIGINAL SOUND","[A station bell rings out.]"),
 ("title",0,0,"01  /  THE PROBLEM","No one spoke. But if the bell goes missing, so does part of the story."),
 ("raw",1.8,9.7,"02  /  THE CUTTING ROOM","Foleyfold gives those sounds a place on the timeline. Select a cue to hear where it belongs."),
 ("raw",9.7,14.4,"03  /  LOCAL IMPORT","Open a local cut. It starts with a clean cue sheet. The file stays on this device."),
 ("raw",14.4,21.8,"04  /  SPOT THE SOUND","Give the bell an in point and an out point. Then write what you hear, not what you see."),
 ("raw",21.8,29.35,"05  /  CAPABILITY CHECK","The assistant checks this browser. Here, Firebase is not connected. No model generated this caption."),
 ("route",0,0,"06  /  FIREBASE AI LOGIC","On a configured studio, only the note and its duration enter the prompt. The default route is device only."),
 ("route",0,0,"06  /  FIREBASE AI LOGIC","The editor can permit cloud fallback for this one request. A returned suggestion names its source and still needs review."),
 ("raw",29.35,36.45,"07  /  HUMAN REVIEW","Here the editor writes the line by hand. Approve it only when it describes the moment."),
 ("raw",36.45,40.85,"08  /  IN CONTEXT","[The bell rings. The approved caption clears at the end of its cue.]"),
 ("raw",40.85,49.65,"09  /  DELIVERY","The export is a timed Web V T T track. Only approved captions leave the cutting room."),
 ("close",0,0,"FOLEYFOLD  /  WEB + CHROME","Keep the cut private. Give its sound a voice.")
]

def run(*args):
    subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",*map(str,args)],check=True)

def wrap(draw,words,maxwidth,f):
    lines=[""]
    for w in words.split():
        new=(lines[-1]+" "+w).strip()
        if draw.textlength(new,font=f)>maxwidth and lines[-1]:lines.append(w)
        else:lines[-1]=new
    return lines

def ts(s):
    total=round(s*1000)
    return f"{total//3600000:02}:{total//60000%60:02}:{total//1000%60:02},{total%1000:03}"

def main():
    OUT.mkdir(exist_ok=True)
    thumb=card("title")
    thumb.resize((1280,720),Image.Resampling.LANCZOS).save(OUT/"thumbnail.png")
    with tempfile.TemporaryDirectory() as directory:
        tmp=Path(directory)
        srt=[]; timeline=[]; clips=[]; elapsed=0
        for i,(kind,start,end,chapter,line) in enumerate(SHOTS):
            audio=tmp/f"a{i}.wav"
            spoken=not line.startswith("[")
            if spoken:
                txt=tmp/f"voice{i}.txt"
                txt.write_text(line.replace("Foleyfold","Foley fold").replace("Firebase","Fire base"))
                run("-f","lavfi","-i",f"flite=textfile={txt}:voice=slt","-af","adelay=280,volume=1.25","-ar",48000,"-ac",2,audio)
            else:
                # The native capture audio had unreliable packet timestamps.
                # Use the same original bell cue, aligned to the two playback shots.
                run("-i",SAMPLE,"-t",end-start,"-vn","-af","volume=0.85","-ar",48000,"-ac",2,audio)
            with wave.open(str(audio)) as f: voice=f.getnframes()/f.getframerate()
            dur=math.ceil(max(voice+(.6 if spoken else 0), end-start)*FPS)/FPS
            if kind in ("title","route","close"):
                c=tmp/f"card{i}.png";card(kind).save(c)
                inputs=["-loop","1","-framerate",FPS,"-i",c]
                filt="scale=1600:900"
            elif kind=="raw":
                inputs=["-ss",start,"-t",end-start,"-i",RAW]
                filt="crop=1440:810:0:90,scale=1392:784,pad=1600:900:104:0:0x20382e"
            else:
                inputs=["-ss",start,"-t",end-start,"-i",SAMPLE]
                filt="scale=1600:-2,pad=1600:900:0:0:0x20382e"
            words=line.replace("Web V T T","WebVTT")
            bar=Image.new("RGBA",(W,H));d=ImageDraw.Draw(bar)
            d.rectangle((0,784,1600,900),fill=INK)
            label(d,(48,799),chapter,MOSS)
            fnt=font(27); lines=wrap(d,words,1502,fnt)
            for j,t in enumerate(lines):
                d.text((47,833+32*j),t,font=fnt,fill=PAPER)
            barfile=tmp/f"bar{i}.png";bar.save(barfile)
            clip=tmp/f"shot{i:02}.mp4"
            run(*inputs,"-i",audio,"-i",barfile,
                "-filter_complex",f"[0:v]{filt},fps={FPS},setsar=1,tpad=stop_mode=clone:stop_duration={dur}[v];[v][2:v]overlay=format=auto,format=yuv420p[o];[1:a]apad[a]",
                "-map","[o]","-map","[a]","-t",dur,"-c:v","libx264","-threads",4,"-preset","fast","-crf",20,
                "-c:a","aac","-b:a","128k","-ar",48000,clip)
            clips.append(clip)
            srt.append(f"{i+1}\n{ts(elapsed)} --> {ts(elapsed+dur-.04)}\n"+"\n".join(wrap(d,words,770,fnt)))
            timeline.append(f"| {ts(elapsed)[3:8]}–{ts(elapsed+dur)[3:8]} | {chapter} | {words} |")
            elapsed+=dur
        manifest=tmp/"list.txt";manifest.write_text("\n".join(f"file '{x}'" for x in clips))
        run("-f","concat","-safe","0","-i",manifest,"-c","copy","-movflags","+faststart",OUT/"demo.mp4")
        (OUT/"subtitles.srt").write_text("\n\n".join(srt)+"\n")
        (OUT/"storyboard.md").write_text("# Shot list for the actual cut\n\n| Time | Shot | Narration / sound |\n|---|---|---|\n"+"\n".join(timeline)+"\n")
        (OUT/"voiceover.md").write_text("# English voiceover\n\nEnglish synthetic narration from local Flite (SLT voice); the two bell interludes use the original short’s audio. No voice impersonation or remote service.\n\n"+"\n\n".join(s[-1].replace("Web V T T","WebVTT") for s in SHOTS)+"\n")

if __name__=="__main__": main()
