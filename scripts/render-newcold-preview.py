"""One original header recording, fitted without stretching into a minimal screen panel."""
from pathlib import Path
import sys,subprocess
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'work/video-tools'))
import imageio_ffmpeg
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
source=ROOT/'work/newcold/source/recording-163705.mov';out=ROOT/'public/projects/newcold'
# Keep the full original aspect ratio; the source is 3454×1722. No UI cropping or stretching.
subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(source),'-frames:v','1','-vf','scale=1920:-2','-q:v','1',str(out/'header-poster.jpg')],check=True)
r=20
mask=f'if(lte(pow(max(abs(X-W/2)-(W/2-{r}),0),2)+pow(max(abs(Y-H/2)-(H/2-{r}),0),2),{r*r}),255,0)'
f=[
 'color=c=0x051745:s=2560x1600:r=30:d=9.36,format=rgba[bg]',
 '[1:v]scale=920:-1,format=rgba,colorkey=0x051745:0.04:0.02[logo]',
 '[bg][logo]overlay=120:668[brand]',
 f"[0:v]fps=30,scale=1360:-2,setsar=1,format=rgba,pad=iw+4:ih+4:2:2:color=0x9aacc4,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='{mask}',split[panel][shadow]",
 '[shadow]colorchannelmixer=rr=0:gg=0:bb=0:aa=.25,pad=iw+96:ih+96:48:48:black@0,boxblur=28:2[soft]',
 '[brand][soft]overlay=1030:432[shaded]',
 '[shaded][panel]overlay=1078:460,format=yuv420p[result]',
]
args=[FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(source),'-loop','1','-framerate','30','-i',str(out/'logo.png'),'-filter_complex',';'.join(f),'-map','[result]','-t','9.36','-an','-c:v','libx264','-preset','medium','-crf','16','-movflags','+faststart',str(out/'thumbnail-header.mp4')]
subprocess.run(args,check=True)
print(out/'thumbnail-header.mp4')
