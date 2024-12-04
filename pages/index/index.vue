<template>
  <view class="page">
    <!-- 内容列表区域 -->
    <scroll-view
      class="post-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshingRef"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMorePosts">
      <!-- 列表为空时的提示 -->
      <view class="empty-tip" v-if="postsRef.length === 0">
        <text>暂无内容</text>
      </view>

      <view
        class="post-item"
        v-for="post in postsRef"
        :key="post.id"
        @click="onViewPost({ objectId: post.id })">
        <text class="post-content">{{ post.content }}</text>
        <view class="post-meta">
          <text class="post-date">{{ post.date }}</text>
          <text class="post-author">{{ post.author }}</text>
          <view class="post-comments">
            <image src="/static/icons/comment.png" class="comment-icon"></image>
            <text class="comment-count">{{ post.commentCount }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="postsRef.length > 0">
        <text>{{ hasMoreRef ? '正在加载更多...' : '没有更多了' }}</text>
      </view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab-button" @click="onShowPostDialog">
      <text class="fab-icon">+</text>
    </view>

    <!-- 发帖弹窗 -->
    <view v-if="showPostDialogRef" class="post-dialog-mask" @click="onClosePostDialog">
      <view class="post-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">发布新帖子</text>
          <text class="dialog-close" @click="onClosePostDialog">×</text>
        </view>
        <view class="dialog-content">
          <textarea
            class="post-textarea"
            v-model="postContentRef"
            placeholder="请输入内容(不超过500字)"
            :maxlength="500"
            auto-height
          />
          <text class="word-count">{{ postContentRef.length }}/500</text>
        </view>
        <view class="dialog-footer">
          <button
            class="submit-btn"
            :disabled="isPostingRef"
            :loading="isPostingRef"
            @click="onSubmitPost">
            发布
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import {
    ref
  } from 'vue'
  import {
    onLoad
  } from '@dcloudio/uni-app'
  import Request from '@/static/scripts/request.js'

  const AV = getApp().globalData.AV
  // 实例化Request
  const request = new Request({ AV })

  const postsRef = ref([])
  const pageRef = ref(1)
  const limitRef = ref(10)
  const isLoadingRef = ref(false)
  const isRefreshingRef = ref(false)
  const hasMoreRef = ref(true)

  // 发帖相关
  const showPostDialogRef = ref(false)
  const postContentRef = ref('')
  const isPostingRef = ref(false)

  // 获取帖子列表
  async function onLoadPosts({
    page = 1
  }) {
    if (isLoadingRef.value || (!hasMoreRef.value && page > 1)) return Promise.resolve()

    isLoadingRef.value = true
    try {
      const query = new AV.Query('Post')
      // 关联查询帖子作者
      query.include('author')
      // 按创建时间倒序
      query.descending('createdAt')
      // 分页
      query.limit(limitRef.value)
      query.skip((page - 1) * limitRef.value)

      const posts = await query.find()
      // 将 LeanCloud 对象转换为普通对象
      const results = posts.map(post => {
        const author = post.get('author')
        return {
          id: post.id,
          content: post.get('content'),
          date: post.get('createdAt').toLocaleString(),
          author: author ? author.get('username') : '匿名用户',
          commentCount: post.get('commentCount') || 0
        }
      })

      // console.log(results)
      if (page === 1) {
        postsRef.value = results
      } else {
        postsRef.value.push(...results)
      }

      // 判断是否还有更多数据
      hasMoreRef.value = results.length === limitRef.value
      pageRef.value = page
    } catch (error) {
      console.error('获取帖子列表失败:', error)
      uni.showToast({
        title: '获取帖子列表失败',
        icon: 'none'
      })
    } finally {
      isLoadingRef.value = false
    }
    return Promise.resolve()
  }

  // 刷新列表
  async function onRefresh() {
    isRefreshingRef.value = true
    pageRef.value = 1
    hasMoreRef.value = true
    await onLoadPosts({ page: 1 })
    isRefreshingRef.value = false
    return Promise.resolve()
  }

  function onLoadMorePosts() {
    return onLoadPosts({
      page: pageRef.value + 1
    })
  }

  // 显示发帖弹窗
  function onShowPostDialog() {
    // 检查登录状态
    const currentUser = AV.User.current()
    if (!currentUser) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      uni.navigateTo({
        url: '/pages/my/my'
      })
      return Promise.resolve()
    }

    showPostDialogRef.value = true
    return Promise.resolve()
  }

  // 关闭发帖弹窗
  function onClosePostDialog() {
    showPostDialogRef.value = false
    postContentRef.value = ''
    return Promise.resolve()
  }

  // 发送帖子
  async function onSubmitPost() {
    if (!postContentRef.value.trim()) {
      uni.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return Promise.resolve()
    }

    if (postContentRef.value.length > 500) {
      uni.showToast({
        title: '内容不能超过500字',
        icon: 'none'
      })
      return Promise.resolve()
    }

    isPostingRef.value = true
    try {
      await request.onCreate({
        content: postContentRef.value.trim()
      })

      // 关闭弹窗
      onClosePostDialog()

      // 刷新列表
      await onRefresh()

      uni.showToast({
        title: '发布成功',
        icon: 'success'
      })
    } catch (error) {
      uni.showToast({
        title: error.message || '发布失败',
        icon: 'none'
      })
    } finally {
      isPostingRef.value = false
    }
    return Promise.resolve()
  }

  function onViewPost({ objectId }) {
    uni.navigateTo({
      url: `/pages/post-detail/post-detail?objectId=${objectId}`
    })
    return Promise.resolve()
  }

  // 页面加载时获取帖子列表
  onLoad(() => {
    onLoadPosts({
      page: 1
    })
  })
