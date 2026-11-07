#!/usr/bin/env bash
# Constrói e publica as imagens deste repositório no Docker Hub.
# Antes: docker login   (use a conta sofhiachromiec)
set -euo pipefail
cd "$(dirname "$0")"
docker build --platform linux/amd64 --build-arg SERVICO=bff-mobile -t sofhiachromiec/pjbl-bff:v1 .
docker push sofhiachromiec/pjbl-bff:v1
docker build --platform linux/amd64 --build-arg SERVICO=api-gateway -t sofhiachromiec/pjbl-gateway:v1 .
docker push sofhiachromiec/pjbl-gateway:v1
docker build --platform linux/amd64 --build-arg SERVICO=notificacao -t sofhiachromiec/pjbl-notificacao:v1 .
docker push sofhiachromiec/pjbl-notificacao:v1
echo "Imagens publicadas."
