const LANES = 3;
const LEVEL_TIMES = [10,20,30,45,60];
const LEVEL_CONFIG = [
  {spawn:850, speed:3.3, gift:.18},
  {spawn:720, speed:4.1, gift:.15},
  {spawn:600, speed:4.9, gift:.13},
  {spawn:500, speed:5.7, gift:.11},
  {spawn:410, speed:6.6, gift:.09}
];
const WIN_MESSAGES = [
  'Clean driving! Even the celebrity is impressed. 😎🔥',
  'Excellent run! Your reflexes are getting dangerous. ⚡',
  'Halfway legend! That was seriously fast. 🚀',
  'One level left. You are absolutely cooking now. 🔥',
  'YOU DID IT! The 60-second final challenge is yours! 🏆'
];
let laneX=[], playerLane=1, score=0, combo=0, timeLeft=10, gameActive=false, currentLevel=1;
let timerId=null, spawnId=null, loopId=null, countdownId=null, rivals=[], arenaEl=null, playerEl=null;
let soundOn=true, audioCtx=null;

function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target=document.querySelector('.screen[data-screen="'+name+'"]');
  if(target) target.classList.add('active');
}
function setupAudio(){
  if(!soundOn) return;
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended') audioCtx.resume();
}
function tone(freq,duration=.08,type='square',gain=.035,when=0){
  if(!soundOn) return;
  setupAudio(); if(!audioCtx) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(0.0001,audioCtx.currentTime+when);
  g.gain.exponentialRampToValueAtTime(gain,audioCtx.currentTime+when+.01);
  g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+when+duration);
  o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime+when); o.stop(audioCtx.currentTime+when+duration+.02);
}
function sfx(name){
  if(!soundOn) return;
  setupAudio();
  if(name==='move') tone(420,.045,'triangle',.025);
  if(name==='tick') tone(650,.055,'square',.02);
  if(name==='go'){tone(520,.1,'square',.035); tone(780,.14,'square',.04,.09);}
  if(name==='gift'){tone(720,.07,'triangle',.03); tone(980,.12,'triangle',.03,.08);}
  if(name==='combo'){tone(560,.06,'triangle',.025); tone(820,.1,'triangle',.03,.07);}
  if(name==='win'){tone(523,.12,'triangle',.04); tone(659,.12,'triangle',.04,.13); tone(784,.2,'triangle',.05,.26);}
  if(name==='lose'){tone(180,.16,'sawtooth',.045); tone(110,.22,'sawtooth',.04,.12);}
}
function layoutLanes(){
  const w=arenaEl.clientWidth, laneW=w/LANES;
  laneX=[0,1,2].map(i=>i*laneW+laneW/2); return laneW;
}
function positionCar(el,lane){ el.style.left=(laneX[lane]-26)+'px'; }
function updateProgress(){
  for(let i=1;i<=5;i++){ const p=document.getElementById('p'+i); p.className=i<currentLevel?'done':(i===currentLevel?'current':''); }
}
function startGame(level=1){
  setupAudio(); clearInterval(timerId); clearInterval(spawnId); cancelAnimationFrame(loopId); clearInterval(countdownId);
  currentLevel=Math.max(1,Math.min(5,Number(level)||1)); score=0; combo=0; timeLeft=LEVEL_TIMES[currentLevel-1]; gameActive=false; playerLane=1; rivals=[];
  document.getElementById('score').textContent=score; document.getElementById('combo').textContent=combo; document.getElementById('timeLeft').textContent=timeLeft; document.getElementById('levelNumber').textContent=currentLevel; updateProgress();
  arenaEl=document.getElementById('arena'); arenaEl.innerHTML=''; showScreen('game'); const laneW=layoutLanes();
  for(let i=1;i<LANES;i++){const line=document.createElement('div');line.className='lane-line';line.style.left=(i*laneW-3)+'px';arenaEl.appendChild(line);}
  playerEl=document.createElement('div'); playerEl.className='car player-car'; playerEl.textContent='🚗'; positionCar(playerEl,playerLane); playerEl.style.top=(arenaEl.clientHeight-100)+'px'; arenaEl.appendChild(playerEl);
  const cd=document.createElement('div'); cd.className='countdown'; arenaEl.appendChild(cd);
  let n=3; cd.textContent=n; sfx('tick');
  countdownId=setInterval(()=>{n--; if(n>0){cd.textContent=n;sfx('tick');}else if(n===0){cd.textContent='GO!';sfx('go');}else{clearInterval(countdownId);cd.remove();gameActive=true; runTimers();}},700);
}
function runTimers(){
  const cfg=LEVEL_CONFIG[currentLevel-1];
  timerId=setInterval(()=>{
    if(!gameActive)return; timeLeft--; document.getElementById('timeLeft').textContent=Math.max(timeLeft,0);
    if(timeLeft<=5 && timeLeft>0) sfx('tick');
    if(timeLeft<=0) endGame(true);
  },1000);
  spawnId=setInterval(spawnRival,cfg.spawn); loopId=requestAnimationFrame(gameLoop);
}
function moveLane(dir){
  if(!gameActive)return; const next=Math.max(0,Math.min(LANES-1,playerLane+dir));
  if(next!==playerLane){playerLane=next;positionCar(playerEl,playerLane);sfx('move');}
}
document.getElementById('leftBtn').addEventListener('click',()=>moveLane(-1));
document.getElementById('rightBtn').addEventListener('click',()=>moveLane(1));
document.getElementById('startBtn').addEventListener('click',()=>startGame(1));
document.getElementById('retryBtn').addEventListener('click',()=>startGame(currentLevel));
document.getElementById('restartBtn').addEventListener('click',()=>startGame(1));
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();moveLane(-1)} if(e.key==='ArrowRight'){e.preventDefault();moveLane(1)}});
let touchStartX=null;
document.addEventListener('touchstart',e=>{touchStartX=e.touches[0]?.clientX??null},{passive:true});
document.addEventListener('touchend',e=>{if(touchStartX===null)return;const dx=(e.changedTouches[0]?.clientX??touchStartX)-touchStartX;if(Math.abs(dx)>30)moveLane(dx>0?1:-1);touchStartX=null},{passive:true});

