

const completedZones = new Set();
const keys = new Set();
const input = { axis:0, pointer:null, originX:0, lastX:0 };
let activeBeat = null;
let chapterCardTimer = 0;
let locationTimer = 0;
let toastTimer = 0;
let lastSaveAt = 0;

function setVisible(el,on,cls='is-on'){el.classList.toggle(cls,!!on)}
function setMode(mode){game.mode=mode;}
function showChapterCard(chapter){
  game.chapter=chapter;
  const ch=CHAPTERS[chapter];
  ui.ccKicker.textContent=chapter===0?'a story in three parts':'the story continues';
  ui.ccNum.textContent=ch.roman;ui.ccTitle.textContent=ch.name;ui.ccSub.textContent=ch.sub;
  ui.chapterCard.classList.add('is-open');setMode('chapter');chapterCardTimer=2.7;
  game.currentZone=null;ui.interact.classList.remove('is-on');
  ui.chapterNum.textContent=ch.roman;ui.chapterName.textContent=ch.name;
  setTimeout(()=>{if(game.mode==='chapter'){ui.chapterCard.classList.remove('is-open');setMode('playing')}},2700);
}
function startGame(saved=null){
  ui.title.classList.add('is-hidden');ui.end.classList.remove('is-open');ui.pause.classList.remove('is-open');
  ui.hud.classList.remove('is-hidden');ui.walkHint.classList.add('is-on');
  game.startedAt=performance.now();game.elapsed=0;game.time=0;game.found=new Set();game.wonders=0;
  completedZones.clear();game.choiceMemory='';game.storyStep=0;game.ending=false;
  player.x=110;player.speed=0;player.facing=1;camera.x=0;
  if(saved&&Number.isFinite(saved.x)){
    player.x=clamp(saved.x,110,WORLD_END);game.found=new Set((saved.wonders||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<wonders.length));
    (saved.completed||[]).forEach(i=>completedZones.add(i));game.choiceMemory=saved.choice||'';game.storyStep=saved.stage||0;
  }
  game.wonders=game.found.size;ui.wonderCount.textContent=game.wonders;
  const ch=chapterOf(player.x);game.chapter=ch;
  showChapterCard(ch);
  sound('soft');save();
}
function save(){
  try{localStorage.setItem(game.saveKey,JSON.stringify({x:player.x,wonders:[...game.found],completed:[...completedZones],chapter:game.chapter,stage:game.storyStep,choice:game.choiceMemory}))}catch{}
}
function refreshContinue(){const data=loadSave();ui.continue.classList.toggle('is-hidden',!data||!Number.isFinite(data.x)||data.x<180)}
function setObjective(text,on=true){ui.objectiveText.textContent=text;ui.objective.classList.toggle('is-on',on)}
function openDialogue(kind){
  const zone=zones.find(z=>z.kind===kind);if(!zone)return;
  activeBeat={kind,lines:linesFor(kind),index:0};game.currentZone=null;game.activeZone=kind;
  setMode('dialogue');ui.interact.classList.remove('is-on');ui.dialogue.classList.add('is-open');
  ui.choices.innerHTML='';showLine();sound('soft');
}
function showLine(){
  if(!activeBeat)return;
  const entry=activeBeat.lines[activeBeat.index];
  if(!entry){finishDialogue();return}
  ui.speaker.textContent=entry[0];ui.speaker.classList.toggle('is-on',!!entry[0]);ui.speaker.classList.toggle('narrator',!entry[0]);
  ui.line.textContent=entry[1];ui.advance.classList.add('is-on');ui.choices.innerHTML='';
  if(activeBeat.kind==='star'&&activeBeat.index===activeBeat.lines.length-1){
    ui.advance.classList.remove('is-on');
    makeChoice('I’ll help you find your way home.','company');
    makeChoice('Let’s look at everything along the way.','wonder');
  }
}
function makeChoice(label,value){
  const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=label;
  b.addEventListener('click',e=>{e.stopPropagation();game.choiceMemory=value;activeBeat.index++;sound('chime');showLine()});ui.choices.appendChild(b);
}
function advanceDialogue(){
  if(game.mode!=='dialogue'||!activeBeat)return;
  if(activeBeat.kind==='star'&&activeBeat.index===activeBeat.lines.length-1)return;
  activeBeat.index++;sound('soft');showLine();
}
function finishDialogue(){
  const kind=activeBeat?.kind;activeBeat=null;ui.dialogue.classList.remove('is-open');ui.speaker.classList.remove('is-on');
  setMode('playing');
  if(kind){const idx=zones.findIndex(z=>z.kind===kind);if(idx>=0)completedZones.add(idx)}
  game.storyStep++;game.activeZone=null;
  if(kind==='opening')setObjective('Follow the lantern-light beyond the last fence.');
  if(kind==='gate')setObjective('Find a way through the Listening Woods.');
  if(kind==='whale')setObjective('Climb into the sky and find the fallen star.');
  if(kind==='star')setObjective('Walk with the star to the edge of the sky.');
  if(kind==='ending'){finishGame();return}
  save();
}
function finishGame(){
  game.ending=true;setMode('ending');ui.endCopy.textContent=game.choiceMemory==='company'
    ?'Mara came home with a star, a moth, and the feeling that no one had to find their way alone.'
    :game.choiceMemory==='wonder'
      ?'Mara came home with a star and nine small wonders tucked into her pockets. For a long time, she noticed everything.'
      :'Mara came home with a star. She kept her wish for later, because some wishes grow better when you carry them awhile.';
  ui.endWonders.textContent=game.wonders;ui.endTime.textContent=Math.max(1,Math.round(game.elapsed/60));
  ui.end.classList.add('is-open');ui.interact.classList.remove('is-on');setObjective('',false);save();
  try{localStorage.removeItem(game.saveKey)}catch{}
}
function setPause(on){
  if(!['playing','dialogue','chapter'].includes(game.mode)&&!on)return;
  if(on){game.mode='paused';ui.pause.classList.add('is-open')}
  else{ui.pause.classList.remove('is-open');game.mode=activeBeat?'dialogue':ui.chapterCard.classList.contains('is-open')?'chapter':'playing'}
  input.axis=0;keys.clear();
}
function interact(){
  if(game.mode!=='playing')return;
  if(game.currentZone){openDialogue(game.currentZone.kind);return}
  const nearest=nearestWonder();if(nearest>=0){collectWonder(nearest);return}
}
function nearestWonder(){
  let best=-1,dist=Infinity;
  wonders.forEach((v,i)=>{if(game.found.has(i))return;const d=Math.abs(v.x-player.x);if(d<dist&&d<80){dist=d;best=i}});
  return best;
}
function collectWonder(i){
  const item=wonders[i];game.found.add(i);game.wonders=game.found.size;ui.wonderCount.textContent=game.wonders;
  ui.wonderHud.classList.remove('pulse');void ui.wonderHud.offsetWidth;ui.wonderHud.classList.add('pulse');
  showToast(`<b>${item.name}</b> · ${item.desc}`);sound('chime');save();
}
function showToast(text){ui.toast.innerHTML=text;ui.toast.classList.add('is-on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('is-on'),2600)}
function updateProximity(){
  const near=zones.map((z,i)=>({z,i,d:Math.abs(z.x-player.x)})).filter(a=>a.d<78&&!completedZones.has(a.i)&&a.z.chapter===chapterOf(player.x)).sort((a,b)=>a.d-b.d)[0];
  game.currentZone=near?.z||null;
  const wonder=nearestWonder();
  if(game.mode==='playing'&&game.currentZone){ui.interactLabel.textContent=game.currentZone.label;ui.interact.classList.add('is-on')}
  else if(game.mode==='playing'&&wonder>=0){ui.interactLabel.textContent='Gather';ui.interact.classList.add('is-on')}
  else ui.interact.classList.remove('is-on');
}
function update(dt){
  game.time+=dt*1000;
  if(game.mode==='playing'){
    game.elapsed+=dt;
    const keyboard=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0);
    const axis=input.axis||keyboard;
    const target=axis*245;player.speed=lerp(player.speed,target,Math.min(1,dt*7));
    player.x=clamp(player.x+player.speed*dt,100,WORLD_END);
    if(Math.abs(player.speed)>.5){player.facing=Math.sign(player.speed);player.walk+=dt*10;ui.walkHint.classList.remove('is-on')}
    camera.x=clamp(player.x-W/2.75,0,WORLD_END-W/scale);
    const ch=chapterOf(player.x);
    if(ch!==game.chapter)showChapterCard(ch);
    updateProximity();
    if(game.currentZone?.kind==='ending'&&player.x>WORLD_END-180)setObjective('Speak with the whale one last time.');
    if(Math.abs(player.x-player.lastX)>2){player.lastX=player.x}
    if(game.time-lastSaveAt>4000){save();lastSaveAt=game.time}
  } else player.speed=lerp(player.speed,0,.2);
}
function render(){
  const ch=chapterOf(player.x);const screenX=(player.x-camera.x)*scale;
  paint(ctx,{w:W,h:H,dpr:DPR,time:game.time,camera,player:{...player,screenX,visible:game.mode!=='title'},chapter:ch,chapters:CHAPTERS,wonders,found:game.found,mode:game.mode});
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-(game.lastTime||now))/1000));game.lastTime=now;
  if(game.mode!=='title'&&game.mode!=='paused'&&game.mode!=='ending')update(dt);
  render();requestAnimationFrame(frame);
}
function pointerDown(e){
  if(game.mode!=='playing'||e.target.closest('button'))return;
  input.pointer=e.pointerId;input.originX=e.clientX;input.lastX=e.clientX;input.axis=0;
  ui.stickZone.classList.add('is-touching');ui.stickBase.style.left=e.clientX+'px';ui.stickBase.style.top=e.clientY+'px';
  try{canvas.setPointerCapture(e.pointerId)}catch{}
}
function pointerMove(e){
  if(input.pointer!==e.pointerId)return;
  const delta=e.clientX-input.originX;input.axis=clamp(delta/48,-1,1);
  ui.stickNub.style.transform=`translate(calc(-50% + ${clamp(delta,-36,36)}px), -50%)`;
}
function pointerUp(e){if(input.pointer!==e.pointerId)return;input.pointer=null;input.axis=0;ui.stickZone.classList.remove('is-touching');ui.stickNub.style.transform='translate(-50%, -50%)'}

