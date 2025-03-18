# Makefile for setting up media-ranking-api and media-ranking-frontend

.PHONY: all api frontend clean

create-cluster:
	./media-ranking-api/tools/create_cluster.sh

all-deps: api-deps frontend-deps

api-deps:
	cd media-ranking-api && npm install

frontend-deps:
	cd media-ranking-frontend && npm install

clean-deps:
	rm -rf media-ranking-api/node_modules media-ranking-frontend/node_modules

all-start: api-start frontend-start

api-start:
	cd media-ranking-api && npm run dev &

frontend-start:
	cd media-ranking-frontend && npm start &

stop-all:
	pkill -f "npm run dev" || true
	pkill -f "npm start" || true