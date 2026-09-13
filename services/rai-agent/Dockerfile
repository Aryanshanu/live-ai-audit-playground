FROM python:3.11-slim

WORKDIR /app

# ModelScan and some ML libs need build tools for a subset of transitive
# dependencies even though modelscan itself is pure-Python-ish; keeping
# this minimal rather than pulling a full build-essential image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Fly.io/Railway both respect PORT via env; default to 8000 for local/VPS runs.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
