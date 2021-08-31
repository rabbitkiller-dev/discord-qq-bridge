function random(arr = []) {
  if (typeof arr === 'object' && arr.length > 0) {
    return arr[Math.floor(Math.random() * arr.length)];
  } else {
    return '';
  }
}

module.exports = {
  random
}