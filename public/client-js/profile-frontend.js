onload = function() {
  registerButton = document.getElementById('pass-button');
  p1 = document.getElementById('npass');
  p2 = document.getElementById('npassc');
  document.addEventListener('keyup', logKey);
  /**
   * disables button when passwords dont match
   * @param {event} e
   */
  function logKey(e) {
    if (p1.value != p2.value) {
      const b = document.getElementById('pass-button');
      b.disabled = true;
      b.value = 'Passwords must match';
      b.classList = 'btn btn-danger btn-sm';
    } else {
      const b = document.getElementById('pass-button');
      b.disabled = false;
      b.value = 'Register';
      b.classList = 'btn btn-primary btn-sm';
    }
  }
};
