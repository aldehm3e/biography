# NDS Component Toolkit Notes

This folder contains reusable frontend component source copied from the local NDS reference folder for this project.

Use it as a local implementation reference for future updates. Do not edit files in the original NDS reference folder.

Common component entry points:

- Accordion: `scss/_accordion.scss`, `js/nds-accordion.js`
- Tabs: `scss/_tabs.scss`, `js/nds-tabs.js`
- Avatar: `scss/_avatar.scss`
- Cards: `scss/_cards.scss`
- Buttons: `scss/_buttons.scss`
- Forms and inputs: `scss/_forms.scss`, `js/nds-forms.js`
- Navigation: `scss/_mainnav.scss`, `js/nds-mainnav.js`

Minimal markup reminders:

```html
<!-- Accordion -->
<div class="nds-accordion">
  <button class="nds-accordion-trigger" type="button" aria-expanded="false">
    <span class="nds-label">عنوان</span>
  </button>
  <div class="nds-accordion-content" hidden>محتوى</div>
</div>

<!-- Tabs -->
<div class="nds-tabs">
  <nav class="nds-tab-list" role="tablist">
    <button class="nds-btn nds-subtle nds-tab" role="tab" aria-selected="true">تبويب</button>
  </nav>
  <div class="nds-tab-panel" role="tabpanel">محتوى</div>
</div>

<!-- Avatar -->
<div class="nds-avatar">
  <img src="assets/images/avatar.jpg" alt="">
</div>
```

Keep public pages clean. Add visible component examples only when they are part of the real website content.
