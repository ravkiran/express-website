/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  createTag,
  fetchPlaceholders,
  getIcon,
  getIconElement,
  getLocale,
  toClassName,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/scripts.js';

// eslint-disable-next-line import/no-unresolved
import Context from '../../scripts/context.js';

let ratings;
let submissionTitle;
let submissionText;

fetchPlaceholders().then((placeholders) => {
  ratings = [
    {
      class: 'one-star',
      img: getIconElement('emoji-angry-face'),
      text: placeholders['one-star-rating'],
      textareaLabel: placeholders['one-star-rating-text'],
      textareaInside: placeholders['one-star-rating-input'],
      feedbackRequired: true,
    },
    {
      class: 'two-stars',
      img: getIconElement('emoji-thinking-face'),
      text: placeholders['two-star-rating'],
      textareaLabel: placeholders['two-star-rating-text'],
      textareaInside: placeholders['two-star-rating-input'],
      feedbackRequired: true,
    },
    {
      class: 'three-stars',
      img: getIconElement('emoji-upside-down-face'),
      text: placeholders['three-star-rating'],
      textareaLabel: placeholders['three-star-rating-text'],
      textareaInside: placeholders['three-star-rating-input'],
      feedbackRequired: true,
    },
    {
      class: 'four-stars',
      img: getIconElement('emoji-smiling-face'),
      text: placeholders['four-star-rating'],
      textareaLabel: placeholders['four-star-rating-text'],
      textareaInside: placeholders['four-star-rating-input'],
      feedbackRequired: false,
    },
    {
      class: 'five-stars',
      img: getIconElement('emoji-star-struck'),
      text: placeholders['five-star-rating'],
      textareaLabel: placeholders['five-star-rating-text'],
      textareaInside: placeholders['five-star-rating-input'],
      feedbackRequired: false,
    },
  ];

  submissionTitle = placeholders['rating-submission-title'];
  submissionText = placeholders['rating-submission-text'];
});

function hasRated(sheet) {
  // dev mode: check use-rating query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('action-rated');
  if (param) {
    if (param === 'true') return true;
    if (param === 'false') return false;
  }

  // "production" mode: check for localStorage
  const ccxActionRatings = localStorage.getItem('ccxActionRatings');
  return (ccxActionRatings && ccxActionRatings.includes(sheet));
}

function determineActionUsed() {
  // dev mode: check action-used query parameter
  const u = new URL(window.location.href);
  const param = u.searchParams.get('action-used');
  if (param) {
    if (param === 'true') return true;
    if (param === 'false') return false;
  }

  // "production" mode: check for audience
  const audiences = Context.get('audiences');
  return (audiences && audiences.includes('24241150'));
}

