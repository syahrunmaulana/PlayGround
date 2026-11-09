// Painterly side-scrolling world: every landscape is drawn from layered gradients and hand-built silhouettes.
export function paint(ctx, state){
  const {w,h,dpr,time,camera,player,chapter,chapters,wonders,found,mode}=state;
  const ch=chapters[chapter], horizon=h*.49, ground=h*.80, s=Math.max(.72,Math.min(1.25,h/800));
  const night=chapter===2;
  const sky=ctx.createLinearGradient(0,0,0,horizon*1.65);
  sky.addColorStop(0,night?'#101b38':chapter===1?'#182b42':'#263b5b');
  sky.addColorStop(.58,ch.sky[0]);sky.addColorStop(.83,ch.sky[1]);sky.addColorStop(1,ch.sky[2]);
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  // The sky's last light, held close to the horizon.
  const glow=ctx.createRadialGradient(w*.69,horizon*.93,2,w*.69,horizon*.93,h*.67);
  glow.addColorStop(0,night?'rgba(246,192,156,.21)':'rgba(255,209,156,.34)');
  glow.addColorStop(.28,night?'rgba(180,157,216,.11)':'rgba(255,182,135,.15)');glow.addColorStop(1,'rgba(255,170,130,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,horizon*1.8);
  if(night)drawStars(ctx,w,h,time,camera.x);
  drawSun(ctx,w,h,time,night);
  drawClouds(ctx,w,h,time,camera.x,chapter);
  drawRidge(ctx,w,h,time,camera.x,chapter,0.07,chapter===2?'#393a5b':'#6d6870',.76);
  drawRidge(ctx,w,h,time,camera.x,chapter,0.13,ch.far,.86);
  drawPines(ctx,w,h,time,camera.x,chapter);
  // distant haze at the horizon
  const haze=ctx.createLinearGradient(0,horizon*.76,0,horizon*1.16);
  haze.addColorStop(0,'rgba(241,183,146,0)');haze.addColorStop(.62,chapter===2?'rgba(166,170,209,.17)':'rgba(244,194,157,.20)');haze.addColorStop(1,'rgba(244,194,157,0)');
  ctx.fillStyle=haze;ctx.fillRect(0,horizon*.72,w,horizon*.48);
  drawLand(ctx,w,h,time,camera.x,chapter,ground);
  drawPath(ctx,w,h,time,camera.x,chapter,ground);
  drawLandmarks(ctx,w,h,time,camera.x,chapter,ground);
  drawFlowers(ctx,w,h,time,camera.x,chapter,ground);
  drawWonders(ctx,w,h,time,camera.x,chapter,wonders,found,ground);
  if(player.visible!==false)drawPlayer(ctx,w,h,time,camera.x,player,ground,mode);
  drawFireflies(ctx,w,h,time,camera.x,chapter);
  // foreground grass blades lend depth and gentle motion
  drawForeground(ctx,w,h,time,camera.x,chapter,ground);
  // subtle warm bloom centered on the little lantern
  if(player.visible!==false&&mode==='playing'){
    const px=player.screenX, py=ground-55*s;
    const lantern=ctx.createRadialGradient(px,py,1,px,py,95*s);
    lantern.addColorStop(0,'rgba(255,216,143,.16)');lantern.addColorStop(.42,'rgba(255,200,125,.055)');lantern.addColorStop(1,'rgba(255,200,125,0)');
    ctx.fillStyle=lantern;ctx.fillRect(px-100*s,py-100*s,200*s,200*s);
  }
  drawEdgeShade(ctx,w,h);
}
function drawStars(c,w,h,t,cam){
  c.save();
  for(let i=0;i<115;i++){
    const x=(hash(i*9+2)*w+Math.sin(t*.015+i)*5-(cam*.012)%w+w)%w;
    const y=hash(i*19+5)*h*.55;const tw=.35+.65*(.5+.5*Math.sin(t*.0016+i*7));
    c.globalAlpha=tw*(.45+hash(i+6)*.5);c.fillStyle=i%13===0?'#ffe9c1':'#dbe1fa';
    c.beginPath();c.arc(x,y,(i%17===0?1.4:.6)+hash(i)*.8,0,Math.PI*2);c.fill();
  }
  // A pale, distant river of stars.
  c.globalAlpha=.12;
  const milky=c.createLinearGradient(w*.22,0,w*.84,h*.58);
  milky.addColorStop(0,'rgba(205,211,255,0)');milky.addColorStop(.48,'rgba(219,219,255,.55)');milky.addColorStop(1,'rgba(205,211,255,0)');
  c.fillStyle=milky;c.save();c.translate(w*.5,h*.25);c.rotate(-.43);c.fillRect(-w*.5,-25,w,50);c.restore();
  c.restore();
}
function drawSun(c,w,h,t,night){
  const x=w*.70,y=h*.265+(night?0:Math.sin(t*.00008)*4),r=Math.min(w,h)*(night?.043:.052);
  const halo=c.createRadialGradient(x,y,r*.2,x,y,r*3.4);
  halo.addColorStop(0,night?'rgba(240,226,206,.23)':'rgba(255,215,164,.28)');halo.addColorStop(1,'rgba(255,215,164,0)');
  c.fillStyle=halo;c.beginPath();c.arc(x,y,r*3.4,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);
  c.fillStyle=night?'#e4dcca':'#f6d5aa';c.globalAlpha=.83;c.fill();c.globalAlpha=1;
  if(night){c.beginPath();c.arc(x+r*.34,y-r*.05,r*.87,0,Math.PI*2);c.fillStyle='#192342';c.fill()}
}
function drawClouds(c,w,h,t,cam,chapter){
  for(let i=0;i<7;i++){
    const speed=(i%2?.003:.006),x=((i*267+cam*speed+t*speed*9)%(w+360))-180;
    const y=h*(.12+hash(i+4)*.26),width=(100+hash(i+9)*170)*(h/800);
    c.globalAlpha=.10+hash(i+5)*.11;c.fillStyle=chapter===2?'#d9d4ed':'#f4d8c0';
    c.beginPath();c.ellipse(x,y,width*.5,11*(h/800),0,0,Math.PI*2);c.ellipse(x-width*.12,y-5,width*.27,12*(h/800),0,0,Math.PI*2);c.ellipse(x+width*.16,y-2,width*.31,9*(h/800),0,0,Math.PI*2);c.fill();
  }
  c.globalAlpha=1;
}
function drawRidge(c,w,h,t,cam,chapter,depth,color,base){
  const y=h*base, step=w/5;
  c.beginPath();c.moveTo(0,h);
  for(let i=-1;i<7;i++){
    const x=i*step-(cam*depth%step), peak=y-h*(.06+hash(i+chapter*31+depth*10)*.13);
    c.lineTo(x,peak);c.lineTo(x+step*.5,y+h*.02);c.lineTo(x+step,y-h*(.04+hash(i+2+chapter*31)*.08));
  }
  c.lineTo(w,h);c.closePath();c.fillStyle=color;c.fill();
  // atmospheric lower slope
  c.globalAlpha=.14;c.fillStyle='#f2be9e';c.fillRect(0,y-h*.018,w,h*.06);c.globalAlpha=1;
}
function drawPines(c,w,h,t,cam,chapter){
  const spacing=88*(h/800), offset=(cam*.18)%spacing, base=h*.79;
  for(let i=-1;i<w/spacing+2;i++){
    const worldIndex=Math.floor(cam*.18/spacing)+i;
    if(hash(worldIndex+100)<.32)continue;
    const x=i*spacing-offset, ht=(52+hash(worldIndex+151)*90)*(h/800), width=ht*.43;
    c.globalAlpha=.42+hash(worldIndex+13)*.28;c.fillStyle=chapter===2?'#292d4c':chapter===1?'#233a35':'#39443e';
    c.beginPath();c.moveTo(x,base-ht);c.lineTo(x-width,base-ht*.42);c.lineTo(x-width*.48,base-ht*.42);c.lineTo(x-width*1.2,base-ht*.05);c.lineTo(x+width*1.2,base-ht*.05);c.lineTo(x+width*.48,base-ht*.42);c.lineTo(x+width,base-ht*.42);c.closePath();c.fill();
  }
  c.globalAlpha=1;
}
function drawLand(c,w,h,t,cam,chapter,ground){
  const gr=c.createLinearGradient(0,ground-20,0,h);
  gr.addColorStop(0,chapter===2?'#45435b':chapter===1?'#384539':'#62513f');
  gr.addColorStop(.18,chapter===2?'#39394e':chapter===1?'#303a32':'#514535');
  gr.addColorStop(1,chapter===2?'#282b40':chapter===1?'#222d29':'#36332d');
  c.fillStyle=gr;c.beginPath();c.moveTo(0,ground);
  for(let x=0;x<=w+10;x+=12)c.lineTo(x,ground+Math.sin((x+cam*.23)*.008)*7+Math.sin((x+cam*.12)*.022)*2);
  c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fill();
  // distant bands in the earth
  for(let i=0;i<5;i++){
    c.globalAlpha=.025;c.fillStyle=i%2?'#efc998':'#11151b';
    c.fillRect(0,ground+40+i*48+Math.sin(t*.0003+i)*3,w,2);
  }
  c.globalAlpha=1;
}
function drawPath(c,w,h,t,cam,chapter,ground){
  const y=ground+24;
  c.save();c.globalAlpha=.26;c.fillStyle=chapter===2?'#b8a0a4':'#c49b71';
  c.beginPath();c.moveTo(w*.44,y-4);
  c.bezierCurveTo(w*.38,y+36,w*.54,h+30,w*.51,h+45);
  c.lineTo(w*.78,h+45);c.bezierCurveTo(w*.62,y+44,w*.67,y+15,w*.58,y-4);c.closePath();c.fill();
  c.globalAlpha=.09;c.fillStyle='#f8d5a5';c.beginPath();c.ellipse(w*.53,y+95,w*.12,5,0,0,Math.PI*2);c.fill();c.restore();
}
function screen(world,cam,s){return (world-cam)*s}
function drawLandmarks(c,w,h,t,cam,chapter,ground){
  const s=Math.max(.72,Math.min(1.25,h/800));
  const trees=chapter===0?[430,1030,1620,1940,2100]:chapter===1?[2740,2880,3490,3720,4000,4440,4580]:[5500,5750,6400,6880];
  for(const world of trees){
    const x=screen(world,cam,s);if(x<-140*s||x>w+140*s)continue;
    const i=Math.round(world/10),ht=(118+hash(i)*95)*s,wide=ht*.43,base=ground+13*s;
    if(chapter===1){
      // broad, ancient canopy, with warm lit edges
      c.fillStyle='#272e2a';c.fillRect(x-4*s,base-ht*.57,8*s,ht*.58);
      c.fillStyle=hash(i+3)>.5?'#293831':'#303a32';
      for(let j=0;j<4;j++){
        const yy=base-ht*(.44+j*.14),rx=wide*(1-j*.12);
        c.beginPath();c.ellipse(x+Math.sin(j*4+i)*4*s,yy,rx,ht*.25,0,0,Math.PI*2);c.fill();
      }
      c.globalAlpha=.25;c.strokeStyle='#c89175';c.lineWidth=1.2*s;c.beginPath();c.moveTo(x,base-ht*.64);c.lineTo(x,base);c.stroke();c.globalAlpha=1;
    }else if(chapter===2){
      c.fillStyle='#3d3b53';c.fillRect(x-5*s,base-ht*.62,10*s,ht*.64);
      c.fillStyle='#43405b';c.beginPath();c.ellipse(x,base-ht*.72,wide,ht*.30,0,0,Math.PI*2);c.fill();
      c.globalAlpha=.35;c.fillStyle='#8c82ac';c.beginPath();c.ellipse(x-wide*.2,base-ht*.81,wide*.42,ht*.1,-.15,0,Math.PI*2);c.fill();c.globalAlpha=1;
    }else{
      c.fillStyle='#3e4038';c.fillRect(x-4*s,base-ht*.62,8*s,ht*.64);
      c.fillStyle=hash(i+3)>.5?'#45493c':'#4c4a3b';
      for(let j=0;j<3;j++){c.beginPath();c.ellipse(x,base-ht*(.52+j*.18),wide*(1-j*.19),ht*.24,0,0,Math.PI*2);c.fill()}
      c.globalAlpha=.13;c.fillStyle='#f0bd83';c.beginPath();c.ellipse(x-wide*.2,base-ht*.68,wide*.4,ht*.11,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    }
  }
  // Repeating fence makes the first field feel wide enough to get lost in.
  if(chapter===0){
    const start=80,end=2500,spacing=105*s,offset=(cam*s)%spacing;
    c.strokeStyle='rgba(185,157,120,.38)';c.lineWidth=2*s;
    for(let i=-1;i<w/spacing+2;i++){
      const x=i*spacing-offset+((start-cam)*s%spacing);if(x<-10||x>w+10)continue;
      const y=ground-5*s;c.beginPath();c.moveTo(x,y-38*s);c.lineTo(x,y+5*s);c.stroke();
    }
    c.beginPath();c.moveTo(0,ground-27*s);c.lineTo(w,ground-27*s);c.moveTo(0,ground-11*s);c.lineTo(w,ground-11*s);c.stroke();
    // Windmill on the far hill
    const wx=screen(1830,cam,s),wy=ground-170*s;
    if(wx>-100&&wx<w+100){c.fillStyle='#46423b';c.fillRect(wx-3*s,wy,6*s,72*s);c.strokeStyle='rgba(42,38,34,.76)';c.lineWidth=2*s;
      for(let j=0;j<4;j++){const a=t*.00009+j*Math.PI/2;c.beginPath();c.moveTo(wx,wy+8*s);c.lineTo(wx+Math.cos(a)*43*s,wy+8*s+Math.sin(a)*43*s);c.stroke()}}
  }
  // A low, crooked well at the chapter's quiet middle.
  if(chapter===0){const x=screen(1280,cam,s);if(x>-100&&x<w+100){
    c.fillStyle='#423b34';c.beginPath();c.ellipse(x,ground+3*s,31*s,11*s,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#786653';c.lineWidth=4*s;c.beginPath();c.ellipse(x,ground-2*s,29*s,10*s,0,0,Math.PI*2);c.stroke();
    c.fillStyle='#151b24';c.beginPath();c.ellipse(x,ground-3*s,19*s,6*s,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#584738';c.lineWidth=3*s;c.beginPath();c.moveTo(x-25*s,ground-26*s);c.lineTo(x-20*s,ground-76*s);c.lineTo(x+21*s,ground-76*s);c.lineTo(x+25*s,ground-26*s);c.stroke();
    c.strokeStyle='#4b4037';c.lineWidth=2*s;c.beginPath();c.moveTo(x,ground-76*s);c.lineTo(x,ground-20*s);c.stroke();
  }}
  // Trees around the listening woods carry soft, impossible lantern-fruit.
  if(chapter===1){for(let i=0;i<5;i++){const world=2670+i*260,x=screen(world,cam,s);if(x<0||x>w)continue;
    const y=ground-(90+hash(i+50)*80)*s;const r=(2.5+hash(i+20)*2)*s;
    const glow=c.createRadialGradient(x,y,0,x,y,23*s);glow.addColorStop(0,'rgba(250,204,147,.40)');glow.addColorStop(1,'rgba(250,204,147,0)');c.fillStyle=glow;c.beginPath();c.arc(x,y,23*s,0,Math.PI*2);c.fill();
    c.fillStyle='#f5cb91';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }}
  // The whale's soft silhouette rides the clouds, large enough to notice, slow enough to trust.
  if(chapter>=1){
    const wx=screen(chapter===1?4760:5350,cam,s),wy=h*.26+Math.sin(t*.0006)*6*s;
    if(wx>-w*.65&&wx<w*1.65)drawWhale(c,wx,wy,s,t,chapter);
  }
}
function drawWhale(c,x,y,s,t,chapter){
  const size=chapter===1?.7:1.16, ww=240*s*size,hh=82*s*size;
  c.save();c.globalAlpha=chapter===1?.25:.52;
  const g=c.createLinearGradient(x-ww/2,y-hh/2,x+ww/2,y+hh/2);
  g.addColorStop(0,'#414765');g.addColorStop(.52,'#666486');g.addColorStop(1,'#968399');
  c.fillStyle=g;c.beginPath();c.moveTo(x-ww*.48,y);c.bezierCurveTo(x-ww*.35,y-hh*.48,x+ww*.28,y-hh*.52,x+ww*.45,y-hh*.03);
  c.bezierCurveTo(x+ww*.36,y+hh*.44,x-ww*.2,y+hh*.42,x-ww*.48,y);c.fill();
  c.beginPath();c.moveTo(x+ww*.38,y);c.lineTo(x+ww*.56,y-hh*.33);c.lineTo(x+ww*.52,y+hh*.12);c.lineTo(x+ww*.67,y+hh*.30);c.lineTo(x+ww*.40,y+hh*.24);c.fill();
  c.globalAlpha*=.4;c.fillStyle='#e6c1b1';c.beginPath();c.ellipse(x-ww*.05,y+hh*.22,ww*.31,hh*.10,0,0,Math.PI*2);c.fill();
  c.globalAlpha=chapter===1?.36:.75;c.fillStyle='#f2d6ae';c.beginPath();c.arc(x+ww*.29,y-hh*.08,2*s,0,Math.PI*2);c.fill();
  c.restore();
}
function drawFlowers(c,w,h,t,cam,chapter,ground){
  const s=Math.max(.72,Math.min(1.25,h/800));
  const spacing=31*s,offset=(cam*.72)%spacing;
  for(let i=-1;i<w/spacing+2;i++){
    const world=Math.floor(cam*.72/spacing)+i, x=i*spacing-offset;
    if(hash(world+chapter*97)>.68)continue;
    const y=ground+Math.sin((x+cam*.23)*.008)*7-3*s, stem=(5+hash(world+4)*12)*s;
    c.strokeStyle=chapter===2?'rgba(181,170,208,.42)':'rgba(174,177,119,.44)';c.lineWidth=1*s;
    c.beginPath();c.moveTo(x,y);c.lineTo(x-1*s,y-stem);c.stroke();
    if(hash(world+3)>.46){c.fillStyle=chapter===2?'rgba(220,190,224,.78)':'rgba(229,192,137,.78)';c.beginPath();c.arc(x-1*s,y-stem,1.8*s,0,Math.PI*2);c.fill()}
  }
}
function drawWonders(c,w,h,t,cam,chapter,wonders,found,ground){
  const s=Math.max(.72,Math.min(1.25,h/800));
  for(let i=0;i<wonders.length;i++){
    const item=wonders[i];if(found.has(i)||Math.floor(item.x/2500)!==chapter)continue;
    const x=screen(item.x,cam,s);if(x<-60||x>w+60)continue;
    const y=ground-item.y*h*.42, bob=Math.sin(t*.002+i*2)*4*s, r=(9+Math.sin(t*.0025+i)*2)*s;
    const glow=c.createRadialGradient(x,y+bob,1,x,y+bob,40*s);glow.addColorStop(0,'rgba(250,220,157,.26)');glow.addColorStop(1,'rgba(250,220,157,0)');
    c.fillStyle=glow;c.beginPath();c.arc(x,y+bob,40*s,0,Math.PI*2);c.fill();
    c.save();c.translate(x,y+bob);c.rotate(Math.sin(t*.001+i)*.12);c.fillStyle='#f3d9a3';c.globalAlpha=.88;
    c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r*.28,-r*.2,r,0);c.quadraticCurveTo(r*.18,r*.16,0,r);c.quadraticCurveTo(-r*.22,r*.12,-r,0);c.quadraticCurveTo(-r*.2,-r*.2,0,-r);c.fill();c.restore();
  }
}
function drawPlayer(c,w,h,t,cam,p,ground,mode){
  const s=Math.max(.72,Math.min(1.25,h/800)),x=p.screenX??w*.38,base=ground+2*s;
  const moving=mode==='playing'&&Math.abs(p.speed||0)>.1,bob=moving?Math.abs(Math.sin(p.walk||0))*3*s:Math.sin(t*.002)*1.5*s;
  c.save();c.translate(x,base-bob);c.scale(p.facing||1,1);
  c.globalAlpha=.25;c.fillStyle='#10131b';c.beginPath();c.ellipse(0,0,13*s,3*s,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
  c.fillStyle='#343849';c.beginPath();c.moveTo(-7*s,-29*s);c.quadraticCurveTo(-12*s,-17*s,-10*s,-5*s);c.lineTo(9*s,-5*s);c.quadraticCurveTo(12*s,-18*s,6*s,-29*s);c.closePath();c.fill();
  c.strokeStyle='#242632';c.lineWidth=3*s;c.beginPath();c.moveTo(-5*s,-7*s);c.lineTo(-7*s,0);c.moveTo(5*s,-7*s);c.lineTo(7*s,0);c.stroke();
  c.fillStyle='#b98562';c.beginPath();c.arc(0,-37*s,7*s,0,Math.PI*2);c.fill();
  c.fillStyle='#51453f';c.beginPath();c.arc(-1*s,-40*s,7*s,Math.PI,Math.PI*2);c.lineTo(6*s,-37*s);c.quadraticCurveTo(0,-40*s,-7*s,-35*s);c.fill();
  c.strokeStyle='#d5b77d';c.lineWidth=1.5*s;c.beginPath();c.moveTo(8*s,-22*s);c.lineTo(12*s,-16*s);c.stroke();
  c.fillStyle='#f4d18c';c.globalAlpha=.9;c.fillRect(10*s,-17*s,4*s,6*s);c.globalAlpha=1;
  const lamp=c.createRadialGradient(12*s,-14*s,0,12*s,-14*s,18*s);lamp.addColorStop(0,'rgba(255,222,151,.24)');lamp.addColorStop(1,'rgba(255,222,151,0)');c.fillStyle=lamp;c.beginPath();c.arc(12*s,-14*s,18*s,0,Math.PI*2);c.fill();
  c.restore();
}
function drawFireflies(c,w,h,t,cam,chapter){
  if(chapter===0)return;
  for(let i=0;i<20;i++){
    const x=(hash(i+12)*w+Math.sin(t*.00035+i)*22-(cam*.1)%w+w)%w;
    const y=h*(.34+hash(i+29)*.42)+Math.sin(t*.001+i*3)*11;
    const a=.24+.36*(.5+.5*Math.sin(t*.002+i*5));c.globalAlpha=a;c.fillStyle='#f2d69f';c.beginPath();c.arc(x,y,1.2+(i%3)*.35,0,Math.PI*2);c.fill();
  }c.globalAlpha=1;
}
function drawForeground(c,w,h,t,cam,chapter,ground){
  const s=Math.max(.72,Math.min(1.25,h/800)),spacing=18*s,offset=(cam*.94)%spacing;
  c.globalAlpha=.38;c.strokeStyle=chapter===2?'#38364c':'#28342d';c.lineWidth=1.2*s;
  for(let i=-2;i<w/spacing+3;i++){
    const x=i*spacing-offset,wind=Math.sin(t*.001+x*.07)*3*s;
    c.beginPath();c.moveTo(x,ground+12*s);c.quadraticCurveTo(x+wind,ground+4*s,x+wind-2*s,ground-8*s-hash((i+cam)|0)*12*s);c.stroke();
  }c.globalAlpha=1;
}
function drawEdgeShade(c,w,h){
  const g=c.createRadialGradient(w*.5,h*.45,h*.22,w*.5,h*.45,h*.82);g.addColorStop(.55,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(2,3,9,.34)');c.fillStyle=g;c.fillRect(0,0,w,h);
}
function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
