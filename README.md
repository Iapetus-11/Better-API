# TheAPI
*created by Iapetus11 & TrustedMercury*

## Setup / Usage
### Prerequisites
* [node.js](https://nodejs.org/) must be installed
* [npm](https://nodejs.org/) must be installed (this can be installed via the node.js installer)
* [python](https://www.python.org/downloads/) 3.6+ installed (3.8.x is recommended)

### Setup
* git clone the repository, and cd into it
```
git clone https://github.com/theapi-info/theapi.info-api.git
cd theapi.info-api
```
* install the node packages
```
node install
```
* install the python packages
```
pip3 install -U pyraklib
pip3 install -U mcstatus
```
* open `constants.js` and edit the baseUrl value if needed.

### Running
* you'll need to run these two commands separately. (Like in separate windows or using linux screen)
```
python3 mcping_server.py
node app.js
```
