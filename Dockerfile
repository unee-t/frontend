FROM node:8.11.4 AS builder

# For some reason, the container ships with an old version of npm
RUN npm install -g npm

RUN su -c "curl -o /tmp/meteor.sh 'https://install.meteor.com?release=1.8.0.2'; sh /tmp/meteor.sh; rm -f /tmp/meteor.sh" node
RUN cp "/home/node/.meteor/packages/meteor-tool/1.8.0_2/mt-os.linux.x86_64/scripts/admin/launch-meteor" /usr/bin/meteor
RUN mkdir /src /bundle
RUN chown -R node /src /bundle

USER node:node

WORKDIR /src
COPY --chown=node:node . .
RUN meteor npm install --production
RUN meteor build --directory /bundle
RUN cd /bundle/bundle/programs/server && npm install

FROM node:8.11.4-slim

USER node:node

COPY --from=builder /bundle /app
WORKDIR /app/bundle

EXPOSE 3000

CMD ["node", "./main.js"]
