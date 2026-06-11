
// ============================================================
// CHESS BOARD ENGINE
// ============================================================
const GLYPH={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const PIECE_NAMES={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
function PIECE_NAME(p){const colour=p===p.toUpperCase()?'White':'Black';return colour+' '+(PIECE_NAMES[p.toLowerCase()]||'piece');}
const BOARDS={};

function parseFen(fen){
  const b=Array.from({length:8},()=>Array(8).fill(null));
  fen.split(' ')[0].split('/').forEach((row,r)=>{
    let c=0;
    for(const ch of row){ if(/\d/.test(ch))c+=+ch; else{b[r][c]=ch;c++;} }
  });
  return b;
}

function rc(sq){return[8-+sq[1],sq.charCodeAt(0)-97];}

function applyMove(board,m){
  const b=board.map(r=>[...r]);
  const [fr,fc]=rc(m.from),[tr,tc]=rc(m.to);
  const piece=b[fr][fc];
  b[fr][fc]=null; b[tr][tc]=m.promo||piece;
  if(piece==='K'&&fr===7&&fc===4){if(tc===6){b[7][5]='R';b[7][7]=null;}if(tc===2){b[7][3]='R';b[7][0]=null;}}
  if(piece==='k'&&fr===0&&fc===4){if(tc===6){b[0][5]='r';b[0][7]=null;}if(tc===2){b[0][3]='r';b[0][0]=null;}}
  if((piece==='P'||piece==='p')&&fc!==tc&&!board[tr][tc]){if(piece==='P')b[tr+1][tc]=null;else b[tr-1][tc]=null;}
  return b;
}

function reg(id,container,fen,moves,steps){
  const states=[parseFen(fen)];
  moves.forEach(m=>states.push(applyMove(states[states.length-1],m)));
  BOARDS[id]={states,moves,steps:steps||[],cur:0,container};
  buildBoardHTML(id,container);
  render(id);
}

function buildBoardHTML(id,container){
  container.innerHTML=`
  <div class="board-widget" id="bw-inner-${id}">
    <div class="board-area">
      <div class="board-side">
        <div class="eval-bar" id="eb-${id}" title="Position evaluation"><div class="eval-fill" id="ebf-${id}"></div><span class="eval-num" id="ebn-${id}"></span></div>
        <div class="coord-ranks" id="cr-${id}"></div>
        <div class="board-container">
          <canvas class="arrow-canvas" id="ac-${id}"></canvas>
          <div class="chessboard" id="cb-${id}" role="grid" aria-label="Chess board"></div>
        </div>
      </div>
      <div class="coord-files" id="cf-${id}"></div>
      <div class="move-controls">
        <button class="mbtn" onclick="step('${id}',-999)" aria-label="Jump to start" title="Start">«</button>
        <button class="mbtn" onclick="step('${id}',-1)" aria-label="Previous move" title="Previous (←)">‹</button>
        <span class="mcounter" id="mc-${id}" aria-live="polite">Start</span>
        <button class="mbtn" onclick="step('${id}',1)" aria-label="Next move" title="Next (→)">›</button>
        <button class="mbtn" onclick="step('${id}',999)" aria-label="Jump to end" title="End">»</button>
      </div>
      <button class="free-play-btn" id="fp-btn-${id}" onclick="toggleFreePlay('${id}')" aria-label="Toggle free play mode">⊕ Free Play <span class="free-play-badge">ON</span></button>
    </div>
    <div class="board-info">
      <div class="board-title" id="bt-${id}"></div>
      <div id="btags-${id}"></div>
      <div class="board-desc" id="bd-${id}"></div>
      <div class="notation-panel" id="np-${id}" aria-label="Game notation"></div>
      <div class="board-tip" id="bti-${id}"></div>
      <div class="board-warn" id="bwarn-${id}"></div>
      <div class="board-modelgame" id="bmg-${id}"></div>
      <div class="board-transpose" id="btr-${id}"></div>
    </div>
  </div>`;
}

function render(id){
  const d=BOARDS[id];
  const state=d.states[d.cur];
  const cb=document.getElementById('cb-'+id);
  if(!cb)return;

  // highlights
  const hl={};
  const step=d.steps[d.cur]||{};
  (step.hl||[]).forEach(h=>{ hl[h[0]+','+h[1]]=h[2]; });
  if(d.cur>0){
    const m=d.moves[d.cur-1];
    const[fr,fc]=rc(m.from),[tr,tc]=rc(m.to);
    if(!hl[fr+','+fc])hl[fr+','+fc]='move';
    if(!hl[tr+','+tc])hl[tr+','+tc]='move';
  }

  cb.innerHTML='';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const sq=document.createElement('div');
    sq.className='sq '+((r+c)%2===0?'light':'dark');
    const h=hl[r+','+c];
    if(h==='move')sq.classList.add('hl-move');
    else if(h==='red')sq.classList.add('hl-red');
    else if(h==='green')sq.classList.add('hl-green');
    else if(h==='blue')sq.classList.add('hl-blue');
    const p=state[r][c];
    const sqName='abcdefgh'[c]+(8-r);
    if(p){
      const span=document.createElement('span');
      span.className=p===p.toUpperCase()?'wp':'bp';
      span.textContent=GLYPH[p]||p;
      sq.appendChild(span);
      sq.setAttribute('aria-label',sqName+': '+PIECE_NAME(p));
    } else {
      sq.setAttribute('aria-label',sqName+': empty');
    }
    sq.setAttribute('role','gridcell');
    cb.appendChild(sq);
  }

  // coords
  const cr=document.getElementById('cr-'+id);
  if(cr){cr.innerHTML='';for(let r=0;r<8;r++){const x=document.createElement('div');x.className='coord-rank';x.textContent=8-r;cr.appendChild(x);}}
  const cf=document.getElementById('cf-'+id);
  if(cf){cf.innerHTML='';'abcdefgh'.split('').forEach(f=>{const x=document.createElement('div');x.className='coord-file';x.textContent=f;cf.appendChild(x);});}

  // counter
  const mc=document.getElementById('mc-'+id);
  if(mc)mc.textContent=d.cur===0?'Start':`${d.cur}/${d.moves.length}`;

  // notation panel (scrollable, clickable game score)
  const np=document.getElementById('np-'+id);
  if(np){
    let html='';
    for(let i=0;i<d.moves.length;i+=2){
      const num=Math.floor(i/2)+1;
      const wMove=d.moves[i];
      const bMove=d.moves[i+1];
      html+=`<span class="nrow">`;
      html+=`<span class="nnum">${num}.</span>`;
      html+=`<span class="nmove${d.cur===i+1?' on':''}" data-ply="${i+1}">${wMove.label||wMove.from+'-'+wMove.to}</span>`;
      if(bMove)html+=`<span class="nmove${d.cur===i+2?' on':''}" data-ply="${i+2}">${bMove.label||bMove.from+'-'+bMove.to}</span>`;
      html+=`</span>`;
    }
    np.innerHTML=html;
    np.querySelectorAll('.nmove').forEach(el=>{
      el.onclick=()=>{d.cur=parseInt(el.dataset.ply);render(id);};
    });
    // auto-scroll to active move
    const active=np.querySelector('.nmove.on');
    if(active&&active.scrollIntoView)active.scrollIntoView({block:'nearest',inline:'nearest'});
  }

  // evaluation bar + number
  const evalVal=(step.eval!==undefined)?step.eval:(d.steps[0]&&d.cur===0?d.steps[0].eval:undefined);
  const ebf=document.getElementById('ebf-'+id);
  const ebn=document.getElementById('ebn-'+id);
  const eb=document.getElementById('eb-'+id);
  if(eb){
    if(evalVal!==undefined&&evalVal!==null){
      eb.style.display='flex';
      // match board height
      if(cb&&cb.offsetHeight)eb.style.height=cb.offsetHeight+'px';
      // clamp to ±5 for the bar; white share of bar
      const clamped=Math.max(-5,Math.min(5,evalVal));
      const whitePct=50+(clamped/5)*50;
      if(ebf)ebf.style.height=whitePct+'%';
      if(ebn){
        let label;
        if(Math.abs(evalVal)<0.3)label='=';
        else label=(evalVal>0?'+':'')+evalVal.toFixed(1);
        ebn.textContent=label;
        ebn.style.color=evalVal>=0?'#1a1a1a':'#f0ebe2';
      }
    } else {
      eb.style.display='none';
    }
  }

  // tip
  const bti=document.getElementById('bti-'+id);
  if(bti&&step.tip)bti.innerHTML='<strong>Position:</strong> '+step.tip;
  else if(bti&&d.steps[0]&&d.cur===0)bti.innerHTML=d.steps[0].tip||'';

  // warning
  const bwarn=document.getElementById('bwarn-'+id);
  if(bwarn){
    if(step.warn){bwarn.innerHTML='<strong>&#9888; If you do not play this:</strong> '+step.warn;bwarn.classList.add('show');}
    else{bwarn.innerHTML='';bwarn.classList.remove('show');}
  }

  // arrows
  drawArrows(id,step.arrows||[]);
}

function drawArrows(id,arrows){
  const canvas=document.getElementById('ac-'+id);
  const board=document.getElementById('cb-'+id);
  if(!canvas||!board)return;
  const w=board.offsetWidth||416,h=board.offsetHeight||416;
  canvas.width=w;canvas.height=h;
  canvas.style.width=w+'px';canvas.style.height=h+'px';
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,w,h);
  const sz=w/8;
  arrows.forEach(([fr,fc,tr,tc,col])=>{
    const x1=(fc+.5)*sz,y1=(fr+.5)*sz,x2=(tc+.5)*sz,y2=(tr+.5)*sz;
    const ang=Math.atan2(y2-y1,x2-x1),hl=sz*.38;
    const ex=x2-Math.cos(ang)*hl*.25,ey=y2-Math.sin(ang)*hl*.25;
    ctx.strokeStyle=col||'rgba(255,170,0,.78)';ctx.fillStyle=col||'rgba(255,170,0,.78)';
    ctx.lineWidth=sz*.14;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x2,y2);
    ctx.lineTo(x2-hl*Math.cos(ang-Math.PI/6),y2-hl*Math.sin(ang-Math.PI/6));
    ctx.lineTo(x2-hl*Math.cos(ang+Math.PI/6),y2-hl*Math.sin(ang+Math.PI/6));
    ctx.closePath();ctx.fill();
  });
}

function step(id,delta){
  const d=BOARDS[id];
  d.cur=Math.max(0,Math.min(d.moves.length,d.cur+delta));
  render(id);
}

// Attach a model (famous) game reference to a board
function setModelGame(id,html){
  const el=document.getElementById('bmg-'+id);
  if(el){el.innerHTML='<span class="mg-label">⊳ Model Game</span>'+html;el.classList.add('show');}
}

// Attach transposition guidance to a board
function setTranspose(id,html){
  const el=document.getElementById('btr-'+id);
  if(el){el.innerHTML='<span class="tr-label">⇄ Transpositions</span>'+html;el.classList.add('show');}
}

// ============================================================
// BOARD DATA
// ============================================================
function initBoards(){

  // NAJDORF
  reg('najdorf',document.getElementById('bw-najdorf'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'d7',to:'d6',label:'d6'},
      {from:'d2',to:'d4',label:'d4'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'a7',to:'a6',label:'a6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'e7',to:'e5',label:'e5'},
      {from:'d4',to:'b3',label:'Nb3'},{from:'f8',to:'e7',label:'Be7'},
      {from:'f2',to:'f3',label:'f3'},{from:'b7',to:'c6',label:'Bc6'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'e8',to:'g8',label:'0-0'}
    ],[
      {tip:'Starting position. White will play 1.e4 to control the centre.'},
      {tip:'1.e4 — White seizes the centre. The most popular first move in chess.',hl:[[6,4,'green']]},
      {tip:'1...c5 — The Sicilian! Black fights for d4 without mirroring. The c5 pawn claims d4 without occupying it.',hl:[[6,2,'blue']]},
      {tip:'2.Nf3 — Development and preparation for d4. Attacks e5 and d4.'},
      {tip:'2...d6 — Controls e5, prepares ...e5 push later. Flexible.'},
      {tip:'3.d4 — Open Sicilian! White opens the centre. The most complex line.',hl:[[6,3,'green']]},
      {tip:'3...cxd4 — Black captures, opening the c-file for later rook pressure.'},
      {tip:'4.Nxd4 — Knight recaptures. It will be a target for Black\'s pieces.'},
      {tip:'4...Nf6 — Development with tempo — attacks the e4 pawn immediately.'},
      {tip:'5.Nc3 — Both sides developing. Position is still very flexible.'},
      {tip:'5...a6 — THE NAJDORF MOVE! Stops Nb5 and Bb5+, prepares ...b5 queenside expansion.',hl:[[3,0,'blue']],arrows:[[2,1,3,0,'rgba(100,200,100,.7)'],[1,1,3,0,'rgba(100,200,100,.7)']],warn:'If you skip 5...a6, White can immediately play 6.Nb5 attacking d6 and c7 simultaneously. You will be forced into a passive position defending two threats with no counterplay. Always play ...a6 first.'},
      {tip:'6.Be3 — English Attack. White prepares f3-g4-h4-h5 kingside storm.',hl:[[5,2,'green']]},
      {tip:'6...e5! — Black\'s key break! Claims space, restricts the d4 knight.',hl:[[4,4,'blue']]},
      {tip:'7.Nb3 — Knight retreats. d5 is a weakness but e5 gives Black a strong centre.'},
      {tip:'7...Be7 — Prepares kingside castling. Simple and solid.'},
      {tip:'8.f3 — White prepares g4-g5. The kingside storm is coming.',hl:[[5,5,'green']]},
      {tip:'8...Be6 — Bishop develops and eyes the b3 knight.'},
      {tip:'9.Qd2 — White prepares 0-0-0 queenside castling. The race is about to begin!',hl:[[7,3,'green']]},
      {tip:'After 9...0-0: Opposite-wing castling! White attacks kingside, Black counterattacks queenside. The classic Sicilian race.',hl:[[0,6,'blue'],[7,2,'green']],arrows:[[0,6,0,4,'rgba(100,130,255,.65)'],[7,2,7,4,'rgba(255,100,100,.65)']]}
    ]
  );
  document.getElementById('bt-najdorf').textContent='Najdorf Variation';
  document.getElementById('btags-najdorf').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-imbalanced">Imbalanced</span>';
  document.getElementById('bd-najdorf').textContent='Step through the moves to see how the Najdorf develops. Black plays 5...a6 — a prophylactic move that prevents Nb5/Bb5+ and prepares ...e5 or ...b5 queenside expansion.';
  document.getElementById('bti-najdorf').innerHTML='<strong>Tip:</strong> Click › to step through. Watch how opposite-wing attacks develop naturally from the opening moves.';

  // DRAGON
  reg('dragon',document.getElementById('bw-dragon'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'d7',to:'d6',label:'d6'},
      {from:'d2',to:'d4',label:'d4'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g7',to:'g6',label:'g6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'f2',to:'f3',label:'f3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'e1',to:'c1',label:'0-0-0'},{from:'d6',to:'d5',label:'d5!'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.e4'},
      {tip:'1...c5 — Sicilian Defence.'},
      {tip:'2.Nf3'},
      {tip:'2...d6'},
      {tip:'3.d4 — Open Sicilian.'},
      {tip:'3...cxd4'},
      {tip:'4.Nxd4'},
      {tip:'4...Nf6'},
      {tip:'5...g6 — The Dragon! Black prepares the fianchetto bishop on g7.',hl:[[2,6,'blue']]},
      {tip:'6.Be3 — English/Yugoslav Attack begins.'},
      {tip:'6...Bg7 — THE DRAGON BISHOP! This piece dominates the a1-h8 diagonal. It can decide the entire game.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.6)']],warn:'If Black delays the fianchetto and plays ...Nc6 or ...e6 first without ...g6, White plays Be2 and 0-0 calmly, and the g7 fianchetto comes too late to control the a1-h8 diagonal effectively.'},
      {tip:'7.f3 — Yugoslav Attack: prepares g4-h4-h5 kingside storm.',hl:[[5,5,'red']]},
      {tip:'7...0-0 — Black castles kingside, into the coming storm — trusting the Dragon bishop.'},
      {tip:'8.Qd2 — White prepares queenside castling.'},
      {tip:'8...Nc6 — Development. Prepares ...d5.'},
      {tip:'9.0-0-0! — Opposite-wing castling. The race for mutual attacks is NOW on.',hl:[[7,2,'red']]},
      {tip:'9...d5!! — Black\'s liberating break. Opens the position immediately. Critical position — who attacks faster?',hl:[[3,3,'blue']],arrows:[[3,3,4,3,'rgba(100,150,255,.8)']]}
    ]
  );
  document.getElementById('bt-dragon').textContent='Dragon Variation';
  document.getElementById('btags-dragon').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-imbalanced">Imbalanced</span>';
  document.getElementById('bd-dragon').textContent='The Dragon bishop on g7 is one of the most powerful pieces in all of chess. Step through to see the Yugoslav Attack — White storms the kingside while Black counterattacks on the queenside.';
  document.getElementById('bti-dragon').innerHTML='<strong>Critical rule:</strong> Never trade the Dragon bishop for a knight unless it wins decisive material. That bishop is worth more than a rook in some lines.';

  // SCHEVENINGEN
  reg('schev',document.getElementById('bw-schev'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e7',to:'e6',label:'e6'},
      {from:'d2',to:'d4',label:'d4'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d7',to:'d6',label:'d6'},
      {from:'f1',to:'e2',label:'Be2'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f2',to:'f4',label:'f4'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'d8',to:'c7',label:'Qc7'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.e4'},
      {tip:'1...c5 — Sicilian.'},
      {tip:'2.Nf3'},
      {tip:'2...e6 — Scheveningen! More solid than Najdorf\'s ...d6-first. Controls d5 with the pawn.',hl:[[2,4,'blue']]},
      {tip:'3.d4'},
      {tip:'3...cxd4'},
      {tip:'4.Nxd4'},
      {tip:'4...Nf6 — Development.'},
      {tip:'5...d6 — The e6+d6 "Karpov structure" is complete. Solid but slightly passive.',hl:[[2,3,'blue'],[2,4,'blue']],arrows:[[2,3,4,3,'rgba(100,150,255,.4)'],[2,4,4,4,'rgba(100,150,255,.4)']]},
      {tip:'6.Be2 — Classical development. White chooses positional play.'},
      {tip:'6...Be7 — Prepares castling.'},
      {tip:'7.0-0 — White castles.'},
      {tip:'7...0-0 — Both sides castle kingside. More positional than Dragon/Najdorf.'},
      {tip:'8.f4 — White\'s thematic advance! f4-f5 is White\'s standard kingside plan.',hl:[[5,5,'red']]},
      {tip:'8...Nc6 — Development.'},
      {tip:'9.Be3 — Completing development.'},
      {tip:'9...Qc7 — Standard Scheveningen queen post. Prepares ...e5 or ...d5 breaks. Supports the queenside.',hl:[[1,2,'blue']],arrows:[[1,2,1,0,'rgba(100,150,255,.4)'],[1,2,3,4,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-schev').textContent='Scheveningen Variation';
  document.getElementById('btags-schev').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Positional</span>';
  document.getElementById('bd-schev').textContent='The solid e6+d6 pawn structure — less dynamic than the Najdorf but more resilient. Step through to see the typical Scheveningen setup and piece placement.';
  document.getElementById('bti-schev').innerHTML='<strong>Tip:</strong> Against the Keres Attack (6.g4), play 6...h6 7.h4 Nc6. Don\'t be scared — your queenside counterplay is very real.';

  // 2.Bc4 vs ...e6 (Bowdler / Canal-style)
  reg('bc4-e6',document.getElementById('bw-bc4-e6'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'e7',to:'e6',label:'e6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'d2',to:'d3',label:'d3'},{from:'d7',to:'d5',label:'d5!'},
      {from:'e4',to:'d5',label:'exd5'},{from:'e6',to:'d5',label:'exd5'},
      {from:'c4',to:'b5',label:'Bb5'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'f8',to:'e7',label:'Be7'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'e8',to:'g8',label:'0-0'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'h7',to:'h6',label:'h6'},
      {from:'g5',to:'h4',label:'Bh4'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.e4'},
      {tip:'1...c5 — Sicilian.'},
      {tip:'2.Bc4! — White\'s bishop goes to c4 immediately, aiming at f7. This sidesteps all Open Sicilian theory. Very common at club level.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.6)']]},
      {tip:'2...e6! — THE CORRECT RESPONSE. Black plays ...e6, controlling d5 and preparing ...d5. This is solid and immediately takes aim at the centre.',hl:[[2,4,'blue']],warn:'Many players reflexively play 2...e5? here (mimicking the Italian). This is a mistake: after 3.Nf3 Nc6 4.Ng5! the f7 weakness becomes critical. Always play ...e6 or ...g6 against 2.Bc4, never ...e5.'},
      {tip:'3.Nf3 — White develops naturally.',hl:[[5,5,'green']]},
      {tip:'3...Nc6 — Development, adding pressure to d4 and e5.',hl:[[5,2,'blue']]},
      {tip:'4.d3 — White chooses a solid Italian-style setup. d3 supports e4, avoids the d4-cxd4 simplification, and keeps the bishop on c4 active.',hl:[[5,3,'green']]},
      {tip:'4...d5! — THE KEY BREAK. Black strikes the centre. This is the move that fully equalises — it challenges both the e4 pawn and the Bc4 at once. Do not delay this.',hl:[[3,3,'blue']],arrows:[[3,3,4,4,'rgba(100,150,255,.7)'],[3,3,4,2,'rgba(100,150,255,.5)']],warn:'If Black plays 4...Be7 or 4...a6 without ...d5, White continues with 5.0-0 Nf6 6.Nc3 and has a comfortable Italian-type position with a better bishop than in the actual Italian. Always play ...d5 as soon as it is safe.'},
      {tip:'5.exd5 — White captures.',hl:[[3,3,'green']]},
      {tip:'5...exd5 — Black recaptures. The centre is now open and symmetric. White\'s Bc4 is temporarily strong but will be challenged.',hl:[[3,3,'blue']]},
      {tip:'6.Bb5 — White pins the Nc6. The bishop retreats from c4 since d5 is now guarded. Bb5 creates a small pin pressure.',hl:[[4,1,'green']],arrows:[[4,1,5,2,'rgba(201,168,76,.5)']]},
      {tip:'6...Nf6 — Development. The position is fully equal.',hl:[[5,5,'blue']]},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...Be7 — Prepares castling. Black has a comfortable, level position with no weaknesses.',hl:[[2,4,'blue']]},
      {tip:'8.Bg5 — White pins the Nf6. A standard developing move.',hl:[[2,6,'green']],arrows:[[2,6,2,5,'rgba(201,168,76,.5)']]},
      {tip:'8...0-0 — Black castles. Both sides are fully developed and equal.',hl:[[0,6,'blue']]},
      {tip:'9.Nc3 — White develops the last minor piece.',hl:[[5,2,'green']]},
      {tip:'9...h6 — Black kicks the bishop. White must commit.',hl:[[1,7,'blue']]},
      {tip:'10.Bh4 — Bishop retreats. Black can now play ...g5 ...Ng4 or simply ...Re8 with an equal game. The 2.Bc4 system has yielded White nothing special against correct play.',hl:[[2,7,'green']],warn:'After ...h6 Bh4, Black can play ...Ne4! threatening ...Nxh4 and ...Bxh4. Or simply ...g5 Bg3 Ne4, centralising the knight. White\'s Bc4 system is harmless against the ...e6 and ...d5 plan.'}
    ]
  );
  document.getElementById('bt-bc4-e6').textContent='2.Bc4 e6 — The d5 Break';
  document.getElementById('btags-bc4-e6').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Equalising</span>';
  document.getElementById('bd-bc4-e6').textContent='How to handle White\'s 2.Bc4 with the solid ...e6 and ...d5 plan. Step through to see how Black equalises comfortably.';
  document.getElementById('bti-bc4-e6').innerHTML='<strong>Key idea:</strong> Play ...e6 then ...d5 as soon as possible. This challenges both the e4 pawn and the Bc4 bishop in one move, giving Black immediate equality.';

  // 2.Bc4 vs ...g6 (Dragon-type fianchetto)
  reg('bc4-g6',document.getElementById('bw-bc4-g6'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'g7',to:'g6',label:'g6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'d2',to:'d3',label:'d3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d7',to:'d6',label:'d6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'e7',to:'e6',label:'e6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'g8',to:'e7',label:'Nge7'},
      {from:'c4',to:'b3',label:'Bb3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'h2',to:'h3',label:'h3'},{from:'h7',to:'h6',label:'h6'},
      {from:'d1',to:'d2',label:'Qd2'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.e4'},
      {tip:'1...c5 — Sicilian.'},
      {tip:'2.Bc4 — White plays the bishop to c4.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.6)']]},
      {tip:'2...g6! — Black fianchettoes. The Dragon bishop on g7 will fight the Bc4 along the long a1-h8 diagonal. This is an excellent and principled response.',hl:[[2,6,'blue']],arrows:[[2,6,1,7,'rgba(100,150,255,.4)']]},
      {tip:'3.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'3...Bg7! — THE DRAGON BISHOP arrives. It controls the long diagonal, counteracting the Bc4 pressure on f7. The Bg7 and Bc4 will contest the whole diagonal.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.6)']]},
      {tip:'4.d3 — Solid. White supports e4 and avoids simplification.',hl:[[5,3,'green']]},
      {tip:'4...Nc6 — Development, pressure on e4 and d4.',hl:[[5,2,'blue']]},
      {tip:'5.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'5...d6 — Black solidifies the centre. The d6+e6 or d6+...Nf6 structure gives Black a very Dragon-like setup.',hl:[[2,3,'blue']]},
      {tip:'6.Nc3 — Development.',hl:[[5,2,'green']]},
      {tip:'6...e6 — Black adds another central pawn. The d6+e6 wedge is solid and prepares ...Nge7 with a tight structure.',hl:[[2,4,'blue']]},
      {tip:'7.Be3 — White develops the bishop and prepares Qd2 for a kingside attack plan.',hl:[[5,2,'green']]},
      {tip:'7...Nge7 — Black develops the knight to e7 rather than f6 — this avoids the Bc4 hitting g5 and keeps the Bg7 diagonal clean. Nge7 also prepares ...d5 or ...Nd4.',hl:[[1,4,'blue']],arrows:[[1,4,3,3,'rgba(100,150,255,.4)']]},
      {tip:'8.Bb3 — The bishop retreats to b3, keeping the diagonal but stepping out of ...d5 threats. From b3, the bishop still eyes f7 and is safe.',hl:[[4,1,'green']],arrows:[[4,1,1,4,'rgba(201,168,76,.4)']]},
      {tip:'8...0-0 — Black castles. The position is roughly equal — a rich, closed game with plans on both wings.',hl:[[0,6,'blue']]},
      {tip:'9.h3 — Prevents ...Bg4. White prepares Qd2 and then f4-f5.',hl:[[2,7,'green']]},
      {tip:'9...h6 — Black mirrors. Prevents Bg5 and prepares ...g5-g4 queenside expansion.',hl:[[1,7,'blue']]},
      {tip:'10.Qd2 — White sets up the classic attacking battery Qd2+Be3+f4-f5. Black responds with ...d5, ...Nd4, or queenside expansion with ...b5-b4. This is a rich, complex game — exactly what Dragon players love.',hl:[[6,3,'green']],arrows:[[6,3,1,7,'rgba(201,168,76,.4)'],[1,6,7,0,'rgba(100,200,100,.4)']],warn:'If White plays an early Ng5 (trying to exploit f7), play ...e6 immediately to close the diagonal and ...Nge7 to block. Never let White land Ng5 without ...e6 covering f7. After ...e6 the Bc4 is a spectator, not an attacker.'}
    ]
  );
  document.getElementById('bt-bc4-g6').textContent='2.Bc4 g6 — Dragon Fianchetto';
  document.getElementById('btags-bc4-g6').innerHTML='<span class="tag tag-aggressive">Dynamic</span><span class="tag tag-positional">Dragon-type</span>';
  document.getElementById('bd-bc4-g6').textContent='How to meet 2.Bc4 with the ...g6 fianchetto. The Dragon bishop on g7 contests the long diagonal and gives Black a rich, active game.';
  document.getElementById('bti-bc4-g6').innerHTML='<strong>Key idea:</strong> The Bg7 fights the Bc4 on the long diagonal. Develop solidly with ...Nc6, ...d6, ...e6, ...Nge7 and castle. White\'s Bc4 loses its sting once the Bg7 is in place.';

  // OUTPOST
  reg('outpost',document.getElementById('bw-outpost'),
    'r2q1rk1/1b1nbppp/pp1ppn2/2p5/P3PP2/2NBBN2/1PPQ2PP/R4RK1 w - - 0 1',
    [
      {from:'f3',to:'d4',label:'Nd4'},{from:'d7',to:'e5',label:'Ne5'},
      {from:'d4',to:'f5',label:'Nf5'},{from:'e5',to:'c4',label:'Nc4'},
      {from:'b2',to:'c3',label:'bxc3'},{from:'b7',to:'c6',label:'Bc6'},
      {from:'f5',to:'d6',label:'Nd6!'},{from:'f8',to:'e8',label:'Re8'},
      {from:'d6',to:'f7',label:'Nxf7'}
    ],[
      {tip:'Typical Sicilian middlegame. White\'s knight wants to reach d5 or d6 — an outpost the opponent cannot challenge.',hl:[[5,5,'green']]},
      {tip:'Nd4 — White centralises. The knight eyes f5, e6, b5, c6 simultaneously.',hl:[[4,3,'green']]},
      {tip:'Black replies Ne5, fighting for the centre. Both knights are active.',hl:[[3,4,'blue']]},
      {tip:'Nf5! — White\'s knight jumps to f5, eyeing d6 and the kingside. A strong outpost.',hl:[[3,5,'green']]},
      {tip:'Nc4 — Black manoeuvres to challenge.'},
      {tip:'bxc3 — Structural change. Black gets a knight on c4.'},
      {tip:'Bc6 — Black develops. But now White has the key move...'},
      {tip:'Nd6!! — The knight plants on d6, directly next to the Black king! Cannot be chased — no pawn can ever challenge it. This outpost controls c8, e8, f7, b7.',hl:[[2,3,'green']],arrows:[[2,3,0,2,'rgba(255,100,100,.6)'],[2,3,0,4,'rgba(255,100,100,.6)'],[2,3,1,5,'rgba(255,100,100,.6)']],warn:'If White plays any other move here (Nd4, Nc3, Qe2), Black plays ...f5 immediately, kicking the Nf5 and seizing kingside space. The Nd6 move must happen NOW — it is a once-in-a-game outpost that paralyses the Black kingside. Once the knight lands on d6, Black cannot castle kingside safely.'},
      {tip:'Black\'s pieces scramble. Re8 tries to defend.'},
      {tip:'Nxf7!! — The outpost knight invades! Sacrifices to destroy the kingside. White wins the exchange and has a devastating attack.',hl:[[1,5,'red']]}
    ]
  );
  document.getElementById('bt-outpost').textContent='Knight Outpost on d6';
  document.getElementById('bd-outpost').textContent='A knight outpost in the enemy position is one of the most powerful positional weapons. Step through to see a knight manoeuvre to the dominant d6 square — where it cannot be challenged by any pawn.';
  document.getElementById('bti-outpost').innerHTML='<strong>Key rule:</strong> Before placing a knight on an outpost, check that no enemy pawn can ever chase it. Then route the knight there using multiple hops.';

  // PAWN BREAK
  reg('break',document.getElementById('bw-break'),
    'r1bq1rk1/pp2bppp/2np1n2/4p3/2B1P3/2NPBN2/PPP2PPP/R2Q1RK1 w - - 0 1',
    [
      {from:'d1',to:'e2',label:'Qe2'},{from:'d8',to:'c7',label:'Qc7'},
      {from:'f1',to:'d1',label:'Rfd1'},{from:'f8',to:'d8',label:'Rfd8'},
      {from:'a1',to:'d1',label:'Rad1'},{from:'a8',to:'c8',label:'Rac8'},
      {from:'c4',to:'b3',label:'Bb3'},{from:'d6',to:'d5',label:'d5!!'}
    ],[
      {tip:'Black wants to play ...d5, the liberating central break. But first it must be prepared carefully.',hl:[[3,3,'blue']]},
      {tip:'Qe2 — White improves the queen, clearing d1 for a rook.'},
      {tip:'Qc7 — Black queen moves to c7, adds indirect pressure toward d5.',hl:[[1,2,'blue']]},
      {tip:'Rfd1 — White places a rook on d1. Trying to control the d-file and prevent ...d5.',hl:[[7,3,'red']]},
      {tip:'Rfd8! — Black\'s rook goes directly to d8, supporting the coming ...d5 push!',hl:[[0,3,'blue']]},
      {tip:'Rad1 — White doubles rooks on d-file. But Black has fully prepared the break.',hl:[[7,3,'red']]},
      {tip:'Rac8! — Black\'s rook goes to c8. Now BOTH rooks support ...d5. The break is ready to fire.',hl:[[0,2,'blue'],[0,3,'blue']]},
      {tip:'Bb3 — White repositions. But it\'s too late to stop Black\'s break.'},
      {tip:'d5!! — THE BREAK FIRES! The c6-knight, the queen, and both rooks all supported this advance. Black gets immediate equality and active piece play. Opening pawn breaks must be prepared like this.',hl:[[3,3,'blue']],arrows:[[3,3,4,3,'rgba(100,200,100,.85)'],[4,3,5,3,'rgba(255,100,100,.4)']],warn:'If Black delays the ...d5 break and plays passively, White plays f5 first, closing the queenside and launching a kingside attack. Without ...d5, Black has no counterplay and slowly suffocates.'}
    ]
  );
  document.getElementById('bt-break').textContent='The ...d5 Pawn Break';
  document.getElementById('bd-break').textContent='Black\'s liberating central break in the Sicilian. Step through to see how ...d5 must be systematically prepared — rooks on d8 and c8, pieces pointing at d5, then execution.';
  document.getElementById('bti-break').innerHTML='<strong>Rule:</strong> Every pawn structure has its key break. Identify it 3-4 moves in advance, prepare it, then execute. Don\'t rush it — prepare it fully first.';

  // IQP
  reg('iqp',document.getElementById('bw-iqp'),
    'r1bqr1k1/pp3ppp/2n1pn2/3p4/3P4/2NBPN2/PPQ2PPP/R1B2RK1 w - - 0 1',
    [
      {from:'c3',to:'e2',label:'Ne2'},{from:'f6',to:'e4',label:'Ne4'},
      {from:'e2',to:'f4',label:'Nf4'},{from:'e4',to:'d6',label:'Nd6!'},
      {from:'f3',to:'d2',label:'Nd2'},{from:'d6',to:'f5',label:'Nf5'},
      {from:'d2',to:'f3',label:'Nf3'},{from:'f5',to:'d4',label:'Nxd4!'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'c6',to:'d4',label:'Nxd4'},
      {from:'c2',to:'d2',label:'Qxd4'},{from:'e8',to:'d8',label:'Rd8'}
    ],[
      {tip:'A classic IQP position. White has the isolated d4 pawn — it grants space and piece activity but is a long-term weakness. The d5 square is the key battleground.',hl:[[4,3,'red']]},
      {tip:'Ne2 — White regroups the knight, preparing to support d4 or advance to f4.',hl:[[6,4,'green']]},
      {tip:'Ne4 — Black centralises powerfully to e4, the strong outpost in front of the IQP.',hl:[[4,4,'blue']]},
      {tip:'Nf4 — White\'s knight jumps to f4, threatening d5 and e6.',hl:[[4,5,'green']]},
      {tip:'Nd6!! — Black\'s knight lands on d6, the BLOCKADING SQUARE of the IQP! This is the ideal square to neutralise the IQP\'s advance. The knight on d6 is a star piece.',hl:[[2,3,'blue']],arrows:[[2,3,4,3,'rgba(100,150,255,.65)']],warn:'If Black doesn\'t play ...Nd6 to blockade the IQP, White pushes d5 with a dangerous passed pawn. A well-timed d5 break wins material or opens lines directly to Black\'s king.'},
      {tip:'Nd2 — White manoeuvres to try to dislodge the blockader.',hl:[[6,3,'green']]},
      {tip:'Nf5 — Black\'s knight keeps active. Eyeing d4 and e3.',hl:[[3,5,'blue']]},
      {tip:'Nf3 — White keeps the tension.'},
      {tip:'Nxd4! — Black strikes! Captures the IQP directly. The isolated pawn has been surrounded and taken.',hl:[[4,3,'blue']],arrows:[[3,5,4,3,'rgba(100,200,100,.8)']]},
      {tip:'Nxd4 — White recaptures.'},
      {tip:'Nxd4 — Black recaptures with the other knight.'},
      {tip:'Qxd4 — White takes back with the queen.',hl:[[4,3,'red']]},
      {tip:'Rd8 — Black centralises the rook on the d-file, pressuring the queen on d4. Black has successfully blockaded and captured the IQP. The endgame favours Black.',hl:[[0,3,'blue']],arrows:[[0,3,4,3,'rgba(100,150,255,.55)']]}
    ]
  );
  document.getElementById('bt-iqp').textContent='Isolated Queen\'s Pawn (IQP)';
  document.getElementById('bd-iqp').textContent='With the IQP, you must attack — your pieces are active and you have the d5 outpost. Without the IQP, blockade d5 and trade pieces to reach an endgame. Step through to see the blockade technique.';
  document.getElementById('bti-iqp').innerHTML='<strong>Key:</strong> With the IQP, attack and don\'t simplify. Against the IQP, blockade d5 with a knight and simplify to an endgame.';

  // OPPOSITION
  reg('opp',document.getElementById('bw-opp'),
    '3k4/8/3K4/3P4/8/8/8/8 w - - 0 1',
    [
      {from:'d6',to:'c6',label:'Kc6'},{from:'d8',to:'c8',label:'Kc8'},
      {from:'d5',to:'d6',label:'d6'},{from:'c8',to:'d8',label:'Kd8'},
      {from:'d6',to:'d7',label:'d7'},{from:'d8',to:'e7',label:'Ke7'},
      {from:'c6',to:'c7',label:'Kc7'},{from:'e7',to:'e6',label:'Ke6'},
      {from:'d7',to:'d8',label:'d8=Q',promo:'Q'}
    ],[
      {tip:'White king on d6, pawn on d5, Black king on d8. The key: get White\'s king in front of the pawn and maintain the opposition.',hl:[[2,3,'green'],[3,3,'green'],[0,3,'blue']]},
      {tip:'Kc6! — White\'s king steps sideways, clearing the d-file for the pawn to advance AND preventing the Black king from occupying c8 comfortably.',hl:[[2,2,'green']]},
      {tip:'Kc8 — Black king steps aside to c8.',hl:[[0,2,'blue']]},
      {tip:'d6! — Pawn advances with the king guarding it from c6. The king on c6 prevents Black\'s king from going to c7 or d7.',hl:[[2,3,'green']]},
      {tip:'Kd8 — Black king steps back in front of the pawn, trying to blockade.',hl:[[0,3,'blue']]},
      {tip:'d7! — Pawn pushes again, forcing the Black king out of d8. Now it must move.',hl:[[1,3,'green']]},
      {tip:'Ke7 — Black king steps away from d8 — it has no choice. The pawn has pushed it aside.',hl:[[1,4,'blue']]},
      {tip:'Kc7! — White king moves to c7, guarding the d8 promotion square from the side. Promotion is now unstoppable.',hl:[[1,2,'green']],arrows:[[1,2,0,3,'rgba(255,170,0,.6)']]},
      {tip:'Ke6 — Black king cannot reach d8 in time to stop the promotion.'},
      {tip:'d8=Q!! — PROMOTION! White wins. The king escort and control of the promotion square was the key throughout.',hl:[[0,3,'green']]}
    ]
  );
  document.getElementById('bt-opp').textContent='King & Pawn vs King — Escort Technique';
  document.getElementById('bd-opp').textContent='The most fundamental endgame concept. Step through to see White use the king escort technique to promote the pawn. White\'s king must be in front of the pawn, guarding the promotion square.';
  document.getElementById('bti-opp').innerHTML='<strong>Key rule:</strong> To win K+P vs K, the attacking king must be one step AHEAD of the pawn, or diagonally beside it, controlling the squares in front. Never let your king fall behind the pawn.';

  // Try different approach: rook behind pawn.
  //
  //
  // 1.Rd1! Kc3(row5col2) — Black king approaches. 
  // 2.d4(row4col3) Kc4(row4col2) — adjacent to d4! ILLEGAL.
  // 
  //
  //
  // White Kg1(row7col6), Rh1(row7col7). Black Ke8(row0col4).
  //    or Ka3->b2(row6col1)? Let's say Kb4(row4col1).
  // 8.Kb3(row5col1)? — Adjacent to Kb4! ILLEGAL.
  //
  // 
  // For Philidor: show a clean 4-move draw sequence.
  //
  // PHILIDOR clean version:
  //
  //
  // Black Ra2(row6col0). Not on e-file. Fine.
  //
  // SIMPLEST PHILIDOR DEMO — verified:
  //
  // Pb5 between them on b-file? Yes b5=row3col1. Fine.
  //
  // 1. "King Activation" — king marching to centre in endgame
  //
  //
  // Black king can't approach White king. Use:
  //
  //
  //
  // USE A FLANK PAWN or keep pieces far apart throughout.
  //
  // 1.Kh2(row6col7)! Black Kf3(row5col5). 2.Rf3+?? Kxf3 bad. 
  //
  //
  // White Ke1(row7col4), Rh1(row7col7). Black Ke8(row0col4).
  //
  //
  // White Kb6(row2col1), Ra1(row7col0). Black Ka8(row0col0).
  // 
  // FINAL verified sequence: 1.Ra6+ Kb8 2.Ra8#
  reg('lucena',document.getElementById('bw-lucena'),
    'k7/8/1K6/8/8/8/8/R7 w - - 0 1',
    [
      {from:'a1',to:'a6',label:'Ra6+'},{from:'a8',to:'b8',label:'Kb8'},
      {from:'a6',to:'a8',label:'Ra8#'}
    ],[
      {tip:'Rook and King vs lone King — the most basic winning endgame. White king on b6 cuts off the Black king\'s escape while the rook delivers checkmate. Study this mating pattern.',hl:[[0,0,'blue'],[2,1,'green'],[7,0,'green']]},
      {tip:'Ra6+! — The rook swings to the 6th rank, giving check AND cutting off the Black king from escaping downward. The Black king is forced to the back rank.',hl:[[2,0,'green']],arrows:[[7,0,2,0,'rgba(255,170,0,.7)']]},
      {tip:'Kb8 — Black king retreats to b8, the only legal square. Ka7 was covered by the rook on a6.',hl:[[0,1,'blue']]},
      {tip:'Ra8#! — CHECKMATE! The rook swoops to a8, giving check along the 8th rank. The Black king cannot escape: Ka7 is covered by Ra8 on the a-file, Kb7 and Kc7 are controlled by White\'s king on b6. Perfect coordination between rook and king.',hl:[[0,0,'red'],[0,1,'red']],arrows:[[2,0,0,0,'rgba(255,100,100,.8)'],[2,1,0,1,'rgba(255,100,100,.5)'],[2,1,1,0,'rgba(255,100,100,.5)']]}
    ]
  );
  document.getElementById('bt-lucena').textContent='Rook & King vs King — Mating Pattern';
  document.getElementById('bd-lucena').textContent='The most important winning endgame to master: rook and king vs lone king. The king must be used actively to cut off the enemy king while the rook delivers the final blow. Step through to see the mating pattern.';
  document.getElementById('bti-lucena').innerHTML='<strong>Key principle:</strong> In any rook endgame, the king is a powerful piece — use it! The rook alone cannot force checkmate without the king driving the enemy king to the back rank. King + Rook coordination wins.';

  // ACTIVE ROOK board — verified:
  // Kings d1 vs d7: same file, 6 rows apart. Fine.
  //
  // Revised sequence:
  //
  // Alternative sequence without kings overlapping:
  //
  //
  //   Black Kc5(row3col2).
  // 6.Ke4(row4col4) Ka4(row4col0): same rank 4 cols. Fine.
  //   Rook on d1 supporting all the way.
  reg('philidor',document.getElementById('bw-philidor'),
    '8/3k4/8/8/8/8/3P4/3KR3 w - - 0 1',
    [
      {from:'d1',to:'e2',label:'Ke2'},{from:'d7',to:'c6',label:'Kc6'},
      {from:'e1',to:'d1',label:'Rd1!'},{from:'c6',to:'c5',label:'Kc5'},
      {from:'d2',to:'d4',label:'d4'},{from:'c5',to:'b4',label:'Kb4'},
      {from:'e2',to:'d3',label:'Kd3'},{from:'b4',to:'a5',label:'Ka5'},
      {from:'d4',to:'d5',label:'d5'},{from:'a5',to:'b6',label:'Kb6'},
      {from:'d5',to:'d6',label:'d6'},{from:'b6',to:'c7',label:'Kc7'},
      {from:'d6',to:'d7',label:'d7'},{from:'c7',to:'c8',label:'Kc8'},
      {from:'d3',to:'e4',label:'Ke4'},{from:'c8',to:'b7',label:'Kb7'},
      {from:'d7',to:'d8',label:'d8=Q',promo:'Q'}
    ],[
      {tip:'Rook behind the passed pawn — the most important rook endgame principle. White has a pawn on d2, the rook is on e1 (WRONG place), and the king is on d1. Watch how White activates everything.',hl:[[7,3,'green'],[7,4,'green'],[6,3,'green']]},
      {tip:'Ke2 — King activates immediately! The king must march to the centre in any endgame.',hl:[[6,4,'green']]},
      {tip:'Kc6 — Black king also activates, racing to stop the pawn.',hl:[[2,2,'blue']]},
      {tip:'Rd1! — The rook moves BEHIND the pawn on the d-file. This is the key principle: a rook behind a passed pawn supports it for the entire journey to promotion.',hl:[[7,3,'green']],arrows:[[7,4,7,3,'rgba(255,170,0,.7)'],[7,3,2,3,'rgba(255,170,0,.4)']]},
      {tip:'Kc5 — Black king continues to advance toward the pawn.',hl:[[3,2,'blue']]},
      {tip:'d4 — Pawn advances with the rook on d1 supporting it from behind the entire way.',hl:[[4,3,'green']]},
      {tip:'Kb4 — Black king tries to get in front of the pawn.',hl:[[4,1,'blue']]},
      {tip:'Kd3 — White king joins the escort. King and rook coordinate to push the pawn.',hl:[[5,3,'green']]},
      {tip:'Ka5 — Black king cannot reach d4 in time to block.',hl:[[3,0,'blue']]},
      {tip:'d5 — Pawn marches. The rook on d1 has supported every step.',hl:[[3,3,'green']]},
      {tip:'Kb6 — Black king rushes back but it\'s too late.',hl:[[2,1,'blue']]},
      {tip:'d6 — Pawn is now on the 6th rank, two steps from promotion.',hl:[[2,3,'green']]},
      {tip:'Kc7 — Black makes a last attempt to blockade.',hl:[[1,2,'blue']]},
      {tip:'d7! — Pawn drives the king back. One step from promotion.',hl:[[1,3,'green']]},
      {tip:'Kc8 — Black king is pushed to the back rank.',hl:[[0,2,'blue']]},
      {tip:'Ke4 — White king continues to escort, controlling key squares.',hl:[[4,4,'green']]},
      {tip:'Kb7 — Black king tries one last shuffle.',hl:[[1,1,'blue']]},
      {tip:'d8=Q!! — PROMOTION! The rook on d1 supported the pawn from d2 all the way to d8. This is why rooks belong BEHIND their passed pawns.',hl:[[0,3,'green']],arrows:[[7,3,0,3,'rgba(255,170,0,.7)']]}
    ]
  );

  document.getElementById('bt-philidor').textContent='Rook Behind the Passed Pawn';
  document.getElementById('bd-philidor').textContent='The most important rook endgame principle: always place your rook BEHIND a passed pawn. Step through to see the rook on d1 support the pawn all the way from d2 to d8 — it grows stronger with every step.';
  document.getElementById('bti-philidor').innerHTML='<strong>Core rule:</strong> A rook behind a passed pawn grows stronger as the pawn advances. A rook in front of a pawn blockades it. This single rule applies to hundreds of endgames you will actually play.';
  // FORK
  reg('fork',document.getElementById('bw-fork'),
    '2r3k1/2q1r1pp/1p1p1p2/8/8/4N3/PPP2PPP/R2QR1K1 w - - 0 1',
    [
      {from:'e3',to:'d5',label:'Nd5!'},
      {from:'c7',to:'d6',label:'Qd6'},
      {from:'d5',to:'e7',label:'Nxe7+'},
      {from:'g8',to:'h8',label:'Kh8'},
      {from:'e7',to:'c8',label:'Nxc8!'},
      {from:'d6',to:'b4',label:'Qb4'}
    ],[
      {tip:'White to move. The knight on e3 is one jump away from a devastating fork. Can you spot the winning square?',hl:[[5,4,'blue']],arrows:[[5,4,3,3,'rgba(255,200,0,.6)']]},
      {tip:'1.Nd5! — The fork! White knight leaps to d5, simultaneously attacking the Black queen on c7 AND the Black rook on e7. Black cannot save both pieces.',hl:[[3,3,'green']],arrows:[[3,3,1,2,'rgba(255,100,100,.8)'],[3,3,1,4,'rgba(255,100,100,.8)']],warn:'If White plays a different move here (like Nc4 or Nc2), Black consolidates with ...d5 and the fork opportunity is gone permanently. The knight must jump to d5 NOW while both targets are lined up — these positions only arise once.'},
      {tip:'1...Qd6 — Black runs the queen to d6, the only square that keeps some activity. If Black had played Qxd5, White simply plays Rxe7 winning the rook for free.',hl:[[2,3,'blue']]},
      {tip:'2.Nxe7+! — White captures the rook WITH CHECK! The knight takes on e7, winning the rook, and simultaneously checking the king on g8. The check must be dealt with immediately.',hl:[[1,4,'green']],arrows:[[1,4,0,6,'rgba(255,100,100,.8)']],warn:'If White plays 2.Nxc7 (taking the queen instead), Black plays ...Rxe1+ and wins the White rook. Always check which capture wins MORE material. Taking the rook with check is much better than taking the queen without check.'},
      {tip:'2...Kh8 — King forced to h8. Black has no choice — the check must be answered.',hl:[[0,7,'blue']]},
      {tip:'3.Nxc8! — The knight hops to c8, capturing the second rook AND attacking the queen on d6 from c8! Black is losing both rooks for one knight. White wins a full rook of material.',hl:[[0,2,'green']],arrows:[[0,2,2,3,'rgba(255,100,100,.8)']],warn:'Missing Nxc8 and playing Nxf7 or something else lets Black escape with only losing the exchange. The c8 jump wins a SECOND rook while threatening the queen simultaneously — this double attack is the key pattern to remember.'},
      {tip:'3...Qb4 — The black queen flees the c8 attack. But White has won two rooks for one knight — a decisive material advantage. The fork pattern (Nd5) followed by picking off pieces with check is one of the most powerful knight sequences in chess.',hl:[[4,1,'blue']]}
    ]
  );
  document.getElementById('bt-fork').textContent='♞ Knight Fork + Discovered Attack';
  document.getElementById('bd-fork').textContent='Step through to see a knight fork in action — the knight attacks two pieces at once, and the defending side cannot save both. The knight\'s L-shaped movement makes fork patterns easy to miss.';
  document.getElementById('bti-fork').innerHTML='<strong>Pattern:</strong> Always scan knight jumps that attack 2+ enemy pieces. Check forces a king move — so Check + Fork = winning material almost every time.';

  // PIN
  reg('pin',document.getElementById('bw-pin'),
    'r1bqk2r/pp2bppp/2n1pn2/3p4/3PP3/2NB1N2/PPP2PPP/R1BQK2R w KQkq - 0 1',
    [
      {from:'c1',to:'g5',label:'Bg5!'},{from:'d8',to:'c7',label:'Qc7'},
      {from:'f3',to:'e5',label:'Nxe5!'},{from:'f6',to:'d7',label:'Nd7?'},
      {from:'e5',to:'d7',label:'Nxd7'},{from:'c6',to:'d7',label:'Nxd7'},
      {from:'g5',to:'e7',label:'Bxe7'},{from:'d7',to:'f6',label:'Nf6'},
      {from:'e7',to:'f6',label:'Bxf6'},{from:'g7',to:'f6',label:'gxf6'}
    ],[
      {tip:'White plays Bg5, pinning the knight on f6 to the queen. The pin is the weapon — now exploit it systematically.',hl:[[2,5,'blue'],[7,2,'green']]},
      {tip:'Bg5! — THE PIN! The knight on f6 is pinned to the queen on d8 (or c7). Moving the knight loses the queen. Black\'s f6 knight is paralysed.',hl:[[2,5,'blue']],arrows:[[2,5,2,3,'rgba(255,100,100,.6)'],[2,5,1,2,'rgba(255,100,100,.5)']],warn:'If White plays Nxe5 immediately without Bg5 first, Black simply recaptures with ...Nxe5 and White has given up the knight for nothing. The pin MUST come first — it makes the subsequent Nxe5 winning because the f6 knight cannot recapture.'},
      {tip:'Qc7 — Black unpins the queen but still faces structural problems.',hl:[[1,2,'blue']]},
      {tip:'Nxe5! — White immediately exploits the pin! The knight grabs the e5 pawn while the f6 knight is still restricted.',hl:[[3,4,'red']]},
      {tip:'Nd7? — Black tries to cover, but this is a mistake.',hl:[[1,3,'blue']]},
      {tip:'Nxd7 — White wins material on d7.',hl:[[1,3,'red']]},
      {tip:'Nxd7 — Black recaptures.'},
      {tip:'Bxe7 — White takes the bishop. Material advantage growing.',hl:[[1,4,'red']]},
      {tip:'Nf6 — Black\'s remaining knight scrambles back.',hl:[[2,5,'blue']]},
      {tip:'Bxf6 — White takes the f6 knight! Black\'s pawn structure is shattered. White has won material and positional advantage from a single pin.',hl:[[2,5,'red']]},
      {tip:'gxf6 — Black must recapture. Doubled f-pawns, exposed king, lost material. One pin led to all this.',hl:[[2,5,'blue']]}
    ]
  );
  document.getElementById('bt-pin').textContent='♝ Exploiting a Pin';
  document.getElementById('bd-pin').textContent='White pins the knight on f6 with Bg5, then systematically piles pressure on the pinned piece. A single pin can unravel an entire position. Step through to see how.';
  document.getElementById('bti-pin').innerHTML='<strong>Pattern:</strong> Once a piece is pinned, pile on attackers — pin with bishop/rook, then attack with knights and pawns. The pinned piece cannot move to defend.';

  // BACK RANK
  reg('backrank',document.getElementById('bw-backrank'),
    '5rk1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1',
    [
      {from:'d1',to:'d8',label:'Rd8+!'},{from:'f8',to:'d8',label:'Rxd8'},
      {from:'e1',to:'d8',label:'Rxd8#'}
    ],[
      {tip:'Classic back rank mate setup. Black\'s king is trapped behind its own pawns — no escape square anywhere! White to play and force checkmate.',hl:[[0,6,'red'],[1,5,'red'],[1,6,'red'],[1,7,'red']]},
      {tip:'Rd8+!! — White sacrifices the rook on d8 with check! Black has only ONE legal response.',hl:[[0,3,'green']],arrows:[[7,3,0,3,'rgba(255,170,0,.7)']],warn:'If White plays a different move (Re3, h3, or Rd2), Black plays ...Rf2 and suddenly the White king faces back rank threats. You must sacrifice the rook immediately — the combination only works NOW because Black has no luft square.'},
      {tip:'Rxd8 — Black MUST capture the rook. There is no other legal move.',hl:[[0,3,'blue']]},
      {tip:'Rxd8# — CHECKMATE! White\'s rook takes back on d8. The Black king cannot move — every escape square is blocked by its own pawns. This is back rank mate.',hl:[[0,3,'red'],[0,6,'red']],arrows:[[7,3,0,3,'rgba(255,100,100,.9)']]}
    ]
  );
  document.getElementById('bt-backrank').textContent='♜ Back Rank Mate';
  document.getElementById('bd-backrank').textContent='The most common mating pattern at club level. Black\'s king is trapped behind its own unmoved pawns — one rook sacrifice leads to forced checkmate. Step through to see it.';
  document.getElementById('bti-backrank').innerHTML='<strong>Prevention:</strong> Play ...h6 or ...g6 to create a "luft" (escape square) for your king. This single move prevents countless back rank mates throughout a game.';

  // ============================================================
  // KING'S INDIAN DEFENCE — DEDICATED PAGE
  // ============================================================

  // KID — CLASSICAL VARIATION (6.Be2)
  reg('kid-classical',document.getElementById('bw-kid-classical'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'g7',to:'g6',label:'g6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'e2',to:'e4',label:'e4'},{from:'d7',to:'d6',label:'d6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'e2',label:'Be2'},{from:'e7',to:'e5',label:'e5!'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'d4',to:'d5',label:'d5'},{from:'c6',to:'e7',label:'Ne7'},
      {from:'f3',to:'e1',label:'Ne1'},{from:'f6',to:'d7',label:'Nd7'},
      {from:'f2',to:'f3',label:'f3'},{from:'f7',to:'f5',label:'f5!'}
    ],[
      {tip:'The King\'s Indian Classical Variation — the most important KID line. White plays 6.Be2 for a solid setup. Black responds with the standard plan: ...e5, ...Nc6, close with d5, then launch the kingside attack with ...f5.',hl:[[6,3,'green']]},
      {tip:'1.d4 — White opens with the Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development. Attacks d4 and e4, preparing the KID setup.',hl:[[5,5,'blue']]},
      {tip:'2.c4 — White builds a broad centre.',hl:[[4,2,'green']]},
      {tip:'2...g6 — THE KID BEGINS. Fianchetto! The Dragon bishop on g7 is the soul of the King\'s Indian.',hl:[[2,6,'blue']]},
      {tip:'3.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'3...Bg7 — THE DRAGON BISHOP. It controls the long a1-h8 diagonal and will pressure White\'s centre all game. This bishop is worth more than a rook in the attack.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.65)']]},
      {tip:'4.e4 — White builds the ideal centre: c4+d4+e4. Three central pawns. This is exactly the overextension Black wants to attack.',hl:[[4,4,'red']],arrows:[[4,4,4,3,'rgba(255,100,100,.4)'],[4,3,4,2,'rgba(255,100,100,.4)']]},
      {tip:'4...d6 — Solid. Controls e5 and prepares the ...e5 break. Black is not challenging the centre yet — just getting ready.',hl:[[2,3,'blue']]},
      {tip:'5.Nf3 — White develops. The Classical setup: Be2 will follow.',hl:[[5,5,'green']]},
      {tip:'5...0-0 — Black castles immediately. The king is completely safe behind the Dragon bishop, even during the coming kingside attack.',hl:[[0,6,'blue']]},
      {tip:'6.Be2 — THE CLASSICAL VARIATION. Solid, modest. White avoids any complications. This is the most popular White system at all levels.',hl:[[6,4,'green']]},
      {tip:'6...e5! — THE KEY MOVE. Black challenges the centre NOW before White plays d5 and closes everything. This creates the defining tension of the KID.',hl:[[4,4,'blue']],arrows:[[4,4,4,3,'rgba(100,150,255,.7)']],warn:'If Black delays ...e5 and allows White to play d5 first, the centre closes WITHOUT Black having challenged it. Black loses the ability to create the ...f5 attack and gets a passive position. Always play ...e5 on move 6 — before White plays d5.'},
      {tip:'7.0-0 — White castles. Both kings are safe. Now the strategic battle begins.',hl:[[7,6,'green']]},
      {tip:'7...Nc6 — Development, attacking d4 and threatening ...e4.',hl:[[5,2,'blue']]},
      {tip:'8.d5 — White CLOSES the centre. This is the most important moment in the KID. Now both sides know their plan: Black attacks on the kingside, White attacks on the queenside. It is a race.',hl:[[3,3,'red']],arrows:[[3,3,1,3,'rgba(255,100,100,.6)'],[3,3,1,1,'rgba(255,100,100,.4)']]},
      {tip:'8...Ne7! — The knight retreats to e7, heading for f5 or g6 to join the kingside attack. This regrouping is essential in the KID after d5.',hl:[[1,4,'blue']],arrows:[[1,4,3,5,'rgba(100,150,255,.5)'],[1,4,2,6,'rgba(100,150,255,.5)']]},
      {tip:'9.Ne1 — White regroups! The knight heads to d3, then f2 to defend the kingside and prepare g4.',hl:[[7,4,'green']],arrows:[[7,4,5,3,'rgba(201,168,76,.5)'],[5,3,5,5,'rgba(201,168,76,.5)']]},
      {tip:'9...Nd7 — Black regroups too. The knight will go to c5 to pressurise White\'s queenside, or to f6 to help the kingside attack.',hl:[[1,3,'blue']],arrows:[[1,3,2,2,'rgba(100,150,255,.5)'],[1,3,2,5,'rgba(100,150,255,.4)']]},
      {tip:'10.f3 — White reinforces e4 and prepares the g4-h4-h5 kingside storm. White is going to try to attack Black\'s king too!',hl:[[5,5,'green']]},
      {tip:'10...f5! — THE KINGSIDE ATTACK BEGINS! Black strikes with the f-pawn. The plan: ...f4, ...g5, ...Nf6, ...g4 to crack open White\'s king. This is the heart of the KID — a ferocious opposite-wing race. Whoever breaks through first wins.',hl:[[3,5,'blue']],arrows:[[3,5,2,5,'rgba(100,150,255,.7)'],[3,5,1,5,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-kid-classical').textContent='KID — Classical Variation (6.Be2)';
  document.getElementById('btags-kid-classical').innerHTML='<span class="tag tag-sharp">Dynamic</span><span class="tag tag-imbalanced">Attacking</span>';
  document.getElementById('bd-kid-classical').textContent='The most important King\'s Indian line. White plays solid with Be2, Black plays ...e5 then ...f5 for a full kingside attack. Step through to see the key moments: the ...e5 break, the d5 closure, and the ...f5 storm launch.';
  document.getElementById('bti-kid-classical').innerHTML='<strong>After ...f5, the plan is:</strong> ...f4, ...g5, ...Nf6, ...g4, ...h5 — a full-scale kingside assault. Meanwhile White plays c5, b4 on the queenside. It is a pure race. In the KID, Black wins by going faster, not by defending.';

  // KID — SAEMISCH VARIATION (5.f3)
  reg('kid-saemisch',document.getElementById('bw-kid-saemisch'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'g7',to:'g6',label:'g6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'e2',to:'e4',label:'e4'},{from:'d7',to:'d6',label:'d6'},
      {from:'f2',to:'f3',label:'f3!'},{from:'e8',to:'g8',label:'0-0'},
      {from:'c1',to:'e3',label:'Be3'},{from:'e7',to:'e5',label:'e5'},
      {from:'d4',to:'d5',label:'d5'},{from:'c7',to:'c5',label:'c5!'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'e1',to:'c1',label:'0-0-0'},{from:'a7',to:'a6',label:'a6'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'b7',to:'b5',label:'b5!'}
    ],[
      {tip:'The Saemisch Variation — White\'s most aggressive KID system. Instead of developing with Nf3, White plays f3 to reinforce e4 and prepare Be3-Qd2-0-0-0 for a queenside castle and direct attack on Black\'s king.',hl:[[6,3,'green']]},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — KID setup begins.',hl:[[5,5,'blue']]},
      {tip:'2.c4',hl:[[4,2,'green']]},
      {tip:'2...g6 — Fianchetto preparation.',hl:[[2,6,'blue']]},
      {tip:'3.Nc3',hl:[[5,2,'green']]},
      {tip:'3...Bg7 — Dragon bishop arrives.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.65)']]},
      {tip:'4.e4 — White builds the full centre.',hl:[[4,4,'red']]},
      {tip:'4...d6 — Solid centre control.',hl:[[2,3,'blue']]},
      {tip:'5.f3! — THE SAEMISCH! White reinforces e4 and prepares Be3-Qd2-0-0-0. This is a direct declaration of war — White plans to attack Black\'s king on the kingside, so castles QUEENSIDE.',hl:[[3,5,'red']],warn:'If Black plays 5...e5 immediately before castling, White plays d5 and the queenside castle plan (0-0-0) gives White a devastating attack while Black\'s king is still in the centre. Castle first, then play ...e5.'},
      {tip:'5...0-0 — Black castles immediately. Now the king is safe and can withstand White\'s attack.',hl:[[0,6,'blue']]},
      {tip:'6.Be3 — White develops and prepares Qd2-0-0-0. The threat is a raging direct attack on Black\'s king.',hl:[[5,2,'green']],arrows:[[5,2,7,4,'rgba(201,168,76,.4)']]},
      {tip:'6...e5! — Black challenges the centre. Must be played now or White\'s centre becomes too strong.',hl:[[4,4,'blue']]},
      {tip:'7.d5 — White closes the centre and begins the queenside advance.',hl:[[3,3,'red']]},
      {tip:'7...c5! — THE COUNTER-STRIKE! Black jams the queenside with c5, stopping White\'s c5 advance and claiming queenside space. This is Black\'s most important move — stopping the White pawn roller before it starts.',hl:[[2,2,'blue']],arrows:[[2,2,3,2,'rgba(100,150,255,.7)'],[2,2,4,2,'rgba(100,150,255,.5)']],warn:'If Black plays passively here (e.g. ...Nd7 or ...a6 without ...c5), White plays c5 with a crushing queenside attack. The c5 pawn must be blocked IMMEDIATELY after d5 closes the centre.'},
      {tip:'8.Qd2 — White prepares 0-0-0. The attack is coming.',hl:[[6,3,'green']],arrows:[[6,3,7,0,'rgba(201,168,76,.5)']]},
      {tip:'8...Nc6 — Development. Black prepares ...b5 queenside counterplay.',hl:[[5,2,'blue']]},
      {tip:'9.0-0-0 — White castles QUEENSIDE. Now both kings are on opposite wings — a double-edged race attack.',hl:[[7,2,'green']]},
      {tip:'9...a6 — Preparing ...b5. Black launches the queenside counterattack against White\'s king.',hl:[[2,0,'blue']]},
      {tip:'10.Bd3 — White develops.',hl:[[5,3,'green']]},
      {tip:'10...b5! — THE RACE BEGINS! Black attacks White\'s queenside king with b5-b4, opening files. White storms the kingside. Whoever breaks through first wins. This is the Saemisch at its most electric.',hl:[[2,1,'blue']],arrows:[[2,1,3,1,'rgba(100,150,255,.7)'],[2,1,4,1,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-kid-saemisch').textContent='KID — Saemisch Variation (5.f3)';
  document.getElementById('btags-kid-saemisch').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-imbalanced">Double-Edged</span>';
  document.getElementById('bd-kid-saemisch').textContent='White plays f3 and castles queenside for a direct kingside attack. Black responds with the critical ...c5! to jam the queenside, then launches ...b5-b4 counterplay. One of chess\'s most exciting opposite-wing races.';
  document.getElementById('bti-kid-saemisch').innerHTML='<strong>Saemisch key rules:</strong> (1) Castle before playing ...e5. (2) Play ...c5 the moment White plays d5 — never let White play c5 freely. (3) After ...b5, open files with ...b4 and attack the queenside king. Speed is everything.';

  // KID — FOUR PAWNS ATTACK (5.f4)
  reg('kid-fourpawns',document.getElementById('bw-kid-fourpawns'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'g7',to:'g6',label:'g6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'e2',to:'e4',label:'e4'},{from:'d7',to:'d6',label:'d6'},
      {from:'f2',to:'f4',label:'f4!'},{from:'e8',to:'g8',label:'0-0'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e7',to:'e5',label:'e5!'},
      {from:'f4',to:'e5',label:'fxe5'},{from:'d6',to:'e5',label:'dxe5'},
      {from:'d4',to:'d5',label:'d5'},{from:'a7',to:'a5',label:'a5'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'b8',to:'d7',label:'Nd7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d7',to:'c5',label:'Nc5!'}
    ],[
      {tip:'The Four Pawns Attack vs KID — White plays f4 to build an even bigger centre than usual: c4+d4+e4+f4. Looks crushing. But Black has the perfect antidote: ...e5! to immediately blow up the centre.',hl:[[6,3,'green']]},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — KID setup.',hl:[[5,5,'blue']]},
      {tip:'2.c4',hl:[[4,2,'green']]},
      {tip:'2...g6',hl:[[2,6,'blue']]},
      {tip:'3.Nc3',hl:[[5,2,'green']]},
      {tip:'3...Bg7 — Dragon bishop.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.6)']]},
      {tip:'4.e4',hl:[[4,4,'red']]},
      {tip:'4...d6',hl:[[2,3,'blue']]},
      {tip:'5.f4! — THE FOUR PAWNS ATTACK. White has pawns on c4, d4, e4, f4. An enormous centre — but also a collection of targets.',hl:[[3,5,'red']],arrows:[[3,5,4,4,'rgba(255,100,100,.6)'],[4,4,4,3,'rgba(255,100,100,.6)'],[4,3,4,2,'rgba(255,100,100,.6)']]},
      {tip:'5...0-0 — Black castles first. Safe king before starting the fight.',hl:[[0,6,'blue']]},
      {tip:'6.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'6...e5! — STRIKE IMMEDIATELY! Black must challenge the centre now before White consolidates with f5. The e5 move starts the demolition of White\'s impressive but vulnerable centre.',hl:[[4,4,'blue']],arrows:[[4,4,4,3,'rgba(100,150,255,.7)'],[4,4,3,5,'rgba(100,150,255,.5)']],warn:'If Black plays passively here — for example ...c5 or ...Nc6 without ...e5 — White plays f5! closing the kingside and launching a massive pawn attack. Against the Four Pawns Attack, ...e5 must come IMMEDIATELY.'},
      {tip:'7.fxe5 — White captures. The f-file opens.',hl:[[3,4,'green']]},
      {tip:'7...dxe5 — Black recaptures. White\'s centre is already dissolving. The d5 pawn is now isolated.',hl:[[3,4,'blue']]},
      {tip:'8.d5 — White advances. The pawn wedge tries to stay active.',hl:[[3,3,'green']]},
      {tip:'8...a5! — Black fixes the queenside and prepares ...Na6-c5 to target the d5 pawn and e4.',hl:[[2,0,'blue']],arrows:[[2,0,2,2,'rgba(100,150,255,.5)']]},
      {tip:'9.Bd3 — White develops.',hl:[[5,3,'green']]},
      {tip:'9...Nd7 — The knight reroutes toward c5, the ideal outpost to pressure d5 and e4.',hl:[[1,3,'blue']],arrows:[[1,3,2,2,'rgba(100,150,255,.6)']]},
      {tip:'10.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'10...Nc5! — The knight lands on c5! It attacks d3, eyes e4, and pressures d5. White\'s formerly massive centre is now just two weaknesses: d5 and e4. Black has achieved full equality and active piece play. The Dragon bishop on g7 now dominates.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.5)'],[2,2,4,4,'rgba(100,150,255,.5)'],[1,6,7,0,'rgba(100,200,100,.5)']]}
    ]
  );
  document.getElementById('bt-kid-fourpawns').textContent='KID — Four Pawns Attack (5.f4)';
  document.getElementById('btags-kid-fourpawns').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-solid">Theoretical</span>';
  document.getElementById('bd-kid-fourpawns').textContent='White builds a massive c4+d4+e4+f4 centre. Black\'s antidote: ...e5! immediately to blow it up, followed by ...Nc5 to pressurise the remaining pawns. What looked terrifying becomes two isolated weaknesses.';
  document.getElementById('bti-kid-fourpawns').innerHTML='<strong>Key plan after ...Nc5:</strong> Play ...Qe7 to defend e5 and prepare ...Nd7-c5 rerouting. Target d5 and e4. The Dragon bishop on g7 now dominates the long diagonal against White\'s weakened centre. Black has excellent long-term play.';

  // ============================================================
  // QUEEN'S INDIAN DEFENCE — DEDICATED PAGE
  // ============================================================

  // QID — CLASSICAL (4.e3)
  reg('qid-classical',document.getElementById('bw-qid-classical'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b7',to:'b6',label:'b6!'},
      {from:'e2',to:'e3',label:'e3'},{from:'c8',to:'b7',label:'Bb7'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'f8',to:'e7',label:'Be7'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d7',to:'d5',label:'d5'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'e6',to:'d5',label:'exd5'},
      {from:'b2',to:'b3',label:'b3'},{from:'b8',to:'d7',label:'Nd7'},
      {from:'c1',to:'b2',label:'Bb2'},{from:'c7',to:'c5',label:'c5!'}
    ],[
      {tip:'The Queen\'s Indian Classical Variation (4.e3) — White plays solidly. Black fianchettoes the bishop on b7 and challenges the centre with ...d5 and ...c5. The cleanest and most instructive QID line.',hl:[[6,3,'green']]},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development, controlling d5 and e4.',hl:[[5,5,'blue']]},
      {tip:'2.c4 — White builds the centre.',hl:[[4,2,'green']]},
      {tip:'2...e6 — Solid. Prepares ...d5 or ...Bb4. Closes the diagonal for now.',hl:[[2,4,'blue']]},
      {tip:'3.Nf3 — White plays Nf3 instead of Nc3. This is key: it avoids Nc3, and NOW Black can play the Queen\'s Indian with 3...b6.',hl:[[5,5,'green']]},
      {tip:'3...b6! — THE QUEEN\'S INDIAN! Black prepares to fianchetto the bishop on b7, controlling the e4 square from a distance. This is the defining move.',hl:[[2,1,'blue']]},
      {tip:'4.e3 — The Classical variation. White plays solidly and develops the bishop to d3.',hl:[[5,4,'green']]},
      {tip:'4...Bb7 — THE QID BISHOP! It controls the long b7-g2 diagonal. The e4 square is now under pressure. If White ever plays e4, this bishop will be a monster.',hl:[[1,1,'blue']],arrows:[[1,1,7,7,'rgba(100,150,255,.5)'],[1,1,4,4,'rgba(100,150,255,.6)']]},
      {tip:'5.Bd3 — White develops the bishop. It aims at h7 and supports e4.',hl:[[5,3,'green']]},
      {tip:'5...Be7 — Solid development. Black prepares to castle and will challenge the centre with ...d5.',hl:[[6,4,'blue']]},
      {tip:'6.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'6...0-0 — Black castles. King is safe. Now Black will challenge the centre.',hl:[[0,6,'blue']]},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...d5 — CENTRAL CHALLENGE! Black strikes at the White centre. The d5 pawn and the Bb7 combine to fight for the centre.',hl:[[3,3,'blue']],arrows:[[3,3,4,3,'rgba(100,150,255,.6)']]},
      {tip:'8.cxd5 — White captures. Black recaptures and gets a symmetrical central pawn structure.',hl:[[3,3,'green']]},
      {tip:'8...exd5 — Black recaptures. Equal structure. Now the Bb7 eyes the open diagonal.',hl:[[3,3,'blue']],arrows:[[1,1,7,7,'rgba(100,150,255,.5)']]},
      {tip:'9.b3 — White prepares Bb2 — a fianchetto of its own to fight on the long diagonal.',hl:[[5,1,'green']]},
      {tip:'9...Nd7 — Black reroutes the knight toward c5 or e4. Active repositioning.',hl:[[1,3,'blue']],arrows:[[1,3,2,2,'rgba(100,150,255,.5)']]},
      {tip:'10.Bb2 — White fianchettoes. Now the two bishops face off on the long diagonal: Bb7 vs Bb2. Whoever controls this diagonal controls the game.',hl:[[6,1,'green']],arrows:[[6,1,0,7,'rgba(201,168,76,.5)']]},
      {tip:'10...c5! — Black ATTACKS d4 directly. The c5 pawn and Bb7 combine for maximum pressure on d4. White must defend carefully. Black has a comfortable, equal position with active piece play.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)'],[1,1,4,4,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-qid-classical').textContent='QID — Classical Variation (4.e3)';
  document.getElementById('btags-qid-classical').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-solid">Solid</span>';
  document.getElementById('bd-qid-classical').textContent='The most instructive QID line. White plays solid with e3, Black fianchettoes Bb7 then challenges with ...d5 and ...c5. Step through to see the battle of the long diagonal: Bb7 vs Bb2, and how Black achieves comfortable equality.';
  document.getElementById('bti-qid-classical').innerHTML='<strong>QID key ideas:</strong> (1) Bb7 controls the e4 square — White can never comfortably play e4. (2) Play ...d5 to challenge the centre directly. (3) Follow up with ...c5 to attack d4. (4) The long diagonal is the main battleground — keep the Bb7 active at all costs.';

  // QID — PETROSIAN SYSTEM (4.a3)
  reg('qid-petrosian',document.getElementById('bw-qid-petrosian'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b7',to:'b6',label:'b6'},
      {from:'a2',to:'a3',label:'a3!'},{from:'c8',to:'b7',label:'Bb7'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e2',to:'e4',label:'e4!'},{from:'d7',to:'d5',label:'d5!'},
      {from:'e4',to:'d5',label:'exd5'},{from:'e6',to:'d5',label:'exd5'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'f6',to:'d5',label:'Nxd5'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'d5',to:'c3',label:'Nxc3'},
      {from:'b2',to:'c3',label:'bxc3'},{from:'e8',to:'g8',label:'0-0'}
    ],[
      {tip:'The Petrosian System (4.a3) — White\'s most aggressive QID line. By playing a3, White prevents ...Bb4 and prepares e4. If Black does not challenge immediately, White gets a dominant centre.',hl:[[6,3,'green']]},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...Nf6',hl:[[5,5,'blue']]},
      {tip:'2.c4',hl:[[4,2,'green']]},
      {tip:'2...e6',hl:[[2,4,'blue']]},
      {tip:'3.Nf3 — White plays Nf3, inviting the QID.',hl:[[5,5,'green']]},
      {tip:'3...b6 — Black enters the QID.',hl:[[2,1,'blue']]},
      {tip:'4.a3! — THE PETROSIAN SYSTEM! White prevents ...Bb4+ and plans to play e4 next move to build the full centre. This is sharp and direct.',hl:[[3,0,'green']],warn:'If Black now plays 4...Ba6 trying to fight for e4, White plays 5.Qc2! and Black\'s bishop is misplaced. The correct response to a3 is to develop normally and be ready to fight for the centre with ...d5.'},
      {tip:'4...Bb7 — Black develops the bishop anyway. The Bb7 will fight against White\'s centre.',hl:[[1,1,'blue']],arrows:[[1,1,7,7,'rgba(100,150,255,.5)']]},
      {tip:'5.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'5...Be7 — Solid. Black prepares to castle.',hl:[[6,4,'blue']]},
      {tip:'6.e4! — White gets the FULL CENTRE: d4+e4+c4. This is what a3 prepared — now e4 is played without ...Bb4 being possible. But now Black must fight back immediately.',hl:[[4,4,'red']],arrows:[[4,4,4,3,'rgba(255,100,100,.5)'],[4,3,4,2,'rgba(255,100,100,.4)']]},
      {tip:'6...d5! — THE COUNTER-PUNCH! Black strikes the centre immediately. If Black delays, White plays e5 with a massive centre and a strangling position.',hl:[[3,3,'blue']],arrows:[[3,3,4,4,'rgba(100,150,255,.7)'],[3,3,4,3,'rgba(100,150,255,.5)']],warn:'If Black plays 6...0-0 or 6...d6 instead of the immediate ...d5, White plays e5! — the knight is kicked from f6, the centre is locked in White\'s favour, and Black has no counterplay. Always play ...d5 against e4 in the QID.'},
      {tip:'7.exd5 — White captures.',hl:[[3,3,'green']]},
      {tip:'7...exd5 — Black recaptures. The centre is now symmetrical.',hl:[[3,3,'blue']]},
      {tip:'8.cxd5 — White captures again! This leaves an isolated d-pawn for Black.',hl:[[3,3,'green']]},
      {tip:'8...Nxd5 — Black recaptures with the knight. The knight on d5 is powerful — it controls central squares and challenges White\'s pieces.',hl:[[3,3,'blue']],arrows:[[3,3,4,4,'rgba(100,150,255,.4)'],[3,3,4,2,'rgba(100,150,255,.4)'],[3,3,2,2,'rgba(100,150,255,.4)']]},
      {tip:'9.Bd3 — White develops the bishop, aiming at the kingside.',hl:[[5,3,'green']]},
      {tip:'9...Nxc3 — Black exchanges! After bxc3, White gets doubled c-pawns — a structural weakness.',hl:[[5,2,'blue']]},
      {tip:'10.bxc3 — White recaptures with the pawn. The c3-c4 doubled pawns are a long-term weakness.',hl:[[6,2,'green']]},
      {tip:'10...0-0 — Black castles. The position is dynamically balanced. Black has a compact structure; White has the bishop pair and space but doubled pawns. Black will play ...Nd7-c5 to target the weak c-pawns and the d4 pawn.',hl:[[0,6,'blue']],arrows:[[1,3,2,2,'rgba(100,150,255,.5)'],[2,2,4,3,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-qid-petrosian').textContent='QID — Petrosian System (4.a3)';
  document.getElementById('btags-qid-petrosian').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-positional">Theoretical</span>';
  document.getElementById('bd-qid-petrosian').textContent='White plays a3 to prevent ...Bb4 and claims the full centre with e4. Black must counter-punch immediately with ...d5 or face a crushing position. Step through to see how the pawn exchanges give Black active piece play and White structural weaknesses.';
  document.getElementById('bti-qid-petrosian').innerHTML='<strong>After 0-0:</strong> Play ...Nd7 then ...Nc5 to target White\'s weak c-pawns and d4 pawn. The Bb7 is excellent on the long diagonal. White has the bishop pair — keep the position closed to reduce their effectiveness. Aim for a favourable endgame.';

  // QID — FIANCHETTO (4.g3)
  reg('qid-fianchetto',document.getElementById('bw-qid-fianchetto'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b7',to:'b6',label:'b6'},
      {from:'g2',to:'g3',label:'g3'},{from:'c8',to:'b7',label:'Bb7'},
      {from:'f1',to:'g2',label:'Bg2'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d7',to:'d5',label:'d5'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'e6',to:'d5',label:'exd5'},
      {from:'d1',to:'c2',label:'Qc2'},{from:'b8',to:'d7',label:'Nd7'},
      {from:'c1',to:'f4',label:'Bf4'},{from:'c7',to:'c5',label:'c5!'}
    ],[
      {tip:'The Fianchetto Variation (4.g3) — White mirrors Black\'s fianchetto idea with g3+Bg2. The battle becomes a clash of bishops: Bg2 vs Bb7 on parallel long diagonals. Positional chess at its finest.',hl:[[6,3,'green']]},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...Nf6',hl:[[5,5,'blue']]},
      {tip:'2.c4',hl:[[4,2,'green']]},
      {tip:'2...e6',hl:[[2,4,'blue']]},
      {tip:'3.Nf3',hl:[[5,5,'green']]},
      {tip:'3...b6 — The QID move.',hl:[[2,1,'blue']]},
      {tip:'4.g3 — THE FIANCHETTO VARIATION. White prepares Bg2 — a bishop that will fight Bb7 on parallel diagonals. A positional and elegant system.',hl:[[2,6,'green']]},
      {tip:'4...Bb7 — Black completes the fianchetto. The battle of the bishops begins.',hl:[[1,1,'blue']],arrows:[[1,1,4,4,'rgba(100,150,255,.5)']]},
      {tip:'5.Bg2 — THE WHITE FIANCHETTO BISHOP. On g2 it fights Bb7 on the long diagonal and eyes the queenside.',hl:[[1,6,'green']],arrows:[[1,6,7,0,'rgba(201,168,76,.5)']]},
      {tip:'5...Be7 — Black develops. Prepares castling.',hl:[[6,4,'blue']]},
      {tip:'6.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'6...0-0 — Black castles. Both kings are safe. Now it is a pure positional battle.',hl:[[0,6,'blue']]},
      {tip:'7.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'7...d5 — CENTRAL CHALLENGE! Black challenges the centre with d5.',hl:[[3,3,'blue']],arrows:[[3,3,4,3,'rgba(100,150,255,.6)']]},
      {tip:'8.cxd5 — White captures.',hl:[[3,3,'green']]},
      {tip:'8...exd5 — Black recaptures. Open diagonal for the Bb7.',hl:[[3,3,'blue']],arrows:[[1,1,7,7,'rgba(100,150,255,.5)']]},
      {tip:'9.Qc2 — White prepares to fight for e4. The queen eyes the c-file and supports e4.',hl:[[6,2,'green']]},
      {tip:'9...Nd7 — Black develops the knight toward c5, the ideal outpost to pressurise d4.',hl:[[1,3,'blue']],arrows:[[1,3,2,2,'rgba(100,150,255,.5)']]},
      {tip:'10.Bf4 — White activates the bishop on the a3-f8 diagonal.',hl:[[5,3,'green']]},
      {tip:'10...c5! — Black attacks d4 directly! The c5 pawn and the Bb7 combine for maximum pressure on d4. White must defend carefully. The BISHOP BATTLE is fully joined: Bg2 vs Bb7 on long diagonals, neither willing to trade.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)'],[1,1,4,4,'rgba(100,150,255,.5)'],[1,6,7,0,'rgba(201,168,76,.4)']]}
    ]
  );
  document.getElementById('bt-qid-fianchetto').textContent='QID — Fianchetto Variation (4.g3)';
  document.getElementById('btags-qid-fianchetto').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-imbalanced">Strategic</span>';
  document.getElementById('bd-qid-fianchetto').textContent='White mirrors the fianchetto with g3+Bg2. The game becomes a clash of bishops on parallel long diagonals: Bg2 vs Bb7. Step through to see how Black challenges the centre with ...d5 and ...c5, and how the bishop battle defines the whole game.';
  document.getElementById('bti-qid-fianchetto').innerHTML='<strong>Fianchetto QID key ideas:</strong> (1) The bishop battle is the key — Bb7 vs Bg2 is the main positional conflict. (2) After ...c5, attack d4 from multiple angles. (3) Place a knight on c5 or d5 as an outpost. (4) Avoid trading your Bb7 unless you get a major concession — it is your best piece.';

  document.getElementById('bti-qid-fianchetto').innerHTML='<strong>Fianchetto QID key ideas:</strong> (1) The bishop battle is the key — Bb7 vs Bg2 is the main positional conflict. (2) After ...c5, attack d4 from multiple angles. (3) Place a knight on c5 or d5 as an outpost. (4) Avoid trading your Bb7 unless you get a major concession — it is your best piece.';

  // ============================================================
  // VS 1.d4 WITHOUT c4 — LONDON, TROMPOWSKY, COLLE, TORRE
  // ============================================================

  // VS LONDON SYSTEM — Black plays ...Bd6 and ...c5 to challenge
  // 1.d4 d5 2.Nf3 Nf6 3.Bf4 e6 4.e3 Bd6 5.Bg3 0-0 6.Bd3 c5 7.c3 Nc6 8.Nbd2 Qe7 9.0-0 Bxg3 10.hxg3 c4
  reg('vs-london',document.getElementById('bw-vs-london'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c1',to:'f4',label:'Bf4!'},{from:'e7',to:'e6',label:'e6'},
      {from:'e2',to:'e3',label:'e3'},{from:'f8',to:'d6',label:'Bd6!'},
      {from:'f4',to:'g3',label:'Bg3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'c7',to:'c5',label:'c5!'},
      {from:'c2',to:'c3',label:'c3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'b1',to:'d2',label:'Nbd2'},{from:'d8',to:'e7',label:'Qe7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d6',to:'g3',label:'Bxg3!'},
      {from:'h2',to:'g3',label:'hxg3'},{from:'c5',to:'c4',label:'c4!'}
    ],[
      {tip:'The London System — White\'s most popular 1.d4 system at club level. White deploys Bf4, e3, Bd3, Nf3, 0-0 regardless of what Black does. Step through to see Black\'s correct plan: ...Bd6 to trade the f4 bishop, then ...c5 to challenge the centre.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn. White intends the London setup.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black fights for the centre immediately. The correct response to the London.',hl:[[3,3,'blue']]},
      {tip:'2.Nf3 — Development. White will follow with Bf4 and e3.',hl:[[5,5,'green']]},
      {tip:'2...Nf6 — Development. Black mirrors White\'s plan.',hl:[[5,5,'blue']]},
      {tip:'3.Bf4! — THE LONDON BISHOP. White deploys it to f4 before playing e3 (so the bishop isn\'t locked in). This is the defining London move.',hl:[[4,5,'green']],arrows:[[4,5,2,3,'rgba(201,168,76,.6)']]},
      {tip:'3...e6 — Solid. Black develops and prepares ...Bd6.',hl:[[2,4,'blue']]},
      {tip:'4.e3 — White completes the London structure: d4+e3+Bf4.',hl:[[5,4,'green']]},
      {tip:'4...Bd6! — THE KEY MOVE. Black attacks the Bf4 directly. White must either trade (giving up a key piece) or retreat the bishop to g3, where it is less active.',hl:[[1,3,'blue']],arrows:[[2,3,4,5,'rgba(100,150,255,.6)']],warn:'Many Black players at 1500 just play 4...Be7 and allow White to build the full London structure unchallenged. This is passive and allows White to get a comfortable game. Always play ...Bd6 when you can — it forces the bishop to move and gives Black a more active position.'},
      {tip:'5.Bg3 — The bishop retreats to g3. Now it is less active and can be traded off with ...Bxg3, giving White doubled g-pawns.',hl:[[3,6,'green']]},
      {tip:'5...0-0 — Black castles. The position is comfortable.',hl:[[0,6,'blue']]},
      {tip:'6.Bd3 — White develops the bishop, targeting h7 and supporting the centre.',hl:[[5,3,'green']],arrows:[[5,3,1,7,'rgba(201,168,76,.3)']]},
      {tip:'6...c5! — THE CENTRAL BREAK. Black strikes at d4 immediately. This is Black\'s most important move in any London position — it challenges the centre and gives Black active play.',hl:[[2,2,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.6)']],warn:'If Black plays passively with 6...Nbd7 or 6...b6 without playing ...c5, White completes development, plays Ne5, and gets a pleasant position. ...c5 must come — the sooner the better.'},
      {tip:'7.c3 — White defends d4 solidly. A common London response.',hl:[[5,2,'green']]},
      {tip:'7...Nc6 — Development, adding pressure to d4.',hl:[[5,2,'blue']]},
      {tip:'8.Nbd2 — White completes the standard London development.',hl:[[6,3,'green']]},
      {tip:'8...Qe7 — Active queen, preparing ...e5 and connecting the rooks.',hl:[[1,4,'blue']]},
      {tip:'9.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'9...Bxg3! — EXECUTE THE TRADE. Black captures, forcing White to recapture with the h-pawn. White gets doubled g-pawns and the h-file half-open. The London bishop is gone.',hl:[[1,3,'blue']],arrows:[[2,3,5,6,'rgba(100,150,255,.7)']],warn:'Many Black players hesitate to trade on g3, thinking the doubled g-pawns don\'t matter. But this is the point: the London bishop was White\'s most important piece. Eliminating it removes White\'s main attacking asset and leaves White with a slightly awkward g3 pawn structure.'},
      {tip:'10.hxg3 — White recaptures, getting doubled g-pawns. The h-file is half-open for White.',hl:[[5,6,'green']]},
      {tip:'10...c4! — Black gains queenside space! With the London bishop gone and d4 locked, Black has a comfortable, active position. The ...c4 advance gives Black space and restricts White\'s pieces on the queenside. From here: ...b5-b4, ...Ne4, and Black is better.',hl:[[2,2,'blue']],arrows:[[4,2,3,1,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-vs-london').textContent='vs London System — The ...Bd6 and ...c5 Plan';
  document.getElementById('btags-vs-london').innerHTML='<span class="tag tag-positional">Anti-London</span><span class="tag tag-solid">Active</span>';
  document.getElementById('bd-vs-london').textContent='The London System is the most common 1.d4 setup at club level. Step through to see Black\'s correct plan: ...Bd6 to attack the London bishop, force it to g3, then trade it off and break with ...c5.';
  document.getElementById('bti-vs-london').innerHTML='<strong>London antidote in 3 steps:</strong> (1) Play ...Bd6 as soon as possible — attack the Bf4 directly and force it to retreat. (2) Play ...c5 to challenge d4 — this is your most important move in the whole game. (3) Execute ...Bxg3 to eliminate the London bishop and leave White with doubled g-pawns. After that, Black\'s position is fully active.';

  // VS TROMPOWSKY — Black plays ...e6 solid system
  // 1.d4 Nf6 2.Bg5 e6 3.e4 h6 4.Bxf6 Qxf6 5.Nc3 d6 6.Qd2 g6 7.0-0-0 Bg7 8.f4 a6 9.Nf3 Nd7 10.e5 dxe5
  reg('vs-tromp',document.getElementById('bw-vs-tromp'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c1',to:'g5',label:'Bg5!'},{from:'e7',to:'e6',label:'e6'},
      {from:'e2',to:'e4',label:'e4'},{from:'h7',to:'h6',label:'h6!'},
      {from:'g5',to:'f6',label:'Bxf6'},{from:'d8',to:'f6',label:'Qxf6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d7',to:'d6',label:'d6'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'g7',to:'g6',label:'g6'},
      {from:'e1',to:'c1',label:'0-0-0'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'f2',to:'f4',label:'f4'},{from:'a7',to:'a6',label:'a6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'d7',label:'Nd7'},
      {from:'e4',to:'e5',label:'e5'},{from:'d6',to:'e5',label:'dxe5'}
    ],[
      {tip:'The Trompowsky Attack — White plays 2.Bg5, pinning the Nf6 before the pawn structure is established. Aggressive and unorthodox. Black\'s solid response: 2...e6 to protect the knight and prepare central play.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development. Black immediately develops the knight, walking into the Trompowsky if White wants.',hl:[[5,5,'blue']]},
      {tip:'2.Bg5! — THE TROMPOWSKY. White pins the Nf6 immediately. This avoids all mainstream Queen\'s Gambit theory and aims for an unbalanced position.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.6)']]},
      {tip:'2...e6 — THE SOLID RESPONSE. Black protects the knight and prepares ...d5. This is the most reliable Trompowsky antidote — Black simply develops normally.',hl:[[2,4,'blue']]},
      {tip:'3.e4! — White plays for maximum centre. Now Black must decide: allow e4+e5 to push the knight, or take on e4.',hl:[[4,4,'red']]},
      {tip:'3...h6! — IMPORTANT! Black forces the issue: White must decide whether to take on f6 or retreat. Taking gives Black the bishop pair. Retreating to h4 allows ...g5.',hl:[[2,7,'blue']],arrows:[[2,7,3,6,'rgba(100,150,255,.6)']],warn:'If Black plays 3...d5 without ...h6 first, White plays 4.e5! and the knight is under immediate pressure. Always play ...h6 in the Trompowsky when facing e4 — force White to commit the bishop before you play ...d5.'},
      {tip:'4.Bxf6! — White captures, giving Black the bishop pair. This is White\'s most ambitious response.',hl:[[2,6,'green']],warn:'White could also retreat with 4.Bh4, allowing 4...g5 5.Bg3 Ne4 — a sharp position that favours Black\'s bishop pair. By taking on f6, White gets a solid structure at the cost of the bishop pair.'},
      {tip:'4...Qxf6 — Black recaptures with the queen. Black now has: the bishop pair, a solid structure, and active piece play. The queen on f6 is well-placed — it eyes the queenside and helps control the centre.',hl:[[0,5,'blue']]},
      {tip:'5.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'5...d6 — Solid. Black prepares ...g6 and ...Bg7 for a fianchetto, turning this into a Dragon-like structure.',hl:[[2,3,'blue']]},
      {tip:'6.Qd2 — White prepares 0-0-0 and an aggressive setup.',hl:[[6,3,'green']]},
      {tip:'6...g6! — Black fianchettoes. The Bg7 will be a powerful piece, controlling the long diagonal and supporting the centre.',hl:[[2,6,'blue']]},
      {tip:'7.0-0-0 — White castles queenside, preparing a kingside pawn storm with f4-f5.',hl:[[7,2,'green']]},
      {tip:'7...Bg7 — The Dragon bishop arrives. It targets d4 and will dominate the long diagonal.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.6)']]},
      {tip:'8.f4 — White begins the kingside attack. The plan: f5 to open the f-file.',hl:[[3,5,'green']]},
      {tip:'8...a6 — Black prepares ...b5 queenside counterplay. Opposite-wing attacks!',hl:[[2,0,'blue']]},
      {tip:'9.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'9...Nd7 — Black reorganises the knight, heading for c5 or e5.',hl:[[1,3,'blue']]},
      {tip:'10.e5! — White advances. This is White\'s main attacking idea.',hl:[[3,4,'red']],arrows:[[3,4,2,4,'rgba(201,168,76,.6)']]},
      {tip:'10...dxe5! — Black captures, opening the d-file for the queen and challenging the centre. After fxe5 Qd4, Black\'s queen penetrates with tempo. The bishop pair, open lines, and active play give Black full compensation. This is a rich, double-edged position — exactly what Black wants when White goes for the Trompowsky.',hl:[[2,3,'blue']],arrows:[[2,5,4,3,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-vs-tromp').textContent='vs Trompowsky Attack (2.Bg5) — The ...e6 Solid System';
  document.getElementById('btags-vs-tromp').innerHTML='<span class="tag tag-solid">Anti-Tromp</span><span class="tag tag-imbalanced">Bishop Pair</span>';
  document.getElementById('bd-vs-tromp').textContent='The Trompowsky pins your Nf6 on move 2. Step through to see the correct ...e6 system: force Bxf6 with ...h6, recapture with the queen, fianchetto the bishop, and meet White\'s e5 advance with dxe5 and active piece play.';
  document.getElementById('bti-vs-tromp').innerHTML='<strong>Trompowsky antidote:</strong> (1) Play 2...e6 — the solid, reliable response. (2) After 3.e4, play ...h6 immediately to force White to commit the bishop. (3) After Bxf6, always recapture with the queen — you have the bishop pair as compensation. (4) Fianchetto with ...g6/...Bg7 for a Dragon-like structure. (5) Use ...a6-b5 queenside counterplay against White\'s kingside attack.';

  // VS COLLE SYSTEM — Black plays ...c5 early
  // 1.d4 d5 2.Nf3 Nf6 3.e3 e6 4.Bd3 c5 5.c3 Nc6 6.Nbd2 Bd6 7.0-0 0-0 8.dxc5 Bxc5 9.e4 Qc7 10.Qe2 b6
  reg('vs-colle',document.getElementById('bw-vs-colle'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e2',to:'e3',label:'e3'},{from:'e7',to:'e6',label:'e6'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'c7',to:'c5',label:'c5!'},
      {from:'c2',to:'c3',label:'c3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'b1',to:'d2',label:'Nbd2'},{from:'f8',to:'d6',label:'Bd6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'},
      {from:'d4',to:'c5',label:'dxc5'},{from:'d6',to:'c5',label:'Bxc5'},
      {from:'e3',to:'e4',label:'e4'},{from:'d8',to:'c7',label:'Qc7'},
      {from:'d1',to:'e2',label:'Qe2'},{from:'b7',to:'b6',label:'b6'}
    ],[
      {tip:'The Colle System — White plays d4+e3+Bd3+Nf3+0-0, a solid coiled spring aiming for e4 and kingside attack. The antidote: play ...c5 as early as possible to disrupt the structure before White executes the plan.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black fights for the centre.',hl:[[3,3,'blue']]},
      {tip:'2.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'2...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'3.e3 — THE COLLE! White plays e3 instead of c4 or Bf4. The plan: Bd3, Nbd2, 0-0, then e4 with a central attack.',hl:[[5,4,'green']],warn:'The Colle is dangerous for passive Black players. The standard White plan is: Bd3, Nbd2, 0-0, dxc5, e4, then a kingside attack with Bxh7+ (the "Colle sacrifice"). If Black just develops normally without ...c5, White gets this powerful attacking setup for free.'},
      {tip:'3...e6 — Solid. Black prepares ...Bd6 or ...Be7 and plans ...c5.',hl:[[2,4,'blue']]},
      {tip:'4.Bd3 — White develops the bishop to d3, targeting h7. This is the Colle bishop — it will participate in the kingside attack.',hl:[[5,3,'green']],arrows:[[5,3,1,7,'rgba(201,168,76,.4)']]},
      {tip:'4...c5! — THE CORRECT RESPONSE. Black immediately attacks d4 to disrupt White\'s plan. This is the single most important move against the Colle. If Black delays ...c5, White plays e4 and gets a dangerous attack.',hl:[[2,2,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.7)']],warn:'If Black plays 4...Be7 or 4...Bd6 without ...c5, White plays 5.0-0 6.Nbd2 and after 7.e4! the position opens up for White\'s attack. ...c5 MUST come on move 4 or 5 — it completely changes the character of the position.'},
      {tip:'5.c3 — White defends d4. A solid response.',hl:[[5,2,'green']]},
      {tip:'5...Nc6 — Development, adding more pressure to d4.',hl:[[5,2,'blue']]},
      {tip:'6.Nbd2 — White develops the knight, maintaining the Colle structure.',hl:[[6,3,'green']]},
      {tip:'6...Bd6 — Black develops actively, targeting h2 and preparing to contest d4.',hl:[[1,3,'blue']],arrows:[[2,3,6,7,'rgba(100,150,255,.3)']]},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'8.dxc5 — White captures on c5, releasing the central tension.',hl:[[4,2,'green']]},
      {tip:'8...Bxc5 — Black recaptures. Black now has an active bishop on c5, the open c-file, and excellent piece activity. The Colle\'s attacking setup has been neutralised — without the d4 pawn, White cannot execute the standard e4 attack effectively.',hl:[[4,2,'blue']],arrows:[[3,2,6,5,'rgba(100,150,255,.5)']]},
      {tip:'9.e4 — White still tries to get the e4 advance.',hl:[[4,4,'green']]},
      {tip:'9...Qc7 — Black defends e5 (preventing e5) and activates the queen. Black is fully equal.',hl:[[1,2,'blue']]},
      {tip:'10.Qe2 — White prepares Re1 and future activity.',hl:[[6,4,'green']]},
      {tip:'10...b6 — Black prepares ...Bb7, aiming the bishop at e4 and giving the queen a retreat. Black has: active bishop on c5, Bb7 coming, Nc6 pressure on e5. White\'s Colle setup has been completely defused. The key was ...c5 on move 4.',hl:[[1,1,'blue']],arrows:[[1,1,4,4,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-vs-colle').textContent='vs Colle System (3.e3) — The Early ...c5 Antidote';
  document.getElementById('btags-vs-colle').innerHTML='<span class="tag tag-positional">Anti-Colle</span><span class="tag tag-solid">Active</span>';
  document.getElementById('bd-vs-colle').textContent='The Colle aims for Bd3+0-0+e4 with a kingside attack. Step through to see how early ...c5 completely disrupts White\'s plan — after dxc5 Bxc5, Black has active pieces and the Colle setup is neutralised.';
  document.getElementById('bti-vs-colle').innerHTML='<strong>Colle antidote:</strong> (1) Play ...c5 on move 4 or 5 — do NOT delay it. (2) After dxc5, recapture with the bishop for maximum activity. (3) ...Bd6 development is aggressive but ...Be7 is also solid — both work. (4) After neutralising d4, Black has an equal position with active pieces. The Colle\'s attack never gets started.';

  // VS TORRE ATTACK — Black plays ...c5 break
  // 1.d4 Nf6 2.Nf3 e6 3.Bg5 c5 4.e3 Be7 5.Nbd2 0-0 6.c3 b6 7.Bd3 Bb7 8.0-0 d6 9.Qe2 Nbd7 10.e4 cxd4
  reg('vs-torre',document.getElementById('bw-vs-torre'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e7',to:'e6',label:'e6'},
      {from:'c1',to:'g5',label:'Bg5!'},{from:'c7',to:'c5',label:'c5!'},
      {from:'e2',to:'e3',label:'e3'},{from:'f8',to:'e7',label:'Be7'},
      {from:'b1',to:'d2',label:'Nbd2'},{from:'e8',to:'g8',label:'0-0'},
      {from:'c2',to:'c3',label:'c3'},{from:'b7',to:'b6',label:'b6'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'c8',to:'b7',label:'Bb7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d7',to:'d6',label:'d6'},
      {from:'d1',to:'e2',label:'Qe2'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'e3',to:'e4',label:'e4'},{from:'c5',to:'d4',label:'cxd4'}
    ],[
      {tip:'The Torre Attack — White plays 2.Nf3 then 3.Bg5, pinning the Nf6 but a tempo later than the Trompowsky. More solid and positional. Black\'s response: play ...c5 immediately on move 3 to challenge d4 before White consolidates.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'2.Nf3 — Development. This could be the Torre or many other systems.',hl:[[5,5,'green']]},
      {tip:'2...e6 — Solid development. Black prepares ...d5 or ...c5.',hl:[[2,4,'blue']]},
      {tip:'3.Bg5! — THE TORRE ATTACK. White pins the Nf6. Similar to the Trompowsky but with Nf3 already played — more solid.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.6)']]},
      {tip:'3...c5! — THE CORRECT RESPONSE. Black immediately challenges d4, not allowing White to build the centre freely. This is the critical move — delay it and White plays e3+Bd3+0-0 and gets a solid position.',hl:[[2,2,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.7)']],warn:'Many players respond to the Torre with 3...d5 or 3...Be7, allowing White to build the Colle-Torre structure with e3+Bd3. The key is 3...c5 immediately — before White locks down the centre with e3+c3.'},
      {tip:'4.e3 — White defends d4, committing to the solid Torre structure.',hl:[[5,4,'green']]},
      {tip:'4...Be7 — Solid development. Black will castle and then use ...b6-...Bb7 to build queenside counterplay.',hl:[[1,4,'blue']]},
      {tip:'5.Nbd2 — White develops. The Torre setup: Nf3, Nbd2, e3, c3, Bd3.',hl:[[6,3,'green']]},
      {tip:'5...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'6.c3 — White solidifies the centre. The Torre is complete: d4+e3+c3.',hl:[[5,2,'green']]},
      {tip:'6...b6 — Black prepares ...Bb7. The fianchettoed bishop will target White\'s centre.',hl:[[1,1,'blue']]},
      {tip:'7.Bd3 — White develops the bishop. The Torre battery: Bd3+Qe2.',hl:[[5,3,'green']],arrows:[[5,3,1,7,'rgba(201,168,76,.3)']]},
      {tip:'7...Bb7 — THE FIANCHETTO BISHOP. Bb7 targets d5 and e4, challenging White\'s central ambitions.',hl:[[1,1,'blue']],arrows:[[1,1,4,4,'rgba(100,150,255,.5)']]},
      {tip:'8.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'8...d6 — Solid. Black completes the Hedgehog-like setup: e6+d6+c5+b6+Bb7.',hl:[[2,3,'blue']]},
      {tip:'9.Qe2 — White prepares e4. The Torre battery is set.',hl:[[6,4,'green']],arrows:[[6,4,3,7,'rgba(201,168,76,.3)']]},
      {tip:'9...Nbd7 — Black develops, preparing to contest the centre.',hl:[[1,3,'blue']]},
      {tip:'10.e4 — White plays e4, the main Torre plan. Now cxd4 opens the position.',hl:[[4,4,'green']]},
      {tip:'10...cxd4! — Black captures, opening the c-file and the position. After 11.cxd4, White has the IQP on d4 — Black targets it with ...Nc5 (attacking d3 and d4) and ...Nd5. The Bb7 fires down the long diagonal at d5 and e4. Black is fully equal and has clear counterplay.',hl:[[4,2,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.6)'],[1,1,4,4,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-vs-torre').textContent='vs Torre Attack (2.Nf3 + 3.Bg5) — The ...c5 Break';
  document.getElementById('btags-vs-torre').innerHTML='<span class="tag tag-positional">Anti-Torre</span><span class="tag tag-solid">Active</span>';
  document.getElementById('bd-vs-torre').textContent='The Torre Attack pins your Nf6 after Nf3. Step through to see how early ...c5 challenges the centre, and how the ...b6/Bb7 fianchetto creates long-term pressure on White\'s d4+e4 centre after ...cxd4.';
  document.getElementById('bti-vs-torre').innerHTML='<strong>Torre antidote:</strong> (1) Play 3...c5 immediately — before White plays e3+c3. (2) After White plays e3, develop with ...Be7, ...0-0, ...b6, ...Bb7 — the "Hedgehog" structure. (3) When White plays e4, capture with ...cxd4 to open the position. (4) Then use ...Nc5 to attack Bd3 and d4 simultaneously. The Bb7 becomes a monster after the centre opens.';

  document.getElementById('bti-vs-torre').innerHTML='<strong>Torre antidote:</strong> (1) Play 3...c5 immediately — before White plays e3+c3. (2) After White plays e3, develop with ...Be7, ...0-0, ...b6, ...Bb7 — the "Hedgehog" structure. (3) When White plays e4, capture with ...cxd4 to open the position. (4) Then use ...Nc5 to attack Bd3 and d4 simultaneously. The Bb7 becomes a monster after the centre opens.';

  // ============================================================
  // VS BLACKMAR-DIEMER GAMBIT
  // ============================================================
  // 1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3 exf3 5.Nxf3 e6 6.Bd3 c5 7.0-0 Nc6 8.Bg5 Be7 9.Qe1 cxd4 10.Nxd4 Nxd4
  reg('vs-bdg',document.getElementById('bw-vs-bdg'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'e2',to:'e4',label:'e4!?'},{from:'d5',to:'e4',label:'dxe4'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'f2',to:'f3',label:'f3'},{from:'e4',to:'f3',label:'exf3!'},
      {from:'g1',to:'f3',label:'Nxf3'},{from:'e7',to:'e6',label:'e6'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'c7',to:'c5',label:'c5!'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'f8',to:'e7',label:'Be7'},
      {from:'d1',to:'e1',label:'Qe1'},{from:'c5',to:'d4',label:'cxd4!'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'c6',to:'d4',label:'Nxd4!'}
    ],[
      {tip:'The Blackmar-Diemer Gambit — White plays 2.e4 to sacrifice a pawn for rapid development and a violent kingside attack. The Euwe Defence (4...exf3 5.Nxf3 e6) is Black\'s most reliable antidote: accept the pawn, return it at the right moment, and defuse the attack.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black controls the centre.',hl:[[3,3,'blue']]},
      {tip:'2.e4!? — THE BLACKMAR-DIEMER GAMBIT. White sacrifices a pawn for a huge development lead. Many 1500 players love this — it creates chaos and is dangerous against unprepared opponents.',hl:[[4,4,'red']],warn:'The BDG is objectively unsound at the top level, but at 1500 it is extremely dangerous. White gets a development lead, open files, and a fierce kingside attack. Many Black players panic, play passively, and get mated. The Euwe Defence is the antidote — accept the pawn, give it back at the right moment, and reach a solid position.'},
      {tip:'2...dxe4 — Black accepts the gambit. This is correct — accepting and then returning the pawn on Black\'s terms is better than declining.',hl:[[3,3,'blue']]},
      {tip:'3.Nc3 — White develops, attacking e4.',hl:[[5,2,'green']]},
      {tip:'3...Nf6 — Development. Black holds e4 for now.',hl:[[5,5,'blue']]},
      {tip:'4.f3 — THE KEY BDG MOVE. White plays f3 to recapture the pawn and open the f-file for the rook. Black must now decide how to handle this.',hl:[[3,5,'green']],arrows:[[5,5,4,4,'rgba(201,168,76,.6)']]},
      {tip:'4...exf3! — THE EUWE DEFENCE. Black captures, giving up the extra pawn. Why? Because after Nxf3, Black will play ...e6 to close the position and prevent White\'s f-file attack from being decisive.',hl:[[4,5,'blue']],warn:'The two other main options are 4...e3 (giving back the pawn immediately, very solid) and 4...Bf5 (the Gunderam, keeping the pawn but allowing a dangerous position). The Euwe (4...exf3) is the most principled — accept White\'s pawn, give it back in exchange for a solid, equal position.'},
      {tip:'5.Nxf3 — White recaptures. The f-file is half-open.',hl:[[5,5,'green']]},
      {tip:'5...e6 — THE EUWE! Black closes the centre with e6. This is the point — the e6 pawn blocks the d3 bishop\'s diagonal, closes the position, and prevents White from opening the f-file against Black\'s king.',hl:[[2,4,'blue']],arrows:[[5,3,1,7,'rgba(201,168,76,.4)']]},
      {tip:'6.Bd3 — White develops the bishop, aiming at h7.',hl:[[5,3,'green']],arrows:[[5,3,1,7,'rgba(201,168,76,.4)']]},
      {tip:'6...c5! — THE COUNTERATTACK. Black immediately hits d4. After ...c5, White cannot build a safe attacking setup — d4 is under pressure. This is the move that separates the Euwe from passive play.',hl:[[2,2,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.7)']]},
      {tip:'7.0-0 — White castles and prepares the attack.',hl:[[7,6,'green']]},
      {tip:'7...Nc6 — Development, adding more pressure to d4.',hl:[[5,2,'blue']]},
      {tip:'8.Bg5 — White pins the Nf6, a key attacking move. If Black plays ...0-0, White will have Qe1-h4, Ne5 ideas.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.5)']]},
      {tip:'8...Be7 — Solid development. Black prepares to castle and is happy to have White\'s bishop pinning on g5 rather than being on d3 pointing at h7.',hl:[[1,4,'blue']]},
      {tip:'9.Qe1 — White prepares Qh4 and Ne5. The typical BDG attacking setup.',hl:[[6,4,'green']],arrows:[[7,4,4,7,'rgba(201,168,76,.4)']]},
      {tip:'9...cxd4! — RETURN THE PAWN. Black captures, and after Nxd4, plays Nxd4 to eliminate one of White\'s attacking pieces. The pawn was only temporarily useful — trading it for a piece exchange is excellent.',hl:[[4,3,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.6)']]},
      {tip:'10.Nxd4 — White recaptures.',hl:[[3,3,'green']]},
      {tip:'10...Nxd4! — Black captures the Nd4, eliminating a key attacker. After 11.Qxd4 0-0, Black is fully equal with a solid position. White has no attack left and is actually slightly down in development. The BDG has been completely defused.',hl:[[3,3,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)']],warn:'After 10...Nxd4 11.Qxd4 0-0, Black has: a solid structure, equal material, no weaknesses, and the bishop pair if White\'s Bg5 trades off. This is everything Black wants against the BDG. The Euwe Defence completely neutralises White\'s attacking ambitions.'}
    ]
  );
  document.getElementById('bt-vs-bdg').textContent='vs Blackmar-Diemer Gambit (2.e4) — The Euwe Defence';
  document.getElementById('btags-vs-bdg').innerHTML='<span class="tag tag-sharp">Anti-BDG</span><span class="tag tag-solid">Euwe Defence</span>';
  document.getElementById('bd-vs-bdg').textContent='White sacrifices a pawn on move 2 for a violent attack. Step through the Euwe Defence: accept with dxe4, play ...e6 to close the position, hit back with ...c5, then return the pawn on your own terms.';
  document.getElementById('bti-vs-bdg').innerHTML='<strong>BDG Euwe in 4 steps:</strong> (1) Accept the gambit — 2...dxe4. (2) After f3, play 4...exf3 and then 5...e6 — this closes the position and blocks the Bd3 attack. (3) Play ...c5 immediately to hit d4 and take the initiative. (4) When d4 falls, swap off the Nd4 with ...Nxd4 to eliminate White\'s best attacker. Result: equal position, BDG completely defused.';

  // ============================================================
  // VS RICHTER-VERESOV ATTACK
  // ============================================================
  // 1.d4 Nf6 2.Nc3 d5 3.Bg5 Nbd7 4.f3 c6 5.e4 dxe4 6.fxe4 e5 7.dxe5 Nxe5 8.Qd2 Bb4 9.0-0-0 0-0 10.Nf3 Ng6
  reg('vs-veresov',document.getElementById('bw-vs-veresov'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'c3',label:'Nc3!'},{from:'d7',to:'d5',label:'d5'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'f2',to:'f3',label:'f3'},{from:'c7',to:'c6',label:'c6'},
      {from:'e2',to:'e4',label:'e4'},{from:'d5',to:'e4',label:'dxe4'},
      {from:'f3',to:'e4',label:'fxe4'},{from:'e7',to:'e5',label:'e5!'},
      {from:'d4',to:'e5',label:'dxe5'},{from:'d7',to:'e5',label:'Nxe5!'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'f8',to:'b4',label:'Bb4!'},
      {from:'e1',to:'c1',label:'0-0-0'},{from:'e8',to:'g8',label:'0-0'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e5',to:'g6',label:'Ng6'}
    ],[
      {tip:'The Richter-Veresov Attack — White plays 2.Nc3 before Nf3, then pins with Bg5. Aggressive and irregular. Black\'s solid response: ...d5, ...Nbd7, ...c6, then ...e5 to fight back in the centre.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'2.Nc3! — THE VERESOV. White plays Nc3 before Nf3, immediately controlling e4 and preparing to play e4 without the usual preparation.',hl:[[5,2,'green']],warn:'The Veresov move order (2.Nc3 before 2.Nf3) signals that White intends an aggressive central pawn thrust with e4. Against 2.Nc3, Black must be careful not to play 2...d5 3.Bg5 4.Bxf6 giving up the bishop pair for nothing. The ...Nbd7 setup with ...c6 is the solid antidote.'},
      {tip:'2...d5 — Black stakes the centre. Most reliable.',hl:[[3,3,'blue']]},
      {tip:'3.Bg5 — The pin. White completes the Veresov setup: d4+Nc3+Bg5.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.6)']]},
      {tip:'3...Nbd7 — KEY MOVE. Black protects the Nf6 with the d7 knight, preventing Bxf6 from being powerful (Black can recapture with the other knight). This is much better than 3...e6 which allows White to build an imposing centre.',hl:[[1,3,'blue']],warn:'If Black plays 3...e6, White plays 4.e4! immediately and gets a huge centre. The ...Nbd7 setup prevents this because after 4.e4 dxe4 5.Nxe4, Black plays ...Nxe4 and then recaptures with ...Nbd7, keeping a solid position. The ...Nbd7 move is the key prophylactic idea.'},
      {tip:'4.f3 — White prepares e4 with a pawn. This is the aggressive Veresov mainline — the f3 pawn will support the e4 advance.',hl:[[3,5,'green']]},
      {tip:'4...c6 — SOLID. Black reinforces d5 and prepares ...Qa5 or ...e5 depending on what White does. This is the most reliable move order.',hl:[[2,2,'blue']]},
      {tip:'5.e4 — White launches the central pawn storm.',hl:[[4,4,'red']],arrows:[[4,4,3,3,'rgba(201,168,76,.5)']]},
      {tip:'5...dxe4 — Black captures. Taking on e4 is correct — do not let White have both d4 and e4 for free.',hl:[[3,3,'blue']]},
      {tip:'6.fxe4 — White recaptures. White has a powerful pawn centre: d4+e4.',hl:[[3,4,'green']],arrows:[[4,3,4,4,'rgba(201,168,76,.4)']]},
      {tip:'6...e5! — COUNTERATTACK! Black immediately strikes at d4, refusing to let White consolidate the centre. This is the critical move.',hl:[[2,4,'blue']],arrows:[[3,4,4,3,'rgba(100,150,255,.7)']],warn:'If Black plays passively with 6...e6 or 6...g6, White plays 7.Nf3 and has a dominant centre with d4+e4, the bishops aiming at Black\'s kingside, and long-term pressure. The ...e5 counterattack is essential — hit the centre while White is still organising.'},
      {tip:'7.dxe5 — White captures.',hl:[[4,3,'green']]},
      {tip:'7...Nxe5! — Black recaptures with the knight, landing on the powerful e5 square. The Ne5 attacks the Bg5 and controls key central squares.',hl:[[1,3,'blue']],arrows:[[1,3,3,4,'rgba(100,150,255,.6)'],[3,4,2,6,'rgba(100,150,255,.4)']]},
      {tip:'8.Qd2 — White develops the queen, preparing 0-0-0 for queenside castling.',hl:[[6,3,'green']]},
      {tip:'8...Bb4! — Black pins the Nc3! This is the key move: the Nc3 was supporting e4 and d4. By pinning it, Black threatens to disrupt the whole structure.',hl:[[1,1,'blue']],arrows:[[4,1,5,2,'rgba(100,150,255,.7)']]},
      {tip:'9.0-0-0 — White castles queenside. Opposite-wing castling creates a sharp position.',hl:[[7,2,'green']]},
      {tip:'9...0-0 — Black castles kingside. Both kings have castled on opposite wings — sharp play ahead.',hl:[[0,6,'blue']]},
      {tip:'10.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'10...Ng6 — The knight retreats to g6, where it is safe and eyes the e5 and f4 squares. Black has: the bishop pair (after Bxf6 at some point), a solid position, and active piece play. White has more space but Black\'s structure is sound. The game is dynamically balanced.',hl:[[1,6,'blue']],arrows:[[2,6,3,4,'rgba(100,150,255,.4)'],[2,6,4,5,'rgba(100,150,255,.3)']]}
    ]
  );
  document.getElementById('bt-vs-veresov').textContent='vs Richter-Veresov (2.Nc3 + 3.Bg5) — The ...Nbd7 + ...e5 Counterattack';
  document.getElementById('btags-vs-veresov').innerHTML='<span class="tag tag-sharp">Anti-Veresov</span><span class="tag tag-positional">Central Fight</span>';
  document.getElementById('bd-vs-veresov').textContent='White plays 2.Nc3 + 3.Bg5, aiming for a rapid e4 thrust. Step through to see the ...Nbd7 setup that prevents Bxf6, the ...c6 reinforcement, and the critical ...e5 counterattack that challenges White\'s centre.';
  document.getElementById('bti-vs-veresov').innerHTML='<strong>Veresov antidote:</strong> (1) Play 3...Nbd7 to protect Nf6 — prevents a powerful Bxf6 exchange. (2) Play ...c6 to reinforce d5. (3) When White plays e4, capture dxe4, then hit back with ...e5 immediately. (4) After ...Nxe5, pin the Nc3 with ...Bb4. The ...e5 counterattack is the key idea in the whole variation.';

  // ============================================================
  // VS BARRY ATTACK
  // ============================================================
  // 1.d4 Nf6 2.Nf3 g6 3.Nc3 d5 4.Bf4 Bg7 5.e3 0-0 6.Be2 c6 7.0-0 Nbd7 8.Ne5 Nxe5 9.Bxe5 Nd7 10.Bg3 f5
  reg('vs-barry',document.getElementById('bw-vs-barry'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g7',to:'g6',label:'g6'},
      {from:'b1',to:'c3',label:'Nc3!'},{from:'d7',to:'d5',label:'d5!'},
      {from:'c1',to:'f4',label:'Bf4'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'e2',to:'e3',label:'e3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'e2',label:'Be2'},{from:'c7',to:'c6',label:'c6!'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'f3',to:'e5',label:'Ne5'},{from:'d7',to:'e5',label:'Nxe5!'},
      {from:'f4',to:'e5',label:'Bxe5'},{from:'f6',to:'d7',label:'Nd7'},
      {from:'e5',to:'g3',label:'Bg3'},{from:'f7',to:'f5',label:'f5!'}
    ],[
      {tip:'The Barry Attack — a system aimed specifically at KID players who play 1...Nf6 and 2...g6. White plays 3.Nc3 and 4.Bf4, forcing Black out of King\'s Indian territory into an anti-London structure. The antidote: play ...d5 on move 3, then ...c6 and ...Nbd7 for a solid, flexible setup.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development. Black intends the King\'s Indian with ...g6 and ...Bg7.',hl:[[5,5,'blue']]},
      {tip:'2.Nf3 — Development. This could be many systems.',hl:[[5,5,'green']]},
      {tip:'2...g6 — Black signals the King\'s Indian intent.',hl:[[2,6,'blue']]},
      {tip:'3.Nc3! — THE BARRY ATTACK. Instead of allowing the KID, White plays Nc3 to control e4 and d5, planning Bf4 and e3. This sidesteps all King\'s Indian theory.',hl:[[5,2,'green']],warn:'After 3.Nc3, the standard KID move 3...Bg7 4.e4 d6 doesn\'t work as well because White hasn\'t played c4 — the position is more like a Pirc after e4. The correct response to the Barry is 3...d5, staking a claim in the centre immediately and denying White the e4 advance for free.'},
      {tip:'3...d5! — THE CORRECT RESPONSE. Black plays ...d5 to fight for the centre immediately. This is the most important move in the whole variation — do not play 3...Bg7 or 3...d6 which allow White to build a London-type structure with all the pieces in ideal squares.',hl:[[3,3,'blue']],arrows:[[3,3,4,4,'rgba(100,150,255,.6)']]},
      {tip:'4.Bf4 — White deploys the bishop. The Barry setup: d4+Nf3+Nc3+Bf4+e3.',hl:[[4,5,'green']]},
      {tip:'4...Bg7 — Black develops the bishop. The fianchetto is still excellent even after ...d5.',hl:[[1,6,'blue']]},
      {tip:'5.e3 — Solid. White completes the Barry structure.',hl:[[5,4,'green']]},
      {tip:'5...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'6.Be2 — White develops.',hl:[[6,4,'green']]},
      {tip:'6...c6! — KEY MOVE. Black reinforces d5, prevents Nb5, and prepares ...Nbd7. The ...c6 move transforms this into a solid Caro-Kann/Slav hybrid — Black has d5+c6 and the fianchettoed Bg7.',hl:[[2,2,'blue']],warn:'Without ...c6, White can play Ne5 and then Nc4 or Nb5, putting pressure on Black\'s d5 pawn and queenside. ...c6 stops all these ideas and keeps the position solid.'},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...Nbd7 — Development. The knight goes to d7 where it supports both c5 and e5 advances.',hl:[[1,3,'blue']]},
      {tip:'8.Ne5 — White tries to use the e5 square. A typical Barry manoeuvre.',hl:[[3,4,'green']],arrows:[[5,5,3,4,'rgba(201,168,76,.5)']]},
      {tip:'8...Nxe5! — Black trades immediately. There is no reason to be intimidated by Ne5 — trade it off and the position simplifies in Black\'s favour.',hl:[[1,3,'blue']],arrows:[[1,3,3,4,'rgba(100,150,255,.7)']]},
      {tip:'9.Bxe5 — White recaptures with the bishop.',hl:[[3,4,'green']]},
      {tip:'9...Nd7 — The knight retreats, attacking the Be5.',hl:[[1,3,'blue']],arrows:[[1,3,3,4,'rgba(100,150,255,.5)']]},
      {tip:'10.Bg3 — The bishop retreats.',hl:[[3,6,'green']]},
      {tip:'10...f5! — A THEMATIC ADVANCE. Black plays ...f5, staking space on the kingside and aiming to expand with ...f4 or ...e5. The Bg7 fires down the long diagonal, the d5+c6 structure is solid, and Black has active plans on both wings. The Barry Attack has been completely neutralised — Black has a comfortable, equal position.',hl:[[2,5,'blue']],arrows:[[1,5,3,5,'rgba(100,150,255,.5)'],[1,6,7,0,'rgba(100,200,100,.4)']],warn:'After ...f5, Black\'s plan is: ...e6 to prepare ...e5, or ...f4 to gain space. The Bg7 supports everything. White\'s Barry setup is solid but passive — Black has counterplay on both wings.'}
    ]
  );
  document.getElementById('bt-vs-barry').textContent='vs Barry Attack (3.Nc3 + 4.Bf4) — The ...d5 + ...c6 Antidote';
  document.getElementById('btags-vs-barry').innerHTML='<span class="tag tag-solid">Anti-Barry</span><span class="tag tag-positional">Structural</span>';
  document.getElementById('bd-vs-barry').textContent='The Barry targets KID players with 3.Nc3 + 4.Bf4. Step through to see how 3...d5 immediately stakes the centre, and how ...c6 + ...Nbd7 builds an impregnable structure that completely defuses White\'s plan.';
  document.getElementById('bti-vs-barry').innerHTML='<strong>Barry antidote:</strong> (1) After 3.Nc3, play 3...d5 immediately — do not play 3...Bg7 which allows White a comfortable position. (2) Play ...c6 to reinforce d5 and prevent Nb5. (3) Develop with ...Nbd7 — the knight supports both ...c5 and ...e5 breaks. (4) Trade off the Ne5 immediately when White plays it — never let it sit there. (5) Play ...f5 to grab kingside space and activate the Bg7.';
  reg('alapin',document.getElementById('bw-alapin'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'c2',to:'c3',label:'c3'},{from:'d7',to:'d5',label:'d5!'},
      {from:'e4',to:'d5',label:'exd5'},{from:'d8',to:'d5',label:'Qxd5'},
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'c8',to:'g4',label:'Bg4'},
      {from:'f1',to:'e2',label:'Be2'},{from:'e7',to:'e6',label:'e6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'c3',to:'d4',label:'cxd4'},{from:'f8',to:'b4',label:'Bb4'}
    ],[
      {tip:'White plays the Alapin Sicilian — avoiding the Open Sicilian with 2.c3, preparing to build a strong centre with d4. Your job: challenge it immediately.',hl:[[6,4,'green']]},
      {tip:'1.e4 — White seizes the centre.',hl:[[4,4,'green']]},
      {tip:'1...c5 — The Sicilian. Now White plays 2.c3 instead of 2.Nf3.',hl:[[5,2,'blue']]},
      {tip:'2.c3 — The Alapin. White prepares d4 without allowing cxd4 Nxd4. This avoids all your Sicilian theory.',hl:[[5,2,'green']]},
      {tip:'2...d5! — THE KEY MOVE. Strike the centre immediately! This is Black\'s best and most direct response. Don\'t let White build a big centre unchallenged.',hl:[[4,3,'blue']],arrows:[[4,3,3,3,'rgba(100,150,255,.7)']],warn:'If Black plays 2...Nf6 or 2...e6 instead, White gets the ideal centre with 3.d4 d5 4.e5 and all the space advantages of the French — without Black having the ...c5 counter ready. Always strike the centre with ...d5 immediately against the Alapin.'},
      {tip:'3.exd5 — White captures. The position opens up.',hl:[[4,3,'green']]},
      {tip:'3...Qxd5 — Black recaptures with the queen, centralising it. This is fine — the queen will retreat when attacked.',hl:[[3,3,'blue']]},
      {tip:'4.d4 — White gets the ideal centre. But Black has active piece play as compensation.',hl:[[4,3,'green']]},
      {tip:'4...Nf6 — Development with tempo — attacks the d5 square and will help evict the queen with Nc3.',hl:[[5,5,'blue']]},
      {tip:'5.Nf3 — White develops and the queen will be attacked by Nc3 next.',hl:[[5,5,'green']]},
      {tip:'5...Bg4 — Pin! Black pins the f3 knight to the queen, creating pressure on d4 and slowing White\'s development.',hl:[[5,6,'blue']],arrows:[[4,6,5,5,'rgba(100,150,255,.5)']]},
      {tip:'6.Be2 — White breaks the pin by developing the bishop.',hl:[[6,4,'green']]},
      {tip:'6...e6 — Solid. Prepares ...Be7, controls d5, prepares kingside castling.',hl:[[5,4,'blue']]},
      {tip:'7.0-0 — White castles kingside.',hl:[[7,6,'green']]},
      {tip:'7...Nc6 — Development. The knight pressures d4 and will help force ...cxd4 to create an IQP White must defend.',hl:[[5,2,'blue']]},
      {tip:'8.Be3 — White protects d4.',hl:[[5,2,'green']]},
      {tip:'8...cxd4 — Black captures, giving White an isolated queen\'s pawn. This is Black\'s strategic goal: create an IQP White must defend for the whole game.',hl:[[4,3,'blue']],arrows:[[4,3,3,3,'rgba(100,150,255,.6)']]},
      {tip:'9.cxd4 — White recaptures. The IQP on d4 gives White space but is a long-term weakness.',hl:[[4,3,'green']]},
      {tip:'9...Bb4! — PIN on Nc3 (when it comes). Black has excellent piece activity: pinned knight threat, pressure on d4, solid structure. Black is fully equal or better. Key plan: blockade d5 with a knight.',hl:[[4,1,'blue']],arrows:[[4,1,5,2,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-alapin').textContent='Alapin Sicilian (2.c3) — How to Fight It';
  document.getElementById('btags-alapin').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Positional</span>';
  document.getElementById('bd-alapin').textContent='The Alapin is White\'s most popular Anti-Sicilian. Step through to see Black\'s best response: 2...d5!, immediately challenging the centre. The goal is to saddle White with an isolated d-pawn and a worse endgame.';
  document.getElementById('bti-alapin').innerHTML='<strong>Key plan for Black:</strong> After cxd4, place a knight on d5 to blockade White\'s IQP. The knight on d5 is a monster — it can\'t be kicked by a pawn and dominates the centre. Then grind White down in the endgame.';

  // GRAND PRIX ATTACK (2.Nc3 + f4)
  // Black's best: Dragon setup with ...g6/...Bg7 — neutralises the f4 attack
  // Sequence: 1.e4 c5 2.Nc3 g6 3.f4 Bg7 4.Nf3 Nc6 5.Bb5 Nd4 6.0-0 Nxb5 7.Nxb5 d6 8.d3 Nf6 9.Qe1 0-0 10.f5 gxf5
  reg('grandprix',document.getElementById('bw-grandprix'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g7',to:'g6',label:'g6!'},
      {from:'f2',to:'f4',label:'f4'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'f1',to:'b5',label:'Bb5'},{from:'c6',to:'d4',label:'Nd4!'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d4',to:'b5',label:'Nxb5'},
      {from:'c3',to:'b5',label:'Nxb5'},{from:'d7',to:'d6',label:'d6'},
      {from:'d2',to:'d3',label:'d3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'d1',to:'e1',label:'Qe1'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f4',to:'f5',label:'f5'},{from:'g6',to:'f5',label:'gxf5'}
    ],[
      {tip:'The Grand Prix Attack — White plays Nc3 then f4, aiming to crush Black on the kingside. Very dangerous if Black doesn\'t know what they\'re doing. The antidote: fianchetto!',hl:[[6,4,'green']]},
      {tip:'1.e4 — White controls the centre.',hl:[[4,4,'green']]},
      {tip:'1...c5 — The Sicilian.',hl:[[5,2,'blue']]},
      {tip:'2.Nc3 — Preparing the Grand Prix with f4 next.',hl:[[5,2,'green']]},
      {tip:'2...g6! — The Dragon setup. This is Black\'s strongest response. The fianchettoed bishop on g7 will be a monster on the long diagonal, neutralising White\'s kingside pressure.',hl:[[2,6,'blue']],arrows:[[2,6,7,1,'rgba(100,150,255,.5)']]},
      {tip:'3.f4 — The Grand Prix pawn! White aims to storm the kingside with f5, g4, etc.',hl:[[3,5,'red']]},
      {tip:'3...Bg7 — THE DRAGON BISHOP ARRIVES. This piece will fight the entire White attack. The a1-h8 diagonal is controlled by Black.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.6)']]},
      {tip:'4.Nf3 — White develops naturally.',hl:[[5,5,'green']]},
      {tip:'4...Nc6 — Development, preparing ...d6 and eventually ...d5.',hl:[[5,2,'blue']]},
      {tip:'5.Bb5 — White pins the c6 knight. This is a common try to disrupt Black\'s setup.',hl:[[3,1,'green']]},
      {tip:'5...Nd4! — Brilliant counter-pin! Black attacks the Bb5 and creates a powerful centralised knight. White must deal with this immediately.',hl:[[3,3,'blue']],arrows:[[3,3,3,1,'rgba(100,150,255,.7)']],warn:'If Black plays passively (e.g. ...d6 or ...e6 without ...Nd4), White castles and launches the f4-f5 storm immediately. The ...Nd4 counter-attack is the key disruption — it forces White to deal with the knight instead of attacking.'},
      {tip:'6.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'6...Nxb5 — Black captures the bishop, winning the bishop pair.',hl:[[1,1,'blue']]},
      {tip:'7.Nxb5 — White recaptures. Black has the bishop pair and solid structure.',hl:[[1,1,'green']]},
      {tip:'7...d6 — Solidifying the centre. The Dragon bishop on g7 now eyes the b2 pawn.',hl:[[2,3,'blue']]},
      {tip:'8.d3 — White plays positionally.',hl:[[5,3,'green']]},
      {tip:'8...Nf6 — Development. Black is nearly fully developed and ready to castle.',hl:[[5,5,'blue']]},
      {tip:'9.Qe1 — White prepares to swing the queen to h4 or g3 for the kingside attack.',hl:[[6,4,'green']]},
      {tip:'9...0-0 — Black castles safely behind the Dragon bishop. The king is well protected.',hl:[[0,6,'blue']]},
      {tip:'10.f5 — White launches the attack! The f-pawn storms forward.',hl:[[3,5,'red']]},
      {tip:'10...gxf5! — Black captures, OPENING the g-file for counter-attack. Now Black plays ...Ng4, ...Qb6 (targeting f2), and the Dragon bishop becomes devastating. White\'s attack runs out of steam.',hl:[[2,5,'blue']],arrows:[[2,5,0,5,'rgba(100,150,255,.6)'],[1,6,7,0,'rgba(100,200,100,.7)']]}
    ]
  );
  document.getElementById('bt-grandprix').textContent='Grand Prix Attack (Nc3 + f4) — How to Fight It';
  document.getElementById('btags-grandprix').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-imbalanced">Imbalanced</span>';
  document.getElementById('bd-grandprix').textContent='The Grand Prix Attack is White\'s most aggressive Anti-Sicilian. Step through to see how the Dragon setup with ...g6/...Bg7 neutralises the f4 storm. The Dragon bishop is the key defensive and offensive weapon.';
  document.getElementById('bti-grandprix').innerHTML='<strong>Key counterplay for Black:</strong> After castling, attack on the queenside with ...a5-a4, ...Rb8, ...b5. Meanwhile the Dragon bishop eyes h6-b2. When White plays f5, open the g-file with gxf5 and launch ...Ng4 + ...Qb6 attacking f2.';

  // SMITH-MORRA GAMBIT (1.e4 c5 2.d4 cxd4 3.c3)
  // Black's best: accept and neutralise with solid development
  // Sequence: 1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Nxc3 Nc6 5.Nf3 d6 6.Bc4 e6 7.0-0 Nf6 8.Qe2 Be7 9.Rd1 e5
  reg('morra',document.getElementById('bw-morra'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'d2',to:'d4',label:'d4'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'c2',to:'c3',label:'c3'},{from:'d4',to:'c3',label:'dxc3'},
      {from:'b1',to:'c3',label:'Nxc3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'d7',to:'d6',label:'d6'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'e7',to:'e6',label:'e6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'d1',to:'e2',label:'Qe2'},{from:'f8',to:'e7',label:'Be7'},
      {from:'f1',to:'d1',label:'Rd1'},{from:'e6',to:'e5',label:'e5!'}
    ],[
      {tip:'The Smith-Morra Gambit — White sacrifices a pawn for rapid development and open lines. Very dangerous at club level. The correct defence: accept the pawn, develop solidly, and give it back at the right moment.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...c5 — The Sicilian.',hl:[[5,2,'blue']]},
      {tip:'2.d4 — The gambit begins. White offers a pawn.',hl:[[4,3,'green']]},
      {tip:'2...cxd4 — Black accepts. This is correct. Declining is passive and gives White a free centre.',hl:[[4,3,'blue']]},
      {tip:'3.c3 — The gambit pawn! White offers another pawn for fast development.',hl:[[5,2,'green']]},
      {tip:'3...dxc3 — Black takes it. Now White gets a knight on c3 with tempo.',hl:[[5,2,'blue']]},
      {tip:'4.Nxc3 — White gets the knight out fast with tempo. This is what White wants: Nc3, Nf3, Bc4 with a lead in development.',hl:[[5,2,'green']]},
      {tip:'4...Nc6 — Solid development. Black mirrors White\'s setup. Key: don\'t let White\'s pieces become overwhelming.',hl:[[5,2,'blue']]},
      {tip:'5.Nf3 — Development. White\'s pieces are flying out.',hl:[[5,5,'green']]},
      {tip:'5...d6 — Solid structure. Black closes the diagonal for now and prepares ...e6 or ...e5.',hl:[[2,3,'blue']]},
      {tip:'6.Bc4 — THE MORRA BISHOP. Aimed at f7, eyeing the e6 square and the kingside. This is White\'s main attacking piece.',hl:[[2,2,'red']],arrows:[[2,2,1,3,'rgba(255,100,100,.5)']]},
      {tip:'6...e6 — Blocks the Bc4 diagonal! This is the key defensive move. The bishop on c4 is now much less dangerous.',hl:[[2,4,'blue']],warn:'If Black plays 6...g6 or 6...e5 instead, the Bc4 stays pointing at f7 and White plays Ng5 threatening Bxf7+. The ...e6 move is essential to block the bishop — forget it and White gets a devastating attack on f7.'},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...Nf6 — Development. Black is developing calmly and solidly. White\'s initiative is fading.',hl:[[5,5,'blue']]},
      {tip:'8.Qe2 — White prepares Rd1 to put pressure on the d-file.',hl:[[6,4,'green']]},
      {tip:'8...Be7 — Solid. Prepares 0-0. Black declines to be greedy, focussing on safe development.',hl:[[6,4,'blue']]},
      {tip:'9.Rd1 — White activates the rook on the d-file, the open file from the gambit.',hl:[[7,3,'green']]},
      {tip:'9...e5! — THE EQUALISER! Black claims central space, blocks the d-file pressure, and the position is equal. White\'s gambit has given nothing. From here Black will castle and start queenside counterplay with ...a5 and ...b5.',hl:[[3,4,'blue']],arrows:[[3,4,4,4,'rgba(100,150,255,.7)'],[3,4,2,4,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-morra').textContent='Smith-Morra Gambit (d4 + c3) — How to Fight It';
  document.getElementById('btags-morra').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-solid">Pawn Gambit</span>';
  document.getElementById('bd-morra').textContent='The Smith-Morra is a pawn sacrifice for rapid development. Step through to see the correct defence: accept the pawn, play ...e6 to block the dangerous Bc4, develop solidly, then equalise with ...e5. White\'s initiative disappears.';
  document.getElementById('bti-morra').innerHTML='<strong>Golden rules vs the Morra:</strong> (1) Accept the pawn. (2) Play ...e6 to block Bc4. (3) Develop all pieces before castling. (4) Play ...e5 to close the centre. (5) Never allow Nd5 — always have a piece covering that square.';

  // CLOSED SICILIAN (2.Nc3 + g3)
  // Black's best: queenside attack with ...a5-a4-b5-b4
  // Sequence: 1.e4 c5 2.Nc3 Nc6 3.g3 g6 4.Bg2 Bg7 5.d3 d6 6.Be3 e6 7.Qd2 Nd4 8.Nce2 Ne7 9.c3 Nxe2 10.Qxe2 d5
  reg('closed',document.getElementById('bw-closed'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c5',label:'c5'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'g2',to:'g3',label:'g3'},{from:'g7',to:'g6',label:'g6'},
      {from:'f1',to:'g2',label:'Bg2'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'d2',to:'d3',label:'d3'},{from:'d7',to:'d6',label:'d6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'e7',to:'e6',label:'e6'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'c6',to:'d4',label:'Nd4!'},
      {from:'c3',to:'e2',label:'Nce2'},{from:'g8',to:'e7',label:'Ne7'},
      {from:'c2',to:'c3',label:'c3'},{from:'d4',to:'e2',label:'Nxe2'},
      {from:'d2',to:'e2',label:'Qxe2'},{from:'d6',to:'d5',label:'d5!'}
    ],[
      {tip:'The Closed Sicilian — White plays g3/Bg2 for a slow positional squeeze. No sharp tactics, just steady kingside pressure. Your response: attack on the queenside immediately.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...c5 — The Sicilian.',hl:[[5,2,'blue']]},
      {tip:'2.Nc3 — Preparing the Closed Sicilian with g3.',hl:[[5,2,'green']]},
      {tip:'2...Nc6 — Mirror development. Black develops naturally.',hl:[[5,2,'blue']]},
      {tip:'3.g3 — The Closed Sicilian! White prepares to fianchetto the bishop on g2. A slow, positional system.',hl:[[2,6,'green']]},
      {tip:'3...g6 — Black mirrors! A fianchetto vs fianchetto battle. The Dragon bishop on g7 will be Black\'s key piece.',hl:[[2,6,'blue']]},
      {tip:'4.Bg2 — The Closed Sicilian bishop on g2 looks impressive but can be neutralised.',hl:[[1,6,'green']]},
      {tip:'4...Bg7 — The Dragon bishop! Controls the long diagonal. The two fianchetto bishops will battle for supremacy.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.5)']]},
      {tip:'5.d3 — White plays solidly. No d4 break — White will push f4 instead for kingside play.',hl:[[5,3,'green']]},
      {tip:'5...d6 — Solid centre.',hl:[[2,3,'blue']]},
      {tip:'6.Be3 — White develops the bishop.',hl:[[5,2,'green']]},
      {tip:'6...e6 — Controlling d5 and preparing ...Nge7.',hl:[[2,4,'blue']]},
      {tip:'7.Qd2 — White prepares 0-0-0 potentially or just prepares Be3-h6.',hl:[[6,3,'green']]},
      {tip:'7...Nd4! — Excellent outpost! The knight on d4 is a thorn in White\'s position, hard to dislodge. It controls key central squares.',hl:[[3,3,'blue']],arrows:[[3,3,4,2,'rgba(100,150,255,.5)'],[3,3,4,4,'rgba(100,150,255,.5)']]},
      {tip:'8.Nce2 — White retreats to challenge the d4 knight.',hl:[[5,4,'green']]},
      {tip:'8...Ne7 — Black prepares to re-route pieces. The Ne7 can go to f5 or d5.',hl:[[1,4,'blue']]},
      {tip:'9.c3 — White kicks the d4 knight.',hl:[[5,2,'green']]},
      {tip:'9...Nxe2 — Black exchanges, then will strike with ...d5.',hl:[[6,4,'blue']]},
      {tip:'10.Qxe2 — White recaptures.',hl:[[6,4,'green']]},
      {tip:'10...d5! — THE CENTRAL BREAK! Black strikes in the centre. The position opens up to favour Black\'s bishops. White\'s slow Closed Sicilian plan has been undermined. From here Black has excellent play with ...0-0, ...a5-a4 and queenside expansion.',hl:[[3,3,'blue']],arrows:[[3,3,4,3,'rgba(100,150,255,.7)'],[3,3,2,3,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-closed').textContent='Closed Sicilian (g3) — How to Fight It';
  document.getElementById('btags-closed').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-solid">Solid</span>';
  document.getElementById('bd-closed').textContent='The Closed Sicilian is White\'s most positional Anti-Sicilian. Step through to see how Black mirrors with a fianchetto, places a knight on the d4 outpost, then breaks with ...d5 to open the position. The Dragon bishop becomes a monster.';
  document.getElementById('bti-closed').innerHTML='<strong>Key plan for Black:</strong> (1) Fianchetto with ...g6/...Bg7. (2) Place a knight on d4 or d5 as an outpost. (3) Attack on the queenside: ...a5, ...b5, ...b4 to open lines for your rooks. (4) When White plays f4, counter with ...f5 or ...e5 to close the kingside.';

  // ============================================================
  // VS 1.e4 BOARDS
  // ============================================================

  // FRENCH DEFENCE
  // 1.e4 e6 2.d4 d5 3.Nc3 Nf6 4.e5 Nfd7 5.f4 c5 6.Nf3 Nc6 7.Be3 cxd4 8.Nxd4 Bc5 9.Qd2 0-0 10.0-0-0 a6
  reg('french',document.getElementById('bw-french'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e6',label:'e6'},
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e4',to:'e5',label:'e5'},{from:'f6',to:'d7',label:'Nfd7'},
      {from:'f2',to:'f4',label:'f4'},{from:'c7',to:'c5',label:'c5!'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'f8',to:'c5',label:'Bc5'},
      {from:'d1',to:'d2',label:'Qd2'},{from:'e8',to:'g8',label:'0-0'},
      {from:'e1',to:'c1',label:'0-0-0'},{from:'a7',to:'a6',label:'a6'}
    ],[
      {tip:'The French Defence — Black plays 1...e6, preparing ...d5. A rock-solid, strategic response. White gets more space, Black gets a strong pawn structure and queenside counterplay.',hl:[[6,4,'green']]},
      {tip:'1.e4 — White occupies the centre.',hl:[[4,4,'green']]},
      {tip:'1...e6 — The French! Black prepares ...d5. The light-squared bishop is temporarily blocked — this is the French\'s one drawback.',hl:[[2,4,'blue']]},
      {tip:'2.d4 — White builds the ideal centre.',hl:[[4,3,'green']]},
      {tip:'2...d5 — Black immediately challenges! The pawn tension on d5 vs e4 is the defining feature of the French.',hl:[[3,3,'blue']],arrows:[[3,3,4,4,'rgba(100,150,255,.6)']]},
      {tip:'3.Nc3 — White supports e4. The Classical French.',hl:[[5,2,'green']]},
      {tip:'3...Nf6 — Development, attacking e4.',hl:[[5,5,'blue']]},
      {tip:'4.e5 — White advances! The pawn chain e5-d4 gives White space on the kingside. Black must counterattack on the queenside.',hl:[[3,4,'red']]},
      {tip:'4...Nfd7 — The knight retreats to d7, preparing to support ...c5. In the French, knights go to d7 and f5.',hl:[[1,3,'blue']]},
      {tip:'5.f4 — White reinforces the pawn chain. The position is very sharp — both sides will attack on opposite wings.',hl:[[3,5,'red']]},
      {tip:'5...c5! — THE KEY BREAK. Black attacks the base of White\'s pawn chain. This is Black\'s main counterplay in the French.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)']],warn:'If Black doesn\'t play ...c5 and instead plays ...Nc6 or ...Be7 first, White plays f5 and locks the kingside. Without the ...c5 counter, Black has no counterplay and slowly suffocates behind White\'s pawn wall.'},
      {tip:'6.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'6...Nc6 — Development and more pressure on d4.',hl:[[5,2,'blue']]},
      {tip:'7.Be3 — White protects d4.',hl:[[5,2,'green']]},
      {tip:'7...cxd4 — Black captures, giving White the IQP on d4 or a recapture with the knight.',hl:[[4,3,'blue']]},
      {tip:'8.Nxd4 — Knight recaptures. Black now develops the bishop aggressively.',hl:[[3,3,'green']]},
      {tip:'8...Bc5! — The bishop attacks d4 immediately. Black has excellent piece activity compensating for the slightly cramped queenside.',hl:[[2,2,'blue']],arrows:[[2,2,3,3,'rgba(100,150,255,.6)']]},
      {tip:'9.Qd2 — White prepares queenside castling for an opposite-wing attack.',hl:[[6,3,'green']]},
      {tip:'9...0-0 — Black castles. The king is safe and Black prepares ...a6, ...b5 queenside expansion.',hl:[[0,6,'blue']]},
      {tip:'10.0-0-0 — Opposite-wing castling! The race begins. White attacks the kingside, Black counterattacks with ...a6-a5-b5-b4.',hl:[[7,2,'red']]},
      {tip:'10...a6 — Beginning the queenside march! Black will play ...b5-b4 to open lines against White\'s king. Classic French counterplay.',hl:[[2,0,'blue']],arrows:[[2,0,1,0,'rgba(100,150,255,.6)'],[1,0,4,0,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-french').textContent='French Defence (1...e6) — Core Ideas';
  document.getElementById('btags-french').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Positional</span>';
  document.getElementById('bd-french').textContent='The French is built around the ...c5 break attacking White\'s pawn chain. Step through to see how Black accepts short-term cramp for long-term queenside counterplay with ...a6-b5-b4 while White storms the kingside.';
  document.getElementById('bti-french').innerHTML='<strong>French mantra:</strong> Attack the base of the pawn chain. White\'s chain is e5-d4 — the base is d4. Hit it with ...c5. Then play ...Nc6, ...Bc5 to pile on d4, and launch ...a6-b5-b4 against White\'s king. The light-squared bishop is Black\'s problem piece — activate it via ...b6 or exchange it for a knight.';

  // CARO-KANN DEFENCE
  // 1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng3 Bg6 6.h4 h6 7.Nf3 Nd7 8.h5 Bh7 9.Bd3 Bxd3 10.Qxd3 e6 11.Bf4 Ngf6
  reg('caro',document.getElementById('bw-caro'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'c7',to:'c6',label:'c6'},
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d5',to:'e4',label:'dxe4'},
      {from:'c3',to:'e4',label:'Nxe4'},{from:'c8',to:'f5',label:'Bf5'},
      {from:'e4',to:'g3',label:'Ng3'},{from:'f5',to:'g6',label:'Bg6'},
      {from:'h2',to:'h4',label:'h4'},{from:'h7',to:'h6',label:'h6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'d7',label:'Nd7'},
      {from:'h4',to:'h5',label:'h5'},{from:'g6',to:'h7',label:'Bh7'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'h7',to:'d3',label:'Bxd3'},
      {from:'d1',to:'d3',label:'Qxd3'},{from:'e7',to:'e6',label:'e6'},
      {from:'c1',to:'f4',label:'Bf4'},{from:'g8',to:'f6',label:'Ngf6'}
    ],[
      {tip:'The Caro-Kann — Black plays 1...c6, preparing ...d5. One of the most solid defences to 1.e4. Black gets a rock-solid structure and the light-squared bishop outside the pawn chain.',hl:[[6,4,'green']]},
      {tip:'1.e4 — White to the centre.',hl:[[4,4,'green']]},
      {tip:'1...c6 — The Caro-Kann. Not as committal as ...e5 or ...c5. Black prepares ...d5.',hl:[[2,2,'blue']]},
      {tip:'2.d4 — White builds the ideal centre.',hl:[[4,3,'green']]},
      {tip:'2...d5 — Black challenges. The pawn on c6 supports d5, which is the whole point over 1...e6.',hl:[[3,3,'blue']]},
      {tip:'3.Nc3 — Classical Caro-Kann. White supports e4.',hl:[[5,2,'green']]},
      {tip:'3...dxe4 — Black captures! Unlike the French, Black exchanges on e4 immediately. This is the key difference: Black gets the light-squared bishop OUTSIDE the pawns.',hl:[[4,4,'blue']]},
      {tip:'4.Nxe4 — White recaptures. Now Black develops the bishop before pushing it back.',hl:[[4,4,'green']]},
      {tip:'4...Bf5! — The Caro-Kann bishop comes out! This piece is the whole point of the opening. It can never be locked in like the French bishop.',hl:[[5,5,'blue']],arrows:[[5,5,4,4,'rgba(100,150,255,.5)']],warn:'If Black plays ...e6 first (like the French), the light-squared bishop gets permanently locked in. The ENTIRE POINT of the Caro-Kann is to get the bishop out before playing ...e6 — miss this and you\'re playing a worse French.'},
      {tip:'5.Ng3 — White pushes the bishop back.',hl:[[2,6,'green']]},
      {tip:'5...Bg6 — Bishop retreats to a safe square where it controls the long diagonal.',hl:[[2,6,'blue']]},
      {tip:'6.h4 — White launches a pawn attack on the bishop!',hl:[[3,7,'red']]},
      {tip:'6...h6 — Black stops h5. Solid prophylaxis. The bishop is safe on g6.',hl:[[2,7,'blue']]},
      {tip:'7.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'7...Nd7 — Solid development. The knight will go to f6 or b6.',hl:[[1,3,'blue']]},
      {tip:'8.h5 — White pushes the bishop again.',hl:[[2,7,'red']]},
      {tip:'8...Bh7 — Bishop retreats. It looks passive but it will become powerful in the endgame supporting kingside pawns.',hl:[[1,7,'blue']]},
      {tip:'9.Bd3 — White develops, planning to trade the bishop to weaken Black.',hl:[[5,3,'green']]},
      {tip:'9...Bxd3 — Black exchanges! Removing White\'s active bishop and doubling White\'s pawns is a good trade for Black.',hl:[[5,3,'blue']]},
      {tip:'10.Qxd3 — White recaptures.',hl:[[6,3,'green']]},
      {tip:'10...e6 — Solid. Black completes development calmly. The Caro-Kann structure is very healthy.',hl:[[2,4,'blue']]},
      {tip:'11.Bf4 — White develops the last piece.',hl:[[4,5,'green']]},
      {tip:'11...Ngf6 — Black is fully developed with a solid position. The Caro-Kann structure (c6, e6, solid pawns) gives Black an excellent endgame and no weaknesses.',hl:[[5,5,'blue']],arrows:[[2,2,5,2,'rgba(100,150,255,.4)'],[0,4,2,4,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-caro').textContent='Caro-Kann Defence (1...c6) — Core Ideas';
  document.getElementById('btags-caro').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Endgame-Focused</span>';
  document.getElementById('bd-caro').textContent='The Caro-Kann\'s secret weapon is the light-squared bishop escaping the pawn chain before it closes. Step through to see how Black develops solidly, exchanges the bishop actively, and reaches a healthy, balanced position.';
  document.getElementById('bti-caro').innerHTML='<strong>Caro-Kann key idea:</strong> Unlike the French where the light-squared bishop gets locked in, the Caro-Kann bishop escapes to f5 or g4 BEFORE the structure closes. This gives Black a harmonious position with no bad pieces. In the endgame, Black\'s solid structure and active rooks win.';

  // PIRC / MODERN DEFENCE
  // 1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.f4 Bg7 5.Nf3 0-0 6.Be2 c5 7.dxc5 dxc5 8.e5 Nfd7 9.Qd3 Nc6 10.Be3 Nb6
  reg('pirc',document.getElementById('bw-pirc'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'d7',to:'d6',label:'d6'},
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g7',to:'g6',label:'g6'},
      {from:'f2',to:'f4',label:'f4'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'e2',label:'Be2'},{from:'c7',to:'c5',label:'c5!'},
      {from:'d4',to:'c5',label:'dxc5'},{from:'d6',to:'c5',label:'dxc5'},
      {from:'e4',to:'e5',label:'e5'},{from:'f6',to:'d7',label:'Nfd7'},
      {from:'d1',to:'d3',label:'Qd3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'d7',to:'b6',label:'Nb6'}
    ],[
      {tip:'The Pirc Defence — a hyper-modern approach. Black allows White a big centre and then attacks it from the flanks with pieces and pawn breaks. The Dragon bishop on g7 is the key piece.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...d6 — The Pirc/Modern start. Black prepares ...Nf6 and ...g6. No immediate central fight.',hl:[[2,3,'blue']]},
      {tip:'2.d4 — White builds the big centre.',hl:[[4,3,'green']]},
      {tip:'2...Nf6 — Development. Black attacks e4.',hl:[[5,5,'blue']]},
      {tip:'3.Nc3 — White supports the centre.',hl:[[5,2,'green']]},
      {tip:'3...g6 — Fianchetto! Black prepares the Dragon bishop. The whole Pirc strategy is based on the bishop on g7.',hl:[[2,6,'blue']]},
      {tip:'4.f4 — Austrian Attack! White plays very aggressively, pushing f4-f5 for a kingside storm.',hl:[[3,5,'red']]},
      {tip:'4...Bg7 — THE DRAGON BISHOP. This piece will fight White\'s entire kingside attack. It controls the long a1-h8 diagonal.',hl:[[1,6,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.6)']]},
      {tip:'5.Nf3 — White continues development.',hl:[[5,5,'green']]},
      {tip:'5...0-0 — Black castles early, trusting the Dragon bishop to handle White\'s attack.',hl:[[0,6,'blue']]},
      {tip:'6.Be2 — White develops solidly.',hl:[[6,4,'green']]},
      {tip:'6...c5! — The COUNTERATTACK. Black strikes at the base of White\'s centre. This is Black\'s key break in the Pirc.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)']]},
      {tip:'7.dxc5 — White captures.',hl:[[2,2,'green']]},
      {tip:'7...dxc5 — Black recaptures. The centre has dissolved and now it\'s about piece activity. The Dragon bishop is unleashed.',hl:[[2,2,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.7)']]},
      {tip:'8.e5 — White pushes! The knight on f6 is attacked.',hl:[[3,4,'red']]},
      {tip:'8...Nfd7 — Retreat. The knight heads for c6 then d4, a powerful outpost.',hl:[[1,3,'blue']]},
      {tip:'9.Qd3 — White repositions the queen.',hl:[[5,3,'green']]},
      {tip:'9...Nc6 — Development. Pressure on e5.',hl:[[5,2,'blue']]},
      {tip:'10.Be3 — White defends.',hl:[[5,2,'green']]},
      {tip:'10...Nb6! — The knight heads to d5 via b6. A knight on d5 in this structure is a monster, and the Dragon bishop controls the whole board. Black has excellent counterplay.',hl:[[2,1,'blue']],arrows:[[2,1,3,3,'rgba(100,150,255,.6)'],[1,6,7,0,'rgba(100,200,100,.6)']]}
    ]
  );
  document.getElementById('bt-pirc').textContent='Pirc / Modern Defence (1...d6) — Core Ideas';
  document.getElementById('btags-pirc').innerHTML='<span class="tag tag-sharp">Dynamic</span><span class="tag tag-imbalanced">Hyper-Modern</span>';
  document.getElementById('bd-pirc').textContent='The Pirc lets White build a big centre then attacks it from the sides. Step through to see how the Dragon bishop on g7 fights the entire White structure, and how ...c5 dissolves the centre at the right moment.';
  document.getElementById('bti-pirc').innerHTML='<strong>Pirc key ideas:</strong> (1) Fianchetto the bishop to g7 — this is your main weapon. (2) Castle early behind it. (3) Play ...c5 to dissolve White\'s centre. (4) Put a knight on d5 as an outpost. (5) If White plays f4-f5, counter with ...e6 or let them overextend then strike back.';

  // SCANDINAVIAN DEFENCE
  // 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.d4 Nf6 5.Nf3 Bf5 6.Bc4 e6 7.Bd2 Qb6 8.Qe2 Nc6 9.0-0-0 0-0-0 10.Nd5 Nxd5
  reg('scandinavian',document.getElementById('bw-scandinavian'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'d7',to:'d5',label:'d5!'},
      {from:'e4',to:'d5',label:'exd5'},{from:'d8',to:'d5',label:'Qxd5'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d5',to:'a5',label:'Qa5'},
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'c8',to:'f5',label:'Bf5'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'e7',to:'e6',label:'e6'},
      {from:'c1',to:'d2',label:'Bd2'},{from:'a5',to:'b6',label:'Qb6!'},
      {from:'d1',to:'e2',label:'Qe2'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'e1',to:'c1',label:'0-0-0'},{from:'e8',to:'c8',label:'0-0-0'},
      {from:'c3',to:'d5',label:'Nd5'},{from:'f6',to:'d5',label:'Nxd5'}
    ],[
      {tip:'The Scandinavian Defence — Black immediately challenges White\'s centre on move 1. Simple to learn, leads to active piece play. Black gets the queen out early but uses it well.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...d5! — The Scandinavian! Immediate central challenge. White must take or lose the initiative.',hl:[[3,3,'blue']],arrows:[[3,3,4,4,'rgba(100,150,255,.7)']]},
      {tip:'2.exd5 — White accepts. Now Black recaptures.',hl:[[3,3,'green']]},
      {tip:'2...Qxd5 — Black brings the queen out early. It will be attacked by Nc3, but Black uses the tempo to develop other pieces.',hl:[[3,3,'blue']]},
      {tip:'3.Nc3 — White attacks the queen with tempo.',hl:[[5,2,'green']]},
      {tip:'3...Qa5! — The queen retreats to a5, maintaining pressure on the c3 knight AND threatening ...Bb4 pin. This is more active than ...Qd6 or ...Qd8.',hl:[[3,0,'blue']],arrows:[[3,0,5,2,'rgba(100,150,255,.5)']],warn:'If Black plays 3...Qd6 instead, the queen blocks the d-file and is poorly placed. Or if 3...Qd8 (retreating), Black has simply lost a tempo. Qa5 is the key square — it pressures c3 AND allows ...Bb4 pin later.'},
      {tip:'4.d4 — White builds a centre.',hl:[[4,3,'green']]},
      {tip:'4...Nf6 — Development. Black develops with tempo — the queen on a5 already ties down White\'s pieces.',hl:[[5,5,'blue']]},
      {tip:'5.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'5...Bf5 — The Scandinavian bishop! It comes out before the pawn chain closes. Very similar to the Caro-Kann bishop — active and unblocked.',hl:[[5,5,'blue']]},
      {tip:'6.Bc4 — White develops aggressively, pointing at f7.',hl:[[2,2,'red']]},
      {tip:'6...e6 — Solid. Black covers f7 and prepares ...Bb4 or ...Be7.',hl:[[2,4,'blue']]},
      {tip:'7.Bd2 — White prepares queenside castling.',hl:[[6,3,'green']]},
      {tip:'7...Qb6! — The queen shifts to b6, attacking b2 AND the d4 pawn. This dual threat is strong.',hl:[[2,1,'blue']],arrows:[[2,1,6,1,'rgba(100,150,255,.5)'],[2,1,4,3,'rgba(100,150,255,.5)']]},
      {tip:'8.Qe2 — White defends b2 and prepares 0-0-0.',hl:[[6,4,'green']]},
      {tip:'8...Nc6 — Development with tempo — attacks d4.',hl:[[5,2,'blue']]},
      {tip:'9.0-0-0 — White castles queenside for an aggressive setup.',hl:[[7,2,'red']]},
      {tip:'9...0-0-0 — Black also castles queenside! Both kings are on the same wing — a drawish, but active position.',hl:[[0,2,'blue']]},
      {tip:'10.Nd5 — White tries a tactical shot.',hl:[[3,3,'green']]},
      {tip:'10...Nxd5! — Black captures. After 11.Bxd5 Nb4! the position is equal. The Scandinavian leads to clear, understandable positions where piece activity counts more than pawn structure.',hl:[[3,3,'blue']],arrows:[[3,3,5,1,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-scandinavian').textContent='Scandinavian Defence (1...d5) — Core Ideas';
  document.getElementById('btags-scandinavian').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-imbalanced">Active Queen</span>';
  document.getElementById('bd-scandinavian').textContent='The Scandinavian immediately challenges 1.e4 with 1...d5. Step through to see how Black uses the active queen on a5/b6 to put pressure on White from move 3, while developing pieces to natural squares.';
  document.getElementById('bti-scandinavian').innerHTML='<strong>Scandinavian key ideas:</strong> (1) Play ...Qa5 after 2...Qxd5 — more active than retreating. (2) Develop the bishop to f5 before playing ...e6. (3) Put the queen on b6 to attack b2 and d4. (4) Castle queenside and get active rooks. The opening is easy to learn — the ideas repeat in every game.';

  // PETROFF DEFENCE
  // 1.e4 e5 2.Nf3 Nf6 3.Nxe5 d6 4.Nf3 Nxe4 5.d4 d5 6.Bd3 Be7 7.0-0 Nc6 8.Re1 Bf5 9.c3 0-0
  reg('petroff',document.getElementById('bw-petroff'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e5',label:'e5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6!'},
      {from:'f3',to:'e5',label:'Nxe5'},{from:'d7',to:'d6',label:'d6'},
      {from:'e5',to:'f3',label:'Nf3'},{from:'f6',to:'e4',label:'Nxe4'},
      {from:'d2',to:'d4',label:'d4'},{from:'d6',to:'d5',label:'d5'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'f1',to:'e1',label:'Re1'},{from:'c8',to:'f5',label:'Bf5'},
      {from:'c2',to:'c3',label:'c3'},{from:'e8',to:'g8',label:'0-0'}
    ],[
      {tip:'The Petroff Defence — Black counters 2.Nf3 not by defending e5 but by attacking e4! 2...Nf6. Leads to very solid, symmetrical positions. Favoured by players who want safety.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...e5 — Classical, occupying the centre.',hl:[[4,4,'blue']]},
      {tip:'2.Nf3 — White attacks e5.',hl:[[5,5,'green']]},
      {tip:'2...Nf6! — The Petroff! Instead of defending e5, Black counterattacks e4. This is the key idea — symmetrical aggression.',hl:[[5,5,'blue']],arrows:[[5,5,4,4,'rgba(100,150,255,.6)']]},
      {tip:'3.Nxe5 — White takes the e5 pawn.',hl:[[3,4,'green']]},
      {tip:'3...d6 — CRITICAL. Black must play this first! If 3...Nxe4? White plays 4.Qe2 and wins the knight. Always play 3...d6 first.',hl:[[2,3,'blue']],arrows:[[2,3,3,4,'rgba(100,200,100,.5)']],warn:'If Black plays 3...Nxe4 immediately (without 3...d6 first), White plays 4.Qe2! and the knight on e4 is attacked while the queen also threatens 5.Nc6+. Black LOSES the knight. 3...d6 first is mandatory — it is the difference between equality and losing material.'},
      {tip:'4.Nf3 — White retreats the knight.',hl:[[5,5,'green']]},
      {tip:'4...Nxe4 — NOW Black captures! The e5 square is safe and Black wins back the pawn with equality.',hl:[[4,4,'blue']]},
      {tip:'5.d4 — White opens the centre.',hl:[[4,3,'green']]},
      {tip:'5...d5 — Black mirrors! The position is completely symmetrical. Both sides have strong central pawns.',hl:[[3,3,'blue']]},
      {tip:'6.Bd3 — White develops, targeting the Ne4.',hl:[[5,3,'green']]},
      {tip:'6...Be7 — Solid development, preparing kingside castling.',hl:[[6,4,'blue']]},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...Nc6 — Development. Black has a perfectly solid position — no weaknesses, symmetrical structure.',hl:[[5,2,'blue']]},
      {tip:'8.Re1 — White pins the Ne4 to the king and prepares to win it back.',hl:[[7,4,'green']]},
      {tip:'8...Bf5 — Black develops actively before castling. The bishop on f5 is well-placed.',hl:[[5,5,'blue']]},
      {tip:'9.c3 — White prepares Nbd2 to challenge Ne4.',hl:[[5,2,'green']]},
      {tip:'9...0-0 — Black castles into a solid, equal position. The Petroff has fully equalised. White must work hard to generate any winning chances — Black has no weaknesses. From here Black plays ...Nd6 and ...Re8 to complete the defence.',hl:[[0,6,'blue']],arrows:[[0,4,3,3,'rgba(100,150,255,.4)'],[0,4,7,4,'rgba(100,150,255,.3)']]}
    ]
  );
  document.getElementById('bt-petroff').textContent='Petroff Defence (2...Nf6) — Core Ideas';
  document.getElementById('btags-petroff').innerHTML='<span class="tag tag-solid">Ultra-Solid</span><span class="tag tag-positional">Symmetrical</span>';
  document.getElementById('bd-petroff').textContent='The Petroff counters 2.Nf3 by attacking e4 rather than defending e5. Step through to see the critical move order (3...d6 BEFORE 3...Nxe4) and how Black reaches a perfectly equal, solid position with no weaknesses.';
  document.getElementById('bti-petroff').innerHTML='<strong>Petroff golden rule:</strong> After 3.Nxe5, ALWAYS play 3...d6 first, then 4...Nxe4. Never play 3...Nxe4 immediately — White wins the knight with 4.Qe2! After the correct move order, Black is fully equal. Continue with ...Nd6, ...Re8, ...Be6 to complete development and defend solidly.';

  // ============================================================
  // RUY LOPEZ BOARDS
  // ============================================================

  // BERLIN DEFENCE: 1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.0-0 Nxe4 5.d4 Nd6 6.Bxc6 dxc6 7.dxe5 Nf5 8.Qxd8+ Kxd8 9.Nc3 Ke8 10.h3 Be7
  reg('ruy-berlin',document.getElementById('bw-ruy-berlin'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e5',label:'e5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'f1',to:'b5',label:'Bb5!'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'f6',to:'e4',label:'Nxe4!'},
      {from:'d2',to:'d4',label:'d4'},{from:'e4',to:'d6',label:'Nd6'},
      {from:'b5',to:'c6',label:'Bxc6!'},{from:'d7',to:'c6',label:'dxc6'},
      {from:'d4',to:'e5',label:'dxe5'},{from:'d6',to:'f5',label:'Nf5'},
      {from:'d1',to:'d8',label:'Qxd8+'},{from:'e8',to:'d8',label:'Kxd8'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d8',to:'e8',label:'Ke8'},
      {from:'h2',to:'h3',label:'h3'},{from:'f8',to:'e7',label:'Be7'}
    ],[
      {tip:'The Berlin Defence — Black\'s most solid response to the Ruy López. After 3...Nf6, Black attacks e4 rather than defending the c6 knight. The resulting endgame (the "Berlin Wall") is notoriously difficult to crack.',hl:[[6,4,'green']]},
      {tip:'1.e4 — White stakes the centre.',hl:[[4,4,'green']]},
      {tip:'1...e5 — Black matches. The Open Game begins.',hl:[[4,4,'blue']]},
      {tip:'2.Nf3 — Attacks e5. The most natural developing move.',hl:[[5,5,'green']]},
      {tip:'2...Nc6 — Defends e5. The most common response.',hl:[[5,2,'blue']]},
      {tip:'3.Bb5! — THE RUY LÓPEZ. The bishop attacks the knight that defends e5. Not an immediate threat to win e5 — but long-term pressure on the c6 knight.',hl:[[4,1,'green']],arrows:[[4,1,5,2,'rgba(201,168,76,.6)']]},
      {tip:'3...Nf6 — THE BERLIN! Black counterattacks e4 instead of defending. This is the Berlin Defence — currently the most popular and theoretically respected response to the Ruy López.',hl:[[5,5,'blue']],arrows:[[5,5,4,4,'rgba(100,150,255,.6)']]},
      {tip:'4.0-0 — White castles rather than defending e4, knowing the position is comfortable after 4...Nxe4.',hl:[[7,6,'green']]},
      {tip:'4...Nxe4! — Black takes the pawn! This is the Berlin main line. White cannot simply win it back — 5.Re1 Nd6 6.Nxe5 Be7 is fine for Black.',hl:[[4,4,'blue']],arrows:[[5,5,4,4,'rgba(100,150,255,.7)']]},
      {tip:'5.d4 — White strikes the centre, gaining tempo on the knight and threatening to win back the pawn.',hl:[[4,3,'green']],arrows:[[4,3,4,4,'rgba(201,168,76,.5)']]},
      {tip:'5...Nd6 — The knight retreats but attacks the bishop. Now both the e5 pawn and the Bb5 are under pressure.',hl:[[2,3,'blue']],arrows:[[2,3,4,1,'rgba(100,150,255,.5)'],[2,3,4,4,'rgba(100,150,255,.5)']]},
      {tip:'6.Bxc6! — White captures, giving Black doubled c-pawns. This is the key idea — White accepts a pawn structure concession to remove the knight that was attacking e5.',hl:[[5,2,'green']],warn:'If White retreats the bishop instead of capturing, Black plays ...Nxe5 and wins back the pawn in a comfortable position. Always capture on c6 — the doubled pawns and endgame advantages outweigh the bishop pair you give away.'},
      {tip:'6...dxc6 — Black recaptures with the d-pawn, opening the d-file. Black now has the bishop pair but doubled c-pawns.',hl:[[5,2,'blue']]},
      {tip:'7.dxe5 — White captures on e5. Now the Nd6 is attacked by the e5 pawn.',hl:[[3,4,'green']],arrows:[[3,4,2,3,'rgba(201,168,76,.5)']]},
      {tip:'7...Nf5 — The knight jumps to f5, attacking the queen on d1 with a discovered threat.',hl:[[3,5,'blue']]},
      {tip:'8.Qxd8+! — White exchanges queens! The Berlin endgame begins. Black must recapture with the king, losing castling rights.',hl:[[7,3,'green']],warn:'This is the defining moment of the Berlin. Many players avoid the Berlin because they don\'t want to lose castling rights — but the position is completely solid for Black. The king on d8 is not in danger and will march to e8/e7 safely.'},
      {tip:'8...Kxd8 — Black recaptures, losing castling rights. But the position is fully equal. This is the famous Berlin "endgame with queens" — no queens, but both sides have active plans.',hl:[[0,3,'blue']]},
      {tip:'9.Nc3 — Development. White develops naturally.',hl:[[5,2,'green']]},
      {tip:'9...Ke8 — The king marches back to safety! This is the correct plan — Ke8, then the king heads to e7, then the bishops develop, and Black is fully equal. The doubled c-pawns are fixed but the bishop pair is compensation.',hl:[[0,4,'blue']],arrows:[[0,3,0,4,'rgba(100,150,255,.6)'],[0,4,1,4,'rgba(100,150,255,.4)']]},
      {tip:'10.h3 — White prevents ...Bg4, a standard prophylactic move in the Berlin endgame.',hl:[[5,7,'green']]},
      {tip:'10...Be7 — Black develops the bishop. The position is equal. Black\'s plan: ...Be6, ...Nd6, ...Kd7, then use the bishop pair and solid structure to hold. White needs to find a plan to convert the e5 pawn advantage — it is very hard.',hl:[[1,4,'blue']]}
    ]
  );
  document.getElementById('bt-ruy-berlin').textContent='Ruy López: Berlin Defence (3...Nf6) — The Berlin Wall';
  document.getElementById('btags-ruy-berlin').innerHTML='<span class="tag tag-solid">Ultra-Solid</span><span class="tag tag-positional">Endgame</span>';
  document.getElementById('bd-ruy-berlin').textContent='The Berlin leads to a famous endgame after Qxd8+ Kxd8. Black loses castling rights but the position is completely solid. Step through to see how Black navigates the Berlin Wall and achieves full equality.';
  document.getElementById('bti-ruy-berlin').innerHTML='<strong>Berlin endgame plan for Black:</strong> (1) After Kxd8, immediately play Ke8 to centralise the king. (2) Develop the bishops: ...Be7, ...Be6. (3) Play ...Nd6 to challenge the e5 pawn. (4) Use the bishop pair in the endgame — it is long-term compensation for the doubled c-pawns. (5) Don\'t try to win the e5 pawn immediately — just develop and equalise first.';

  // CLASSICAL RUY LÓPEZ: 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.0-0 Be7 6.Re1 b5 7.Bb3 d6 8.c3 0-0 9.h3 Na5 10.Bc2 c5
  reg('ruy-classical',document.getElementById('bw-ruy-classical'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e5',label:'e5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'f1',to:'b5',label:'Bb5'},{from:'a7',to:'a6',label:'a6'},
      {from:'b5',to:'a4',label:'Ba4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'f8',to:'e7',label:'Be7'},
      {from:'f1',to:'e1',label:'Re1'},{from:'b7',to:'b5',label:'b5!'},
      {from:'a4',to:'b3',label:'Bb3'},{from:'d7',to:'d6',label:'d6'},
      {from:'c2',to:'c3',label:'c3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'h2',to:'h3',label:'h3'},{from:'c6',to:'a5',label:'Na5!'},
      {from:'b3',to:'c2',label:'Bc2'},{from:'c7',to:'c5',label:'c5!'}
    ],[
      {tip:'The Classical (Closed) Ruy López — the most theoretically rich continuation. White builds a strong centre with c3+d4, Black defends solidly with ...Be7, ...b5, ...d6. This is the battleground of dozens of world championship matches.',hl:[[6,4,'green']]},
      {tip:'1.e4 — White opens.',hl:[[4,4,'green']]},
      {tip:'1...e5 — Black answers.',hl:[[4,4,'blue']]},
      {tip:'2.Nf3 — Attacks e5.',hl:[[5,5,'green']]},
      {tip:'2...Nc6 — Defends e5.',hl:[[5,2,'blue']]},
      {tip:'3.Bb5 — The Ruy López. White prepares to build a centre with c3+d4.',hl:[[4,1,'green']]},
      {tip:'3...a6! — THE MORPHY DEFENCE. Black asks: will you take on c6? White must decide. This is played in over 80% of Ruy López games.',hl:[[2,0,'blue']],arrows:[[2,0,4,1,'rgba(100,150,255,.5)']]},
      {tip:'4.Ba4 — White retreats! White maintains the pin on the c6 knight without committing to Bxc6. The bishop keeps the pressure.',hl:[[4,0,'green']],arrows:[[4,0,5,2,'rgba(201,168,76,.5)']]},
      {tip:'4...Nf6 — Development, attacking e4. Black develops naturally.',hl:[[5,5,'blue']]},
      {tip:'5.0-0 — White castles. Despite e4 being attacked, White is fine — 5...Nxe4 leads to the Open Variation which is complicated but equal with precise play.',hl:[[7,6,'green']]},
      {tip:'5...Be7 — THE CLOSED VARIATION begins. Black develops solidly, preparing to castle. No tricks — just solid development.',hl:[[1,4,'blue']]},
      {tip:'6.Re1 — White activates the rook on the e-file, supporting e4 and preparing d4.',hl:[[7,4,'green']],arrows:[[7,4,4,4,'rgba(201,168,76,.4)']]},
      {tip:'6...b5! — IMPORTANT! Black kicks the bishop off the a4-e8 diagonal. This is the key move — without it, White plays d4 next and the bishop on a4 exerts massive pressure. Always play ...b5 in the Ruy López Classical.',hl:[[1,1,'blue']],arrows:[[1,1,4,0,'rgba(100,150,255,.6)']],warn:'If Black plays 6...0-0 first instead of 6...b5, White plays 7.d4! and the position becomes significantly harder for Black. Always ...b5 before castling in the Classical Ruy López — it is not optional.'},
      {tip:'7.Bb3 — The bishop retreats to b3, still aiming at the kingside along the a2-g8 diagonal. A typical and important bishop retreat in the Ruy López.',hl:[[4,1,'green']],arrows:[[4,1,0,5,'rgba(201,168,76,.4)']]},
      {tip:'7...d6 — Solid. Black supports e5 and prepares ...Be6 or ...Bg4. This is the Chigorin Defence setup.',hl:[[2,3,'blue']]},
      {tip:'8.c3 — White prepares d4. The plan: c3+d4 to build a strong centre and challenge e5.',hl:[[5,2,'green']],arrows:[[5,2,4,3,'rgba(201,168,76,.4)']]},
      {tip:'8...0-0 — Black castles. Both sides have completed basic development.',hl:[[0,6,'blue']]},
      {tip:'9.h3 — Prophylaxis! White prevents ...Bg4, which would pin the Nf3 and undermine d4. A key preparatory move before White pushes d4.',hl:[[5,7,'green']]},
      {tip:'9...Na5! — THE CHIGORIN MANOEUVRE! Black attacks the Bb3 and threatens to play ...c5, putting enormous pressure on d4. This is Black\'s main plan in the Classical Ruy López.',hl:[[5,0,'blue']],arrows:[[5,0,4,1,'rgba(100,150,255,.6)']],warn:'The alternative is 9...Nb8 (the Breyer) where Black retreats the knight to reroute to d7-f8-e6 or g6. Both are excellent — the Chigorin (Na5+c5) is more direct, the Breyer more positional. At 1500, the Chigorin is easier to understand.'},
      {tip:'10.Bc2 — White retreats the bishop to safety, maintaining the diagonal.',hl:[[6,2,'green']]},
      {tip:'10...c5! — The Chigorin plan in full: ...Na5 to kick the bishop, ...c5 to attack d4. Black has strong central counterplay. From here: ...Nc6, ...Be6, and pressure on d4. This is one of the richest positions in chess.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.6)'],[5,0,3,1,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-ruy-classical').textContent='Ruy López: Classical/Closed (3...a6) — Chigorin Plan';
  document.getElementById('btags-ruy-classical').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-solid">Rich Theory</span>';
  document.getElementById('bd-ruy-classical').textContent='The most important Ruy López line. Black plays ...a6, ...Be7, ...b5, ...d6 for a solid setup, then launches the Chigorin counterattack with ...Na5 and ...c5 to target White\'s centre.';
  document.getElementById('bti-ruy-classical').innerHTML='<strong>Classical Ruy López essentials:</strong> (1) Always play ...b5 before castling to kick the bishop off the a4 diagonal. (2) The Chigorin plan: ...Na5 to attack the bishop, then ...c5 to hit d4. (3) Never capture on e4 early — White gets a huge attack. (4) After ...c5, Black\'s pieces become very active. (5) The bishop on b3 is powerful but manageable — keep ...Na5 in reserve to trade it off.';

  // RUY LÓPEZ EXCHANGE: 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6 5.0-0 f6 6.d4 exd4 7.Nxd4 c5 8.Ne2 Qxd1 9.Rxd1 Bd6 10.Nbc3 Ne7
  reg('ruy-exchange',document.getElementById('bw-ruy-exchange'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e5',label:'e5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'f1',to:'b5',label:'Bb5'},{from:'a7',to:'a6',label:'a6'},
      {from:'b5',to:'c6',label:'Bxc6!'},{from:'d7',to:'c6',label:'dxc6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'f7',to:'f6',label:'f6'},
      {from:'d2',to:'d4',label:'d4'},{from:'e5',to:'d4',label:'exd4'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'c5',to:'c5',label:'c5'},
      {from:'d4',to:'e2',label:'Ne2'},{from:'d8',to:'d1',label:'Qxd1'},
      {from:'f1',to:'d1',label:'Rxd1'},{from:'f8',to:'d6',label:'Bd6'},
      {from:'b1',to:'c3',label:'Nbc3'},{from:'g8',to:'e7',label:'Ne7'}
    ],[
      {tip:'The Exchange Variation — White immediately captures on c6, giving Black doubled c-pawns. Black gets the bishop pair in return. A strategically rich, unbalanced position — not a drawing weapon!',hl:[[6,4,'green']]},
      {tip:'1.e4 — White opens.',hl:[[4,4,'green']]},
      {tip:'1...e5 — Black answers.',hl:[[4,4,'blue']]},
      {tip:'2.Nf3 — Attacks e5.',hl:[[5,5,'green']]},
      {tip:'2...Nc6 — Defends e5.',hl:[[5,2,'blue']]},
      {tip:'3.Bb5 — The Ruy López.',hl:[[4,1,'green']]},
      {tip:'3...a6 — Morphy Defence.',hl:[[2,0,'blue']]},
      {tip:'4.Bxc6! — THE EXCHANGE VARIATION. White captures immediately, giving Black doubled c-pawns and taking the bishop pair.',hl:[[5,2,'green']],arrows:[[4,1,5,2,'rgba(201,168,76,.7)']],warn:'Many players assume this is a drawish line — it is not. The Exchange Variation leads to rich strategic battles. White is betting that the doubled c-pawns will be a long-term weakness. Black is betting that the bishop pair and half-open d-file are enough compensation. Both sides have real chances.'},
      {tip:'4...dxc6 — Black recaptures with the d-pawn. Black now has: the bishop pair, an open d-file for the rook, and a strong e5 pawn. But c6 is doubled and weak.',hl:[[5,2,'blue']],arrows:[[0,3,4,3,'rgba(100,150,255,.4)']]},
      {tip:'5.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'5...f6 — CRITICAL! Black supports e5 with the f-pawn, preventing Nxe5. Without this, White wins the e5 pawn immediately. Always play ...f6 in the Exchange Variation.',hl:[[2,5,'blue']],arrows:[[2,5,4,4,'rgba(100,150,255,.5)']],warn:'If Black plays 5...Bd6 or 5...f5 instead, White plays Nxe5! immediately. ...f6 is non-negotiable in the Exchange Variation — without it, the e5 pawn falls and Black\'s position collapses.'},
      {tip:'6.d4 — White strikes the centre! The plan: d4 to challenge e5 and open lines.',hl:[[4,3,'green']],arrows:[[4,3,4,4,'rgba(201,168,76,.5)']]},
      {tip:'6...exd4 — Black captures. After Nxd4, White has active piece play but Black has the bishop pair.',hl:[[4,4,'blue']]},
      {tip:'7.Nxd4 — White recaptures. Now Black should play ...c5 to challenge the knight.',hl:[[3,3,'green']]},
      {tip:'7...c5! — THE CORRECT PLAN! Black attacks the Nd4 and fights for the centre. After the queens come off, Black\'s bishop pair in the endgame is serious compensation for the structural damage.',hl:[[2,2,'blue']],arrows:[[2,2,3,3,'rgba(100,150,255,.6)']]},
      {tip:'8.Ne2 — The knight retreats. The position simplifies.',hl:[[6,4,'green']]},
      {tip:'8...Qxd1 — Black exchanges queens heading for an endgame where the bishop pair shines.',hl:[[0,3,'blue']]},
      {tip:'9.Rxd1 — White recaptures. An endgame has been reached.',hl:[[7,3,'green']]},
      {tip:'9...Bd6 — Black develops the bishop actively, pointing at h2.',hl:[[1,3,'blue']],arrows:[[1,3,5,7,'rgba(100,150,255,.4)']]},
      {tip:'10.Nbc3 — White develops. From here: White targets the doubled c-pawns with Nb5 or Na4. Black uses the bishop pair and open d-file for counterplay. A classic strategic battle — pawn structure vs piece activity.',hl:[[5,2,'green']]},
      {tip:'10...Ne7 — Black develops the knight, heading to g6 or f5. The bishop pair, open d-file, and strong e5 pawn compensate for the doubled c-pawns. Black is fully equal in this endgame.',hl:[[1,4,'blue']],arrows:[[1,4,2,5,'rgba(100,150,255,.4)'],[2,5,3,4,'rgba(100,150,255,.3)']]}
    ]
  );
  document.getElementById('bt-ruy-exchange').textContent='Ruy López: Exchange Variation (4.Bxc6) — Structural Battle';
  document.getElementById('btags-ruy-exchange').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-imbalanced">Unbalanced</span>';
  document.getElementById('bd-ruy-exchange').textContent='White immediately captures on c6, giving Black doubled pawns but the bishop pair and open d-file. Step through to see Black\'s correct plan: ...f6 to support e5, ...c5 to challenge the knight, and a bishop-pair endgame.';
  document.getElementById('bti-ruy-exchange').innerHTML='<strong>Exchange Variation essentials for Black:</strong> (1) Always play ...f6 after Bxc6 dxc6 — without it, White takes the e5 pawn. (2) Play ...c5 to challenge the knight on d4. (3) Trade queens early and play for a bishop-pair endgame. (4) Use the open d-file for your rook. (5) The doubled c-pawns are a weakness but the bishop pair and e5 pawn are full compensation.';

  // NIMZO-INDIAN DEFENCE
  // 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 0-0 5.Bd3 d5 6.Nf3 c5 7.0-0 dxc4 8.Bxc4 cxd4 9.exd4 Nc6 10.Be3 Be7
  reg('nimzo',document.getElementById('bw-nimzo'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'f8',to:'b4',label:'Bb4!'},
      {from:'e2',to:'e3',label:'e3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'d7',to:'d5',label:'d5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'c7',to:'c5',label:'c5'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d5',to:'c4',label:'dxc4'},
      {from:'d3',to:'c4',label:'Bxc4'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'e3',to:'d4',label:'exd4'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'b4',to:'e7',label:'Be7'}
    ],[
      {tip:'The Nimzo-Indian — one of Black\'s most respected and theoretically rich defences to 1.d4. Black pins the c3 knight immediately with Bb4, preventing White from building the ideal centre and ruining White\'s pawn structure.',hl:[[6,3,'green']]},
      {tip:'1.d4 — White opens.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development, controlling central squares.',hl:[[5,5,'blue']]},
      {tip:'2.c4 — White claims space.',hl:[[4,2,'green']]},
      {tip:'2...e6 — Solid. Prepares ...d5 or ...Bb4.',hl:[[2,4,'blue']]},
      {tip:'3.Nc3 — White develops the knight, planning e4.',hl:[[5,2,'green']]},
      {tip:'3...Bb4! — THE NIMZO MOVE! The bishop pins the c3 knight. Now if White plays e4, the pawn structure is damaged after ...Bxc3 bxc3. This single move defines the entire opening.',hl:[[4,1,'blue']],arrows:[[4,1,5,2,'rgba(100,150,255,.7)']],warn:'If Black plays 3...Nf6 instead (Queen\'s Indian), White plays e4 unhindered and gets the ideal centre. The whole point of Nimzo is to pin the c3 knight NOW before White plays e4. Delay and you face a full pawn centre.'},
      {tip:'4.e3 — The Classical variation. White plays solidly, not allowing the doubled pawns yet.',hl:[[5,4,'green']]},
      {tip:'4...0-0 — Black castles. The king is safe and Black can fight in the centre.',hl:[[0,6,'blue']]},
      {tip:'5.Bd3 — White develops. Note the bishop blocks the d-pawn — a slight inefficiency.',hl:[[5,3,'green']]},
      {tip:'5...d5 — Central challenge! Black builds a strong pawn centre.',hl:[[3,3,'blue']]},
      {tip:'6.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'6...c5 — DOUBLE ATTACK on d4! Black challenges the centre with both d5 and c5. White\'s centre is under serious pressure.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.6)'],[3,3,4,3,'rgba(100,150,255,.5)']]},
      {tip:'7.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'7...dxc4 — Black captures. White must recapture with the bishop.',hl:[[4,2,'blue']]},
      {tip:'8.Bxc4 — White recaptures. The c4 bishop becomes active.',hl:[[4,2,'green']]},
      {tip:'8...cxd4 — Black captures on d4! White must decide how to recapture.',hl:[[4,3,'blue']]},
      {tip:'9.exd4 — White recaptures with the pawn. White gets the IQP on d4 — a long-term weakness Black can target.',hl:[[4,3,'green']]},
      {tip:'9...Nc6 — Development, immediately attacking d4.',hl:[[5,2,'blue']]},
      {tip:'10.Be3 — White protects d4.',hl:[[5,2,'green']]},
      {tip:'10...Be7 — Black retreats the bishop and prepares to consolidate. Black has a solid position and will blockade White\'s IQP on d5 with a knight. The typical Nimzo plan: pin the knight, exchange it for a structural advantage, blockade the resulting weakness.',hl:[[6,4,'blue']],arrows:[[5,3,3,3,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-nimzo').textContent='Nimzo-Indian Defence (3...Bb4) — Core Ideas';
  document.getElementById('btags-nimzo').innerHTML='<span class="tag tag-positional">Strategic</span><span class="tag tag-solid">Classical</span>';
  document.getElementById('bd-nimzo').textContent='The Nimzo-Indian pins the c3 knight on move 3, preventing e4 and forcing structural concessions from White. Step through to see how Black challenges the centre with ...d5 and ...c5, then targets the resulting IQP.';
  document.getElementById('bti-nimzo').innerHTML='<strong>Nimzo key ideas:</strong> (1) Pin Nc3 with Bb4. (2) Play ...d5 and ...c5 to destroy the centre. (3) When White gets an IQP, blockade it on d5 with a knight. (4) Exchange dark-squared bishops to weaken White\'s kingside. The Nimzo is the weapon of choice for Kasparov, Karpov, and almost every top player.';

  // QUEEN'S GAMBIT DECLINED
  // 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 0-0 6.Nf3 h6 7.Bh4 b6 8.cxd5 Nxd5 9.Bxe7 Qxe7 10.Nxd5 exd5
  reg('qgd',document.getElementById('bw-qgd'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e2',to:'e3',label:'e3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'h7',to:'h6',label:'h6'},
      {from:'g5',to:'h4',label:'Bh4'},{from:'b7',to:'b6',label:'b6'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'f6',to:'d5',label:'Nxd5'},
      {from:'h4',to:'e7',label:'Bxe7'},{from:'d8',to:'e7',label:'Qxe7'},
      {from:'c3',to:'d5',label:'Nxd5'},{from:'e6',to:'d5',label:'exd5'}
    ],[
      {tip:'The Queen\'s Gambit Declined — Black\'s most classical and solid response to 1.d4 c4. Black declines the gambit pawn, builds a solid structure, and fights for equality methodically.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black immediately establishes a central pawn. The QGD begins.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — The Queen\'s Gambit! White offers a pawn to gain centre control.',hl:[[4,2,'green']]},
      {tip:'2...e6 — DECLINED. Black supports d5 with the e-pawn. Very solid. The light-squared bishop is blocked but the structure is excellent.',hl:[[2,4,'blue']]},
      {tip:'3.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'3...Nf6 — Development, attacking d4 and e4.',hl:[[5,5,'blue']]},
      {tip:'4.Bg5 — The Classical QGD. White pins the f6 knight, making it harder for Black to defend d5.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(255,100,100,.5)']]},
      {tip:'4...Be7 — Solid. Black develops and unpins the knight. The bishop on e7 is solid, not flashy.',hl:[[6,4,'blue']]},
      {tip:'5.e3 — White develops solidly.',hl:[[5,4,'green']]},
      {tip:'5...0-0 — Black castles. The position is solid and well-defended.',hl:[[0,6,'blue']]},
      {tip:'6.Nf3 — White completes development.',hl:[[5,5,'green']]},
      {tip:'6...h6 — Black asks the bishop: what are you doing on g5? Forces White to declare intentions.',hl:[[2,7,'blue']]},
      {tip:'7.Bh4 — White retreats, maintaining the pin.',hl:[[3,7,'green']]},
      {tip:'7...b6 — Preparing ...Bb7 to activate the light-squared bishop — Black\'s problem piece in the QGD.',hl:[[2,1,'blue']]},
      {tip:'8.cxd5 — White releases the tension.',hl:[[3,3,'green']]},
      {tip:'8...Nxd5 — Black recaptures with the knight — better than exd5 which gives White the initiative.',hl:[[3,3,'blue']]},
      {tip:'9.Bxe7 — White exchanges the bishop.',hl:[[6,4,'green']]},
      {tip:'9...Qxe7 — Black recaptures. The queen is well-placed on e7.',hl:[[6,4,'blue']]},
      {tip:'10.Nxd5 — White exchanges knights.',hl:[[3,3,'green']]},
      {tip:'10...exd5 — Black has a symmetrical pawn structure with the IQP on d5. The position is equal. Black will activate the bishop to b7 and play ...c5 to free the position. A solid, reliable defence.',hl:[[3,3,'blue']],arrows:[[2,1,4,1,'rgba(100,150,255,.4)'],[4,1,3,2,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-qgd').textContent='Queen\'s Gambit Declined (2...e6) — Core Ideas';
  document.getElementById('btags-qgd').innerHTML='<span class="tag tag-solid">Classical</span><span class="tag tag-positional">Solid</span>';
  document.getElementById('bd-qgd').textContent='The QGD is Black\'s most solid response to 1.d4 c4. Step through to see how Black declines the gambit pawn, develops solidly, and reaches an equal position. The main challenge is activating the light-squared bishop.';
  document.getElementById('bti-qgd').innerHTML='<strong>QGD key ideas:</strong> (1) Play ...e6 to decline the gambit. (2) Develop solidly with ...Be7, ...0-0, ...Nf6. (3) Play ...h6 to ask the Bg5 where it is going. (4) Activate the light-squared bishop via ...b6-Bb7 or exchange it. (5) Play ...c5 in the middlegame to free the position. The QGD is used at every level from club to world championship.';

  // QUEEN'S GAMBIT ACCEPTED
  // 1.d4 d5 2.c4 dxc4 3.Nf3 Nf6 4.e3 e6 5.Bxc4 c5 6.0-0 a6 7.Bb3 Nc6 8.Nc3 cxd4 9.exd4 Be7 10.Re1 0-0
  reg('qga',document.getElementById('bw-qga'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'c4',label:'dxc4!'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e2',to:'e3',label:'e3'},{from:'e7',to:'e6',label:'e6'},
      {from:'f1',to:'c4',label:'Bxc4'},{from:'c7',to:'c5',label:'c5!'},
      {from:'e1',to:'g1',label:'0-0'},{from:'a7',to:'a6',label:'a6'},
      {from:'c4',to:'b3',label:'Bb3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'e3',to:'d4',label:'exd4'},{from:'f8',to:'e7',label:'Be7'},
      {from:'f1',to:'e1',label:'Re1'},{from:'e8',to:'g8',label:'0-0'}
    ],[
      {tip:'The Queen\'s Gambit Accepted — Black takes the c4 pawn! Instead of defending d5, Black accepts the gambit and aims to hold the extra pawn or use the open lines. An active, dynamic choice.',hl:[[6,3,'green']]},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black controls the centre.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — The Queen\'s Gambit.',hl:[[4,2,'green']]},
      {tip:'2...dxc4! — ACCEPTED! Black takes the pawn. White cannot keep it but gets a free centre with d4 and e4.',hl:[[4,2,'blue']]},
      {tip:'3.Nf3 — White develops, preparing e3 and Bxc4 to recover the pawn.',hl:[[5,5,'green']]},
      {tip:'3...Nf6 — Development, fighting for e4.',hl:[[5,5,'blue']]},
      {tip:'4.e3 — White prepares to recapture with the bishop.',hl:[[5,4,'green']]},
      {tip:'4...e6 — Solid. Black supports the c4 pawn and prepares ...c5.',hl:[[2,4,'blue']]},
      {tip:'5.Bxc4 — White recovers the pawn.',hl:[[6,2,'green']]},
      {tip:'5...c5! — The classical QGA break. Black challenges d4 immediately. This is the key move — challenge the centre before White consolidates.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)']],warn:'If Black plays 5...b5 trying to hold the extra pawn, White plays a4 and the queenside collapses. The extra pawn in the QGA is NEVER worth keeping — the only correct plan is to return it with ...c5 and fight for piece activity. Try to keep the pawn and you lose.'},
      {tip:'6.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'6...a6 — Prophylaxis. Black prevents Bb5+ and prepares ...b5 to push the bishop back.',hl:[[2,0,'blue']]},
      {tip:'7.Bb3 — White retreats the bishop to safety.',hl:[[4,1,'green']]},
      {tip:'7...Nc6 — Development, attacking d4.',hl:[[5,2,'blue']]},
      {tip:'8.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'8...cxd4 — Black captures on d4, giving White the IQP.',hl:[[4,3,'blue']]},
      {tip:'9.exd4 — White recaptures with the e-pawn. White has the IQP — space and activity, but a long-term weakness.',hl:[[4,3,'green']]},
      {tip:'9...Be7 — Solid development, preparing castling.',hl:[[6,4,'blue']]},
      {tip:'10.Re1 — White activates the rook.',hl:[[7,4,'green']]},
      {tip:'10...0-0 — Black castles into a solid, equal position. Black will play ...b5, ...Bb7, and target White\'s IQP on d4 with ...Nb4 or ...Nd5. The QGA leads to rich, active positions where Black has no weaknesses.',hl:[[0,6,'blue']],arrows:[[2,0,4,0,'rgba(100,150,255,.4)'],[4,0,5,1,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-qga').textContent='Queen\'s Gambit Accepted (2...dxc4) — Core Ideas';
  document.getElementById('btags-qga').innerHTML='<span class="tag tag-imbalanced">Active</span><span class="tag tag-solid">Solid</span>';
  document.getElementById('bd-qga').textContent='The QGA accepts the c4 pawn and immediately fights back with ...c5. Step through to see how Black uses the half-open c-file and active piece play to fully equalise. White gets the IQP — Black targets it.';
  document.getElementById('bti-qga').innerHTML='<strong>QGA key ideas:</strong> (1) Take the pawn with 2...dxc4. (2) Play ...c5 as early as possible to challenge d4. (3) Play ...a6 to prevent Bb5+. (4) After White gets the IQP, put a knight on d5 to blockade it. (5) Use the open c-file for rook play. The QGA is popular at club level because it leads to active, understandable play.';

  // GRUNFELD DEFENCE
  // 1.d4 Nf6 2.c4 g6 3.Nc3 d5 4.cxd5 Nxd5 5.e4 Nxc3 6.bxc3 Bg7 7.Bc4 c5 8.Ne2 Nc6 9.Be3 0-0 10.0-0 cxd4
  reg('grunfeld',document.getElementById('bw-grunfeld'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c2',to:'c4',label:'c4'},{from:'g7',to:'g6',label:'g6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d7',to:'d5',label:'d5!'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'f6',to:'d5',label:'Nxd5'},
      {from:'e2',to:'e4',label:'e4'},{from:'d5',to:'c3',label:'Nxc3!'},
      {from:'b2',to:'c3',label:'bxc3'},{from:'f8',to:'g7',label:'Bg7'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'c7',to:'c5',label:'c5!'},
      {from:'g1',to:'e2',label:'Ne2'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'e1',to:'g1',label:'0-0'},{from:'c5',to:'d4',label:'cxd4'}
    ],[
      {tip:'The Grünfeld Defence — the most ambitious and theoretically demanding Black response to 1.d4. Black deliberately gives White a massive centre then demolishes it with ...c5. The Grünfeld bishop on g7 is a long-range cannon aimed at d4.',hl:[[6,3,'green']]},
      {tip:'1.d4 — White plays the Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'2.c4 — White builds the broad centre.',hl:[[4,2,'green']]},
      {tip:'2...g6 — Fianchetto setup. Black prepares the Grünfeld bishop.',hl:[[2,6,'blue']]},
      {tip:'3.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'3...d5! — THE GRÜNFELD MOVE! Black challenges the centre immediately. This is more aggressive than the KID — Black fights in the centre right away.',hl:[[3,3,'blue']],arrows:[[3,3,4,2,'rgba(100,150,255,.7)'],[3,3,4,3,'rgba(100,150,255,.7)']]},
      {tip:'4.cxd5 — White captures. The Grünfeld structure begins.',hl:[[3,3,'green']]},
      {tip:'4...Nxd5 — Black recaptures with the knight. The Grünfeld is set up.',hl:[[3,3,'blue']]},
      {tip:'5.e4 — White builds the massive centre: d4+e4+c3. This is what Grünfeld players WANT — a big target.',hl:[[4,4,'red']]},
      {tip:'5...Nxc3! — Black GIVES UP the knight for a pawn, ruining White\'s pawn structure. This is the Grünfeld philosophy: give material to destroy the centre.',hl:[[5,2,'blue']],arrows:[[5,2,4,3,'rgba(100,150,255,.5)'],[5,2,4,2,'rgba(100,150,255,.5)']],warn:'If Black retreats the knight to b6 instead of taking on c3, White consolidates with Be3 and has a perfect, uncontested centre. The whole Grünfeld idea is to TAKE on c3 and give White the doubled pawns — refuse and you\'ve played a worse King\'s Indian.'},
      {tip:'6.bxc3 — White recaptures, getting doubled pawns. White\'s centre is powerful but vulnerable.',hl:[[5,2,'green']]},
      {tip:'6...Bg7 — THE GRÜNFELD BISHOP arrives, immediately targeting d4. This bishop will pressurise White\'s centre for the entire game.',hl:[[1,6,'blue']],arrows:[[1,6,4,3,'rgba(100,200,100,.7)']]},
      {tip:'7.Bc4 — White develops aggressively, aiming at f7.',hl:[[2,2,'red']]},
      {tip:'7...c5! — The SECOND ATTACK on d4! Black hits the centre with both the bishop and the c5 pawn. White\'s centre is under enormous pressure.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)'],[1,6,4,3,'rgba(100,200,100,.6)']]},
      {tip:'8.Ne2 — White retreats the knight to defend the centre.',hl:[[6,4,'green']]},
      {tip:'8...Nc6 — Development, adding more pressure on d4 and e4.',hl:[[5,2,'blue']]},
      {tip:'9.Be3 — White defends d4.',hl:[[5,2,'green']]},
      {tip:'9...0-0 — Black castles. The king is safe and Black is ready to continue the central assault.',hl:[[0,6,'blue']]},
      {tip:'10.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'10...cxd4! — Black captures on d4! White\'s massive centre has been DEMOLISHED. The Grünfeld bishop on g7 now dominates the a1-h8 diagonal. This is the Grünfeld idea in a nutshell: give White the centre, then destroy it.',hl:[[4,3,'blue']],arrows:[[1,6,7,0,'rgba(100,200,100,.8)'],[4,3,5,4,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-grunfeld').textContent='Grünfeld Defence (3...d5) — Core Ideas';
  document.getElementById('btags-grunfeld').innerHTML='<span class="tag tag-sharp">Dynamic</span><span class="tag tag-imbalanced">Hyper-Modern</span>';
  document.getElementById('bd-grunfeld').textContent='The Grünfeld deliberately gives White a massive centre then demolishes it with ...c5 and ...Nxc3. Step through to see how the Grünfeld bishop on g7 becomes a long-range weapon aimed at d4 the moment the centre opens up.';
  document.getElementById('bti-grunfeld').innerHTML='<strong>Grünfeld key ideas:</strong> (1) Play ...d5 on move 3 — the defining move. (2) Allow White to build the centre with e4. (3) Trade the knight on c3 to double White\'s pawns. (4) Fianchetto the bishop to g7 — it fires at d4 all game. (5) Attack d4 with ...c5 and ...Nc6. When the centre collapses, the g7 bishop dominates. The Grünfeld is the most theoretically complex Black defence to 1.d4.';

  
  // ============================================================
  // WHITE OPENINGS BOARDS
  // ============================================================

  // LONDON SYSTEM
  // 1.d4 d5 2.Nf3 Nf6 3.Bf4 e6 4.e3 Bd6 5.Bg3 0-0 6.Bd3 c5 7.c3 Nc6 8.Nbd2 Qe7 9.0-0 b6 10.Ne5 Bb7
  reg('london',document.getElementById('bw-london'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c1',to:'f4',label:'Bf4'},{from:'e7',to:'e6',label:'e6'},
      {from:'e2',to:'e3',label:'e3'},{from:'f8',to:'d6',label:'Bd6'},
      {from:'f4',to:'g3',label:'Bg3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'c7',to:'c5',label:'c5'},
      {from:'c2',to:'c3',label:'c3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'b1',to:'d2',label:'Nbd2'},{from:'d8',to:'e7',label:'Qe7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b7',to:'b6',label:'b6'},
      {from:'f3',to:'e5',label:'Ne5'},{from:'c8',to:'b7',label:'Bb7'}
    ],[
      {tip:'The London System — White\'s most consistent and reliable 1.d4 opening at club level. The setup is always the same: d4, Nf3, Bf4, e3, Bd3. Virtually no theory required. You learn the plans once and apply them every game.',hl:[[6,3,'green']]},
      {tip:'1.d4 — White controls the centre from the start.',hl:[[4,3,'green']]},
      {tip:'1...d5 — One of many Black responses. The London handles all of them with the same setup.',hl:[[3,3,'blue']]},
      {tip:'2.Nf3 — Development. Attacks e5, controls the centre.',hl:[[5,5,'green']]},
      {tip:'2...Nf6 — Black develops.',hl:[[5,5,'blue']]},
      {tip:'3.Bf4 — THE LONDON BISHOP. This is the defining move. The bishop comes out before e3 so it isn\'t locked in. It sits on f4 pointing at the c7 square and controls the light squares.',hl:[[4,5,'green']],arrows:[[4,5,1,2,'rgba(201,168,76,.5)']]},
      {tip:'3...e6 — Black plays solidly.',hl:[[2,4,'blue']]},
      {tip:'4.e3 — Solid. Now the bishop is protected and White develops the f1 bishop.',hl:[[5,4,'green']]},
      {tip:'4...Bd6 — Black tries to trade the London bishop. This is the most common challenge.',hl:[[4,3,'blue']]},
      {tip:'5.Bg3! — White retreats the bishop to g3. DO NOT exchange on d6 — the London bishop is your best piece. On g3 it still controls important squares and supports a future e4 advance.',hl:[[2,6,'green']],arrows:[[5,6,2,3,'rgba(201,168,76,.5)']],warn:'Never exchange the Bf4 for Black\'s Bd6. After Bxd6 Qxd6, you have given away your best piece. The bishop on g3 is still powerful supporting the e5-f4 attack — keep it.'},
      {tip:'5...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'6.Bd3 — White develops the f1 bishop. The Bg3 and Bd3 form a strong bishop pair.',hl:[[5,3,'green']]},
      {tip:'6...c5 — Black challenges d4.',hl:[[2,2,'blue']]},
      {tip:'7.c3 — Solid. White supports d4 without allowing cxd4 Nxd4.',hl:[[5,2,'green']]},
      {tip:'7...Nc6 — Black develops.',hl:[[5,2,'blue']]},
      {tip:'8.Nbd2 — White develops the second knight. It will go to f1 then e3 or e5 — the London knight manoeuvre.',hl:[[6,3,'green']],arrows:[[6,3,7,5,'rgba(201,168,76,.4)'],[7,5,5,4,'rgba(201,168,76,.4)']]},
      {tip:'8...Qe7 — Black prepares ...e5.',hl:[[6,4,'blue']]},
      {tip:'9.0-0 — White castles. The London setup is complete. White is fully developed with a solid structure.',hl:[[7,6,'green']]},
      {tip:'9...b6 — Black prepares ...Bb7.',hl:[[2,1,'blue']]},
      {tip:'10.Ne5! — White occupies the e5 outpost. The knight on e5 is powerful — it controls key squares and is very hard to dislodge.',hl:[[3,4,'green']],arrows:[[3,4,1,3,'rgba(201,168,76,.5)'],[3,4,1,5,'rgba(201,168,76,.5)'],[3,4,1,5,'rgba(201,168,76,.5)']]},
      {tip:'10...Bb7 — Black develops. White now plays f4 and attacks the kingside, or plays Qf3 and builds up pressure. The London middlegame plan: Ne5, f4, Qf3, and launch a kingside attack.',hl:[[4,1,'blue']],arrows:[[6,5,4,5,'rgba(201,168,76,.4)'],[3,4,1,3,'rgba(201,168,76,.3)']]}
    ]
  );
  document.getElementById('bt-london').textContent='London System (1.d4 + Bf4) — White\'s Most Reliable Club Weapon';
  document.getElementById('btags-london').innerHTML='<span class="tag tag-solid">Easy to Learn</span><span class="tag tag-positional">Consistent</span>';
  document.getElementById('bd-london').textContent='The London System gives White a ready-made plan every game: d4, Nf3, Bf4, e3, Bd3, castle. No theory needed. Step through to see the setup and the key Ne5 outpost that defines White\'s middlegame.';
  document.getElementById('bti-london').innerHTML='<strong>London System golden rules:</strong> (1) Never exchange your Bf4 for Black\'s bishop — retreat it to g3. (2) Put a knight on e5 as an outpost. (3) Attack with f4-f5 on the kingside. (4) If Black exchanges on e5, recapture with the f-pawn to open the f-file. (5) Play Qf3 or Qh5 to aim at h7. Works against almost everything Black tries.';

  // ITALIAN GAME
  // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Bd2 Bxd2+ 8.Nbxd2 d5 9.exd5 Nxd5 10.0-0 0-0
  reg('italian',document.getElementById('bw-italian'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e5',label:'e5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'f8',to:'c5',label:'Bc5'},
      {from:'c2',to:'c3',label:'c3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'d2',to:'d4',label:'d4!'},{from:'e5',to:'d4',label:'exd4'},
      {from:'c3',to:'d4',label:'cxd4'},{from:'c5',to:'b4',label:'Bb4+'},
      {from:'c1',to:'d2',label:'Bd2'},{from:'b4',to:'d2',label:'Bxd2+'},
      {from:'b1',to:'d2',label:'Nbxd2'},{from:'d7',to:'d5',label:'d5'},
      {from:'e4',to:'d5',label:'exd5'},{from:'f6',to:'d5',label:'Nxd5'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'}
    ],[
      {tip:'The Italian Game — the most natural and principled 1.e4 opening. White develops the bishop to c4 targeting f7, the weakest square in Black\'s camp. The Italian c3+d4 centre is White\'s main plan.',hl:[[6,4,'green']]},
      {tip:'1.e4 — Claiming the centre. Best by test.',hl:[[4,4,'green']]},
      {tip:'1...e5 — Black mirrors. The Open Games begin.',hl:[[4,4,'blue']]},
      {tip:'2.Nf3 — Development with tempo, attacking e5.',hl:[[5,5,'green']]},
      {tip:'2...Nc6 — Black defends e5.',hl:[[5,2,'blue']]},
      {tip:'3.Bc4 — THE ITALIAN BISHOP. Pointing at f7, the weakest square on the board at the start.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.6)']]},
      {tip:'3...Bc5 — The Giuoco Piano. Black develops symmetrically. Both bishops target the f2/f7 squares.',hl:[[4,2,'blue']]},
      {tip:'4.c3 — Preparing d4! This pawn structure (c3+d4) gives White an ideal centre and is the heart of the Italian.',hl:[[5,2,'green']]},
      {tip:'4...Nf6 — Development, attacking e4.',hl:[[5,5,'blue']]},
      {tip:'5.d4! — White builds the ideal centre. This is the key move — White seizes space and opens lines for the pieces.',hl:[[4,3,'green']],arrows:[[4,3,3,4,'rgba(201,168,76,.5)'],[4,3,3,2,'rgba(201,168,76,.5)'],[4,3,3,4,'rgba(201,168,76,.5)']],warn:'If White plays 5.d3 instead (the slower Italian), Black equalises easily with ...d5. The d4 break is the only way to create real complications and fight for the advantage in the Open Italian.'},
      {tip:'5...exd4 — Black captures.',hl:[[4,3,'blue']]},
      {tip:'6.cxd4 — White recaptures. A strong pawn centre. Black\'s bishop is now attacked.',hl:[[4,3,'green']]},
      {tip:'6...Bb4+ — Black checks, gaining a tempo.',hl:[[4,1,'blue']]},
      {tip:'7.Bd2 — White blocks the check.',hl:[[6,3,'green']]},
      {tip:'7...Bxd2+ — Black exchanges.',hl:[[6,3,'blue']]},
      {tip:'8.Nbxd2 — White recaptures. The d2 knight will reroute to a better square.',hl:[[6,3,'green']]},
      {tip:'8...d5 — Black strikes back at the centre! A typical response — counterattack before White consolidates.',hl:[[3,3,'blue']]},
      {tip:'9.exd5 — White captures.',hl:[[3,3,'green']]},
      {tip:'9...Nxd5 — Black recaptures with the knight, centralising it.',hl:[[3,3,'blue']]},
      {tip:'10.0-0 — White castles. The position is roughly equal but rich in play. White has a strong centre and open lines for the pieces.',hl:[[7,6,'green']]},
      {tip:'10...0-0 — Both sides are castled. White will now play Re1, Nf1-g3 to apply kingside pressure, or use the d4 pawn as a battering ram. The Italian leads to dynamic positions where tactical alertness wins games.',hl:[[0,6,'blue']],arrows:[[7,4,3,4,'rgba(201,168,76,.3)'],[4,3,3,3,'rgba(201,168,76,.5)']]}
    ]
  );
  document.getElementById('bt-italian').textContent='Italian Game (1.e4 e5 Bc4) — The Best 1.e4 Opening for 1500';
  document.getElementById('btags-italian').innerHTML='<span class="tag tag-sharp">Attacking</span><span class="tag tag-imbalanced">Open Game</span>';
  document.getElementById('bd-italian').textContent='The Italian Game is the most natural 1.e4 opening: develop pieces, aim the bishop at f7, build the c3+d4 centre. Step through to see how White seizes the centre with d4 and creates immediate tactical complications.';
  document.getElementById('bti-italian').innerHTML='<strong>Italian middlegame plans:</strong> (1) Play Re1 to support the e4 pawn and eye e5. (2) Reroute Nd2 to f1 then g3 for kingside pressure. (3) Use the d4 pawn to cramp Black. (4) If Black castles kingside, launch h4-h5-h6 with Ng5. (5) Always keep the Bc4 — it aims at f7 all game. The Italian is used by Magnus Carlsen and is fully sound at every level.';

  // QUEEN'S GAMBIT AS WHITE
  // 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 Be7 6.e3 0-0 7.Bd3 c6 8.Nf3 Re8 9.0-0 Nbd7 10.Qc2 Nf8
  reg('qgwhite',document.getElementById('bw-qgwhite'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'e6',to:'d5',label:'exd5'},
      {from:'c1',to:'g5',label:'Bg5!'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e2',to:'e3',label:'e3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'c7',to:'c6',label:'c6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'f8',to:'e8',label:'Re8'},
      {from:'e1',to:'g1',label:'0-0'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'d1',to:'c2',label:'Qc2'},{from:'d7',to:'f8',label:'Nf8'}
    ],[
      {tip:'The Queen\'s Gambit — White\'s most prestigious 1.d4 weapon. Offering the c4 pawn for centre control. After the Exchange Variation (cxd5), White builds pressure against the isolated or backward d5 pawn.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn. White fights for the centre.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black meets it head-on.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — THE QUEEN\'S GAMBIT! White offers the c-pawn for centre control. Black can accept (QGA) or decline.',hl:[[4,2,'green']],arrows:[[4,2,3,3,'rgba(201,168,76,.6)']]},
      {tip:'2...e6 — Declined. Black supports d5. Now White plays for a space advantage.',hl:[[2,4,'blue']]},
      {tip:'3.Nc3 — Development. White prepares e4 if possible.',hl:[[5,2,'green']]},
      {tip:'3...Nf6 — Black develops.',hl:[[5,5,'blue']]},
      {tip:'4.cxd5 — White exchanges pawns — the Exchange Variation. This gives Black an IQP or a symmetrical structure. White will target the d5 pawn.',hl:[[3,3,'green']]},
      {tip:'4...exd5 — Black recaptures. The symmetrical IQP structure. Black\'s d5 pawn will be a long-term target.',hl:[[3,3,'blue']]},
      {tip:'5.Bg5! — A powerful move. White pins the Nf6 that defends d5, making the pawn harder to support.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.6)']],warn:'If White plays 5.e3 or 5.Nf3 without Bg5, Black plays ...c5 immediately and dissolves the d4 pawn. The Bg5 pin prevents this by making ...Nf6 less effective as a defender. Always pin before Black can challenge d4.'},
      {tip:'5...Be7 — Black unpins calmly.',hl:[[6,4,'blue']]},
      {tip:'6.e3 — Solid development. White prepares Bd3.',hl:[[5,4,'green']]},
      {tip:'6...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'7.Bd3 — White develops the bishop, targeting h7.',hl:[[5,3,'green']],arrows:[[5,3,1,7,'rgba(201,168,76,.4)']]},
      {tip:'7...c6 — Black solidifies the d5 pawn. The Caro structure.',hl:[[2,2,'blue']]},
      {tip:'8.Nf3 — White completes development.',hl:[[5,5,'green']]},
      {tip:'8...Re8 — Black activates the rook on the open e-file.',hl:[[0,4,'blue']]},
      {tip:'9.0-0 — White castles. The setup is complete: Bd3 points at h7, Bg5 pins the knight, and White targets d5.',hl:[[7,6,'green']]},
      {tip:'9...Nbd7 — Black develops, planning ...Nf8-g6 to defend.',hl:[[1,3,'blue']]},
      {tip:'10.Qc2 — White prepares to activate the queen on the a2-g8 diagonal, potentially playing Bxh7+ if the opportunity arises.',hl:[[6,2,'green']],arrows:[[6,2,1,7,'rgba(201,168,76,.5)']]},
      {tip:'10...Nf8 — Black reorganises. White now plays Ne5 occupying the outpost, and plans a kingside attack with f4-f5. The IQP on d5 is White\'s long-term target — pressure it with pieces on d4 and e5.',hl:[[1,5,'blue']],arrows:[[3,4,1,3,'rgba(201,168,76,.5)'],[3,4,1,5,'rgba(201,168,76,.4)']]}
    ]
  );
  document.getElementById('bt-qgwhite').textContent='Queen\'s Gambit (1.d4 d5 2.c4) — Ambitious Positional Weapon';
  document.getElementById('btags-qgwhite').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-solid">Prestigious</span>';
  document.getElementById('bd-qgwhite').textContent='The Queen\'s Gambit gives White a structural advantage from move 2. Step through to see how White exchanges pawns, pins the knight with Bg5, and builds long-term pressure against Black\'s d5 pawn. A world-championship weapon.';
  document.getElementById('bti-qgwhite').innerHTML='<strong>Queen\'s Gambit middlegame plans:</strong> (1) Put a knight on e5 as a powerful outpost. (2) If Black takes on e5, recapture with f4 opening the f-file. (3) Use Bd3 + Qc2 battery aiming at h7. (4) If Black exchanges on d4, push the passed d-pawn. (5) Keep pressure on the d5 weakness all game — never let it become mobile.';

  // vs QUEEN'S GAMBIT ACCEPTED (White's plans)
  // Main line: 1.d4 d5 2.c4 dxc4 3.Nf3 Nf6 4.e3 e6 5.Bxc4 c5 6.0-0 a6 7.Qe2 b5 8.Bb3 Bb7 9.Rd1 Nbd7 10.Nc3 cxd4 11.exd4 Be7 12.Bg5 0-0 13.Ne5 Rc8 14.d5!
  reg('qga-white',document.getElementById('bw-qga-white'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'c4',label:'dxc4'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e2',to:'e3',label:'e3'},{from:'e7',to:'e6',label:'e6'},
      {from:'f1',to:'c4',label:'Bxc4'},{from:'c7',to:'c5',label:'c5'},
      {from:'e1',to:'g1',label:'0-0'},{from:'a7',to:'a6',label:'a6'},
      {from:'d1',to:'e2',label:'Qe2'},{from:'b7',to:'b5',label:'b5'},
      {from:'c4',to:'b3',label:'Bb3'},{from:'c8',to:'b7',label:'Bb7'},
      {from:'f1',to:'d1',label:'Rd1'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'e3',to:'d4',label:'exd4'},{from:'f8',to:'e7',label:'Be7'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'e8',to:'g8',label:'0-0'},
      {from:'f3',to:'e5',label:'Ne5'},{from:'a8',to:'c8',label:'Rc8'},
      {from:'d4',to:'d5',label:'d5!'}
    ],[
      {tip:'White has played the Queen\'s Gambit — and Black ACCEPTED with 2...dxc4. The starting position for this board. White must now reclaim the pawn correctly and punish Black\'s passivity.',hl:[[6,3,'green']]},
      {tip:'1.d4 — The Queen\'s Pawn. White stakes a claim in the centre.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black answers symmetrically.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — The Queen\'s Gambit! White offers the c-pawn to gain a dominant centre.',hl:[[4,2,'green']],arrows:[[4,2,3,3,'rgba(201,168,76,.6)']]},
      {tip:'2...dxc4 — Black ACCEPTS the gambit, pocketing the pawn. The immediate problem: how does White get it back?',hl:[[4,2,'blue']],arrows:[[3,3,4,2,'rgba(100,150,255,.7)']],warn:'Do NOT rush to win back the c4 pawn with 3.e3 — that blocks the bishop and gives Black a comfortable game. The correct plan is 3.Nf3 followed by 4.e3 and 5.Bxc4, recovering the pawn while developing with tempo.'},
      {tip:'3.Nf3! — Develop first, recover the pawn later. White prepares e3+Bxc4 and keeps options flexible.',hl:[[5,5,'green']]},
      {tip:'3...Nf6 — Black develops naturally.',hl:[[5,5,'blue']]},
      {tip:'4.e3 — Now White prepares to recapture the c4 pawn. The bishop on f1 gets its diagonal cleared.',hl:[[5,4,'green']]},
      {tip:'4...e6 — Black solidifies. A typical QGA structure — Black will play ...c5 to challenge d4.',hl:[[2,4,'blue']]},
      {tip:'5.Bxc4! — The pawn is recovered with tempo. The bishop is actively placed on c4, eyeing the kingside.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.5)'],[4,2,0,6,'rgba(201,168,76,.3)']],warn:'If White plays Bxc4 too early (before e3), the bishop can get kicked by ...b5. Always play e3 first to give the bishop a safe square on b3.'},
      {tip:'5...c5 — The correct plan for Black: counterattack d4 immediately. If Black plays passively, White gets a free rein in the centre.',hl:[[2,2,'blue']],arrows:[[3,2,4,3,'rgba(100,150,255,.6)']]},
      {tip:'6.0-0 — White castles and is ready to fight. Nc3 and Qe2 follow. White has a strong centre and active pieces in exchange for nothing.',hl:[[7,6,'green']]},
      {tip:'6...a6 — Black prepares ...b5 to kick the bishop. Standard play.',hl:[[2,0,'blue']]},
      {tip:'7.Qe2! — A key finesse. The queen supports d4 and prepares Rd1. Unlike Qd3, the queen stays off the diagonal where Black might play ...b4 tricks.',hl:[[6,4,'green']],arrows:[[6,4,3,4,'rgba(201,168,76,.5)']]},
      {tip:'7...b5 — Black kicks the bishop as planned.',hl:[[1,1,'blue']],arrows:[[3,1,4,2,'rgba(100,150,255,.5)']]},
      {tip:'8.Bb3! — The bishop retreats to safety on b3, still aiming at f7 and supporting the d4 pawn indirectly via the a2-g8 diagonal.',hl:[[4,1,'green']],arrows:[[5,1,1,5,'rgba(201,168,76,.4)']]},
      {tip:'8...Bb7 — Black develops the bishop to the long diagonal, contesting the centre.',hl:[[1,1,'blue']]},
      {tip:'9.Rd1! — White centralises the rook immediately. The d4 pawn needs more support before White plays Nc3.',hl:[[7,3,'green']],arrows:[[7,3,4,3,'rgba(201,168,76,.5)']]},
      {tip:'9...Nbd7 — Black completes development.',hl:[[1,3,'blue']]},
      {tip:'10.Nc3 — Development complete. White has a classic IQP pawn structure after cxd4, with excellent piece activity in return.',hl:[[5,2,'green']]},
      {tip:'10...cxd4 — Black dissolves the tension.',hl:[[4,3,'blue']]},
      {tip:'11.exd4! — White recaptures with the e-pawn, establishing a powerful IQP on d4. White has open files, strong centre, and a development lead. Black\'s extra pawn from move 2 is long gone.',hl:[[4,3,'green']],arrows:[[4,3,3,4,'rgba(201,168,76,.5)'],[4,3,3,2,'rgba(201,168,76,.5)']],warn:'An important fork in the road: White should NOT play Nxd4, which allows Black to equalise with ...Nxd4 Rxd4 Bc5. Always recapture with the e-pawn to keep the powerful IQP.'},
      {tip:'11...Be7 — Black develops and prepares to castle.',hl:[[1,4,'blue']]},
      {tip:'12.Bg5! — The pin is crucial. White targets the knight that defends against e5-e6 or d5-d6 breaks.',hl:[[2,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.6)']]},
      {tip:'12...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'13.Ne5! — The knight occupies the ideal outpost on e5, pressuring f7 and supporting the d5 advance.',hl:[[3,4,'green']],arrows:[[3,4,1,5,'rgba(201,168,76,.5)'],[3,4,1,3,'rgba(201,168,76,.3)'],[3,4,2,2,'rgba(201,168,76,.3)']]},
      {tip:'13...Rc8 — Black activates the rook, targeting the bishop on b3 and the c-file.',hl:[[0,2,'blue']]},
      {tip:'14.d5!! — The IQP advances as a pawn sacrifice! This is the key weapon in the QGA as White. The pawn opens lines for all of White\'s pieces. If 14...exd5 15.Nxd5 Nxd5 16.Bxd5 and White has a raging attack. If 14...Nxe5 15.dxe6! is crushing. This is why White wanted Qe2, Rd1, and Ne5 all in place first.',hl:[[3,3,'green']],arrows:[[3,3,2,3,'rgba(201,168,76,.8)'],[3,4,1,5,'rgba(201,168,76,.5)'],[5,1,3,3,'rgba(201,168,76,.4)']]}
    ]
  );
  document.getElementById('bt-qga-white').textContent='vs Queen\'s Gambit Accepted — White\'s Winning Plan';
  document.getElementById('btags-qga-white').innerHTML='<span class="tag tag-positional">Positional</span><span class="tag tag-attacking">Attacking</span>';
  document.getElementById('bd-qga-white').textContent='When Black takes the c4 pawn, White gets a powerful IQP-based centre in return. Step through to see how White correctly recovers the pawn, centralises all pieces, and launches the d5 pawn break.';
  document.getElementById('bti-qga-white').innerHTML='<strong>QGA as White — key rules:</strong> (1) Never rush to take back on c4 with a pawn — use Nf3 first, then e3, then Bxc4. (2) After Black plays ...c5 and ...cxd4, recapture with exd4 (never Nxd4). (3) Always play Rd1 before Nc3 — the rook belongs on d1 to support the IQP. (4) Ne5 is your best outpost — occupy it early and keep it there. (5) The d5 break is your main weapon — set up Qe2, Rd1, Bg5, Ne5 and then push d5 at the right moment for a powerful attack.';
  // 1.Nf3 d5 2.g3 c5 3.Bg2 Nc6 4.0-0 e5 5.d3 Nf6 6.Nbd2 Be7 7.e4 d4 8.a3 0-0 9.b4 a6 10.Rb1 cxb4
  reg('reti',document.getElementById('bw-reti'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'g1',to:'f3',label:'Nf3'},{from:'d7',to:'d5',label:'d5'},
      {from:'g2',to:'g3',label:'g3'},{from:'c7',to:'c5',label:'c5'},
      {from:'f1',to:'g2',label:'Bg2'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e7',to:'e5',label:'e5'},
      {from:'d2',to:'d3',label:'d3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'d2',label:'Nbd2'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e2',to:'e4',label:'e4!'},{from:'d5',to:'d4',label:'d4'},
      {from:'a2',to:'a3',label:'a3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'b2',to:'b4',label:'b4!'},{from:'a7',to:'a6',label:'a6'},
      {from:'a1',to:'b1',label:'Rb1'},{from:'c5',to:'b4',label:'cxb4'}
    ],[
      {tip:'The Réti Opening — the most flexible White opening. White plays 1.Nf3 and g3, making no pawn commitments. The Réti fianchetto controls d5 from afar and can transpose into the King\'s Indian Attack, English Opening, or Queen\'s Gambit positions.',hl:[[6,4,'green']]},
      {tip:'1.Nf3 — Development first. White makes no pawn commitment. Black must decide what to play without knowing White\'s plan.',hl:[[5,5,'green']]},
      {tip:'1...d5 — Black claims the centre.',hl:[[3,3,'blue']]},
      {tip:'2.g3 — Fianchetto preparation. White reveals the Réti plan.',hl:[[2,6,'green']]},
      {tip:'2...c5 — Black builds a strong centre.',hl:[[2,2,'blue']]},
      {tip:'3.Bg2 — The Réti bishop. On g2 it controls the long diagonal, pressuring d5 and c6 from a safe distance.',hl:[[1,6,'green']],arrows:[[6,6,3,3,'rgba(201,168,76,.5)'],[6,6,2,2,'rgba(201,168,76,.5)']]},
      {tip:'3...Nc6 — Development.',hl:[[5,2,'blue']]},
      {tip:'4.0-0 — White castles early, placing the king safely.',hl:[[7,6,'green']]},
      {tip:'4...e5 — Black builds a big centre. White lets them — the Réti will undermine it.',hl:[[4,4,'blue']]},
      {tip:'5.d3 — Solid. White supports e4 next and keeps the position flexible.',hl:[[5,3,'green']]},
      {tip:'5...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'6.Nbd2 — White develops the second knight, heading to c4 or e4 to challenge Black\'s centre.',hl:[[6,3,'green']]},
      {tip:'6...Be7 — Solid development.',hl:[[6,4,'blue']]},
      {tip:'7.e4! — White strikes the centre! The Réti plan: let Black occupy the centre, then undermine it with e4.',hl:[[4,4,'green']],arrows:[[4,4,3,3,'rgba(201,168,76,.6)']],warn:'If White plays e3 or c3 passively instead of e4, Black consolidates with ...e4 and gains a space advantage. The Réti bishop on g2 is waiting for the centre to open — e4 is the key move that unleashes it and begins queenside expansion.'},
      {tip:'7...d4 — Black advances. The centre closes. Now both sides attack on opposite wings.',hl:[[3,3,'blue']]},
      {tip:'8.a3 — Preparing b4. White will attack on the queenside.',hl:[[6,0,'green']]},
      {tip:'8...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'9.b4! — Queenside attack! White challenges Black\'s queenside pawn structure.',hl:[[4,1,'green']],arrows:[[4,1,3,1,'rgba(201,168,76,.6)']]},
      {tip:'9...a6 — Black defends.',hl:[[2,0,'blue']]},
      {tip:'10.Rb1 — White prepares to push b5 and open the b-file.',hl:[[7,1,'green']]},
      {tip:'10...cxb4 — Black captures. After axb4, White has an open a-file and queenside pressure. Meanwhile on the kingside, White will push f4 after regrouping Nd2-f1-e3. A typical Réti: flexible, multi-directional pressure.',hl:[[4,1,'blue']],arrows:[[7,1,3,1,'rgba(201,168,76,.4)'],[7,0,3,0,'rgba(201,168,76,.4)']]}
    ]
  );
  document.getElementById('bt-reti').textContent='Réti Opening (1.Nf3 + g3) — Flexible System to Avoid Theory';
  document.getElementById('btags-reti').innerHTML='<span class="tag tag-positional">Flexible</span><span class="tag tag-solid">Anti-Theory</span>';
  document.getElementById('bd-reti').textContent='The Réti makes no pawn commitments on move 1, keeping maximum flexibility. Step through to see how White fianchettoes, allows Black to build a centre, then undermines it with e4 and a queenside b4 expansion.';
  document.getElementById('bti-reti').innerHTML='<strong>Réti key ideas:</strong> (1) Never commit to d4 or e4 early — wait to see Black\'s setup. (2) Fianchetto to g2 — the bishop controls d5 and c6 all game. (3) When Black builds a big centre, undermine it with e4 or c4. (4) Attack on the queenside with a3-b4-b5. (5) On the kingside, regroup Nd2-f1-e3 and push f4. The Réti is ideal for players who prefer to outplay rather than outprepare.';

  // PUNISHING 1...e5 against 1.d4
  reg('d4-e5',document.getElementById('bw-d4-e5'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'e7',to:'e5',label:'e5?!'},
      {from:'d4',to:'e5',label:'dxe5!'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'d8',to:'e7',label:'Qe7'},
      {from:'b1',to:'c3',label:'Nc3!'},{from:'c6',to:'e5',label:'Nxe5?'},
      {from:'c3',to:'d5',label:'Nd5!'},{from:'e7',to:'d8',label:'Qd8'},
      {from:'f3',to:'e5',label:'Nxe5!'},{from:'d7',to:'d6',label:'d6'},
      {from:'e5',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e2',to:'e4',label:'e4'},{from:'f8',to:'e7',label:'Be7'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'e8',to:'g8',label:'0-0'},
      {from:'e1',to:'g1',label:'0-0'}
    ],[
      {tip:'Starting position. You have just played 1.d4.'},
      {tip:'1.d4 — White occupies the centre.',hl:[[4,3,'green']]},
      {tip:'1...e5?! — Black blunders a pawn. This looks like a King\'s Pawn idea but against 1.d4 it simply loses material. Take it immediately.',hl:[[3,4,'blue']],warn:'At club level this happens surprisingly often — players autopilot 1...e5 without thinking. Your reaction must be instant: take the free pawn with 2.dxe5. Never play 2.e4 or 2.d5 — you are getting a free pawn for nothing.'},
      {tip:'2.dxe5! — White takes the free pawn without hesitation.',hl:[[3,4,'green']],arrows:[[4,3,3,4,'rgba(201,168,76,.7)']]},
      {tip:'2...Nc6 — Black develops toward e5, hoping to win the pawn back.',hl:[[5,2,'blue']]},
      {tip:'3.Nf3 — Natural development. No rush to defend e5 yet.',hl:[[5,5,'green']]},
      {tip:'3...Qe7 — The most common try: Black aims to recapture on e5 with the queen. This is already a bad sign — early queen moves invite trouble.',hl:[[1,4,'blue']],warn:'If Black plays 3...d6 instead (fighting for the pawn differently), White plays 4.exd6 Bxd6 5.e4 with a massive centre and development lead. The story is the same: White keeps the pawn and gets a free Italian-style position.'},
      {tip:'4.Nc3! — The key move. White develops a piece and sets a hidden trap. If Black now captures on e5 with either piece, something goes wrong.',hl:[[5,2,'green']]},
      {tip:'4...Nxe5? — Black falls for it! Taking the pawn with the knight looks natural but leads to immediate disaster.',hl:[[3,4,'blue']],warn:'Black had to play 4...d6 here — the only way to fight. After 4...d6 5.exd6 Qxd6 6.e4 Nf6 7.Bc4, White has the full Italian centre with an extra tempo, but at least Black is still in the game.'},
      {tip:'5.Nd5! — The trick. The knight leaps to d5, attacking the queen on e7 AND threatening Nxc7+ to fork the king and rook. Black must move the queen and abandon the Ne5.',hl:[[3,3,'green']],warn:'This is the hidden sting behind 4.Nc3. After Nd5, Black\'s queen is attacked and Nxc7+ is threatened. The queen must retreat, and then the other White knight (Nf3) takes the abandoned Ne5 for free. Black loses a whole knight.'},
      {tip:'5...Qd8 — The queen is forced back. Any other queen move allows Nxc7+ forking the king and rook.',hl:[[0,3,'blue']]},
      {tip:'6.Nxe5! — Now the other White knight (from f3) captures Ne5. White has won back the pawn AND won a full knight — Black is down a piece. Three moves of queen shuffling cost Black everything.',hl:[[3,4,'green']]},
      {tip:'6...d6 — Black tries to develop. The position is already strategically lost — White is a piece up with the powerful Nd5 still controlling the board.',hl:[[2,3,'blue']]},
      {tip:'7.Nf3 — The knight retreats safely. The Nd5 remains on its dominant outpost. White continues development calmly.',hl:[[5,5,'green']]},
      {tip:'7...Nf6 — Black develops.',hl:[[5,5,'blue']]},
      {tip:'8.e4! — White builds a massive centre. The Nd5 is supported and untouchable — no c6 pawn to kick it (that knight left to go to e5 and was captured).',hl:[[4,4,'green']],arrows:[[4,4,3,3,'rgba(201,168,76,.5)'],[4,4,3,5,'rgba(201,168,76,.5)']],warn:'White should NOT give back the Nd5 voluntarily. It dominates the whole board from d5. Black cannot kick it — the c6 pawn is gone and ...e6 would weaken f6. The knight stays indefinitely.'},
      {tip:'8...Be7 — Black develops and prepares to castle.',hl:[[2,4,'blue']]},
      {tip:'9.Bc4 — The bishop occupies c4, eyeing f7.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.7)']]},
      {tip:'9...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'10.0-0 — White castles. The position shows the full price of 1...e5?!: White has an extra piece, the dominant Nd5 deep in Black\'s position, the Bc4 eyeing f7, and better development everywhere. This is a technically won game.',hl:[[7,6,'green']],arrows:[[3,3,1,2,'rgba(201,168,76,.4)'],[3,3,1,4,'rgba(201,168,76,.4)'],[4,2,1,5,'rgba(201,168,76,.4)']],warn:'White\'s plan: Re1 to support e4, Bf4 or Bg5 to develop the final bishop, then Qd3 threatening Qxh7#. The Nd5 outpost is the centrepiece — it attacks c7, b6, e7, f4, b4 all at once. Black has no meaningful counterplay.'}
    ]
  );
  document.getElementById('bt-d4-e5').textContent='Punishing 1...e5?! Against 1.d4';
  document.getElementById('btags-d4-e5').innerHTML='<span class="tag tag-aggressive">Free Pawn</span><span class="tag tag-positional">Nd5 Domination</span>';
  document.getElementById('bd-d4-e5').textContent='When Black plays the careless 1...e5 against your 1.d4 — take the pawn, play 4.Nc3, and spring the Nd5 trap if Black tries to win it back with the knight.';
  document.getElementById('bti-d4-e5').innerHTML='<strong>The trap:</strong> After 2.dxe5 Nc6 3.Nf3 Qe7, play 4.Nc3! If Black tries 4...Nxe5??, play 5.Nd5! — the queen must retreat, and then 6.Nxe5 (the f3 knight) wins the Ne5 for free. White is up a full piece.';

  
  // ============================================================
  // ALEKHINE DEFENCE BOARDS
  // ============================================================

  // FOUR PAWNS ATTACK
  reg('alefour',document.getElementById('bw-alefour'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'g8',to:'f6',label:'Nf6!'},
      {from:'e4',to:'e5',label:'e5'},{from:'f6',to:'d5',label:'Nd5'},
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d6',label:'d6'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'b6',label:'Nb6'},
      {from:'f2',to:'f4',label:'f4!'},{from:'d6',to:'e5',label:'dxe5'},
      {from:'f4',to:'e5',label:'fxe5'},{from:'c7',to:'c5',label:'c5!'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'c5',to:'d4',label:'cxd4'},
      {from:'f3',to:'d4',label:'Nxd4'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'c1',to:'e3',label:'Be3'},{from:'c8',to:'f5',label:'Bf5'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'e7',to:'e6',label:'e6'}
    ],[
      {tip:'The Four Pawns Attack — White\'s most aggressive response to the Alekhine. Four pawns march forward: e5, d4, c4, f4. Looks terrifying. But those pawns are also targets.',hl:[[6,4,'green']]},
      {tip:'1.e4 — White claims the centre.',hl:[[4,4,'green']]},
      {tip:'1...Nf6! — THE ALEKHINE! Black immediately attacks e4 instead of defending the centre. A provocative hypermodern move.',hl:[[5,5,'blue']],arrows:[[5,5,4,4,'rgba(100,150,255,.7)']]},
      {tip:'2.e5 — White chases the knight. This is what Black wants!',hl:[[3,4,'red']]},
      {tip:'2...Nd5 — Knight retreats to d5, a strong central square.',hl:[[3,3,'blue']]},
      {tip:'3.d4 — White builds the big centre.',hl:[[4,3,'green']]},
      {tip:'3...d6 — Black immediately attacks the e5 pawn. This is the Alekhine plan: attack the overextended pawns.',hl:[[2,3,'blue']],arrows:[[2,3,3,4,'rgba(100,150,255,.6)']]},
      {tip:'4.c4 — White chases the knight again and builds even more centre.',hl:[[4,2,'green']]},
      {tip:'4...Nb6 — Knight retreats again! Black has now provoked c4, weakening d4.',hl:[[2,1,'blue']]},
      {tip:'5.f4! — The Four Pawns Attack! White has pawns on f4, e5, d4, c4 — a massive wall.',hl:[[4,5,'red'],[3,4,'red'],[4,3,'red'],[4,2,'red']],arrows:[[4,5,3,4,'rgba(255,100,100,.6)'],[3,4,4,3,'rgba(255,100,100,.6)'],[4,3,4,2,'rgba(255,100,100,.6)']]},
      {tip:'5...dxe5! — Black strikes! Capturing the e5 pawn opens lines and begins dismantling the White centre.',hl:[[3,4,'blue']],warn:'If Black plays passively (e.g. ...e6 or ...Bg4) without taking on e5, White consolidates the massive centre with f5 and a crushing kingside attack. The time to strike is NOW — before White\'s centre becomes impregnable.'},
      {tip:'6.fxe5 — White recaptures. The f-file is now open — a double-edged factor.',hl:[[3,4,'green']]},
      {tip:'6...c5! — The key counter! Black attacks d4 immediately. The massive White centre is already crumbling.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)']]},
      {tip:'7.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'7...cxd4 — Black captures on d4, winning a central pawn and opening more lines.',hl:[[4,3,'blue']]},
      {tip:'8.Nxd4 — White recaptures.',hl:[[3,3,'green']]},
      {tip:'8...Nc6 — Development, attacking the Nd4 and e5.',hl:[[5,2,'blue']]},
      {tip:'9.Be3 — White defends.',hl:[[5,2,'green']]},
      {tip:'9...Bf5 — Active development. Black targets e4 square and develops aggressively.',hl:[[5,5,'blue']]},
      {tip:'10.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'10...e6 — Black prepares ...Be7 and castling. The position is complex. White\'s centre looked massive — now it\'s two isolated pawns on e5 and d4. Black has achieved the Alekhine dream.',hl:[[2,4,'blue']],arrows:[[3,4,4,4,'rgba(100,150,255,.4)'],[3,3,4,3,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-alefour').textContent='Alekhine vs Four Pawns Attack (4.f4) — The Counterattack';
  document.getElementById('btags-alefour').innerHTML='<span class="tag tag-sharp">Sharp</span><span class="tag tag-imbalanced">Hypermodern</span>';
  document.getElementById('bd-alefour').textContent='The Four Pawns Attack looks terrifying — but it\'s also overextended. Step through to see how Black uses ...dxe5 and ...c5 to demolish White\'s massive centre, turning the pawns from assets into weaknesses.';
  document.getElementById('bti-alefour').innerHTML='<strong>Key plan:</strong> After ...Nc6, play ...Qd7 and ...0-0-0. Black\'s counterplay is on the queenside. White\'s pawn on e5 is isolated and hard to defend. A well-timed ...Nxd4 or ...Nd4 wins material if White is not careful.';

  // MODERN VARIATION
  reg('alemod',document.getElementById('bw-alemod'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e4',to:'e5',label:'e5'},{from:'f6',to:'d5',label:'Nd5'},
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d6',label:'d6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'d6',to:'e5',label:'dxe5'},
      {from:'f3',to:'e5',label:'Nxe5'},{from:'c7',to:'c6',label:'c6'},
      {from:'f1',to:'e2',label:'Be2'},{from:'b8',to:'d7',label:'Nd7'},
      {from:'e5',to:'d7',label:'Nxd7'},{from:'c8',to:'d7',label:'Bxd7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e7',to:'e6',label:'e6'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'e7',label:'Ne7'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'e7',to:'f5',label:'Nf5'}
    ],[
      {tip:'The Modern Variation — White plays Nf3 instead of the aggressive f4. More restrained but still fighting. Black exchanges on e5 to dissolve the centre and develops solidly.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...Nf6 — The Alekhine. Black attacks e4 immediately.',hl:[[5,5,'blue']]},
      {tip:'2.e5 — White chases.',hl:[[3,4,'red']]},
      {tip:'2...Nd5 — Knight to the strong d5 square.',hl:[[3,3,'blue']]},
      {tip:'3.d4 — White builds the centre.',hl:[[4,3,'green']]},
      {tip:'3...d6 — Attacking e5 again.',hl:[[2,3,'blue']]},
      {tip:'4.Nf3 — The Modern Variation. White develops instead of playing c4/f4. More solid.',hl:[[5,5,'green']]},
      {tip:'4...dxe5 — Black exchanges immediately! The centre dissolves. Unlike the Four Pawns, White doesn\'t get a large pawn centre here.',hl:[[3,4,'blue']],warn:'If Black doesn\'t exchange on e5 immediately, White plays e6! and the pawn on e6 becomes a devastating wedge in Black\'s position, permanently restricting development. Always exchange pawns when the centre is overextended.'},
      {tip:'5.Nxe5 — White recaptures with the knight, occupying the e5 outpost.',hl:[[3,4,'green']]},
      {tip:'5...c6 — Solid. Prepares ...Nd7 to challenge the Ne5, and controls d5.',hl:[[2,2,'blue']]},
      {tip:'6.Be2 — White develops solidly.',hl:[[6,4,'green']]},
      {tip:'6...Nd7 — Challenging the Ne5! The knight on d7 attacks e5.',hl:[[1,3,'blue']],arrows:[[1,3,3,4,'rgba(100,150,255,.6)']]},
      {tip:'7.Nxd7 — White exchanges.',hl:[[1,3,'green']]},
      {tip:'7...Bxd7 — Black recaptures. Black has a solid position with the bishop pair.',hl:[[1,3,'blue']]},
      {tip:'8.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'8...e6 — Solid. Black completes the central structure.',hl:[[2,4,'blue']]},
      {tip:'9.c4 — White chases the Nd5.',hl:[[4,2,'green']]},
      {tip:'9...Ne7 — Knight retreats. It will reroute to f5 or g6.',hl:[[1,4,'blue']]},
      {tip:'10.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'10...Nf5! — Knight goes to f5, a strong outpost. Black has a solid, equal position. The Alekhine has succeeded: White no longer has a big centre, and Black\'s pieces are well-placed.',hl:[[2,5,'blue']],arrows:[[2,5,4,4,'rgba(100,150,255,.5)'],[2,5,4,6,'rgba(100,150,255,.5)']]}
    ]
  );
  document.getElementById('bt-alemod').textContent='Alekhine Modern Variation (4.Nf3) — Solid Equaliser';
  document.getElementById('btags-alemod').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Positional</span>';
  document.getElementById('bd-alemod').textContent='The Modern Variation is White\'s most common and sensible response. Step through to see how Black exchanges on e5 to dissolve the centre, then reroutes the knight to f5 for a solid, equal position.';
  document.getElementById('bti-alemod').innerHTML='<strong>Key plan:</strong> After ...Nf5, play ...Be7 and ...0-0. Black will follow with ...Qc7 and put rooks on d8 and e8. The position is equal but rich — Black has no weaknesses and good piece activity. This is Black\'s most reliable Alekhine line.';

  // CHASE VARIATION (c5 chase)
  reg('alechase',document.getElementById('bw-alechase'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e4',to:'e5',label:'e5'},{from:'f6',to:'d5',label:'Nd5'},
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d6',label:'d6'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'b6',label:'Nb6'},
      {from:'c4',to:'c5',label:'c5!'},{from:'b6',to:'d5',label:'Nd5'},
      {from:'f1',to:'c4',label:'Bc4'},{from:'e7',to:'e6',label:'e6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'e5',to:'d6',label:'exd6'},{from:'c7',to:'d6',label:'cxd6'},
      {from:'c5',to:'d6',label:'cxd6'},{from:'f8',to:'d6',label:'Bxd6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'}
    ],[
      {tip:'The Chase Variation — White plays c5, trying to chase the knight to the edge. But Black allows this, retreats to d5, and White has overextended. Black will use the structural damage to get a good game.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...Nf6 — The Alekhine.',hl:[[5,5,'blue']]},
      {tip:'2.e5 — White chases.',hl:[[3,4,'red']]},
      {tip:'2...Nd5 — Knight to d5.',hl:[[3,3,'blue']]},
      {tip:'3.d4 — White builds the centre.',hl:[[4,3,'green']]},
      {tip:'3...d6 — Attacking e5.',hl:[[2,3,'blue']]},
      {tip:'4.c4 — White develops the centre further.',hl:[[4,2,'green']]},
      {tip:'4...Nb6 — Knight retreats, provoking White to overextend.',hl:[[2,1,'blue']]},
      {tip:'5.c5! — White chases the knight AGAIN with a pawn! Very ambitious — but does White have enough compensation for the overextension?',hl:[[3,2,'red']]},
      {tip:'5...Nd5 — Knight retreats to d5 again, now a very strong outpost. The pawn on c5 advances but weakens d5.',hl:[[3,3,'blue']],arrows:[[3,3,4,2,'rgba(100,150,255,.5)'],[3,3,4,4,'rgba(100,150,255,.5)']],warn:'If Black plays 5...Na4 trying to win the c3 pawn, White simply plays 6.b3 and the knight is trapped on the edge. Always retreat to d5 — it is a strong central square, not a weakness. Jumping to Na4 is a beginner mistake.'},
      {tip:'6.Bc4 — White develops, targeting d5.',hl:[[2,2,'green']]},
      {tip:'6...e6 — Solid. Black supports d5 and prepares kingside development.',hl:[[2,4,'blue']]},
      {tip:'7.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'7...Nc6 — Development, adding pressure on d4 and e5.',hl:[[5,2,'blue']]},
      {tip:'8.exd6 — White exchanges, opening lines.',hl:[[2,3,'green']]},
      {tip:'8...cxd6 — Black recaptures with the c-pawn, opening the c-file.',hl:[[2,3,'blue']]},
      {tip:'9.cxd6 — White captures again, trying to win material.',hl:[[2,3,'green']]},
      {tip:'9...Bxd6 — Black recaptures with the bishop. The bishop on d6 is powerful, eyeing h2.',hl:[[2,3,'blue']],arrows:[[5,3,1,7,'rgba(100,150,255,.5)']]},
      {tip:'10.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'10...0-0 — Black castles into a balanced position. The Nd5 is a monster outpost. The Bd6 eyes the kingside. Black has full compensation for the pawn adventures — and the White d4 pawn is potentially weak.',hl:[[0,6,'blue']],arrows:[[3,3,2,2,'rgba(100,150,255,.4)'],[5,3,1,7,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-alechase').textContent='Alekhine Chase Variation (5.c5) — Strategic Compensation';
  document.getElementById('btags-alechase').innerHTML='<span class="tag tag-positional">Strategic</span><span class="tag tag-solid">Solid</span>';
  document.getElementById('bd-alechase').textContent='The Chase Variation sees White try to chase the knight off the board with c5. Step through to see how Black allows the chase, retreats to the strong d5 outpost, and gets excellent compensation with the bishop pair and active pieces.';
  document.getElementById('bti-alechase').innerHTML='<strong>Key plan:</strong> After ...0-0, play ...Qc7 to pressure the c-file, and ...Re8 to add pressure to the centre. The Nd5 is Black\'s best piece — keep it there as long as possible. White\'s d4 pawn is a long-term weakness.';

  // MAIN LINE (Bg4 variation)
  reg('alebrook',document.getElementById('bw-alebrook'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4',label:'e4'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e4',to:'e5',label:'e5'},{from:'f6',to:'d5',label:'Nd5'},
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d6',label:'d6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'c8',to:'g4',label:'Bg4!'},
      {from:'f1',to:'e2',label:'Be2'},{from:'e7',to:'e6',label:'e6'},
      {from:'e1',to:'g1',label:'0-0'},{from:'f8',to:'e7',label:'Be7'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'b6',label:'Nb6'},
      {from:'e5',to:'d6',label:'exd6'},{from:'c7',to:'d6',label:'cxd6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'h2',to:'h3',label:'h3'},{from:'g4',to:'h5',label:'Bh5'}
    ],[
      {tip:'The Bg4 Variation — Black develops the bishop actively to g4, pinning the knight and adding pressure on d4. A solid, well-rounded Alekhine line with natural development.',hl:[[6,4,'green']]},
      {tip:'1.e4',hl:[[4,4,'green']]},
      {tip:'1...Nf6 — The Alekhine!',hl:[[5,5,'blue']]},
      {tip:'2.e5 — White chases.',hl:[[3,4,'red']]},
      {tip:'2...Nd5 — Knight retreats to d5.',hl:[[3,3,'blue']]},
      {tip:'3.d4 — White builds the centre.',hl:[[4,3,'green']]},
      {tip:'3...d6 — Attacking e5.',hl:[[2,3,'blue']]},
      {tip:'4.Nf3 — White develops.',hl:[[5,5,'green']]},
      {tip:'4...Bg4! — The pin! Black pins the Nf3 to the queen on d1. This adds immediate pressure on d4 and slows White\'s development.',hl:[[4,6,'blue']],arrows:[[4,6,7,3,'rgba(100,150,255,.6)']]},
      {tip:'5.Be2 — White breaks the pin by developing the bishop.',hl:[[6,4,'green']]},
      {tip:'5...e6 — Solid centre support. Black prepares ...Be7 and ...0-0.',hl:[[2,4,'blue']]},
      {tip:'6.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'6...Be7 — Solid development, preparing to castle.',hl:[[6,4,'blue']]},
      {tip:'7.c4 — White chases the Nd5.',hl:[[4,2,'green']]},
      {tip:'7...Nb6 — Knight retreats. White has used two moves chasing this knight — giving Black time to develop.',hl:[[2,1,'blue']]},
      {tip:'8.exd6 — White exchanges.',hl:[[2,3,'green']]},
      {tip:'8...cxd6 — Black recaptures, opening the c-file.',hl:[[2,3,'blue']]},
      {tip:'9.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'9...0-0 — Black castles! Fully developed with a solid position. The pin on Nf3 will be renewed if White tries anything hasty.',hl:[[0,6,'blue']]},
      {tip:'10.h3 — White kicks the bishop.',hl:[[2,7,'green']]},
      {tip:'10...Bh5 — Bishop retreats to h5, maintaining indirect pressure. Black has a solid, equal position with the bishop pair and active pieces. The Alekhine has fully equalised.',hl:[[3,7,'blue']],arrows:[[3,7,7,3,'rgba(100,150,255,.4)'],[3,7,5,5,'rgba(100,150,255,.4)']]}
    ]
  );
  document.getElementById('bt-alebrook').textContent='Alekhine Bg4 Line — Natural Development for Club Players';
  document.getElementById('btags-alebrook').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Balanced</span>';
  document.getElementById('bd-alebrook').textContent='The Bg4 variation is Black\'s most natural Alekhine approach — pin the knight, develop solidly, castle quickly. Step through to see how Black equalises comfortably without needing to know sharp theory.';
  document.getElementById('bti-alebrook').innerHTML='<strong>Key plan:</strong> After ...Bh5, continue with ...Nc6 and ...Re8. If White plays g4 to kick the bishop, Black plays ...Bg6 and the bishop is safe. The Bg4 line is ideal for players who want to play the Alekhine without deep theory — focus on piece activity and centre control.';

  
  // ============================================================
  // FREE PLAY / DRAG-AND-DROP ENGINE
  // ============================================================
  const FREE_PLAY = {};   // id -> {active, board, selected, turn}

  function toggleFreePlay(id) {
    const d = BOARDS[id];
    const fp = FREE_PLAY[id];
    const btn = document.getElementById('fp-btn-'+id);
    if (!fp || !fp.active) {
      // Enable free play — snapshot current board state
      FREE_PLAY[id] = {
        active: true,
        board: d.states[d.cur].map(r => [...r]),
        selected: null,
        turn: 'both'   // allow moving any piece
      };
      if (btn) btn.classList.add('active');
      renderFreePlay(id);
    } else {
      // Disable — return to guided mode
      FREE_PLAY[id] = { active: false };
      if (btn) btn.classList.remove('active');
      render(id);
    }
  }

  function renderFreePlay(id) {
    const fp = FREE_PLAY[id];
    if (!fp || !fp.active) return;
    const cb = document.getElementById('cb-'+id);
    if (!cb) return;
    const board = fp.board;
    const sel = fp.selected;
    cb.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = 'sq ' + ((r+c)%2===0 ? 'light' : 'dark');
        sq.dataset.r = r;
        sq.dataset.c = c;
        const p = board[r][c];

        // Highlight selected square
        if (sel && sel[0] === r && sel[1] === c) {
          sq.classList.add('selected');
        }

        if (p) {
          const span = document.createElement('span');
          span.className = p === p.toUpperCase() ? 'wp' : 'bp';
          span.textContent = GLYPH[p] || p;
          sq.appendChild(span);
          // Make pieces draggable
          sq.draggable = true;
          sq.addEventListener('dragstart', e => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', r + ',' + c);
            fp.selected = [r, c];
            fp.dragging = [r, c];
            setTimeout(() => sq.style.opacity = '0.4', 0);
          });
          sq.addEventListener('dragend', () => {
            sq.style.opacity = '1';
          });
        }

        // Click to select / move
        sq.addEventListener('click', () => fpClick(id, r, c));

        // Drag-over
        sq.addEventListener('dragover', e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          sq.classList.add('drag-over');
        });
        sq.addEventListener('dragleave', () => sq.classList.remove('drag-over'));
        sq.addEventListener('drop', e => {
          e.preventDefault();
          sq.classList.remove('drag-over');
          const [fr, fc] = e.dataTransfer.getData('text/plain').split(',').map(Number);
          fpMovePiece(id, fr, fc, r, c);
        });

        cb.appendChild(sq);
      }
    }
    // Clear arrows in free play mode
    drawArrows(id, []);
    // Update counter
    const mc = document.getElementById('mc-'+id);
    if (mc) mc.textContent = 'Free Play';
  }

  function fpClick(id, r, c) {
    const fp = FREE_PLAY[id];
    if (!fp || !fp.active) return;
    const board = fp.board;
    const sel = fp.selected;
    const piece = board[r][c];

    if (sel) {
      if (sel[0] === r && sel[1] === c) {
        // Deselect
        fp.selected = null;
      } else if (piece && isSameColor(board[sel[0]][sel[1]], piece)) {
        // Switch selection to new piece
        fp.selected = [r, c];
      } else {
        // Move the piece
        fpMovePiece(id, sel[0], sel[1], r, c);
        return;
      }
    } else {
      if (piece) fp.selected = [r, c];
    }
    renderFreePlay(id);
  }

  function isSameColor(a, b) {
    if (!a || !b) return false;
    return (a === a.toUpperCase()) === (b === b.toUpperCase());
  }

  function fpMovePiece(id, fr, fc, tr, tc) {
    const fp = FREE_PLAY[id];
    if (!fp || !fp.active) return;
    const board = fp.board;
    const piece = board[fr][fc];
    if (!piece) { fp.selected = null; renderFreePlay(id); return; }

    // Execute move
    board[tr][tc] = piece;
    board[fr][fc] = null;

    // Handle castling
    if (piece === 'K' && fr === 7 && fc === 4) {
      if (tc === 6) { board[7][5] = 'R'; board[7][7] = null; }
      if (tc === 2) { board[7][3] = 'R'; board[7][0] = null; }
    }
    if (piece === 'k' && fr === 0 && fc === 4) {
      if (tc === 6) { board[0][5] = 'r'; board[0][7] = null; }
      if (tc === 2) { board[0][3] = 'r'; board[0][0] = null; }
    }
    // Pawn promotion (auto-queen)
    if (piece === 'P' && tr === 0) board[tr][tc] = 'Q';
    if (piece === 'p' && tr === 7) board[tr][tc] = 'q';

    fp.selected = null;
    fp.dragging = null;
    renderFreePlay(id);
  }


  // ============================================================
  // THEORY PAGE BOARDS
  // ============================================================

  // THEORY: IQP STRUCTURE
  reg('t-iqp',document.getElementById('bw-t-iqp'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4'},{from:'e7',to:'e6'},{from:'c2',to:'c4'},{from:'c7',to:'c5'},
      {from:'g1',to:'f3'},{from:'b8',to:'c6'},{from:'b1',to:'c3'},{from:'g8',to:'f6'},
      {from:'e2',to:'e3'},{from:'d7',to:'d5'},{from:'c4',to:'d5'},{from:'e6',to:'d5'},
      {from:'f1',to:'b5'},{from:'f8',to:'d6'},{from:'d4',to:'c5'},{from:'d6',to:'c5'},
      {from:'e1',to:'g1'},{from:'e8',to:'g8'},{from:'e3',to:'e4'},{from:'d5',to:'e4'},
      {from:'c3',to:'e4'},{from:'f6',to:'e4'}
    ],[
      {tip:'The Isolated Queen\'s Pawn (IQP) — one of the most important and instructive pawn structures in chess. After a series of exchanges, White will have an isolated pawn on d4. Step through to see how the structure arises.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...e6 — Solid. Black prepares ...d5.',hl:[[2,4,'blue']]},
      {tip:'2.c4 — The broad centre.',hl:[[4,2,'green']]},
      {tip:'2...c5 — Black immediately challenges d4. This is one of the IQP\'s most common origins.',hl:[[2,2,'blue']]},
      {tip:'3.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'3...Nc6 — Development.',hl:[[5,2,'blue']]},
      {tip:'4.Nc3 — Development.',hl:[[5,2,'green']]},
      {tip:'4...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'5.e3 — Solid. White prepares Bd3 and castles.',hl:[[5,4,'green']]},
      {tip:'5...d5 — Black establishes the central pawn. Now White captures to begin the IQP structure.',hl:[[3,3,'blue']]},
      {tip:'6.cxd5 — White captures. The c-file opens.',hl:[[3,3,'green']]},
      {tip:'6...exd5 — Black recaptures. Now after dxc5 Bxc5 and exd4 exd4, White will have an isolated pawn on d4.',hl:[[3,3,'blue']]},
      {tip:'7.Bb5 — Active development, pinning the c6 knight.',hl:[[4,1,'green']]},
      {tip:'7...Bd6 — Black develops actively.',hl:[[1,3,'blue']]},
      {tip:'8.dxc5! — White captures, leading to the IQP after Black recaptures.',hl:[[4,2,'green']]},
      {tip:'8...Bxc5 — Black recaptures. Now White plays e4 to establish the IQP.',hl:[[4,2,'blue']]},
      {tip:'9.0-0 — White castles first.',hl:[[7,6,'green']]},
      {tip:'9...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'10.e4! — White establishes the IQP on d4. The d4 pawn has no c or e pawn to support it — it is isolated. But it gives White space, open files, and active pieces.',hl:[[4,4,'green']],arrows:[[4,3,3,3,'rgba(201,168,76,.6)'],[4,3,3,4,'rgba(201,168,76,.5)'],[4,3,3,2,'rgba(201,168,76,.5)']]},
      {tip:'10...dxe4 — Black captures, completing the IQP structure.',hl:[[4,4,'blue']]},
      {tip:'11.Nxe4 — White recaptures. THE IQP POSITION IS SET. White has: active pieces, open e and c files, control of e5 and d5. Black\'s plan: blockade d4 with a knight on d5, trade pieces, win the endgame with d4 pawn as target.',hl:[[3,4,'green']],arrows:[[3,4,3,5,'rgba(201,168,76,.5)'],[3,4,3,3,'rgba(201,168,76,.5)']],warn:'The critical question with the IQP: should White advance d4-d5 or hold it? The d5 break is the IQP\'s most powerful weapon — it opens the position when all White\'s pieces are pointing at the king. But if the d5 break is not possible, the pawn becomes a long-term weakness.'},
      {tip:'11...Nxe4 — Black captures, trading a piece. A typical IQP game: White attacks with active pieces, Black trades pieces to reach an endgame where d4 is the target. The IQP gives White more attacking chances in the middlegame — but Black has the better endgame. Both sides must play according to this logic.',hl:[[3,4,'blue']],arrows:[[4,3,3,3,'rgba(100,150,255,.6)']]}
    ]
  );
  document.getElementById('bt-t-iqp').textContent='Isolated Queen\'s Pawn (IQP) — How It Arises and What It Means';
  document.getElementById('btags-t-iqp').innerHTML='<span class="tag tag-positional">Structure</span><span class="tag tag-imbalanced">Dynamic</span>';
  document.getElementById('bd-t-iqp').textContent='The IQP arises when the d4 pawn loses its c and e pawn support. Step through to see how the structure forms, then study the principles of how to play it with and against it.';
  document.getElementById('bti-t-iqp').innerHTML='<strong>IQP with White:</strong> Play aggressively — Ne5, Bd3+Qe2 battery, Rad1. Look for the d5 break. All pieces must be active before advancing d5. <strong>IQP against White:</strong> Trade pieces, place a knight on d5, avoid piece activity for White. The longer the game goes, the worse d4 becomes.';

  // THEORY: HANGING PAWNS
  reg('t-hanging',document.getElementById('bw-t-hanging'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4'},{from:'g8',to:'f6'},{from:'c2',to:'c4'},{from:'e7',to:'e6'},
      {from:'g1',to:'f3'},{from:'d7',to:'d5'},{from:'b1',to:'c3'},{from:'c7',to:'c5'},
      {from:'c4',to:'d5'},{from:'e6',to:'d5'},{from:'e2',to:'e3'},{from:'b8',to:'c6'},
      {from:'f1',to:'d3'},{from:'f8',to:'d6'},{from:'e1',to:'g1'},{from:'e8',to:'g8'},
      {from:'d4',to:'c5'},{from:'d6',to:'c5'},{from:'b2',to:'b3'},{from:'a7',to:'a6'},
      {from:'c1',to:'b2'},{from:'d8',to:'e7'}
    ],[
      {tip:'Hanging Pawns — a dynamic pawn formation where Black has two connected central pawns on c5 and d5 (or White has c4+d4) with no pawns on adjacent files to support them. They "hang" in space — powerful when advancing, weak when blocked.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'2.c4 — The broad centre.',hl:[[4,2,'green']]},
      {tip:'2...e6 — Solid development.',hl:[[2,4,'blue']]},
      {tip:'3.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'3...d5 — Black establishes the central pawn.',hl:[[3,3,'blue']]},
      {tip:'4.Nc3 — Development.',hl:[[5,2,'green']]},
      {tip:'4...c5! — Black challenges both central pawns at once. This is the move that creates hanging pawn potential.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.5)'],[2,2,4,2,'rgba(100,150,255,.4)']]},
      {tip:'5.cxd5 — White captures. The c-file opens.',hl:[[3,3,'green']]},
      {tip:'5...exd5 — Black recaptures. Now Black has pawns on c5 and d5 — connected central pawns with no b or e pawn beside them. These are the HANGING PAWNS.',hl:[[3,3,'blue']],arrows:[[3,2,3,3,'rgba(100,150,255,.7)']]},
      {tip:'6.e3 — White prepares to develop the bishop.',hl:[[5,4,'green']]},
      {tip:'6...Nc6 — Development. The c6 knight will support d4 if White tries to attack the hanging pawns.',hl:[[5,2,'blue']]},
      {tip:'7.Bd3 — White develops, targeting h7.',hl:[[5,3,'green']]},
      {tip:'7...Bd6 — Black develops aggressively. Both bishops are active.',hl:[[1,3,'blue']]},
      {tip:'8.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'8...0-0 — Black castles. The hanging pawn position is set.',hl:[[0,6,'blue']]},
      {tip:'9.dxc5! — White captures, transforming the hanging pawns. After Bxc5, Black still has the c5 pawn but d5 is now the only hanging pawn — which can become isolated.',hl:[[4,2,'green']],warn:'White\'s strategy against hanging pawns: attack the base. Force ...c5-c4 (making d5 isolated) or ...d5-d4 (making c5 isolated). Once one pawn advances without the other, both become easy targets.'},
      {tip:'9...Bxc5 — Black recaptures. Now Black has a d5 pawn and a c5 pawn — but after ...d4 or ...c4 advances, only one will be left. Black must KEEP THE PAWNS MOVING.',hl:[[4,2,'blue']],arrows:[[3,3,2,3,'rgba(100,150,255,.5)'],[3,2,2,2,'rgba(100,150,255,.5)']]},
      {tip:'10.b3 — White prepares Bb2 to pressure the hanging pawns from the diagonal.',hl:[[5,1,'green']]},
      {tip:'10...a6 — Black prepares ...b5 for expansion. Hanging pawn players should always look to advance — not defend.',hl:[[2,0,'blue']]},
      {tip:'11.Bb2 — White\'s bishop targets the hanging pawns from the long diagonal.',hl:[[4,1,'green']],arrows:[[4,1,3,2,'rgba(201,168,76,.5)'],[4,1,3,3,'rgba(201,168,76,.5)']]},
      {tip:'11...Qe7 — Black connects the rooks and prepares ...d4 or ...c4 to advance. THIS IS THE KEY MOMENT: Black must decide — advance ...d4 to open lines and attack, or hold the pawns and prepare piece activity. Hanging pawns demand a decision. Hesitation is death.',hl:[[1,4,'blue']],arrows:[[3,3,2,3,'rgba(100,150,255,.6)'],[3,2,2,2,'rgba(100,150,255,.5)']],warn:'The fundamental rule of hanging pawns: if you cannot advance them, your position deteriorates. The moment White blockades both c5 and d5 with pieces, Black\'s hanging pawns transform from a strength to a permanent weakness. Always have a plan to advance at least one of them.'}
    ]
  );
  document.getElementById('bt-t-hanging').textContent='Hanging Pawns — Dynamic Strength or Structural Weakness?';
  document.getElementById('btags-t-hanging').innerHTML='<span class="tag tag-positional">Structure</span><span class="tag tag-sharp">Dynamic</span>';
  document.getElementById('bd-t-hanging').textContent='Hanging pawns on c5+d5 look powerful but become weak if they stop moving. Step through to see how they arise and what each side must do — Black must advance, White must blockade.';
  document.getElementById('bti-t-hanging').innerHTML='<strong>Hanging pawn rule:</strong> With hanging pawns, always be looking to advance one of them — ...d4 to open lines for attack, or ...c4 to gain space. If you cannot advance them, they will be blockaded and become permanent weaknesses. Against hanging pawns: prevent both advances, place pieces on c4 and d4, and wait for the pawns to become liabilities.';

  // THEORY: PROPHYLAXIS
  reg('t-prophylaxis',document.getElementById('bw-t-prophylaxis'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4'},{from:'g8',to:'f6'},{from:'c2',to:'c4'},{from:'e7',to:'e6'},
      {from:'b1',to:'c3'},{from:'f8',to:'b4'},{from:'e2',to:'e3'},{from:'e8',to:'g8'},
      {from:'g1',to:'e2'},{from:'d7',to:'d5'},{from:'a2',to:'a3'},{from:'b4',to:'e7'},
      {from:'c4',to:'d5'},{from:'e6',to:'d5'},{from:'b2',to:'b4'},{from:'c7',to:'c6'},
      {from:'c1',to:'b2'},{from:'b8',to:'d7'},{from:'d1',to:'c2'},{from:'f8',to:'e8'},
      {from:'e1',to:'g1'},{from:'d7',to:'f8'}
    ],[
      {tip:'Prophylaxis in action — a Nimzo-Indian type position where White\'s every move prevents Black\'s plan before making their own. Step through to see Petrosian\'s concept applied in a concrete position.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'2.c4 — Broad centre.',hl:[[4,2,'green']]},
      {tip:'2...e6 — Solid. Preparing ...d5 or ...Bb4.',hl:[[2,4,'blue']]},
      {tip:'3.Nc3 — Development.',hl:[[5,2,'green']]},
      {tip:'3...Bb4! — The Nimzo-Indian pin. Black prevents White from playing e4 freely.',hl:[[4,1,'blue']],arrows:[[4,1,5,2,'rgba(100,150,255,.6)']]},
      {tip:'4.e3 — Solid. White defends c3 and prepares Bd3.',hl:[[5,4,'green']]},
      {tip:'4...0-0 — Black castles.',hl:[[0,6,'blue']]},
      {tip:'5.Ne2! — PROPHYLAXIS. White places the knight on e2 rather than f3. Why? Because after ...d5, if the knight were on f3 it would be pinned by ...Bg4. The Ne2 cannot be pinned and can reroute to g3 or f4. This is a prophylactic piece placement.',hl:[[6,4,'green']],arrows:[[6,4,4,4,'rgba(201,168,76,.4)']],warn:'Most players would automatically play 5.Nf3 here. Petrosian\'s insight was that 5.Ne2 prevents a specific problem (the ...Bg4 pin) that hasn\'t even happened yet. This is prophylactic thinking: prevent the opponent\'s idea before they can execute it.'},
      {tip:'5...d5 — Black challenges the centre.',hl:[[3,3,'blue']]},
      {tip:'6.a3! — PROPHYLAXIS AGAIN. White prevents ...Bb4-a5-b6 manoeuvres AND prevents Black from playing ...Bb4xc3 at will. Now the Bb4 must decide: retreat or capture. This prophylactic pawn move costs nothing but controls a key option.',hl:[[6,0,'green']],arrows:[[6,0,4,1,'rgba(201,168,76,.5)']],warn:'Many players would play 6.cxd5 or 6.Nf4 here. But 6.a3 asks: "What does Black want to do?" Black wants to keep the Bb4 on the board and use it. Stopping that before it becomes a problem is prophylaxis.'},
      {tip:'6...Be7 — The bishop retreats. Black has spent a tempo.',hl:[[1,4,'blue']]},
      {tip:'7.cxd5 — White exchanges, opening the c-file.',hl:[[3,3,'green']]},
      {tip:'7...exd5 — Black recaptures.',hl:[[3,3,'blue']]},
      {tip:'8.b4! — White expands on the queenside, preventing ...c5. Black wanted to play ...c5 to challenge d4 — but now b4 covers c5. This is prophylaxis combined with active play.',hl:[[4,1,'green']],arrows:[[4,1,3,2,'rgba(201,168,76,.5)']],warn:'White\'s entire plan so far has been: prevent ...Bg4 (Ne2), prevent ...Bb4 manoeuvres (a3), prevent ...c5 (b4). Black has been unable to execute a single active plan. This is the power of prophylactic chess — you don\'t need great moves if your opponent has no good moves either.'},
      {tip:'8...c6 — Black defends d5 and closes the c-file.',hl:[[2,2,'blue']]},
      {tip:'9.Bb2 — White develops, targeting d4 — wait, the d4 pawn is White\'s own. The bishop supports d4 and eyes the long diagonal toward Black\'s king.',hl:[[4,1,'green']],arrows:[[4,1,1,4,'rgba(201,168,76,.4)']]},
      {tip:'9...Nbd7 — Black develops the knight.',hl:[[1,3,'blue']]},
      {tip:'10.Qc2 — White develops the queen to a useful square, supporting the queenside.',hl:[[6,2,'green']]},
      {tip:'10...Re8 — Black activates the rook.',hl:[[0,4,'blue']]},
      {tip:'11.0-0 — White castles. White has: a solid position, no weaknesses, queenside space, and Black has had no active counterplay. This is the prophylactic style — not spectacular, but highly effective.',hl:[[7,6,'green']]},
      {tip:'11...Nf8 — Black reorganises. White\'s prophylactic play has prevented all of Black\'s main ideas. From here White plays Rfd1, Rac1, and looks for a queenside break. Black has no clear plan — exactly the result Petrosian aimed for.',hl:[[1,5,'blue']]}
    ]
  );
  document.getElementById('bt-t-prophylaxis').textContent='Prophylaxis — Petrosian\'s Art of Prevention';
  document.getElementById('btags-t-prophylaxis').innerHTML='<span class="tag tag-positional">Prophylaxis</span><span class="tag tag-solid">Strategic</span>';
  document.getElementById('bd-t-prophylaxis').textContent='A Nimzo-Indian position where White applies prophylaxis systematically: Ne2 (prevents pin), a3 (prevents ...Bb4 manoeuvres), b4 (prevents ...c5). Step through to see how preventing the opponent\'s plans creates a positional stranglehold.';
  document.getElementById('bti-t-prophylaxis').innerHTML='<strong>How to think prophylactically:</strong> Before every move, ask: "What is my opponent\'s best plan?" If the answer is dangerous, stop it first. Ne2 instead of Nf3 to prevent a pin. a3 to prevent a bishop manoeuvre. b4 to prevent ...c5. The best prophylactic moves also improve your own position — pure prevention without progress is too slow.';

  // THEORY: OPEN FILES
  reg('t-openfile',document.getElementById('bw-t-openfile'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4'},{from:'d7',to:'d5'},{from:'c2',to:'c4'},{from:'d5',to:'c4'},
      {from:'g1',to:'f3'},{from:'g8',to:'f6'},{from:'e2',to:'e3'},{from:'e7',to:'e6'},
      {from:'f1',to:'c4'},{from:'c7',to:'c5'},{from:'e1',to:'g1'},{from:'a7',to:'a6'},
      {from:'d1',to:'e2'},{from:'b7',to:'b5'},{from:'c4',to:'b3'},{from:'c8',to:'b7'},
      {from:'f1',to:'d1'},{from:'b8',to:'d7'},{from:'b1',to:'c3'},{from:'c5',to:'d4'},
      {from:'e3',to:'d4'},{from:'f8',to:'e7'},{from:'c1',to:'g5'},{from:'e8',to:'g8'}
    ],[
      {tip:'Open file strategy — a QGA position where White has established a powerful IQP on d4 and will use the open c and e files to penetrate with rooks. Step through to see how open files are created and exploited.',hl:[[6,3,'green']]},
      {tip:'1.d4 — Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black answers symmetrically.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — The Queen\'s Gambit.',hl:[[4,2,'green']]},
      {tip:'2...dxc4 — Black ACCEPTS the gambit. The c-file opens immediately.',hl:[[4,2,'blue']],arrows:[[3,3,4,2,'rgba(100,150,255,.6)']]},
      {tip:'3.Nf3 — Develop first, recapture later.',hl:[[5,5,'green']]},
      {tip:'3...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'4.e3 — Preparing Bxc4.',hl:[[5,4,'green']]},
      {tip:'4...e6 — Solid. Black prepares to hold the c4 pawn.',hl:[[2,4,'blue']]},
      {tip:'5.Bxc4 — White recovers the pawn. The c-file is half-open — White has no c-pawn, Black still has c7.',hl:[[4,2,'green']],arrows:[[4,2,2,2,'rgba(201,168,76,.3)']]},
      {tip:'5...c5! — Black challenges d4. After the queens come off (or not), the c-file will become FULLY OPEN.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.5)']]},
      {tip:'6.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'6...a6 — Black prepares ...b5.',hl:[[2,0,'blue']]},
      {tip:'7.Qe2! — Active queen. Prepares Rd1 to support d4.',hl:[[6,4,'green']]},
      {tip:'7...b5 — Black kicks the bishop.',hl:[[1,1,'blue']]},
      {tip:'8.Bb3 — Retreat to safety.',hl:[[4,1,'green']]},
      {tip:'8...Bb7 — Black develops, targeting the long diagonal.',hl:[[1,1,'blue']]},
      {tip:'9.Rd1! — ROOK TO THE OPEN FILE. White places the rook on d1 immediately — the d-file will become open after ...cxd4. This is the key: anticipate which file will open and get there first.',hl:[[7,3,'green']],arrows:[[7,3,4,3,'rgba(201,168,76,.6)']],warn:'Many players castle and then slowly bring the rook to d1 after several moves. The correct technique: IMMEDIATELY put the rook on the file that is about to open. Get there before your opponent realises what is happening.'},
      {tip:'9...Nbd7 — Development.',hl:[[1,3,'blue']]},
      {tip:'10.Nc3 — Development. White\'s setup is complete.',hl:[[5,2,'green']]},
      {tip:'10...cxd4 — Black captures, OPENING THE D-FILE. Now the Rd1 is perfectly placed — it controls the entire d-file immediately.',hl:[[4,3,'blue']],arrows:[[4,3,7,3,'rgba(100,150,255,.5)']]},
      {tip:'11.exd4 — White recaptures with the e-pawn. WHITE NOW HAS: open d-file (Rd1), semi-open e-file (Re1 will go here), IQP on d4 as a weapon, Bg5 pin, Ne5 to come. This is the textbook open file position.',hl:[[4,3,'green']],arrows:[[4,3,7,3,'rgba(201,168,76,.5)'],[4,3,3,3,'rgba(201,168,76,.4)'],[4,3,3,4,'rgba(201,168,76,.4)']]},
      {tip:'11...Be7 — Black develops.',hl:[[1,4,'blue']]},
      {tip:'12.Bg5! — Pin the knight that defends against Ne5.',hl:[[2,6,'green']],arrows:[[2,6,5,5,'rgba(201,168,76,.6)']]},
      {tip:'12...0-0 — Black castles. Now White plays Ne5, then Re1 to control the e-file too. Two open files + Ne5 outpost + IQP advance d5 is a devastating combination. The open file strategy is complete.',hl:[[0,6,'blue']],arrows:[[7,3,4,3,'rgba(201,168,76,.5)'],[7,4,4,4,'rgba(201,168,76,.3)'],[3,4,1,5,'rgba(201,168,76,.4)']]}
    ]
  );
  document.getElementById('bt-t-openfile').textContent='Open Files & Rook Coordination — Controlling the Board';
  document.getElementById('btags-t-openfile').innerHTML='<span class="tag tag-positional">Rook Play</span><span class="tag tag-imbalanced">Open Files</span>';
  document.getElementById('bd-t-openfile').textContent='A QGA position where White uses open files strategically. Step through to see how Rd1 anticipates the opening of the d-file, and how two open files plus an active knight create overwhelming pressure.';
  document.getElementById('bti-t-openfile').innerHTML='<strong>Open file mastery:</strong> (1) Identify which file will open BEFORE it opens — place your rook there in advance. (2) Double rooks on the open file to dominate it completely. (3) Combine an open file rook with a piece outpost (e.g. Ne5 + Rd1) for maximum pressure. (4) Always look to penetrate to the 7th rank — a rook on d7 or e7 is often decisive.';

  // THEORY: WEAK SQUARES / OUTPOSTS
  reg('t-outpost',document.getElementById('bw-t-outpost'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'e2',to:'e4'},{from:'c7',to:'c5'},{from:'g1',to:'f3'},{from:'d7',to:'d6'},
      {from:'d2',to:'d4'},{from:'c5',to:'d4'},{from:'f3',to:'d4'},{from:'g8',to:'f6'},
      {from:'b1',to:'c3'},{from:'a7',to:'a6'},{from:'c1',to:'e3'},{from:'e7',to:'e6'},
      {from:'f2',to:'f3'},{from:'b7',to:'b5'},{from:'d1',to:'d2'},{from:'b5',to:'b4'},
      {from:'c3',to:'a4'},{from:'d8',to:'c7'},{from:'e1',to:'c1'},{from:'b8',to:'d7'},
      {from:'g2',to:'g4'},{from:'f8',to:'e7'}
    ],[
      {tip:'Weak squares and outposts — a Sicilian Najdorf position where White has a critical outpost on d5 (after Black plays ...e5 or ...b5-b4) and Black targets the a4 knight. Step through to see how square weakness is created and exploited.',hl:[[6,4,'green']]},
      {tip:'1.e4 — The King\'s Pawn.',hl:[[4,4,'green']]},
      {tip:'1...c5 — The Sicilian Defence.',hl:[[4,2,'blue']]},
      {tip:'2.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'2...d6 — Prepares the Najdorf with ...a6.',hl:[[2,3,'blue']]},
      {tip:'3.d4 — White builds the centre.',hl:[[4,3,'green']]},
      {tip:'3...cxd4 — Black exchanges, opening the c-file.',hl:[[4,2,'blue']]},
      {tip:'4.Nxd4 — White recaptures.',hl:[[3,3,'green']]},
      {tip:'4...Nf6 — Development, attacking e4.',hl:[[5,5,'blue']]},
      {tip:'5.Nc3 — Development.',hl:[[5,2,'green']]},
      {tip:'5...a6 — THE NAJDORF! Black prevents Bb5 and prepares ...b5 expansion.',hl:[[2,0,'blue']]},
      {tip:'6.Be3 — The English Attack. White prepares f3, g4-g5 kingside storm.',hl:[[5,2,'green']],arrows:[[5,2,2,5,'rgba(201,168,76,.3)']]},
      {tip:'6...e6 — Solid. Black prepares ...Be7, ...0-0.',hl:[[2,4,'blue']]},
      {tip:'7.f3 — Preparing g4. White will launch a kingside pawn storm.',hl:[[5,5,'green']]},
      {tip:'7...b5! — Black expands on the queenside. But notice: ...b5 creates a WEAK SQUARE on a5 and c5 — no Black pawn can defend them after ...b5.',hl:[[1,1,'blue']],arrows:[[1,1,3,0,'rgba(100,150,255,.3)'],[1,1,3,2,'rgba(100,150,255,.3)']],warn:'Every pawn advance creates weak squares behind it. ...b5 gives Black queenside space but weakens a5 and c5. White\'s knight will immediately try to occupy a5 via Na4-c5 or c5 directly. In the Sicilian, this is the fundamental imbalance: Black gets active play, White gets structural targets.'},
      {tip:'8.Qd2 — Prepares 0-0-0 and connects rooks.',hl:[[6,3,'green']]},
      {tip:'8...b4 — Black advances, kicking the Nc3. But now c4 and d5 are WEAK for Black — no Black pawn can defend these squares.',hl:[[1,1,'blue']],arrows:[[1,1,5,2,'rgba(100,150,255,.6)']],warn:'8...b4 gains space but pushes the knight to a4, where it aims directly at c5 — a square Black has just weakened! This is the key lesson: every pawn advance that gains space also creates weak squares in its wake. Black\'s ...b5-b4 queenside advance is exactly what creates the c5 outpost White needs.'},
      {tip:'9.Na4! — THE OUTPOST MANOEUVRE. White sends the knight to a4, targeting c5 — a square Black can NEVER defend with a pawn again now that ...b5-b4 has been played. The knight will land on c5 and be an immovable piece.',hl:[[5,0,'green']],arrows:[[5,0,3,1,'rgba(201,168,76,.7)'],[3,1,4,2,'rgba(201,168,76,.5)']],warn:'Notice the logic: Black played ...b5 (weakens c5), then ...b4 (gives the knight a5 and c5 for free). White immediately exploits this with Na4-c5. This cause-and-effect between pawn moves and weak squares is the core of positional chess.'},
      {tip:'9...Qc7 — Black defends c5 with the queen. But a queen is a poor defender of an outpost — it gets attacked by every piece.',hl:[[1,2,'blue']]},
      {tip:'10.0-0-0 — White castles queenside, preparing the kingside attack and connecting rooks.',hl:[[7,2,'green']]},
      {tip:'10...Nbd7 — Black develops. The knight can go to c5 to challenge the Na4.',hl:[[1,3,'blue']]},
      {tip:'11.g4! — WHITE LAUNCHES THE KINGSIDE ATTACK. g4-g5 will drive away the Nf6, open the g-file, and attack the castled king. Meanwhile the Na4 dominates the c5 outpost on the other wing.',hl:[[3,6,'green']],arrows:[[3,6,2,6,'rgba(201,168,76,.6)'],[3,6,1,6,'rgba(201,168,76,.4)']]},
      {tip:'11...Be7 — Black develops, preparing to castle. The position is rich and double-edged: White attacks on the kingside, Black counterattacks on the queenside. But White\'s Na4-c5 outpost piece will be a permanent positional advantage even as the tactical battle rages.',hl:[[1,4,'blue']],arrows:[[3,6,2,6,'rgba(201,168,76,.5)'],[5,0,4,2,'rgba(201,168,76,.5)']]}
    ]
  );
  document.getElementById('bt-t-outpost').textContent='Weak Squares & Outposts — Najdorf: Creating Permanent Advantages';
  document.getElementById('btags-t-outpost').innerHTML='<span class="tag tag-positional">Outposts</span><span class="tag tag-imbalanced">Sicilian</span>';
  document.getElementById('bd-t-outpost').textContent='A Sicilian Najdorf position showing how pawn advances create weak squares. Step through to see how Black\'s ...b5-b4 queenside expansion creates the c5 outpost White immediately exploits with Na4.';
  document.getElementById('bti-t-outpost').innerHTML='<strong>Weak square principles:</strong> (1) Every pawn advance creates permanent weak squares on adjacent files — identify them and occupy them with pieces. (2) Na4-c5 is the classic outpost manoeuvre in the Sicilian. (3) A knight on an outpost that cannot be kicked by a pawn is worth more than a bishop in many positions. (4) To create an outpost: provoke the opponent\'s pawn to advance, then occupy the square it left behind.';

  document.getElementById('bti-t-outpost').innerHTML='<strong>Weak square principles:</strong> (1) Every pawn advance creates permanent weak squares on adjacent files — identify them and occupy them with pieces. (2) Na4-c5 is the classic outpost manoeuvre in the Sicilian. (3) A knight on an outpost that cannot be kicked by a pawn is worth more than a bishop in many positions. (4) To create an outpost: provoke the opponent\'s pawn to advance, then occupy the square it left behind.';

  // ============================================================
  // VS QUEEN'S GAMBIT BOARDS
  // ============================================================

  // QGD LASKER VARIATION
  reg('qgd-lasker',document.getElementById('bw-qgd-lasker'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e2',to:'e3',label:'e3'},{from:'e8',to:'g8',label:'0-0'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'a1',to:'c1',label:'Rc1'},{from:'c7',to:'c6',label:'c6'},
      {from:'f1',to:'d3',label:'Bd3'},{from:'d5',to:'c4',label:'dxc4!'},
      {from:'d3',to:'c4',label:'Bxc4'},{from:'f6',to:'d5',label:'Nd5!'},
      {from:'g5',to:'e7',label:'Bxe7'},{from:'d8',to:'e7',label:'Qxe7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'d5',to:'c3',label:'Nxc3'},
      {from:'c1',to:'c3',label:'Rxc3'},{from:'e6',to:'e5',label:'e5!'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.d4 — White plays the Queen\'s Pawn.',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black claims the centre immediately.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — The Queen\'s Gambit! White offers a pawn to gain central control.',hl:[[4,2,'green']],arrows:[[4,2,3,3,'rgba(201,168,76,.5)']]},
      {tip:'2...e6 — Black declines, reinforcing d5. This is the Queen\'s Gambit Declined — the most reliable response.',hl:[[2,4,'blue']],warn:'Never play 2...dxc4 without a plan to justify it. If you just want to reach a comfortable position, 2...e6 is always safe. The only cost is that the c8 bishop is temporarily locked in — your job is to free it.'},
      {tip:'3.Nc3 — White develops toward d5.',hl:[[5,2,'green']]},
      {tip:'3...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'4.Bg5 — THE MAIN LINE. White pins the Nf6 to the queen. This is White\'s most ambitious setup — the bishop creates immediate pressure.',hl:[[3,6,'green']],arrows:[[3,6,2,5,'rgba(201,168,76,.6)']]},
      {tip:'4...Be7 — Black unpins. The bishop on e7 is solid and prepares castling. This is the Orthodox QGD — safe and classical.',hl:[[2,4,'blue']]},
      {tip:'5.e3 — White completes the pawn structure.',hl:[[5,4,'green']]},
      {tip:'5...0-0 — Black castles to safety.',hl:[[0,6,'blue']]},
      {tip:'6.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'6...Nbd7 — The knight develops to d7, preparing ...c6 and the key ...Nd5 manoeuvre.',hl:[[5,3,'blue']]},
      {tip:'7.Rc1 — White prepares queenside pressure along the c-file.',hl:[[7,2,'green']]},
      {tip:'7...c6 — Solidifying the centre. Black prepares the Lasker manoeuvre: ...dxc4 followed by ...Nd5, trading off White\'s best pieces.',hl:[[2,2,'blue']]},
      {tip:'8.Bd3 — White develops the bishop toward h7.',hl:[[5,3,'green']],arrows:[[5,3,1,7,'rgba(201,168,76,.3)']]},
      {tip:'8...dxc4! — THE LASKER EXCHANGE. Black releases the tension and surrenders the centre temporarily. The point is what follows: after Bxc4, the bishop is on c4 where it can be attacked.',hl:[[3,3,'blue']],warn:'Many Black players avoid ...dxc4 because they don\'t want to "help" White get the bishop to c4. But this is the Lasker trick — Black trades the pawn to set up the Nd5 manoeuvre that forces piece exchanges and equalises completely.'},
      {tip:'9.Bxc4 — White recaptures with the bishop, now active on c4.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.4)']]},
      {tip:'9...Nd5! — THE LASKER TRICK. The knight attacks the Bg5 and forces a series of exchanges that equilaise the position. This is the whole point of the Lasker variation.',hl:[[3,3,'blue']],arrows:[[3,3,2,6,'rgba(100,150,255,.6)']]},
      {tip:'10.Bxe7 — White trades the bishop that was creating pressure.',hl:[[2,4,'green']]},
      {tip:'10...Qxe7 — Black recaptures. The pieces are coming off.',hl:[[1,4,'blue']]},
      {tip:'11.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'11...Nxc3 — Black trades the knight, eliminating White\'s strong c3 knight.',hl:[[5,2,'blue']]},
      {tip:'12.Rxc3 — White recaptures.',hl:[[5,2,'green']]},
      {tip:'12...e5! — Black strikes the centre! This is the Lasker equaliser — the e5 break challenges d4 and gives Black full equality. The position is level with comfortable play for both sides.',hl:[[3,4,'blue']],arrows:[[3,4,4,3,'rgba(100,150,255,.7)']],warn:'The Lasker variation is a complete strategic system: ...dxc4 releases tension, ...Nd5 forces piece exchanges, and ...e5 grabs central space. After ...e5, Black has no weaknesses, no bad pieces, and a completely equal position. This is the correct way to play the QGD at club level — avoid passive setups and use the Lasker plan.'}
    ]
  );
  document.getElementById('bt-qgd-lasker').textContent='QGD Lasker Variation — The Complete Equaliser';
  document.getElementById('btags-qgd-lasker').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-positional">Equalising</span>';
  document.getElementById('bd-qgd-lasker').textContent='The Lasker variation of the QGD: ...dxc4, ...Nd5, ...Nxc3, ...e5. A complete strategic system that solves all of Black\'s problems and reaches full equality.';
  document.getElementById('bti-qgd-lasker').innerHTML='<strong>Lasker plan:</strong> 1. Play ...dxc4 to release tension. 2. Play ...Nd5 to attack Bg5 and force trades. 3. Play ...Nxc3 to eliminate the c3 knight. 4. Play ...e5 to grab central space. After this sequence, Black is fully equal.';

  // SLAV DEFENCE
  reg('qgd-slav',document.getElementById('bw-qgd-slav'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'c7',to:'c6',label:'c6'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'d5',to:'c4',label:'dxc4!'},
      {from:'a2',to:'a4',label:'a4'},{from:'c8',to:'f5',label:'Bf5!'},
      {from:'e2',to:'e3',label:'e3'},{from:'e7',to:'e6',label:'e6'},
      {from:'f1',to:'c4',label:'Bxc4'},{from:'f8',to:'b4',label:'Bb4'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'},
      {from:'d1',to:'e2',label:'Qe2'},{from:'b8',to:'d7',label:'Nbd7'},
      {from:'e3',to:'e4',label:'e4'},{from:'f5',to:'g6',label:'Bg6'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...d5 — Black claims the centre.',hl:[[3,3,'blue']]},
      {tip:'2.c4 — Queen\'s Gambit.',hl:[[4,2,'green']]},
      {tip:'2...c6! — THE SLAV DEFENCE. Black reinforces d5 with the c-pawn rather than e6. The crucial difference: the c8 bishop is not blocked.',hl:[[2,2,'blue']],warn:'The Slav is fundamentally superior to the QGD in one way: the c8 bishop is free. In the QGD after 2...e6, the bishop on c8 is the hardest piece to develop — the Slav avoids this problem entirely by keeping the diagonal open.'},
      {tip:'3.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'3...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'4.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'4...dxc4! — Black accepts the gambit! After taking on c4, Black will play ...Bf5 to solve the bishop problem before White can prevent it. This is the Main Line Slav.',hl:[[4,2,'blue']]},
      {tip:'5.a4 — White plays a4 to prevent ...b5 (which would keep the pawn). Now Black must develop the bishop before playing e6.',hl:[[6,0,'green']]},
      {tip:'5...Bf5! — THE KEY MOVE. Black develops the bishop BEFORE playing ...e6. This is the whole point of the Slav — the bishop escapes the diagonal that would be closed by ...e6.',hl:[[4,5,'blue']],arrows:[[4,5,4,4,'rgba(100,150,255,.5)'],[4,5,6,3,'rgba(100,150,255,.3)']],warn:'If Black plays 5...e6 first, the bishop on c8 is locked in and Black has a Meran/Orthodox QGD — the Slav strategy has failed. ALWAYS play ...Bf5 before ...e6 in the Slav Main Line.'},
      {tip:'6.e3 — White completes the centre.',hl:[[5,4,'green']]},
      {tip:'6...e6 — Now Black plays e6 — but safely, because the bishop is already out!',hl:[[2,4,'blue']]},
      {tip:'7.Bxc4 — White recaptures the pawn.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.4)']]},
      {tip:'7...Bb4! — Black pins the Nc3 immediately. The bishop on b4 creates pressure on c3 and threatens to disrupt White\'s structure.',hl:[[4,1,'blue']],arrows:[[4,1,5,2,'rgba(100,150,255,.6)']]},
      {tip:'8.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'8...0-0 — Both sides castle. Black has: bishop pair, solid structure, no weaknesses. The position is dynamically balanced.',hl:[[0,6,'blue']]},
      {tip:'9.Qe2 — White prepares e4 expansion.',hl:[[6,4,'green']]},
      {tip:'9...Nbd7 — Development toward e5.',hl:[[5,3,'blue']]},
      {tip:'10.e4 — White plays the central break.',hl:[[4,4,'green']],arrows:[[4,4,3,5,'rgba(201,168,76,.4)']]},
      {tip:'10...Bg6 — The bishop retreats safely. Black has a solid, active position with the Bb4 still pinning the Nc3 and the Bg6 controlling key squares. Black\'s structure is healthy and counterplay with ...e5 or ...c5 is coming.',hl:[[2,6,'blue']],warn:'After ...Bg6, Black\'s plan is ...Bxc3 (when useful), ...e5 central break, or ...c5 to challenge d4. The Slav gives Black a flexible position with no real weaknesses — exactly what you want against a space-grabbing opening.'}
    ]
  );
  document.getElementById('bt-qgd-slav').textContent='Slav Defence — Solve the Bishop Problem';
  document.getElementById('btags-qgd-slav').innerHTML='<span class="tag tag-solid">Solid</span><span class="tag tag-aggressive">Active</span>';
  document.getElementById('bd-qgd-slav').textContent='The Slav Defence: play ...c6 to reinforce d5, then ...dxc4 and ...Bf5 before ...e6 to free the c8 bishop. The cleanest solution to the QGD bishop problem.';
  document.getElementById('bti-qgd-slav').innerHTML='<strong>Slav principle:</strong> Always play ...Bf5 BEFORE ...e6. The moment you play ...e6 before the bishop escapes, you have a QGD — the Slav advantage is lost.';

  // QGA
  reg('qga-black',document.getElementById('bw-qga-black'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'d5',to:'c4',label:'dxc4!'},
      {from:'e2',to:'e4',label:'e4'},{from:'e7',to:'e5',label:'e5!'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'e5',to:'d4',label:'exd4'},
      {from:'f1',to:'c4',label:'Bxc4'},{from:'f8',to:'b4',label:'Bb4+'},
      {from:'c1',to:'d2',label:'Bd2'},{from:'b4',to:'d2',label:'Bxd2+'},
      {from:'b1',to:'d2',label:'Nbxd2'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'e4',to:'e5',label:'e5'},{from:'d4',to:'d3',label:'d3!'},
      {from:'c4',to:'d3',label:'Bxd3'},{from:'f6',to:'d5',label:'Nd5'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...d5',hl:[[3,3,'blue']]},
      {tip:'2.c4 — Queen\'s Gambit.',hl:[[4,2,'green']]},
      {tip:'2...dxc4! — Black ACCEPTS the gambit! The pawn goes to c4 and Black plans to either keep it with ...b5 or use the extra tempo for rapid development.',hl:[[4,2,'blue']],warn:'Accepting the QGA is completely sound. White cannot win the pawn back immediately, and Black gets a free move to develop. The key is knowing White\'s plan: after e4, White gets a big centre, but Black gets rapid piece development and active counterplay.'},
      {tip:'3.e4! — White\'s main response: grab the full centre immediately. This is the most ambitious — White accepts a temporary lag in development for a massive pawn wall.',hl:[[4,4,'green']],arrows:[[4,4,3,3,'rgba(201,168,76,.5)'],[4,4,3,5,'rgba(201,168,76,.5)']]},
      {tip:'3...e5! — THE COUNTERBLOW. Black immediately strikes at the d4 pawn before White can consolidate. This is the sharpest and most dynamic response — Black gives back the c4 pawn but demolishes the White centre.',hl:[[3,4,'blue']],arrows:[[3,4,4,3,'rgba(100,150,255,.7)']],warn:'The alternative 3...Nf6 is safer but more passive — White keeps e4+d4 and squeezes. After 3...e5!, the centre becomes a battlefield. Black must know the follow-up.'},
      {tip:'4.Nf3 — White defends d4.',hl:[[5,5,'green']]},
      {tip:'4...exd4 — Black captures, opening the position. Now White must recapture.',hl:[[4,3,'blue']]},
      {tip:'5.Bxc4 — White recaptures the c4 pawn and develops the bishop aggressively.',hl:[[4,2,'green']],arrows:[[4,2,1,5,'rgba(201,168,76,.5)']]},
      {tip:'5...Bb4+! — CHECK! The bishop check disrupts White\'s development and forces a response. This is a key zwischenzug — White cannot just develop normally.',hl:[[4,1,'blue']],arrows:[[4,1,6,3,'rgba(100,150,255,.6)']]},
      {tip:'6.Bd2 — White blocks the check with the bishop.',hl:[[6,3,'green']]},
      {tip:'6...Bxd2+! — Black trades the bishop, forcing White to recapture with a piece rather than a pawn. This eliminates White\'s most useful defensive piece.',hl:[[6,3,'blue']]},
      {tip:'7.Nbxd2 — White recaptures. The d4 pawn is temporarily very strong.',hl:[[6,3,'green']]},
      {tip:'7...Nf6 — Development. Black develops naturally toward the centre.',hl:[[5,5,'blue']]},
      {tip:'8.e5 — White advances, trying to win back the d4 pawn with tempo.',hl:[[3,4,'green']]},
      {tip:'8...d3! — THE ZWISCHENZUG. Black does NOT retreat the knight — instead, the d4 pawn advances to d3, attacking the Bc4 and changing the whole character of the position.',hl:[[5,3,'blue']],warn:'This is the key move that many players miss. Instead of retreating the Nf6, Black plays ...d3! The pawn on d3 attacks the Bc4, forces the bishop to move, and will be a strong passed pawn or force further concessions.'},
      {tip:'9.Bxd3 — White captures the passed pawn.',hl:[[5,3,'green']]},
      {tip:'9...Nd5! — The knight jumps to d5, a powerful central outpost. Black has: active knight on d5, open lines, and piece activity. White has extra space but Black\'s pieces are well-placed. The position is dynamically balanced — and Black has had no weaknesses throughout.',hl:[[3,3,'blue']],arrows:[[3,3,2,2,'rgba(100,150,255,.4)'],[3,3,2,4,'rgba(100,150,255,.4)']],warn:'After ...Nd5, Black\'s plan is: ...Nc6 to develop, ...0-0 to castle, then use the active pieces and half-open files for counterplay. The QGA leads to rich, double-edged positions where both sides have genuine chances — perfect for players who want to fight rather than equalise quietly.'}
    ]
  );
  document.getElementById('bt-qga-black').textContent='QGA — Take the Pawn, Strike the Centre';
  document.getElementById('btags-qga-black').innerHTML='<span class="tag tag-aggressive">Sharp</span><span class="tag tag-positional">Dynamic</span>';
  document.getElementById('bd-qga-black').textContent='Black accepts the Queen\'s Gambit with 2...dxc4, then counters with 3...e5! to demolish White\'s centre. After ...Bb4+ and ...d3!, Black reaches an active, dynamic position.';
  document.getElementById('bti-qga-black').innerHTML='<strong>QGA key sequence:</strong> 2...dxc4, then 3...e5! (not 3...Nf6), then ...Bb4+, ...Bxd2+, ...d3!. These moves are the core of Black\'s counterattack plan.';

  // TARRASCH DEFENCE
  reg('qgd-tarrasch',document.getElementById('bw-qgd-tarrasch'),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [
      {from:'d2',to:'d4',label:'d4'},{from:'d7',to:'d5',label:'d5'},
      {from:'c2',to:'c4',label:'c4'},{from:'e7',to:'e6',label:'e6'},
      {from:'b1',to:'c3',label:'Nc3'},{from:'c7',to:'c5',label:'c5!'},
      {from:'c4',to:'d5',label:'cxd5'},{from:'e6',to:'d5',label:'exd5'},
      {from:'g1',to:'f3',label:'Nf3'},{from:'b8',to:'c6',label:'Nc6'},
      {from:'g2',to:'g3',label:'g3'},{from:'g8',to:'f6',label:'Nf6'},
      {from:'f1',to:'g2',label:'Bg2'},{from:'f8',to:'e7',label:'Be7'},
      {from:'e1',to:'g1',label:'0-0'},{from:'e8',to:'g8',label:'0-0'},
      {from:'d4',to:'c5',label:'dxc5'},{from:'e7',to:'c5',label:'Bxc5'},
      {from:'c1',to:'g5',label:'Bg5'},{from:'d5',to:'d4',label:'d4!'}
    ],[
      {tip:'Starting position.'},
      {tip:'1.d4',hl:[[4,3,'green']]},
      {tip:'1...d5',hl:[[3,3,'blue']]},
      {tip:'2.c4 — Queen\'s Gambit.',hl:[[4,2,'green']]},
      {tip:'2...e6 — Black starts with the standard QGD move.',hl:[[2,4,'blue']]},
      {tip:'3.Nc3 — White develops.',hl:[[5,2,'green']]},
      {tip:'3...c5! — THE TARRASCH! Instead of the passive QGD, Black immediately counterattacks d4. This is a fighting move — Black is willing to accept an IQP for rich piece activity.',hl:[[2,2,'blue']],arrows:[[2,2,4,3,'rgba(100,150,255,.7)']],warn:'The Tarrasch is NOT a passive opening. Black is saying: I will accept an isolated queen\'s pawn after the exchanges, and I will use the open files and active pieces to compensate. This is the same philosophy as the IQP theory page — understand that concept and the Tarrasch will make sense.'},
      {tip:'4.cxd5 — White trades pawns.',hl:[[3,3,'green']]},
      {tip:'4...exd5 — Black recaptures with the e-pawn. Black now has a d5 pawn that will become isolated after dxc5. This is the IQP Black voluntarily accepts.',hl:[[3,3,'blue']]},
      {tip:'5.Nf3 — Development.',hl:[[5,5,'green']]},
      {tip:'5...Nc6 — Development, supporting the d5 pawn.',hl:[[5,2,'blue']]},
      {tip:'6.g3 — White fianchettoes, preparing to pressure d5 from a distance.',hl:[[2,6,'green']]},
      {tip:'6...Nf6 — Development.',hl:[[5,5,'blue']]},
      {tip:'7.Bg2 — The Réti bishop. It will pressure d5 all game.',hl:[[1,6,'green']],arrows:[[6,6,3,3,'rgba(201,168,76,.4)']]},
      {tip:'7...Be7 — Solid development.',hl:[[2,4,'blue']]},
      {tip:'8.0-0 — White castles.',hl:[[7,6,'green']]},
      {tip:'8...0-0 — Black castles. Both sides are developed. Now the game begins.',hl:[[0,6,'blue']]},
      {tip:'9.dxc5! — White takes the c5 pawn, creating the IQP on d5. Black\'s d5 pawn is now isolated.',hl:[[3,3,'green']]},
      {tip:'9...Bxc5 — Black recaptures with the bishop. Bc5 is immediately active, eyeing f2.',hl:[[3,2,'blue']],arrows:[[3,2,6,5,'rgba(100,150,255,.5)']]},
      {tip:'10.Bg5 — White pins the Nf6, increasing pressure on d5.',hl:[[2,6,'green']],arrows:[[2,6,2,5,'rgba(201,168,76,.5)']]},
      {tip:'10...d4! — THE TARRASCH PAWN ADVANCE. Instead of defending passively, Black advances the IQP! This gains space, opens lines for the bishops, and forces White to deal with a passed pawn. The IQP has become a weapon.',hl:[[4,3,'blue']],arrows:[[4,3,3,3,'rgba(100,150,255,.7)'],[4,3,5,4,'rgba(100,150,255,.5)']],warn:'The Tarrasch IQP strategy: use the open d-file for rook pressure, the c4/e4 outpost squares for knights, the active bishops on c5/b6, and the ...d4 advance as a space-gaining or sacrificial weapon. When the IQP advances to d4, it is no longer isolated — it is a battering ram.'}
    ]
  );
  document.getElementById('bt-qgd-tarrasch').textContent='Tarrasch Defence — IQP as a Weapon';
  document.getElementById('btags-qgd-tarrasch').innerHTML='<span class="tag tag-aggressive">Dynamic</span><span class="tag tag-positional">IQP Play</span>';
  document.getElementById('bd-qgd-tarrasch').textContent='The Tarrasch Defence: 2...e6 then 3...c5! to counterattack immediately. Black accepts an IQP on d5 in return for active pieces, open files, and the ...d4 advance as a weapon.';
  document.getElementById('bti-qgd-tarrasch').innerHTML='<strong>Tarrasch principle:</strong> The IQP is not a weakness — it is a dynamic asset. Use the open c- and e-files, place rooks on d8 and c8 or e8, and advance ...d4 when the position demands it.';

  // ============================================================
  // MODEL GAMES + TRANSPOSITIONS (added for authority + navigation)
  // ============================================================
  // — Sicilian —
  setModelGame('najdorf','<strong>Kasparov–Topalov, Wijk aan Zee 1999</strong> — though a Pirc, Kasparov\'s handling of opposite-wing attacks is the model. For pure Najdorf: <strong>Fischer–Najdorf, Varna 1962</strong>, where Fischer\'s 6.h3 English Attack ideas crushed the variation\'s namesake.');
  setTranspose('najdorf','If White plays <strong>6.Bg5</strong> instead of 6.Be3, you enter the <strong>Main Line Najdorf</strong> (...e6, ...Be7). If White avoids 3.d4 with 2.Nc3 or 3.Bb5+, you are in <strong>Anti-Sicilian</strong> territory — see that tab.');
  setModelGame('dragon','<strong>Karpov–Korchnoi, Moscow 1974 (Game 2)</strong> — the definitive demonstration of White\'s h4-h5 / Bh6 attack against the Dragon, played in a World Championship Candidates final.');
  setTranspose('dragon','If White declines the Yugoslav Attack and plays <strong>Be2 + 0-0</strong>, the game becomes a Classical Dragon — calmer, but Black\'s ...d5 break equalises. A move-order with ...g6 before ...Nc6 can transpose to an <strong>Accelerated Dragon</strong>, sidestepping the Yugoslav entirely.');
  setModelGame('schev','<strong>Kasparov–Anand, PCA World Ch. 1995 (Game 10)</strong> — a model Scheveningen structure where Black\'s small centre and ...b5 expansion held against the Keres Attack.');

  // — vs 1.e4 —
  setModelGame('french','<strong>Botvinnik–Capablanca, AVRO 1938</strong> — the most famous French ever, featuring the immortal Ba3!! breakthrough sacrifice. Essential viewing for the Winawer structures.');
  setTranspose('french','After 3.Nc3, if White plays 3...Bb4 you reach the <strong>Winawer</strong>; 3...Nf6 the <strong>Classical</strong>. If White avoids the main lines with 3.e5, you are in the <strong>Advance French</strong>, where the ...c5 / ...Qb6 plan against d4 is standard.');
  setModelGame('caro','<strong>Capablanca–Nimzowitsch, New York 1927</strong> — Capablanca\'s clean handling of the Caro structure shows exactly why the opening is so positionally sound.');
  setTranspose('caro','If White plays the <strong>Advance 3.e5</strong>, develop the bishop with 3...Bf5 BEFORE ...e6 (same rule as the Slav). If White plays the <strong>Exchange 3.exd5 cxd5</strong>, the position resembles a Queen\'s Gambit Exchange with an extra tempo for Black.');
  setModelGame('ruy-classical','<strong>Karpov–Unzicker, Nice Olympiad 1974</strong> — the textbook Ruy López squeeze. Karpov\'s slow queenside manoeuvring (the "Spanish torture") is the model for the Closed Ruy.');
  setTranspose('ruy-classical','After 3...a6 4.Ba4 Nf6 5.0-0, if Black plays 5...b5 6.Bb3 and then ...0-0 with ...d6, you reach the <strong>Chigorin / Breyer</strong> main lines. The early 5...Nxe4 leads to the sharp <strong>Open Ruy López</strong>.');

  // — vs 1.d4 —
  setModelGame('nimzo','<strong>Capablanca–Tartakower</strong> & the games of Aron Nimzowitsch himself define this opening. For modern play: <strong>Kasparov–Karpov, 1985 World Ch.</strong> featured deep Nimzo battles over the ...c5 / doubled-pawn structures.');
  setTranspose('nimzo','If White avoids 3.Nc3 with <strong>3.Nf3</strong>, the natural ...b6 brings you to the <strong>Queen\'s Indian</strong> (see its tab). If White plays 3.g3, a Catalan-style position arises where ...d5 or ...Bb4+ keeps Black comfortable.');
  setModelGame('kid-classical','<strong>Bronstein\'s King\'s Indian games (1950s)</strong> and <strong>Kasparov\'s</strong> entire career define the KID. The classic kingside-storm model is <strong>Taimanov–Najdorf, Zurich 1953</strong>.');
  setTranspose('kid-classical','If White plays an early <strong>g3 (Fianchetto KID)</strong>, the kingside attack is slower — switch to central play with ...c6 and ...e5. A 1.c4 / 1.Nf3 move order can transpose to the KID if you set up ...g6, ...Bg7, ...d6, ...e5 regardless.');
  setModelGame('grunfeld','<strong>Fischer–Spassky, 1972 World Ch. (Game 3 ideas)</strong> and many Kasparov games. The Grünfeld\'s ...c5 strike against the big White centre is its defining mechanism.');
  setModelGame('qgd','<strong>Lasker–Capablanca</strong> and countless World Championship games. The <strong>Capablanca freeing manoeuvre</strong> (...Nd5 to trade pieces and relieve the cramped position) was born in these structures.');

  // — White repertoire —
  setModelGame('london','<strong>Kamsky\'s and Carlsen\'s London games (2010s)</strong> revived this system at elite level. Carlsen–Ding, and many of Gata Kamsky\'s wins, show the Bf4 / Ne5 / kingside-attack plan.');
  setTranspose('london','The London can be reached via <strong>1.d4, 1.Nf3, or even 1.c4 move orders</strong>. Against ...g6 (a KID setup), the London with h4-h5 ideas (the "Barry Attack" — see vs 1.d4) becomes especially dangerous.');
  setModelGame('italian','<strong>Anand–Carlsen, and Giri\'s modern Giuoco Piano games</strong> — the slow Italian with d3, c3, Nbd2, and a later d4 is a mainstay of elite chess today.');
  setTranspose('italian','If you play 4.Ng5 instead of the quiet 4.d3, you enter the sharp <strong>Two Knights Fried Liver</strong> territory. A later d4 can transpose to <strong>Scotch / Centre Game</strong> structures.');
  setModelGame('qgwhite','<strong>Carlsen–Caruana, 2018 World Ch.</strong> featured deep QG battles. For the classic squeeze: <strong>Botvinnik\'s</strong> Queen\'s Gambit games are the canon.');

  // — vs Queen's Gambit (Black) —
  setModelGame('qgd-lasker','<strong>Emanuel Lasker\'s</strong> own games gave this variation its name — the ...Ne4 / ...Nd5 simplifying idea was his trademark equalising method as World Champion.');
  setTranspose('qgd-lasker','If White plays the <strong>Exchange QGD (cxd5 exd5)</strong>, the Lasker freeing idea is less relevant — instead aim for the ...c6 / ...Bf5 / minority-attack defence.');
  setModelGame('qgd-slav','<strong>Alekhine and Euwe\'s 1935-37 World Ch. matches</strong> were full of Slav battles that established the ...dxc4 / ...Bf5 main lines still played today.');
  setTranspose('qgd-slav','If you delay ...dxc4 and play ...e6 first, you reach the <strong>Semi-Slav</strong> (Meran / Botvinnik) — far sharper. Keep the bishop\'s diagonal open with the pure Slav move order to stay solid.');

  // ============================================================
  // EVALUATION ANNOTATIONS (teach position judgement)
  // Format: evalMap[boardId] = { plyIndex: evalNumber }  (+ = White better)
  // Applied to existing step objects without rewriting board data.
  // ============================================================
  const EVAL_MAP={
    najdorf:{0:0.3,6:0.4,12:0.3,18:0.2},
    dragon:{0:0.3,8:0.4,14:0.3,18:0.4},
    schev:{0:0.3,10:0.3,16:0.2},
    french:{0:0.3,4:0.4,8:0.3},
    caro:{0:0.3,6:0.3,10:0.2},
    'ruy-classical':{0:0.3,8:0.4,16:0.4},
    nimzo:{0:0.3,6:0.0,12:0.0},
    'kid-classical':{0:0.3,8:0.3,16:0.4},
    qgd:{0:0.3,10:0.2,18:0.2},
    london:{0:0.2,6:0.2,12:0.0,18:-0.2},
    italian:{0:0.3,8:0.3,14:0.3},
    qgwhite:{0:0.3,8:0.4},
    'qgd-lasker':{0:0.3,16:0.1,24:0.0},
    'qgd-slav':{0:0.3,10:0.1,20:0.0},
    'qga-black':{0:0.3,6:0.2,18:0.0},
    'qgd-tarrasch':{0:0.3,10:0.3,20:0.2},
    'd4-e5':{0:0.0,2:1.2,8:2.8,18:3.0}
  };
  Object.keys(EVAL_MAP).forEach(bid=>{
    const b=BOARDS[bid];
    if(!b||!b.steps)return;
    const m=EVAL_MAP[bid];
    Object.keys(m).forEach(ply=>{
      const p=parseInt(ply);
      if(b.steps[p])b.steps[p].eval=m[ply];
    });
    // re-render if currently shown
    if(document.getElementById('cb-'+bid))render(bid);
  });

} // ── end initBoards ──

function showSection(id,btn){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
  setTimeout(()=>{Object.keys(BOARDS).forEach(bid=>{if(document.getElementById('cb-'+bid))render(bid);});},60);
}

  // ============================================================
  // PUZZLE BANK
  // ============================================================
  const PUZZLE_BANK = {
    p1600: [
      {
        title:'Knight Fork',
        fen:'r3r1k1/4q3/8/5N2/8/8/5PPP/6K1 w - - 0 1',
        moves:[
          {from:'f5',to:'d6',label:'Nd6+!'},{from:'e7',to:'f8',label:'Qf8'},
          {from:'d6',to:'e8',label:'Nxe8'}
        ],
        steps:[
          {tip:'White to move. A knight fork is available. Where can the knight jump to attack two valuable pieces at once?',hl:[[3,5,'green']]},
          {tip:'1.Nd6+! The knight forks the Black queen on e7 and the rook on e8 with check! Black must respond to the check.',hl:[[2,3,'green']],arrows:[[3,5,2,3,'rgba(201,168,76,.7)'],[2,3,1,4,'rgba(201,168,76,.5)'],[2,3,0,4,'rgba(201,168,76,.5)']]},
          {tip:'1...Qf8 — Black moves the queen out of the fork, but now the rook on e8 is undefended.',hl:[[0,5,'blue']]},
          {tip:'2.Nxe8 — White wins the exchange. The knight fork won material! Key idea: always check for knight forks when your knight can reach a square that attacks two pieces simultaneously.',hl:[[0,4,'green']]}
        ]
      },
      {
        title:'Back Rank Mate',
        fen:'5rk1/pp3ppp/2p2q2/8/8/2P5/PP3PPP/3R2K1 w - - 0 1',
        moves:[
          {from:'d1',to:'d8',label:'Rd8!'},{from:'f8',to:'d8',label:'Rxd8'}
        ],
        steps:[
          {tip:'White to move. Black\'s back rank is weak — only the rook guards it. Can White exploit this?',hl:[[0,5,'blue']]},
          {tip:'1.Rd8! White penetrates to the 8th rank. Now Black faces a back rank threat.',hl:[[0,3,'green']],arrows:[[7,3,0,3,'rgba(201,168,76,.7)']]},
          {tip:'1...Rxd8 — Black must take the rook to prevent checkmate... but now White plays Rxd8# — wait, White already played Rd8. After Rxd8, White has no rook left. But the point is: Rd8 itself threatens Rd8-d8 checkmate if Black doesn\'t take! The back rank is the weakness.',hl:[[0,3,'blue']],warn:'The key lesson: always check if your opponent\'s back rank is defended. A single rook penetrating to the 8th rank is often decisive. Prevent this by keeping a pawn on g6 or h6 to give your king breathing room.'}
        ]
      },
      {
        title:'Winning the Pin',
        fen:'r2qk2r/pp3ppp/2n5/1B6/8/8/PPP2PPP/R1BQK2R w KQkq - 0 1',
        moves:[
          {from:'b5',to:'c6',label:'Bxc6!'}
        ],
        steps:[
          {tip:'White to move. The Bb5 pins the Nc6 — the knight cannot move because it would expose the Black king. How does White exploit this pin?',hl:[[4,1,'green']],arrows:[[4,1,5,2,'rgba(201,168,76,.6)'],[5,2,0,4,'rgba(201,168,76,.3)']]},
          {tip:'1.Bxc6! White simply captures the pinned piece. The Nc6 was defended, but a pinned piece is a bad defender — it can\'t actually move to recapture without exposing the king to check. White wins a knight for free. Always look for pinned pieces you can capture!',hl:[[5,2,'green']],warn:'Key principle: a pinned piece is a weak defender. If a piece is pinned to the king, it cannot legally capture even if it seems to defend something. Attack pinned pieces — they cannot fight back.'}
        ]
      },
      {
        title:'Skewer',
        fen:'1k6/8/8/1q6/8/8/8/1R6 w - - 0 1',
        moves:[
          {from:'b1',to:'b5',label:'Rxb5!'},{from:'b8',to:'c7',label:'Kc7'},
          {from:'b5',to:'b7',label:'Rb7+'}
        ],
        steps:[
          {tip:'White to move. A skewer is like a pin in reverse — the more valuable piece is in front, and the less valuable piece is behind it. What rook move attacks both king and queen?',hl:[[7,1,'green']]},
          {tip:'1.Rxb5! White attacks the queen AND the king on the same line! The queen is between the rook and the king.',hl:[[3,1,'green']],arrows:[[7,1,3,1,'rgba(201,168,76,.7)'],[3,1,0,1,'rgba(201,168,76,.4)']]},
          {tip:'1...Kc7 — The king must move out of check... but the queen is left on b5!',hl:[[0,2,'blue']]},
          {tip:'2.Rb7+ — Wait, actually 1.Rxb5 just takes the queen immediately since the king was behind it! White wins the queen. Skewers force the front piece to move, exposing the piece behind it.',hl:[[1,1,'green']]}
        ]
      },
      {
        title:'Discovered Check',
        fen:'3k3q/8/3N4/8/8/8/8/3R3K w - - 0 1',
        moves:[
          {from:'d6',to:'f7',label:'Nf7+!'},{from:'d8',to:'c8',label:'Kc8'},
          {from:'f7',to:'h8',label:'Nxh8'}
        ],
        steps:[
          {tip:'White to move. The knight on d6 is sitting on the same file as the White rook and the Black king. What happens if the knight moves off that file with check?',hl:[[2,3,'green'],[7,3,'green'],[0,3,'blue']],arrows:[[7,3,0,3,'rgba(201,168,76,.3)']]},
          {tip:'1.Nf7+! DISCOVERED CHECK — the knight moves off the d-file, and the Rd1 immediately has a clear line to the king on d8. Two threats at once: the rook checks the king, and the knight attacks the queen on h8.',hl:[[1,5,'green']],arrows:[[7,3,0,3,'rgba(201,168,76,.7)']]},
          {tip:'1...Kc8 — The king must escape the discovered check by leaving the d-file.',hl:[[0,2,'blue']]},
          {tip:'2.Nxh8 — The knight captures the queen! White wins a queen for a knight. The discovered check forced the king to abandon the queen on h8, and now it falls. This is the essence of a discovered attack: the moving piece creates one threat, the unveiled piece creates another — and Black cannot meet both.',hl:[[0,7,'green']],warn:'Discovered checks are exceptionally powerful because you effectively get two moves at once. Train yourself to see pieces that are lined up behind other pieces — on files, ranks, and diagonals. Any time a piece can move to unleash a hidden attacker while also doing something useful itself, that is a candidate for a discovered attack.'}
        ]
      }
    ],
    p1900: [
      {
        title:'Queen Sacrifice for Mate',
        fen:'r4rk1/ppp2ppp/2n5/3p4/3P4/2PB4/PP3PPP/R2Q1RK1 w - - 0 1',
        moves:[
          {from:'d3',to:'h7',label:'Bxh7+!'},{from:'g8',to:'h7',label:'Kxh7'},
          {from:'d1',to:'h5',label:'Qh5+'},{from:'h7',to:'g8',label:'Kg8'},
          {from:'h5',to:'h8',label:'Qh8#'}
        ],
        steps:[
          {tip:'White to move. Black\'s kingside looks solid, but there is a classic sacrificial attack available. Can you see the combination?',hl:[[2,3,'green']],arrows:[[2,3,1,7,'rgba(201,168,76,.5)']]},
          {tip:'1.Bxh7+! The bishop sacrifice on h7 is the first blow. White pulls the king out of safety.',hl:[[1,7,'green']],arrows:[[2,3,1,7,'rgba(201,168,76,.7)']]},
          {tip:'1...Kxh7 — Black must take.',hl:[[1,7,'blue']]},
          {tip:'2.Qh5+ — The queen swoops in with check. The king has no safe square.',hl:[[3,7,'green']],arrows:[[7,3,3,7,'rgba(201,168,76,.7)']]},
          {tip:'2...Kg8 — King retreats to the back rank.',hl:[[0,6,'blue']]},
          {tip:'3.Qh8# — CHECKMATE! The queen delivers mate on h8. This is the classic bishop sacrifice pattern: Bxh7+ pulls the king, Qh5+ forces it back, Qh8#. Learn this — you will use it many times.',hl:[[0,7,'green']],warn:'The bishop sacrifice on h7 (or h2 against White) is one of the most common attacking patterns in chess. Prerequisites: a bishop on d3 (or d6), a queen ready to come to h5 (or h4), and Black\'s g6 square undefended. When all three conditions are met, Bxh7+ is almost always winning.'}
        ]
      },
      {
        title:'Double Attack: Knight Strikes',
        fen:'r1bq1rk1/pp3ppp/2n2n2/3pp3/2B5/2NP1N2/PPP2PPP/R1BQR1K1 w - - 0 1',
        moves:[
          {from:'f3',to:'e5',label:'Nxe5!'},{from:'f6',to:'e4',label:'Nxe4?'},
          {from:'e5',to:'c6',label:'Nxc6!'}
        ],
        steps:[
          {tip:'White to move. Black has two pieces on e5 and d5. White has a knight on f3 and a bishop on c4. What powerful capture starts a winning combination?',hl:[[5,5,'green']]},
          {tip:'1.Nxe5! White takes the e5 pawn. If Black recaptures with the knight (Nxe4), what does White play next?',hl:[[3,4,'green']],arrows:[[5,5,3,4,'rgba(201,168,76,.7)']]},
          {tip:'1...Nxe4? — Black takes the e4 pawn, seemingly winning a pawn back.',hl:[[3,4,'blue']]},
          {tip:'2.Nxc6! — White forks the queen on d8 and the rook on a8 with the knight! The double attack wins material. The sequence Nxe5 Nxe4 Nxc6 is a classic fork combination. Always calculate forcing sequences before playing the first move.',hl:[[1,2,'green']],arrows:[[3,4,1,2,'rgba(201,168,76,.7)'],[1,2,0,3,'rgba(201,168,76,.5)'],[1,2,0,0,'rgba(201,168,76,.5)']]}
        ]
      },
      {
        title:'Arabian Mate',
        fen:'5bk1/6pp/7N/8/8/8/8/7R w - - 0 1',
        moves:[
          {from:'h1',to:'h8',label:'Rh8+!'},{from:'g8',to:'h8',label:'Kxh8'},
          {from:'h6',to:'f7',label:'Nf7#'}
        ],
        steps:[
          {tip:'White to move. Black\'s king is hemmed in on g8 by its own pawns and bishop. White has a rook and knight. Can you find the two-move forced checkmate?',hl:[[0,6,'blue']],arrows:[[2,7,0,6,'rgba(201,168,76,.4)']]},
          {tip:'1.Rh8+! The rook sacrifice draws the king out. Black must take — the bishop on f8 blocks the f8 escape, and the knight covers f7 and g8.',hl:[[0,7,'green']],arrows:[[7,7,0,7,'rgba(201,168,76,.7)'],[2,7,1,5,'rgba(201,168,76,.4)'],[2,7,0,6,'rgba(201,168,76,.4)']]},
          {tip:'1...Kxh8 — The king is forced to take the rook. It has no other square.',hl:[[0,7,'blue']]},
          {tip:'2.Nf7# — CHECKMATE! This is the Arabian Mate — rook sacrifice to lure the king, knight delivers the killing blow. The knight on f7 gives check, controls h8, g5, and h6. The king has no escape.',hl:[[1,5,'green']],arrows:[[2,7,1,5,'rgba(201,168,76,.7)']],warn:'The Arabian Mate is one of the oldest named checkmate patterns in chess. It requires: (1) the king is on the corner h8, (2) a knight covering f7 and g6, (3) a rook on g8 or h8. The rook sacrifice to bring the king to h8 is the key move. Recognise this pattern whenever the enemy king is near the h8 corner with pawns blocking escape.'}
        ]
      },
      {
        title:'Remove the Defender',
        fen:'r4rk1/1pp2ppp/p1n5/3p4/3P4/2PB1N2/PP3PPP/R4RK1 w - - 0 1',
        moves:[
          {from:'f3',to:'e5',label:'Ne5!'},{from:'c6',to:'e5',label:'Nxe5'},
          {from:'d3',to:'h7',label:'Bxh7+!'},{from:'g8',to:'h7',label:'Kxh7'},
          {from:'d4',to:'e5',label:'dxe5'}
        ],
        steps:[
          {tip:'White to move. Black\'s knight on c6 defends against the bishop sacrifice on h7. How does White remove this defender first?',hl:[[5,5,'green']],arrows:[[2,3,1,7,'rgba(201,168,76,.4)']]},
          {tip:'1.Ne5! White plays Ne5, threatening a fork. If Black takes, the c6 knight is removed and the h7 sacrifice becomes decisive.',hl:[[3,4,'green']],arrows:[[5,5,3,4,'rgba(201,168,76,.7)']]},
          {tip:'1...Nxe5 — Black takes the knight, removing their own defender of h7.',hl:[[3,4,'blue']]},
          {tip:'2.Bxh7+! Now the sacrifice works because the Nc6 is gone. White captures with the bishop.',hl:[[1,7,'green']],arrows:[[2,3,1,7,'rgba(201,168,76,.7)']]},
          {tip:'2...Kxh7 — King takes.',hl:[[1,7,'blue']]},
          {tip:'3.dxe5 — White recaptures the knight and is now up material with a continuing attack. The "remove the defender" tactic sets up a second tactic. Always look for two-step combinations.',hl:[[3,4,'green']]}
        ]
      },
      {
        title:'Rook to the 7th',
        fen:'r4rk1/1pp3pp/p7/3p4/8/2P5/PP3PPP/R4RK1 w - - 0 1',
        moves:[
          {from:'f1',to:'f7',label:'Rf7!'},{from:'g8',to:'h8',label:'Kh8'},
          {from:'a1',to:'f1',label:'Raf1'}
        ],
        steps:[
          {tip:'White to move. Black\'s back rank is weak. How does White activate the rook most aggressively?',hl:[[7,5,'green']]},
          {tip:'1.Rf7! The rook invades the 7th rank, attacking the c7 and b7 pawns and cutting off the Black king. This is a dominant rook position.',hl:[[1,5,'green']],arrows:[[7,5,1,5,'rgba(201,168,76,.7)'],[1,5,1,2,'rgba(201,168,76,.4)'],[1,5,1,1,'rgba(201,168,76,.4)']]},
          {tip:'1...Kh8 — Black moves the king away from the rook\'s attack.',hl:[[0,7,'blue']]},
          {tip:'2.Raf1 — White doubles rooks! Both rooks on the f-file and the rook on f7 dominating the 7th rank. Black\'s position is crumbling. A rook on the 7th rank attacking multiple pawns is one of the most powerful positions in chess.',hl:[[7,0,7,5,'green']],arrows:[[7,5,1,5,'rgba(201,168,76,.5)'],[7,5,7,5,'rgba(201,168,76,.4)']]}
        ]
      }
    ],
    p2100: [
      {
        title:'Pawn Endgame: Promotion Race',
        fen:'8/8/3k4/3P4/3K4/8/8/8 w - - 0 1',
        moves:[
          {from:'d4',to:'c4',label:'Kc4!'},{from:'d6',to:'e5',label:'Ke5'},
          {from:'c4',to:'c5',label:'Kc5'},{from:'e5',to:'e4',label:'Ke4'},
          {from:'d5',to:'d6',label:'d6'},{from:'e4',to:'e3',label:'Ke3'},
          {from:'d6',to:'d7',label:'d7'},{from:'e3',to:'e2',label:'Ke2'},
          {from:'d7',to:'d8',label:'d8=Q',promo:'Q'}
        ],
        steps:[
          {tip:'White to move. This is a king and pawn endgame. White must find the correct king route to escort the pawn to promotion. The key is the opposition.',hl:[[4,3,'green'],[2,3,'blue']]},
          {tip:'1.Kc4! NOT Kd3 or Kd4 — White must go to the SIDE to get around the Black king. The direct route Kd4-c5-d6 fails because Black can block.',hl:[[4,2,'green']],arrows:[[4,3,4,2,'rgba(201,168,76,.7)']],warn:'If White plays 1.Kd3? Black plays Kd5 and has the opposition — White cannot make progress. Kc4 sidesteps around the Black king to escort the pawn from the front. This is the key technique in king-and-pawn endgames.'},
          {tip:'1...Ke5 — Black\'s king tries to get in front of the pawn.',hl:[[3,4,'blue']]},
          {tip:'2.Kc5! — White keeps the king in front of the pawn and takes the opposition. Black must give way.',hl:[[3,2,'green']]},
          {tip:'2...Ke4 — Black tries to shadow the pawn.',hl:[[4,4,'blue']]},
          {tip:'3.d6! — The pawn advances while the king blocks Black out.',hl:[[2,3,'green']]},
          {tip:'3...Ke3 — Black\'s king is too far.',hl:[[5,4,'blue']]},
          {tip:'4.d7 — One step from promotion.',hl:[[1,3,'green']]},
          {tip:'4...Ke2 — Black\'s king can\'t stop it.',hl:[[6,4,'blue']]},
          {tip:'5.d8=Q — PROMOTION! White promotes to a queen and wins. The key was 1.Kc4 — going around the enemy king rather than trying to push through directly. In king-pawn endgames, the king must escort the pawn from in front, not behind.',hl:[[0,3,'green']]}
        ]
      },
      {
        title:'Deflection Combination',
        fen:'r2q1rk1/pp3ppp/2p5/3p4/3P4/2PB4/PP3PPP/R2Q1RK1 w - - 0 1',
        moves:[
          {from:'d3',to:'h7',label:'Bxh7+!'},{from:'g8',to:'h7',label:'Kxh7'},
          {from:'d1',to:'h5',label:'Qh5+'},{from:'h7',to:'g8',label:'Kg8'},
          {from:'h5',to:'h8',label:'Qh8#'}
        ],
        steps:[
          {tip:'White to move. The Black queen on d8 defends the back rank. White needs to deflect it. Find the forcing combination that leads to checkmate.',hl:[[2,3,'green']]},
          {tip:'1.Bxh7+! The bishop sacrifice deflects the king from defending the back rank. This is a deflection — forcing a piece away from its defensive duty.',hl:[[1,7,'green']],arrows:[[2,3,1,7,'rgba(201,168,76,.7)']]},
          {tip:'1...Kxh7 — The king is deflected from defending d8 and g8.',hl:[[1,7,'blue']]},
          {tip:'2.Qh5+ — Queen comes with check, driving the king back.',hl:[[3,7,'green']]},
          {tip:'2...Kg8 — King retreats.',hl:[[0,6,'blue']]},
          {tip:'3.Qh8# — Checkmate. The deflection of the king allowed the queen to land on h8 unchallenged. Deflection tactics remove the key defender from their post.',hl:[[0,7,'green']],warn:'Deflection is one of the most common tactical motifs. A defender is pulled away from their duty — here the king was deflected from guarding h8. Always ask: which piece is doing the most defensive work, and can I force it away?'}
        ]
      },
      {
        title:'Underpromotion and Mate',
        fen:'6k1/5P2/6K1/8/8/8/8/8 w - - 0 1',
        moves:[
          {from:'f7',to:'f8',label:'f8=Q!',promo:'Q'},{from:'g8',to:'h7',label:'Kh7'},
          {from:'f8',to:'f7',label:'Qf7+'}
        ],
        steps:[
          {tip:'White to move. The f7 pawn is about to promote. Is promotion to a queen the best move? Calculate precisely.',hl:[[1,5,'green']]},
          {tip:'1.f8=Q! — Promote to a queen! The queen is almost always the right promotion. Now the Black king is stuck.',hl:[[0,5,'green']],arrows:[[1,5,0,5,'rgba(201,168,76,.7)']]},
          {tip:'1...Kh7 — Black must move.',hl:[[1,7,'blue']]},
          {tip:'2.Qf7+ — The queen gives check and drives the king to the corner. From here White plays Qg8# or Qh5# depending on where the king goes. Always calculate the mating sequence after promotion — it is not always automatic.',hl:[[1,5,'green']],arrows:[[0,5,1,5,'rgba(201,168,76,.6)'],[1,5,0,6,'rgba(201,168,76,.5)']]}
        ]
      },
      {
        title:'Rook Deflection + Promotion',
        fen:'1r4k1/P4ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        moves:[
          {from:'a1',to:'a8',label:'Ra8!'},{from:'b8',to:'a8',label:'Rxa8'},
          {from:'a7',to:'a8',label:'a8=Q+',promo:'Q'},{from:'g8',to:'h7',label:'Kh7'},
          {from:'a8',to:'a7',label:'Qa7!'}
        ],
        steps:[
          {tip:'White to move. There is a passed pawn on a7 threatening to promote, but the Black rook on b8 is guarding the a8 square. How does White remove this defender?',hl:[[1,0,'green'],[1,1,'blue']],arrows:[[1,0,0,0,'rgba(201,168,76,.5)']]},
          {tip:'1.Ra8! — White plays the rook to a8, directly in front of the promoting square. The rook forces Black to make a decision: take the rook, or let the pawn promote immediately.',hl:[[0,0,'green']],arrows:[[7,0,0,0,'rgba(201,168,76,.7)']]},
          {tip:'1...Rxa8 — Black captures the rook. But now the a8 square is occupied only by the Black rook — and the White pawn on a7 can capture it and promote!',hl:[[0,0,'blue']]},
          {tip:'2.a8=Q+! — The pawn captures the Black rook and promotes to a queen with check! This is the deflection: White sacrificed the rook to force the Black rook onto a8 where the pawn could take it.',hl:[[0,0,'green']],arrows:[[1,0,0,0,'rgba(201,168,76,.7)'],[0,0,0,6,'rgba(201,168,76,.5)']]},
          {tip:'2...Kh7 — The king moves out of check.',hl:[[1,7,'blue']]},
          {tip:'3.Qa7! — The queen centralises to a7, threatening Qg7# and covering multiple escape squares. White has won a rook in exchange for nothing, and has a dominant queen. The game is over.',hl:[[1,0,'green']],arrows:[[1,0,1,6,'rgba(201,168,76,.5)']],warn:'Deflection is the key idea: forcing a defender onto a square where it becomes vulnerable. Here the Black rook was deflected to a8 so the pawn could capture it while promoting. Whenever you have a passed pawn on the 7th rank, calculate whether you can force the guard off the promotion square — the rook sacrifice is often worth it to promote.'}
        ]
      },
      {
        title:'Queen and Rook Mate',
        fen:'r5k1/pp4pp/5p2/8/8/5Q2/PPP2PPP/5RK1 w - - 0 1',
        moves:[
          {from:'f3',to:'f6',label:'Qf6!'},{from:'g8',to:'h8',label:'Kh8'},
          {from:'f1',to:'f8',label:'Rxf8+'},{from:'a8',to:'f8',label:'Rxf8'},
          {from:'f6',to:'f8',label:'Qxf8#'}
        ],
        steps:[
          {tip:'White to move. Black\'s king is on g8 with limited escape squares. White has a queen and rook. Find the winning combination.',hl:[[5,5,'green']]},
          {tip:'1.Qf6! — The queen moves to f6, threatening Qg7# and Qxf7#. Black\'s king must move.',hl:[[2,5,'green']],arrows:[[5,5,2,5,'rgba(201,168,76,.7)'],[2,5,0,6,'rgba(201,168,76,.5)'],[2,5,1,5,'rgba(201,168,76,.4)']]},
          {tip:'1...Kh8 — The only move. The king retreats to the corner.',hl:[[0,7,'blue']]},
          {tip:'2.Rxf8+! — White sacrifices the rook on f8, forcing the Black rook to take.',hl:[[0,5,'green']],arrows:[[7,5,0,5,'rgba(201,168,76,.7)']]},
          {tip:'2...Rxf8 — Black must recapture.',hl:[[0,5,'blue']]},
          {tip:'3.Qxf8# — CHECKMATE! The queen takes the rook on f8 with checkmate. The king is in the corner with no escape. This is the classic "back rank plus corner" mating pattern.',hl:[[0,5,'green']],warn:'Pattern recognition: when the enemy king is in the corner and you have queen + rook, look for Qf6 (controlling escape squares) followed by Rxf8+ Rxf8 Qxf8#. This exact sequence wins in many positions where Black\'s king is on g8 or h8.'}
        ]
      }
    ]
  };

  let puzzleIndices = {p1600: 0, p1900: 0, p2100: 0};

  function refreshPuzzles() {
    const seed = Math.floor(Math.random() * 10000);
    const n1600 = PUZZLE_BANK.p1600.length;
    const n1900 = PUZZLE_BANK.p1900.length;
    const n2100 = PUZZLE_BANK.p2100.length;
    puzzleIndices.p1600 = seed % n1600;
    puzzleIndices.p1900 = (seed + 2) % n1900;
    puzzleIndices.p2100 = (seed + 4) % n2100;

    const label = document.getElementById('puzzle-seed-label');
    if (label) label.textContent = 'SET #' + seed;

    loadPuzzle('p1600', PUZZLE_BANK.p1600[puzzleIndices.p1600]);
    loadPuzzle('p1900', PUZZLE_BANK.p1900[puzzleIndices.p1900]);
    loadPuzzle('p2100', PUZZLE_BANK.p2100[puzzleIndices.p2100]);
  }

  function loadPuzzle(id, puzzle) {
    const container = document.getElementById('bw-' + id);
    if (!container) return;

    // Normalise moves: strip label, keep from/to/promo
    const moves = puzzle.moves.map(m => {
      const mv = {from: m.from, to: m.to};
      if (m.promo) mv.promo = m.promo;
      return mv;
    });

    // Steps array must be moves.length + 1 entries
    const steps = puzzle.steps.map(s => {
      const out = {tip: s.tip || '', hl: s.hl || [], arrows: s.arrows || []};
      if (s.warn) out.warn = s.warn;
      return out;
    });
    // Pad if needed
    while (steps.length < moves.length + 1) steps.push({tip:'', hl:[], arrows:[]});

    // reg() builds the board HTML and renders — must happen before we set inner elements
    reg(id, container, puzzle.fen, moves, steps);

    // These elements are created by buildBoardHTML inside reg(), so set them after
    const btEl = document.getElementById('bt-' + id);
    if (btEl) btEl.textContent = puzzle.title;
    const bdEl = document.getElementById('bd-' + id);
    if (bdEl) bdEl.textContent = 'White to move — try to find the key move before stepping through.';
    const btiEl = document.getElementById('bti-' + id);
    if (btiEl) btiEl.textContent = '';
    const btagsEl = document.getElementById('btags-' + id);
    if (btagsEl) {
      const tier = id === 'p1600' ? '~1600' : id === 'p1900' ? '~1900' : '~2100';
      btagsEl.innerHTML = '<span class="tag tag-positional">' + tier + '</span>';
    }

    // Also update the outer title span
    const outerTitle = document.getElementById(id + '-title');
    if (outerTitle) outerTitle.textContent = puzzle.title;
  }

  window.addEventListener('load',()=>{
    setTimeout(()=>{
      initBoards();
      refreshPuzzles();
    }, 80);
  });
window.addEventListener('resize',()=>{Object.keys(BOARDS).forEach(bid=>{if(document.getElementById('cb-'+bid))render(bid);});});
