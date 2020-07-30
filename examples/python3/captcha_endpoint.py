# This example fetches a captcha from the endpoint and writes the captcha image to a file

import requests
import urllib


r = requests.get('http://localhost/gen/captcha?size=4&imgonly=false')  # fetch data from the captcha endpoint

with open('captcha.png', 'wb+') as image_file:  # open up the image we're going to create
    data_url = r.json()['data']  # gets the returned json and gets the data url from that
    data_url_file = urllib.request.urlopen(data_url)  # turns the data url into a file
    image_file.write(data_url_file.file.read())  # writes the data to the file

# ignore the below
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
