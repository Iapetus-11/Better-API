import requests
from binascii import a2b_base64


r = requests.get('http://localhost/color/image?color=77d5af&x=200&y=200')  # fetch the image

with open('color.png', 'wb+') as image_file:  # open up the image we're going to create
    data_url = r.text.split("\"")[1] # takes the data url from the returned html
    binary_data = a2b_base64(data_url)  # turns the base64 / data url into binary
    image_file.write(binary_data)  # writes the binary data to the file
