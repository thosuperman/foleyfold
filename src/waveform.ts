// Whole-file decoding is optional: keep long films editable without allocating a full PCM track.
export function canAnalyze(bytes:number,seconds:number) {
 return bytes<=32*1024*1024&&seconds<=300;
}

export function peakEnvelope(channels:Float32Array[],bins=1024) {
 const length=channels[0]?.length??0, count=Math.min(length,bins);
 const peaks=new Array<number>(count).fill(0);
 for(let b=0;b<count;b++){
  const start=Math.floor(b*length/count),end=Math.floor((b+1)*length/count);
  for(const channel of channels){
   let peak=peaks[b];
   for(let i=start;i<end;i++)peak=Math.max(peak,Math.abs(channel[i]));
   peaks[b]=peak;
  }
 }
 return peaks;
}

export async function localWaveform(file:Blob,seconds:number) {
 const context=new OfflineAudioContext(1,1,8000);
 const audio=await context.decodeAudioData(await file.arrayBuffer());
 // A detached or shorter audio track has no reliable placement on the video timeline.
 if(Math.abs(audio.duration-seconds)>.15)throw new Error('Audio and video timelines differ');
 return peakEnvelope(Array.from({length:audio.numberOfChannels},(_,c)=>audio.getChannelData(c)));
}
