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
#RUN    printf "\nadvertised.host.name = localhost\n" >> /kafka_2.11-1.0.0/config/server.properties
EXPOSE 9092
ENTRYPOINT kafka_2.11-1.0.0/bin/zookeeper-server-start.sh kafka_2.11-1.0.0/config/zookeeper.properties & \
    kafka_2.11-1.0.0/bin/kafka-server-start.sh kafka_2.11-1.0.0/config/server.properties & \
    kafka_2.11-1.0.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test && \
    sleep infinity