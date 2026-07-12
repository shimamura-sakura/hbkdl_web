#!/bin/sh

clear

while true; do
  date
  (
  echo "(async()=>{"
  bun build --target=browser --minify src/main.ts
  echo "})()"
  ) > dist.js

  inotifywait -e modify src
  clear
done