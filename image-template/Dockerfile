ARG BASE_IMAGE
FROM ${BASE_IMAGE}


WORKDIR /root

ARG SYSTEM_PACKAGES_FILE=system-packages.txt
COPY ${SYSTEM_PACKAGES_FILE} .

RUN packages=$(cat ${SYSTEM_PACKAGES_FILE} | sed 's/ /-/' | uniq | paste -d' ' -); \
    if [ -n "${packages}" ]; then tdnf install -y ${packages}; fi


WORKDIR /

ARG PACKAGES_FILE=packages.txt
COPY ${PACKAGES_FILE} package.json

RUN pj=$(cat package.json); if [ -n "${pj}" ]; then npm install; fi
