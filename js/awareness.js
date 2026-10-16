/**
 * EcoCycle E-Waste Interactive Quiz Controller
 * 5-Question challenge with instant feedback, scoring, and explanations
 */

const quizData = [
  {
    id: 1,
    question: 'What is the primary hazard when e-waste is dumped into regular municipal landfills?',
    options: [
      'It takes up excessive visual space',
      'Toxic heavy metals (Lead, Mercury, Cadmium) leach into groundwater and soil',
      'It stops garbage trucks from moving',
      'It generates static electricity shocks'
    ],
    correctAnswer: 1,
    explanation: 'Hazardous heavy metals like Lead, Mercury, and Cadmium leach through landfill soil into freshwater aquifers, poisoning drinking water reserves.',
  },
  {
    id: 2,
    question: 'Which precious metal is recovered in high purity from discarded computer motherboards and CPUs?',
    options: ['Iron', 'Gold', 'Zinc', 'Titanium'],
    correctAnswer: 1,
    explanation: 'One metric ton of circuit boards contains up to 40 to 800 times more gold than a metric ton of natural gold ore mined from the earth!',
  },
  {
    id: 3,
    question: 'What crucial step should you always complete before handing over a smartphone or laptop for recycling?',
    options: [
      'Wash the screen with water',
      'Backup data, remove SIM/SD cards, and perform a factory reset',
      'Crack open the casing with a screwdriver',
      'Wrap it tightly in plastic wrap'
    ],
    correctAnswer: 1,
    explanation: 'Always backup your personal files, remove SIM and SD cards, and perform a factory wipe to protect your privacy and identity.',
  },
  {
    id: 4,
    question: 'Under environmental regulations (like India’s E-Waste Rules), what does "EPR" stand for?',
    options: [
      'Electronic Power Reduction',
      'Extended Producer Responsibility',
      'Eco Plastic Recycling',
      'Environmental Plant Restoration'
    ],
    correctAnswer: 1,
    explanation: 'Extended Producer Responsibility (EPR) mandates that electronic manufacturers take financial and operational responsibility for collecting and recycling end-of-life products.',
  },
  {
    id: 5,
    question: 'Why must lithium-ion rechargeable batteries NEVER be thrown into standard municipal trash bins?',
    options: [
      'They emit unpleasant odors',
      'They can be crushed or punctured in waste compactors, sparking violent chemical fires',
      'They attract stray animals',
      'They prevent compost formation'
    ],
    correctAnswer: 1,
    explanation: 'Damaged or compressed lithium-ion batteries undergo thermal runaway and can spark violent chemical fires inside waste collection vehicles.',
  },
];

let userAnswers = {};
let isSubmitted = false;

document.addEventListener('DOMContentLoaded', () => {
  renderQuiz();
  setupQuizHandler();
});

