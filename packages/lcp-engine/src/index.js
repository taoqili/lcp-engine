
console.log('Hello, world!')
document.querySelector('#root').innerHTML = '<div>Hello, world!</div>'
if (module && module.hot) {
  module.hot.accept();
}