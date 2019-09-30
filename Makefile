NODE_PATH:=node_modules:$(NODE_PATH)
PATH:=node_modules/.bin/:$(PATH)


dev: node_modules
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) supervisor -w Gulpfile.js,webpack.config.js,tsconfig.json supervisor -w Gulpfile.js -x gulp --

node_modules:
	npm install yarn
	npm install supervisor
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) yarn install

pretty prettier:
	npm run pretty
	sed -ir 's@[ ]+$$/@@' `find ./ -regex '.*\.\(ts\|tsx\|styl\|html\)'`


lint tslint:
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) tslint --project tsconfig.json

min: minjs mincss

mincss:
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) gulp min_styl
	@echo 'gzipped ogs.min.css: ' `gzip -9 dist/ogs.min.css -c | wc -c`

minjs:
	NODE_PATH=$(NODE_PATH) PATH=$(PATH) PRODUCTION=true webpack --optimize-minimize --devtool=source-map --display-modules
	@echo 'gzipped ogs.min.js: ' `gzip -9 dist/ogs.min.js -c | wc -c`
	@echo 'gzipped vendor.min.js: ' `gzip -9 dist/vendor.min.js -c | wc -c`

analyze:
	#NODE_PATH=$(NODE_PATH) PATH=$(PATH) PRODUCTION=true webpack --optimize-minimize --devtool=source-map --profile --json > analyze.json
	#npm run webpack-bundle-analyzer dist/ analyze.json
	npm run webpack-bundle-analyzer analyze.json dist/ 

.PHONY: dev lint tslint min minjs mincss

-include Makefile.production
