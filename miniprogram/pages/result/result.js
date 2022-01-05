// pages/result/result.js

const app = getApp()

Page({

  data: {
    fileID: '',
    cloudPath: '',
    imagePath: '',
    plant: '',
    index: 0,
    db: wx.cloud.database(),
  },

  onShareAppMessage: function () {
  },

  onLoad: function (options) {
    const {
      fileID,
      cloudPath,
      imagePath,
      plant
    } = app.globalData
    for (var i = 0; i < plant.length; i++){
      plant[i].baike = JSON.stringify(plant[i].baike_info);
    }
    this.setData({
      fileID,
      cloudPath,
      imagePath,
      plant
    })

    const current_datetime = new Date()
    const formattedDate = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()

    wx.getStorage({
      key: "userInfo",
      success: (res) => {
        var data = res.data;
        data.uploadTime = formattedDate;
        data.imagePath  = this.data.cloudPath
        this.data.db.collection('upload_history').add({
          data: data,
        })
      }
    });
  },
  onSlideChangeEnd: function (e) {
    this.setData({
      index: e.detail.current
    })
  },
  openDetails: function(){
      //app.globalData.current_plant = this.data.plant[this.data.index]
      var description;
      if(this.data.plant[this.data.index].baike_info.description==undefined){
        description="";
      }else{
        description = this.data.plant[this.data.index].baike_info.description;
      }
      wx.navigateTo({
        url: '../details/details'+'?plantName='+this.data.plant[this.data.index].name+
        '&plantDescription='+description+'&imagePath='+app.globalData.imagePath
      })
      // wx.showLoading({
      //   title: '加载中',
      // })
      // wx.cloud.callFunction({
      //   name: 'getPoem',
      //   data: {
      //     key:  app.globalData.current_plant.name
      //   },
      //   success: function(res) {
      //     app.globalData.poem = res.result;
      //     wx.hideLoading();
      //     wx.navigateTo({
      //       url: '../details/details'+'?id=1111111'
      //     })
      //   },
      //   fail: function (e){
      //     console.log("get poem error:",e);
      //     wx.hideLoading();
      //     wx.showToast({
      //       title: '网络错误',
      //       icon: 'error',
      //       duration: 1500
      //     })
      //   }
      // })
  }
})
