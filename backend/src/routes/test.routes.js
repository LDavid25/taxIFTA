const express = require('express');
const router = express.Router();

console.log('Test routes module loaded');

// Test route
router.get('/test-endpoint', (req, res) => {
  console.log('GET /api/v1/test/test-endpoint called');
  res.json({
    status: 'success',
    message: 'Test endpoint works!',
    data: [
      { id: 1, name: 'Test Company 1' },
      { id: 2, name: 'Test Company 2' }
    ]
  });
});

module.exports = router;
