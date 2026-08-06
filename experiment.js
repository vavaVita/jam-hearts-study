const app = document.querySelector("#study-app");
const ACTIVE_KEY = "jh-study-active";
const RESULTS_KEY = "jh-study-results";

const tasks = [
  { prompt: "Student membership costs:", options: ["$12", "$18", "$35", "$58"], correct: "$18" },
  { prompt: "Visitor parking is:", options: ["Behind the east building", "South lot", "Front entrance", "Street parking"], correct: "Behind the east building" },
  { prompt: "The accessibility email is:", options: ["hello@jamhearts.org", "programs@jamhearts.org", "access@jamhearts.org", "events@jamhearts.org"], correct: "access@jamhearts.org" }
];

const recall = [
  { prompt: "Which day is Jam Hearts closed?", options: ["Sunday", "Monday", "Tuesday", "Saturday"], correct: "Monday" },
  { prompt: "Which room hosts Photography Foundations?", options: ["Studio 3", "North Gallery", "Library Studio", "Clay Studio"], correct: "Studio 3" },
  { prompt: "What is the name of the sculpture exhibition?", options: ["Summer Voices", "Forms in Motion", "Evening in Color", "Color and Clay"], correct: "Forms in Motion" }
];

const survey = [
  "The website was easy to navigate.",
  "I always knew where to click next.",
  "Finding information required little effort.",
  "The website felt organized.",
  "I would feel comfortable using this website again."
];

let session = null;

function participantId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, value => chars[value % chars.length]).join("");
}

function saveActive() {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function progress(current, total) {
  return `<div class="progress" aria-label="Study progress">${Array.from(
    { length: total },
    (_, index) => `<span class="${index <= current ? "on" : ""}"></span>`
  ).join("")}</div>`;
}

function showConsent() {
  app.innerHTML = `
    <div class="center-shell">
      <section class="study-card">
        <p class="eyebrow">About 5 minutes</p>
        <h1>Jam Hearts Website Study</h1>
        <p>In this study, youâ€™ll be asked to complete three quick information-finding tasks, three memory questions, and then rate your experience. Your participation is entirely voluntary. This study will collect no names, emails, login information, or personal data. You may stop at any time by simply closing the page.</p>
        <p><strong>Disclaimer:</strong> Use a laptop and complete the tasks all in one sitting.</p>
        <label class="consent-box">
          <input id="consent" type="checkbox">
          <span>I am at least 18 years old, I have read the information above, and I agree to participate.</span>
        </label>
        <div class="study-instructions">
          <strong>How it works</strong>
          <p>Each task will appear at the top of the page. Navigate the website below it to find the answer, select your answer, and continue to the next task.</p>
        </div>
        <button id="begin" class="primary" disabled>Begin Study</button>
      </section>
    </div>`;
  const consent = document.querySelector("#consent");
  const begin = document.querySelector("#begin");
  consent.addEventListener("change", () => {
    begin.disabled = !consent.checked;
  });
  begin.addEventListener("click", beginStudy);
}

function beginStudy() {
  session = {
    participantId: participantId(),
    condition: Math.random() < 0.5 ? "A" : "B",
    ageConfirmed: true,
    startedAtMs: Date.now(),
    taskAnswers: [],
    recallAnswers: [],
    surveyRatings: []
  };
  saveActive();
  showTask(0);
}

function optionsHtml(name, options) {
  return options.map(option => `
    <label class="choice">
      <input type="radio" name="${name}" value="${escapeHtml(option)}">
      <span>${escapeHtml(option)}</span>
    </label>`).join("");
}

function showTask(index) {
  const task = tasks[index];
  app.innerHTML = `
    <div class="task-shell">
      <header class="task-bar">
        <div class="task-copy">
          <p class="eyebrow">Task ${index + 1} of ${tasks.length}</p>
          <h1>${escapeHtml(task.prompt)}</h1>
        </div>
        <div>
          <div class="choices">${optionsHtml(`task-${index}`, task.options)}</div>
          <div class="task-actions"><button id="task-next" class="primary">${index === tasks.length - 1 ? "Finish Tasks" : "Next Task"}</button></div>
        </div>
      </header>
      <iframe class="site-frame" title="Jam Hearts website, Condition ${session.condition}" src="${session.condition.toLowerCase()}/index.html"></iframe>
    </div>`;
  document.querySelector("#task-next").addEventListener("click", () => {
    const selected = document.querySelector(`input[name="task-${index}"]:checked`);
    if (!selected) return;
    session.taskAnswers[index] = { answer: selected.value, correct: selected.value === task.correct };
    saveActive();
    if (index + 1 < tasks.length) showTask(index + 1);
    else showRecall();
  });
}

function showRecall() {
  app.innerHTML = `
    <div class="center-shell">
      <section class="study-card">
        ${progress(1, 3)}
        <p class="eyebrow">Memory questions</p>
        <h1>What do you remember?</h1>
        <p>Please answer from memory without returning to the website.</p>
        <form id="recall-form">
          <div class="form-grid">
            ${recall.map((question, index) => `
              <fieldset class="question">
                <legend>${index + 1}. ${escapeHtml(question.prompt)}</legend>
                <div class="choices">${optionsHtml(`recall-${index}`, question.options)}</div>
              </fieldset>`).join("")}
          </div>
          <p id="recall-error" class="error"></p>
          <button class="primary" type="submit">Continue to Survey</button>
        </form>
      </section>
    </div>`;
  document.querySelector("#recall-form").addEventListener("submit", event => {
    event.preventDefault();
    const answers = recall.map((question, index) => {
      const selected = document.querySelector(`input[name="recall-${index}"]:checked`);
      return selected ? { answer: selected.value, correct: selected.value === question.correct } : null;
    });
    if (answers.some(answer => !answer)) {
      document.querySelector("#recall-error").textContent = "Please answer all three questions.";
      return;
    }
    session.recallAnswers = answers;
    saveActive();
    showSurvey();
  });
}

function scaleHtml(index) {
  return `
    <div class="scale">
      ${Array.from({ length: 7 }, (_, i) => `
        <label><input type="radio" name="survey-${index}" value="${i + 1}"><span>${i + 1}</span></label>`).join("")}
    </div>
    <div class="scale-notes"><span>Strongly disagree</span><span>Strongly agree</span></div>`;
}

function showSurvey() {
  app.innerHTML = `
    <div class="center-shell">
      <section class="study-card">
        ${progress(2, 3)}
        <p class="eyebrow">Final step</p>
        <h1>Rate your experience</h1>
        <p>Select one response for each statement.</p>
        <form id="survey-form">
          <div class="form-grid">
            ${survey.map((question, index) => `
              <fieldset class="question">
                <legend>${escapeHtml(question)}</legend>
                ${scaleHtml(index)}
              </fieldset>`).join("")}
          </div>
          <p id="survey-error" class="error"></p>
          <button id="submit-study" class="primary" type="submit">Submit Study</button>
        </form>
      </section>
    </div>`;
  document.querySelector("#survey-form").addEventListener("submit", finishStudy);
}

async function finishStudy(event) {
  event.preventDefault();
  const ratings = survey.map((_, index) => {
    const selected = document.querySelector(`input[name="survey-${index}"]:checked`);
    return selected ? Number(selected.value) : null;
  });
  if (ratings.some(rating => rating === null)) {
    document.querySelector("#survey-error").textContent = "Please rate all five statements.";
    return;
  }
  const button = document.querySelector("#submit-study");
  button.disabled = true;
  button.textContent = "Savingâ€¦";
  const result = {
    participantId: session.participantId,
    condition: session.condition,
    ageConfirmed: session.ageConfirmed,
    taskAnswers: {
      membership: session.taskAnswers[0].answer,
      parking: session.taskAnswers[1].answer,
      accessibility: session.taskAnswers[2].answer
    },
    taskCorrect: {
      membership: session.taskAnswers[0].correct,
      parking: session.taskAnswers[1].correct,
      accessibility: session.taskAnswers[2].correct
    },
    recallAnswers: {
      closedDay: session.recallAnswers[0].answer,
      photographyRoom: session.recallAnswers[1].answer,
      exhibitionName: session.recallAnswers[2].answer
    },
    recallScore: session.recallAnswers.filter(answer => answer.correct).length,
    uxRatings: {
      easyToNavigate: ratings[0],
      knewWhereToClick: ratings[1],
      requiredLittleEffort: ratings[2],
      organized: ratings[3],
      comfortableUsingAgain: ratings[4]
    },
    totalTimeSeconds: Math.max(0.1, Math.round((Date.now() - session.startedAtMs) / 100) / 10)
  };
  const saveMode = await saveResult(result);
  session = { ...result, saveMode };
  localStorage.removeItem(ACTIVE_KEY);
  showThanks();
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])) } };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  return { stringValue: String(value) };
}

