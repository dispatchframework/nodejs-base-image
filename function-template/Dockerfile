ARG IMAGE
FROM ${IMAGE}

WORKDIR ${WORKDIR}

ARG HANDLER
ENV HANDLER=${HANDLER}

COPY . .

# Create handler file if passed in otherwise assume default handler
RUN echo -n ${HANDLER} > /tmp/handler
RUN [ -z "${HANDLER}" ] && \
    [ $(ls *.js | wc -l) -eq "1" ] && \
    ls *.js > /tmp/handler || :
