FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ /app/src

# We need this to run alembic
COPY alembic.ini /app/alembic.ini

# Set PYTHONPATH to include the src directory
ENV PYTHONPATH=/app/src

# Change working directory to src so imports work correctly
WORKDIR /app/src

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 