#!/usr/bin/env python3
"""GTA VI Shorts cloud renderer. Original stream audio ONLY; no voiceover/subtitles.
Runs in GitHub-hosted Linux runner; no access to local user's computer.
"""
from __future__ import annotations
import argparse, json, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DONATE = "https://www.donationalerts.com/r/younggod21"
SIZE = (1080, 1920)
def run(cmd):
    proc = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode:
        raise RuntimeError(f"Command failed ({proc.returncode}): {proc.stderr[-2200:]}")
    return proc.stdout

def probe(source):
    payload = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format",
                              "-of", "json", str(source)]))
    streams = payload["streams"]
    v = next(s for s in streams if s["codec_type"] == "video")
    a = next((s for s in streams if s["codec_type"] == "audio"), None)
    if a is None:
        raise ValueError("Original source has no audio. Refusing silent output.")
    return (int(v["width"]), int(v["height"]),
            float(payload["format"]["duration"]), str(a["codec_name"]))

def face_box(meta, width, height):
    v = meta.get("face")
    if v in (None, "", []):
        return None
    if isinstance(v, str):
        v = [int(x) for x in re.split(r"[,x:]", v)]
    if len(v) != 4:
        raise ValueError("face must be [x,y,w,h]")
    x,y,w,h = map(int,v)
    if min(x,y)<0 or min(w,h)<=0 or x+w>width or y+h>height:
        raise ValueError("Face crop falls outside source video")
    return x,y,w,h

def make_overlay(path, name, lines):
    im = Image.new("RGBA", SIZE, (0,0,0,0))
    draw=ImageDraw.Draw(im)
    fpath = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    bold = ImageFont.truetype(fpath, 63)
    small = ImageFont.truetype(fpath, 25)
    y=138
    for line in lines[:2]:
        line=line[:30]
        draw.text((SIZE[0]//2,y),line,font=bold,anchor="mt",fill="white",
                  stroke_width=6,stroke_fill=(0,0,0,240))
        y+=78
    draw.text((SIZE[0]//2,1880),f"{name.upper()[:27]}  /  GTA VI  /  A-LAB",
              font=small,anchor="mm",fill=(240,240,240,210),
              stroke_width=1,stroke_fill=(0,0,0,200))
    im.save(path)

def normalize_meta(meta, streamer):
    name = str(meta.get("title",f"{streamer} в GTA 6 — что произошло?!")).strip()
    if not name:raise ValueError("Empty title")
    for tag in ["#GTA6","#Shorts"]:
        if tag.casefold() not in name.casefold():
            name += " "+tag
    streamer_tag=meta.get("streamer_hashtag")
    if streamer_tag:
        tag="#"+re.sub(r"[^A-Za-zА-Яа-я0-9_]", "",str(streamer_tag).lstrip("#"))
        if tag!="#" and tag.casefold() not in name.casefold():
            name+=" "+tag
    if len(name)>100:
        raise ValueError("Title exceeds YouTube 100-character limit")
    description=str(meta.get("description",f"{streamer} — яркий момент из GTA 6.")).strip()
    if not description:raise ValueError("Description required")
    # Only description, subscribe CTA, and donation CTA. No keyword stuffing.
    description += ("\n\nПодписывайся на канал — впереди лучшие моменты GTA 6!"
                    "\n\n💜 Поддержи канал донатом:\n"+DONATE)
    return name,description

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",required=True,type=Path)
    ap.add_argument("--license",required=True,type=Path)
    ap.add_argument("--metadata",required=True,type=Path)
    ap.add_argument("--output",required=True,type=Path)
    args=ap.parse_args()
    for name,file in [("source",args.source),("license",args.license),("metadata",args.metadata)]:
        if not file.is_file():
            raise FileNotFoundError(f"Missing {name}: {file}")
    # Proof is collected and reviewed by owner; this only enforces presence.
    proof=args.license.read_text(encoding="utf-8-sig").strip()
    if len(proof)<12:
        raise ValueError("License permission evidence required")
    meta=json.loads(args.metadata.read_text(encoding="utf-8-sig"))
    streamer=str(meta.get("streamer","creator")).strip()
    title,description=normalize_meta(meta,streamer)
    w,h,duration,codec=probe(args.source)
    if duration<2.0:raise ValueError("Source too short")
    start=max(0.0,float(meta.get("start_sec",0)))
    seconds=min(float(meta.get("duration_sec",40)),60,duration-start)
    if seconds<2:raise ValueError("Invalid chosen start/duration")
    side=min(w,h)
    crop_x=max(0,min(int(meta.get("crop_x",(w-side)//2)),w-side))
    crop_y=max(0,min(int(meta.get("crop_y",(h-side)//2)),h-side))
    face=face_box(meta,w,h)
    root=args.output.parent
    root.mkdir(parents=True,exist_ok=True)
    credit=root/"_credit.png"
    hook=root/"_hook.png"
    make_overlay(credit,streamer,[])
    lines=meta.get("hook",[])
    if isinstance(lines,str):lines=[lines]
    make_overlay(hook,streamer,lines)
    ffmpeg=["ffmpeg","-hide_banner","-loglevel","error","-y",
            "-threads","2","-filter_threads","2","-filter_complex_threads","2",
            "-ss",str(start),"-i",str(args.source),
            "-loop","1","-framerate","30","-i",str(credit),
            "-loop","1","-framerate","30","-i",str(hook)]
    filters=["[0:v]split="+("3[b][g][f]" if face else "2[b][g]"),
             "[b]scale=1080:1920:force_original_aspect_ratio=increase,"
             "crop=1080:1920,boxblur=30:5,eq=brightness=-0.20,setsar=1[bg]",
             f"[g]crop={side}:{side}:{crop_x}:{crop_y},"
             "scale=1080:1080:flags=lanczos,setsar=1[game]",
             "[bg][game]overlay=0:325[base]"]
    if face:
        x,y,fw,fh=face
        filters.extend([f"[f]crop={fw}:{fh}:{x}:{y},scale=540:360:flags=lanczos,"
                        "setsar=1[face]",
                        "[base][face]overlay=270:1460[composite]"])
    else:
        filters.append("[base]null[composite]")
    filters.extend(["[composite][1:v]overlay=0:0[credit]",
                    "[credit][2:v]overlay=0:0:enable='between(t,0,3)'[v]"])
    audiocodec=["-c:a","copy"] if codec in ("aac","mp3") else ["-c:a","aac","-b:a","160k"]
    ffmpeg+=["-filter_complex",";".join(filters),"-map","[v]","-map","0:a:0",
             "-t",str(seconds),"-r","30","-c:v","libx264","-preset","veryfast",
             "-crf","22","-pix_fmt","yuv420p",*audiocodec,
             "-movflags","+faststart",str(args.output)]
    run(ffmpeg)
    artifact={
        "title":title,"description":description,
        "tags":["GTA 6","GTA VI","Grand Theft Auto VI",streamer,"GTA6 Shorts"],
        "categoryId":"20","defaultLanguage":"ru",
        "privacyStatus":"private","madeForKids":False,
        "streamer":streamer,"source_name":args.source.name,
        "rights_evidence":"provided privately to runner; not embedded",
        "duration_sec":round(seconds,2),"audio":"original source audio only",
        "subtitles":"none","publish_status":"NOT_UPLOADED"}
    (root/"youtube.json").write_text(json.dumps(artifact,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"output":str(args.output),"size_bytes":args.output.stat().st_size,
         "resolution":"1080x1920","audio":"original","published":False},ensure_ascii=False))
if __name__=="__main__":
    main()
