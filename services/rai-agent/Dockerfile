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

# Any host that assigns PORT (Coolify, Fly.io, Railway) correctly
# overrides this default - verified directly (not assumed): a runtime-
# injected PORT=45678 correctly took precedence over this ENV default
# in a real test. The ${PORT:-8000} form below additionally survives
# the narrow edge case of a host injecting an explicitly EMPTY PORT
# string (not unset, just empty) - confirmed that case actually breaks
# without this fallback, low-probability but zero-cost to guard against.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
