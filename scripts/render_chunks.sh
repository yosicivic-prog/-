#!/bin/bash
# usage: render_chunks.sh <composition> <total_frames> <out_name> <audio_file> <audio_seconds>
# Renders in 30-frame chunks kept on disk (resumable), then concatenates and muxes audio.
cd /home/user/-
. scripts/chrome-flags.sh
COMP=$1; TOTAL=$2; NAME=$3; AUDIO=$4; SECS=$5
D=out/chunks_$NAME; mkdir -p $D
for ((s=0; s<TOTAL; s+=30)); do
  e=$((s+29)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  f=$D/c_$(printf %03d $s).mp4
  [ -f "$f" ] && continue
  timeout 900 npx remotion render src/index.ts $COMP $D/part.mp4 $REMOTION_FLAGS --frames=$s-$e --muted --codec=h264 --pixel-format=yuv420p --crf=12 --concurrency=4 --timeout=300000 >> out/render_$NAME.log 2>&1 && mv $D/part.mp4 $f
done
[ $(ls $D/c_*.mp4 | wc -l) -lt $(( (TOTAL+29)/30 )) ] && { echo INCOMPLETE >> out/render_$NAME.log; exit 1; }
ls /home/user/-/$D/c_*.mp4 | sed "s/.*/file '&'/" > $D/list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i $D/list.txt -i $AUDIO -t $SECS -vf "scale=in_range=full:out_range=tv,format=yuv420p" -af "afade=t=out:st=$(python3 -c "print($SECS-1.5)"):d=1.5" -c:v libx264 -crf 16 -preset slow -color_range tv -c:a aac -b:a 192k -movflags +faststart out/$NAME.mp4
echo DONE >> out/render_$NAME.log
