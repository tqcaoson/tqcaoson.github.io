/* ============================================================
   PSM I Practice Exam — app.js
   State, storage, exam flow, scoring, explanations
   ============================================================ */

const STORAGE_KEY = "psm1_exam_state_v1";
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

let EXAMS = null;        // loaded from data.js (window.PSM1_DATA)
let state = null;        // overall persisted state across exams (session only)
let currentExamId = null;
let currentExam = null;  // working copy: { id, title, durationMinutes (or null), passPercent (or null), questions: [...] }
let runtime = null;      // { answers: {qid: [idx,...]}, current: 0, secondsLeft, timerHandle, paused, submitted, showExplain:Set, timed:bool }

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------- Bootstrapping ---------------- */

async function init() {
  EXAMS = window.PSM1_DATA;
  loadState();
  renderHome();
}

function defaultState() {
  return {
    exams: {
      exam1: { status: "new", current: 0, answers: {}, secondsLeft: null, lastScore: null },
      exam2: { status: "new", current: 0, answers: {}, secondsLeft: null, lastScore: null },
      exam3: { status: "new", current: 0, answers: {}, secondsLeft: null, lastScore: null },
      mini:  { status: "new", current: 0, answers: {}, secondsLeft: null, lastScore: null },
    }
  };
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : defaultState();
  } catch (e) {
    state = defaultState();
  }
  const def = defaultState();
  for (const k of Object.keys(def.exams)) {
    if (!state.exams[k]) state.exams[k] = def.exams[k];
  }
}

function saveState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore quota errors */ }
}

/* ---------------- Home screen ---------------- */

