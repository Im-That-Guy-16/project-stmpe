// ==UserScript==
// @name         STMPE RED-Enriched
// @namespace    https://Im-That-Guy-16.github.io/project-stmpe/Redacted/
// @version      0.1.0
// @description  REDacted enhancements for Project STMPE. Restores a compact BBCode toolbar on quick reply/comment editors.
// @author       Prism16
// @match        *://redacted.sh/*
// @match        *://www.redacted.sh/*
// @updateURL    https://Im-That-Guy-16.github.io/project-stmpe/Redacted/RED-Enriched.user.js
// @downloadURL  https://Im-That-Guy-16.github.io/project-stmpe/Redacted/RED-Enriched.user.js
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const TOOLBAR_ID = 'Bbcode_Toolbar';
  const ENHANCED_ATTR = 'data-stmpe-bbcode-enhanced';

  const BUTTONS = [
    { cls: 'js-bbcode-toolbar__bold-button', title: 'Bold', before: '[b]', after: '[/b]', sample: 'bold text' },
    { cls: 'js-bbcode-toolbar__italic-button', title: 'Italic', before: '[i]', after: '[/i]', sample: 'italic text' },
    { cls: 'js-bbcode-toolbar__underline-button', title: 'Underline', before: '[u]', after: '[/u]', sample: 'underlined text' },
    { cls: 'js-bbcode-toolbar__strikethrough-button', title: 'Strikethrough', before: '[s]', after: '[/s]', sample: 'struck text' },
    { cls: 'js-bbcode-toolbar__link-button', title: 'Link', before: '[url]', after: '[/url]', sample: 'https://example.com' },
    { cls: 'js-bbcode-toolbar__image-button', title: 'Image', before: '[img]', after: '[/img]', sample: 'https://example.com/image.jpg' },
    { cls: 'js-bbcode-toolbar__quote-button', title: 'Quote', before: '[quote]', after: '[/quote]', sample: 'quoted text' },
    { cls: 'js-bbcode-toolbar__spoiler-button', title: 'Spoiler', before: '[spoiler]', after: '[/spoiler]', sample: 'spoiler text' },
    { cls: 'js-bbcode-toolbar__hide-button', title: 'Hide', before: '[hide]', after: '[/hide]', sample: 'hidden text' },
    { cls: 'js-bbcode-toolbar__code-button', title: 'Code', before: '[code]', after: '[/code]', sample: 'code' },
    { cls: 'js-bbcode-toolbar__mediainfo-button', title: 'Mediainfo', before: '[mediainfo]', after: '[/mediainfo]', sample: 'mediainfo block' },
    { cls: 'js-bbcode-toolbar__align-center-button', title: 'Center', before: '[align=center]', after: '[/align]', sample: 'centered text' },
    { cls: 'js-bbcode-toolbar__align-right-button', title: 'Right align', before: '[align=right]', after: '[/align]', sample: 'right aligned text' },
    { cls: 'js-bbcode-toolbar__youtube-button', title: 'YouTube', before: '[youtube]', after: '[/youtube]', sample: 'video id or url' },
    { cls: 'js-bbcode-toolbar__emoticon-button', title: 'Smile', insert: ' :)' }
  ];

  function wrapSelection(textarea, button) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const value = textarea.value || '';
    const selected = value.slice(start, end);
    const replacement = button.insert || `${button.before}${selected || button.sample || ''}${button.after}`;

    textarea.value = value.slice(0, start) + replacement + value.slice(end);
    textarea.focus();

    if (button.insert) {
      const pos = start + replacement.length;
      textarea.setSelectionRange(pos, pos);
      return;
    }

    const innerStart = start + button.before.length;
    const innerEnd = innerStart + (selected || button.sample || '').length;
    textarea.setSelectionRange(innerStart, innerEnd);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function wrapList(textarea) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const value = textarea.value || '';
    const selected = value.slice(start, end) || 'list item';
    const lines = selected.split(/\r?\n/).map((line) => `[*]${line || 'list item'}`).join('\n');
    const replacement = `[list]\n${lines}\n[/list]`;

    textarea.value = value.slice(0, start) + replacement + value.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start + 7, start + 7 + lines.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function makeButton(textarea, button) {
    const link = document.createElement('a');
    link.href = '#';
    link.title = button.title;
    link.setAttribute('aria-label', button.title);

    const control = document.createElement('span');
    control.className = `bbcode-toolbar__button ${button.cls}`;
    control.textContent = button.title;
    link.appendChild(control);

    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (button.action === 'list') {
        wrapList(textarea);
      } else {
        wrapSelection(textarea, button);
      }
    });

    return link;
  }

  function buildToolbar(textarea) {
    const toolbar = document.createElement('div');
    toolbar.id = document.getElementById(TOOLBAR_ID) ? '' : TOOLBAR_ID;
    toolbar.className = 'stmpe-red-bbcode-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'BBCode toolbar');

    BUTTONS.forEach((button) => toolbar.appendChild(makeButton(textarea, button)));
    toolbar.appendChild(makeButton(textarea, {
      cls: 'js-bbcode-toolbar__list-button',
      title: 'List',
      action: 'list'
    }));

    const help = document.createElement('a');
    help.href = 'wiki.php?action=article&id=95';
    help.target = '_blank';
    help.rel = 'noopener';
    help.title = 'BBCode help';
    help.setAttribute('aria-label', 'BBCode help');

    const helpIcon = document.createElement('span');
    helpIcon.className = 'bbcode-toolbar__button';
    helpIcon.textContent = 'Help';
    help.appendChild(helpIcon);
    toolbar.appendChild(help);

    return toolbar;
  }

  function enhanceTextarea(textarea) {
    if (!textarea || textarea.hasAttribute(ENHANCED_ATTR)) return;
    textarea.setAttribute(ENHANCED_ATTR, 'true');

    const wrapper = textarea.closest('.textarea_wrap, .field_div') || textarea.parentElement;
    if (!wrapper || wrapper.querySelector(`#${TOOLBAR_ID}, .stmpe-red-bbcode-toolbar`)) return;

    wrapper.insertBefore(buildToolbar(textarea), textarea);
  }

  function enhanceEditors() {
    document
      .querySelectorAll('#quickpost, #quickpostform textarea[name="body"], textarea[name="body"]')
      .forEach(enhanceTextarea);
  }

  enhanceEditors();

  const observer = new MutationObserver(enhanceEditors);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
