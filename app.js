// Data Stores
let musters = JSON.parse(localStorage.getItem('nrega_musters')) || [];
let workers = JSON.parse(localStorage.getItem('nrega_workers')) || [];
let attendanceStore = JSON.parse(localStorage.getItem('nrega_attendance')) || [];

let activeMusterId = musters.length > 0 ? musters[0].id : '';

// Temporary selection store before clicking SAVE button
let tempAttendance = {};
let isEditMode = false;

document.getElementById('dateInput').valueAsDate = new Date();

function init() {
  populateMusterDropdown();
  renderAttendance();
  renderSummary();
}

function saveData() {
  localStorage.setItem('nrega_musters', JSON.stringify(musters));
  localStorage.setItem('nrega_workers', JSON.stringify(workers));
  localStorage.setItem('nrega_attendance', JSON.stringify(attendanceStore));
}

// Populate Dropdown
function populateMusterDropdown() {
  const select = document.getElementById('musterSelect');
  select.innerHTML = '';

  if (musters.length === 0) {
    select.innerHTML = '<option value="">Koi Muster Nahi Hai</option>';
    return;
  }

  musters.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.innerText = `Muster #${m.id} (${m.days} Din)`;
    if (m.id === activeMusterId) opt.selected = true;
    select.appendChild(opt);
  });
}

function changeMuster(val) {
  activeMusterId = val;
  tempAttendance = {};
  isEditMode = false;
  renderAttendance();
  renderSummary();
}

// Tab Switcher
function switchTab(tabName) {
  document.getElementById('tabAttendance').classList.add('hidden');
  document.getElementById('tabSummary').classList.add('hidden');
  document.getElementById('tabAddWorker').classList.add('hidden');

  document.getElementById('btnTabAttendance').className = 'flex-1 py-2 text-xs font-bold rounded bg-gray-200 text-gray-700';
  document.getElementById('btnTabSummary').className = 'flex-1 py-2 text-xs font-bold rounded bg-gray-200 text-gray-700';
  document.getElementById('btnTabAddWorker').className = 'py-2 px-3 text-xs font-bold rounded bg-gray-200 text-gray-700';

  if (tabName === 'attendance') {
    document.getElementById('tabAttendance').classList.remove('hidden');
    document.getElementById('btnTabAttendance').className = 'flex-1 py-2 text-xs font-bold rounded bg-blue-600 text-white';
    renderAttendance();
  } else if (tabName === 'summary') {
    document.getElementById('tabSummary').classList.remove('hidden');
    document.getElementById('btnTabSummary').className = 'flex-1 py-2 text-xs font-bold rounded bg-blue-600 text-white';
    renderSummary();
  } else if (tabName === 'addWorker') {
    document.getElementById('tabAddWorker').classList.remove('hidden');
    document.getElementById('btnTabAddWorker').className = 'py-2 px-3 text-xs font-bold rounded bg-green-600 text-white';
  }
}

// Create Muster Roll
function handleCreateMuster(e) {
  e.preventDefault();
  const id = document.getElementById('newMusterNo').value.trim();
  const days = Number(document.getElementById('newMusterDays').value) || 14;

  if (!id) return;

  musters.push({ id, days, rate: 0 });
  activeMusterId = id;
  saveData();
  populateMusterDropdown();
  document.getElementById('newMusterNo').value = '';
  switchTab('attendance');
}

// Add Worker
function handleAddWorker(e) {
  e.preventDefault();
  const name = document.getElementById('newWorkerName').value.trim();
  const jobCard = document.getElementById('newJobCard').value.trim();

  if (!name) return;

  workers.push({ id: 'W_' + Date.now(), name, jobCard });
  saveData();
  document.getElementById('newWorkerName').value = '';
  document.getElementById('newJobCard').value = '';
  alert('Worker Add Ho Gaya!');
  renderAttendance();
}

// Delete Worker Option
function deleteWorker(workerId, workerName) {
  if (confirm(`Kya aap "${workerName}" ko delete karna chahte hain?`)) {
    workers = workers.filter(w => w.id !== workerId);
    attendanceStore = attendanceStore.filter(a => a.workerId !== workerId);
    delete tempAttendance[workerId];
    saveData();
    renderAttendance();
    renderSummary();
  }
}

