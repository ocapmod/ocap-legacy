FROM python:3-slim

RUN apt-get update && apt-get install -y \
		libsqlite3-dev \
		nano \
		sqlite3

ADD requirements.txt /tmp
RUN pip install -r /tmp/requirements.txt && pip install gevent gunicorn

RUN mkdir -p /var/log/gunicorn

ADD . /app
WORKDIR /app

CMD [ \
	"gunicorn", \
	"--bind=0.0.0.0:8000", \
	"--worker-class=gevent", \
	"main:app", \
	"--access-logfile /var/log/gunicorn/access.log", \
	"--log-file /var/log/gunicorn/server.log" \
]