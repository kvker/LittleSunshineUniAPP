<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CommentItem from '@/components/comment-item.vue'
import Request from '@/static/scripts/request.js'

const AV = getApp().globalData.AV
const postRef = ref(null)
const commentsRef = ref([])
const commentContentRef = ref('')
const pageRef = ref(1)
const limitRef = ref(10)
const isLoadingRef = ref(false)
const isInitLoadingRef = ref(true)
const isRefreshingRef = ref(false)
const hasMoreRef = ref(true)
const objectIdRef = ref('')
const isSubmittingRef = ref(false)

// 实例化Request
const request = new Request({ AV })

// 获取帖子详情
async function onLoadPostDetail() {
  try {
    const query = new AV.Query('Post')
    query.include('author')
    const post = await query.get(objectIdRef.value)
    const author = post.get('author')

    postRef.value = {
      id: post.id,
      content: post.get('content'),
      date: post.get('createdAt').toLocaleString(),
      author: author ? author.get('username') : '匿名用户',
      commentCount: post.get('commentCount') || 0
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    uni.showToast({
      title: '获取帖子详情失败',
      icon: 'none'
    })
  }
  return Promise.resolve()
}

// 初始化加载
async function onInitLoad() {
  try {
    await Promise.all([onLoadPostDetail(), onLoadComments({ page: 1 })])
  } finally {
    isInitLoadingRef.value = false
  }
  return Promise.resolve()
}

// 获取评论列表
async function onLoadComments({ page = 1 }) {
  if (isLoadingRef.value || (!hasMoreRef.value && page > 1)) return Promise.resolve()

  isLoadingRef.value = true
  try {
    const query = new AV.Query('Comment')
    query.equalTo('postRef', AV.Object.createWithoutData('Post', objectIdRef.value))
    query.include('author')
    query.descending('createdAt')
    query.limit(limitRef.value)
    query.skip((page - 1) * limitRef.value)

    const comments = await query.find()
    const results = comments.map((comment) => {
      const author = comment.get('author')
      return {
        id: comment.id,
        content: comment.get('content'),
        date: comment.get('createdAt').toLocaleString(),
        author: author ? author.get('username') : '匿名用户'
      }
    })

    if (page === 1) {
      commentsRef.value = results
    } else {
      commentsRef.value.push(...results)
    }

    hasMoreRef.value = results.length === limitRef.value
    pageRef.value = page
  } catch (error) {
    console.error('获取评论列表失败:', error)
    uni.showToast({
      title: '获取评论列表失败',
      icon: 'none'
    })
  } finally {
    isLoadingRef.value = false
  }
  return Promise.resolve()
}

// 发表评论
async function onSubmitComment() {
  if (isSubmittingRef.value) return Promise.resolve()

  if (!commentContentRef.value.trim()) {
    uni.showToast({
      title: '请输入评论内容',
      icon: 'none'
    })
    return Promise.resolve()
  }

  const currentUser = AV.User.current()
  if (!currentUser) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return Promise.resolve()
  }

  isSubmittingRef.value = true
  try {
    await request.onCreateComment({
      content: commentContentRef.value.trim(),
      postId: objectIdRef.value
    })

    // 重新加载评论列表
    commentContentRef.value = ''
    await onLoadPostDetail()
    await onLoadComments({ page: 1 })

    uni.showToast({
      title: '评论成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('发表评论失败:', error)
    uni.showToast({
      title: error.message || '发表评论失败',
      icon: 'none'
    })
  } finally {
    isSubmittingRef.value = false
  }
  return Promise.resolve()
}

// 刷新列表
async function onRefresh() {
  isRefreshingRef.value = true
  pageRef.value = 1
  hasMoreRef.value = true
  await onLoadPostDetail()
  await onLoadComments({ page: 1 })
  isRefreshingRef.value = false
  return Promise.resolve()
}

function onLoadMore() {
  return onLoadComments({ page: pageRef.value + 1 })
}

onLoad((options) => {
  if (options.objectId) {
    objectIdRef.value = options.objectId
    onInitLoad()
  }
})
</script>

<template>
  <view class="page">
    <!-- 初始加载状态 -->
    <view
      v-if="isInitLoadingRef"
      class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 内容区域 -->
    <template v-else>
      <!-- 帖子详情 -->
      <view
        v-if="postRef"
        class="post-card">
        <text class="post-content">{{ postRef.content }}</text>
        <view class="post-meta">
          <text class="post-author">{{ postRef.author }}</text>
          <text class="post-date">{{ postRef.date }}</text>
        </view>
      </view>

      <!-- 评论列表 -->
      <scroll-view
        class="comment-list"
        scroll-y
        refresher-enabled
        :refresher-triggered="isRefreshingRef"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore">
        <view class="comment-count">{{ postRef?.commentCount || 0 }}条评论</view>

        <!-- 列表为空时的提示 -->
        <view
          class="empty-tip"
          v-if="commentsRef.length === 0">
          <text>暂无评论</text>
        </view>

        <view
          class="comment-item"
          v-for="comment in commentsRef"
          :key="comment.id">
          <text class="comment-content">{{ comment.content }}</text>
          <view class="comment-meta">
            <text class="comment-author">{{ comment.author }}</text>
            <text class="comment-date">{{ comment.date }}</text>
          </view>
        </view>

        <!-- 加载更多提示 -->
        <view
          class="loading-more"
          v-if="commentsRef.length > 0">
          <text>{{ hasMoreRef ? '正在加载更多...' : '没有更多了' }}</text>
        </view>
      </scroll-view>

      <!-- 评论输入框 -->
      <view class="comment-input">
        <input
          class="input"
          type="text"
          v-model="commentContentRef"
          placeholder="写评论..."
          placeholder-class="input-placeholder"
          confirm-type="send"
          :disabled="isSubmittingRef"
          @confirm="onSubmitComment" />
        <button
          class="submit-btn"
          :disabled="isSubmittingRef"
          :loading="isSubmittingRef"
          @click="onSubmitComment">
          发送
        </button>
      </view>
    </template>
  </view>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f8f8;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 28rpx;
}

.post-card {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.post-content {
  font-size: 32rpx;
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

.post-author {
  margin-right: 20rpx;
}

.comment-list {
  flex: 1;
  padding: 0 30rpx 120rpx;
  box-sizing: border-box;
  height: calc(100vh - 200rpx);
}

.comment-count {
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
}

.comment-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.comment-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.comment-meta {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
}

.comment-author {
  margin-right: 20rpx;
}

.comment-input {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  margin-bottom: env(safe-area-inset-bottom);
}

.input {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-right: 20rpx;
}

.input[disabled] {
  opacity: 0.6;
}

.input-placeholder {
  color: #999;
}

.submit-btn {
  width: 160rpx;
  height: 72rpx;
  background: #6200ee;
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn[disabled] {
  opacity: 0.6;
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
</style>
