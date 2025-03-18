# Makefile for setting up media-ranking-api and media-ranking-frontend

.PHONY: all api frontend clean

create-cluster:
	./server/tools/create_cluster.sh

all-deps: api-deps frontend-deps

api-deps:
	cd server && npm install

frontend-deps:
	cd client && npm install

clean-deps:
	rm -rf server/node_modules client/node_modules

all-start: api-start frontend-start

api-start:
	cd server && npm run dev &

frontend-start:
	cd client && npm start &

stop-all:
	pkill -f "npm run dev" || true
	pkill -f "npm start" || true