import {AudioBufferSink,BlobSource,Input,ALL_FORMATS} from 'mediabunny';

export function canAnalyze(bytes:number,seconds:number) {
 return bytes<=32*1024*1024&&seconds<=300;
}

export function addAudioPeaks(peaks:number[],seconds:number,channel:Float32Array,rate:number,offset:number) {
 const framesPerBin=rate*seconds/peaks.length,firstFrame=offset*rate;
 const first=Math.max(0,Math.floor(firstFrame/framesPerBin));
 const end=Math.min(peaks.length,Math.ceil((firstFrame+channel.length)/framesPerBin));
 for(let b=first;b<end;b++){
  let peak=peaks[b];
  const from=Math.max(0,Math.ceil(b*framesPerBin-firstFrame));
  const to=Math.min(channel.length,Math.ceil((b+1)*framesPerBin-firstFrame));
  for(let i=from;i<to;i++)peak=Math.max(peak,Math.abs(channel[i]));
  peaks[b]=peak;
 }
}

export async function localWaveform(file:Blob,seconds:number,current:()=>boolean) {
 const input=new Input({formats:ALL_FORMATS,source:new BlobSource(file)});
 try{
  const track=await input.getPrimaryAudioTrack();
  if(!track||!await track.canDecode())throw new Error('No decodable audio');
  const peaks=new Array<number>(1024).fill(0);let decoded=false;
  for await(const {buffer,timestamp} of new AudioBufferSink(track).buffers(undefined,seconds)){
   if(!current())throw new Error('Reel changed');
   for(let c=0;c<buffer.numberOfChannels;c++)addAudioPeaks(peaks,seconds,buffer.getChannelData(c),buffer.sampleRate,timestamp);
   decoded=true;
  }
  if(!decoded)throw new Error('Empty audio track');
  return peaks;
 }finally{input.dispose();}
}
