#!/bin/sh
set -e -x

cd $(dirname $0)

docker build -t dispatchframework/nodejs6-base:0.0.2 .