function renderHome() {
  stopTimer();
  currentExamId = null;
  currentExam = null;
  runtime = null;

  const totalQuestions = EXAMS.allQuestions ? EXAMS.allQuestions.length : 250;

  const app = $("#app");
  app.innerHTML = `
    <div class="topbar">
      <div class="brand">
        <span class="mark">PSM I</span>
        <div>
          <h1>Luyện đề Scrum Master I</h1>
          <div class="sub">${totalQuestions} câu · 4 đề thi thử · luyện tự do · chấm điểm tự động</div>
        </div>
      </div>
    </div>
    <p class="intro">
      Bộ câu hỏi luyện thi Professional Scrum Master I (PSM I), chia thành
      3 đề chính (80 câu/đề, 60 phút) và 1 đề mini (10 câu) để kiểm tra nhanh.
      Đạt từ <strong>85%</strong> trở lên để pass. Bạn có thể tạm ngưng bài làm bất cứ lúc nào
      (lưu ý: tiến trình sẽ mất nếu đóng tab hoặc tải lại trang).
    </p>
    <div class="exam-grid" id="examGrid"></div>

    <div class="review-list-title">Luyện tập tự do (không tính giờ)</div>
    <div class="exam-grid" id="practiceGrid"></div>

    <div class="app-footer">PSM I Practice · dữ liệu tham khảo, không phải đề thi chính thức của Scrum.org</div>
  `;

  const grid = $("#examGrid");
  const order = ["exam1", "exam2", "exam3", "mini"];
  for (const id of order) {
    const exam = EXAMS[id];
    const st = state.exams[id];
    const card = document.createElement("div");
    card.className = "exam-card";

    let pillHtml = `<span class="status-pill new">Chưa làm</span>`;
    if (st.status === "in_progress") {
      pillHtml = `<span class="status-pill progress">Đang làm</span>`;
    } else if (st.status === "completed") {
      const passed = st.lastScore && st.lastScore.percent >= exam.passPercent;
      pillHtml = passed
        ? `<span class="status-pill pass">✓ Pass · ${st.lastScore.percent}%</span>`
        : `<span class="status-pill fail">✕ Fail · ${st.lastScore.percent}%</span>`;
    }

    const answeredCount = Object.keys(st.answers || {}).length;
    const tag = id === "mini" ? "MINI TEST" : "ĐỀ ĐẦY ĐỦ";

    card.innerHTML = `
      <span class="tag">${tag}</span>
      <h2>${exam.title}</h2>
      <div class="meta">
        <span>${exam.questions.length} câu</span>
        <span>${exam.durationMinutes} phút</span>
        <span>Pass ≥ ${exam.passPercent}%</span>
      </div>
      <div class="progress-row">${pillHtml} ${st.status === "in_progress" ? `<span>· ${answeredCount}/${exam.questions.length} đã trả lời</span>` : ""}</div>
      <div class="actions">
        ${st.status === "in_progress"
          ? `<button class="btn btn-primary btn-block" data-action="resume" data-id="${id}">Tiếp tục làm bài</button>`
          : `<button class="btn btn-primary btn-block" data-action="start" data-id="${id}">${st.status === "completed" ? "Làm lại" : "Bắt đầu"}</button>`
        }
      </div>
      ${st.status === "completed" ? `<button class="btn btn-ghost btn-sm" data-action="review-last" data-id="${id}">Xem lại kết quả gần nhất</button>` : ""}
    `;
    grid.appendChild(card);
  }
  grid.addEventListener("click", onHomeClick);

  const pgrid = $("#practiceGrid");

  const rangeCard = document.createElement("div");
  rangeCard.className = "exam-card";
  rangeCard.innerHTML = `
    <span class="tag">THEO KHOẢNG CÂU</span>
    <h2>Chọn 10 câu liên tiếp</h2>
    <div class="meta"><span>Nhập câu bắt đầu</span><span>Không tính giờ</span></div>
    <label style="font-size:12.5px; color:var(--ink-soft); font-family:var(--mono); margin-top:4px;">
      Câu bắt đầu (1 – ${totalQuestions - 9})
    </label>
    <input type="number" id="rangeStartInput" min="1" max="${totalQuestions - 9}" value="1"
      style="font-family:var(--mono); font-size:15px; padding:8px 10px; border:1.5px solid var(--line); border-radius:7px; background:#fff;" />
    <div class="actions">
      <button class="btn btn-primary btn-block" id="btnStartRange">Bắt đầu (10 câu)</button>
    </div>
  `;
  pgrid.appendChild(rangeCard);

  const randomCard = document.createElement("div");
  randomCard.className = "exam-card";
  randomCard.innerHTML = `
    <span class="tag">NGẪU NHIÊN</span>
    <h2>10 câu ngẫu nhiên</h2>
    <div class="meta"><span>Rút ngẫu nhiên từ ${totalQuestions} câu</span><span>Không tính giờ</span></div>
    <p class="intro" style="margin: 4px 0 0; font-size:13px;">Mỗi lần bấm "Bắt đầu" sẽ random lại một bộ 10 câu khác.</p>
    <div class="actions">
      <button class="btn btn-primary btn-block" id="btnStartRandom">Bắt đầu (10 câu)</button>
    </div>
  `;
  pgrid.appendChild(randomCard);

  $("#btnStartRange").addEventListener("click", () => {
    const input = $("#rangeStartInput");
    let startNum = parseInt(input.value, 10);
    if (isNaN(startNum)) startNum = 1;
    startNum = Math.max(1, Math.min(totalQuestions - 9, startNum));
    startRangePractice(startNum);
  });

  $("#btnStartRandom").addEventListener("click", () => {
    startRandomPractice();
  });
}

function onHomeClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "start") {
    startExam(id, true);
  } else if (action === "resume") {
    startExam(id, false);
  } else if (action === "review-last") {
    startExam(id, false, true);
  }
}

/* ---------------- Practice modes: range & random (untimed, score-only) ---------------- */

function startRangePractice(startNum) {
  const all = EXAMS.allQuestions;
  const startIdx = startNum - 1;
  const slice = all.slice(startIdx, startIdx + 10);

  currentExamId = "practice";
  currentExam = {
    id: "practice-range",
    title: `Luyện tập: Câu ${startNum} - ${startNum + slice.length - 1}`,
    durationMinutes: null,
    passPercent: null,
    questions: JSON.parse(JSON.stringify(slice)),
  };

  beginPracticeRuntime();
}

function startRandomPractice() {
  const all = EXAMS.allQuestions.slice();
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = all[i];
    all[i] = all[j];
    all[j] = tmp;
  }
  const slice = all.slice(0, 10);

  currentExamId = "practice";
  currentExam = {
    id: "practice-random",
    title: `Luyện tập: 10 câu ngẫu nhiên`,
    durationMinutes: null,
    passPercent: null,
    questions: JSON.parse(JSON.stringify(slice)),
  };

  beginPracticeRuntime();
}

