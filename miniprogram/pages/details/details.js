// pages/details/details.js

const app = getApp()

Page({

  data: {
    plantDescription: '',
    plangName: '',
    imagePath: '',
    poem: '',
  },

  onShareAppMessage: function () {
    const path = '/pages/details/details'+'?plantName='+this.data.plantName+
    '&plantDescription='+this.data.plantDescription+'&imagePath='+app.globalData.fileID
    console.log("path:", path);
    return {
      title: '慧眼识花草',
      path: path
    }
  },

  onLoad: function (options) {
      var that = this
      console.log(options);

      that.setData({
        plantDescription: options.plantDescription,
        plantName: options.plantName,
        imagePath: options.imagePath,
      })

      wx.showLoading({
        title: '加载中',
        mask:true 
      })
      
      wx.cloud.callFunction({
        name: 'getPoem',
        data: {
          key:  options.plantName
        },
        success: function(res) {
          that.setData({
            poem: res.result,
          })
          wx.hideLoading();
        },
        fail: function (e){
          console.log("get poem error:",e);
          wx.hideLoading();
          wx.showToast({
            title: '网络错误',
            icon: 'error',
            duration: 1500
          })
        }
      })
  },
})

