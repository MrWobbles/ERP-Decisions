// question-generator.js
// Loads pairs from JSON files in /json folder
// Manages per-file question state in localStorage

(function(window){
  const KEY_SEED_BASE = 'qa_seed_v1';
  const KEY_REMAIN_BASE = 'qa_remain_v1';

  let pairs = [];
  let currentFile = null;

  function totalCombinations(){ 
    return pairs.length; 
  }

  // Seeded PRNG
  function mulberry32(a){
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function getSeed(){
    if(!currentFile) return 1;
    const key = KEY_SEED_BASE + ':' + currentFile;
    let s = localStorage.getItem(key);
    if(s) return Number(s);
    const seed = Math.floor(Math.random() * 0x7fffffff);
    localStorage.setItem(key, String(seed));
    return seed;
  }

  function ensureRemaining(){
    if(!currentFile) return [];
    const key = KEY_REMAIN_BASE + ':' + currentFile;
    const r = localStorage.getItem(key);
    if(r) return JSON.parse(r);
    
    const seed = getSeed();
    const rand = mulberry32(seed >>> 0);
    const arr = Array.from({length: totalCombinations()}, (_, i) => i);
    
    // Fisher-Yates shuffle
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(rand() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    
    localStorage.setItem(key, JSON.stringify(arr));
    return arr;
  }

  function saveRemaining(arr){
    if(!currentFile) return;
    const key = KEY_REMAIN_BASE + ':' + currentFile;
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function getRemainingCount(filename){
    if(!filename) return 0;
    const key = KEY_REMAIN_BASE + ':' + filename;
    const r = localStorage.getItem(key);
    if(!r) return 0;
    try {
      const arr = JSON.parse(r);
      return Array.isArray(arr) ? arr.length : 0;
    } catch(e){
      return 0;
    }
  }

  // Load file using XMLHttpRequest for file:// protocol support
  function loadFile(filename){
    if(!filename) return Promise.reject(new Error('No filename provided'));
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `json/${filename}`, true);
      xhr.onload = function(){
        if(xhr.status === 200 || xhr.status === 0){
          try {
            const data = JSON.parse(xhr.responseText);
            if(!Array.isArray(data) && typeof data === 'object' && data.pairs){
              // Handle {pairs: [...]} format
              pairs = data.pairs.map(item => {
                if(Array.isArray(item) && item.length >= 2) 
                  return [String(item[0]), String(item[1])];
                return ['A', 'B'];
              });
            } else if(Array.isArray(data)){
              pairs = data.map(item => {
                if(Array.isArray(item) && item.length >= 2) 
                  return [String(item[0]), String(item[1])];
                return ['A', 'B'];
              });
            } else {
              throw new Error('Expected array or {pairs: [...]}');
            }
            currentFile = filename;
            resolve({total: totalCombinations(), filename});
          } catch(e){
            reject(e);
          }
        } else {
          reject(new Error(`Failed to load ${filename}: ${xhr.status}`));
        }
      };
      xhr.onerror = function(){
        reject(new Error(`Network error loading ${filename}`));
      };
      xhr.send();
    });
  }

  function getNextQuestion(){
    if(!currentFile) return {done:true, text: 'No file loaded.'};
    const remaining = ensureRemaining();
    if(!remaining || remaining.length === 0){
      return {done:true, text: 'All questions answered.'};
    }
    const idx = remaining.pop();
    saveRemaining(remaining);
    const pair = pairs[idx];
    return {
      done:false, 
      text: `${pair[0]} or ${pair[1]}?`,
      options: pair,
      index: idx,
      remaining: remaining.length
    };
  }

  function resetHistory(){
    if(!currentFile) return;
    const key = KEY_REMAIN_BASE + ':' + currentFile;
    localStorage.removeItem(key);
  }

  // API call to delete a pair from the JSON file (server-side)
  function deletePairFromFile(pairIndex){
    if(!currentFile) return Promise.reject(new Error('No file loaded'));
    try {
      return fetch('api/delete-pair', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filename: currentFile, index: pairIndex})
      }).then(res => {
        if(!res.ok) console.warn('Delete failed:', res.status);
        return res.ok;
      }).catch(e => {
        console.warn('Delete error:', e);
        return false;
      });
    } catch(e){
      console.warn('Delete error:', e);
      return Promise.resolve(false);
    }
  }

  window.QAQuestionGenerator = {
    loadFile,
    getNextQuestion,
    resetHistory,
    deletePairFromFile,
    totalCombinations,
    getRemainingCount,
    _currentFile: () => currentFile
  };

})(window);
