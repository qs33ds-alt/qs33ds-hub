/* AstroDB Workspace V2 — navigation controller; no persistence or calculation writes. */
(function(){'use strict';
const mount=document.getElementById('astrodbWorkspaceNav');if(!mount)return;
const sections=[['observatorio','Observatorio'],['datos','Datos natales'],['analisis','Análisis'],['natalcore','NatalCore']];
const nav=document.createElement('nav');nav.className='workspaceV2Nav';nav.setAttribute('aria-label','Espacios de trabajo');
sections.forEach(([id,label])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.workspace=id;button.setAttribute('aria-pressed',id==='observatorio'?'true':'false');nav.appendChild(button)});
mount.appendChild(nav);
const editor=document.getElementById('editor');if(!editor)return;
const targets={observatorio:editor.querySelector('.futureMandalaPanel'),datos:editor.querySelector('.futureBirthPanel'),analisis:editor.querySelector('.compactCard'),natalcore:document.getElementById('herramientasEstructurales')};
function activate(id){const target=targets[id];if(!target)return;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspace===id)));target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
nav.addEventListener('click',event=>{const b=event.target.closest('button[data-workspace]');if(b)activate(b.dataset.workspace)});
})();
