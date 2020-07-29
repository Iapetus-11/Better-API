# old code for when the captcha endpoint returned svgs instead of data urls for the image
"""
import requests
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

r = requests.get("http://localhost/gen/captcha?size=5")
jj = r.json()

svg_code = jj['data']

with open('test.svg', 'w+') as f:
    f.write(svg_code)

drawing = svg2rlg('test.svg')
renderPM.drawToFile(drawing, 'test.png', fmt='PNG')
"""

import requests
from binascii import a2b_base64


r = requests.get('http://localhost/gen/captcha?size=4&imgonly=false')  # fetch data from the captcha endpoint

with open('captcha.png', 'wb+') as image_file:  # open up the image we're going to create
    data_url = r['data']
    binary_data = a2b_base64(data_url)  # turns the base64 / data url into binary
    image_file.write(binary_data)  # writes the binary data to the file
