clean:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@

lint:
	$(MAKE) -C distribution $@
	$(MAKE) -C services $@
