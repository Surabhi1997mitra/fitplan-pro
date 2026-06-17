/* =========================================================
   Your.Fit.Mitra — Form Logic
   Step navigation, validation, conditional fields,
   summary generation, and multi-channel submission
   ========================================================= */

// ╔══════════════════════════════════════════════════════════╗
// ║  CONFIGURATION — EDIT THESE VALUES FOR YOUR SETUP       ║
// ╚══════════════════════════════════════════════════════════╝

const CONFIG = {
  // WhatsApp — your number with country code, no + or spaces
  whatsappNumber: '919830552513',

  // Email — using FormSubmit.co (free, no API key needed)
  // First submission will ask you to confirm your email — check inbox!
  emailAddress: 'your.fit.mitra@gmail.com',
};

// ╔══════════════════════════════════════════════════════════╗
// ║  STATE                                                   ║
// ╚══════════════════════════════════════════════════════════╝

let currentStep = 0;
const totalSteps = 10; // 0-9

// ╔══════════════════════════════════════════════════════════╗
// ║  DOM REFERENCES                                          ║
// ╚══════════════════════════════════════════════════════════╝

const form = document.getElementById('fitnessForm');
const steps = document.querySelectorAll('.form-step');
const dots = document.querySelectorAll('.step-dot');
const progressFill = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const summaryContent = document.getElementById('summaryContent');

// ╔══════════════════════════════════════════════════════════╗
// ║  INITIALISATION                                          ║
// ╚══════════════════════════════════════════════════════════╝

document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  setupConditionalFields();
  setupFileUpload();
  setupNavigation();
  setupSubmitButtons();

});

// ╔══════════════════════════════════════════════════════════╗
// ║  NAVIGATION                                              ║
// ╚══════════════════════════════════════════════════════════╝

function setupNavigation() {
  nextBtn.addEventListener('click', () => {
    if (currentStep < totalSteps - 1) {
      if (validateStep(currentStep)) {
        currentStep++;
        if (currentStep === totalSteps - 1) {
          generateSummary();
        }
        updateUI();
        scrollToTop();
      }
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      updateUI();
      scrollToTop();
    }
  });

  // Clickable step dots — only go to completed or current steps
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetStep = parseInt(dot.dataset.step);
      if (targetStep <= currentStep) {
        currentStep = targetStep;
        if (currentStep === totalSteps - 1) {
          generateSummary();
        }
        updateUI();
        scrollToTop();
      }
    });
  });
}

