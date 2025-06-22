import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message

logger = logging.getLogger("api.requests")

class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests and responses with detailed information.
    """
    
    def __init__(self, app, skip_paths=None):
        super().__init__(app)
        self.skip_paths = skip_paths or ["/health", "/docs", "/openapi.json", "/redoc"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID for tracing
        request_id = str(uuid.uuid4())[:8]
        
        # Skip logging for certain paths
        if request.url.path in self.skip_paths:
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        
        # Log request
        await self._log_request(request, request_id)
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Log response
            await self._log_response(request, response, request_id, process_time)
            
            # Add request ID to response headers for debugging
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed - ID: {request_id} | "
                f"Method: {request.method} | "
                f"Path: {request.url.path} | "
                f"Error: {str(e)} | "
                f"Duration: {process_time:.3f}s"
            )
            raise
    
    async def _log_request(self, request: Request, request_id: str):
        """Log incoming request details"""
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "Unknown")
        content_length = request.headers.get("content-length", "0")
        
        # Get query parameters
        query_params = str(request.query_params) if request.query_params else "None"
        
        logger.info(
            f"Request started - ID: {request_id} | "
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Client: {client_ip} | "
            f"UserAgent: {user_agent} | "
            f"ContentLength: {content_length} | "
            f"Query: {query_params}"
        )
    
    async def _log_response(self, request: Request, response: Response, request_id: str, process_time: float):
        """Log response details"""
        client_ip = self._get_client_ip(request)
        
        # Get response size if available
        response_size = response.headers.get("content-length", "Unknown")
        
        # Determine log level based on status code
        if response.status_code >= 500:
            log_level = logger.error
        elif response.status_code >= 400:
            log_level = logger.warning
        else:
            log_level = logger.info
        
        log_level(
            f"Request completed - ID: {request_id} | "
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Client: {client_ip} | "
            f"Status: {response.status_code} | "
            f"Duration: {process_time:.3f}s | "
            f"ResponseSize: {response_size}"
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address"""
        # Check for forwarded headers first (for load balancers/proxies)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        if request.client:
            return request.client.host
        
        return "Unknown"


class PerformanceLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log slow requests for performance monitoring.
    """
    
    def __init__(self, app, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Log slow requests
        if process_time > self.slow_request_threshold:
            logger.warning(
                f"Slow request detected - "
                f"Method: {request.method} | "
                f"Path: {request.url.path} | "
                f"Duration: {process_time:.3f}s | "
                f"Status: {response.status_code}"
            )
        
        return response 