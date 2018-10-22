clean:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@

lint:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@

check:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@

fix-formatting:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@

publish:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@

update-package-locks:
	# Sigh, the sed for forcing https below is recommended by the npm registry team itself...
	# https://npm.community/t/some-packages-have-dist-tarball-as-http-and-not-https/285/13
	rm -rf services/node_modules/ services/package-lock.json && \
	rm -rf distribution/client/node_modules/ distribution/client/package-lock.json && \
	cd services/ &&	$(NODE) npm install && \
	sed -i 's/"resolved": "http:/"resolved": "https:/g' package-lock.json && \
	cd ../distribution/client && $(NODE) npm install && \
	sed -i 's/"resolved": "http:/"resolved": "https:/g' package-lock.json

npm-audit-fix:
	# Sigh, the sed for forcing https below is recommended by the npm registry team itself...
	# https://npm.community/t/some-packages-have-dist-tarball-as-http-and-not-https/285/13
	cd services/ &&	$(NODE) npm audit fix && \
	sed -i 's/"resolved": "http:/"resolved": "https:/g' package-lock.json && \
	cd ../distribution/client && $(NODE) npm audit fix && \
	sed -i 's/"resolved": "http:/"resolved": "https:/g' package-lock.json
