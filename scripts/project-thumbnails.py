"""Rebuild text-free, self-contained screenshot-stack covers. Originals stay unchanged."""
from pathlib import Path
from base64 import b64encode
ROOT=Path(__file__).resolve().parents[1]
def image(slug,n):
    return 'data:image/jpeg;base64,'+b64encode((ROOT/f'public/projects/{slug}/{n}.jpg').read_bytes()).decode()
for slug,name,color,main,detail,ratio in [('my-compassion','MyCompassion','#e5ddef',1,6,800/475)]:
    h=920/ratio;dh=380/(800/475 if slug=='my-compassion' else 800/520)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800"><title>{name} screen composition</title>
<defs><linearGradient id="sky" x2="1" y2="1"><stop stop-color="{color}"/><stop offset="1" stop-color="#f3ede8"/></linearGradient><filter id="shadow" x="-.3" y="-.3" width="1.6" height="1.8"><feDropShadow dy="20" stdDeviation="18" flood-color="#211c30" flood-opacity=".2"/></filter><clipPath id="main"><rect width="920" height="{h}" rx="8"/></clipPath><clipPath id="detail"><rect width="380" height="{dh}" rx="8"/></clipPath></defs>
<rect width="1280" height="800" fill="url(#sky)"/>
<g transform="translate(180 {400-h/2}) rotate(-2.58 460 {h/2})" filter="url(#shadow)"><rect x="-8" y="-8" width="936" height="{h+16}" rx="16" fill="#fff"/><image width="920" height="{h}" href="{image(slug,main)}" clip-path="url(#main)"/></g>
<g transform="translate(680 {530-dh/2}) rotate(3.72 190 {dh/2})" filter="url(#shadow)"><rect x="-8" y="-8" width="396" height="{dh+16}" rx="16" fill="#fff"/><image width="380" height="{dh}" href="{image(slug,detail)}" clip-path="url(#detail)"/></g></svg>'''
    path=ROOT/f'public/projects/{slug}/thumbnail.svg';path.write_text(svg);print(path.relative_to(ROOT))

# NewCold follows the requested minimal-screen direction.
import runpy
runpy.run_path(str(ROOT/"scripts/newcold-thumbnail.py"))
