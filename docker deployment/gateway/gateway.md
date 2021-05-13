# how to build Mindiscov

## build image 

in order to build the docker image need to use in the same folder this files are:

```docker build --build-arg JAR_FILE=gateway.jar --build-arg PROPERTIES_YML=application.yml --build-arg BOOTSTRAP_YML=bootstrap.yml --build-arg CERT_P12=obsidian3.p12 --build-arg CERT=obsidian3.cert.pem -t tamdae/skynovels:gateway .```