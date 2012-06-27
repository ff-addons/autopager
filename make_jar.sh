#!/bin/sh

set -e

cd xpi/chrome
rm -f autopager.jar
zip -0 -r autopager.jar *
