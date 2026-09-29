"""Render a silent, captioned Crewlo use-case video with existing studio footage.

All briefs, steps and result cards are illustrative. No provider, messaging API
or Crewlo session is started. Pillow draws video graphics; FFmpeg composites
the existing deterministic studio clip and encodes the finished videos.
"""

from functools import lru_cache
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/crewlo/launch-kit/use-cases"
FPS = 20
BG, PANEL, BORDER = "#102d27", "#1b3a32", "#35574a"
WHITE, MUTED, ACCENT, GOLD = "#f8f5ec", "#bbcec1", "#b9ed94", "#ffc38c"


@lru_cache(maxsize=None)
def font(size, bold=False):
    paths = [Path("C:/Windows/Fonts") / ("segoeuib.ttf" if bold else "segoeui.ttf"),
             Path("/usr/share/fonts/truetype/dejavu") / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")]
    for path in paths:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    raise RuntimeError("A Segoe UI or DejaVu Sans font is required")


def text(draw, value, x, y, size, width, fill=WHITE, bold=False, leading=None):
    face = font(size, bold)
    rows, row = [], ""
    for word in value.split():
        candidate = f"{row} {word}".strip()
        if row and draw.textlength(candidate, font=face) > width:
            rows.append(row)
            row = word
        else:
            row = candidate
    if row:
        rows.append(row)
    for row in rows:
        draw.text((x, y), row, font=face, fill=fill)
        y += leading or int(size * 1.3)
    return y


def panel(draw, box, fill=PANEL, radius=24):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=BORDER, width=2)


def result(draw, scene, box, portrait):
    x, y, x2, y2 = box
    panel(draw, box)
    size = 30 if portrait else 27
    yy = text(draw, scene["result"], x+26, y+20, size, x2-x-52, fill=GOLD, bold=True)
    if scene["id"] == "mvp":
        names = ["To do", "In progress", "Done"]
        items = ["Add a filter", "Create a task", "Write the brief"]
        cw = (x2-x-72)/3
        for i in range(3):
            xx = x+24+i*(cw+12)
            draw.rounded_rectangle((xx, yy+16, xx+cw, y2-24), radius=14, fill="#294c3e")
            draw.text((xx+14, yy+29), names[i], font=font(25, True), fill=ACCENT)
            text(draw, items[i], xx+14, yy+77, 24, cw-28)
    else:
        yy += 14
        for item in scene["details"]:
            draw.ellipse((x+28, yy+12, x+36, yy+20), fill=ACCENT)
            yy = text(draw, item, x+50, yy, size, x2-x-76, fill=WHITE, leading=size+8)+16
        if yy > y2+10:
            raise ValueError(f'Result card overflows: {scene["id"]}')


def layout(width, height):
    portrait = height > width
    if portrait:
        return dict(portrait=True, w=width, h=height, studio=(40,480,1000,470),
                    prompt=(56,1020,1024,1320), steps=(56,1380,1024,1468),
                    result=(56,1530,1024,1792))
    return dict(portrait=False, w=width, h=height, studio=(966,170,900,423),
                prompt=(72,480,906,765), steps=(72,811,906,909),
                result=(966,648,1866,941))


def base_frame(scene, cfg):
    w, h, portrait = cfg['w'], cfg['h'], cfg['portrait']
    image = Image.new('RGB', (w, h), BG)
    d = ImageDraw.Draw(image)
    d.rounded_rectangle((w-350, -200, w+360, 350), radius=260, fill="#19392e")
    d.text((56 if portrait else 72, 42), 'C R E W L O', font=font(38, True), fill=WHITE)
    badge='ILLUSTRATED DEMO'
    bx = w-386
    d.rounded_rectangle((bx, 42, w-56, 98), radius=28, outline=BORDER, width=2)
    d.text((bx+23, 54), badge, font=font(24, True), fill=MUTED)
    x = 56 if portrait else 72
    d.text((x, 142), scene['eyebrow'], font=font(26, True), fill=ACCENT)
    yy=text(d,scene['title'],x,191,72 if portrait else 65,968 if portrait else 822,bold=True,leading=88 if portrait else 80)
    yy=text(d,scene['subtitle'],x,yy+12,34 if portrait else 32,966 if portrait else 814,fill=MUTED)
    max_title=430 if portrait else 445
    if yy>max_title:
        raise ValueError(f'Heading overflows: {scene["id"]}, {yy}')
    px,py,px2,py2=cfg['prompt']
    panel(d,cfg['prompt'])
    d.text((px+26,py+24),'MISSION PROMPT',font=font(24,True),fill=ACCENT)
    yy=text(d,scene['prompt'],px+26,py+74,37 if portrait else 33,px2-px-52,leading=50 if portrait else 46)
    if yy>py2-12:
        raise ValueError(f'Prompt overflows: {scene["id"]}, {yy}')
    result(d,scene,cfg['result'],portrait)
    fy=h-89 if portrait else h-82
    d.line((x,fy-22,w-x,fy-22),fill=BORDER,width=2)
    d.text((x,fy),'Illustrated briefs and deliverables · no live execution shown',
           font=font(24 if portrait else 26),fill=MUTED)
    d.text((x,fy+34),'Independent fork of Munder Difflin',font=font(22),fill=MUTED)
    return image


