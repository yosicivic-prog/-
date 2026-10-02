#!/bin/bash
cd /home/user/-
. scripts/chrome-flags.sh
npx remotion render src/index.ts CelebSmileProduct7s out/celeb-smile-product-7s-raw.mp4 $REMOTION_FLAGS --codec=h264 --pixel-format=yuv420p --audio-codec=aac --crf=16 --concurrency=4 --timeout=300000 > out/render7.log 2>&1
ffmpeg -loglevel error -y -i out/celeb-smile-product-7s-raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 16 -preset slow -color_range tv -movflags +faststart -c:a copy out/celeb-smile-product-7s-1080x1920.mp4
