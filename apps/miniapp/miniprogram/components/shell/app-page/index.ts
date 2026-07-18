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
  methods: {
    onNavBack() {
      const pages = getCurrentPages()

      if (pages.length > 1) {
        wx.navigateBack()
        return
      }

      wx.reLaunch({
        url: '/pages/home/index',
      })
    },
  },
})
