Self-hosted app that answers the question "which active users of subreddit A are also active users of subreddit B?".

Data is fetched by a web crawler that scrapes random subreddits (r/random) and saves the subreddit names and the active users in a postgres database. 
The data can be viewed as a graph where the nodes are the subreddit names, and the edges are weighed according to the number of users active in both nodes.


### prod
Install docker and [docker compose](https://github.com/docker/compose)

`docker compose up --build`

`docker exec -it <id> bash` (find the id with `docker ps`)

In docker:

`npm run server:start`
  
`npm run scraper:start`

List of subreddits: http://localhost:3001/api/subreddits

List of users: http://localhost:3001/api/users

List of connections: http://localhost:3001/api/connections

List of subreddits B connected to A: http://localhost:3001/api/connections/:subreddit_A

### dev
(Tested on archlinux, might not work on all systems)

Install chrome and chromedriver

Start a postgres instance in docker

`docker run --name <name> -e POSTGRES_PASSWORD=reddit -d postgres`

`npm i`

`npm run server:start:dev`

`npm run scraper:start:dev`

#### notes

- On a raspberry pi: set environment variable ARCH to "arm", and use Dockerfile.arm to build the app.

- Can be run in the background with `nohup docker exec -t <id> npm run server:start > server.out &` and `nohup docker exec -t <id> npm run scraper:start > scraper.out &`

- It might take a few hours to fill the database with enough data to get overlapping subreddits.

- By default, the app only finds active users in the first page of each subreddit (~26-27 threads). To find users in the first 1000 threads, change `crawlAndFillDatabase()` to `crawlAndFillDatabase(true)` in `index.ts`.

- There is a one second pause between each request to prevent an HTTP 429 error.

- The app uses a fake user agent to prevent the headless browser from being blocked. 
