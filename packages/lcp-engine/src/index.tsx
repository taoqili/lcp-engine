import React from "react";
import ReactDom from "react-dom"
import "./index.less"
import engine from './engine'
import svg from './test.svg'

// test doc
ReactDom.render(
  <div className={'test'}>
    <p>red</p>
    <p className={'name'}>green</p>
    <p className={'test-a'}>blue</p>
    <p>{engine('hello')}</p>
    <img src={svg} alt=""/>
  </div>,
  document.getElementById('root')
)

if (module && module.hot) {
  module.hot.accept();
}