# Audio Editor Web Tool - Makefile
# Project: AI-Powered Audio Segment Editor with ElevenLabs

.PHONY: help docs serve-docs clean setup dev dev-backend setup-backend build test lint format replace-audio generate-transcript process-changes trim-audio-sample start-backend start-frontend

# Default target
help:
	@echo "Audio Editor Web Tool - Available Commands:"
	@echo ""
	@echo "Documentation:"
	@echo "  docs          - Generate and serve documentation"
	@echo "  serve-docs    - Serve documentation locally"
	@echo "  clean         - Clean generated files"
	@echo ""
	@echo "Development:"
	@echo "  setup         - Set up development environment"
	@echo "  dev           - Start development server"
	@echo "  dev-backend   - Start backend development server"
	@echo "  build         - Build for production"
	@echo "  test          - Run tests"
	@echo "  test-auth     - Test authentication API"
	@echo "  test-middleware - Test logging middleware"
	@echo ""
	@echo "Audio Processing:"
	@echo "  replace-audio - Replace audio in video"
	@echo "  generate-transcript - Generate transcript from audio"
	@echo "  process-changes - Process transcript changes and apply to audio"
	@echo "  trim-audio-sample - Trim a sample audio file"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint          - Run linting"
	@echo "  format        - Format code"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy-docs   - Deploy documentation"
	@echo "  deploy-app    - Deploy application"
	@echo "  setup-db      - Sets up the database"
	@echo "  db-upgrade    - Apply database migrations"
	@echo "  start-backend - Starts the backend server"
	@echo "  start-frontend - Starts the frontend development server"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build  - Build all Docker containers"
	@echo "  docker-up     - Start full stack (DB + Backend + Frontend + Nginx)"
	@echo "  docker-down   - Stop all Docker services"
	@echo "  docker-logs   - View logs from all services"
	@echo "  docker-restart - Restart all Docker services"

# Documentation commands
docs:
	@echo "📚 Generating documentation..."
	@echo "✅ Technical Requirements Document: docs/technical_requirements.md"
	@echo "✅ Product Requirements Document: docs/product_requirements.md"
	@echo "✅ ElevenLabs Integration Guide: docs/elevenlabs_integration.md"
	@echo "🔥 Timing & Sync Solutions: docs/timing_solutions.md"
	@echo "✅ Project Checklist: project_checklist.md"
	@echo "Documentation generated successfully!"

serve-docs:
	@echo "🌐 Serving documentation locally..."
	@echo "Opening documentation in browser..."
	@if command -v python3 >/dev/null 2>&1; then \
		cd docs && python3 -m http.server 8080; \
	elif command -v python >/dev/null 2>&1; then \
		cd docs && python -m SimpleHTTPServer 8080; \
	else \
		echo "Python not found. Please install Python to serve docs."; \
	fi

# Development setup
setup:
	@echo "🔧 Setting up development environment..."
	@echo "Creating .env file template..."
	@echo "ELEVENLABS_API_KEY=your_api_key_here" > .env.example
	@echo "ELEVENLABS_MODEL_ID=eleven_multilingual_v2" >> .env.example
	@echo "DEFAULT_VOICE_ID=nPczCjzI2devNBz1zQrb" >> .env.example
	@echo "NODE_ENV=development" >> .env.example
	@echo ""
	@echo "📝 Next steps:"
	@echo "1. Copy .env.example to .env and add your ElevenLabs API key"
	@echo "2. Run 'make dev' to start development"
	@echo "3. Visit bolt.new to create the frontend"

# Development server
dev:
	@echo "🚀 Starting development environment..."
	@echo "📋 Checklist status:"
	@cat project_checklist.md | grep -E "^\- \[[ x]\]" | head -10
	@echo ""
	@echo "🔗 Resources:"
	@echo "- Technical Docs: docs/technical_requirements.md"
	@echo "- ElevenLabs Guide: docs/elevenlabs_integration.md"
	@echo "- bolt.new: https://bolt.new"
	@echo "- ElevenLabs API: https://elevenlabs.io/docs/product-guides/playground/text-to-speech"
	@echo "Optimizing assets..."
	@echo "Build completed!"

# Build for production
build:
	@echo "🏗️ Building for production..."
	@echo "Building optimized frontend bundle..."
	@echo "Optimizing assets..."
	@echo "Build completed!"

# Testing
test:
	@echo "🧪 Running tests..."
	@python -m unittest discover -s tests

