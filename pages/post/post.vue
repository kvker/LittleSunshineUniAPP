<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CommentItem from '@/components/comment-item.vue'

const AV = getApp().globalData.AV
const activeTabRef = ref('posts')
const postsRef = ref([])
const commentsRef = ref([])
const pageRef = ref(1)
const limitRef = ref(10)
const isLoadingRef = ref(false)
const isRefreshingRef = ref(false)
const hasMoreRef = ref(true)

// 获取我的帖子列表
async function onLoadPosts({ page = 1 }) {
  if (isLoadingRef.value || (!hasMoreRef.value && page > 1)) return Promise.resolve()

  isLoadingRef.value = true
  try {
    const currentUser = AV.User.current()
    if (!currentUser) return Promise.resolve()

    const query = new AV.Query('Post')
    query.equalTo('author', currentUser)
    query.descending('createdAt')
    query.limit(limitRef.value)
    query.skip((page - 1) * limitRef.value)

    const posts = await query.find()
    const results = posts.map(post => ({
      id: post.id,
      content: post.get('content'),
      date: post.get('createdAt').toLocaleString(),
      commentCount: post.get('commentCount') || 0
    }))

    if (page === 1) {
      postsRef.value = results
    } else {
      postsRef.value.push(...results)
    }

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

// 获取我的评论列表
async function onLoadComments({ page = 1 }) {
  if (isLoadingRef.value || (!hasMoreRef.value && page > 1)) return Promise.resolve()

  isLoadingRef.value = true
  try {
    const currentUser = AV.User.current()
    if (!currentUser) return Promise.resolve()

    const query = new AV.Query('Comment')
    query.equalTo('author', currentUser)
    query.include('postRef')
    query.descending('createdAt')
    query.limit(limitRef.value)
    query.skip((page - 1) * limitRef.value)

    const comments = await query.find()
    const results = comments.map(comment => {
      const post = comment.get('postRef')
      return {
        id: comment.id,
        content: comment.get('content'),
        date: comment.get('createdAt').toLocaleString(),
        postId: post.id,
        postTitle: post.get('content')
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

// 刷新列表
async function onRefresh() {
  isRefreshingRef.value = true
  pageRef.value = 1
  hasMoreRef.value = true
  if (activeTabRef.value === 'posts') {
    await onLoadPosts({ page: 1 })
  } else {
    await onLoadComments({ page: 1 })
  }
  isRefreshingRef.value = false
  return Promise.resolve()
}

function onSwitchTab({ tab }) {
  activeTabRef.value = tab
  pageRef.value = 1
  hasMoreRef.value = true
  if (tab === 'posts') {
    onLoadPosts({ page: 1 })
  } else {
    onLoadComments({ page: 1 })
  }
  return Promise.resolve()
}

function onLoadMorePosts() {
  return onLoadPosts({ page: pageRef.value + 1 })
}

function onLoadMoreComments() {
  return onLoadComments({ page: pageRef.value + 1 })
}

function onViewPost({ objectId }) {
  uni.navigateTo({
    url: `/pages/post-detail/post-detail?objectId=${objectId}`
  })
  return Promise.resolve()
}

onLoad(() => {
  onLoadPosts({ page: 1 })
})
</script>

<template>
  <view class="page">
    <!-- 选项卡 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTabRef === 'posts' }"
        @click="onSwitchTab({ tab: 'posts' })">
        我的帖子
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTabRef === 'comments' }"
        @click="onSwitchTab({ tab: 'comments' })">
        我的评论
      </view>
    </view>

    <!-- 帖子列表 -->
    <scroll-view
      v-if="activeTabRef === 'posts'"
      class="content-list"
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
          <view class="post-comments">
            <image
              src="/static/icons/comment.png"
              class="comment-icon"></image>
            <text class="comment-count">{{ post.commentCount }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="postsRef.length > 0">
        <text>{{ hasMoreRef ? '正在加载更多...' : '没有更多了' }}</text>
      </view>
    </scroll-view>

    <!-- 评论列表 -->
    <scroll-view
      v-else
      class="content-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshingRef"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMoreComments">
      <!-- 列表为空时的提示 -->
      <view class="empty-tip" v-if="commentsRef.length === 0">
        <text>暂无内容</text>
      </view>

      <comment-item
        v-for="comment in commentsRef"
        :key="comment.id"
        :comment="comment"
        :onClickPost="onViewPost"
      />

      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="commentsRef.length > 0">
        <text>{{ hasMoreRef ? '正在加载更多...' : '没有更多了' }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<style>
.tabs {
  display: flex;
  background: #fff;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  position: relative;
  padding: 24rpx 0;
  margin-right: 48rpx;
  font-size: 28rpx;
  color: #999;
}

.tab-item.active {
  color: #333;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4rpx;
  background: #6200ee;
  border-radius: 2rpx;
}

.content-list {
  height: calc(100% - 81rpx);
  padding: 20rpx 16rpx;
}

.post-item,
.comment-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.post-content,
.comment-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.post-meta,
.comment-meta {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
}

.post-date,
.comment-date {
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

.comment-post-title {
  margin-left: auto;
  color: #666;
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