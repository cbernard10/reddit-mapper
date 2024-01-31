export type Config = {
  start: string;
  sleep_request: number;
  restart_every: number;
  deep: boolean;
};

export interface Thread {
  author: string;
  data: string;
  title: string;
  upvotes: string;
  thread: string;
  date: string;
}

export type ThreadComment = {
  first: string;
  author: string;
  upvotes: string;
};

export type UserComment = {
  inSubreddit: string;
  comment: string;
};
