import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFunctionalQuerySegment,
  canReadPrivateCache,
  getAuthUserIdFromProfile,
  getPrivateResourceIdentifier,
  isPrivateCacheRoute,
} from '../server/utils/privateCacheKey.js'

test('private routes require auth scope', () => {
  assert.equal(isPrivateCacheRoute('/api/v1/chat/private/conversations'), true)
  assert.equal(isPrivateCacheRoute('/api/v1/notifications'), true)
  assert.equal(isPrivateCacheRoute('/api/v1/blogs/general/public'), false)
})

test('stable user id extracted from profile id first', () => {
  assert.equal(getAuthUserIdFromProfile({ id: 42, username: 'alice' }), '42')
  assert.equal(getAuthUserIdFromProfile({ userId: 'u-1', username: 'alice' }), 'u-1')
  assert.equal(getAuthUserIdFromProfile({ username: 'alice' }), undefined)
})

test('functional parameters are encoded in private identifier segment', () => {
  assert.equal(buildFunctionalQuerySegment({ page: 1, limit: 20, status: 'unread' }), 'limit=20&page=1&status=unread')
  assert.equal(buildFunctionalQuerySegment({}), 'default')
})

test('private identifiers follow expected naming', () => {
  assert.equal(getPrivateResourceIdentifier('/api/v1/profile'), 'profile')
  assert.equal(getPrivateResourceIdentifier('/api/v1/users/me/friends'), 'friends:list')
  assert.equal(getPrivateResourceIdentifier('/api/v1/users/me/applications'), 'applications:list')
  assert.equal(getPrivateResourceIdentifier('/api/v1/users/me/applications/latest'), 'applications:latest')
  assert.equal(getPrivateResourceIdentifier('/api/v1/users/me/friends/requests'), 'friends:requests:incoming')
  assert.equal(getPrivateResourceIdentifier('/api/v1/users/me/friends/requests/sent'), 'friends:requests:sent')
  assert.equal(getPrivateResourceIdentifier('/api/v1/users/me/friends/blocked'), 'friends:blocked')
  assert.equal(getPrivateResourceIdentifier('/api/v1/chat/private/conversations/conv-1'), 'conversation:conv-1')
  assert.equal(getPrivateResourceIdentifier('/api/v1/notifications'), 'notifications')
})

test('regression: user A cannot read user B private cache', () => {
  assert.equal(canReadPrivateCache('user-a', 'user-b'), false)
  assert.equal(canReadPrivateCache('user-a', 'user-a'), true)
})