function beginPracticeRuntime() {
  runtime = {
    answers: {},
    current: 0,
    secondsLeft: null,
    timerHandle: null,
    paused: false,
    submitted: false,
    showExplain: new Set(),
    reviewOnly: false,
    timed: false,
  };
  renderExamRunner();
}

/* ---------------- Exam lifecycle (timed exams) ---------------- */

function startExam(id, fresh, reviewOnly = false) {
  currentExamId = id;
  const src = EXAMS[id];
  currentExam = JSON.parse(JSON.stringify(src));

  const st = state.exams[id];

  if (fresh) {
    st.status = "in_progress";
    st.current = 0;
    st.answers = {};
    st.secondsLeft = currentExam.durationMinutes * 60;
    saveState();
  }

  runtime = {
    answers: JSON.parse(JSON.stringify(st.answers || {})),
    current: st.current || 0,
    secondsLeft: (st.secondsLeft != null) ? st.secondsLeft : currentExam.durationMinutes * 60,
    timerHandle: null,
    paused: false,
    submitted: reviewOnly && st.status === "completed",
    showExplain: new Set(),
    reviewOnly: !!reviewOnly,
    timed: true,
  };

  if (runtime.submitted) {
    renderResults(scoreExam());
  } else {
    renderExamRunner();
    startTimer();
  }
}

function persistRuntimeToState() {
  if (!currentExamId || currentExamId === "practice") return;
  const st = state.exams[currentExamId];
  st.current = runtime.current;
  st.answers = runtime.answers;
  st.secondsLeft = runtime.secondsLeft;
  if (st.status !== "completed") st.status = "in_progress";
  saveState();
}

/* ---------------- Timer ---------------- */

function startTimer() {
  stopTimer();
  if (!runtime.timed) return;
  runtime.timerHandle = setInterval(() => {
    if (runtime.paused || runtime.submitted) return;
    runtime.secondsLeft -= 1;
    updateTimerDisplay();
    persistRuntimeToState();
    if (runtime.secondsLeft <= 0) {
      runtime.secondsLeft = 0;
      stopTimer();
      submitExam(true);
    }
  }, 1000);
}

function stopTimer() {
  if (runtime && runtime.timerHandle) {
    clearInterval(runtime.timerHandle);
    runtime.timerHandle = null;
  }
}

function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  const el = $("#timerDisplay");
  if (!el) return;
  el.textContent = fmtTime(Math.max(0, runtime.secondsLeft));
  el.classList.toggle("low", runtime.secondsLeft <= 60 && runtime.secondsLeft > 0);
  el.classList.toggle("paused", runtime.paused);
}

/* ---------------- Exam runner UI ---------------- */

function renderExamRunner() {
  const app = $("#app");
  const total = currentExam.questions.length;
  const isTimed = !!runtime.timed;

  const metaLine = isTimed
    ? `${total} câu · ${currentExam.durationMinutes} phút · Pass ≥ ${currentExam.passPercent}%`
    : `${total} câu · luyện tập tự do · không tính giờ`;

  const timerHtml = isTimed
    ? `<div class="timer" id="timerDisplay">${fmtTime(runtime.secondsLeft)}</div>`
    : `<div class="timer" id="timerDisplay" style="font-size:14px;">Tự do</div>`;

  app.innerHTML = `
    <div class="topbar">
      <div class="brand">
        <span class="mark">PSM I</span>
        <div>
          <h1>${currentExam.title}</h1>
          <div class="sub">${metaLine}</div>
        </div>
      </div>
      <div class="topbar-actions">
        ${isTimed ? `<button class="btn btn-ghost btn-sm" id="btnPause">⏸ Tạm ngưng</button>` : ""}
        <button class="btn btn-ghost btn-sm" id="btnExit">Về danh sách</button>
      </div>
    </div>

    <div class="exam-header">
      <div class="exam-title-block">
        <h2 id="qPositionTitle"></h2>
        <div class="progress-text" id="answeredText"></div>
      </div>
      ${timerHtml}
    </div>

    <div class="progress-bar-track"><div class="progress-bar-fill" id="progressFill"></div></div>

    <div class="qnav" id="qNav"></div>

    <div id="qCardHolder"></div>

    <div class="nav-controls">
      <button class="btn btn-ghost" id="btnPrev">← Câu trước</button>
      <div class="right">
        <button class="btn btn-ghost" id="btnNext">Câu sau →</button>
        <button class="btn btn-primary" id="btnSubmit">Nộp bài</button>
      </div>
    </div>
  `;

  if (isTimed) $("#btnPause").addEventListener("click", pauseExam);
  $("#btnExit").addEventListener("click", () => {
    persistRuntimeToState();
    renderHome();
  });
  $("#btnPrev").addEventListener("click", () => gotoQuestion(runtime.current - 1));
  $("#btnNext").addEventListener("click", () => gotoQuestion(runtime.current + 1));
  $("#btnSubmit").addEventListener("click", () => confirmSubmit());

  renderQNav();
  renderQuestion();
  if (isTimed) updateTimerDisplay();
}

