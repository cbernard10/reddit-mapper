Reddit crawler that builds a graph where node B is connected to node A if active users of A are also active users of B. Edges are weighed by the number of users active in both.

## Stack

TS + Puppeteer + Express + Postgres + Docker

## Run the app 
### prod
Install docker and [docker compose](https://github.com/docker/compose)

`docker compose up --build`

`docker exec -it <id> bash` (find the id with `docker ps`)

In docker:

`npm run server:start`
  
`npm run scraper:start`

List of subreddits: http://localhost:3001/r

List of users: http://localhost:3001/u

List of connections: http://localhost:3001/connections

List of subreddits B connected to A: http://localhost:3001/overlaps/:subreddit_A

### dev
(Tested on archlinux, might not work on all systems)

Install chrome and chromedriver

Start a postgres instance in docker

`docker run --name <name> -e POSTGRES_PASSWORD=reddit -d postgres`

`docker start <name>`

`npm i`

`npm run server:start:dev`

`npm run scraper:start:dev`

#### notes

- On raspberry pi: set environment variable ARCH to "arm", and use Dockerfile.arm to build the app.

- Can be run in the background with `nohup docker exec -t <id> npm run server:start > server.out &` and `nohup docker exec -t <id> npm run scraper:start > scraper.out &`

- The app uses a fake user agent to prevent the headless browser from being blocked. 
