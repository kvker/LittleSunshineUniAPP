export default class Request {
  hostname = 'http://localhost:13000'

  constructor({
    AV
  }) {
    this.AV = AV
  }

  onRequest(url, params) {
    return fetch(this.hostname + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LC-Session': this.AV.User.current().getSessionToken()
      },
      body: JSON.stringify(params)
    })
  }

  async onCreate(params) {
    try {
      const response = await this.onRequest('/api/post/create', params)
      if (!response.ok) {
        const error = await response.json()
        return Promise.reject(error)
      }
      return response.json()
    } catch (error) {
      console.error('创建帖子失败:', error)
      return Promise.reject(error)
    }
  }

  /**
   * 创建评论
   * @param {Object} params - 创建评论参数
   * @param {string} params.content - 评论内容
   * @param {string} params.postId - 帖子ID
   * @returns {Promise<Comment>} 评论信息
   */
  async onCreate({
    content,
    postId
  }) {
    try {
      const response = await this.onRequest('/api/comment/create', {
        content,
        postId
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.reason || error.error || '回复失败')
      }

      return response.json()
    } catch (error) {
      console.error('创建评论失败:', error)
      return Promise.reject(error)
    }
  }
}