function updateUI() {
  // Show/hide steps
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === currentStep);
  });

  // Update dots
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i === currentStep) {
      dot.classList.add('active');
    } else if (i < currentStep) {
      dot.classList.add('completed');
    }
  });

  // Progress bar
  const progress = ((currentStep + 1) / totalSteps) * 100;
  progressFill.style.width = progress + '%';

  // Buttons
  prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';

  if (currentStep === totalSteps - 1) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'inline-flex';
    nextBtn.innerHTML = currentStep === totalSteps - 2
      ? 'Review <i class="fa-solid fa-clipboard-check"></i>'
      : 'Next <i class="fa-solid fa-arrow-right"></i>';
  }

  // Scroll active dot into view
  const activeDot = dots[currentStep];
  if (activeDot) {
    activeDot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ╔══════════════════════════════════════════════════════════╗
// ║  VALIDATION                                              ║
// ╚══════════════════════════════════════════════════════════╝

function validateStep(stepIndex) {
  const stepEl = steps[stepIndex];
  const requiredFields = stepEl.querySelectorAll('[required]');
  let valid = true;

  // Clear previous errors
  stepEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  stepEl.querySelectorAll('.error-msg.show').forEach(el => el.classList.remove('show'));

  requiredFields.forEach(field => {
    if (!field.value || !field.value.trim()) {
      markError(field);
      valid = false;
    }
  });

  // Email validation
  const emailField = stepEl.querySelector('input[type="email"]');
  if (emailField && emailField.value && !isValidEmail(emailField.value)) {
    markError(emailField, 'Please enter a valid email');
    valid = false;
  }

  // Check progress photos uploaded (step 8)
  if (stepIndex === 8) {
    const photoIds = ['photoFront', 'photoBack', 'photoLeft', 'photoRight'];
    let allUploaded = true;
    photoIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el || !el.files || el.files.length === 0) {
        allUploaded = false;
        const slot = el ? el.closest('.photo-upload-slot') : null;
        if (slot) {
          slot.style.outline = '2px solid var(--red)';
          slot.style.borderRadius = '8px';
          setTimeout(() => { slot.style.outline = ''; }, 3000);
        }
      }
    });
    if (!allUploaded) {
      valid = false;
      const grid = stepEl.querySelector('.photo-upload-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Check workout type has at least one selected (step 4)
  if (stepIndex === 4) {
    const workoutChecked = stepEl.querySelectorAll('input[name="workoutType"]:checked');
    if (workoutChecked.length === 0) {
      const group = document.getElementById('workoutTypeGroup');
      if (group) {
        group.style.outline = '2px solid var(--red)';
        group.style.borderRadius = '8px';
        group.style.padding = '8px';
        setTimeout(() => {
          group.style.outline = '';
          group.style.padding = '';
        }, 3000);
      }
      valid = false;
    }
  }

  if (!valid) {
    // Scroll to first error
    const firstError = stepEl.querySelector('.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
  }

  return valid;
}

function markError(field, message) {
  field.classList.add('error');

  // Remove error on input
  const handler = () => {
    field.classList.remove('error');
    const errMsg = field.parentElement.querySelector('.error-msg');
    if (errMsg) errMsg.classList.remove('show');
    field.removeEventListener('input', handler);
    field.removeEventListener('change', handler);
  };
  field.addEventListener('input', handler);
  field.addEventListener('change', handler);

  // Show error message if provided
  if (message) {
    let errMsg = field.parentElement.querySelector('.error-msg');
    if (!errMsg) {
      errMsg = document.createElement('span');
      errMsg.className = 'error-msg';
      field.parentElement.appendChild(errMsg);
    }
    errMsg.textContent = message;
    errMsg.classList.add('show');
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  CONDITIONAL FIELDS                                      ║
// ╚══════════════════════════════════════════════════════════╝

function setupConditionalFields() {
  // Medication toggle
  const medToggle = document.getElementById('onMedication');
  const medDetails = document.getElementById('medicationDetailsGroup');
  if (medToggle && medDetails) {
    medToggle.addEventListener('change', () => {
      medDetails.style.display = medToggle.checked ? 'flex' : 'none';
    });
  }

  // Surgery toggle
  const surgeryToggle = document.getElementById('recentSurgery');
  const surgeryDetails = document.getElementById('surgeryDetailsGroup');
  if (surgeryToggle && surgeryDetails) {
    surgeryToggle.addEventListener('change', () => {
      surgeryDetails.style.display = surgeryToggle.checked ? 'flex' : 'none';
    });
  }

  // Height unit change
  const heightUnit = document.getElementById('heightUnit');
  const heightInchesGroup = document.getElementById('heightInchesGroup');
  if (heightUnit && heightInchesGroup) {
    heightUnit.addEventListener('change', () => {
      heightInchesGroup.style.display = heightUnit.value === 'feet-inches' ? 'flex' : 'none';
      document.getElementById('height').placeholder =
        heightUnit.value === 'feet-inches' ? 'Feet (e.g. 5)' : 'e.g. 170';
    });
  }

  // Weight unit change updates target weight label
  const weightUnit = document.getElementById('weightUnit');
  const targetWeightUnit = document.getElementById('targetWeightUnit');
  if (weightUnit && targetWeightUnit) {
    weightUnit.addEventListener('change', () => {
      targetWeightUnit.textContent = weightUnit.value;
    });
  }

  // Dietary preference → show/hide veg/non-veg protein source chips
  const dietaryPref = document.getElementById('dietaryPref');
  const vegProteinGroup = document.getElementById('vegProteinGroup');
  const nonVegProteinGroup = document.getElementById('nonVegProteinGroup');
  if (dietaryPref && vegProteinGroup && nonVegProteinGroup) {
    const updateDietGroups = () => {
      const val = dietaryPref.value;
      const isVeg = ['Vegetarian', 'Eggetarian', 'Vegan', 'Jain', 'Sattvic'].includes(val);
      const isNonVeg = ['Non-Vegetarian', 'Eggetarian'].includes(val);
      vegProteinGroup.style.display = isVeg ? 'flex' : 'none';
      nonVegProteinGroup.style.display = isNonVeg ? 'flex' : 'none';
    };
    dietaryPref.addEventListener('change', updateDietGroups);
    updateDietGroups();
  }

  // Supplements "Other" free-text reveal
  const suppOther = document.querySelector('input[name="supplements"][value="Other"]');
  const suppOtherGroup = document.getElementById('supplementsOtherGroup');
  if (suppOther && suppOtherGroup) {
    suppOther.addEventListener('change', () => {
      suppOtherGroup.style.display = suppOther.checked ? 'flex' : 'none';
    });
  }

  // "None" chip deselects others in medical conditions group
  const medNone = document.querySelector('input[name="medicalConditions"][value="None"]');
  if (medNone) {
    const allMed = document.querySelectorAll('input[name="medicalConditions"]');
    medNone.addEventListener('change', () => {
      if (medNone.checked) allMed.forEach(cb => { if (cb !== medNone) cb.checked = false; });
    });
    allMed.forEach(cb => {
      if (cb !== medNone) cb.addEventListener('change', () => { if (cb.checked) medNone.checked = false; });
    });
  }

  // "None" chip deselects others in injuries group
  const injNone = document.querySelector('input[name="injuries"][value="None"]');
  if (injNone) {
    const allInj = document.querySelectorAll('input[name="injuries"]');
    injNone.addEventListener('change', () => {
      if (injNone.checked) allInj.forEach(cb => { if (cb !== injNone) cb.checked = false; });
    });
    allInj.forEach(cb => {
      if (cb !== injNone) cb.addEventListener('change', () => { if (cb.checked) injNone.checked = false; });
    });
  }

  // "None" chip deselects others in supplement group
  const supplementNone = document.querySelector('input[name="supplements"][value="None"]');
  if (supplementNone) {
    const allSupp = document.querySelectorAll('input[name="supplements"]');
    supplementNone.addEventListener('change', () => {
      if (supplementNone.checked) {
        allSupp.forEach(cb => { if (cb !== supplementNone) cb.checked = false; });
      }
    });
    allSupp.forEach(cb => {
      if (cb !== supplementNone) {
        cb.addEventListener('change', () => {
          if (cb.checked) supplementNone.checked = false;
        });
      }
    });
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  FILE UPLOAD                                             ║
// ╚══════════════════════════════════════════════════════════╝

function setupFileUpload() {
  const photoSlots = [
    { inputId: 'photoFront', previewId: 'previewFront', slotId: 'photoSlotFront' },
    { inputId: 'photoBack',  previewId: 'previewBack',  slotId: 'photoSlotBack'  },
    { inputId: 'photoLeft',  previewId: 'previewLeft',  slotId: 'photoSlotLeft'  },
    { inputId: 'photoRight', previewId: 'previewRight', slotId: 'photoSlotRight' },
  ];

  photoSlots.forEach(({ inputId, previewId, slotId }) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const slot = document.getElementById(slotId);
    if (!input || !preview || !slot) return;

    // Make the whole slot clickable
    slot.addEventListener('click', (e) => {
      if (e.target !== input) input.click();
    });

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
            <button type="button" class="photo-remove-btn" title="Remove"><i class="fa-solid fa-xmark"></i></button>`;
          slot.classList.add('has-photo');
          preview.querySelector('.photo-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            preview.innerHTML = '';
            slot.classList.remove('has-photo');
          });
        };
        reader.readAsDataURL(input.files[0]);
      }
    });
  });
}

// ╔══════════════════════════════════════════════════════════╗
// ║  COLLECT ALL FORM DATA                                   ║
// ╚══════════════════════════════════════════════════════════╝

function collectFormData() {
  const f = (id) => {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'Yes' : 'No';
    return el.value || '';
  };

  const getChecked = (name) => {
    const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checked).map(cb => cb.value).join(', ') || 'None selected';
  };

  const heightUnit = f('heightUnit');
  let heightDisplay = f('height') + ' ' + heightUnit;
  if (heightUnit === 'feet-inches') {
    heightDisplay = f('height') + "'" + (f('heightInches') || '0') + '"';
  }

  return {
    // Section 1 — Personal
    fullName: f('fullName'),
    age: f('age'),
    gender: f('gender'),
    dob: f('dob'),
    phone: f('phone'),
    altPhone: f('altPhone'),
    email: f('email'),
    address: f('address'),
    city: f('city'),
    state: f('state'),
    pincode: f('pincode'),

    // Section 2 — Body Stats
    height: heightDisplay,
    currentWeight: f('currentWeight') + ' ' + f('weightUnit'),
    targetWeight: f('targetWeight') + ' ' + f('weightUnit'),
    bodyFat: f('bodyFat') ? f('bodyFat') + '%' : '',
    bodyType: f('bodyType'),

    // Section 3 — Goals
    primaryGoal: f('primaryGoal'),
    secondaryGoal: f('secondaryGoal'),
    motivation: f('motivation'),

    // Section 4 — Health
    medicalConditions: getChecked('medicalConditions'),
    medicalConditionsExtra: f('medicalConditionsExtra'),
    injuries: getChecked('injuries'),
    injuryDetails: f('injuryDetails'),
    onMedication: f('onMedication'),
    medicationDetails: f('medicationDetails'),
    recentSurgery: f('recentSurgery'),
    surgeryDetails: f('surgeryDetails'),
    doctorClearance: f('doctorClearance'),
    bloodReports: f('bloodReports'),

    // Section 5 — Fitness Background
    activityLevel: f('activityLevel'),
    trainingExperience: f('trainingExperience'),
    workoutType: getChecked('workoutType'),
    workoutDays: f('workoutDays'),
    sessionDuration: f('sessionDuration'),
    equipmentAccess: f('equipmentAccess'),

    // Section 6 — Diet & Nutrition
    dietaryPref: f('dietaryPref'),
    vegProtein: getChecked('vegProtein'),
    nonVegProtein: getChecked('nonVegProtein'),
    foodAllergies: f('foodAllergies'),
    dislikedFoods: f('dislikedFoods'),
    mealsPerDay: f('mealsPerDay'),
    cookOwnFood: f('cookOwnFood'),
    outsideFood: f('outsideFood'),
    waterIntake: f('waterIntake'),
    supplements: getChecked('supplements'),
    supplementsOther: f('supplementsOther'),
    willingSupplements: (() => { const el = document.querySelector('input[name="willingSupplements"]:checked'); return el ? el.value : ''; })(),
    proteinPowderBudget: f('proteinPowderBudget'),
    alcohol: f('alcohol'),
    caffeine: f('caffeine'),
    foodBudget: f('foodBudget'),

    // Section 7 — Meal Details
    breakfast: getChecked('breakfast'),
    breakfastDetails: f('breakfastDetails'),
    lunch: getChecked('lunch'),
    lunchDetails: f('lunchDetails'),
    dinner: getChecked('dinner'),
    dinnerDetails: f('dinnerDetails'),
    snacks: getChecked('snacks'),
    snacksDetails: f('snacksDetails'),
    preworkoutMeal: f('preworkoutMeal'),
    postworkoutMeal: f('postworkoutMeal'),
    cheatFrequency: f('cheatFrequency'),
    mealDescriptionExtra: f('mealDescriptionExtra'),

    // Section 8 — Lifestyle
    occupation: f('occupation'),
    workHours: f('workHours'),
    dailySteps: f('dailySteps'),
    sleepDuration: f('sleepDuration'),
    sleepQuality: f('sleepQuality'),
    stressLevel: f('stressLevel'),
    smoking: f('smoking'),
    menstrualCycle: f('menstrualCycle'),

    // Section 9 — Measurements
    chest: f('chest') ? f('chest') + ' cm' : '',
    waist: f('waist') ? f('waist') + ' cm' : '',
    hips: f('hips') ? f('hips') + ' cm' : '',
    leftArm: f('leftArm') ? f('leftArm') + ' cm' : '',
    rightArm: f('rightArm') ? f('rightArm') + ' cm' : '',
    leftThigh: f('leftThigh') ? f('leftThigh') + ' cm' : '',
    rightThigh: f('rightThigh') ? f('rightThigh') + ' cm' : '',
    restingHR: f('restingHR') ? f('restingHR') + ' bpm' : '',
    bloodPressure: f('bloodPressure'),
    progressPhotos: (() => {
      const ids = ['photoFront', 'photoBack', 'photoLeft', 'photoRight'];
      const labels = ['Front', 'Back', 'Left Side', 'Right Side'];
      return ids.map((id, i) => {
        const el = document.getElementById(id);
        return el && el.files && el.files[0] ? `${labels[i]}: ${el.files[0].name}` : `${labels[i]}: Not uploaded`;
      }).join(' | ');
    })(),

    // Additional notes (moved to measurements step)
    hearAboutUs: f('hearAboutUs'),
    additionalNotes: f('additionalNotes'),
  };
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SUMMARY GENERATION                                      ║
// ╚══════════════════════════════════════════════════════════╝

function generateSummary() {
  const data = collectFormData();

  const sections = [
    {
      title: 'Personal Details', icon: 'fa-user', step: 0,
      fields: [
        ['Full Name', data.fullName], ['Age', data.age], ['Gender', data.gender],
        ['Date of Birth', data.dob], ['Phone', data.phone], ['Alt Phone', data.altPhone],
        ['Email', data.email], ['Address', data.address], ['City', data.city],
        ['State', data.state], ['Pincode', data.pincode],
      ]
    },
    {
      title: 'Body Stats', icon: 'fa-weight-scale', step: 1,
      fields: [
        ['Height', data.height], ['Current Weight', data.currentWeight],
        ['Target Weight', data.targetWeight], ['Body Fat %', data.bodyFat],
        ['Body Type', data.bodyType],
      ]
    },
    {
      title: 'Goals & Motivation', icon: 'fa-bullseye', step: 2,
      fields: [
        ['Primary Goal', data.primaryGoal], ['Secondary Goal', data.secondaryGoal],
        ['Motivation', data.motivation],
      ]
    },
    {
      title: 'Health & Medical', icon: 'fa-heart-pulse', step: 3,
      fields: [
        ['Medical Conditions', data.medicalConditions],
        ['Other Medical History', data.medicalConditionsExtra],
        ['Injuries / Pain', data.injuries],
        ['Injury Details', data.injuryDetails],
        ['On Medication', data.onMedication],
        ...(data.onMedication === 'Yes' ? [['Medication Details', data.medicationDetails]] : []),
        ['Recent Surgery', data.recentSurgery],
        ...(data.recentSurgery === 'Yes' ? [['Surgery Details', data.surgeryDetails]] : []),
        ['Doctor Clearance', data.doctorClearance], ['Blood Reports', data.bloodReports],
      ]
    },
    {
      title: 'Fitness Background', icon: 'fa-person-running', step: 4,
      fields: [
        ['Activity Level', data.activityLevel], ['Training Experience', data.trainingExperience],
        ['Workout Type', data.workoutType], ['Days/Week', data.workoutDays],
        ['Session Duration', data.sessionDuration], ['Equipment', data.equipmentAccess],
      ]
    },
    {
      title: 'Diet & Nutrition', icon: 'fa-apple-whole', step: 5,
      fields: [
        ['Dietary Preference', data.dietaryPref],
        ['Veg Protein Sources', data.vegProtein],
        ['Non-Veg Protein Sources', data.nonVegProtein],
        ['Food Allergies', data.foodAllergies],
        ['Disliked Foods', data.dislikedFoods], ['Meals/Day', data.mealsPerDay],
        ['Cook Own Food', data.cookOwnFood], ['Outside Food', data.outsideFood],
        ['Water Intake', data.waterIntake],
        ['Supplements Taking', data.supplements],
        ['Other Supplements', data.supplementsOther],
        ['Open to Supplements', data.willingSupplements],
        ['Protein Powder Budget', data.proteinPowderBudget],
        ['Alcohol', data.alcohol], ['Caffeine', data.caffeine], ['Food Budget', data.foodBudget],
      ]
    },
    {
      title: 'Typical Daily Meals', icon: 'fa-utensils', step: 6,
      fields: [
        ['Breakfast Items', data.breakfast], ['Breakfast Detail', data.breakfastDetails],
        ['Lunch Items', data.lunch], ['Lunch Detail', data.lunchDetails],
        ['Dinner Items', data.dinner], ['Dinner Detail', data.dinnerDetails],
        ['Snacks', data.snacks], ['Snacks Detail', data.snacksDetails],
        ['Pre-Workout Meal', data.preworkoutMeal], ['Post-Workout Meal', data.postworkoutMeal],
        ['Cheat Meals/Week', data.cheatFrequency], ['Extra Meal Notes', data.mealDescriptionExtra],
      ]
    },
    {
      title: 'Lifestyle & Recovery', icon: 'fa-bed', step: 7,
      fields: [
        ['Occupation', data.occupation], ['Work Hours', data.workHours],
        ['Daily Steps', data.dailySteps], ['Sleep Duration', data.sleepDuration],
        ['Sleep Quality', data.sleepQuality], ['Stress Level', data.stressLevel],
        ['Smoking', data.smoking], ['Menstrual Cycle', data.menstrualCycle],
      ]
    },
    {
      title: 'Body Measurements & Photos', icon: 'fa-ruler', step: 8,
      fields: [
        ['Chest', data.chest], ['Waist', data.waist], ['Hips', data.hips],
        ['Left Arm', data.leftArm], ['Right Arm', data.rightArm],
        ['Left Thigh', data.leftThigh], ['Right Thigh', data.rightThigh],
        ['Resting HR', data.restingHR], ['Blood Pressure', data.bloodPressure],
        ['Progress Photos', data.progressPhotos],
      ]
    },
  ];

  let html = '';
  sections.forEach(section => {
    const rows = section.fields
      .map(([label, value]) => {
        const displayValue = value || '—';
        const cls = value ? '' : ' empty';
        return `<div class="summary-row"><span class="summary-label">${label}</span><span class="summary-value${cls}">${displayValue}</span></div>`;
      })
      .join('');

    html += `
      <div class="summary-card">
        <div class="summary-card-header" onclick="goToStepFromSummary(${section.step})">
          <i class="fa-solid ${section.icon}"></i>
          ${section.title}
          <button type="button" class="edit-btn" onclick="event.stopPropagation(); goToStepFromSummary(${section.step});">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
        </div>
        <div class="summary-card-body">${rows}</div>
      </div>`;
  });

  summaryContent.innerHTML = html;
}

function goToStepFromSummary(step) {
  currentStep = step;
  updateUI();
  scrollToTop();
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SUBMISSION — WhatsApp                                   ║
// ╚══════════════════════════════════════════════════════════╝

function formatForWhatsApp(data) {
  const line = (label, value) => value ? `*${label}:* ${value}` : '';

  const lines = [
    '🏋️ *YOUR.FIT.MITRA — NEW CLIENT ASSESSMENT*',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '👤 *PERSONAL DETAILS*',
    line('Name', data.fullName),
    line('Age', data.age),
    line('Gender', data.gender),
    line('DOB', data.dob),
    line('Phone', data.phone),
    line('Alt Phone', data.altPhone),
    line('Email', data.email),
    line('Address', data.address),
    line('City', data.city),
    line('State', data.state),
    line('Pincode', data.pincode),
    '',
    '📏 *BODY STATS*',
    line('Height', data.height),
    line('Current Weight', data.currentWeight),
    line('Target Weight', data.targetWeight),
    line('Body Fat', data.bodyFat),
    line('Body Type', data.bodyType),
    '',
    '🎯 *GOALS*',
    line('Primary Goal', data.primaryGoal),
    line('Secondary Goal', data.secondaryGoal),
    line('Motivation', data.motivation),
    '',
    '🏥 *HEALTH & MEDICAL*',
    line('Medical Conditions', data.medicalConditions),
    line('Other Medical History', data.medicalConditionsExtra),
    line('Injuries / Pain', data.injuries),
    line('Injury Details', data.injuryDetails),
    line('On Medication', data.onMedication),
    line('Medication Details', data.medicationDetails),
    line('Recent Surgery', data.recentSurgery),
    line('Surgery Details', data.surgeryDetails),
    line('Doctor Clearance', data.doctorClearance),
    line('Blood Reports', data.bloodReports),
    '',
    '🏃 *FITNESS BACKGROUND*',
    line('Activity Level', data.activityLevel),
    line('Training Exp', data.trainingExperience),
    line('Workout Type', data.workoutType),
    line('Days/Week', data.workoutDays),
    line('Session Duration', data.sessionDuration),
    line('Equipment', data.equipmentAccess),
    '',
    '🍎 *DIET & NUTRITION*',
    line('Diet Preference', data.dietaryPref),
    line('Veg Protein Sources', data.vegProtein),
    line('Non-Veg Protein Sources', data.nonVegProtein),
    line('Allergies', data.foodAllergies),
    line('Disliked Foods', data.dislikedFoods),
    line('Meals/Day', data.mealsPerDay),
    line('Cook Own Food', data.cookOwnFood),
    line('Outside Food', data.outsideFood),
    line('Water Intake', data.waterIntake),
    line('Supplements Taking', data.supplements),
    line('Other Supplements', data.supplementsOther),
    line('Open to Supplements', data.willingSupplements),
    line('Protein Powder Budget', data.proteinPowderBudget),
    line('Alcohol', data.alcohol),
    line('Caffeine', data.caffeine),
    line('Food Budget', data.foodBudget),
    '',
    '🍽️ *TYPICAL DAILY MEALS*',
    line('Breakfast Items', data.breakfast),
    line('Breakfast Detail', data.breakfastDetails),
    line('Lunch Items', data.lunch),
    line('Lunch Detail', data.lunchDetails),
    line('Dinner Items', data.dinner),
    line('Dinner Detail', data.dinnerDetails),
    line('Snacks', data.snacks),
    line('Snacks Detail', data.snacksDetails),
    line('Pre-Workout Meal', data.preworkoutMeal),
    line('Post-Workout Meal', data.postworkoutMeal),
    line('Cheat Meals/Week', data.cheatFrequency),
    line('Extra Meal Notes', data.mealDescriptionExtra),
    '',
    '🛌 *LIFESTYLE*',
    line('Occupation', data.occupation),
    line('Work Hours', data.workHours),
    line('Daily Steps', data.dailySteps),
    line('Sleep Duration', data.sleepDuration),
    line('Sleep Quality', data.sleepQuality),
    line('Stress Level', data.stressLevel),
    line('Smoking', data.smoking),
    line('Menstrual Cycle', data.menstrualCycle),
    '',
    '📐 *MEASUREMENTS*',
    line('Chest', data.chest),
    line('Waist', data.waist),
    line('Hips', data.hips),
    line('Left Arm', data.leftArm),
    line('Right Arm', data.rightArm),
    line('Left Thigh', data.leftThigh),
    line('Right Thigh', data.rightThigh),
    line('Resting HR', data.restingHR),
    line('Blood Pressure', data.bloodPressure),
    line('Progress Photos', data.progressPhotos),
    '',
    line('Heard About Us', data.hearAboutUs),
    line('Notes', data.additionalNotes),
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '✅ Submitted via Your.Fit.Mitra',
  ];

  return lines.filter(l => l !== null && l !== undefined).join('\n');
}

function submitViaWhatsApp() {
  const data = collectFormData();
  const text = formatForWhatsApp(data);
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;
  window.open(url, '_blank');
  showSuccessModal();
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SUBMISSION — Email (FormSubmit.co — zero config)        ║
// ╚══════════════════════════════════════════════════════════╝

async function submitViaEmail() {
  const data = collectFormData();
  const btn = document.getElementById('submitEmail');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Sending...';
  btn.disabled = true;

  try {
    // Build a FormData-friendly payload with readable labels
    const payload = {
      _subject: `New Your.Fit.Mitra Assessment — ${data.fullName}`,
      _captcha: 'false',
      _template: 'table',

      // Section 1
      'Full Name': data.fullName, 'Age': data.age, 'Gender': data.gender,
      'Date of Birth': data.dob, 'Phone': data.phone, 'Alt Phone': data.altPhone,
      'Email': data.email, 'Address': data.address, 'City': data.city,
      'State': data.state, 'Pincode': data.pincode,

      // Section 2
      'Height': data.height, 'Current Weight': data.currentWeight,
      'Target Weight': data.targetWeight, 'Body Fat %': data.bodyFat,
      'Body Type': data.bodyType,

      // Section 3
      'Primary Goal': data.primaryGoal, 'Secondary Goal': data.secondaryGoal,
      'Motivation': data.motivation,

      // Section 4
      'Medical Conditions': data.medicalConditions,
      'Other Medical History': data.medicalConditionsExtra,
      'Injuries / Pain': data.injuries,
      'Injury Details': data.injuryDetails,
      'On Medication': data.onMedication, 'Medication Details': data.medicationDetails,
      'Recent Surgery': data.recentSurgery, 'Surgery Details': data.surgeryDetails,
      'Doctor Clearance': data.doctorClearance, 'Blood Reports': data.bloodReports,

      // Section 5
      'Activity Level': data.activityLevel, 'Training Experience': data.trainingExperience,
      'Workout Type': data.workoutType, 'Workout Days/Week': data.workoutDays,
      'Session Duration': data.sessionDuration, 'Equipment Access': data.equipmentAccess,

      // Section 6
      'Dietary Preference': data.dietaryPref,
      'Veg Protein Sources': data.vegProtein,
      'Non-Veg Protein Sources': data.nonVegProtein,
      'Food Allergies': data.foodAllergies,
      'Disliked Foods': data.dislikedFoods, 'Meals/Day': data.mealsPerDay,
      'Cook Own Food': data.cookOwnFood, 'Outside Food': data.outsideFood,
      'Water Intake': data.waterIntake,
      'Supplements Currently Taking': data.supplements,
      'Other Supplements': data.supplementsOther,
      'Open to Taking Supplements': data.willingSupplements,
      'Protein Powder Budget': data.proteinPowderBudget,
      'Alcohol': data.alcohol, 'Caffeine': data.caffeine, 'Food Budget': data.foodBudget,

      // Section 7 — Meal Details
      'Breakfast Items': data.breakfast, 'Breakfast Detail': data.breakfastDetails,
      'Lunch Items': data.lunch, 'Lunch Detail': data.lunchDetails,
      'Dinner Items': data.dinner, 'Dinner Detail': data.dinnerDetails,
      'Snacks': data.snacks, 'Snacks Detail': data.snacksDetails,
      'Pre-Workout Meal': data.preworkoutMeal, 'Post-Workout Meal': data.postworkoutMeal,
      'Cheat Meals/Week': data.cheatFrequency, 'Extra Meal Notes': data.mealDescriptionExtra,

      // Section 8
      'Occupation': data.occupation, 'Work Hours': data.workHours,
      'Daily Steps': data.dailySteps, 'Sleep Duration': data.sleepDuration,
      'Sleep Quality': data.sleepQuality, 'Stress Level': data.stressLevel,
      'Smoking': data.smoking, 'Menstrual Cycle': data.menstrualCycle,

      // Section 9 — Measurements
      'Chest': data.chest, 'Waist': data.waist, 'Hips': data.hips,
      'Left Arm': data.leftArm, 'Right Arm': data.rightArm,
      'Left Thigh': data.leftThigh, 'Right Thigh': data.rightThigh,
      'Resting HR': data.restingHR, 'Blood Pressure': data.bloodPressure,
      'Progress Photos': data.progressPhotos,

      'Heard About Us': data.hearAboutUs, 'Additional Notes': data.additionalNotes,
    };

    const response = await fetch(`https://formsubmit.co/ajax/${CONFIG.emailAddress}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      showSuccessModal();
    } else {
      alert('Email sending failed. Check console for details.');
      console.error('FormSubmit error:', result);
    }
  } catch (err) {
    alert('Error sending email. Please check your internet connection.');
    console.error(err);
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SUBMIT BUTTON WIRING                                    ║
// ╚══════════════════════════════════════════════════════════╝

function setupSubmitButtons() {
  document.getElementById('submitWhatsApp').addEventListener('click', submitViaWhatsApp);
  document.getElementById('submitEmail').addEventListener('click', submitViaEmail);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SUCCESS MODAL                                           ║
// ╚══════════════════════════════════════════════════════════╝

function showSuccessModal() {
  document.getElementById('successModal').classList.add('show');
}
