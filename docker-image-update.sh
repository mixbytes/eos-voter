#!/bin/sh

set -x

AWS_REGISTRY=128894178443.dkr.ecr.eu-central-1.amazonaws.com
AWS_REGION=eu-central-1
TAGS=( "latest" )
NAMES=( "eos-voter" )

docker build -t eos-voter .

# upload images to registry
for NAME in "${NAMES[@]}"
do
    for TAG in "${TAGS[@]}"
    do
        docker tag "${NAME}:latest" "${AWS_REGISTRY}/${NAME}:${TAG}"
        ecs-cli push --region "${AWS_REGION}" --ecs-profile mixbytes "${AWS_REGISTRY}/${NAME}:${TAG}"
    done
done
