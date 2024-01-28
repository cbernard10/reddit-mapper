nohup docker exec -t $1 npm run server:start > server.log &
nohup docker exec -t $1 npm run scraper:start > scraper.log &