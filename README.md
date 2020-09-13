# webrtc-fun

This is a simple camera/screensharing application with various extras added that I wanted to expirement with.

## Run with npm

There's a start script in the `package.json` so it can be run with:

```
npm start
```

Or, if you prefer to do it with out the start script:

```
node server/server.js
```

## Run with Docker
Simple pull the docker image.

```
docker pull mustafolins/webrtc-fun:latest
```

Then run the docker image with.

```
docker run -p 8443:8443 mustafolins/webrtc-fun
```