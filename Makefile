
all: check

check:
	$(MAKE) -C client $@
	$(MAKE) -C updatesrv $@
	$(MAKE) -C apps $@

clean:
	$(MAKE) -C client $@
	$(MAKE) -C apps $@


.PHONY: all check clean
