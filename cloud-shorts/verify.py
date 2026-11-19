#!/usr/bin/env python3
"""Fail closed if the cloud Shorts output violates the project's no-voiceover policy."""
from __future__ import annotations
import argparse,json,subprocess
from pathlib import Path

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--video",type=Path,required=True)
    p.add_argument("--metadata",type=Path,required=True)
    args=p.parse_args()
    assert args.video.is_file() and args.video.stat().st_size>10000, "Missing or empty video"
    assert args.metadata.is_file(), "Missing YouTube metadata"
    obj=json.loads(subprocess.check_output([
      "ffprobe","-v","error","-show_entries",
      "format=duration:stream=codec_type,codec_name,width,height",
      "-of","json",str(args.video)],text=True))
    streams=obj["streams"]
    videos=[s for s in streams if s.get("codec_type")=="video"]
    audios=[s for s in streams if s.get("codec_type")=="audio"]
    assert len(videos)==1, "Expected one video stream"
    assert len(audios)==1, "Expected original audio track"
    assert videos[0]["width"]==1080 and videos[0]["height"]==1920, "Expected 9:16 vertical video"
    assert 2<=float(obj["format"]["duration"])<=60, "Invalid Shorts length"
    meta=json.loads(args.metadata.read_text(encoding="utf-8"))
    assert meta["audio"]=="original source audio only"
    assert meta["subtitles"]=="none"
    assert meta["publish_status"]=="NOT_UPLOADED"
    assert meta["privacyStatus"]=="private"
    assert "#GTA6" in meta["title"] and "#Shorts" in meta["title"]
    assert len(meta["title"])<=100
    assert "donationalerts.com/r/younggod21" in meta["description"]
    assert "Подписывайся" in meta["description"]
    print(json.dumps({
      "result":"PASS","height":videos[0]["height"],"width":videos[0]["width"],
      "duration":obj["format"]["duration"],"audio_codec":audios[0]["codec_name"],
      "public_upload_performed":False},ensure_ascii=False))
if __name__=="__main__":
    main()
