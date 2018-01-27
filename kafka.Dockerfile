FROM ubuntu:16.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    build-essential \
    git \
    default-jdk \
    curl \
    sudo \
    nano \
    grep \
    net-tools \
    iputils-ping \
    telnet \
    dnsutils \
    openssh-server
RUN echo "downloading..." && \
    curl http://apache.lauf-forum.at/kafka/1.0.0/kafka_2.11-1.0.0.tgz > kafka_2.11-1.0.0.tgz && \
    tar -xzf kafka_2.11-1.0.0.tgz
ENTRYPOINT bin/zookeeper-server-start.sh config/zookeeper.properties & \
    bin/kafka-server-start.sh config/server.properties