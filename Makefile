.PHONY: install up down build install-app

install:
	npm install

up:
	npm start

down:
	@pkill -f "electron ." 2>/dev/null && echo "markviewr stopped." || echo "markviewr is not running."

build:
	npm run build

install-app: build
	@echo "Installing MarkViewr to /Applications..."
	@rm -rf /Applications/MarkViewr.app
	@cp -R dist/mac-arm64/MarkViewr.app /Applications/MarkViewr.app
	@echo "MarkViewr.app installed to /Applications."
	@if ! grep -q '# markviewr' ~/.zshrc 2>/dev/null; then \
		echo '' >> ~/.zshrc; \
		echo '# markviewr' >> ~/.zshrc; \
		echo 'markviewr() { open -a MarkViewr --args "$$(cd "$${1:-.}" && pwd)"; }' >> ~/.zshrc; \
		echo 'Shell function added to ~/.zshrc. Run: source ~/.zshrc'; \
	else \
		echo 'Shell function already in ~/.zshrc.'; \
	fi
	@echo "Done. Usage: markviewr ."
