const names=['fast1.jpg','fast2.jpg','fast3.jpg','fast4.jpg','fast5.jpg','fast6.jpg','fast8.jpg','fast9.jpg'];
const imgs=[];
function loadImages(){names.forEach((n,i)=>{const im=new Image();im.decoding='async';im.onload=()=>{imgs[i]=im};im.onerror=()=>{const f=new Image();f.onload=()=>{imgs[i]=f};f.src='assets/level'+n.replace('fast','')};im.src='assets/'+n})}
loadImages();
const cvs=document.getElementById('game'),ctx=cvs.getContext('2d'),nextC=document.getElementById('next'),nctx=nextC.getContext('2d'),bgm=document.getElementById('bgm'),siu=document.getElementById('siu'),wowo=document.getElementById('wowo'),soundToggle=document.getElementById('soundToggle');
let audioUnlocked=false,audioCtx=null,fxBuffers={};
async function loadFxBuffer(a){if(!audioCtx||!a)return;try{const r=await fetch(a.currentSrc||a.src,{cache:'force-cache'});const b=await r.arrayBuffer();fxBuffers[a.id]=await audioCtx.decodeAudioData(b)}catch(e){}}
function unlockAudio(){if(!audioUnlocked){audioUnlocked=true;if(window.AudioContext||window.webkitAudioContext){const AC=window.AudioContext||window.webkitAudioContext;audioCtx=new AC();audioCtx.resume().catch(()=>{});loadFxBuffer(siu);loadFxBuffer(wowo)}[siu,wowo].forEach(a=>{if(!a)return;const old=a.volume;a.volume=0;const p=a.play();if(p)p.then(()=>{a.pause();a.currentTime=0;a.volume=old}).catch(()=>{a.volume=old})})}else if(audioCtx)audioCtx.resume().catch(()=>{});if(bgm){bgm.volume=.22;bgm.loop=true;bgm.preload='auto';bgm.addEventListener('waiting',()=>bgm.play().catch(()=>{}));bgm.addEventListener('stalled',()=>bgm.play().catch(()=>{}));bgm.addEventListener('canplay',()=>{if(audioUnlocked&&bgm.paused)bgm.play().catch(()=>{})});bgm.addEventListener('ended',()=>{bgm.currentTime=0;bgm.play().catch(()=>{})});bgm.play().catch(()=>{})}}
function playFx(a){if(!a)return;if(!audioUnlocked)unlockAudio();if(audioCtx&&fxBuffers[a.id]){const s=audioCtx.createBufferSource(),g=audioCtx.createGain();s.buffer=fxBuffers[a.id];g.gain.value=.68;s.connect(g).connect(audioCtx.destination);s.start();return}a.volume=.68;a.currentTime=0;a.play().catch(()=>{})}
document.addEventListener('pointerdown',unlockAudio,{once:true});
if(soundToggle)soundToggle.addEventListener('click',()=>{unlockAudio();if(bgm){bgm.loop=true;bgm.play().then(()=>{soundToggle.textContent='Music ON'}).catch(()=>{soundToggle.textContent='Tap again'})}});let W=0,H=0,balls=[],score=0,best=+localStorage.meroBest||0,nextLevel=0,currentLevel=0,gameOver=false,last=0,dangerTime=0,siuCooldown=0,aimX=0,hasAim=false;
const radii=[22,30,40,52,66,82,120,142];
document.getElementById('best').textContent=best;
function makeCutout(im){
 const s=document.createElement('canvas'),x=s.getContext('2d');s.width=im.naturalWidth;s.height=im.naturalHeight;x.drawImage(im,0,0);
 const d=x.getImageData(0,0,s.width,s.height),a=d.data,w=s.width,h=s.height,seen=new Uint8Array(w*h),q=[],corners=[0,w-1,(h-1)*w,w*h-1],cols=corners.map(p=>[a[p*4],a[p*4+1],a[p*4+2]]);
 for(const p of corners){seen[p]=1;q.push(p)}let removed=0;
 while(q.length){const p=q.pop(),px=p%w,r=a[p*4],g=a[p*4+1],b=a[p*4+2],near=cols.some(c=>Math.hypot(r-c[0],g-c[1],b-c[2])<68);if(!near)continue;a[p*4+3]=0;removed++;for(const n of [p-1,p+1,p-w,p+w])if(n>=0&&n<w*h&&!seen[n]&&Math.abs((n%w)-px)<=1){seen[n]=1;q.push(n)}}
 if(removed<w*h*.06)return im;
 x.putImageData(d,0,0);let minX=w,minY=h,maxX=0,maxY=0,solid=0;
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(a[(y*w+xx)*4+3]>20){solid++;minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
 if(solid<w*h*.06||maxX<=minX||maxY<=minY)return im;
 const o=document.createElement('canvas');o.width=maxX-minX+1;o.height=maxY-minY+1;o.getContext('2d').drawImage(s,minX,minY,o.width,o.height,0,0,o.width,o.height);return o;
}
function ngon(n,rot){const p=[];const r0=rot==null?-Math.PI/2:rot;for(let i=0;i<n;i++){const a=r0+2*Math.PI*i/n;p.push([Math.cos(a),Math.sin(a)])}return p}
function chaikin(pts,it){const n=it==null?2:it;let p=pts;for(let k=0;k<n;k++){const q=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25]);q.push([a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}p=q}return p}
function star(){const p=[];for(let k=0;k<10;k++){const r=k%2?.5:1,a=-Math.PI/2+Math.PI*k/5;p.push([Math.cos(a)*r,Math.sin(a)*r])}return p}
function gear(teeth){const p=[];const N=240;for(let k=0;k<N;k++){const a=2*Math.PI*k/N,c=Math.cos(teeth*a);const r=0.76+0.24*Math.max(0,Math.min(1,(c+0.3)/0.6));p.push([Math.cos(a)*r,Math.sin(a)*r])}return p}
function flower(petals){const p=[];for(let k=0;k<160;k++){const t=2*Math.PI*k/160,r=.58+.42*Math.cos(petals*t);p.push([Math.cos(t)*r,Math.sin(t)*r])}return p}
function norm(pts){let m=0;pts.forEach(p=>{m=Math.max(m,Math.hypot(p[0],p[1]))});const s=1/(m||1);return pts.map(p=>[p[0]*s,p[1]*s])}
const shapeSets=[
norm(ngon(48)),
norm(chaikin(ngon(4,-Math.PI/4))),
norm(chaikin(ngon(3))),
norm(chaikin(ngon(4))),
norm(chaikin(ngon(5))),
norm(chaikin(ngon(6))),
norm(gear(6)),
norm(flower(8))
];
function clipShape(c,x,y,r,l){const pts=shapeSets[l];c.beginPath();pts.forEach((p,i)=>i?c.lineTo(x+p[0]*r,y+p[1]*r):c.moveTo(x+p[0]*r,y+p[1]*r));c.closePath();c.clip()}
function draw(c,x,y,l,preview=false){const r=preview?Math.min(28,radii[l]*.34):radii[l],im=imgs[l];c.save();clipShape(c,x,y,r,l);if(im&&im.complete&&im.naturalWidth){const scale=Math.min(2*r/im.naturalWidth,2*r/im.naturalHeight),ww=im.naturalWidth*scale,hh=im.naturalHeight*scale;c.drawImage(im,x-ww/2,y-hh/2,ww,hh)}else{const colors=['#e7b65f','#e59b58','#d67f55','#c66c6c','#a979c2','#668bc9','#d0a64e','#c8758d'];c.fillStyle=colors[l]||'#c98d65';c.fill()}c.restore()}function showNext(){nctx.clearRect(0,0,64,64);draw(nctx,32,32,nextLevel,true);document.getElementById('level').textContent=Math.min(8,currentLevel+1)}
function resize(){const b=cvs.getBoundingClientRect(),d=devicePixelRatio||1;W=b.width;H=Math.max(520,Math.min(760,W*1.52));cvs.width=W*d;cvs.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
function reset(){balls=[];score=0;gameOver=false;dangerTime=0;siuCooldown=0;aimX=W/2;hasAim=false;currentLevel=0;nextLevel=Math.floor(Math.random()*4);document.getElementById('score').textContent=0;document.getElementById('hint').style.display='block';showNext();resize()}
function drop(x){if(gameOver)return;const l=nextLevel,r=radii[l];balls.push({x:Math.max(r,Math.min(W-r,x)),y:r+4,vx:0,vy:0,l,r,passedLine:false,wentAbove:false,prevTop:4});currentLevel=l;document.getElementById('hint').style.display='none';nextLevel=Math.floor(Math.random()*4);showNext()}
function merge(){for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;if(d<m){if(a.l===b.l){const l=a.l+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2;score+=l*l*10;if(l>=8){balls.splice(j,1);balls.splice(i,1)}else{balls.splice(j,1);balls.splice(i,1);balls.push({x,y,vx:0,vy:-2,l,r:radii[l],passedLine:false,wentAbove:false,prevTop:y-radii[l]})}document.getElementById('score').textContent=score;if(score>best){best=score;localStorage.meroBest=best;document.getElementById('best').textContent=best}return true}const nx=dx/(d||1),ny=dy/(d||1),p=(m-d)/2;a.x-=nx*p;a.y-=ny*p;b.x+=nx*p;b.y+=ny*p;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){const e=.45,j=-(1+e)*rv/2;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny}}}return false}
function loop(t){const dt=Math.min(.9,(t-last)/16||1);last=t;siuCooldown=Math.max(0,siuCooldown-dt);if(!gameOver){for(const b of balls){const previousTop=b.prevTop;b.vy+=.26*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const nextTop=b.y-b.r;if(previousTop>=52&&nextTop<52)b.wentAbove=true;if(b.wentAbove&&previousTop<52&&nextTop>=52){if(siuCooldown<=0){playFx(siu);siuCooldown=320}b.wentAbove=false}if(nextTop>=52)b.passedLine=true;b.prevTop=nextTop;if(b.x<b.r){b.x=b.r;b.vx*=-.35}if(b.x>W-b.r){b.x=W-b.r;b.vx*=-.35}if(b.y>H-b.r){b.y=H-b.r;b.vy*=-.22;b.vx*=.8}}for(let k=0;k<6;k++)merge();const dangerCount=balls.filter(b=>b.passedLine&&b.y-b.r<52).length;const dangerNeed=Math.max(2,Math.ceil(balls.length*0.15));if(balls.length>0&&dangerCount>=dangerNeed)dangerTime+=dt;else dangerTime=0;if(dangerTime>180){gameOver=true;playFx(wowo);setTimeout(()=>alert('Game over! Score: '+score),100)}}ctx.clearRect(0,0,W,H);ctx.strokeStyle='#e5c4ab';ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(W,52);ctx.stroke();ctx.setLineDash([]);if(!gameOver&&hasAim){const rr=radii[nextLevel],dropY=rr+4;ctx.save();ctx.strokeStyle='#c78f78aa';ctx.lineWidth=1;ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(aimX,52);ctx.lineTo(aimX,H);ctx.moveTo(0,dropY);ctx.lineTo(W,dropY);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.72;draw(ctx,aimX,dropY,nextLevel);ctx.restore()}balls.forEach(b=>draw(ctx,b.x,b.y,b.l));requestAnimationFrame(loop)}
function px(e){const r=cvs.getBoundingClientRect();return(e.touches?e.touches[0].clientX:e.clientX)-r.left}
cvs.addEventListener('pointermove',e=>{aimX=Math.max(0,Math.min(W,px(e)));hasAim=true});cvs.addEventListener('pointerdown',e=>{aimX=Math.max(0,Math.min(W,px(e)));hasAim=true});cvs.addEventListener('pointerup',e=>{aimX=Math.max(0,Math.min(W,px(e)));hasAim=true;drop(aimX)});document.getElementById('restart').onclick=reset;addEventListener('resize',resize);reset();requestAnimationFrame(loop);


























