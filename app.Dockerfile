FROM ubuntu:16.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    default-jdk \
    curl \
    sudo \
    nano \
    grep \
    net-tools \
    iputils-ping \
    telnet
RUN mkdir -p /pgrepl/build/libs/
COPY ./build/libs/pgrepl-all-*.jar /pgrepl/build/libs/
EXPOSE 8080 1099
ENTRYPOINT printenv && \
    java \
    -Dcom.sun.management.jmxremote \
    -Dcom.sun.management.jmxremote.authenticate=false \
    -Dcom.sun.management.jmxremote.ssl=false \
    -Dcom.sun.management.jmxremote.local.only=false \
    -Dcom.sun.management.jmxremote.port=1099 \
    -Dcom.sun.management.jmxremote.rmi.port=1099 \
    -Djava.rmi.server.hostname=127.0.0.1 \
    -jar ./pgrepl/build/libs/pgrepl-all-*.jar
