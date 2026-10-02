#!/bin/bash
cd /home/user/-
. scripts/chrome-flags.sh
while pgrep -f "celeb-smile-1080x1920" >/dev/null; do sleep 10; done
npx remotion render src/index.ts CelebSmileAd out/celeb-smile-2160x3840.mp4 $REMOTION_FLAGS --scale=2 --codec=h264 --pixel-format=yuv420p --audio-codec=aac --crf=18 --concurrency=4 --timeout=600000 > out/render4k.log 2>&1
