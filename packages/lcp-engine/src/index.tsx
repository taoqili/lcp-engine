import React from "react";
import ReactDOM from "react-dom"
import "./index.less"
import engine from './engine'
import icon from './icon.svg'

const handleOnClick = () => {
  import('./utils').then(module => {
    const str = module.default('时光')
    const node = document.createElement('div')
    node.innerHTML='<span>'+ str +'</span>'
    document.body.appendChild(node)
  })
}

ReactDOM.render(
  <div className={'test'}>
    <p>red</p>
    <p className={'name'}>green</p>
    <p className={'test-a'}>blue</p>
    <p>{engine('hello')}</p>
    <div onClick={handleOnClick}>异步模块加载</div>
    <br/>
    <img src={icon} alt="" width={32}/>
  </div>,
  document.getElementById('root')
)

if (module && module.hot) {
  module.hot.accept();
}