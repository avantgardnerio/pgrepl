#!/usr/bin/env bash
docker build -t bgard6977/pgrepl-db:latest -f db.Dockerfile .
docker build -t bgard6977/pgrepl-app:latest -f app.Dockerfile .
docker build -t bgard6977/pgrepl-kafka:latest -f kafka.Dockerfile .