def srt_time(seconds):
    ms=round(seconds*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'


def render(name, scenes, width, height):
    cfg=layout(width,height)
    duration=sum(s['duration'] for s in scenes)
    bases=[base_frame(s,cfg) for s in scenes]
    with tempfile.TemporaryDirectory(prefix='crewlo-usecases-') as tmp:
        transparent=Path(tmp)/'graphics.mov'
        command=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba',
                 '-s',f'{width}x{height}','-r',str(FPS),'-i','-','-an','-c:v','png','-threads','2',str(transparent)]
        # RGBA video graphics leave a window for the animated studio footage.
        process=subprocess.Popen(command,stdin=subprocess.PIPE)
        scene_idx=0
        begin=0
        proof_at=next((sum(s['duration'] for s in scenes[:i])+2 for i,s in enumerate(scenes) if s['id']=='mvp'),2)
        proof_saved=False
        for index in range(duration*FPS):
            t=index/FPS
            while t>=begin+scenes[scene_idx]['duration']:
                begin+=scenes[scene_idx]['duration']; scene_idx+=1
            scene=scenes[scene_idx]
            p=(t-begin)/scene['duration']
            frame=bases[scene_idx].copy().convert('RGBA')
            d=ImageDraw.Draw(frame)
            sx,sy,sw,sh=cfg['studio']
            d.rectangle((sx,sy,sx+sw-1,sy+sh-1),fill=(0,0,0,0))
            ax,ay,ax2,ay2=cfg['steps']
            cw=(ax2-ax-24)/3
            active=min(2,int(p*3))
            for j,step in enumerate(scene['steps']):
                xx=ax+j*(cw+12)
                fill=ACCENT if j==active else PANEL
                d.rounded_rectangle((xx,ay,xx+cw,ay2),radius=18,fill=fill,outline=BORDER,width=2)
                label=f'{j+1:02}  {step}'
                face=font(27 if cfg['portrait'] else 26,True)
                tw=d.textlength(label,font=face)
                d.text((xx+(cw-tw)/2,ay+26),label,font=face,fill=BG if j==active else MUTED)
            d.rectangle((0,height-7,round(width*t/duration),height),fill=ACCENT)
            d.text((width-156,height-75),f'{int(t):02}s / {duration}s',font=font(22),fill=MUTED)
            process.stdin.write(frame.tobytes())
            if not proof_saved and t>=proof_at:
                # The poster is composed from the same footage at this timestamp.
                source=Image.open(ROOT/'docs/crewlo/demo/studio-overview.png').convert('RGBA')
                source=source.resize((sw,sh),Image.Resampling.LANCZOS)
                poster=frame.copy(); poster.alpha_composite(source,(sx,sy))
                poster.convert('RGB').save(OUT/f'{name}-poster.jpg',quality=92)
                proof_saved=True
        process.stdin.close()
        if process.wait()!=0:
            raise RuntimeError('Video graphic rendering failed')
        sx,sy,sw,sh=cfg['studio']
        source=ROOT/'docs/crewlo/demo/mission-studio.mp4'
        filters=f'[0:v]scale={sw}:{sh},fps={FPS},pad={width}:{height}:{sx}:{sy}:color={BG}[studio];[studio][1:v]overlay=0:0:shortest=1,format=yuv420p[out]'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-stream_loop','-1','-i',str(source),
                        '-i',str(transparent),'-filter_complex',filters,'-map','[out]','-t',str(duration),
                        '-an','-c:v','libx264','-preset','veryfast','-crf','21','-movflags','+faststart',str(OUT/f'{name}.mp4')],check=True)
    t=0; captions=[]
    for i,scene in enumerate(scenes):
        captions.append(f"{i+1}\n{srt_time(t)} --> {srt_time(t+scene['duration'])}\n{scene['title']}\n{scene['subtitle']}\n")
        t+=scene['duration']
    (OUT/f'{name}.srt').write_text('\n'.join(captions),encoding='utf-8')
    print(f'RENDERED {name}: {duration}s, {width}x{height}, {FPS}fps',flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--only',choices=['landscape','portrait','mvp'])
    args=parser.parse_args()
    if not shutil.which('ffmpeg'):
        raise SystemExit('FFmpeg is required')
    OUT.mkdir(parents=True,exist_ok=True)
    content=json.loads((OUT/'scenarios.en.json').read_text(encoding='utf-8'))
    jobs=[('landscape','crewlo-use-cases-en-16x9',content['scenes'],1920,1080),
          ('portrait','crewlo-use-cases-en-9x16',content['scenes'],1080,1920),
          ('mvp','crewlo-mvp-en-16x9',content['mvp_scenes'],1920,1080)]
    for key,name,scenes,w,h in jobs:
        if not args.only or args.only==key:
            render(name,scenes,w,h)


if __name__=='__main__':
    main()
