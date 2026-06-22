export default defineAppConfig({
  pages: [
    'pages/dashboard/index',
    'pages/versions/index',
    'pages/monitor/index',
    'pages/alerts/index',
    'pages/version-detail/index',
    'pages/version-create/index',
    'pages/sdk-doc/index',
    'pages/alert-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165DFF',
    navigationBarTitleText: '灰度监测',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F6F7'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/dashboard/index',
        text: '仪表盘'
      },
      {
        pagePath: 'pages/versions/index',
        text: '版本管理'
      },
      {
        pagePath: 'pages/monitor/index',
        text: '性能监控'
      },
      {
        pagePath: 'pages/alerts/index',
        text: '告警中心'
      }
    ]
  }
})
