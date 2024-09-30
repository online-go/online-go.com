NODE_PATH:=node_modules:$(NODE_PATH)
PATH:=node_modules/.bin/:$(PATH)

dev: node_modules .husky
	npm run dev

.husky:
	npx husky install

node_modules: package.json
	npm ls yarn || npm install yarn
	npm run yarn install

pretty prettier lint-fix:
	npm run prettier
	npm run lint:fix

build:
	npm run yarn build

analyze:
	ANALYZE=true npm run analyze

test:
	npm run test

#NODE_PATH=$(NODE_PATH) PATH=$(PATH) PRODUCTION=true webpack --optimization-minimize --devtool=source-map --profile --json > analyze.json
#npm run webpack-bundle-analyzer dist/ analyze.json

.PHONY: dev build test analyze pretty prettier lint-fix .husky

-include Makefile.production
