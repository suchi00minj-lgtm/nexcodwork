const {chromium}=require('playwright');
const {spawn}=require('child_process');const fs=require('fs');const path=require('path');
const DIR=__dirname, FPS=30;
const V=JSON.parse(fs.readFileSync(DIR+'/build/timeline.json','utf8'));
const mode=process.argv[2]; const ids=(process.argv[3]||'').split(',').filter(Boolean);
(async()=>{
 const b=await chromium.launch();
 const page=await b.newPage({viewport:{width:1080,height:1920}});
 await page.goto('file://'+DIR+'/template.html');
 for(const v of V.filter(v=>!ids.length||ids.includes(v.id))){
  if(mode==='still'){ // one frame per scene at 75% for checking
    for(const [i,s] of v.scenes.entries()){
      await page.evaluate(([s,m])=>window.build(s,m),[s,{start:s.start,total:v.total,last:i===v.scenes.length-1}]);
      await page.evaluate(t=>window.seek(t),s.dur*0.8);
      await page.screenshot({path:`${DIR}/build/still_${v.id}_${i}.jpg`,type:'jpeg',quality:80});
    }
    console.log('still',v.id);continue;
  }
  const out=`${DIR}/build/silent_${v.id}.mp4`;
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-r',String(FPS),out],{stdio:['pipe','inherit','inherit']});
  const t0=Date.now();let n=0;
  for(const [i,s] of v.scenes.entries()){
    await page.evaluate(([s,m])=>window.build(s,m),[s,{start:s.start,total:v.total,last:i===v.scenes.length-1}]);
    const N=Math.round(s.dur*FPS);
    for(let f=0;f<N;f++){
      await page.evaluate(t=>window.seek(t),f/FPS);
      const buf=await page.screenshot({type:'jpeg',quality:90});
      if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
      n++;
    }
  }
  ff.stdin.end();await new Promise(r=>ff.on('close',r));
  console.log('video',v.id,n,'frames',((Date.now()-t0)/1000).toFixed(0)+'s');
 }
 await b.close();
})();
