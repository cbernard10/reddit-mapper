nohup docker compose up --build > compose.log &
nohup docker exec -t $1 npm run server:start > server.log &
nohup docker exec -t $1 npm run scraper:start > scraper.log &
watch -n0 tail scraper.log