FROM ubuntu:16.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    build-essential \
    libssl-dev \
    git \
    postgresql-9.5 \
    postgresql-server-dev-9.5 \
    curl \
    sudo \
    nano \
    grep \
    net-tools \
    iputils-ping \
    telnet \
    dnsutils \
    openssh-server
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
    sed -i.bak "s/127\.0\.0\.1\/32/0.0.0.0\/0/g" /etc/postgresql/9.*/main/pg_hba.conf && \
    echo "listen_addresses = '*'" | tee -a /etc/postgresql/9.*/main/postgresql.conf
RUN service postgresql restart && \
    sudo -u postgres psql -U postgres -d postgres -c "alter user postgres with password 'postgres';"
RUN sed -i.bak "s/PermitRootLogin prohibit-password/PermitRootLogin yes/g" /etc/ssh/sshd_config && \
    echo "root:Docker!" | chpasswd
EXPOSE 5432
ENTRYPOINT echo "hello world 73!" && \
    cat /etc/ssh/sshd_config && \
    service ssh restart && \
    service postgresql start && \
    netstat -l && \
    tail -F /var/log/postgresql/postgresql-*-main.log