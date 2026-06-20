export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/publish/index',
    'pages/schedule/index',
    'pages/feedback/index',
    'pages/preview/index',
    'pages/schedule-setting/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAF5FF',
    navigationBarTitleText: '同人电子刊',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '作品库'
      },
      {
        pagePath: 'pages/publish/index',
        text: '新刊发布'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '档期管理'
      },
      {
        pagePath: 'pages/feedback/index',
        text: '读者反馈'
      }
    ]
  }
})
