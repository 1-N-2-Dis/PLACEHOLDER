# Firebase Auth + Firestore emulators for the Docker dev stack (see docker-compose.yml).
# The Firestore emulator is a Java app, so this image carries a JRE alongside Node
# (docs/LOCAL_DEV.md requires JDK 21+ — Temurin 21 from the Adoptium apt repo).
# Build context is the repo root: the rules/indexes are copied from backend/.
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
  && curl -fsSL https://packages.adoptium.net/artifactory/api/gpg/key/public \
     | gpg --dearmor -o /usr/share/keyrings/adoptium.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" \
     > /etc/apt/sources.list.d/adoptium.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends temurin-21-jre \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g firebase-tools

WORKDIR /app

# Docker-specific config: same ports as the repo-root firebase.json, plus host 0.0.0.0 so the
# emulators are reachable from outside the container (default localhost binding is not).
COPY docker/firebase.docker.json ./firebase.json
COPY backend/firestore.rules backend/firestore.indexes.json ./

# Pre-download the emulator jars at build time so `compose up` doesn't re-fetch them on every run.
RUN firebase setup:emulators:firestore && firebase setup:emulators:ui

EXPOSE 9099 8081 4000

CMD ["firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-saferroute"]
