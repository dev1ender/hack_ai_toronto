# API Configuration

## Environment Variables

The frontend application uses the following environment variables for configuration:

### Required Variables

- `VITE_API_BASE_URL`: The base URL for the API server (default: `http://localhost:8000`)

### Optional Variables

- `VITE_ENABLE_ANALYTICS`: Enable analytics features (default: `false`)
- `VITE_DEV_MODE`: Enable development mode features (default: `true` in development)

## URL Handling

### Media URLs

The application automatically handles media URLs (videos, thumbnails) by:

1. **Relative Paths**: If the backend returns a relative path (e.g., `/uploads/video.mp4`), the frontend automatically prepends the API base URL
2. **Absolute URLs**: If the backend returns a full URL (e.g., `https://example.com/video.mp4`), it's used as-is
3. **Empty/Null Values**: Handled gracefully with fallback UI

### Configuration Files

- `src/lib/config.ts`: Centralized configuration management
- `src/lib/utils.ts`: URL utility functions
- `src/lib/api/client.ts`: API client with URL building capabilities

### Usage Examples

```typescript
import { buildMediaUrl } from '@/lib/utils';
import { config } from '@/lib/config';

// Build full URL from relative path
const fullUrl = buildMediaUrl('/uploads/video.mp4');
// Result: http://localhost:8000/uploads/video.mp4

// Handle absolute URLs
const absoluteUrl = buildMediaUrl('https://example.com/video.mp4');
// Result: https://example.com/video.mp4 (unchanged)
```

## Components Updated

The following components have been updated to use the new URL handling:

- `VideoPlayer.tsx`: Handles video and thumbnail URLs
- `ProjectCard.tsx`: Displays project thumbnails
- `Project.ts`: Type definitions with URL mapping

## Backend Integration

The backend should return relative paths for media files, which will be automatically converted to full URLs by the frontend. This allows for:

- Flexible deployment configurations
- Easy environment switching
- Proper URL handling in different deployment scenarios 