function renderQNav() {
  const nav = $("#qNav");
  if (!nav) return;
  nav.innerHTML = "";
  currentExam.questions.forEach((q, idx) => {
    const b = document.createElement("button");
    b.textContent = String(idx + 1);
    if (idx === runtime.current) b.classList.add("current");
    if (runtime.answers[q.id] && runtime.answers[q.id].length) b.classList.add("answered");
    b.addEventListener("click", () => gotoQuestion(idx));
    nav.appendChild(b);
  });
}

function gotoQuestion(idx) {
  const total = currentExam.questions.length;
  if (idx < 0 || idx >= total) return;
  runtime.current = idx;
  persistRuntimeToState();
  renderQNav();
  renderQuestion();
}

function renderQuestion() {
  const total = currentExam.questions.length;
  const idx = runtime.current;
  const q = currentExam.questions[idx];

  $("#qPositionTitle").textContent = `Câu ${idx + 1} / ${total}`;
  const answeredCount = Object.keys(runtime.answers).length;
  $("#answeredText").textContent = `Đã trả lời: ${answeredCount}/${total}`;
  $("#progressFill").style.width = `${((idx + 1) / total) * 100}%`;

  $("#btnPrev").disabled = idx === 0;
  $("#btnNext").disabled = idx === total - 1;

  const holder = $("#qCardHolder");
  holder.innerHTML = buildQuestionCardHtml(q, idx);

  $$(".option", holder).forEach((opt) => {
    opt.addEventListener("click", () => toggleOption(q, Number(opt.dataset.idx)));
  });

  const toggleBtn = $(".explain-toggle", holder);
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (runtime.showExplain.has(q.id)) runtime.showExplain.delete(q.id);
      else runtime.showExplain.add(q.id);
      renderQuestion();
    });
  }
}

function buildQuestionCardHtml(q, idx) {
  const selected = runtime.answers[q.id] || [];
  const multiTag = q.multi ? `<span class="hint-multi">Chọn nhiều đáp án</span>` : "";
  const showExp = runtime.showExplain.has(q.id);

  const optionsHtml = q.options.map((opt, i) => {
    const isSelected = selected.includes(i);
    return `
      <div class="option ${isSelected ? "selected" : ""}" data-idx="${i}">
        <span class="box">${isSelected ? "✓" : ""}</span>
        <span>${escapeHtml(opt)}</span>
      </div>
    `;
  }).join("");

  return `
    <div class="qcard">
      <div class="qnum">Câu ${idx + 1} ${multiTag}</div>
      <p class="qtext">${escapeHtml(q.question)}</p>
      <div class="options">${optionsHtml}</div>
      <div class="qfooter">
        <button class="explain-toggle">${showExp ? "Ẩn đáp án & giải thích" : "Xem đáp án & giải thích"}</button>
      </div>
      <div class="explain-box ${showExp ? "show" : ""}">
        ${buildExplainBoxInnerHtml(q)}
      </div>
    </div>
  `;
}

/**
 * Builds the inner content of the explanation box, shared between
 * exam-runner mode and review mode. Structure:
 *   1) Dịch câu hỏi (Vietnamese translation of the question)
 *   2) Đáp án đúng (correct answer letter(s) + text)
 *   3) Giải thích (explanation)
 */
