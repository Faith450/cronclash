const inputArray = JSON.parse(localStorage.getItem('inputArray')) || [];

let editingIndex = null;

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:  return `${day}st`;
    case 2:  return `${day}nd`;
    case 3:  return `${day}rd`;
    default: return `${day}th`;
  }
}

function formatCronToEnglish(cronString) {
  if (!cronString) return "At 12:00 AM every day";

  const parts = cronString.trim().split(/\s+/);
  if (parts.length < 5) return cronString;

  const minPart = parts[0];
  const hourPart = parts[1];
  const dayOfMonthPart = parts[2];
  const monthPart = parts[3];
  const dayOfWeekPart = parts[4];

  
  let timeString = "";
  if (minPart === '*' && hourPart === '*') {
    timeString = "every minute";
  } else {
    const minute = isNaN(parseInt(minPart)) ? 0 : parseInt(minPart);
    const hour24 = isNaN(parseInt(hourPart)) ? 0 : parseInt(hourPart);

    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const formattedMin = String(minute).padStart(2, '0');
    timeString = `At ${hour12}:${formattedMin} ${period}`;
  }

  const daysMap = {
    '0': 'Sunday', '1': 'Monday', '2': 'Tuesday',
    '3': 'Wednesday', '4': 'Thursday', '5': 'Friday',
    '6': 'Saturday', '7': 'Sunday'
  };

  const monthsMap = {
    '1': 'January', '2': 'February', '3': 'March', '4': 'April',
    '5': 'May', '6': 'June', '7': 'July', '8': 'August',
    '9': 'September', '10': 'October', '11': 'November', '12': 'December'
  };

  const hasDayOfMonth = dayOfMonthPart !== '*';
  const hasMonth = monthPart !== '*';
  const hasDayOfWeek = dayOfWeekPart !== '*' && daysMap[dayOfWeekPart];

  let dateContext = "";

  
  if (hasDayOfWeek && hasMonth && hasDayOfMonth) {
    const formattedDay = getOrdinalSuffix(parseInt(dayOfMonthPart));
    const monthName = monthsMap[monthPart] || `Month ${monthPart}`;
    dateContext = `, on ${daysMap[dayOfWeekPart]}, ${monthName} ${formattedDay}`;
  } 
  else if (hasDayOfWeek && hasMonth) {
    const monthName = monthsMap[monthPart] || `Month ${monthPart}`;
    dateContext = `, every ${daysMap[dayOfWeekPart]} in ${monthName}`;
  } 
  else if (hasMonth && hasDayOfMonth) {
    const formattedDay = getOrdinalSuffix(parseInt(dayOfMonthPart));
    const monthName = monthsMap[monthPart] || `Month ${monthPart}`;
    dateContext = `, on ${monthName} ${formattedDay}`;
  } 
  else if (hasDayOfWeek) {
    dateContext = `, every ${daysMap[dayOfWeekPart]}`;
  } 
  else if (hasDayOfMonth) {
    const formattedDay = getOrdinalSuffix(parseInt(dayOfMonthPart));
    dateContext = `, on the ${formattedDay} of the month`;
  } 
  else if (hasMonth) {
    const monthName = monthsMap[monthPart] || `Month ${monthPart}`;
    dateContext = `, every day in ${monthName}`;
  } 
  else {
    dateContext = " every day";
  }

  return `${timeString}${dateContext}`;
}

function getCronPercentage(cronString) {
  if (!cronString) return { percentage: 0, timeText: '00:00' };

  const parts = cronString.trim().split(/\s+/);

  const minute = isNaN(parseInt(parts[0])) ? 0 : parseInt(parts[0]);
  const hour = isNaN(parseInt(parts[1])) ? 0 : parseInt(parts[1]);

  const totalMinutes = (hour * 60) + minute;
  const percentage = ((totalMinutes / 1440) * 100).toFixed(2);

  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');

  return {
    percentage: percentage,
    timeText: `${formattedHour}:${formattedMinute}`
  };
}

