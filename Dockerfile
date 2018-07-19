FROM vmware/photon2:20180424

RUN tdnf install -y nodejs-8.3.0-1.ph2

ARG IMAGE_TEMPLATE=/image-template
ARG FUNCTION_TEMPLATE=/function-template

LABEL io.dispatchframework.imageTemplate="${IMAGE_TEMPLATE}" \
      io.dispatchframework.functionTemplate="${FUNCTION_TEMPLATE}"

COPY image-template ${IMAGE_TEMPLATE}/
COPY function-template ${FUNCTION_TEMPLATE}/

COPY validator /validator/

## Set WORKDIR and PORT, expose $PORT, cd to $WORKDIR

ENV WORKDIR=/function PORT=8080 SERVERS=1 SERVER_CMD="node /function-server/server.js $(cat /tmp/handler)"

EXPOSE ${PORT}
WORKDIR ${WORKDIR}

COPY function-server /function-server/
RUN cd /function-server; npm install --production

# OpenFaaS readiness check depends on this file
RUN touch /tmp/.lock

CMD funky
