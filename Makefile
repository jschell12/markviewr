.PHONY: install up down build

install:
	npm install

up:
	npm start

down:
	@pkill -f "electron ." 2>/dev/null && echo "markviewr stopped." || echo "markviewr is not running."

build:
	npm run build
