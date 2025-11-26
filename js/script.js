document.addEventListener('DOMContentLoaded',function(){
  // set year
  const year = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = year;

  // theme toggle
  const btn = document.getElementById('theme-toggle');
  btn?.addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    const pressed = document.body.classList.contains('dark');
    btn.setAttribute('aria-pressed', String(pressed));
  });

  // contact form - simple client-side feedback
  const form = document.getElementById('contact-form');
  const result = document.getElementById('form-result');
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name')?.toString() || 'friend';
    // simulate send
    result.textContent = `Thanks, ${name}! Your message was received (demo).`;
    form.reset();
  });

  // Question generator wiring
  const qArea = document.getElementById('question-area');
  const fileSelect = document.getElementById('file-select');
  const loadFileBtn = document.getElementById('load-file');
  const nextBtn = document.getElementById('next-question');
  const resetBtn = document.getElementById('reset-history');
  const progress = document.getElementById('progress');
  const qaControls = document.getElementById('qa-controls');
  const qaForm = document.getElementById('qa-form');
  const choice0 = document.getElementById('choice0');
  const choice1 = document.getElementById('choice1');
  const choice0Label = document.getElementById('choice0-label');
  const choice1Label = document.getElementById('choice1-label');
  const countdownEl = document.getElementById('countdown');
  // session timer controls
  const sessionInput = document.getElementById('session-minutes');
  const sessionRemainingEl = document.getElementById('session-remaining');

  let currentQuestionIndex = null; // track index for deletion

  // populate file selector from manifest
  async function populateFileSelect(){
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'json/manifest.json', false); // synchronous for simplicity
      xhr.send();
      if(xhr.status === 200 || xhr.status === 0){
        const manifest = JSON.parse(xhr.responseText);
        fileSelect.innerHTML = '<option value="">Select a File</option>' + 
          manifest.map(item => {
            // Support both new format {name, file} and old format (string)
            if(typeof item === 'object' && item.name && item.file){
              return `<option value="${item.file}">${item.name}</option>`;
            } else {
              return `<option value="${item}">${item}</option>`;
            }
          }).join('');
      } else {
        throw new Error('Failed to load manifest');
      }
    } catch(e){
      console.error('Error loading manifest:', e);
      // Fallback to hardcoded list
      const files = ['pairs-1.json', 'pairs-2.json', 'pairs-3.json', 'pairs-4.json', 'pairs-5.json'];
      fileSelect.innerHTML = '<option value="">Select a File</option>' + 
        files.map(f => `<option value="${f}">${f}</option>`).join('');
    }
  }

  // Update progress when file selection changes
  async function updateProgressForSelectedFile(){
    if(!fileSelect || !progress) return;
    const selectedFile = fileSelect.value;
    if(!selectedFile){
      progress.textContent = '';
      return;
    }
    // Get remaining count from localStorage for selected file
    const remaining = QAQuestionGenerator.getRemainingCount(selectedFile);
    if(remaining > 0){
      progress.textContent = `Remaining: ${remaining}`;
    } else {
      // If no localStorage data, we need to load the file to get the total
      // This happens when file hasn't been loaded yet or all questions answered
      try {
        const tempFile = QAQuestionGenerator._currentFile();
        await QAQuestionGenerator.loadFile(selectedFile);
        const total = QAQuestionGenerator.totalCombinations();
        progress.textContent = `Available: ${total}`;
        // Restore previous file if it was different
        if(tempFile && tempFile !== selectedFile){
          await QAQuestionGenerator.loadFile(tempFile);
        }
      } catch(e){
        progress.textContent = 'Error loading file';
      }
    }
  }

  function updateProgress(remainingCount){
    if(!progress || typeof QAQuestionGenerator === 'undefined') return;
    // If remainingCount is provided, use it; otherwise get total from generator
    if(typeof remainingCount === 'number'){
      progress.textContent = `Remaining: ${remainingCount}`;
    } else {
      const total = QAQuestionGenerator.totalCombinations();
      progress.textContent = `Total: ${total}`;
    }
  }

  let timer = null;
  let timeLeft = 0;
  const TIME_LIMIT = 5;
  let sessionTimer = null;
  let sessionMsLeft = 0;
  let sessionActive = false;
  let questionsAnswered = 0;

  function clearTimer(){
    if(timer) { clearInterval(timer); timer = null; }
    if(countdownEl) countdownEl.textContent = '';
  }

  function clearSessionTimer(){
    if(sessionTimer){ clearInterval(sessionTimer); sessionTimer = null; }
    if(sessionRemainingEl) sessionRemainingEl.textContent = '';
    sessionActive = false;
  }

  function showResultsModal(){
    const modal = document.getElementById('results-modal');
    const count = document.getElementById('results-count');
    if(modal && count){
      count.textContent = questionsAnswered;
      modal.style.display = 'flex';
    }
  }

  function closeResultsModal(){
    const modal = document.getElementById('results-modal');
    if(modal) modal.style.display = 'none';
  }

  function startSessionTimerFromInput(){
    const mins = Number(sessionInput?.value || 0);
    if(!mins || mins <= 0) return false;
    clearSessionTimer();
    questionsAnswered = 0; // reset counter at session start
    sessionMsLeft = Math.floor(mins * 60 * 1000);
    const start = Date.now();
    const end = start + sessionMsLeft;
    sessionActive = true;
    if(sessionRemainingEl) sessionRemainingEl.textContent = `${mins}:00`;
    sessionTimer = setInterval(()=>{
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      sessionMsLeft = remaining;
      const rm = Math.floor(remaining / 60000);
      const rs = Math.floor((remaining % 60000) / 1000);
      if(sessionRemainingEl) sessionRemainingEl.textContent = `${rm}:${String(rs).padStart(2,'0')}`;
      if(remaining <= 0){
        // time up: clear UI then show results (don't reset localStorage)
        clearSessionTimer();
        clearTimer();
        showControls(false);
        if(qArea) qArea.textContent = 'Session ended.';
        updateProgress();
        // Show modal after a brief delay to ensure reset completes
        setTimeout(showResultsModal, 100);
      }
    }, 250);
    return true;
  }

  function showControls(show){
    if(!qaControls) return;
    qaControls.style.display = show ? 'flex' : 'none';
  }

  async function presentNext(){
    if(!qArea || typeof QAQuestionGenerator === 'undefined'){
      if(qArea) qArea.textContent = 'Generator not loaded.';
      return;
    }
    const res = QAQuestionGenerator.getNextQuestion();
    if(res.done){
      qArea.textContent = res.text;
      showControls(false);
      return;
    }
    currentQuestionIndex = res.index; // save for deletion
    qArea.textContent = res.text;
    const [a, b] = res.options || [];
    if(choice0Label) choice0Label.textContent = a || 'A';
    if(choice1Label) choice1Label.textContent = b || 'B';
    if(choice0) choice0.checked = false;
    if(choice1) choice1.checked = false;
    showControls(true);
    updateProgress(res.remaining); // Pass the actual remaining count
    
    clearTimer();
    timeLeft = TIME_LIMIT;
    if(countdownEl) countdownEl.textContent = `Time: ${timeLeft}s`;
    timer = setInterval(()=>{
      timeLeft -= 1;
      if(timeLeft <= 0){
        clearTimer();
        // timeout = skip; delete and advance
        QAQuestionGenerator.deletePairFromFile(currentQuestionIndex);
        presentNext();
        return;
      }
      if(countdownEl) countdownEl.textContent = `Time: ${timeLeft}s`;
    }, 1000);
  }

  // Load file button
  loadFileBtn?.addEventListener('click', async ()=>{
    if(!qArea) return;
    const file = fileSelect.value;
    if(!file){
      qArea.textContent = 'Please select a file.';
      return;
    }
    try {
      await QAQuestionGenerator.loadFile(file);
      // Don't reset history - let localStorage track asked questions
      qArea.textContent = `Loaded ${file}. Press "Next question" to begin.`;
      showControls(false);
      updateProgress();
    } catch(e){
      qArea.textContent = `Error: ${e.message}`;
      console.error(e);
    }
  });

  // Next button (start questions and session timer if configured)
  nextBtn?.addEventListener('click', ()=>{
    if(!sessionActive){
      // attempt to start session timer if user provided minutes
      startSessionTimerFromInput();
    }
    presentNext();
  });

  // Auto-answer when radio button is clicked
  const handleRadioChange = ()=>{
    if(!qArea) return;
    clearTimer();
    const selected = document.querySelector('input[name="choice"]:checked');
    const selText = selected?.nextElementSibling?.textContent || 'No selection';
    qArea.textContent = `You selected: ${selText}`;
    questionsAnswered++; // increment counter
    // delete from file (fire and forget) and advance immediately
    QAQuestionGenerator.deletePairFromFile(currentQuestionIndex).catch(() => {});
    setTimeout(presentNext, 600);
  };
  choice0?.addEventListener('change', handleRadioChange);
  choice1?.addEventListener('change', handleRadioChange);

  // Modal close button
  const closeModalBtn = document.getElementById('close-modal');
  closeModalBtn?.addEventListener('click', closeResultsModal);

  // Reset
  resetBtn?.addEventListener('click', ()=>{
    if(typeof QAQuestionGenerator === 'undefined') return;
    QAQuestionGenerator.resetHistory();
    clearTimer();
    showControls(false);
    if(qArea) qArea.textContent = 'History reset.';
    updateProgress();
  });

  populateFileSelect();
  
  // Listen for file selection changes
  fileSelect?.addEventListener('change', updateProgressForSelectedFile);
});
