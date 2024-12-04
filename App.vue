<script>
// #ifdef H5
// H5使用CDN引入
import AV from 'https://cdn.jsdelivr.net/npm/leancloud-storage@4.15.2/+esm'
// #endif
// #ifdef MP-WEIXIN
const AV = require('./static/libs/av-core-min.js')
const adapters = require('./static/libs/leancloud-adapters-weapp.min.js')
AV.setAdapters(adapters)
// #endif
// #ifdef APP
import AV from "leancloud-storage/dist/av-weapp.js"
// #endif

// 初始化 LeanCloud，请使用自己的参数，具体查看LeanCloud文档。
AV.init({
  appId: 'XzhLvXQfj46b0PAlXN7f3TsF-gzGzoHsz',
  appKey: '2irmEL4eq5hncmQPUkjul0XA',
  serverURL: 'https://xzhlvxqf.lc-cn-n1-shared.com'
})

// console.log(AV)

export default {
  globalData: {
    AV
  },
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  onError(error) {
    uni.showModal({
      title: error
    })
  }
}
</script>

<style>
/*每个页面公共css */
page,
.page {
  background-color: #ffffff;
  box-sizing: border-box;
  height: 100%;
}

/* CSS Reset for UniApp */
view,
scroll-view,
swiper,
swiper-item,
cover-view,
cover-image,
icon,
text,
rich-text,
progress,
button,
checkbox,
form,
input,
label,
radio,
slider,
switch,
textarea,
navigator,
audio,
camera,
image,
video {
  box-sizing: border-box;
}

/* Remove default margins and paddings */
view,
text {
  margin: 0;
  padding: 0;
}

/* Reset button styles */
button {
  margin: 0;
  padding: 0;
  line-height: 1;
  background: none;
  border: none;
  border-radius: 0;
  outline: none;
}

button::after {
  border: none;
}

/* Reset input styles */
input {
  outline: none;
  border: none;
  margin: 0;
  padding: 0;
  min-height: auto;
}

/* Reset scroll-view styles */
scroll-view {
  -webkit-overflow-scrolling: touch;
}

/* Reset image styles */
image {
  display: block;
  height: auto;
}
</style>
