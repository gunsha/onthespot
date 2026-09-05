FROM python:3-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/venv/bin:$PATH" \
    ONTHESPOT_TMP_PATH="/tmp/onthespot"

SHELL ["/bin/bash", "-c"]

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv venv
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir --prefer-binary -r requirements.txt

COPY pyproject.toml setup.cfg ./
COPY src ./src
RUN pip install --no-cache-dir .

# Cleanup: remove caches, tests, and strip shared objects
RUN find /app/venv \
    \( -type d -name "__pycache__" -o -type d -name "tests" -o -type d -name "test" \) \
    -exec rm -rf {} + \
    && find /app/venv -type f -name '*.pyc' -delete \
    && find /app/venv/lib -type f -name '*.so' -exec strip --strip-unneeded {} + || true


FROM base AS runtime

COPY --from=builder /app/venv /app/venv

# Staging dir for in-progress downloads. Finished files are moved to the
# mounted Music/Videos volumes only after download + conversion. Keep this
# path inside the container (do not mount it) so partial files (.part/.ytdl,
# fragments) never appear in the download folders.
RUN mkdir -p /tmp/onthespot && chmod 1777 /tmp/onthespot

EXPOSE 5000
CMD ["onthespot-web", "--host", "0.0.0.0", "--port", "5000"]
