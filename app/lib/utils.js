export function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

export const freqMap = (arr) => {
  const map = {};
  arr.forEach((a) => {
    if (map[a]) {
      map[a]++;
    } else {
      map[a] = 1;
    }
  });
  return map;
};
