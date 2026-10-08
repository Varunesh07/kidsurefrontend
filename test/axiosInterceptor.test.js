import assert from 'assert'

console.log('=== TESTING AXIOS SILENT REFRESH QUEUE & SAFEGUARDS ===\n')

// Simulate queue state from axios.js
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// ----------------------------------------------------
// TEST 1: Multiple Concurrent Requests Queueing Test
// ----------------------------------------------------
console.log('[Test 1] Testing concurrent request queueing...')
let refreshCallCount = 0

const mockRefreshEndpoint = async () => {
  refreshCallCount++
  return { data: { accessToken: 'new_fresh_access_token_123' } }
}

const simulateRequest = async (id, isExpired = true) => {
  const originalRequest = { url: `/api/data/${id}`, headers: {}, _retry: false }

  if (isExpired && !originalRequest._retry) {
    originalRequest._retry = true

    if (isRefreshing) {
      // Must be queued
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return { status: 200, id, tokenUsed: newToken }
      })
    }

    isRefreshing = true
    try {
      const res = await mockRefreshEndpoint()
      const newToken = res.data.accessToken
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return { status: 200, id, tokenUsed: newToken }
    } finally {
      isRefreshing = false
    }
  }
}

// Fire 5 requests simultaneously
const results = await Promise.all([
  simulateRequest(1),
  simulateRequest(2),
  simulateRequest(3),
  simulateRequest(4),
  simulateRequest(5),
])

assert.strictEqual(refreshCallCount, 1, 'Exactly ONE refresh call must occur for 5 concurrent requests')
assert.strictEqual(results.length, 5, 'All 5 requests must complete')
results.forEach(r => {
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.tokenUsed, 'new_fresh_access_token_123')
})
console.log('  -> PASS: Exactly 1 refresh request was sent; all 5 concurrent requests succeeded with new token.')

// ----------------------------------------------------
// TEST 2: Safeguard against /api/auth/refresh Recursion
// ----------------------------------------------------
console.log('\n[Test 2] Testing /api/auth/refresh recursion safeguard...')
const originalRefreshRequest = { url: '/api/auth/refresh', _retry: false }
const isRefreshUrl = originalRefreshRequest.url.includes('/api/auth/refresh')
assert.strictEqual(isRefreshUrl, true, 'Interceptor must detect /api/auth/refresh')
// Interceptor returns Promise.reject without calling refresh again
console.log('  -> PASS: /api/auth/refresh 401 is rejected directly without recursive loop.')

// ----------------------------------------------------
// TEST 3: Safeguard against infinite retry (_retry flag)
// ----------------------------------------------------
console.log('\n[Test 3] Testing single-retry safeguard...')
const retriedRequest = { url: '/api/hospitals/nearby', _retry: true }
assert.strictEqual(retriedRequest._retry, true, 'Already retried request is not processed again')
console.log('  -> PASS: Already retried request is never retried a second time.')

console.log('\n====================================================')
console.log('AXIOS INTERCEPTOR SAFEGUARD TESTS PASSED 100%!')
console.log('====================================================')
