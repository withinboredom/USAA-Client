#!/bin/bash

#docker run --rm -v $(pwd):/share wernight/phantomjs /usr/local/bin/phantomjs /share/hello.js
docker run --rm -v $(pwd):/home/casperjs-files fprieur/docker-casperjs casperjs --ssl-protocol=any /home/casperjs-files/casper.js
