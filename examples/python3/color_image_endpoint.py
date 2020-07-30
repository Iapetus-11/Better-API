# This example fetches an image from the /color/image endpoint and saves it as a file

import requests
import urllib


r = requests.get('http://localhost/color/image?color=77aff0&x=200&y=200')  # fetch data from the captcha endpoint

with open('color.png', 'wb+') as image_file:  # open up the image we're going to create
    data_url = r.json()['data']  # gets the returned json and gets the data url from that
    data_url_file = urllib.request.urlopen(data_url)  # turns the data url into a file
    image_file.write(data_url_file.file.read())  # writes the data to the file
