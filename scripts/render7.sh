#!/bin/bash
# Renders the 7s ad in 30-frame chunks kept on disk, so a container reset only loses one chunk.
cd /home/user/-
. scripts/chrome-flags.sh
for s in 0 30 60 90 120 150 180; do
  e=$((s+29)); [ $e -gt 209 ] && e=209
  f=out/chunks/c_$(printf %03d $s).mp4
  [ -f "$f" ] && continue
  npx remotion render src/index.ts CelebSmileProduct7s out/chunks/part.mp4 $REMOTION_FLAGS --frames=$s-$e --muted --codec=h264 --pixel-format=yuv420p --crf=12 --concurrency=4 --timeout=300000 >> out/render7.log 2>&1 && mv out/chunks/part.mp4 $f
done
ls /home/user/-/out/chunks/c_*.mp4 | sed "s/.*/file '&'/" > out/chunks/list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i out/chunks/list.txt -i public/music7.wav -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 16 -preset slow -color_range tv -c:a aac -b:a 192k -shortest -movflags +faststart out/celeb-smile-product-7s-1080x1920.mp4
echo DONE >> out/render7.log
