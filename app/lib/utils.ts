export function sleep(s: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

type FrequencyMap = { [key: string]: number };

export const userFrequencyMap = (array: string[]) => {
  const map: FrequencyMap = {};
  array.forEach((a) => {
    if (map[a]) {
      map[a]++;
    } else {
      map[a] = 1;
    }
  });
  return map;
};
