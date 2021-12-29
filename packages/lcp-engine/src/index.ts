import workspace from './workspace';
const works = workspace();
import './index.css'

const root = document.querySelector('#root');
if (root) {
  root.innerHTML = `<div class="test">${works}</div>`
}

if (module && module.hot) {
  module.hot.accept();
}
export {}