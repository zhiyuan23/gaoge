Component({
  properties: {
    showBack: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '',
    },
  },
  data: {
    statusBarHeight: 0,
  },
  lifetimes: {
    attached() {
      const windowInfo = wx.getWindowInfo()
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight,
      })
    },
  },
  methods: {
    onBack() {
      this.triggerEvent('back')
    },
  },
})
