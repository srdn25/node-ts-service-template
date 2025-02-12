#!/bin/sh

scriptDir=$( pwd -P ) 

mkdir -p $scriptDir/src/certs
chmod -R 777 $scriptDir/src/certs
CA_KEY="$scriptDir/src/certs/ca.key"

openssl rand -base64 756 > $CA_KEY
chmod 400 $CA_KEY
# sudo chown mongo:mongo $CA_KEY