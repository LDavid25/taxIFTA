// Clear Node.js module cache
Object.keys(require.cache).forEach(function(key) {
  delete require.cache[key];
});
console.log('Node.js module cache cleared successfully!');
