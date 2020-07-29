import requests
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

r = requests.get("http://localhost/gen/captcha?size=5")
jj = r.json()

svg_code = jj['svg']

with open('test.svg', 'w+') as f:
    f.write(svg_code)

drawing = svg2rlg('test.svg')
renderPM.drawToFile(drawing, 'test.png', fmt='PNG')
