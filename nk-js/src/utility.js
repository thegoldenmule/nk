export const blurOnEscape = evt => {
  if (evt.code === "Escape" && !evt.ctrlKey && !evt.metaKey) {
    evt.target.blur();
    return true;
  }

  return false;
};