function renderQuiz() {
  const container = document.getElementById('quiz-questions-container');
  if (!container) return;

  container.innerHTML = '';

  quizData.forEach((q, qIndex) => {
    const questionCard = document.createElement('div');
    questionCard.style.cssText = 'padding: 20px; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md);';

    let optionsHtml = '';
    q.options.forEach((opt, optIndex) => {
      const isSelected = userAnswers[qIndex] === optIndex;
      let optionStyle = 'padding: 12px 16px; border: 1px solid var(--slate-200); border-radius: var(--radius-sm); background: white; cursor: pointer; font-size: 0.9rem; transition: all 0.15s ease; display: flex; align-items: center; justify-content: space-between;';

      if (isSelected) {
        optionStyle += ' border-color: var(--primary); background: #f0fdf4; font-weight: bold; color: var(--primary-dark);';
      }

      if (isSubmitted) {
        if (optIndex === q.correctAnswer) {
          optionStyle += ' background: #22c55e !important; color: white !important; border-color: #16a34a !important;';
        } else if (isSelected && optIndex !== q.correctAnswer) {
          optionStyle += ' background: #ef4444 !important; color: white !important; border-color: #dc2626 !important;';
        } else {
          optionStyle += ' opacity: 0.6;';
        }
      }

      optionsHtml += `
        <div class="quiz-option" data-q="${qIndex}" data-opt="${optIndex}" style="${optionStyle}">
          <span>${opt}</span>
          ${isSubmitted && optIndex === q.correctAnswer ? '<i data-lucide="check" style="width:16px;height:16px;"></i>' : ''}
          ${isSubmitted && isSelected && optIndex !== q.correctAnswer ? '<i data-lucide="x" style="width:16px;height:16px;"></i>' : ''}
        </div>
      `;
    });

    questionCard.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:14px;">
        <span style="width: 28px; height: 28px; background: var(--primary); color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0;">
          ${qIndex + 1}
        </span>
        <h3 style="font-size: 1.05rem; color: var(--slate-900); line-height: 1.4; margin-bottom: 0;">${q.question}</h3>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">${optionsHtml}</div>
      ${isSubmitted ? `
        <div style="margin-top:12px; padding:10px 14px; background:white; border:1px solid var(--slate-200); border-radius:var(--radius-sm); font-size:0.8rem; color:var(--slate-600);">
          <div style="display:flex; align-items:center; gap:6px; font-weight:700; margin-bottom:4px; color:var(--slate-800);">
            <i data-lucide="lightbulb" style="width:14px;height:14px;color:var(--accent);"></i>
            <span>Explanation:</span>
          </div>
          <div>${q.explanation}</div>
        </div>
      ` : ''}
    `;

    container.appendChild(questionCard);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Attach option click listeners
  if (!isSubmitted) {
    document.querySelectorAll('.quiz-option').forEach((el) => {
      el.addEventListener('click', () => {
        const qIndex = parseInt(el.getAttribute('data-q'), 10);
        const optIndex = parseInt(el.getAttribute('data-opt'), 10);
        userAnswers[qIndex] = optIndex;
        renderQuiz();
      });
    });
  }
}

function setupQuizHandler() {
  const form = document.getElementById('quiz-form');
  const scoreBanner = document.getElementById('quiz-score-banner');
  const submitBtn = document.getElementById('submit-quiz-btn');
  const resetBtn = document.getElementById('reset-quiz-btn');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (Object.keys(userAnswers).length < quizData.length) {
      alert('Please answer all 5 questions before submitting!');
      return;
    }

    isSubmitted = true;

    // Calculate score
    const score = quizData.reduce((acc, q, idx) => {
      return userAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
    }, 0);

    // Render score banner
    scoreBanner.style.display = 'block';
    if (score >= 4) {
      scoreBanner.style.background = '#dcfce7';
      scoreBanner.style.border = '1px solid #86efac';
      scoreBanner.style.color = '#14532d';
      scoreBanner.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:6px;">
          <i data-lucide="award" style="width:24px;height:24px;color:#16a34a;"></i>
          <h3 style="margin:0; font-size:1.3rem;">You Scored ${score} / 5!</h3>
        </div>
        <p style="margin:0; font-size:0.9rem;">Outstanding! You are a certified EcoCycle E-Waste Champion!</p>
      `;
    } else {
      scoreBanner.style.background = '#fef3c7';
      scoreBanner.style.border = '1px solid #fde68a';
      scoreBanner.style.color = '#78350f';
      scoreBanner.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:6px;">
          <i data-lucide="info" style="width:24px;height:24px;color:#d97706;"></i>
          <h3 style="margin:0; font-size:1.3rem;">You Scored ${score} / 5!</h3>
        </div>
        <p style="margin:0; font-size:0.9rem;">Good effort! Review the explanations above to brush up on safe disposal practices.</p>
      `;
    }

    submitBtn.style.display = 'none';
    resetBtn.style.display = 'inline-flex';
    renderQuiz();
  });

  resetBtn?.addEventListener('click', () => {
    userAnswers = {};
    isSubmitted = false;
    scoreBanner.style.display = 'none';
    submitBtn.style.display = 'inline-block';
    resetBtn.style.display = 'none';
    renderQuiz();
  });
}
