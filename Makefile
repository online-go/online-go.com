NODE_PATH:=node_modules:$(NODE_PATH)
PATH:=node_modules/.bin/:$(PATH)

dev: node_modules .husky
	npm run dev
	
build:
	npm run build

build-i18n:
	npm run build:i18n

local-dev: node_modules .husky
	export OGS_BACKEND=LOCAL && npm run dev

bot-dev: node_modules .husky
	OGS_BACKEND=LOCAL OGS_PORT=8085 npm run dev

point-to-production: node_modules .husky
	export OGS_BACKEND=PRODUCTION && npm run dev

stage1-dev: node_modules .husky
	export OGS_BACKEND=LOCAL OGS_PORT=8001 && npm run dev

stage2-dev: node_modules .husky
	export OGS_BACKEND=LOCAL OGS_PORT=8002 && npm run dev

.husky: 
	npx husky install

node_modules: package.json
	npm ls yarn || npm install yarn
	yarn install

pretty prettier lint-fix format:
	npm run prettier
	npm run lint:fix
	

analyze visualizer bundle-visualizer:
	npm run bundle-visualizer

test:
	npm run test

GOBAN_SOCKET_WORKER_VERSION=0.2
update-worker: build
	cp dist/modules/GobanSocketWorkerScript.js ../ogs-node/src/GobanSocketWorker/GobanSocketWorkerScript-$(GOBAN_SOCKET_WORKER_VERSION).js

.PHONY: dev build test analyze pretty prettier lint-fix .husky visualizer bundle-visualizer update-worker

-include Makefile.production
