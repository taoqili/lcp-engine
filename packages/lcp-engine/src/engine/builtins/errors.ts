import logger from '@ali/vu-logger';

logger.setLogMap({
  ERROR_PROP_VALUE: {
    doc: 'https://lark.alipay.com/vision/log/error_set_hot_value',
    en_US: 'Component property setting error',
    title: 'ERROR',
    type: 'error',
    zh_CN: '组件属性设置 / 初始化错误',
  },
  ERROR_PAGE_RENDER: {
    doc: 'https://lark.alipay.com/vision/log/error_page_render',
    en_US: 'Visual page render error',
    title: 'ERROR',
    type: 'error',
    zh_CN: '可视化编辑区域页面渲染出错，对应的解决方法请',
  },
  ERROR_COMPONENT_RENDER: {
    doc: 'https://lark.alipay.com/vision/log/error_component_render',
    en_US: 'Component rendering error',
    title: 'ERROR',
    type: 'error',
    zh_CN: '组件在设计器中渲染出错'
  },
  ERROR_NO_PROTOTYPE_VIEW: {
    doc: 'https://yuque.antfin-inc.com/vision/log/aa4mnl',
    zh_CN: '组件视图无 displayName',
    en_US: 'componentView should have displayName',
    title: 'ERROR',
    type: 'error',
  },
  ERROR_NO_COMPONENT_VIEW: {
    doc: 'https://yuque.antfin-inc.com/vision/log/aa4mnl',
    zh_CN: '组件无视图',
    en_US: 'componentView is lost',
    title: 'ERROR',
    type: 'error'
  }
});
