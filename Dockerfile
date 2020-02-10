FROM node:8.15.1 AS builder

ENV BUNDLE_DIR /home/node/bundle
ENV SRC_DIR /home/node/src
ENV TMP_DIR /home/node/tmp

USER node:node

RUN mkdir -p $SRC_DIR $BUNDLE_DIR $TMP_DIR
COPY --chown=node:node . $SRC_DIR

RUN curl -o $TMP_DIR/meteor.sh 'https://install.meteor.com?release=1.8.1'; sh $TMP_DIR/meteor.sh

ENV PATH="/home/node/.meteor:${PATH}"
WORKDIR $SRC_DIR
RUN npm i
RUN meteor npm install --production
RUN meteor build --server-only --directory $BUNDLE_DIR
RUN cd ${BUNDLE_DIR}/bundle/programs/server && npm install

FROM node:8.15.1-slim

ENV APP_DIR /home/node/app
ENV BUNDLE_DIR /home/node/bundle

USER node:node

COPY --from=builder $BUNDLE_DIR $APP_DIR
WORKDIR $APP_DIR/bundle


ENV PORT 3000
EXPOSE 3000


CMD ["node", "./main.js"]
