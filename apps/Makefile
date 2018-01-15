SUBDIRS:=$(wildcard */.)

all: $(SUBDIRS)
check: $(SUBDIRS)
clean: $(SUBDIRS)

# Recurse into subdirectories and invoke the target
$(SUBDIRS):
	$(MAKE) -C $@


.PHONY: all check clean $(SUBDIRS)
