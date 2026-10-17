/* AstroDB Workspace V2 — isolated presentation controller. No changes to calculation, chart IDs or storage. */
(function(){'use strict';
const mount=document.getElementById('astrodbWorkspaceNav');const editor=document.getElementById('editor');if(!mount||!editor)return;
const items=[['biblioteca','Biblioteca'],['observatorio','Observatorio'],['datos','Datos natales'],['analisis','Análisis'],['natalcore','NatalCore']];
const nav=document.createElement('nav');nav.className='workspaceV2Nav';nav.setAttribute('aria-label','Espacios de trabajo');
for(const [id,label] of items){const button=document.createElement('button');button.type='button';button.dataset.workspace=id;button.textContent=label;button.setAttribute('aria-pressed',String(id==='observatorio'));nav.appendChild(button)}mount.appendChild(nav);
const sidebar=document.querySelector('.sidebar');const library=sidebar?.querySelector('.sideCard');
const librarySpace=document.createElement('section');librarySpace.id='workspaceLibrary';librarySpace.className='workspaceLibrary hidden';librarySpace.innerHTML='<header class="workspaceLibraryHeader"><span>01 / ARCHIVO NATAL</span><h2>Biblioteca de cartas</h2><p>Consulta, recupera y abre tus fichas. Los datos permanecen en sus fuentes originales.</p></header><div id="workspaceLibrarySlot" class="workspaceLibrarySlot"></div>';
mount.insertAdjacentElement('afterend',librarySpace);
const stage=document.createElement('div');stage.className='v2Stage';stage.setAttribute('aria-hidden','true');stage.innerHTML='<svg class="v2Orbital" viewBox="0 0 800 800"><defs><linearGradient id="v2Orbit" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5ce1ed" stop-opacity=".82"/><stop offset="1" stop-color="#b28df7" stop-opacity=".18"/></linearGradient></defs><circle cx="400" cy="400" r="348"/><circle cx="400" cy="400" r="292"/><circle cx="400" cy="400" r="226"/><ellipse cx="400" cy="400" rx="354" ry="116" transform="rotate(-32 400 400)"/><ellipse cx="400" cy="400" rx="354" ry="116" transform="rotate(32 400 400)"/><g class="v2OrbitPoints"><circle cx="400" cy="52" r="5"/><circle cx="692" cy="400" r="4"/><circle cx="174" cy="400" r="3"/></g></svg>';
mandala?.appendChild(stage);
if(library){librarySpace.querySelector('#workspaceLibrarySlot').appendChild(library);library.classList.add('workspaceLibraryCard');}
const birth=editor.querySelector('.futureBirthPanel');const mandala=editor.querySelector('.futureAnalysisLayout > .card:nth-child(2)');const tools=editor.querySelector('#herramientasEstructurales');const data=editor.querySelector('.compactCard');const heading=editor.querySelector('.futureSectionLabel');
if(!birth||!mandala||!tools||!data)return;
birth.classList.add('workspaceBirth');mandala.classList.add('workspaceMandala');tools.classList.add('workspaceTools');data.classList.add('workspaceAnalysis');if(heading)heading.classList.add('workspaceAnalysisHeading');
const natal=Array.from(tools.querySelectorAll('details')).find(d=>/NatalCore/i.test(d.querySelector('summary')?.textContent||''));const json=Array.from(tools.querySelectorAll('details')).find(d=>/Base de datos/i.test(d.querySelector('summary')?.textContent||''));
const summary=document.createElement('div');summary.className='workspaceBirthSummary';summary.setAttribute('aria-live','polite');const summaryTitle=document.createElement('strong');const summaryInfo=document.createElement('span');summary.append(summaryTitle,summaryInfo);mandala.insertBefore(summary,mandala.querySelector('canvas'));
function updateSummary(){const get=id=>document.getElementById(id)?.value?.trim()||'';summaryTitle.textContent=get('nombre')||'Nueva carta natal';const date=[get('dia'),get('mes'),get('anio')].filter(Boolean).join('/');summaryInfo.textContent=[date,get('hora'),get('ciudad')].filter(Boolean).join(' · ')||'Introduce los datos de nacimiento para calcular la carta'}
for(const id of ['nombre','dia','mes','anio','hora','ciudad'])document.getElementById(id)?.addEventListener('input',updateSummary);updateSummary();
function setView(view){if(!items.some(([id])=>id===view))return;editor.dataset.workspaceView=view;librarySpace.classList.toggle('hidden',view!=='biblioteca');editor.classList.toggle('workspaceLibraryInactive',view==='biblioteca');nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspace===view)));if(view==='natalcore'&&natal)natal.open=true;if(view==='datos'&&json)json.open=false;updateSummary();}
nav.addEventListener('click',e=>{const button=e.target.closest('button[data-workspace]');if(button)setView(button.dataset.workspace)});
// Opening or creating a chart must leave the library-only view; original handlers remain unchanged.
const openButton=document.getElementById('btnAbrirSeleccion');const newButton=document.getElementById('btnNueva');const chartSelector=document.getElementById('selectorCartas');
for(const button of [openButton,newButton])button?.addEventListener('click',()=>setView('observatorio'));
chartSelector?.addEventListener('change',()=>{if(chartSelector.value!=='')setView('observatorio')});
const libraryList=document.getElementById('lista');libraryList?.addEventListener('click',event=>{if(event.target.closest('button,a,[role="button"],.listItem')&&editor.dataset.workspaceView==='biblioteca')setView('observatorio')});
const observer=new MutationObserver(()=>{if(!editor.classList.contains('hidden'))updateSummary()});observer.observe(editor,{attributes:true,attributeFilter:['class']});
setView('observatorio');
})();