function checkCollisions() {
  const alertCard = document.getElementById('collision-alert-card');
  const alertTitle = document.getElementById('collision-alert-title');
  const statusDot = document.getElementById('collision-status-dot');
  const alertMessage = document.getElementById('collision-alert-message');

  if (!alertCard || !alertTitle || !statusDot || !alertMessage) return;

  const cronMap = {};

  inputArray.forEach(input => {
    const cron = input.cron.trim();
    cronMap[cron] = cronMap[cron] || [];
    cronMap[cron].push(input.task);
  });

  const collisions = [];
  Object.entries(cronMap).forEach(([cron, tasks]) => {
    if (tasks.length > 1) {
      collisions.push({ cron, tasks });
    }
  });

  if (collisions.length > 0) {
    alertCard.className = "rounded-xl bg-red-500/10 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-800/50 transition-colors";
    statusDot.className = "h-2 w-2 rounded-full bg-red-500 animate-pulse";
    alertTitle.className = "text-red-700 dark:text-red-400 font-medium text-sm flex items-center gap-2";
    alertTitle.innerHTML = `<span id="collision-status-dot" class="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span> Warning: ${collisions.length} Collision(s) Detected`;

    const details = collisions.map(c => {
      const formattedTime = formatCronToEnglish(c.cron);
      return `<strong>${c.tasks.join(' & ')}</strong> (${formattedTime})`;
    }).join('; ');

    alertMessage.className = "text-red-600/90 dark:text-zinc-400 text-xs mt-1";
    alertMessage.innerHTML = `Overlapping schedules: ${details}`;
  } else {
    alertCard.className = "rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800/50 transition-colors";
    statusDot.className = "h-2 w-2 rounded-full bg-emerald-500";
    alertTitle.className = "text-emerald-700 dark:text-emerald-400 font-medium text-sm flex items-center gap-2";
    alertTitle.innerHTML = `<span id="collision-status-dot" class="h-2 w-2 rounded-full bg-emerald-500"></span> Status: No Collisions Detected`;
    alertMessage.className = "text-emerald-800/80 dark:text-zinc-400 text-xs mt-1";
    alertMessage.textContent = "All tasks are staggered cleanly across the selected timeframe.";
  }
}

function addInput() {
  const text = document.querySelector('.input-text');
  const cron = document.querySelector('.input-cron');

  const textInput = text.value.trim();
  const cronInput = cron.value.trim();

  text.classList.remove('border-red-500', 'placeholder-red-400');
  cron.classList.remove('border-red-500', 'placeholder-red-400');

  let isValid = true;

  if (!textInput) {
    text.classList.add('border-red-500', 'placeholder-red-400');
    text.placeholder = 'Task name is required!';
    isValid = false;
  }

  if (!cronInput) {
    cron.classList.add('border-red-500', 'placeholder-red-400');
    cron.placeholder = 'Cron syntax required!';
    isValid = false;
  }

  if (!isValid) return;

  const taskData = {
    task: textInput,
    cron: cronInput
  };

  if (editingIndex !== null) {
    inputArray[editingIndex] = taskData;
    editingIndex = null;
  } else {
    inputArray.push(taskData);
  }

  displayInput();

  text.value = '';
  cron.value = '';
  text.placeholder = 'e.g., Run Database Backup';
  cron.placeholder = 'e.g., 0 12 * * *';
}

document.querySelector('.input-text')?.addEventListener('input', e => {
  e.target.classList.remove('border-red-500', 'placeholder-red-400');
});

document.querySelector('.input-cron')?.addEventListener('input', e => {
  e.target.classList.remove('border-red-500', 'placeholder-red-400');
});

const form = document.querySelector('form');
form.addEventListener('submit', event => {
  event.preventDefault();
  addInput();
});

const inputList = document.querySelector('.input-list');
const taskTracksList = document.querySelector('.task-tracks-list');

const trackColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500'
];