function buildExplainBoxInnerHtml(q) {
  const correctLabels = q.correct.map(i => LETTERS[i] || String(i + 1));
  const correctLines = q.correct.map(i => {
    const letter = LETTERS[i] || String(i + 1);
    return `<div class="correct-line"><strong>${letter}.</strong> ${escapeHtml(q.options[i])}</div>`;
  }).join("");

  return `
    <div class="explain-section">
      <div class="label">Dịch câu hỏi</div>
      <p class="vi-question">${escapeHtml(q.question_vi || "")}</p>
    </div>
    <div class="explain-section">
      <div class="label answer-label">Đáp án đúng: ${correctLabels.join(", ")}</div>
      <div class="correct-answers-block">${correctLines}</div>
    </div>
    <div class="explain-section">
      <div class="label">Giải thích</div>
      <p>${escapeHtml(q.explanation_vi)}</p>
    </div>
  `;
}

function toggleOption(q, optIdx) {
  const list = runtime.answers[q.id] ? [...runtime.answers[q.id]] : [];
  const pos = list.indexOf(optIdx);

  if (q.multi) {
    if (pos >= 0) list.splice(pos, 1);
    else list.push(optIdx);
  } else {
    list.length = 0;
    list.push(optIdx);
  }

  if (list.length === 0) delete runtime.answers[q.id];
  else runtime.answers[q.id] = list;

  persistRuntimeToState();
  renderQNav();
  renderQuestion();
}

/* ---------------- Pause ---------------- */

function pauseExam() {
  runtime.paused = true;
  updateTimerDisplay();
  const overlay = document.createElement("div");
  overlay.className = "pause-overlay";
  overlay.id = "pauseOverlay";
  overlay.innerHTML = `
    <div class="pause-card">
      <h3>⏸ Đã tạm ngưng</h3>
      <p>Đồng hồ đã dừng lại. Nhấn tiếp tục khi bạn sẵn sàng làm tiếp.
      Lưu ý: nếu đóng tab hoặc tải lại trang, tiến trình bài làm sẽ bị mất.</p>
      <button class="btn btn-primary btn-block" id="btnResumeFromPause">Tiếp tục làm bài</button>
    </div>
  `;
  document.body.appendChild(overlay);
  $("#btnResumeFromPause").addEventListener("click", () => {
    runtime.paused = false;
    overlay.remove();
    updateTimerDisplay();
  });
}

/* ---------------- Submit & scoring ---------------- */

function confirmSubmit() {
  const total = currentExam.questions.length;
  const answeredCount = Object.keys(runtime.answers).length;
  const unanswered = total - answeredCount;
  let msg = "Bạn có chắc muốn nộp bài không?";
  if (unanswered > 0) {
    msg = `Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`;
  }
  if (window.confirm(msg)) {
    submitExam(false);
  }
}

function submitExam(timeUp) {
  stopTimer();
  runtime.submitted = true;
  const score = scoreExam();

  if (currentExamId !== "practice") {
    const st = state.exams[currentExamId];
    st.status = "completed";
    st.lastScore = score;
    st.current = runtime.current;
    st.answers = runtime.answers;
    st.secondsLeft = 0;
    saveState();
  }

  renderResults(score, timeUp);
}

function scoreExam() {
  const questions = currentExam.questions;
  let correctCount = 0;
  const perQuestion = [];

  for (const q of questions) {
    const selected = (runtime.answers[q.id] || []).slice().sort();
    const correct = q.correct.slice().sort();
    const isCorrect = selected.length === correct.length && selected.every((v, i) => v === correct[i]);
    if (isCorrect) correctCount++;
    perQuestion.push({ q, selected, isCorrect, answered: selected.length > 0 });
  }

  const total = questions.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0;
  const passed = currentExam.passPercent != null ? percent >= currentExam.passPercent : null;

  return {
    correctCount,
    total,
    percent,
    passed,
    perQuestion,
  };
}

/* ---------------- Results UI ---------------- */