</script>

<style scoped>
  .post-list {
    height: 100%;
  }

  .post-item {
    background: #fff;
    border-radius: 12rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    width: calc(100% - 32rpx);
    margin: 0 auto 16rpx;
  }

  .post-content {
    font-size: 28rpx;
    color: #333;
    line-height: 1.6;
  }

  .post-meta {
    margin-top: 20rpx;
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #999;
  }

  .post-date {
    margin-right: 20rpx;
  }

  .post-author {
    margin-right: 20rpx;
  }

  .post-comments {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .comment-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: 8rpx;
  }

  .fab-button {
    position: fixed;
    right: 40rpx;
    bottom: 120rpx;
    width: 100rpx;
    height: 100rpx;
    background: #6200ee;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(98, 0, 238, 0.3);
  }

  .fab-icon {
    color: #fff;
    font-size: 60rpx;
  }

  /* 空列表提示 */
  .empty-tip {
    padding: 40rpx 0;
    text-align: center;
    color: #999;
    font-size: 28rpx;
  }

  /* 加载更多提示 */
  .loading-more {
    padding: 20rpx 0;
    text-align: center;
    color: #999;
    font-size: 24rpx;
  }

  /* 发帖弹窗样式 */
  .post-dialog-mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .post-dialog {
    width: 600rpx;
    background: #fff;
    border-radius: 12rpx;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  .dialog-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }

  .dialog-close {
    font-size: 48rpx;
    color: #999;
    line-height: 1;
  }

  .dialog-content {
    padding: 30rpx;
  }

  .post-textarea {
    width: 100%;
    min-height: 240rpx;
    font-size: 28rpx;
    line-height: 1.6;
    color: #333;
  }

  .word-count {
    text-align: right;
    font-size: 24rpx;
    color: #999;
    margin-top: 16rpx;
  }

  .dialog-footer {
    padding: 20rpx 30rpx;
    border-top: 1rpx solid #f0f0f0;
  }

  .submit-btn {
    width: 100%;
    height: 80rpx;
    background: #6200ee;
    color: #fff;
    font-size: 28rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .submit-btn[disabled] {
    opacity: 0.6;
  }
</style>