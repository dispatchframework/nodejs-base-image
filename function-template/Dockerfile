ARG IMAGE
FROM ${IMAGE}

WORKDIR ${WORKDIR}

ARG HANDLER
ENV HANDLER=${HANDLER}

COPY . .

# Create handler file if passed in otherwise assume default handler
RUN echo -n ${HANDLER} > /tmp/handler
RUN if [ -z "${HANDLER}" ]; then \
    ([ $(ls *.js | wc -l) -eq "1" ] || (echo "Exactly 1 source file needed when HANDLER is empty" >&2 && exit 1)) && \
    ls *.js > /tmp/handler; fi

# Validate function file and given handler
RUN node /validator/validator.js ${WORKDIR}/$(cat /tmp/handler) || (echo "Invalid function file or handler" >&2 && exit 1)