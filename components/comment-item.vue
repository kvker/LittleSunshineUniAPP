<script setup>
/**
 * @typedef {Object} Props
 * @property {Object} comment - 评论对象
 * @property {Function} onClickPost - 点击评论时的回调,参数为 { objectId: string }
 */

/**
 * @type {Props}
 */
const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  onClickPost: {
    type: Function,
    required: true
  }
})
</script>

<template>
  <view
    class="comment-item"
    @click="props.onClickPost({ objectId: props.comment.postId })">
    <text class="comment-content">{{ props.comment.content }}</text>
    <view class="comment-meta">
      <text class="comment-date">{{ props.comment.date }}</text>
      <text class="comment-post-title">回复：{{ props.comment.postTitle }}</text>
    </view>
  </view>
</template>

<style>
.comment-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.comment-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.comment-meta {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
}

.comment-date {
  margin-right: 20rpx;
}

.comment-post-title {
  margin-left: auto;
  color: #666;
}
</style>