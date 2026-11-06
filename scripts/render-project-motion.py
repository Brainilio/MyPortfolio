"""Render eight-second screenshot films; temporary authoring tools live under ignored work/."""
from pathlib import Path
import sys,subprocess
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'work/video-tools'))
import imageio_ffmpeg
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
def ease(a,b):return f'((1-cos(PI*clip((t-{a})/{b-a},0,1)))/2)'
g=f'({ease(1.2,2.6)}*(1-{ease(5.4,7)}))'
for slug,main,detail,next_detail,color in [('my-compassion',1,6,5,'0xe5ddef'),('newcold',2,3,4,'0xd6e3e9')]:
    if slug == "newcold":
        continue  # NewCold uses its supplied recordings; see render-newcold-preview.py.
    args=[FFMPEG,'-hide_banner','-loglevel','error','-y']
    for n in [main,detail,next_detail]:args+=['-loop','1','-framerate','24','-i',str(ROOT/f'public/projects/{slug}/{n}.jpg')]
    filters=[f'gradients=s=1280x800:r=24:c0={color}:c1=0xf3ede8:x0=0:y0=0:x1=1280:y1=800:speed=0:d=8,format=rgba[bg]']
    def layer(index,label,width,angle,fade=''):
        filters.append(f"[{index}:v]scale=w='{width}':h=-2:eval=frame,format=rgba,pad=iw+16:ih+16:8:8:white:eval=frame,pad=1280:800:(ow-iw)/2:(oh-ih)/2:black@0:eval=frame,rotate=a='{angle}':c=none{fade},split[{label}][{label}s]")
        filters.append(f'[{label}s]colorchannelmixer=rr=0:gg=0:bb=0:aa=.2,boxblur=18:2[{label}shadow]')
    layer(0,'main','920',f'-.045+.025*{g}')
    layer(1,'detail',f'380+440*{g}',f'.065*(1-{g})')
    layer(2,'next',f'380+440*{g}',f'.065*(1-{g})',',fade=t=in:st=3.5:d=0.65:alpha=1,fade=t=out:st=5.0:d=0.55:alpha=1')
    def overlay(base,label,x,y,out):
        filters.append(f"[{base}][{label}shadow]overlay=x='{x}+8':y='{y}+20':eval=frame[{out}s]")
        filters.append(f"[{out}s][{label}]overlay=x='{x}':y='{y}':eval=frame[{out}]")
    overlay('bg','main',f'(W-w)/2-140*{g}',f'(H-h)/2-30*{g}','a')
    overlay('a','detail',f'(W-w)/2+230*(1-{g})',f'(H-h)/2+130*(1-{g})','b')
    overlay('b','next',f'(W-w)/2+230*(1-{g})',f'(H-h)/2+130*(1-{g})','c')
    filters.append('[c]format=yuv420p[out]')
    output=ROOT/f'public/projects/{slug}/thumbnail-motion.mp4'
    args+=['-filter_complex',';'.join(filters),'-map','[out]','-t','8','-an','-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart',str(output)]
    print('Rendering',slug,flush=True);subprocess.run(args,check=True);print(output.stat().st_size,flush=True)
