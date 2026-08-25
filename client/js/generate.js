/* ============================================
   Ipvideo - Video Generation (Production API)
   ============================================ */

const generateForm = document.getElementById('generateForm');
const previewArea = document.getElementById('previewArea');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const generationProgress = document.getElementById('generationProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const previewVideo = document.getElementById('previewVideo');
const resultActions = document.getElementById('resultActions');
const generateBtn = document.getElementById('generateBtn');
const durationSelect = document.getElementById('duration');
const modelQualitySelect = document.getElementById('modelQuality');
const costDisplay = document.getElementById('costDisplay');
const currentPointsEl = document.getElementById('currentPoints');

function calculateVideoCost(duration, modelQuality = 'standard') {
  const baseCost = Math.ceil((duration / 30) * 40);
  const multiplier = modelQuality === 'premium' ? 3 : 1;
  return baseCost * multiplier;
}

function updateCostDisplay() {
  const duration = parseInt(durationSelect.value);
  const modelQuality = modelQualitySelect ? modelQualitySelect.value : 'standard';
  const cost = calculateVideoCost(duration, modelQuality);
  const label = typeof t === 'function' ? t('generate_cost_label') : 'Coût estimé';
  const points = typeof t === 'function' ? t('generate_points') : 'points';
  costDisplay.innerHTML = `${label}: <strong style="color:var(--accent-primary);">${cost} ${points}</strong>`;
}

function updatePointsDisplay() {
  const user = getUser();
  if (user && currentPointsEl) {
    currentPointsEl.textContent = user.pointsBalance || 0;
  }
}

if (durationSelect) {
  durationSelect.addEventListener('change', updateCostDisplay);
}

if (modelQualitySelect) {
  modelQualitySelect.addEventListener('change', updateCostDisplay);
}

updateCostDisplay();

// Load user points on page load
updatePointsDisplay();

function getGenerationSteps() {
  return [
    { pct: 10, text: typeof t === 'function' ? t('generate_progress_step1') : 'Envoi du prompt au serveur...' },
    { pct: 25, text: typeof t === 'function' ? t('generate_progress_step2') : 'Création de la prédiction IA...' },
    { pct: 40, text: typeof t === 'function' ? t('generate_progress_step3') : 'Génération des keyframes en cours...' },
    { pct: 60, text: typeof t === 'function' ? t('generate_progress_step4') : 'Rendu vidéo par le modèle IA...' },
    { pct: 80, text: typeof t === 'function' ? t('generate_progress_step5') : 'Encodage et post-traitement...' },
    { pct: 100, text: typeof t === 'function' ? t('generate_progress_step6') : 'Finalisé !' },
  ];
}

if (generateForm) {
  generateForm.addEventListener('submit', function(e) {
    e.preventDefault();
    startGeneration();
  });
}

async function startGeneration() {
  generateBtn.disabled = true;
  const launchingText = typeof t === 'function' ? t('generate_progress_step1') : 'Lancement...';
  generateBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${launchingText}`;

  previewPlaceholder.style.display = 'none';
  generationProgress.style.display = 'block';
  previewVideo.style.display = 'none';
  resultActions.style.display = 'none';
  previewArea.classList.add('generating');

  const prompt = document.getElementById('prompt').value;
  const style = document.getElementById('style').value;
  const duration = parseInt(document.getElementById('duration').value);
  const quality = document.getElementById('quality').value;
  const ratio = document.getElementById('ratio').value;
  const music = document.getElementById('music').value;
  const modelQuality = document.getElementById('modelQuality').value;

  try {
    // Step 1: Submit to backend
    updateProgress(10, typeof t === 'function' ? t('generate_progress_step1') : 'Envoi du prompt au serveur...');
    const response = await videoAPI.generate({ prompt, style, duration, quality, ratio, music, modelQuality });
    const videoId = response.video.id;

    // Update points display if response includes remaining points
    if (response.pointsRemaining !== undefined) {
      const user = getUser();
      if (user) {
        user.pointsBalance = response.pointsRemaining;
        setUser(user);
        updatePointsDisplay();
      }
    }

    // Step 2: Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5s interval)

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;

      const statusRes = await videoAPI.checkStatus(videoId);
      const status = statusRes.status;

      // Update progress based on status
      if (status === 'pending') {
        updateProgress(20 + Math.min(attempts * 2, 30), typeof t === 'function' ? t('generate_status_pending') : 'En attente du modèle IA...');
      } else if (status === 'generating') {
        updateProgress(50 + Math.min(attempts * 2, 35), typeof t === 'function' ? t('generate_status_generating') : 'Génération vidéo en cours...');
      } else if (status === 'completed') {
        updateProgress(100, typeof t === 'function' ? t('generate_status_completed') : 'Vidéo prête !');
        completed = true;
        showResult(videoId, statusRes.videoUrl);
      } else if (status === 'failed') {
        updateProgress(0, typeof t === 'function' ? t('generate_status_failed') : 'Échec de la génération');
        completed = true;
        showError(statusRes.errorMessage || (typeof t === 'function' ? t('generate_status_failed') : 'La génération a échoué'));
      }
    }

    if (!completed) {
      showError(typeof t === 'function' ? t('generate_timeout') : 'Délai de génération dépassé. Vérifiez votre tableau de bord plus tard.');
    }
  } catch (err) {
    console.error('Generation error:', err);
    if (err.data?.code === 'INSUFFICIENT_POINTS') {
      const insufficientMsg = typeof t === 'function'
        ? t('generate_insufficient_points').replace('{cost}', err.data.pointsRequired).replace('{balance}', err.data.pointsBalance)
        : `Points insuffisants. Cette vidéo coûte ${err.data.pointsRequired} points. Vous en avez ${err.data.pointsBalance}.`;
      showError(insufficientMsg + ` <a href="pricing.html" style="color:var(--accent-primary); text-decoration:underline;">${typeof t === 'function' ? t('generate_recharge') : 'Rechargez ici'}</a>.`);
    } else {
      showError(err.data?.message || err.message || (typeof t === 'function' ? t('generate_error') : 'Erreur lors de la génération'));
    }
  } finally {
    generateBtn.disabled = false;
    const generateText = typeof t === 'function' ? t('generate_btn') : 'Générer la vidéo';
    generateBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> ${generateText}`;
  }
}

