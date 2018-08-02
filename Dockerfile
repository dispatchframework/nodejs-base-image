FROM vmware/photon2:20180424

RUN tdnf install -y nodejs-8.3.0-1.ph2 gzip tar

ARG IMAGE_TEMPLATE=/image-template
ARG FUNCTION_TEMPLATE=/function-template
ARG servers=1

LABEL io.dispatchframework.imageTemplate="${IMAGE_TEMPLATE}" \
      io.dispatchframework.functionTemplate="${FUNCTION_TEMPLATE}"

COPY image-template ${IMAGE_TEMPLATE}/
COPY function-template ${FUNCTION_TEMPLATE}/

COPY validator /validator/

## Set WORKDIR and PORT, expose $PORT, cd to $WORKDIR

ENV WORKDIR=/function PORT=8080 SERVERS=$servers FUNKY_VERSION=0.1.2

EXPOSE ${PORT}
WORKDIR ${WORKDIR}

COPY function-server /function-server/
RUN cd /function-server; npm install --production

RUN curl -L https://github.com/dispatchframework/funky/releases/download/${FUNKY_VERSION}/funky${FUNKY_VERSION}.linux-amd64.tgz -o funky${FUNKY_VERSION}.linux-amd64.tgz
RUN tar -xzf funky${FUNKY_VERSION}.linux-amd64.tgz

# OpenFaaS readiness check depends on this file
RUN touch /tmp/.lock

CMD SERVER_CMD="node /function-server/server.js $(cat /tmp/handler)" ./funky
