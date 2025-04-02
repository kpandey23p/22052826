const express = require('express');
const axios = require('axios');
const app = express();
const port = 9877; 

// Configuration
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/evaluation-service';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNjAyNjA0LCJpYXQiOjE3NDM2MDIzMDQsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc2ZGVhNTg4LTI2YzgtNDQ0YS1iZWFkLTAwYTgzN2Y4NmUzMSIsInN1YiI6InBhbmRleWt1c2hhZ3JhMzNAZ21haWwuY29tIn0sImVtYWlsIjoicGFuZGV5a3VzaGFncmEzM0BnbWFpbC5jb20iLCJuYW1lIjoia3VzaGFncmEgZHV0dCBwYW5kZXkiLCJyb2xsTm8iOiIyMjA1MjgyNiIsImFjY2Vzc0NvZGUiOiJud3B3cloiLCJjbGllbnRJRCI6Ijc2ZGVhNTg4LTI2YzgtNDQ0YS1iZWFkLTAwYTgzN2Y4NmUzMSIsImNsaWVudFNlY3JldCI6InhOTlJWdk50ZVFZa3lGVnYifQ.AZTJdxCx_9ndrb4saoVGKEr52lghM9XsZbFKvy9BbLA'; 
const TIMEOUT_MS = 500; // Max 500ms response time

// In-memory storage 
let usersCache = {};
let postsCache = [];
let commentsCache = {};

// Helper function to fetch data from test server
async function fetchFromTestServer(endpoint) {
  try {
    const response = await axios.get(`${TEST_SERVER_BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      timeout: TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    throw new Error('Test server unavailable');
  }
}

// Fetch and cache all users
async function updateUsersCache() {
  const data = await fetchFromTestServer('/users');
  usersCache = data.users || {};
}

// Fetch posts for a user and update cache
async function fetchUserPosts(userId) {
  const data = await fetchFromTestServer(`/users/${userId}/posts`);
  const posts = data.posts || [];
  posts.forEach(post => {
    const existingPost = postsCache.find(p => p.id === post.id);
    if (!existingPost) postsCache.push(post);
  });
  return posts;
}

// Fetch comments for a post and update cache
async function fetchPostComments(postId) {
  if (!commentsCache[postId]) {
    const data = await fetchFromTestServer(`/posts/${postId}/comments`);
    commentsCache[postId] = data.comments || [];
  }
  return commentsCache[postId];
}

// Top Users API
app.get('/users', async (req, res) => {
  try {
    // Update users cache
    await updateUsersCache();

    // Fetch posts for all users and count them
    const userPostCounts = {};
    for (const userId in usersCache) {
      const posts = await fetchUserPosts(userId);
      userPostCounts[userId] = posts.length;
    }

    // Sort users by post count and get top 5
    const topUsers = Object.entries(userPostCounts)
      .sort((a, b) => b[1] - a[1]) // Descending order
      .slice(0, 5)
      .map(([userId, postCount]) => ({
        userId,
        name: usersCache[userId],
        postCount
      }));

    res.json({ topUsers });
  } catch (error) {
    res.status(503).json({ error: 'Failed to fetch data from test server' });
  }
});

// Top/Latest Posts API
app.get('/posts', async (req, res) => {
  const type = req.query.type || 'latest';
  if (!['latest', 'popular'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Use "latest" or "popular".' });
  }

  try {
    // Ensure we have some posts
    if (postsCache.length === 0) {
      await updateUsersCache();
      for (const userId in usersCache) {
        await fetchUserPosts(userId);
      }
    }

    if (type === 'latest') {
      // Sort by post ID (assuming higher ID = newer) and get latest 5
      const latestPosts = [...postsCache]
        .sort((a, b) => b.id - a.id) // Descending order
        .slice(0, 5)
        .map(post => ({
          id: post.id,
          userId: post.userid,
          content: post.content
        }));
      res.json({ posts: latestPosts });
    } else if (type === 'popular') {
      // Fetch comments for all posts and find max comment count
      const postCommentCounts = {};
      for (const post of postsCache) {
        const comments = await fetchPostComments(post.id);
        postCommentCounts[post.id] = comments.length;
      }

      // Find max comment count
      const maxComments = Math.max(...Object.values(postCommentCounts));
      const popularPosts = postsCache
        .filter(post => postCommentCounts[post.id] === maxComments)
        .map(post => ({
          id: post.id,
          userId: post.userid,
          content: post.content,
          commentCount: maxComments
        }));

      res.json({ posts: popularPosts });
    }
  } catch (error) {
    res.status(503).json({ error: 'Failed to fetch data from test server' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Social Media Analytics Microservice running on http://localhost:${port}`);
});