function renderResults(score, timeUp = false) {
  const app = $("#app");
  const unanswered = score.total - score.perQuestion.filter(p => p.answered).length;
  const wrong = score.total - score.correctCount - unanswered;
  const isPractice = currentExamId === "practice";

  let heroHtml;
  if (isPractice) {
    heroHtml = `
      <div class="result-hero">
        <div class="verdict" style="background:var(--paper-2); color:var(--ink-soft);">KẾT QUẢ LUYỆN TẬP</div>
        <div class="score-num" style="color:var(--ink);">${score.percent}%</div>
        <div class="detail-line">${score.correctCount} / ${score.total} câu đúng</div>
      </div>
    `;
  } else {
    heroHtml = `
      <div class="result-hero ${score.passed ? "pass" : "fail"}">
        <div class="verdict">${score.passed ? "✓ PASS" : "✕ FAIL"}</div>
        <div class="score-num">${score.percent}%</div>
        <div class="detail-line">${score.correctCount} / ${score.total} câu đúng · ngưỡng pass ${currentExam.passPercent}%</div>
      </div>
    `;
  }

  app.innerHTML = `
    <div class="topbar">
      <div class="brand">
        <span class="mark">PSM I</span>
        <div>
          <h1>${currentExam.title}</h1>
          <div class="sub">Kết quả bài làm</div>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-ghost btn-sm" id="btnHome">Về danh sách</button>
      </div>
    </div>

    ${timeUp ? `<p style="color:var(--red); font-family:var(--mono); font-size:13px; margin-bottom:14px;">⏱ Hết thời gian — bài làm đã được tự động nộp.</p>` : ""}

    ${heroHtml}

    <div class="result-stats">
      <div class="stat-box"><div class="n" style="color:var(--scrum-green-dark)">${score.correctCount}</div><div class="l">Đúng</div></div>
      <div class="stat-box"><div class="n" style="color:var(--red)">${wrong}</div><div class="l">Sai</div></div>
      <div class="stat-box"><div class="n" style="color:var(--ink-soft)">${unanswered}</div><div class="l">Chưa làm</div></div>
      <div class="stat-box"><div class="n">${score.total}</div><div class="l">Tổng số câu</div></div>
    </div>

    <div class="result-actions">
      ${isPractice
        ? `<button class="btn btn-primary" id="btnRetryPractice">Luyện bộ khác</button>`
        : `<button class="btn btn-primary" id="btnRetry">Làm lại đề này</button>`
      }
      <button class="btn btn-ghost" id="btnHome2">Về danh sách đề</button>
    </div>

    <div class="review-list-title">Xem lại từng câu</div>
    <div id="reviewList"></div>
  `;

  $("#btnHome").addEventListener("click", renderHome);
  $("#btnHome2").addEventListener("click", renderHome);
  if (isPractice) {
    $("#btnRetryPractice").addEventListener("click", renderHome);
  } else {
    $("#btnRetry").addEventListener("click", () => startExam(currentExamId, true));
  }

  const list = $("#reviewList");
  score.perQuestion.forEach((item, idx) => {
    list.appendChild(buildReviewCard(item, idx));
  });
}

function buildReviewCard(item, idx) {
  const { q, selected, isCorrect } = item;
  const wrapper = document.createElement("div");
  wrapper.className = "qcard reviewed";

  const multiTag = q.multi ? `<span class="hint-multi">Chọn nhiều đáp án</span>` : "";
  const statusTag = isCorrect
    ? `<span class="status-pill pass">Đúng</span>`
    : (selected.length === 0 ? `<span class="status-pill new">Chưa làm</span>` : `<span class="status-pill fail">Sai</span>`);

  const optionsHtml = q.options.map((opt, i) => {
    const wasSelected = selected.includes(i);
    const isCorrectOpt = q.correct.includes(i);
    let cls = "option";
    if (isCorrectOpt) cls += " correct-answer";
    if (wasSelected && !isCorrectOpt) cls += " wrong-selected";
    const mark = isCorrectOpt ? "✓" : (wasSelected ? "✕" : "");
    return `
      <div class="${cls}">
        <span class="box">${mark}</span>
        <span>${escapeHtml(opt)}</span>
      </div>
    `;
  }).join("");

  wrapper.innerHTML = `
    <div class="qnum">Câu ${idx + 1} ${multiTag} ${statusTag}</div>
    <p class="qtext">${escapeHtml(q.question)}</p>
    <div class="options">${optionsHtml}</div>
    <div class="qfooter">
      <button class="explain-toggle">Xem giải thích</button>
    </div>
    <div class="explain-box">
      ${buildExplainBoxInnerHtml(q)}
    </div>
  `;

  const btn = $(".explain-toggle", wrapper);
  const box = $(".explain-box", wrapper);
  btn.addEventListener("click", () => {
    const showing = box.classList.toggle("show");
    btn.textContent = showing ? "Ẩn giải thích" : "Xem giải thích";
  });

  return wrapper;
}

/* ---------------- Utils ---------------- */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.addEventListener("DOMContentLoaded", init);