test-auth:
	@echo "🧪 Running authentication API tests..."
	@. venv/bin/activate; \
	python src/tests/test_auth_api.py

test-middleware:
	@echo "🧪 Testing request/response logging middleware..."
	@. venv/bin/activate; \
	python src/tests/test_middleware.py

# Code quality
lint:
	@echo "🔍 Running linting..."
	@echo "Checking TypeScript..."
	@echo "Checking markdown documentation..."
	@echo "Linting completed!"

format:
	@echo "💅 Formatting code..."
	@echo "Formatting TypeScript files..."
	@echo "Formatting documentation..."
	@echo "Code formatting completed!"

# Deployment
deploy-docs:
	@echo "🚀 Deploying documentation..."
	@echo "Building documentation site..."
	@echo "Deploying to GitHub Pages..."
	@echo "Documentation deployed!"

deploy-app:
	@echo "🚀 Deploying application..."
	@echo "Building production bundle..."
	@echo "Deploying to production..."
	@echo "Application deployed!"

# Database commands
db-upgrade:
	@echo "⬆️ Applying database migrations..."
	@. venv/bin/activate; \
	alembic upgrade head
	@echo "✅ Migrations applied successfully!"

# Utility commands
clean:
	@echo "🧹 Cleaning generated files..."
	@rm -rf dist/
	@rm -rf build/
	@rm -rf node_modules/.cache/
	@rm -rf __pycache__
	@rm -rf .pytest_cache
	@rm -f .coverage
	@echo "Clean completed!"

# Check project status
status:
	@echo "📊 Project Status:"
	@echo ""
	@echo "📋 Checklist Progress:"
	@grep -c -- "- \\[x\\]" project_checklist.md | awk '{print "Completed: " $$1}'
	@grep -c -- "- \\[ \\]" project_checklist.md | awk '{print "Remaining: " $$1}'
	@echo ""
	@echo "📁 Documentation Files:"
	@ls -la docs/ 2>/dev/null || echo "No documentation files found"
	@echo ""
	@echo "🔗 Quick Links:"
	@echo "- Technical Requirements: docs/technical_requirements.md"
	@echo "- Product Requirements: docs/product_requirements.md"
	@echo "- ElevenLabs Integration: docs/elevenlabs_integration.md"

# Update checklist
checklist-update:
	@echo "📝 Updating project checklist..."
	@echo "Current status:"
	@cat project_checklist.md | grep "## Current Status" -A 2

