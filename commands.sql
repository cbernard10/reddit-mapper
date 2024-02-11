select name from subreddits where name like '%rugby%' order by name asc;

select users.id as uid, users.name as uname, subreddits.name as r from users left join user_subreddits on users.id=user_subreddits.user_id left join subreddits on user_subreddits.subreddit_id=subreddits.id where users.name='spez' order by subreddits.name
