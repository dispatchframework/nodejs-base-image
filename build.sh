#!/bin/sh
set -e -x

cd $(dirname $0)

docker build -t dispatchframework/nodejs-base:0.0.6 .
