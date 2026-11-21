// CI inspection of the actual large HTML, original UI routes, and audio catalog.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const original=fs.readFileSync('www/index.html','utf8');
const candidates=['وصول سريع','السلام عليكم','دعاء اليوم','رمضان يجمعنا','حي على الصلاة','برايم','الصلاة خير من النوم','Ali_Ibn_Ahmad_Mala_HQ','muezzin','scheduleFullAzan','qibla','radio','geolocation','dark'];
const logs=[];
for(const word of candidates){
 let at=0,hits=0,examples=[];
 while((at=original.toLowerCase().indexOf(word.toLowerCase(),at))!==-1){
  hits++;if(examples.length<2){let str=original.slice(Math.max(0,at-115),Math.min(original.length,at+word.length+140));examples.push(str.replace(/[\r\n\t]+/g,' ').slice(0,260))}
  at+=word.length;
 }
 logs.push({word,hits,examples});
}
const dirs=['android/app/src/main/res/raw','www/sounds/muezzins'];
const sounds=[];
for(const d of dirs)if(fs.existsSync(d))for(const file of fs.readdirSync(d).filter(x=>/\.(mp3|wav)$/i.test(x))){
 const data=fs.readFileSync(path.join(d,file));
 sounds.push({path:path.join(d,file),size:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
const duplicates=Object.values(Object.groupBy?Object.groupBy(sounds,x=>x.sha256):sounds.reduce((a,x)=>{(a[x.sha256]??=[]).push(x);return a},{})).filter(x=>x.length>1).map(x=>x.map(v=>v.path));
for(const name of ['islamiyat-enhancements.js','islamiyat-ui-review.js','islamiyat-content-review.js']){
 const tag='<script defer src="'+name+'"></script>';if(original.split(tag).length!==2)throw Error('Expected exactly one linked module: '+name);
}
if(!original.includes('scheduleFullAzan'))throw Error('Native adhan scheduling anchor not found');
const report={chars:original.length,features:logs,sounds,duplicates,missingRequested:['Ali_Ibn_Ahmad_Mala_HQ.mp3','Abdul_Majid_Al_Surehi_1.mp3'].filter(n=>!sounds.some(s=>s.path.endsWith('/'+n)))};
fs.mkdirSync('build-reports',{recursive:true});fs.writeFileSync('build-reports/integration-audit.json',JSON.stringify(report,null,2));
console.log('Original UI feature occurrence summary');
for(const x of logs)console.log(x.word+': '+x.hits+' '+x.examples.map(s=>s.replace(/::/g,':')).join(' :: '));
console.log('Audio recordings '+sounds.length+' duplicate file groups '+duplicates.length+' missing approved filenames '+report.missingRequested.join(', '));