function displayInput() {
  localStorage.setItem('inputArray', JSON.stringify(inputArray));

  if (inputArray.length === 0) {
    inputList.innerHTML = `
      <div class="flex items-center justify-center p-8 text-slate-400 dark:text-zinc-600 text-sm italic">
        No tasks scheduled yet. Add one above!
      </div>
    `;
    if (taskTracksList) {
      taskTracksList.innerHTML = `
        <div class="text-xs text-slate-400 dark:text-zinc-500 italic p-2 text-center">
          No scheduled tracks to plot.
        </div>
      `;
    }
    checkCollisions();
    return;
  }

  inputList.innerHTML = '';
  if (taskTracksList) taskTracksList.innerHTML = '';

  inputArray.forEach((input, index) => {
    const { percentage, timeText } = getCronPercentage(input.cron);
    const englishDescription = formatCronToEnglish(input.cron);
    
    const badgeColor = trackColors[index % trackColors.length];

    
    const numPercent = parseFloat(percentage);
    let alignmentClass = "-translate-x-1/2";
    if (numPercent <= 5) {
      alignmentClass = "translate-x-0";
    } else if (numPercent >= 95) {
      alignmentClass = "-translate-x-full";
    }

    inputList.innerHTML += `    
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2.5 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-slate-800 dark:text-zinc-200 text-sm truncate max-w-[150px] sm:max-w-[180px]" title="${input.task}">
              ${input.task}
            </span>
            <span class="inline-block bg-slate-200/80 dark:bg-zinc-800 text-blue-700 dark:text-blue-400 font-mono text-xs px-2 py-0.5 rounded border border-slate-300/60 dark:border-zinc-700/50 shrink-0">
              ${input.cron}
            </span>
          </div>
          <span class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 flex-1 min-w-0" title="${englishDescription}">
            ${englishDescription}
          </span>
        </div>

        <div class="shrink-0 flex items-center justify-end gap-1.5">
          <!-- Edit Button -->
          <button data-index="${index}" class="edit-button h-8 w-8 flex items-center justify-center rounded-lg bg-slate-200/70 hover:bg-blue-500/10 dark:bg-zinc-800 dark:hover:bg-blue-500/20 text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors" title="Edit task">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>

          <!-- Delete Button -->
          <button data-index="${index}" class="delete-button h-8 w-8 flex items-center justify-center rounded-lg bg-slate-200/70 hover:bg-red-500/10 dark:bg-zinc-800 dark:hover:bg-red-500/20 text-slate-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors" title="Delete task">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
              <line x1="8" x2="16" y1="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    if (taskTracksList) {
      taskTracksList.innerHTML += `
        <li class="flex items-center gap-4 py-1">
          <div class="w-24 sm:w-28 shrink-0 truncate">
            <span class="text-slate-700 dark:text-zinc-200 text-sm font-medium truncate block" title="${input.task}">${input.task}</span>
          </div>
          <div class="relative flex-1 h-7 bg-slate-200/80 dark:bg-zinc-800 rounded-lg border border-slate-300/80 dark:border-zinc-700/80 p-0.5">
            <span 
              class="absolute top-1/2 -translate-y-1/2 ${badgeColor} text-white text-xs px-2 py-0.5 rounded-md font-mono shadow-sm transition-all ${alignmentClass} whitespace-nowrap"
              style="left: ${percentage}%;"
              aria-label="Scheduled at ${timeText}"
            >
              ${timeText}
            </span>
          </div>
        </li>
      `;
    }
  });

  checkCollisions();
}

displayInput();

inputList.addEventListener('click', event => {
  const deleteButton = event.target.closest('.delete-button');
  const editButton = event.target.closest('.edit-button');

  if (deleteButton) {
    const index = parseInt(deleteButton.dataset.index);

    if (editingIndex === index) {
      editingIndex = null;
      document.querySelector('.input-text').value = '';
      document.querySelector('.input-cron').value = '';
    }

    inputArray.splice(index, 1);
    displayInput();
  }

  if (editButton) {
    const index = parseInt(editButton.dataset.index);
    const taskToEdit = inputArray[index];

    document.querySelector('.input-text').value = taskToEdit.task;
    document.querySelector('.input-cron').value = taskToEdit.cron;

    editingIndex = index;
    document.querySelector('.input-text').focus();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && editingIndex !== null) {
    editingIndex = null;
    const text = document.querySelector('.input-text');
    const cron = document.querySelector('.input-cron');
    text.value = '';
    cron.value = '';
    text.blur();
    cron.blur();
  }
});
