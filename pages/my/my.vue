<template>
  <view class="page">
    <!-- 未登录状态 -->
    <template v-if="!userInfoRef">
      <!-- 登录表单 -->
      <view
        class="auth-card"
        v-if="currentViewRef === 'login'">
        <view class="card-title">登录</view>
        <input
          class="auth-input"
          type="text"
          placeholder="邮箱"
          v-model="emailRef"
          placeholder-class="input-placeholder" />
        <input
          class="auth-input"
          type="password"
          placeholder="密码"
          v-model="passwordRef"
          placeholder-class="input-placeholder" />
        <button
          class="auth-button"
          @click="onLogin">
          登录
        </button>
        <view class="auth-links">
          <text
            class="auth-link"
            @click="onSwitchView({ view: 'register' })">
            注册账号
          </text>
          <text
            class="auth-link"
            @click="onSwitchView({ view: 'resetPassword' })">
            忘记密码
          </text>
        </view>
      </view>

      <!-- 注册表单 -->
      <view
        class="auth-card"
        v-else-if="currentViewRef === 'register'">
        <view class="card-title">注册</view>
        <input
          class="auth-input"
          type="text"
          placeholder="邮箱"
          v-model="emailRef"
          placeholder-class="input-placeholder" />
        <input
          class="auth-input"
          type="password"
          placeholder="密码"
          v-model="passwordRef"
          placeholder-class="input-placeholder" />
        <input
          class="auth-input"
          type="password"
          placeholder="确认密码"
          v-model="confirmPasswordRef"
          placeholder-class="input-placeholder" />
        <button
          class="auth-button"
          @click="onRegister">
          注册
        </button>
        <view class="auth-links">
          <text
            class="auth-link"
            @click="onSwitchView({ view: 'login' })">
            返回登录
          </text>
        </view>
      </view>

      <!-- 重置密码表单 -->
      <view
        class="auth-card"
        v-else>
        <view class="card-title">重置密码</view>
        <input
          class="auth-input"
          type="text"
          placeholder="邮箱"
          v-model="emailRef"
          placeholder-class="input-placeholder" />
        <button
          class="auth-button"
          @click="onResetPassword">
          发送重置邮件
        </button>
        <view class="auth-links">
          <text
            class="auth-link"
            @click="onSwitchView({ view: 'login' })">
            返回登录
          </text>
        </view>
      </view>
    </template>

    <!-- 已登录状态 -->
    <template v-else>
      <!-- 个人信息卡片 -->
      <view class="card">
        <view class="card-title">个人信息</view>
        <view class="info-item">
          <text class="info-label">用户名</text>
          <text class="info-value">{{ userInfoRef.username }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">邮箱</text>
          <text class="info-value">{{ userInfoRef.email }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">会员</text>
          <text class="info-value">{{ userInfoRef.isVip ? '会员用户' : '普通用户' }}</text>
        </view>
      </view>

      <!-- 会员卡片 -->
      <view
        class="card"
        v-if="!userInfoRef.isVip">
        <view class="card-title">开通会员</view>
        <view class="vip-options">
          <!-- 月度会员 -->
          <view
            class="vip-option"
            @click="onSelectVip('month')">
            <view class="option-header">
              <text class="option-title">月度会员</text>
              <view class="option-price">
                <text class="price-number">6</text>
                <text class="price-unit">元/月</text>
              </view>
            </view>
            <view
              class="option-selected"
              v-if="selectedVipType === 'month'">
              <text class="selected-icon">✓</text>
            </view>
          </view>

          <!-- 永久会员 -->
          <view
            class="vip-option"
            @click="onSelectVip('forever')">
            <view class="option-header">
              <text class="option-title">永久会员</text>
              <view class="option-price">
                <text class="price-number">98</text>
                <text class="price-unit">元</text>
              </view>
            </view>
            <view
              class="option-selected"
              v-if="selectedVipType === 'forever'">
              <text class="selected-icon">✓</text>
            </view>
          </view>
        </view>

        <view class="vip-benefits">
          <text class="benefit-item">• 发帖无限制</text>
          <text class="benefit-item">• 评论无限制</text>
        </view>
        <view class="vip-tips">普通用户每天只能发1条帖子和1条评论</view>
        <button
          class="vip-button"
          @click="onBuyVip">
          立即开通{{ selectedVipType === 'forever' ? '永久会员' : '月度会员' }}
        </button>
      </view>

      <!-- 修改密码按钮 -->
      <button
        class="change-password-btn"
        @click="onChangePassword">
        修改密码
      </button>

      <!-- 退出登录按钮 -->
      <button
        class="logout-btn"
        @click="onLogout">
        退出登录
      </button>
    </template>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Request from '@/static/scripts/request'

const AV = getApp().globalData.AV
const userInfoRef = ref(null)
const currentViewRef = ref('login') // login, register, resetPassword
const emailRef = ref('')
const passwordRef = ref('')
const confirmPasswordRef = ref('')
const selectedVipType = ref('month') // 'month' 或 'forever'

// 检查登录状态
async function onCheckLoginStatus() {
  try {
    const currentUser = AV.User.current()
    if (currentUser) {
      userInfoRef.value = {
        username: currentUser.get('username'),
        email: currentUser.get('email'),
        avatar: currentUser.get('avatar'),
        isVip: currentUser.get('isVip') || false
      }
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
  }
  return Promise.resolve()
}

// 登录
async function onLogin() {
  if (!emailRef.value || !passwordRef.value) {
    uni.showToast({
      title: '请填写完整登录信息',
      icon: 'none'
    })
    return Promise.resolve()
  }

  try {
    const user = await AV.User.loginWithEmail(emailRef.value, passwordRef.value)
    userInfoRef.value = {
      username: user.get('username'),
      email: user.get('email'),
      avatar: user.get('avatar'),
      isVip: user.get('isVip') || false
    }
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  }
  return Promise.resolve()
}

// 注册
async function onRegister() {
  if (!emailRef.value || !passwordRef.value || !confirmPasswordRef.value) {
    uni.showToast({
      title: '请填写完整注册信息',
      icon: 'none'
    })
    return Promise.resolve()
  }

  if (passwordRef.value !== confirmPasswordRef.value) {
    uni.showToast({
      title: '两次密码输入不一致',
      icon: 'none'
    })
    return Promise.resolve()
  }

  try {
    const user = new AV.User()
    user.setUsername(emailRef.value.split('@')[0])
    user.setPassword(passwordRef.value)
    user.setEmail(emailRef.value)

    await user.signUp()
    userInfoRef.value = {
      username: user.get('username'),
      email: user.get('email'),
      avatar: '',
      isVip: false
    }
    uni.showToast({
      title: '注册成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: error.message || '注册失败',
      icon: 'none'
    })
  }
  return Promise.resolve()
}

// 重置密码
async function onResetPassword() {
  if (!emailRef.value) {
    uni.showToast({
      title: '请输入邮箱',
      icon: 'none'
    })
    return Promise.resolve()
  }

  try {
    await AV.User.requestPasswordReset(emailRef.value)
    uni.showToast({
      title: '重置密码邮件已发送',
      icon: 'success'
    })
    currentViewRef.value = 'login'
  } catch (error) {
    uni.showToast({
      title: error.message || '重置密码失败',
      icon: 'none'
    })
  }
  return Promise.resolve()
}

// 切换视图
function onSwitchView({ view }) {
  currentViewRef.value = view
  emailRef.value = ''
  passwordRef.value = ''
  confirmPasswordRef.value = ''
  return Promise.resolve()
}

// 修改密码
async function onChangePassword() {
  try {
    const user = AV.User.current()
    if (!user) {
      throw new Error('用户未登录')
    }

    // 发送重置密码邮件
    await AV.User.requestPasswordReset(user.getEmail())

    uni.showToast({
      title: '重置密码邮件已发送',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none'
    })
  }
}

function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        AV.User.logOut()
        userInfoRef.value = null
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })
      }
    }
  })
  return Promise.resolve()
}