async function saveResult(result) {
  const config = window.JH_STUDY_CONFIG || {};
  if (config.firebaseProjectId && config.firebaseApiKey) {
    const documentName = `projects/${config.firebaseProjectId}/databases/(default)/documents/responses/${result.participantId}`;
    const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.firebaseProjectId)}/databases/(default)/documents:commit?key=${encodeURIComponent(config.firebaseApiKey)}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writes: [{
            update: {
              name: documentName,
              fields: Object.fromEntries(Object.entries(result).map(([key, value]) => [key, firestoreValue(value)]))
            },
            updateTransforms: [{
              fieldPath: "completedAt",
              setToServerValue: "REQUEST_TIME"
            }],
            currentDocument: { exists: false }
          }]
        })
      });
      if (response.ok) return "firebase";
    } catch (_) {
      // Local fallback prevents data loss during a temporary network failure.
    }
  }
  const stored = JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]");
  stored.push(result);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(stored));
  return "local";
}

function showThanks() {
  app.innerHTML = `
    <div class="center-shell">
      <section class="study-card">
        <div class="thank-mark">âœ“</div>
        <p class="eyebrow">Complete</p>
        <h1>Thank you for participating!</h1>
        <p>${session.saveMode === "firebase"
          ? "Your response has been recorded. You may now close this window."
          : "Your response could not be sent. Please keep this page open and tell the researcher."}</p>
        <p>This study is part of an independent high school research project examining how interface organization and visual design influence usersâ€™ navigation and memory. Your anonymous responses will help me analyze how design decisions affect the user experience.</p>
        <div class="meta">
          <span>Participant ${escapeHtml(session.participantId)}</span>
          <span>Completion time ${escapeHtml(session.totalTimeSeconds)} seconds</span>
        </div>
      </section>
    </div>`;
}

showConsent();

