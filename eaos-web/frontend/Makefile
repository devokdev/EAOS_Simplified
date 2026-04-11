# OClario Frontend Makefile

# Configuration
NODE_BIN = node_modules/.bin
VITE = $(NODE_BIN)/vite
FIX_SCRIPT = fix.js

.PHONY: all install fix build clean help

# Default target
all: install fix build

install:
	@echo "Installing dependencies..."
	npm install

fix:
	@echo "Running source code fixes..."
	node $(FIX_SCRIPT)

build:
	@echo "Building frontend for production..."
	$(VITE) build

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist

help:
	@echo "OClario Frontend Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all     - Install, fix, and build (default)"
	@echo "  install - Install npm dependencies"
	@echo "  fix     - Run fix.js to patch source files"
	@echo "  build   - Run vite build"
	@echo "  clean   - Remove dist directory"
	@echo "  help    - Show this help message"
