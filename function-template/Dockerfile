ARG IMAGE
FROM ${IMAGE}

WORKDIR ${WORKDIR}

ARG HANDLER
ENV HANDLER=${HANDLER}

COPY . .

CMD ["node", "/function-server/server.js"]