// Enable Edit Mode
function enableEditMode() {
  isEditMode = true;
  renderAttendance();
}

// Render Daily Attendance Screen
function renderAttendance() {
  const date = document.getElementById('dateInput').value;
  const listContainer = document.getElementById('workersAttendanceList');
  const saveBox = document.getElementById('saveAttendanceBox');
  listContainer.innerHTML = '';

  if (workers.length === 0 || !activeMusterId) {
    listContainer.innerHTML = '<div class="text-center text-xs text-gray-500 py-6">Pehle + Worker/Muster tab me jaakar Worker/Muster add karein.</div>';
    saveBox.classList.add('hidden');
    return;
  }

  // Check if attendance for this date is ALREADY SAVED
  const isAlreadySaved = attendanceStore.some(a => a.date === date && a.musterId === activeMusterId);

  // Load temp states
  workers.forEach(w => {
    if (!tempAttendance[w.id] || !isEditMode) {
      const savedRecord = attendanceStore.find(a => a.date === date && a.musterId === activeMusterId && a.workerId === w.id);
      tempAttendance[w.id] = savedRecord ? savedRecord.status : 'ABSENT';
    }
  });

  // Header Banner if already saved
  if (isAlreadySaved && !isEditMode) {
    const statusBanner = document.createElement('div');
    statusBanner.className = 'bg-green-100 border border-green-400 text-green-800 p-2.5 rounded-lg text-xs font-bold flex justify-between items-center mb-2';
    statusBanner.innerHTML = `
      <span>✅ Is tareekh ki haazri saved hai.</span>
      <button onclick="enableEditMode()" class="bg-green-700 text-white px-2.5 py-1 rounded text-[11px]">✏️ Edit Karein</button>
    `;
    listContainer.appendChild(statusBanner);
  }

  workers.forEach(w => {
    const status = tempAttendance[w.id];

    const card = document.createElement('div');
    card.className = 'bg-white p-3 rounded-lg shadow-sm border space-y-2';
    
    // Disable buttons if already saved & not in edit mode
    const isDisabled = isAlreadySaved && !isEditMode ? 'opacity-60 pointer-events-none' : '';

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div class="font-bold text-sm">${w.name}</div>
          <div class="text-xs text-gray-400">${w.jobCard}</div>
        </div>
        <button onclick="deleteWorker('${w.id}', '${w.name}')" class="text-red-500 text-xs hover:bg-red-50 p-1 rounded font-bold" title="Delete Worker">🗑️ Delete</button>
      </div>
      <div class="grid grid-cols-3 gap-2 ${isDisabled}">
        <button type="button" onclick="selectTempAttendance('${w.id}', 'REAL')" class="py-1.5 text-xs font-bold rounded ${status === 'REAL' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}">🟢 Real Work</button>
        <button type="button" onclick="selectTempAttendance('${w.id}', 'DUMMY')" class="py-1.5 text-xs font-bold rounded ${status === 'DUMMY' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}">🔵 Only Haazri</button>
        <button type="button" onclick="selectTempAttendance('${w.id}', 'ABSENT')" class="py-1.5 text-xs font-bold rounded ${status === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}">🔴 Absent</button>
      </div>
    `;
    listContainer.appendChild(card);
  });

  // Save button logic
  if (isAlreadySaved && !isEditMode) {
    saveBox.classList.add('hidden');
  } else {
    saveBox.classList.remove('hidden');
  }
}

// Temporary select status on button click
function selectTempAttendance(workerId, status) {
  tempAttendance[workerId] = status;
  renderAttendance();
}

// FINAL SAVE ACTION
function saveDailyAttendance() {
  const date = document.getElementById('dateInput').value;

  workers.forEach(w => {
    const status = tempAttendance[w.id] || 'ABSENT';

    // Remove old record for this date & worker (prevents duplicates)
    attendanceStore = attendanceStore.filter(a => !(a.date === date && a.musterId === activeMusterId && a.workerId === w.id));

    // Store new record
    attendanceStore.push({ date, musterId: activeMusterId, workerId: w.id, status });
  });

  isEditMode = false;
  saveData();
  alert(`✅ Tareekh ${date} ki attendance save ho gayi!`);
  renderAttendance();
  renderSummary();
}

// Update Rate at Muster End
function updateMusterRate(newRate) {
  const muster = musters.find(m => m.id === activeMusterId);
  if (muster) {
    muster.rate = Number(newRate) || 0;
    saveData();
    renderSummary();
  }
}

// Render Summary & Hisaab
function renderSummary() {
  const activeMuster = musters.find(m => m.id === activeMusterId);
  const currentRate = activeMuster ? activeMuster.rate : 0;
  const totalMusterDays = activeMuster ? activeMuster.days : 14;

  const summaryHeader = document.getElementById('summaryMusterHeader');
  
  if (!activeMuster) {
    summaryHeader.innerHTML = '<div class="text-xs text-gray-500">Koi Active Muster Nahi Hai</div>';
    document.getElementById('workersSummaryList').innerHTML = '';
    document.getElementById('grandTotalBox').innerHTML = '';
    return;
  }

  summaryHeader.innerHTML = `
    <div class="flex justify-between items-center">
      <div>
        <div class="text-sm font-extrabold text-blue-900">Muster #${activeMuster.id}</div>
        <div class="text-[11px] text-gray-600">Total Muster Time: <b>${totalMusterDays} Days</b></div>
      </div>
      <div class="text-right">
        <label class="block text-[10px] font-bold text-gray-700">Per Day Rate (₹):</label>
        <input type="number" value="${currentRate}" onchange="updateMusterRate(this.value)" class="w-20 border rounded p-1 text-xs font-bold text-right bg-white" placeholder="0">
      </div>
    </div>
  `;

  const listContainer = document.getElementById('workersSummaryList');
  listContainer.innerHTML = '';

  let grandGovt = 0, grandWorker = 0, grandYour = 0;

  workers.forEach(w => {
    const records = attendanceStore.filter(a => a.musterId === activeMusterId && a.workerId === w.id);
    const realDays = records.filter(r => r.status === 'REAL').length;
    const dummyDays = records.filter(r => r.status === 'DUMMY').length;
    const totalHaazri = realDays + dummyDays;

    const totalGovt = totalHaazri * currentRate;
    const workerShare = realDays * currentRate;
    const yourShare = dummyDays * currentRate;

    grandGovt += totalGovt;
    grandWorker += workerShare;
    grandYour += yourShare;

    const card = document.createElement('div');
    card.className = 'bg-white p-3 rounded-lg shadow-sm border text-xs space-y-2';
    card.innerHTML = `
      <div class="font-bold text-sm border-b pb-1">${w.name} <span class="text-[10px] text-gray-400 font-normal">(${w.jobCard})</span></div>
      <div class="grid grid-cols-3 text-center bg-gray-50 p-1.5 rounded">
        <div><span class="block text-gray-400">Real Work</span><span class="font-bold text-green-700">${realDays} Din</span></div>
        <div><span class="block text-gray-400">Dummy</span><span class="font-bold text-blue-700">${dummyDays} Din</span></div>
        <div><span class="block text-gray-400">Total Muster</span><span class="font-bold">${totalHaazri} Din</span></div>
      </div>
      <div class="space-y-1 pt-1">
        <div class="flex justify-between"><span class="text-gray-500">Muster Total Payment:</span><span class="font-bold">₹${totalGovt}</span></div>
        <div class="flex justify-between text-green-700"><span>Worker Ko Dena Hai:</span><span class="font-bold">₹${workerShare}</span></div>
        <div class="flex justify-between text-blue-700 font-bold border-t pt-1"><span>Aapka Share:</span><span>₹${yourShare}</span></div>
      </div>
    `;
    listContainer.appendChild(card);
  });

  document.getElementById('grandTotalBox').innerHTML = `
    <div class="text-xs font-bold border-b border-gray-600 pb-1">Muster #${activeMusterId} Final Hisaab</div>
    <div class="flex justify-between text-xs"><span>Total Govt Payment Aayegi:</span><span class="font-bold text-yellow-400">₹${grandGovt}</span></div>
    <div class="flex justify-between text-xs"><span>Majdooron Ko Dena Hai:</span><span class="font-bold text-green-400">₹${grandWorker}</span></div>
    <div class="flex justify-between text-sm font-bold border-t border-gray-600 pt-1"><span>Aapka Total Profit:</span><span class="text-blue-400">₹${grandYour}</span></div>
  `;
}

init();