// 选择会员类型
function onSelectVip(type) {
  selectedVipType.value = type
  return Promise.resolve()
}

// 购买会员
async function onBuyVip() {
  const price = selectedVipType.value === 'forever' ? 98 : 6
  const type = selectedVipType.value === 'forever' ? '永久会员' : '月度会员'
  const productId = selectedVipType.value === 'forever' ? 'forevervip' : 'monthvip'

  try {
    // 1. 检查登录状态
    const currentUser = AV.User.current()
    if (!currentUser) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return Promise.resolve()
    }

    // 2. 确认购买

    const ret = await uni.showModal({
      title: '开通会员',
      content: `确定要开通${type}吗？仅需${price}元`
    })

    if (!ret.confirm) {
      return Promise.resolve()
    }

    // 3. 调用支付
    // #ifdef APP-PLUS
    if (uni.getSystemInfoSync().platform !== 'ios') {
      uni.showToast({
        title: '请在iOS设备上购买',
        icon: 'none'
      })
      return Promise.resolve()
    }

    uni.showLoading({
      title: '正在创建订单...'
    })

    try {
      const { providers } = await uni.getProvider({
        service: 'payment'
      })

      console.log(providers)

      const iapChannel = providers.find((p) => p.id === 'appleiap')

      console.log(iapChannel)

      // 3.1 创建订单
      // const order = new AV.Object('Order')
      // order.set('user', currentUser)
      // order.set('productId', productId)
      // order.set('amount', price)
      // order.set('status', 'pending')
      // await order.save()

      const productRet = await new Promise((resolve, reject) => {
        iapChannel.requestProduct(
          [productId],
          (res) => {
            resolve(res)
          },
          (err) => {
            reject(err)
          }
        )
      })

      console.log(productRet)

      console.log(productId)

      // 3.2 调用苹果支付
      const username = AV.User.current().getUsername()
      const paymentRet = await uni.requestPayment({
        provider: iapChannel.id,
        orderInfo: {
          productid: productId,
          username,
          manualFinishTransaction: true
        }
      })

      console.log(paymentRet)

      // console.log(paymentRet)

      // if (payError) {
      //   throw new Error('支付失败')
      // }

      // 支付后校验
      const request = new Request({ AV })
      const validRet = await request.onValidPayForVip({
        username,
        orderId: paymentRet.transactionIdentifier,
        signedPayload: paymentRet.transactionReceipt
      })

      console.log(validRet)

      // 3.3 支付成功,更新用户会员状态
      // const user = AV.User.current()
      // if (selectedVipType.value === 'forever') {
      //   user.set('isVip', true)
      //   user.set('vipExpireAt', null) // 永久会员
      // } else {
      //   user.set('isVip', true)
      //   const expireAt = new Date()
      //   expireAt.setMonth(expireAt.getMonth() + 1)
      //   user.set('vipExpireAt', expireAt)
      // }
      // await user.save()

      // 3.4 更新本地状态
      userInfoRef.value.isVip = true

      uni.showToast({
        title: '开通成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('支付失败:', error)
      uni.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      })
    } finally {
      uni.hideLoading()
    }
    // #endif

    // #ifndef APP-PLUS
    uni.showToast({
      title: '请在iOS APP内购买',
      icon: 'none'
    })
    // #endif
  } catch (error) {
    console.error('购买失败:', error)
    uni.showToast({
      title: error.message || '购买失败',
      icon: 'none'
    })
  }

  return Promise.resolve()
}

