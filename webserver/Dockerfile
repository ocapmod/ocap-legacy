FROM python:3-slim

RUN apt-get update && apt-get install -y \
		libsqlite3-dev \
		curl \
		nano \
		nodejs \
		sqlite3

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
		apt-get install -y nodejs


ADD requirements.txt /tmp
RUN pip install -r /tmp/requirements.txt && pip install gevent gunicorn

RUN mkdir -p /var/log/gunicorn

ADD . /app
WORKDIR /app

RUN npm install && npm run build

CMD [ \
	"gunicorn", \
	"--bind=0.0.0.0:8000", \
	"--worker-class=gevent", \
	"main:app", \
	"--access-logfile /var/log/gunicorn/access.log", \
	"--log-file /var/log/gunicorn/server.log" \
]