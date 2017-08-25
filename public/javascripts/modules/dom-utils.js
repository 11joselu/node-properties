export const createItem = (x, strClasses = 'panel__info__item') => {
  return `<li class="${strClasses}">${x}</li>`;
};

export const removeLoading = (klass = '.loading') => {
  $ (klass).remove ();
};

export const createLoadingComponent = () => {
  return `<div class="loading">
    <svg class="loading__spinner" width="15px" height="15px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
      <circle class="loading__spinner__path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
    </svg>
  </div>`;
};

export const createLink = (href, text, strClasses) => {
  return `
    <a href="${href}" class="${strClasses}">${text}</a>
  `;
};