function updateProgress(percent, text) {
  progressFill.style.width = percent + '%';
  progressText.textContent = text;
}

function showResult(videoId, videoUrl) {
  generationProgress.style.display = 'none';
  previewVideo.style.display = 'flex';
  resultActions.style.display = 'flex';

  const videoFallback = document.getElementById('videoFallback');
  const browserNoSupport = typeof t === 'function' ? 'Your browser does not support video playback.' : 'Votre navigateur ne supporte pas la lecture vidéo.';
  const resultSuccess = typeof t === 'function' ? t('generate_result_success') : 'Vidéo générée avec succès !';
  if (videoUrl) {
    videoFallback.innerHTML = `
      <video controls style="width:100%; height:100%; border-radius:12px;">
        <source src="${videoUrl}" type="video/mp4">
        ${browserNoSupport}
      </video>
    `;
  } else {
    videoFallback.innerHTML = `
      <i class="fa-solid fa-circle-check" style="font-size:4rem; color:var(--success); margin-bottom:16px;"></i>
      <p style="color:var(--text-secondary);">${resultSuccess}</p>
      <p style="font-size:0.8rem; color:var(--text-muted);">ID: ${videoId}</p>
    `;
  }
}

function showError(message) {
  generationProgress.style.display = 'none';
  previewVideo.style.display = 'flex';
  resultActions.style.display = 'none';
  const videoFallback = document.getElementById('videoFallback');
  videoFallback.innerHTML = `
    <i class="fa-solid fa-circle-xmark" style="font-size:4rem; color:var(--danger); margin-bottom:16px;"></i>
    <p style="color:var(--text-secondary);">${message}</p>
  `;
}

const newBtn = document.getElementById('newBtn');
if (newBtn) {
  newBtn.addEventListener('click', () => {
    previewVideo.style.display = 'none';
    resultActions.style.display = 'none';
    previewPlaceholder.style.display = 'flex';
    previewArea.classList.remove('generating');
    generateForm.reset();
  });
}

const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    const msg = typeof t === 'function'
      ? 'Download will be available when the video is fully processed. Check your dashboard.'
      : 'Le téléchargement sera disponible lorsque la vidéo sera complètement traitée. Consultez votre tableau de bord.';
    alert(msg);
  });
}
