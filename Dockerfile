FROM ubuntu:16.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    default-jdk \
    build-essential \
    libssl-dev \
    git \
    postgresql-9.5 \
    postgresql-server-dev-9.5 \
    curl \
    sudo \
    nano \
    grep \
    net-tools
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs
RUN git clone https://github.com/eulerto/wal2json.git && \
    cd wal2json && \
    USE_PGXS=1 make && \
    USE_PGXS=1 make install && \
    cd ..
RUN echo "max_wal_senders = 20" | tee -a /etc/postgresql/9.*/main/postgresql.conf && \
    echo "wal_keep_segments = 20" | tee -a /etc/postgresql/9.*/main/postgresql.conf && \
    echo "wal_level = logical" | tee -a /etc/postgresql/9.*/main/postgresql.conf && \
    echo "max_replication_slots = 20" | tee -a /etc/postgresql/9.*/main/postgresql.conf && \
    echo "local replication postgres peer" | tee -a /etc/postgresql/9.*/main/pg_hba.conf && \
    echo "host replication postgres 127.0.0.1/32 md5" | tee -a /etc/postgresql/9.*/main/pg_hba.conf && \
    echo "host replication postgres ::1/128 md5" | tee -a /etc/postgresql/9.*/main/pg_hba.conf && \
    service postgresql restart && \
    sudo -u postgres psql -U postgres -d postgres -c "alter user postgres with password 'postgres';"
# Only for development environments
#RUN git clone https://github.com/bgard6977/pgrepl.git && \
#    cd pgrepl && \
#    ./gradlew fatJar -x test
RUN mkdir -p /pgrepl/build/libs/
COPY ./build/libs/pgrepl-all-*.jar /pgrepl/build/libs/
EXPOSE 8080 1099
ENTRYPOINT service postgresql start && \
    java \
    -Dcom.sun.management.jmxremote \
    -Dcom.sun.management.jmxremote.authenticate=false \
    -Dcom.sun.management.jmxremote.ssl=false \
    -Dcom.sun.management.jmxremote.local.only=false \
    -Dcom.sun.management.jmxremote.port=1099 \
    -Dcom.sun.management.jmxremote.rmi.port=1099 \
    -Djava.rmi.server.hostname=127.0.0.1 \
    -jar ./pgrepl/build/libs/pgrepl-all-*.jar
