import React from "react";
import ReactDom from "react-dom"
import "./index.less"
import engine from './engine'
import svg from './test.svg'

const handleOnClick = () => {
  import('./utils').then(module => {
    const str = module.default('时光')
    const node = document.createElement('div')
    node.innerHTML='<span>'+ str +'</span>'
    document.body.appendChild(node)
  })
}

ReactDom.render(
  <div className={'test'}>
    <p>red</p>
    <p className={'name'}>green1</p>
    <p className={'test-a'}>blue1</p>
    <p>{engine('hello')}</p>
    <img src={svg} alt=""/>
    <div onClick={handleOnClick}>异步模块加载</div>
  </div>,
  document.getElementById('root')
)

if (module && module.hot) {
  module.hot.accept();
}