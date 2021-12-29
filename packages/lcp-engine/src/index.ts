import workspace from './workspace';
const works = workspace();
import './index.less'

const root = document.querySelector('#root');
if (root) {
  root.innerHTML = `
<div class="name">
not green
<span class="test-a">blue</span>
</div>
<div class="test">
<span class="name">green</span>
${works}
</div>
`
}

if (module && module.hot) {
  module.hot.accept();
}
export {}