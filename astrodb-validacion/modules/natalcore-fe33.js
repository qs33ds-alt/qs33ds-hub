/* NatalCore FE-33 structural enrichment: deterministic, non-interpretive, no inferred missing data. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AstroDBFE33=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SIGNS=['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const DOM={Sol:['Leo'],Luna:['Cáncer'],Mercurio:['Géminis','Virgo'],Venus:['Tauro','Libra'],Marte:['Aries','Escorpio'],Júpiter:['Sagitario','Piscis'],Saturno:['Capricornio','Acuario'],Urano:['Acuario'],Neptuno:['Piscis'],Plutón:['Escorpio']};
const EX={Sol:['Aries'],Luna:['Tauro'],Mercurio:['Virgo'],Venus:['Piscis'],Marte:['Capricornio'],Júpiter:['Cáncer'],Saturno:['Libra']};
const FALL={Sol:['Libra'],Luna:['Escorpio'],Mercurio:['Piscis'],Venus:['Virgo'],Marte:['Cáncer'],Júpiter:['Capricornio'],Saturno:['Aries']};
const opposite=s=>SIGNS[(SIGNS.indexOf(s)+6)%12];
const round=n=>Number(n.toFixed(6));
const sep=(a,b)=>{const d=Math.abs(Number(a)-Number(b))%360;return Math.min(d,360-d)};
function dignity(p){
 const name=p.name,sign=p.sign;if(!SIGNS.includes(sign))return {status:'unknown',criterion:'invalid_sign'};
 if(!DOM[name])return {status:'not_applicable',criterion:'traditional_seven_only_for_essential_dignity',scheme:'traditional_seven_v1'};
 const domicile=DOM[name].includes(sign),detriment=DOM[name].some(s=>opposite(s)===sign),exaltation=(EX[name]||[]).includes(sign),fall=(FALL[name]||[]).includes(sign);
 return {status:domicile?'domicile':exaltation?'exaltation':detriment?'detriment':fall?'fall':'neutral',domicile,exaltation,detriment,fall,criterion:'traditional_seven_sign_rulership_v1',note:'Modern outer-planet rulerships excluded from essential dignity; sign-level only'};
}
function motion(p,threshold=0.01){
 const v=p.speed;if(v==null||!Number.isFinite(Number(v)))return {status:'unknown',speed_deg_per_day:null,stationary:null,criterion:'requires_longitude_speed'};
 const speed=Number(v);
 return {status:Math.abs(speed)<=threshold?'stationary':speed<0?'retrograde':'direct',speed_deg_per_day:speed,stationary:Math.abs(speed)<=threshold,criterion:'absolute_ecliptic_longitude_speed_threshold',threshold_deg_per_day:threshold,note:'Fixed threshold is a screening rule, not a planet-specific astronomical station calculation'};
}
function pattern(points,aspects,kind,angle,edges,orbLimit){
 const candidates=points.filter(p=>Number.isFinite(p.longitude)&&p.name!=='Nodo Norte');
 const hits=[];const edge=(a,b)=>aspects.find(x=>[x.body_a,x.body_b].includes(a.name)&&[x.body_a,x.body_b].includes(b.name)&&x.body_a!==x.body_b&&Math.abs(Number(x.exact_angle)-angle)<0.001&&Number(x.orb)<=orbLimit);
 for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++)for(let k=j+1;k<candidates.length;k++){
 const tri=[candidates[i],candidates[j],candidates[k]],pairs=[[0,1],[0,2],[1,2]];
 const matched=edges.every(([a,b,target])=>{const x=tri[a],y=tri[b];return aspects.some(h=>[h.body_a,h.body_b].includes(x.name)&&[h.body_a,h.body_b].includes(y.name)&&h.body_a!==h.body_b&&Math.abs(Number(h.exact_angle)-target)<0.001&&Number(h.orb)<=orbLimit)});
 if(matched)hits.push({type:kind,participants:tri.map(p=>p.name),orbs:pairs.map(([a,b])=>({bodies:[tri[a].name,tri[b].name],separation:round(sep(tri[a].longitude,tri[b].longitude))})),criterion:'aspect_graph',orb_limit_deg:orbLimit,status:'detected'});
 }
 return hits;
}
function configurations(points,aspects){
 const p=points.filter(x=>Number.isFinite(x.longitude));
 const all=[
 ...pattern(p,aspects,'grand_trine',120,[[0,1,120],[0,2,120],[1,2,120]],6),
 ...pattern(p,aspects,'t_square',90,[[0,1,180],[0,2,90],[1,2,90]],6),
 ...pattern(p,aspects,'t_square',90,[[0,2,180],[0,1,90],[1,2,90]],6),
 ...pattern(p,aspects,'t_square',90,[[1,2,180],[0,1,90],[0,2,90]],6),
 ...pattern(p,aspects,'yod',150,[[0,1,60],[0,2,150],[1,2,150]],3),
 ...pattern(p,aspects,'yod',150,[[0,2,60],[0,1,150],[1,2,150]],3),
 ...pattern(p,aspects,'yod',150,[[1,2,60],[0,1,150],[0,2,150]],3)
 ];
 return {items:all,metadata:{status:'computed',profile:'fe33_graph_patterns_v1',supported:['grand_trine','t_square','yod'],orb_policy:'require_preexisting_detected_aspects_and_max_6deg_for_trine_square_opposition_3deg_for_yod',note:'Other patterns not evaluated; empty list means none detected among supported types'}};
}
function clusters(points){
 const ps=points.filter(p=>Number.isFinite(p.longitude)&&p.name!=='Nodo Norte');
 const out=[];for(const field of ['sign','house']){const groups=new Map();for(const p of ps){const key=String(p[field]??'');if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)}for(const [key,items] of groups)if(items.length>=3)out.push({type:field+'_concentration',value:field==='house'?Number(key):key,participants:items.map(p=>p.name),count:items.length,status:'detected',criterion:'at_least_three_points_same_'+field})}
 const ordered=ps.slice().sort((a,b)=>a.longitude-b.longitude);for(let i=0;i<ordered.length;i++){const window=Array.from({length:3},(_,j)=>ordered[(i+j)%ordered.length]);const span=(window[2].longitude-window[0].longitude+360)%360;if(span<=12){const ids=window.map(p=>p.name);if(!out.some(x=>x.type==='angular_cluster'&&ids.every(n=>x.participants.includes(n))))out.push({type:'angular_cluster',participants:ids,span_deg:round(span),signs:window.map(p=>p.sign),houses:window.map(p=>p.house),criterion:'three_consecutive_points_within_12_degrees',status:'detected'})}}
 return {items:out,metadata:{status:'computed',profile:'fe33_concentrations_v1',thresholds:{same_sign:3,same_house:3,angular_cluster_points:3,angular_cluster_span_deg:12},note:'Descriptive geometric groupings; not a psychological conclusion'}};
}
function enrich(core){
 if(!core||!Array.isArray(core.points)||!Array.isArray(core.aspects))throw new Error('NatalCore points and aspects required');
 const points=core.points.map(p=>({...p,essential_dignity:dignity(p),motion_state:motion(p)}));
 const patterns=configurations(points,core.aspects),groupings=clusters(points);
 return {...core,points,configurations:patterns.items,configurationMetadata:patterns.metadata,planetaryGroupings:groupings.items,groupingMetadata:groupings.metadata,ephemeris:{...core.ephemeris,engine_version:core.ephemeris?.engine_version||null,engine_version_status:core.ephemeris?.engine_version?'available':'not_reported_by_runtime',calculation_parameters:{...(core.ephemeris?.flags||{}),zodiac_system:core.ephemeris?.zodiac_system||null,house_system:core.ephemeris?.house_system||null}},fe33Metadata:{version:'1.0',status:'computed',dignity_criterion:'traditional_seven_sign_rulership_v1',motion_criterion:'absolute_speed_0.01_deg_per_day',pattern_criterion:patterns.metadata.profile,grouping_criterion:groupings.metadata.profile}};
}
return {enrich,dignity,motion,configurations,clusters};
});
