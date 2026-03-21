FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf-xlib-2.0-dev \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG CACHE_BUST=1
COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings.production
ENV PORT=8080

CMD sh -c "echo '[DEPLOY] version=2026-03-21-v3-chat-fix' && echo 'Starting on port $PORT' && python manage.py collectstatic --noinput && python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 --access-logfile - --error-logfile -"
