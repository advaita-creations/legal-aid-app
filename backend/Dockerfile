FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings.production
ENV PORT=8080

CMD sh -c "echo 'Starting on port $PORT' && python manage.py collectstatic --noinput && python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 --access-logfile - --error-logfile -"
