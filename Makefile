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
