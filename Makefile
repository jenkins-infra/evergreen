

all: check

check:
	$(MAKE) -C updatesrv $@
	$(MAKE) -C apps $@

clean:
	$(MAKE) -C apps $@


.PHONY: all check clean