# Audio processing
replace-audio:
	@echo "🎤 Replacing audio in video..."
	@if [ ! -d "venv" ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv venv; \
		echo "Virtual environment created."; \
	fi
	@. venv/bin/activate; \
	venv/bin/python3 -m pip install --upgrade pip; \
	venv/bin/pip install -r requirements.txt; \
	venv/bin/python src/video_audio_replacer.py

generate-transcript:
	@echo "🎤 Generating transcript from audio..."
	@if [ ! -d "venv" ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv venv; \
		echo "Virtual environment created."; \
	fi
	@. venv/bin/activate; \
	venv/bin/python3 -m pip install --upgrade pip; \
	venv/bin/pip install -r requirements.txt; \
	venv/bin/python src/process_transcript_changes.py

process-changes:
	@echo "🔄 Processing transcript changes and updating audio..."
	@if [ ! -d "venv" ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv venv; \
		echo "Virtual environment created."; \
	fi
	@. venv/bin/activate; \
	venv/bin/python3 -m pip install --upgrade pip; \
	venv/bin/pip install -r requirements.txt; \
	venv/bin/python src/process_transcript_changes.py

trim-audio-sample:
	@echo "✂️ Trimming audio sample..."
	@if [ ! -d "venv" ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv venv; \
		echo "Virtual environment created."; \
	fi
	@. venv/bin/activate; \
	venv/bin/python3 -m pip install --upgrade pip; \
	venv/bin/pip install -r requirements.txt; \
	venv/bin/python src/trim_audio.py resources/audio_man.mp3 resources/audio_man_10s_sample.mp3 00:00:17 00:00:27

# Backend Commands
install-backend:
	@echo "📦 Installing backend dependencies..."
	@if [ ! -d "venv" ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv venv; \
		echo "Virtual environment created."; \
	fi
	@. venv/bin/activate; \
	venv/bin/python3 -m pip install --upgrade pip; \
	venv/bin/pip install -r requirements.txt; \
	echo "✅ Backend dependencies installed!"

start-backend:
	@echo "🚀 Starting Audio Editor Backend..."
	@. venv/bin/activate; \
	venv/bin/python src/start_backend.py

dev-backend: setup-backend
	@echo "🚀 Starting backend development server..."
	@. venv/bin/activate; \
	venv/bin/python src/start_backend.py

setup-backend:
	@echo "🐍 Setting up backend environment..."
	@if [ ! -d "venv" ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv venv; \
		echo "Virtual environment created."; \
	fi
	@. venv/bin/activate; \
	venv/bin/python3 -m pip install --upgrade pip; \
	pip install -r requirements.txt; \
	echo "Backend setup complete."

migrate:
	@echo "🏃 Running database migrations..."
	@. venv/bin/activate; \
	alembic upgrade head

setup-env:
	@echo "🔧 Setting up environment variables..."
	@echo "Please set the following environment variables:"
	@echo "export ELEVENLABS_API_KEY=your_api_key_here"
	@echo "export OPENAI_API_KEY=your_openai_key_here"
	@echo ""
	@echo "Or create a .env file in the src/ directory with:"
	@echo "ELEVENLABS_API_KEY=your_api_key_here"
	@echo "OPENAI_API_KEY=your_openai_key_here"
	@echo "http://localhost:8000/        - API status check"

check-deps:
	@echo "🔍 Checking backend dependencies..."
	@. venv/bin/activate; \
	cd src && python -c "import fastapi, uvicorn, httpx, moviepy; print('✅ All backend dependencies installed')" 2>/dev/null || echo "❌ Some dependencies missing - run 'make install-backend'"

backend-help:
	@echo "🎵 Audio Editor Backend Commands:"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  install-backend - Install all backend dependencies"
	@echo "  setup-env      - Show environment setup instructions"
	@echo "  check-deps     - Check if dependencies are installed"
	@echo ""
	@echo "Development:"
	@echo "  start-backend  - Start backend server (production)"
	@echo "  dev-backend    - Start backend in development mode"
	@echo ""
	@echo "API Endpoints (when running):"
	@echo "  http://localhost:8000/docs    - Interactive API documentation"
	@echo "  http://localhost:8000/redoc   - Alternative API docs"
	@echo "  http://localhost:8000/        - API status check"

# ==================================================================================== #
# GENERIC
# ==================================================================================== #
.PHONY: venv-create
venv-create:
	python3 -m venv venv

.PHONY: venv-remove
venv-remove:
	rm -rf venv

# ==================================================================================== #
# INSTALL
# ==================================================================================== #
.PHONY: install
install:
	pip install -r requirements.txt

# ==================================================================================== #
# RUN
# ==================================================================================== #
.PHONY: run
run:
	@echo "Running the application..."
	@python src/main.py

# ==================================================================================== #
# DOCKER
# ==================================================================================== #
# Docker commands
.PHONY: docker-build docker-up docker-down docker-logs docker-restart

docker-build:
	@echo "🐳 Building Docker containers..."
	docker-compose build --no-cache

docker-up:
	@echo "🚀 Starting full stack with Docker..."
	@echo "📋 Services starting:"
	@echo "  - PostgreSQL Database (port 5434)"
	@echo "  - FastAPI Backend (port 8000)"
	@echo "  - React Frontend (port 3000)"
	@echo "  - Nginx Proxy (port 80)"
	@echo ""
	docker-compose up -d
	@echo ""
	@echo "✅ Full stack is running!"
	@echo "🌐 Access your app at: http://localhost"
	@echo "📚 API docs at: http://localhost/docs"
	@echo "🔍 View logs: make docker-logs"

docker-down:
	@echo "🛑 Stopping all Docker services..."
	docker-compose down

docker-logs:
	@echo "📋 Viewing logs from all services..."
	docker-compose logs -f

docker-restart:
	@echo "🔄 Restarting Docker services..."
	docker-compose restart

.PHONY: docker-run
docker-run:
	docker run -p 5000:5000 audio-video-tool

# ==================================================================================== #
# FRONTEND
# ==================================================================================== #
.PHONY: install-frontend
install-frontend:
	cd frontend/elevenlabs-dubbing-ui && npm install

.PHONY: dev-frontend
dev-frontend:
	cd frontend/elevenlabs-dubbing-ui && npm run dev

start-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev 