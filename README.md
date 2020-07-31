# TheAPI
#### By Iapetus11 & TrustedMercury
Fully OSS public API with a ton of useful information and endpoints!

## Setup / Usage
### Prerequisites
* [node.js v12+](https://nodejs.org/)
* [npm 6+](https://nodejs.org/)
* [python 3.6+](https://www.python.org/downloads/)

### Setup
Clone the repository, and navigate into it
```
git clone https://github.com/theapi-info/theapi.info-api.git
cd theapi.info-api
```
Install the node packages
```
npm i
```
Install the python packages
```
pip3 install -U pyraklib
pip3 install -U mcstatus
```
Open `constants.js` and edit the baseUrl value if needed.

### Running
You'll need to run these two commands separately. (Like in separate windows or using linux screen)
```
python3 mcping_server.py
node app.js
```

## Endpoints (List of the endpoints available, may be outdated)
```
/color/random
/color/color
/color/image

/gen/captcha
/gen/uuid
/gen/bulkuuid

/mc/mcping
```
