let songs = [];
let songNames = [
  "fast.mp3",      // dance
  "midfast.mp3",   // disco
  "mid.mp3",       // jazz
  "midslow.mp3",   // pop
  "slow.mp3"       // drift
];
let buttonLabels = ["dance", "disco", "jazz", "pop", "drift"];
let bpms = [160, 130, 110, 90, 70];

let colorFamilies = [
  // 粉
  ["#9f295a","#c94078","#e76393","#fb87b4","#ffadc8","#ffd5e6","#fff3fa"],
  // 橙
  ["#b25621","#ce6a1d","#f98b1d","#ffa14c","#ffc385","#ffe5bc","#fffaee"],
  // 松石绿
  ["#17736c","#229891","#27b7a5","#4fd4be","#97f3e0","#d1fff5","#f3fffb"],
  // 天蓝
  ["#2353a4","#3171cf","#3690ff","#68b6ff","#a4d8ff","#d2edff","#f6fcff"],
  // 藏蓝
  ["#181e36","#273057","#37447c","#5660a5","#8487cd","#c4c7e8","#f2f2fa"]
];

let currentSongIdx = 0;
let isPlaying = false;
let songBtns = [];
let ctrlBtns = [];

let fft;
const bins         = 128;
const ptsPerCircle = 360;
const repeat       = 3;
const baseR        = 120;
const gap          = 0;
const ringWidth    = 12;
const topSpace     = 140; // 预留给按钮区的高度，可调

function preload() {
  for(let i=0;i<songNames.length;i++){
    songs[i] = loadSound(songNames[i]);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight - topSpace);
  angleMode(DEGREES);

  fft = new p5.FFT(0.85, bins);

  // 横向一排歌曲按钮
  for(let i=0; i<5; i++){
    let btn = createButton(buttonLabels[i]);
    btn.position(32 + i*120, 20);
    btn.size(100, 38);
    styleModernBtn(btn, false);
    btn.mousePressed(()=>{
      playSong(i);
      highlightButton(i);
    });
    songBtns.push(btn);
  }
  highlightButton(0);

  // Play、Pause横向一排
  let btnPlay = createButton('play');
  btnPlay.position(32, 70);
  btnPlay.size(100,38);
  styleModernBtn(btnPlay, false);
  btnPlay.mousePressed(()=>{
    if (!isPlaying) {
      songs[currentSongIdx].play();
      isPlaying = true;
    }
  });
  ctrlBtns.push(btnPlay);

  let btnPause = createButton('pause');
  btnPause.position(152, 70);
  btnPause.size(100,38);
  styleModernBtn(btnPause, false);
  btnPause.mousePressed(()=>{
    if (isPlaying) {
      songs[currentSongIdx].pause();
      isPlaying = false;
    }
  });
  ctrlBtns.push(btnPause);

  //playSong(0); // 不自动播放
}

function styleModernBtn(btn, active){
  btn.style('border-radius', '18px');
  btn.style('font-size','1.2rem');
  btn.style('background', active ? '#bfd5f6' : '#e0e6f3');
  btn.style('color', active ? '#1a2536' : '#1a2536');
  btn.style('border','none');
  btn.style('box-shadow','0 2px 12px 0 rgba(40,80,120,0.13)');
  btn.style('font-weight','500');
  btn.style('outline','none');
  btn.style('transition','background .18s');
  btn.mouseOver(()=>btn.style('background', '#c3dafc'));
  btn.mouseOut(()=>btn.style('background', active ? '#bfd5f6' : '#e0e6f3'));
}

function highlightButton(idx){
  for(let i=0; i<songBtns.length; i++){
    styleModernBtn(songBtns[i], i === idx);
  }
}

function playSong(idx){
  for(let s of songs) if(s.isPlaying()) s.stop();
  songs[idx].play();
  isPlaying = true;
  fft.setInput(songs[idx]);
  currentSongIdx = idx;
  highlightButton(idx);
}

function draw() {
  background('#fff');
  // 画布中心整体下移（避免与按钮重叠，调80-120更舒适）
  translate(width/2, height/2 + 100);

  const spectrum = fft.analyze();

  // 大幅拉开旋转速度区间
  const minBPM = 70, maxBPM = 160;
  const minSpeed = 0.00, maxSpeed = 0.39;  // 非常快的视觉旋转
  let bpm = bpms[currentSongIdx];
  bpm = constrain(bpm, minBPM, maxBPM);
  let phaseSpeed = map(bpm, minBPM, maxBPM, minSpeed, maxSpeed);
  const phaseDeg = frameCount * phaseSpeed;

  // 动感wave随BPM
  let ampScale = map(bpm, minBPM, maxBPM, 1.2, 2.6);

  // 色系：从深到浅
  const colorArr = colorFamilies[currentSongIdx].slice().reverse();
  const maxR = baseR + (colorArr.length)*(ringWidth+gap) + 80;
  const fit = (min(width, height)/2 - 24) / maxR;
  scale(fit);

  for(let i=0;i<colorArr.length;i++){
    drawThickRing(
      baseR + i*(ringWidth+gap),
      ringWidth,
      spectrum,
      i,
      phaseDeg,
      colorArr[i],
      ampScale
    );
  }
}

function drawThickRing(r0, w, spec, ringIdx, phase, col, ampScale) {
  const ns = 0.25, nt = frameCount * 0.02;
  const outer = [], inner = [];
  for (let v=0; v<=ptsPerCircle; v++){
    const partSize = ptsPerCircle / repeat;
    const inPart   = v % partSize;
    const perc     = inPart / partSize;
    const binPos   = floor(perc * bins);
    const next     = (binPos+1) % bins;
    const frac     = perc * bins - binPos;
    const amp      = lerp(spec[binPos], spec[next], frac);

    const aRad = TWO_PI * v/ptsPerCircle;
    const nVal = noise(
      cos(aRad)*ns + ringIdx*10,
      sin(aRad)*ns + ringIdx*10,
      nt
    );
    const rOut = r0 + w/2 + map(amp,0,255,0,100) * nVal * ampScale;
    const rIn  = r0 - w/2 + map(amp,0,255,0,60)  * nVal * ampScale*0.72;
    const ang = phase + v*360/ptsPerCircle;
    outer.push([rOut*cos(ang), rOut*sin(ang)]);
    inner.push([rIn*cos(ang),  rIn*sin(ang)]);
  }

  fill(col);
  stroke(col); strokeWeight(6);
  beginShape();
  outer.forEach(([x,y]) => vertex(x, y));
  for(let i=inner.length-1; i>=0; i--) vertex(inner[i][0], inner[i][1]);
  endShape(CLOSE);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - topSpace);
}

let shot = 0;
function mousePressed(){
  if(millis()-shot>400){
    save(`ring_${year()}${month()}${day()}_${hour()}${minute()}${second()}.png`);
    shot = millis();
  }
}
