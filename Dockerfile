FROM node:12 AS builder

RUN curl -sL https://install.meteor.com | sed s/--progress-bar/-sL/g | /bin/sh
RUN mkdir /src /bundle
RUN chown -R node /src /bundle

USER node:node

WORKDIR /src
COPY --chown=node:node . .

RUN npm install
RUN npm install -global node-gyp \
RUN meteor npm install
# Use native implementation of bcrypt for better performances
# RUN meteor npm install --save bcrypt
RUN meteor build --architecture os.linux.x86_64 --directory /bundle
RUN cd /bundle/bundle/programs/server && npm install

FROM node:12-slim

USER node:node

COPY --from=builder /bundle /app
WORKDIR /app/bundle

ENV PORT 3000
EXPOSE 3000

CMD ["node", "./main.js"]
