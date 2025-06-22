# Audio Editor Backend

🎵 **FastAPI backend for the AI-powered audio segment editor with ElevenLabs integration**

## 🚀 Quick Start

### 1. Install Dependencies
```bash
make install-backend
```

### 2. Set Environment Variables
```bash
# Option 1: Export variables
export ELEVENLABS_API_KEY=your_api_key_here
export OPENAI_API_KEY=your_openai_key_here  # Optional
export VOICE_ID=your_preferred_voice_id_here  # Optional, defaults to Rachel

# Option 2: Create .env file
echo "ELEVENLABS_API_KEY=your_api_key_here" > .env
echo "OPENAI_API_KEY=your_openai_key_here" >> .env
echo "VOICE_ID=your_preferred_voice_id_here" >> .env
```

### 3. Start Backend
```bash
# Development mode (auto-reload)
make dev-backend

# Production mode
make start-backend
```

### 4. Test the API
```bash
# Run backend tests
cd src && python test_backend.py

# Or visit the interactive docs
open http://localhost:8000/docs
```

## 📋 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/docs` | Interactive API documentation |

### File Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload audio/video file |
| `GET` | `/waveform/{file_id}` | Generate waveform data |
| `GET` | `/download/{file_id}` | Download processed file |

### ElevenLabs Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/voices` | Get available TTS voices |
| `POST` | `/text-to-speech` | Generate TTS audio |

### Audio Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/replace-segment` | Replace audio segment |
| `POST` | `/video-audio-replace` | Replace audio in video |

## 🔧 API Usage Examples

### 1. Upload Audio File
```bash
curl -X POST "http://localhost:8000/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.mp3"
```

Response:
```json
{
  "file_id": "123e4567-e89b-12d3-a456-426614174000",
  "original_name": "audio.mp3",
  "duration": 45.2,
  "sample_rate": 44100
}
```

### 2. Get Available Voices
```bash
curl -X GET "http://localhost:8000/voices"
```

Response:
```json
{
  "voices": [
    {
      "voice_id": "nPczCjzI2devNBz1zQrb",
      "name": "Rachel",
      "category": "premade",
      "description": "Calm, young adult female"
    }
  ]
}
```

### 3. Generate TTS Audio
```bash
curl -X POST "http://localhost:8000/text-to-speech" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test message.",
    "voice_id": "nPczCjzI2devNBz1zQrb",
    "model_id": "eleven_multilingual_v2"
  }'
```

### 4. Replace Audio Segment
```bash
curl -X POST "http://localhost:8000/replace-segment" \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "original-file-id",
    "tts_id": "generated-tts-id",
    "start_time": 10.5,
    "end_time": 15.2
  }'
```

## 🏗️ Architecture

### Core Components

```
src/
├── main.py                 # FastAPI application
├── models.py              # Pydantic data models
├── audio_processor.py     # Audio processing logic
├── elevenlabs_service.py  # ElevenLabs API integration
├── config.py              # Configuration management
├── start_backend.py       # Server startup script
└── test_backend.py        # Backend testing
```

### Data Flow

1. **File Upload** → Store in `/uploads/` → Extract metadata
2. **Waveform Generation** → Process audio → Return visualization data
3. **TTS Generation** → ElevenLabs API → Store in `/temp/`
4. **Segment Replacement** → Combine audio segments → Store in `/outputs/`
5. **Download** → Serve processed file

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `VOICE_ID` | Preferred voice ID | Optional, defaults to Rachel |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `True` |
| `MAX_FILE_SIZE_MB` | Max upload size | `100` |

### Directory Structure

```
├── temp/          # Temporary files (TTS, metadata)
├── uploads/       # Uploaded files
├── outputs/       # Processed files
└── src/           # Source code
```

## 🧪 Testing

### Run All Tests
```bash
cd src && python test_backend.py
```

### Manual API Testing

1. **Health Check**
   ```bash
   curl http://localhost:8000/
   ```

2. **Test with Postman/Insomnia**
   - Import the OpenAPI spec from `/docs`
   - Test all endpoints interactively

3. **Frontend Integration**
   - Use the frontend to test full workflow
   - Check browser console for API errors

## 🐛 Troubleshooting

### Common Issues

1. **ElevenLabs API Errors**
   ```bash
   # Check API key
   echo $ELEVENLABS_API_KEY
   
   # Test API directly
   curl -H "xi-api-key: $ELEVENLABS_API_KEY" \
        https://api.elevenlabs.io/v1/voices
   ```

2. **MoviePy/FFmpeg Issues**
   ```bash
   # Install FFmpeg (macOS)
   brew install ffmpeg
   
   # Install FFmpeg (Ubuntu)
   sudo apt install ffmpeg
   ```

3. **Port Already in Use**
   ```bash
   # Kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   
   # Or use different port
   export PORT=8001
   ```

4. **Module Import Errors**
   ```bash
   # Check Python path
   cd src && python -c "import sys; print(sys.path)"
   
   # Reinstall dependencies
   make install-backend
   ```

### Debug Mode

Enable detailed logging:
```bash
export DEBUG=true
make dev-backend
```

## 📈 Performance

### Optimizations Implemented

- **Async Processing**: All I/O operations are async
- **File Streaming**: Large files handled efficiently
- **Error Handling**: Graceful degradation
- **Resource Cleanup**: Automatic cleanup of temp files

### Expected Performance

- **File Upload**: ~1-2s for 10MB files
- **Waveform Generation**: ~2-3s for 5-minute audio
- **TTS Generation**: ~3-5s for typical text
- **Segment Replacement**: ~2-4s for typical edits

## 🔐 Security

- **Input Validation**: All inputs validated
- **File Type Checking**: Only allowed formats accepted
- **API Key Protection**: Keys stored in environment
- **Temporary File Cleanup**: Regular cleanup of temp files

## 🚀 Deployment

### Local Development
```bash
make dev-backend  # Auto-reload enabled
```

### Production Deployment
```bash
# Option 1: Direct
make start-backend

# Option 2: Docker (TODO)
docker build -t audio-editor-backend .
docker run -p 8000:8000 audio-editor-backend

# Option 3: Cloud deployment
# Deploy to Heroku, Railway, or similar
```

## 📝 API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

## 🤝 Contributing

1. Follow existing code structure
2. Add type hints for all functions
3. Include docstrings for public methods
4. Test your changes with `test_backend.py`
5. Update this README if needed

## 📜 License

This project is part of the Audio Editor Web Tool hackathon implementation.

---

**🎉 Happy Coding!** For questions or issues, check the project documentation in `/docs/`. 