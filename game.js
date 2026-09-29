const names=['level1.jpg','level2.jpg','level3.jpg','level4.jpg','level5.jpg','level6.jpg','level7.jpg','level8.jpg','level9.jpg'];
const imgs=[];
names.forEach((n,i)=>{const im=new Image();im.onerror=()=>{};im.src='assets/'+n+'?v=4';imgs[i]=im});
const cvs=document.getElementById('game'),ctx=cvs.getContext('2d'),nextC=document.getElementById('next'),nctx=nextC.getContext('2d');
let W=0,H=0,balls=[],score=0,best=+localStorage.meroBest||0,nextLevel=0,currentLevel=0,gameOver=false,last=0,dangerTime=0,aimX=0,hasAim=false;
const radii=[22,30,40,52,66,82,100,120,142];
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
const shapeSets=[
[[0,-1],[-.7,-.8],[-1,-.1],[-.65,.8],[0,1],[.75,.7],[1,0],[.65,-.8]],
[[0,-1],[-.8,-.45],[-.75,.55],[0,1],[.85,.45],[.7,-.5]],
[[0,-1],[-.95,-.25],[-.55,.8],[.35,1],[1,.05],[.5,-.8]],
[[0,-1],[-.45,-.85],[-1,.15],[-.35,1],[.55,.72],[1,-.2]],
[[0,-1],[-.9,-.55],[-.7,.25],[-.15,1],[.75,.75],[1,-.3]],
[[0,-1],[-.75,-.6],[-1,.2],[-.3,.85],[.35,1],[1,.35],[.72,-.55]],
[[0,-1],[-.6,-.9],[-1,0],[-.5,.75],[.2,1],[.95,.4],[.8,-.55]],
[[0,-1],[-.95,-.35],[-.65,.7],[.1,1],[.85,.6],[1,-.25],[.45,-.9]],
[[0,-1],[-.8,-.7],[-1,.25],[-.4,1],[.45,.82],[1,.15],[.7,-.75]]
];
function clipShape(c,x,y,r,l){const pts=shapeSets[l];c.beginPath();pts.forEach((p,i)=>i?c.lineTo(x+p[0]*r,y+p[1]*r):c.moveTo(x+p[0]*r,y+p[1]*r));c.closePath();c.clip()}
function draw(c,x,y,l,preview=false){const r=preview?Math.min(28,radii[l]*.34):radii[l],im=imgs[l];c.save();clipShape(c,x,y,r,l);if(im&&im.complete&&im.naturalWidth){const scale=Math.min(2*r/im.naturalWidth,2*r/im.naturalHeight),ww=im.naturalWidth*scale,hh=im.naturalHeight*scale;c.drawImage(im,x-ww/2,y-hh/2,ww,hh)}else{const colors=['#e7b65f','#e59b58','#d67f55','#c66c6c','#a979c2','#668bc9','#55a99d','#d0a64e','#c8758d'];c.fillStyle=colors[l]||'#c98d65';c.fillRect(x-r,y-r,2*r,2*r);c.fillStyle='#fff8';c.font=Math.max(12,r*.35)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(l+1),x,y)}c.restore();c.save();c.strokeStyle='#c99478aa';c.lineWidth=2;c.setLineDash([4,4]);clipShape(c,x,y,r,l);c.stroke();c.restore()}function showNext(){nctx.clearRect(0,0,64,64);draw(nctx,32,32,nextLevel,true);document.getElementById('level').textContent=Math.min(9,currentLevel+1)}
function resize(){const b=cvs.getBoundingClientRect(),d=devicePixelRatio||1;W=b.width;H=Math.max(520,Math.min(760,W*1.52));cvs.width=W*d;cvs.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
function reset(){balls=[];score=0;gameOver=false;dangerTime=0;aimX=W/2;hasAim=false;currentLevel=0;nextLevel=Math.floor(Math.random()*4);document.getElementById('score').textContent=0;document.getElementById('hint').style.display='block';showNext();resize()}
function drop(x){if(gameOver)return;const l=nextLevel,r=radii[l];balls.push({x:Math.max(r,Math.min(W-r,x)),y:r+4,vx:0,vy:0,l,r});currentLevel=l;document.getElementById('hint').style.display='none';nextLevel=Math.floor(Math.random()*4);showNext()}
function merge(){for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;if(d<m){if(a.l===b.l){const l=a.l+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2;score+=l*l*10;if(l>=9){balls.splice(j,1);balls.splice(i,1)}else{balls.splice(j,1);balls.splice(i,1);balls.push({x,y,vx:0,vy:-2,l,r:radii[l]})}document.getElementById('score').textContent=score;if(score>best){best=score;localStorage.meroBest=best;document.getElementById('best').textContent=best}return true}const nx=dx/(d||1),ny=dy/(d||1),p=(m-d)/2;a.x-=nx*p;a.y-=ny*p;b.x+=nx*p;b.y+=ny*p}}return false}
function loop(t){const dt=Math.min(1.35,(t-last)/16||1);last=t;if(!gameOver){for(const b of balls){b.vy+=.32*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<b.r){b.x=b.r;b.vx*=-.35}if(b.x>W-b.r){b.x=W-b.r;b.vx*=-.35}if(b.y>H-b.r){b.y=H-b.r;b.vy*=-.22;b.vx*=.8}}for(let k=0;k<6;k++)merge();if(balls.some(b=>b.y-b.r<52&&Math.abs(b.vy)<.22))dangerTime+=dt;else dangerTime=0;if(dangerTime>180){gameOver=true;setTimeout(()=>alert('Game over! Score: '+score),100)}}ctx.clearRect(0,0,W,H);ctx.strokeStyle='#e5c4ab';ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(0,52);ctx.lineTo(W,52);ctx.stroke();ctx.setLineDash([]);if(!gameOver&&hasAim){const rr=radii[nextLevel],dropY=rr+4;ctx.save();ctx.strokeStyle='#c78f78aa';ctx.lineWidth=1;ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(aimX,52);ctx.lineTo(aimX,H);ctx.moveTo(0,dropY);ctx.lineTo(W,dropY);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.72;draw(ctx,aimX,dropY,nextLevel);ctx.restore()}balls.forEach(b=>draw(ctx,b.x,b.y,b.l));requestAnimationFrame(loop)}
function px(e){const r=cvs.getBoundingClientRect();return(e.touches?e.touches[0].clientX:e.clientX)-r.left}
cvs.addEventListener('pointermove',e=>{aimX=Math.max(0,Math.min(W,px(e)));hasAim=true});cvs.addEventListener('pointerdown',e=>{aimX=Math.max(0,Math.min(W,px(e)));hasAim=true});cvs.addEventListener('pointerup',e=>{aimX=Math.max(0,Math.min(W,px(e)));hasAim=true;drop(aimX)});document.getElementById('restart').onclick=reset;addEventListener('resize',resize);reset();requestAnimationFrame(loop);
function clipShape(c,x,y,r,l){c.beginPath();if(l===0){c.arc(x,y,r,0,Math.PI*2)}else if(l===1){c.moveTo(x,y-r);c.lineTo(x-r,y+r);c.lineTo(x+r,y+r)}else if(l===2){c.rect(x-r,y-r,2*r,2*r)}else if(l===3){c.ellipse(x,y,r,r*.62,0,0,Math.PI*2)}else if(l===4){for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5;if(i===0)c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}}else if(l===5){for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;if(i===0)c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}}else if(l===6){c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y)}else if(l===7){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:r*.48;if(i===0)c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}}else{c.moveTo(x-r*.2,y-r);c.lineTo(x+r*.8,y-r*.35);c.lineTo(x+r*.55,y+r);c.lineTo(x-r*.7,y+r*.65);c.lineTo(x-r,y-r*.35)}c.closePath();c.clip()}







function clipShape(c,x,y,r,l){const pts=shapeSets[l];c.beginPath();pts.forEach((p,i)=>i?c.lineTo(x+p[0]*r,y+p[1]*r):c.moveTo(x+p[0]*r,y+p[1]*r));c.closePath();c.clip()}

