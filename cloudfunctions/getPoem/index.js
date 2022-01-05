const cloud = require('wx-server-sdk')
const request = require('request');
const cheerio = require('cheerio');

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  function getPoem(keywords) {
    return new Promise((resolve, reject) => {
      request.post({
          url: 'https://sou-yun.cn/QueryPoem.aspx',
          form: {
            _ContentKeys: keywords,
            KeywordTextBox: keywords,
            QueryButton:"检索",
            Scope: "FullScope",
            SearchOnlyInClauseIndex: 0,
            StartInClause: 0,
            DynastyOption: 0,
            PTypeOption: "Jue"
          }
      }, (err, res, body) => {
          if (res && res.statusCode === 200) {
              var $ = cheerio.load(body);
              var poem = $('._poem').first();
              var title = poem.children('.poemTitle')
              var content = poem.children('.poemContent')
              
              var poemTitle = title.children().first().text();
              var author = title.children().first().next().text();
      
              var sentence = content.children().first().text();
              var sentences = sentence.substr(0, sentence.length-1).split("，")
              sentence = content.children().first().next().next().text()
              sentences = sentences.concat(sentence.substr(0, sentence.length-1).split("，"));
              resolve({
                title: poemTitle,
                author: author,
                sentences: sentences
              });
          } else {
              reject({error: err+res.statusCode});
          }
      });
    })
  }

  const poem = await getPoem(event.key)
  return poem
}
