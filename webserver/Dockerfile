FROM python:3.6-stretch

RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    nano \
    sqlite3

ADD requirements.txt /tmp
RUN pip install -r /tmp/requirements.txt && pip install gunicorn

ADD . /app
WORKDIR /app

RUN mkdir -p /var/log/gunicorn
CMD [
    "/bin/bash",
    "-c",
    "gunicorn \
    --bind=0.0.0.0:8000 \
    main:app \
    --access-logfile /var/log/gunicorn/access.log \
    --log-file /var/log/gunicorn/server.log"
]