document.getElementById('soundBtn').addEventListener('click',()=>{soundOn=!soundOn;const b=document.getElementById('soundBtn');b.textContent=soundOn?'🔊 Sound On':'🔇 Sound Off';b.setAttribute('aria-pressed',String(soundOn));if(soundOn){setupAudio();sfx('move');}});

const rivalEmojis=['🚙','🚕','🚓','🚌','🏎️'];
function spawnRival(){
  if(!gameActive)return; const lane=Math.floor(Math.random()*LANES), cfg=LEVEL_CONFIG[currentLevel-1], isGift=Math.random()<cfg.gift;
  const el=document.createElement('div'); el.className='car rival-car'; el.textContent=isGift?'🎁':rivalEmojis[Math.floor(Math.random()*rivalEmojis.length)]; el.style.background='transparent'; positionCar(el,lane); el.style.top='-90px'; arenaEl.appendChild(el); rivals.push({el,lane,y:-90,isGift});
}
function gameLoop(){
  if(!gameActive)return; const cfg=LEVEL_CONFIG[currentLevel-1], speed=cfg.speed+Math.min(3,score*.025), arenaH=arenaEl.clientHeight, playerTop=arenaH-100;
  for(let i=rivals.length-1;i>=0;i--){
    const r=rivals[i]; r.y+=speed; r.el.style.top=r.y+'px';
    if(r.y>arenaH){r.el.remove();rivals.splice(i,1);continue;}
    if(r.lane===playerLane && r.y>playerTop-70 && r.y<playerTop+70){
      if(r.isGift){score+=3;combo++;document.getElementById('score').textContent=score;document.getElementById('combo').textContent=combo;r.el.remove();rivals.splice(i,1);sfx('gift');if(combo%5===0)sfx('combo');}
      else{r.el.remove();rivals.splice(i,1);combo=0;document.getElementById('combo').textContent=0;arenaEl.classList.remove('shake');void arenaEl.offsetWidth;arenaEl.classList.add('shake');endGame(false);return;}
    }
  }
  score++; combo++; document.getElementById('score').textContent=score; document.getElementById('combo').textContent=combo; if(combo>0&&combo%10===0)sfx('combo');
  loopId=requestAnimationFrame(gameLoop);
}
function nextLevel(){if(currentLevel<5)startGame(currentLevel+1);}
function endGame(won){
  if(!gameActive)return; gameActive=false; clearInterval(timerId);clearInterval(spawnId);clearInterval(countdownId);cancelAnimationFrame(loopId);
  if(won){
    document.getElementById('winTitle').textContent=currentLevel===5?'FINAL LEVEL CLEARED! 🏆':'LEVEL CLEARED! 🎉';
    document.getElementById('winMessage').textContent=WIN_MESSAGES[currentLevel-1];
    document.getElementById('winLevel').textContent='Level '+currentLevel+' complete';
    document.getElementById('winNext').textContent=currentLevel===5?'You conquered every level. Enter the BAAZINGA Hall of Fame!':'Next challenge: '+LEVEL_TIMES[currentLevel]+' seconds.';
    document.getElementById('winButton').textContent=currentLevel===5?'See final victory 🏆':'Next level ➡️';
    document.getElementById('winButton').onclick=currentLevel===5?()=>showScreen('final'):nextLevel;
    showScreen('win'); burstConfetti(); sfx('win');
  }else{
    document.getElementById('loseLevel').textContent='Level '+currentLevel;
    document.getElementById('loseMessage').textContent='BAAZINGA! 💥 The '+LEVEL_TIMES[currentLevel-1]+'-second challenge got you. Reset and try again!';
    showScreen('lose'); sfx('lose');
  }
}

const colors=['#FF6B6B','#FFC93C','#4FB0C6','#6BCB77','#B98BE0'];
const canvas=document.getElementById('confetti'),ctx=canvas.getContext('2d'); let particles=[];
function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;} window.addEventListener('resize',resizeCanvas);resizeCanvas();
function burstConfetti(){particles=[];for(let i=0;i<140;i++)particles.push({x:Math.random()*canvas.width,y:-20-Math.random()*canvas.height*.5,w:6+Math.random()*6,h:8+Math.random()*8,color:colors[Math.floor(Math.random()*colors.length)],speed:2+Math.random()*3,drift:(Math.random()-.5)*2,rot:Math.random()*360,rotSpeed:(Math.random()-.5)*10});requestAnimationFrame(animateConfetti);setTimeout(()=>particles=[],4500);}
function animateConfetti(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{p.y+=p.speed;p.x+=p.drift;p.rot+=p.rotSpeed;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});if(particles.length)requestAnimationFrame(animateConfetti);else ctx.clearRect(0,0,canvas.width,canvas.height);}
