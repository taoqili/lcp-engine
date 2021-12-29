import workspace from './workspace';
const works = workspace();

const root = document.querySelector('#root');
if (root) {
  root.innerHTML = `<div>${works}</div>`
}

if (module && module.hot) {
  module.hot.accept();
}
export {}