function submitRating(sheet, rating, comment) {
  const content = {
    data: [
      {
        name: 'Segments',
        value: Context.get('audiences') ?? '',
      },
      {
        name: 'Locale',
        value: getLocale(window.location),
      },
      {
        name: 'Rating',
        value: rating,
      },
      {
        name: 'Timestamp',
        value: new Date().toLocaleString(),
      },
      {
        name: 'Comment',
        value: comment,
      },
    ],
  };

  fetch(`https://www.adobe.com/reviews-api/ccx${sheet}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });

  let ccxActionRatings = localStorage.getItem('ccxActionRatings');

  if (ccxActionRatings) {
    ccxActionRatings.push(sheet);
  } else {
    ccxActionRatings = [sheet];
  }

  localStorage.setItem('ccxActionRatings', ccxActionRatings);
}

// Updates the front-end style of the slider.
function updateSliderStyle($block, value) {
  const $input = $block.querySelector('input[type=range]');
  const $tooltip = $block.querySelector('.tooltip');
  const $sliderFill = $block.querySelector('.slider-fill');
  const thumbWidth = 60;
  const pos = (value - $input.getAttribute('min')) / ($input.getAttribute('max') - $input.getAttribute('min'));
  const thumbCorrect = (thumbWidth * (pos - 0.25) * -1) - 0.1;
  const titlePos = (pos * $input.offsetWidth) - (thumbWidth / 4) + thumbCorrect;
  $tooltip.style.left = `${titlePos}px`;
  $sliderFill.style.width = `${titlePos + (thumbWidth / 2)}px`;
}

// Implements the slider logic.
function sliderFunctionality($block) {
  const $input = $block.querySelector('input[type=range]');
  const $sliderFill = $block.querySelector('.slider-fill');
  const $tooltip = $block.querySelector('.tooltip');
  const $tooltipText = $block.querySelector('.tooltip--text');
  const $tooltipImg = $block.querySelector('.tooltip--image');
  const $textarea = $block.querySelector('.slider-comment textarea');
  const $textareaLabel = $block.querySelector('.slider-comment label');
  const $stars = Array.from($block.querySelectorAll('.stars'));
  const $submit = $block.querySelector('input[type=submit]');
  const $scrollAnchor = $block.querySelector('.ratings-scroll-anchor');
  const $commentBox = $block.querySelector('.slider-comment');

  // Updates the comment box
  function updateCommentBoxAndTimer() {
    const val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (val !== index) return;

    // To-do: hide submit button if feedback is optional
    // then show submit button if they start typing in the input field.

    // To-do timer functionality instead of submit for optional feedback.

    $commentBox.classList.add('submit--appear');
    // if (ratings[index - 1].feedbackRequired) {
    //   $commentBox.classList.add('submit--appear');
    // } else {
    //   $commentBox.classList.remove('submit--appear');
    // }

    $commentBox.classList.add('comment--appear');
  }
  // Updates the value of the slider and tooltip.
  function updateSliderValue(snap = true) {
    let val = parseFloat($input.value) ?? 0;
    const index = Math.round(val);
    if (snap) {
      val = index;
      $input.value = index;
      updateCommentBoxAndTimer();
    }
    $tooltipText.textContent = ratings[index - 1].text;
    $tooltipImg.innerHTML = '';
    $tooltipImg.appendChild(ratings[index - 1].img);
    $textareaLabel.textContent = ratings[index - 1].textareaLabel;
    $textarea.setAttribute('placeholder', ratings[index - 1].textareaInside);
    if (ratings[index - 1].feedbackRequired) {
      $textarea.setAttribute('required', 'true');
    } else {
      $textarea.removeAttribute('required');
    }
    ratings.forEach((obj) => $block.classList.remove(obj.class));
    $block.classList.add(ratings[index - 1].class);
    $block.classList.add('rated');
    updateSliderStyle($block, $input.value);
  }
  // Slider event listeners.
  $input.addEventListener('input', () => updateSliderValue(false));
  $input.addEventListener('change', () => updateSliderValue());
  let firstTimeInteract = true;
  function scrollToScrollAnchor() {
    if (firstTimeInteract) {
      setTimeout(() => {
        $scrollAnchor.scrollIntoViewIfNeeded(false);
      }, 450); // Allows for comment slide animation.
      firstTimeInteract = false;
    } else {
      $scrollAnchor.scrollIntoViewIfNeeded(false);
    }
  }
  $input.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
      $input.value -= 1;
      updateSliderValue();
      scrollToScrollAnchor();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
      $input.value += 1;
      updateSliderValue();
      scrollToScrollAnchor();
    }
  });
  ['mousedown', 'touchstart'].forEach((event) => {
    $input.addEventListener(event, () => {
      $tooltip.style.transition = 'none';
      $sliderFill.style.transition = 'none';
    });
  });
  ['mouseup', 'touchend'].forEach((event) => {
    $input.addEventListener(event, () => {
      $tooltip.style.transition = 'left .3s, right .3s';
      $sliderFill.style.transition = 'width .3s';
      //  remove next 3 lines after timer has been added.
      if (!$textarea.getAttribute('required')) {
        $submit.focus({ preventScroll: true });
      }
      scrollToScrollAnchor();
    });
  });
  window.addEventListener('resize', () => {
    updateSliderStyle($block, $input.value);
  });
  $stars.forEach(($star, index) => {
    $star.addEventListener('click', () => {
      $input.value = index + 1;
      updateSliderValue();
      scrollToScrollAnchor();
    });
  });
}

// Generates rating slider HTML.
function decorateRatingSlider(sheet, $block, title) {
  const $section = $block.closest('.section-wrapper');
  const $form = createTag('form');
  $block.appendChild($form);
  const $slider = createTag('div', { class: 'slider' });
  $form.appendChild($slider);
  const $input = createTag('input', {
    type: 'range', name: 'rating', id: 'rating', min: '1', max: '5', step: '0.001', value: '4.5', 'aria-labelledby': toClassName(title),
  });
  $slider.appendChild($input);
  // Initial state of the slider:
  $slider.insertAdjacentHTML('afterbegin', /* html */`
    <div class="tooltip">
      <div>
        <span class="tooltip--text"></span>
        <div class="tooltip--image">
          ${getIcon('emoji-star-struck')}
        <div>
      </div>
    </div>
  `);
  $slider.appendChild(createTag('div', { class: 'slider-fill' }));

  const submitButtonText = 'Submit rating'; // to-do: placeholders
  const star = getIcon('star');

  $form.insertAdjacentHTML('beforeend', /* html */`
    <div class="slider-bottom">
      <div class="vertical-line"><button type="button" aria-label="1" class="stars one-star">${star}</button></div>
      <div class="vertical-line"><button type="button" aria-label="2" class="stars two-stars">${star.repeat(2)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="3" class="stars three-stars">${star.repeat(3)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="4" class="stars four-stars">${star.repeat(4)}</button></div>
      <div class="vertical-line"><button type="button" aria-label="5" class="stars five-stars">${star.repeat(5)}</button></div>
    </div>
    <div class="slider-comment">
      <label for="comment"></label>
      <textarea id="comment" name="comment" rows="4" placeholder=""></textarea>
      <input type="submit" value="${submitButtonText}">
    </div>
    <div class="ratings-scroll-anchor"></div>
  `);

  // Form-submit event listener.
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rating = $input.value;
    const comment = $form.querySelector('#comment').value;

    submitRating(sheet, rating, comment);

    $block.innerHTML = /* html */`
    <h2>${submissionTitle}</h2>
    <p>${submissionText}</p>
    <div class="ratings-scroll-anchor"></div>`;

    if (window.scrollY > $section.offsetTop) window.scrollTo(0, $section.offsetTop - 64);
  });
  sliderFunctionality($block, $form);
}

function buildRatingSchema() {
  fetch('https://www.adobe.com/reviews-api/ccx/dev/remove-background.json')
    .then((response) => response.json())
    .then((response) => {
      // actually build the schema.
    });
}

export default function decorate($block) {
  const $title = $block.querySelector('h2');
  const $CTA = $block.querySelector('a');
  const $sheet = $block.querySelector('strong');
  const sheet = $sheet.textContent;
  const title = $title ? $title.textContent : 'Rate our Quick Action';
  const $h2 = createTag('h2', { id: toClassName(title) });
  const star = getIcon('star');
  const $stars = createTag('span', { class: 'rating-stars' });

  $CTA.classList.add('xlarge');
  $block.innerHTML = '';
  $h2.textContent = title;
  $stars.innerHTML = `${star.repeat(5)}`;
  $h2.appendChild($stars);
  $block.appendChild($h2);

  const actionRated = hasRated(sheet);
  const actionUsed = determineActionUsed();

  if (actionUsed) {
    decorateRatingSlider(sheet, $block, title);
  } else if (actionRated) {
    $block.innerHTML = /* html */`
    <h2>You've already submitted your feedback for this action</h2>
    <p>We have taken your feedback into consideration, and hope that you will continue to use our products in the future.</p>
    <div class="ratings-scroll-anchor"></div>`;
  } else {
    const $div = createTag('div', { class: 'cannot-rate' });
    const $p = createTag('p');
    $p.textContent = 'You need to use the Quick Action before you can rate it.'; // to-do: placeholders
    $div.appendChild($p);
    $div.appendChild($CTA);
    $block.appendChild($div);
    $block.appendChild(createTag('div', { class: 'ratings-scroll-anchor' }));
  }

  buildRatingSchema();
}
