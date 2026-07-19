
const body=document.getElementById('term-body');
const input=document.getElementById('term-input');

const cmds={
help:`Available:
  whoami   — who is behind REHNOVA
  about    — what I do
  scope    — where I operate
  stack    — tools & languages
  mission  — why REHNOVA exists
  contact  — how to reach
  clear    — clear terminal`,

whoami:`Rehan
Offensive security operator. Builder of REHNOVA.
Based in ops, not compliance.`,

about:`I'm an offensive operator. I break paths that matter — AD, Entra ID, cloud, infra — then automate the manual grind.

REHNOVA came from that gap: real engagements need real tooling.`,

scope:`AD / Entra ID / Cloud / Infra
Identity is the perimeter.`,

stack:`Go, Rust, C, Python, PowerShell
ADCS, Kerberos, OIDC, loaders, EDR evasion, C2`,

mission:`One platform to handle the kill-chain:
recon → exploit → post → report.
No bloat. Just ops.`,

contact:`rehnova@ops.io — Selective engagements.`
};

function print(html){
  const d=document.createElement('div');
  d.style.marginBottom='10px';
  d.innerHTML=html.replace(/\n/g,'<br>');
  body.appendChild(d);
  body.scrollTop=body.scrollHeight;
}

function run(raw){
  const c=raw.trim().toLowerCase();
  if(!c) return;
  print(`<span style="color:rgba(255,255,255,.25)">rehnova:~$</span> <span style="color:#fff">${raw}</span>`);
  if(c==='clear'){body.innerHTML='';return}
  if(cmds[c]){print(cmds[c])}
  else{print(`command not found: ${c}. Type help.`)}
}

input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ run(input.value); input.value=''; } });
document.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>{ run(b.dataset.cmd); input.focus(); }));
document.getElementById('term-wrap').addEventListener('click',()=>input.focus());

// auto
setTimeout(()=>run('whoami'),400);

(function(){
  const toast=document.getElementById('c-copied');
  document.querySelectorAll('[data-copy]').forEach(r=>{
    r.addEventListener('click',()=>{ 
      navigator.clipboard.writeText(r.getAttribute('data-copy'));
      toast.style.opacity=1;setTimeout(()=>toast.style.opacity=0,1400);
    });
  });
})();