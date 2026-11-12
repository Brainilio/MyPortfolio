"""NewCold: supplied logo and one minimal landscape video panel, with a matching still fallback."""
from pathlib import Path
from base64 import b64encode
ROOT=Path(__file__).resolve().parents[1]
def asset(name,mime):
 return f'data:{mime};base64,'+b64encode((ROOT/'public/projects/newcold'/name).read_bytes()).decode()
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
<title>NewCold logo and desktop header preview</title>
<defs>
 <filter id="logo" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .39 .39 .39 0 -.17"/></filter>
 <filter id="shadow" x="-.2" y="-.2" width="1.4" height="1.5"><feDropShadow dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".25"/></filter>
 <clipPath id="screen"><rect x="540" y="231" width="680" height="339" rx="9"/></clipPath>
</defs>
<rect width="1280" height="800" fill="#051745"/>
<image x="60" y="334" width="460" height="142.21" filter="url(#logo)" href="{asset('logo.png','image/png')}"/>
<g filter="url(#shadow)">
 <rect x="539" y="230" width="682" height="341" rx="10" fill="#9aacc4"/>
 <image x="540" y="231" width="680" height="339" preserveAspectRatio="xMidYMid meet" href="{asset('header-poster.jpg','image/jpeg')}" clip-path="url(#screen)"/>
</g>
</svg>'''
p=ROOT/'public/projects/newcold/thumbnail.svg';p.write_text(svg);print(p.relative_to(ROOT))
