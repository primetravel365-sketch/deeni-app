// Install approved original MP3 recordings from a user-uploaded ZIP in repo root.
// Fixed entry names and SHA-256 values prevent archive traversal or accidental substitution.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const archive='islamiyat-approved-fajr-audio-package.zip';
const recordings=[
 {entry:'android/app/src/main/res/raw/ali_ahmad_mulla_hq.mp3',sha256:'2eeda3f5d3677d53ed8fae7ec3d51e066d0be60a6e0f4d4bdd7aa739afb9ac0e'},
 {entry:'android/app/src/main/res/raw/fajr_khayr_min_al_nawm.mp3',sha256:'7a5a48be4e18935ecf4b2817e8009a0028fc54dab38d15aabea516bcf20c27c5'}
];
function hash(b){return crypto.createHash('sha256').update(b).digest('hex')}
if(!fs.existsSync(archive)){
  console.log('::warning::Approved Fajr audio ZIP not present in repository; build is AUDIO-INCOMPLETE. Upload '+archive+' at repo root.');
  for(const {entry} of recordings){
    if(fs.existsSync(entry)) console.log('Existing packaged voice '+entry);
    else console.log('Missing approved bundled voice '+entry);
  }
}else{
  for(const {entry,sha256} of recordings){
    const bytes=cp.execFileSync('unzip',['-p',archive,entry],{maxBuffer:7*1024*1024});
    if(hash(bytes)!==sha256)throw Error('Approved voice checksum mismatch: '+entry);
    const dir=path.dirname(entry);fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(entry,bytes);
    console.log('Verified and installed approved voice: '+entry);
  }
}