ui.begin.addEventListener('click',()=>startGame());
ui.continue.addEventListener('click',()=>startGame(loadSave()));
ui.interact.addEventListener('click',interact);
ui.advance.addEventListener('click',advanceDialogue);
ui.dialogue.addEventListener('click',e=>{if(!e.target.closest('button'))advanceDialogue()});
ui.pauseBtn.addEventListener('click',()=>setPause(true));
ui.resume.addEventListener('click',()=>setPause(false));
ui.sound.addEventListener('click',()=>{game.muted=!game.muted;ui.sound.textContent=`Sound: ${game.muted?'off':'on'}`;if(!game.muted)sound('chime')});
ui.restart.addEventListener('click',()=>{ui.pause.classList.remove('is-open');startGame({...loadSave(),x:Math.floor(player.x/WORLD_CHAPTER)*WORLD_CHAPTER+80})});
ui.quit.addEventListener('click',()=>{save();setMode('title');ui.pause.classList.remove('is-open');ui.hud.classList.add('is-hidden');ui.title.classList.remove('is-hidden');refreshContinue()});
ui.again.addEventListener('click',()=>startGame());ui.endTitle.addEventListener('click',()=>{ui.end.classList.remove('is-open');setMode('title');ui.hud.classList.add('is-hidden');ui.title.classList.remove('is-hidden');refreshContinue()});
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();if(['arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(k==='escape'||k==='p'){if(game.mode==='paused')setPause(false);else if(['playing','dialogue'].includes(game.mode))setPause(true);return}
  if(k==='e'||k===' '||k==='enter'){if(game.mode==='dialogue')advanceDialogue();else interact();return}
  if(['arrowleft','arrowright','a','d'].includes(k))keys.add(k);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointerdown',pointerDown);window.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',pointerUp);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['playing','dialogue'].includes(game.mode))setPause(true)});
window.addEventListener('beforeunload',save);
refreshContinue();setObjective('');requestAnimationFrame(frame);
