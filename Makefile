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

point-to-production: node_modules .husky
	export OGS_BACKEND=PRODUCTION && npm run dev

.husky: 
	npx husky install

node_modules: package.json
	npm ls yarn || npm install yarn
	yarn install

pretty prettier lint-fix:
	npm run prettier
	npm run lint:fix
	

analyze visualizer bundle-visualizer:
	npm run bundle-visualizer

test:
	npm run test

.PHONY: dev build test analyze pretty prettier lint-fix .husky visualizer bundle-visualizer

-include Makefile.production
