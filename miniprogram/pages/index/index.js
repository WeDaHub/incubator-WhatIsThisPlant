//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    hasUserInfo: false,
    logged: false,
    takeSession: false,
    requestResult: '',
    canIUseGetUserProfile: false,
    canIUseOpenData: false,
    db: wx.cloud.database(),
  },

  getUserInfoByOpenId: async function(_openid){
    return new Promise((resolve, reject) => {
      this.data.db.collection('user').where({
        _openid: _openid,
      })
      .get()
    })
  },

  onLoad: function() {
    // if (wx.getUserProfile) {
    //   this.setData({
    //     canIUseGetUserProfile: true,
    //   })
    // }
    wx.getStorage({
      key: "userInfo",
      success: (res) => {
        console.log("cache data:", res.data);
        this.setData({
          logged: true,
          avatarUrl: res.data.avatarUrl,
          userInfo: res.data,
          hasUserInfo: true,
        })
      },
      fail: (res) => {
        // not found userinfo in cache
      }
    });
    
       
  },
  onShareAppMessage: function () {
  },
  
  getUserProfile: function() {
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途
      success: (res) => {
        console.log("auth data:", res.userInfo)
        this.setData({
          avatarUrl: res.userInfo.avatarUrl,
          userInfo: res.userInfo,
          hasUserInfo: true,
        })

        wx.setStorage({
          key: "userInfo",
          data: res.userInfo,
        })

        this.data.db.collection('user').where({
          _openid: res.userInfo._openid,
        }).get().then((e)=>{
          if(e.data.length == 0){
            this.data.db.collection('user').add({
              data: res.userInfo,
            })
          }
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    if(!this.data.hasUserInfo){
      this.getUserProfile();
      return;
    }
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        wx.showLoading({
          title: '上传中',
        })

        function getAccessToken() {
          return new Promise((resolve, reject) => {
            wx.request({
              url: 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=FxKcPh3ilWjZIjUnlXfvfM4g&client_secret=bgz4qoxgp3TlU8LqNIGQAhO3W2lXi0ma',
              header: {
                'content-type': 'application/x-www-form-urlencoded' // 默认值
              },
              success: res => {
                resolve(res.data["access_token"])
              },
              fail: err =>{
                reject(err)
              }
            })
          })
        }
        
        function imageToBase64(filePath){
          return new Promise((resolve, reject) => {
            wx.getFileSystemManager().readFile({
              filePath: filePath, 
              encoding: 'base64',
              success: res =>{
                resolve(res.data)
              },
              fail: err => {
                reject(err)
              }
            })
          })
        }
        // 发送图片到百度云识别植物名字
        function getPlantName(accessToken, base64) {
          return new Promise((resolve, reject) => {
            wx.request({
              url: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/plant'+ "?access_token=" + accessToken,
              header: {
                'Content-Type': 'multipart/application/x-www-form-urlencoded;charset=utf-8'
              },
              method: "POST",
              data: {
                'image': base64,
                'baike_num': 10
              },
              success: res => {
                resolve(res.data)
              },
              fail: err => {
                reject(err)
              }
            })
          })
        }

        function guid() {
          function S4() {
             return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
          }
          return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        }

        // 上传到云存储
        function uploadToStorage(filePath) {
          return new Promise((resolve, reject) => {
            const cloudPath = `img-${guid()}${filePath.match(/\.[^.]+?$/)[0]}`
            wx.cloud.uploadFile({
              cloudPath,
              filePath,
              success: res => {
                console.log('[上传文件] 成功：', res)
                resolve({"fileID": res.fileID, "imagePath": filePath, "cloudPath": cloudPath})
              },
              fail: e => {
                console.error('[上传文件] 失败：', e)
                reject(e)
              }
            })
          })
        }

        async function uploadToBaidu() {
          const accessToken = await getAccessToken()
          const base64 = await imageToBase64(res.tempFilePaths[0])
          const plantName = await getPlantName(accessToken, base64)
          console.log("plantName:", plantName["result"])
          return plantName["result"]
        }
        
        async function upload(){
          const [plant, data] = await Promise.all([uploadToBaidu(), uploadToStorage(res.tempFilePaths[0])]);
          app.globalData.fileID = data.fileID
          app.globalData.cloudPath = data.cloudPath
          app.globalData.imagePath = res.tempFilePaths[0]
          app.globalData.plant = plant
          wx.hideLoading();
          wx.navigateTo({
            url: '../result/result'
          })
        }
        upload()
      },
      fail: e => {
        console.error(e)
      }
    })
  },

})