onLoad(() => {
  onCheckLoginStatus()
})
</script>

<style>
.card {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin: 20rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #666;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.avatar-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.avatar-tip {
  font-size: 24rpx;
  color: #999;
}

.password-section {
  margin-top: 20rpx;
}

.password-input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.input-placeholder {
  color: #999;
  font-size: 28rpx;
}

.change-password-btn {
  width: calc(100% - 32rpx);
  height: 80rpx;
  margin: 40rpx 16rpx 20rpx;
  background: #6200ee;
  color: #fff;
  font-size: 28rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn {
  width: calc(100% - 32rpx);
  height: 80rpx;
  margin: 20rpx 16rpx 80rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 28rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.vip-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.vip-price {
  display: flex;
  align-items: baseline;
}

.price-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #f5a623;
}

.price-unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 4rpx;
}

.vip-benefits {
  margin-bottom: 30rpx;
}

.benefit-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}

.vip-button {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #ffd700 0%, #f5a623 100%);
  color: #fff;
  font-size: 28rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* 登录注册相关样式 */
.auth-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 40rpx 30rpx;
  margin: 320rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.auth-input {
  width: 100%;
  height: 88rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.auth-button {
  width: 100%;
  height: 88rpx;
  background: #6200ee;
  color: #fff;
  font-size: 32rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
}

.auth-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}

.auth-link {
  font-size: 26rpx;
  color: #6200ee;
}

.input-placeholder {
  color: #999;
  font-size: 28rpx;
}

.vip-tips {
  font-size: 24rpx;
  color: #ff4d4f;
  padding: 16rpx 0;
  text-align: center;
}

.vip-options {
  margin: 20rpx 0;
}

.vip-option {
  position: relative;
  background: #f8f8f8;
  border-radius: 8rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vip-option:active {
  background: #f0f0f0;
}

.option-header {
  flex: 1;
}

.option-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.option-price {
  display: flex;
  align-items: baseline;
}

.price-number {
  font-size: 40rpx;
  font-weight: bold;
  color: #f5a623;
}

.price-unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 4rpx;
}

.option-selected {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #f5a623;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
}

.selected-icon {
  color: #fff;
  font-size: 24rpx;
}

.vip-benefits {
  margin: 30rpx 0 20rpx;
}

.benefit-item {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}
</style>
